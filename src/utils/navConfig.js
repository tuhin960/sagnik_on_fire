// FILE: src/utils/navConfig.js
//
// Single source of truth for each role's sidebar (Section 6 of the
// architecture doc). Route paths mirror the pages/<role>/ folder
// (Section 9) 1:1 — every entry here has a matching page + <Route>.

export const NAV = {
  patient: [
    { to: "/patient/dashboard", label: "Dashboard", icon: "🏠" },
    { to: "/patient/health-record", label: "My Health Record", icon: "📋" },
    { to: "/patient/care-journey", label: "Care Journey", icon: "🧭" },
    { to: "/patient/appointments", label: "Appointments", icon: "📅" },
    { to: "/patient/referrals", label: "Referrals", icon: "🔁" },
    { to: "/patient/medicines", label: "Medicines", icon: "💊" },
    { to: "/patient/notifications", label: "Notifications", icon: "🔔" },
  ],
  healthworker: [
    { to: "/healthworker/dashboard", label: "Dashboard", icon: "🏠" },
    { to: "/healthworker/my-patients", label: "My Patients", icon: "🧑‍🤝‍🧑" },
    { to: "/healthworker/register-patient", label: "Register Patient", icon: "➕" },
    { to: "/healthworker/health-assessment", label: "Health Assessment", icon: "🩺" },
    { to: "/healthworker/referrals", label: "Referrals", icon: "🔁" },
    { to: "/healthworker/follow-ups", label: "Follow-ups", icon: "📌" },
    { to: "/healthworker/offline-sync", label: "Offline Sync", icon: "📶" },
    { to: "/healthworker/notifications", label: "Notifications", icon: "🔔" },
  ],
  doctor: [
    { to: "/doctor/dashboard", label: "Dashboard", icon: "🏠" },
    { to: "/doctor/my-patients", label: "My Patients", icon: "🧑‍🤝‍🧑" },
    { to: "/doctor/appointments", label: "Appointments", icon: "📅" },
    { to: "/doctor/consultations", label: "Consultations", icon: "🗒️" },
    { to: "/doctor/patient-records", label: "Patient Records", icon: "📁" },
    { to: "/doctor/refer-patient", label: "Refer Patient", icon: "🔁" },
    { to: "/doctor/follow-ups", label: "Follow-ups", icon: "📌" },
    { to: "/doctor/prescriptions", label: "Prescriptions", icon: "💊" },
    { to: "/doctor/notifications", label: "Notifications", icon: "🔔" },
  ],
  facility: [
    { to: "/facility/dashboard", label: "Dashboard", icon: "🏠" },
    { to: "/facility/incoming-referrals", label: "Incoming Referrals", icon: "📥" },
    { to: "/facility/patients", label: "Patients", icon: "🧑‍🤝‍🧑" },
    { to: "/facility/resource-availability", label: "Resource Availability", icon: "📊" },
    { to: "/facility/beds-equipment", label: "Beds & Critical Equipment", icon: "🛏️" },
    { to: "/facility/diagnostics", label: "Diagnostics", icon: "🧪" },
    { to: "/facility/medicines", label: "Medicines", icon: "💊" },
    { to: "/facility/referral-history", label: "Referral History", icon: "🗂️" },
    { to: "/facility/notifications", label: "Notifications", icon: "🔔" },
  ],
  admin: [
    { to: "/admin/command-center", label: "Command Center", icon: "🏠" },
    { to: "/admin/patients", label: "Patients", icon: "🧑‍🤝‍🧑" },
    { to: "/admin/care-team", label: "Care Team", icon: "🩺" },
    { to: "/admin/facilities", label: "Facilities", icon: "🏥" },
    { to: "/admin/emergency-referrals", label: "Emergency Referrals", icon: "🚨" },
    { to: "/admin/resource-monitoring", label: "Resource Monitoring", icon: "📊" },
    { to: "/admin/follow-ups", label: "Follow-ups", icon: "📌" },
    { to: "/admin/medicines", label: "Medicines", icon: "💊" },
    { to: "/admin/alerts", label: "Alerts", icon: "⚠️" },
    { to: "/admin/impact-analytics", label: "Impact Analytics", icon: "📈" },
  ],
};

export const ROLE_LABEL = {
  patient: "Patient",
  healthworker: "ASHA / Health Worker",
  doctor: "Doctor",
  facility: "Facility",
  admin: "District Admin",
};
