// FILE: src/firebase/firestore.js
//
// Adds: doctor specializations, emergency alerts (real-time), and a
// queue-based appointment/token system — all client-Firestore only,
// no backend endpoints needed.

import {
  addDoc, collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy,
  query, runTransaction, serverTimestamp, setDoc, updateDoc, where,
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

// Real-time — call once, keep the returned unsubscribe function and
// call it on unmount (see useEffect cleanup in the page components).
export function listenToOpenAlerts(callback) {
  const q = query(collection(db, "alerts"), where("status", "==", "open"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function listenToPatientAlerts(patientUid, callback) {
  const q = query(collection(db, "alerts"), where("patientUid", "==", patientUid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
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

export function listenToDoctorQueue(doctorUid, callback) {
  const date = todayKey();
  const q = query(
    collection(db, "appointments"),
    where("doctorUid", "==", doctorUid),
    where("date", "==", date),
    orderBy("tokenNumber", "asc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function listenToPatientAppointments(patientUid, callback) {
  const q = query(collection(db, "appointments"), where("patientUid", "==", patientUid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function updateAppointmentStatus(appointmentId, status) {
  await updateDoc(doc(db, "appointments", appointmentId), { status });
}