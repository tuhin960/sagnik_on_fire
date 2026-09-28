// FILE: src/firebase/firestore.js
//
// Adds: doctor specializations, emergency alerts (real-time), and a
// queue-based appointment/token system — all client-Firestore only,
// no backend endpoints needed.
//
// STEP 1 additions (bottom of file): request -> accept/reject flow,
// AI intake storage, My Patients link, consultation notes, and
// patient report uploads (stored inside Firestore — no Blaze plan needed).

import {
  addDoc, collection, doc, getDoc, getDocs, limit, onSnapshot,
  query, runTransaction, serverTimestamp, setDoc, updateDoc, where, writeBatch,
} from "firebase/firestore";
import { db } from "./config";

const VALID_ROLES = ["patient", "healthworker", "doctor", "pharmacy", "admin"];

export const DOCTOR_SPECIALIZATIONS = [
  "General Physician", "Cardiologist", "Pediatrician", "Gynecologist",
  "Orthopedic", "Dermatologist", "ENT Specialist", "Psychiatrist",
  "Neurologist", "General Surgeon",
];

// --- Demo credential whitelists (stand-in for a real registry) ---
const DOCTOR_VALID_REG_NOS = ["REG-2026-1001", "REG-2026-1002", "REG-2026-1003", "REG-2026-1004", "REG-2026-1005"];
const HEALTHWORKER_VALID_REG_NOS = ["HW-2026-2001", "HW-2026-2002", "HW-2026-2003", "HW-2026-2004", "HW-2026-2005"];
const PHARMACY_VALID_LICENSE_NOS = ["PHR-2026-3001", "PHR-2026-3002", "PHR-2026-3003", "PHR-2026-3004", "PHR-2026-3005"];

function matchWhitelist(input, list) {
  if (!input) return null;
  const cleaned = input.trim().toUpperCase();
  return list.find((v) => v.toUpperCase() === cleaned) || null;
}

function generateSpecialId(role) {
  const prefixes = { patient: "PAT-2026-" };
  const prefix = prefixes[role];
  if (!prefix) return null;
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${suffix}`;
}

export function validateSignupCredential(role, regNo) {
  if (role === "doctor" && !matchWhitelist(regNo, DOCTOR_VALID_REG_NOS)) {
    return "That doesn't match a valid Doctor registration number.";
  }
  if (role === "healthworker" && !matchWhitelist(regNo, HEALTHWORKER_VALID_REG_NOS)) {
    return "That doesn't match a valid ASHA / Health Worker registration number.";
  }
  if (role === "pharmacy" && !matchWhitelist(regNo, PHARMACY_VALID_LICENSE_NOS)) {
    return "That doesn't match a valid Pharmacy drug license number.";
  }
  return null;
}

export async function createUserProfile({ uid, name, email, mobile, role, regNo, specialization }) {
  if (!VALID_ROLES.includes(role) || role === "admin") {
    throw new Error("Signup cannot self-assign this role.");
  }

  let specialId;
  if (role === "doctor") {
    specialId = matchWhitelist(regNo, DOCTOR_VALID_REG_NOS);
    if (!specialId) throw new Error("That doesn't match a valid Doctor registration number.");
  } else if (role === "healthworker") {
    specialId = matchWhitelist(regNo, HEALTHWORKER_VALID_REG_NOS);
    if (!specialId) throw new Error("That doesn't match a valid ASHA / Health Worker registration number.");
  } else if (role === "pharmacy") {
    specialId = matchWhitelist(regNo, PHARMACY_VALID_LICENSE_NOS);
    if (!specialId) throw new Error("That doesn't match a valid Pharmacy drug license number.");
  } else {
    specialId = generateSpecialId(role); // patient
  }

  const profile = {
    uid, name, email, mobile, role, specialId,
    ...(role === "doctor" ? { specialization: specialization || "General Physician" } : {}),
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, "users", uid), profile);
  return profile;
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function getUserProfileByEmail(email, role) {
  if (!email) return null;
  const usersRef = collection(db, "users");
  const q = role
    ? query(usersRef, where("email", "==", email), where("role", "==", role), limit(1))
    : query(usersRef, where("email", "==", email), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data();
}

// --- Find Doctor ---
export async function listAllDoctors() {
  const q = query(collection(db, "users"), where("role", "==", "doctor"), limit(20));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

// ============================================================
// Medicine Availability (unchanged from before)
// ============================================================

const STALE_HOURS = 6;

export async function upsertMedicineStock({ pharmacyUid, pharmacyName, medicineName, quantity, price }) {
  const medicineNameLower = medicineName.trim().toLowerCase();
  const id = `${pharmacyUid}_${medicineNameLower.replace(/\s+/g, "-")}`;
  await setDoc(doc(db, "medicineStock", id), {
    pharmacyUid, pharmacyName, medicineName: medicineName.trim(), medicineNameLower,
    quantity: Number(quantity), price: Number(price), updatedAt: serverTimestamp(),
  });
}

export async function deleteMedicineStock(pharmacyUid, medicineName) {
  const medicineNameLower = medicineName.trim().toLowerCase();
  const id = `${pharmacyUid}_${medicineNameLower.replace(/\s+/g, "-")}`;
  await setDoc(doc(db, "medicineStock", id), { quantity: 0 }, { merge: true });
}

export async function getPharmacyStock(pharmacyUid) {
  const q = query(collection(db, "medicineStock"), where("pharmacyUid", "==", pharmacyUid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export async function searchMedicineAvailability(medicineName) {
  const term = medicineName.trim().toLowerCase();
  if (!term) return [];
  const q = query(collection(db, "medicineStock"), where("medicineNameLower", "==", term));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const updatedAtMs = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : null;
    const isStale = updatedAtMs ? Date.now() - updatedAtMs > STALE_HOURS * 60 * 60 * 1000 : true;
    return { ...data, isStale };
  });
}

// ============================================================
// Real-time listener helpers
// ============================================================
//
// NOTE: we deliberately do NOT use orderBy() together with where().
// That combination needs a Firestore composite index, and without it
// onSnapshot fails silently (pages stay on "Loading…" forever).
// Sorting is done in the browser instead — no index needed.

// serverTimestamp is null for a split second on the device that just
// wrote the doc, so fall back to "now".
function toMs(ts) {
  return ts?.toMillis ? ts.toMillis() : Date.now();
}

function listenAndSort(q, sorter, callback, onError, label) {
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort(sorter);
      callback(list);
    },
    (err) => {
      console.error(`${label} failed:`, err);
      if (onError) onError(err);
    }
  );
}

// ============================================================
// Emergency Alerts — real-time (Patient -> Doctor/Health Worker)
// ============================================================

export async function sendEmergencyAlert({ patientUid, patientName, patientId, message }) {
  await addDoc(collection(db, "alerts"), {
    patientUid, patientName, patientId,
    message: message || "Patient requested emergency help.",
    status: "open",
    createdAt: serverTimestamp(),
  });
}

// Call once, keep the returned unsubscribe function and call it on
// unmount (see useEffect cleanup in the page components).
export function listenToOpenAlerts(callback, onError) {
  const q = query(collection(db, "alerts"), where("status", "==", "open"));
  return listenAndSort(q, (a, b) => toMs(b.createdAt) - toMs(a.createdAt), callback, onError, "listenToOpenAlerts");
}

export function listenToPatientAlerts(patientUid, callback, onError) {
  const q = query(collection(db, "alerts"), where("patientUid", "==", patientUid));
  return listenAndSort(q, (a, b) => toMs(b.createdAt) - toMs(a.createdAt), callback, onError, "listenToPatientAlerts");
}

export async function acknowledgeAlert(alertId, acknowledgedByName) {
  await updateDoc(doc(db, "alerts", alertId), {
    status: "acknowledged",
    acknowledgedBy: acknowledgedByName,
    acknowledgedAt: serverTimestamp(),
  });
}

// ============================================================
// Appointments + queue-based token number
// ============================================================

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Atomic — uses a Firestore transaction, so two patients booking the
// exact same doctor at the exact same moment can never receive the
// same token number.
export async function bookAppointment({ doctorUid, doctorName, patientUid, patientName, patientId }) {
  const date = todayKey();
  const counterRef = doc(db, "tokenCounters", `${doctorUid}_${date}`);

  const tokenNumber = await runTransaction(db, async (tx) => {
    const counterSnap = await tx.get(counterRef);
    const next = (counterSnap.exists() ? counterSnap.data().count : 0) + 1;
    tx.set(counterRef, { count: next });
    return next;
  });

  const appointmentRef = await addDoc(collection(db, "appointments"), {
    doctorUid, doctorName, patientUid, patientName, patientId,
    tokenNumber, date, status: "waiting",
    createdAt: serverTimestamp(),
  });

  return { id: appointmentRef.id, tokenNumber };
}

export function listenToDoctorQueue(doctorUid, callback, onError) {
  const date = todayKey();
  const q = query(
    collection(db, "appointments"),
    where("doctorUid", "==", doctorUid),
    where("date", "==", date)
  );
  return listenAndSort(q, (a, b) => a.tokenNumber - b.tokenNumber, callback, onError, "listenToDoctorQueue");
}

export function listenToPatientAppointments(patientUid, callback, onError) {
  const q = query(collection(db, "appointments"), where("patientUid", "==", patientUid));
  return listenAndSort(q, (a, b) => toMs(b.createdAt) - toMs(a.createdAt), callback, onError, "listenToPatientAppointments");
}

export async function updateAppointmentStatus(appointmentId, status) {
  await updateDoc(doc(db, "appointments", appointmentId), { status });
}

// ============================================================
// STEP 1 — Request -> Accept/Reject flow (token only on accept)
// ============================================================
//
// Appointment status lifecycle:
//   requested -> waiting (doctor accepted, token assigned)
//             -> in-progress -> done
//   requested -> rejected
//
// Old pages that only look at "waiting" / "in-progress" / "done"
// keep working: "requested" and "rejected" appointments simply don't
// appear in the live queue.

// Patient sends a request. NO token yet. The AI intake (original
// text + English medical summary) is saved in intakes/{appointmentId}.
// `intake` shape:
//   { originalText, language, summary: { chiefComplaint, symptoms[],
//     duration, severity, redFlags[] }, consent: true }
export async function requestAppointment({
  doctorUid, doctorName, patientUid, patientName, patientId, intake,
}) {
  const date = todayKey();
  const appointmentRef = await addDoc(collection(db, "appointments"), {
    doctorUid, doctorName, patientUid, patientName, patientId,
    date, status: "requested", tokenNumber: null,
    hasIntake: !!intake,
    createdAt: serverTimestamp(),
  });

  if (intake) {
    await setDoc(doc(db, "intakes", appointmentRef.id), {
      appointmentId: appointmentRef.id,
      doctorUid, patientUid, patientName, patientId,
      originalText: intake.originalText || "",
      language: intake.language || "",
      summary: intake.summary || null,
      consent: intake.consent === true,
      createdAt: serverTimestamp(),
    });
  }
  return { id: appointmentRef.id };
}

// Doctor's Patient Requests page (real-time, oldest first).
export function listenToDoctorRequests(doctorUid, callback, onError) {
  const q = query(
    collection(db, "appointments"),
    where("doctorUid", "==", doctorUid),
    where("status", "==", "requested")
  );
  return listenAndSort(q, (a, b) => toMs(a.createdAt) - toMs(b.createdAt), callback, onError, "listenToDoctorRequests");
}

export async function getIntake(appointmentId) {
  const snap = await getDoc(doc(db, "intakes", appointmentId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// All intakes of one patient for this doctor (Patient Details page).
export async function getIntakesForDoctorPatient(doctorUid, patientUid) {
  const q = query(
    collection(db, "intakes"),
    where("doctorUid", "==", doctorUid),
    where("patientUid", "==", patientUid)
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
  return list;
}

// Doctor's daily accept-limit (stored on the doctor's own users doc).
export async function setDoctorDailyLimit(doctorUid, dailyLimit) {
  await updateDoc(doc(db, "users", doctorUid), { dailyLimit: Number(dailyLimit) });
}

// Accept = atomically: check daily limit, take next token number,
// flip status to "waiting", and create the doctor<->patient link
// (used for My Patients + privacy rules for reports).
export async function acceptAppointment({
  appointmentId, doctorUid, patientUid, patientName, patientId, dailyLimit,
}) {
  const date = todayKey();
  const counterRef = doc(db, "tokenCounters", `${doctorUid}_${date}`);
  const appointmentRef = doc(db, "appointments", appointmentId);
  const linkRef = doc(db, "doctorPatients", `${doctorUid}_${patientUid}`);

  const tokenNumber = await runTransaction(db, async (tx) => {
    const apptSnap = await tx.get(appointmentRef);
    if (!apptSnap.exists()) throw new Error("This request no longer exists.");
    if (apptSnap.data().status !== "requested") throw new Error("This request was already handled.");

    const counterSnap = await tx.get(counterRef);
    const current = counterSnap.exists() ? counterSnap.data().count : 0;
    if (dailyLimit && current >= Number(dailyLimit)) {
      throw new Error(`Daily limit of ${dailyLimit} patients reached.`);
    }
    const next = current + 1;

    tx.set(counterRef, { count: next });
    tx.update(appointmentRef, { status: "waiting", tokenNumber: next, date, acceptedAt: serverTimestamp() });
    tx.set(linkRef, {
      doctorUid, patientUid, patientName, patientId,
      lastAcceptedAt: serverTimestamp(),
    }, { merge: true });
    return next;
  });

  return { tokenNumber };
}

export async function rejectAppointment(appointmentId, reason) {
  await updateDoc(doc(db, "appointments", appointmentId), {
    status: "rejected",
    rejectReason: reason || "",
    rejectedAt: serverTimestamp(),
  });
}

// ============================================================
// STEP 1 — My Patients (doctor <-> patient link docs)
// ============================================================

export function listenToDoctorPatients(doctorUid, callback, onError) {
  const q = query(collection(db, "doctorPatients"), where("doctorUid", "==", doctorUid));
  return listenAndSort(
    q,
    (a, b) => toMs(b.lastAcceptedAt) - toMs(a.lastAcceptedAt),
    callback, onError, "listenToDoctorPatients"
  );
}

// All appointments (any date) between one doctor and one patient.
export async function getDoctorPatientAppointments(doctorUid, patientUid) {
  const q = query(
    collection(db, "appointments"),
    where("doctorUid", "==", doctorUid),
    where("patientUid", "==", patientUid)
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
  return list;
}

// ============================================================
// STEP 1 — Consultation notes (saved when doctor finishes)
// ============================================================

// One batch: save notes in consultations/{appointmentId} and mark
// the appointment "done" — both succeed or both fail.
export async function finishConsultation({
  appointmentId, doctorUid, doctorName, patientUid, patientName, patientId,
  tokenNumber, diagnosis, advice, followUpDate,
}) {
  const batch = writeBatch(db);
  batch.set(doc(db, "consultations", appointmentId), {
    appointmentId, doctorUid, doctorName, patientUid, patientName, patientId,
    tokenNumber: tokenNumber ?? null,
    diagnosis: diagnosis || "",
    advice: advice || "",
    followUpDate: followUpDate || "",
    date: todayKey(),
    createdAt: serverTimestamp(),
  });
  batch.update(doc(db, "appointments", appointmentId), { status: "done", finishedAt: serverTimestamp() });
  await batch.commit();
}

export function listenToDoctorConsultations(doctorUid, callback, onError) {
  const q = query(collection(db, "consultations"), where("doctorUid", "==", doctorUid));
  return listenAndSort(q, (a, b) => toMs(b.createdAt) - toMs(a.createdAt), callback, onError, "listenToDoctorConsultations");
}

export function listenToPatientConsultations(patientUid, callback, onError) {
  const q = query(collection(db, "consultations"), where("patientUid", "==", patientUid));
  return listenAndSort(q, (a, b) => toMs(b.createdAt) - toMs(a.createdAt), callback, onError, "listenToPatientConsultations");
}

// One doctor's consultations with one patient (Patient Details page).
export async function getConsultationsForDoctorPatient(doctorUid, patientUid) {
  const q = query(
    collection(db, "consultations"),
    where("doctorUid", "==", doctorUid),
    where("patientUid", "==", patientUid)
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
  return list;
}

// ============================================================
// STEP 1 — Patient reports (stored in Firestore, no Storage/Blaze)
// ============================================================
//
// Two docs per report:
//   records/{id}      -> small metadata (title, name, type, size). Lists load fast.
//   recordFiles/{id}  -> the file itself as a base64 data URL. Fetched only on "View".
// Firestore doc limit is 1 MiB, so images are compressed in the browser
// and PDFs are capped at ~650 KB.

const MAX_PDF_BYTES = 650 * 1024;
const MAX_DATA_URL_CHARS = 950 * 1000; // stays under the 1 MiB doc limit
const ALLOWED_REPORT_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("Couldn't read the file."));
    r.readAsDataURL(file);
  });
}

// Shrinks an image until its data URL fits the limit.
async function compressImage(file) {
  const srcUrl = await readAsDataUrl(file);
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Couldn't open this image."));
    i.src = srcUrl;
  });

  let maxSide = 1600;
  let quality = 0.75;
  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    const out = canvas.toDataURL("image/jpeg", quality);
    if (out.length <= MAX_DATA_URL_CHARS) return out;
    maxSide = Math.round(maxSide * 0.8);
    quality = Math.max(0.5, quality - 0.07);
  }
  throw new Error("Image is too large even after compressing. Try a smaller photo.");
}

export async function uploadPatientReport({ file, patientUid, patientName, patientId, title }) {
  if (!file) throw new Error("Choose a file first.");
  if (!ALLOWED_REPORT_TYPES.includes(file.type)) throw new Error("Only PDF, JPG, PNG or WEBP files are allowed.");

  let dataUrl;
  let fileType = file.type;
  if (file.type === "application/pdf") {
    if (file.size > MAX_PDF_BYTES) throw new Error("PDF is too large (max 650 KB). Upload a photo of the report instead, or compress the PDF.");
    dataUrl = await readAsDataUrl(file);
  } else {
    dataUrl = await compressImage(file);
    fileType = "image/jpeg";
  }
  if (dataUrl.length > MAX_DATA_URL_CHARS) throw new Error("File is too large to save.");

  const recordRef = doc(collection(db, "records"));
  const batch = writeBatch(db);
  batch.set(recordRef, {
    patientUid, patientName, patientId,
    title: (title || "").trim() || file.name,
    fileName: file.name, fileType, fileSize: file.size,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, "recordFiles", recordRef.id), {
    recordId: recordRef.id, patientUid, dataUrl,
  });
  await batch.commit();
  return { id: recordRef.id };
}

export function listenToPatientRecords(patientUid, callback, onError) {
  const q = query(collection(db, "records"), where("patientUid", "==", patientUid));
  return listenAndSort(q, (a, b) => toMs(b.createdAt) - toMs(a.createdAt), callback, onError, "listenToPatientRecords");
}

// Doctor side — allowed by rules only if a doctorPatients link exists.
export async function getRecordsForPatient(patientUid) {
  const q = query(collection(db, "records"), where("patientUid", "==", patientUid));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
  return list;
}

// Loads the actual file (data URL) for View / Download.
export async function getRecordFile(recordId) {
  const snap = await getDoc(doc(db, "recordFiles", recordId));
  if (!snap.exists()) throw new Error("File not found.");
  return snap.data().dataUrl;
}

export async function deletePatientRecord(recordId) {
  const batch = writeBatch(db);
  batch.delete(doc(db, "records", recordId));
  batch.delete(doc(db, "recordFiles", recordId));
  await batch.commit();
}