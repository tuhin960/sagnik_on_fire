// FILE: src/firebase/firestore.js
// Firestore helpers for the users/{uid} profile document described
// in the architecture doc (Section 8 — Authentication).
//
// Doctor / Health Worker / Pharmacy no longer get a randomly generated
// specialId — they must type their real registration number at signup,
// and it's checked against a demo whitelist below (Section 8 doesn't
// wire up a live government registry, so this whitelist simulates one
// for the hackathon build). Patient and Hospital-type Facility still
// get an auto-generated ID since they have no external credential to
// check.
//
// SECURITY NOTE: this file ships to the browser, so these whitelists
// are visible to anyone who opens dev tools — fine for a demo, but a
// real deployment must move this check server-side (Cloud Function or
// your backend) so the valid list is never in client code.

import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { db } from "./config";

const VALID_ROLES = ["patient", "healthworker", "doctor", "facility", "admin"];

// --- Demo credential whitelists (Section 8 stand-in for a real registry) ---
const DOCTOR_VALID_REG_NOS = ["REG-2026-1001", "REG-2026-1002", "REG-2026-1003", "REG-2026-1004", "REG-2026-1005"];
const HEALTHWORKER_VALID_REG_NOS = ["HW-2026-2001", "HW-2026-2002", "HW-2026-2003", "HW-2026-2004", "HW-2026-2005"];
const PHARMACY_VALID_LICENSE_NOS = ["PHR-2026-3001", "PHR-2026-3002", "PHR-2026-3003", "PHR-2026-3004", "PHR-2026-3005"];

function matchWhitelist(input, list) {
  if (!input) return null;
  const cleaned = input.trim().toUpperCase();
  return list.find((v) => v.toUpperCase() === cleaned) || null;
}

// Auto-generated IDs — only used for Patient and Hospital-type Facility,
// which have no external credential to verify against.
function generateSpecialId(role) {
  const prefixes = { patient: "PAT-2026-", facility: "FAC-2026-" };
  const prefix = prefixes[role];
  if (!prefix) return null;
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${suffix}`;
}

export async function createUserProfile({ uid, name, email, mobile, role, regNo, facilityType }) {
  if (!VALID_ROLES.includes(role) || role === "admin") {
    throw new Error("Signup cannot self-assign this role.");
  }

  let specialId = null;
  let resolvedFacilityType = null;

  if (role === "doctor") {
    specialId = matchWhitelist(regNo, DOCTOR_VALID_REG_NOS);
    if (!specialId) throw new Error("That doesn't match a valid Doctor registration number.");
  } else if (role === "healthworker") {
    specialId = matchWhitelist(regNo, HEALTHWORKER_VALID_REG_NOS);
    if (!specialId) throw new Error("That doesn't match a valid ASHA / Health Worker registration number.");
  } else if (role === "facility") {
    resolvedFacilityType = facilityType === "pharmacy" ? "pharmacy" : "hospital";
    if (resolvedFacilityType === "pharmacy") {
      specialId = matchWhitelist(regNo, PHARMACY_VALID_LICENSE_NOS);
      if (!specialId) throw new Error("That doesn't match a valid Pharmacy drug license number.");
    } else {
      specialId = generateSpecialId(role);
    }
  } else {
    specialId = generateSpecialId(role); // patient
  }

  const profile = {
    uid,
    name,
    email,
    mobile,
    role,
    specialId,
    ...(role === "facility" ? { facilityType: resolvedFacilityType } : {}),
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, "users", uid), profile);
  return profile;
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// Looks up a profile by email (+ optional role), before the person has
// signed in — used on the Login screen so a patient sees their own
// Patient ID as soon as they type their email, and so we can catch a
// wrong role pick early for every role.
//
// SECURITY NOTE: this reads the `users` collection while unauthenticated,
// so it only works if your Firestore security rules allow this exact
// scoped query shape. Do not open the whole `users` collection to public
// read — restrict it to matching-email lookups before real deployment.
export async function getUserProfileByEmail(email, role) {
  if (!email) return null;
  const usersRef = collection(db, "users");
  const q = role
    ? query(usersRef, where("email", "==", email), where("role", "==", role))
    : query(usersRef, where("email", "==", email));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data();
  
}// Validates a role's credential BEFORE we create the Firebase Auth
// account, so an invalid reg no never leaves behind an orphaned Auth
// user with no matching Firestore profile.
export function validateSignupCredential(role, regNo, facilityType) {
  if (role === "doctor" && !matchWhitelist(regNo, DOCTOR_VALID_REG_NOS)) {
    return "That doesn't match a valid Doctor registration number.";
  }
  if (role === "healthworker" && !matchWhitelist(regNo, HEALTHWORKER_VALID_REG_NOS)) {
    return "That doesn't match a valid ASHA / Health Worker registration number.";
  }
  if (role === "facility" && facilityType === "pharmacy" && !matchWhitelist(regNo, PHARMACY_VALID_LICENSE_NOS)) {
    return "That doesn't match a valid Pharmacy drug license number.";
  }
  return null;
}