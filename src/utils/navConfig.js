// FILE: src/utils/navConfig.js
//
// Single source of truth for each role's sidebar. Route paths mirror
// the pages/<role>/ folder 1:1 — every entry here has a matching page
// + <Route>. `action: "logout"` entries are handled specially by
// Sidebar.jsx (they sign the user out instead of navigating).
//
// Facility role removed — Pharmacy is now its own standalone role.

export const NAV = {
  patient: [
    { to: "/patient/dashboard", label: "Dashboard", icon: "🏠" },
    { to: "/patient/profile", label: "My Profile", icon: "👤" },
    { to: "/patient/find-doctor", label: "Find Doctor", icon: "🔎" },
    { to: "/patient/book-appointment", label: "Book Appointment", icon: "🗓️" },
    { to: "/patient/appointments", label: "My Appointments", icon: "📅" },
    { to: "/patient/online-consultation", label: "Online Consultation", icon: "💻" },
    { to: "/patient/care-journey", label: "Care Journey", icon: "🧭" },
    { to: "/patient/prescriptions", label: "Prescriptions", icon: "📝" },
    { to: "/patient/medicines", label: "Pharmacy / Medicines", icon: "💊" },
    { to: "/patient/health-record", label: "Health Records", icon: "📋" },
    { to: "/patient/hospital-recommendation", label: "Hospital Recommendation", icon: "🏥" },
    { to: "/patient/referrals", label: "Referrals", icon: "🔁" },
    { to: "/patient/emergency-help", label: "Emergency Help", icon: "🚨" },
    { to: "/patient/notifications", label: "Notifications", icon: "🔔" },
    { action: "logout", label: "Logout", icon: "🚪" },
  ],
  healthworker: [
    { to: "/healthworker/dashboard", label: "Dashboard", icon: "🏠" },
    { to: "/healthworker/todays-tasks", label: "Today's Tasks", icon: "✅" },
    { to: "/healthworker/emergency-cases", label: "Emergency / Critical Cases", icon: "🚨" },
    { to: "/healthworker/patient-visits", label: "Patient Visits", icon: "🚶" },
    { to: "/healthworker/my-patients", label: "My Patients", icon: "🧑‍🤝‍🧑" },
    { to: "/healthworker/register-patient", label: "Register Patient", icon: "➕" },
    { to: "/healthworker/health-assessment", label: "Patient Assessment", icon: "🩺" },
    { to: "/healthworker/doctor-consultation", label: "Doctor Consultation", icon: "💻" },
    { to: "/healthworker/referrals", label: "Referrals", icon: "🔁" },
    { to: "/healthworker/follow-ups", label: "Follow-ups", icon: "📌" },
    { to: "/healthworker/high-risk-patients", label: "High-Risk Patients", icon: "⚠️" },
    { to: "/healthworker/medicine-diagnostic-status", label: "Medicine / Diagnostic Status", icon: "🧪" },
    { to: "/healthworker/offline-sync", label: "Offline Sync", icon: "📶" },
    { to: "/healthworker/notifications", label: "Notifications", icon: "🔔" },
    { action: "logout", label: "Logout", icon: "🚪" },
  ],
  doctor: [
    { to: "/doctor/dashboard", label: "Dashboard", icon: "🏠" },
    { to: "/doctor/profile", label: "Doctor Profile", icon: "👤" },
    { to: "/doctor/patient-requests", label: "Patient Requests", icon: "📨" },
    { to: "/doctor/appointments", label: "Appointments", icon: "📅" },
    { to: "/doctor/my-patients", label: "My Patients", icon: "🧑‍🤝‍🧑" },
    { to: "/doctor/patient-details", label: "Patient Details", icon: "🗂️" },
    { to: "/doctor/consultations", label: "Consultation", icon: "🗒️" },
    { to: "/doctor/prescriptions", label: "Prescription", icon: "💊" },
    { to: "/doctor/patient-records", label: "Medical Records", icon: "📁" },
    { to: "/doctor/refer-patient", label: "Referral", icon: "🔁" },
    { to: "/doctor/follow-ups", label: "Follow-up", icon: "📌" },
    { to: "/doctor/notifications", label: "Notifications", icon: "🔔" },
    { action: "logout", label: "Logout", icon: "🚪" },
  ],
  pharmacy: [
    { to: "/pharmacy/dashboard", label: "Dashboard", icon: "🏠" },
    { to: "/pharmacy/prescription-requests", label: "Prescription Requests", icon: "📨" },
    { to: "/pharmacy/medicine-availability", label: "Medicine Availability", icon: "💊" },
    { to: "/pharmacy/quantity-price", label: "Quantity & Price", icon: "🏷️" },
    { to: "/pharmacy/respond-requests", label: "Accept / Respond to Requests", icon: "✅" },
    { to: "/pharmacy/details", label: "Pharmacy Details", icon: "🏬" },
    { to: "/pharmacy/notifications", label: "Notifications", icon: "🔔" },
    { action: "logout", label: "Logout", icon: "🚪" },
  ],
  admin: [
    { to: "/admin/command-center", label: "Dashboard Overview", icon: "🏠" },
    { to: "/admin/patients", label: "Patient Management", icon: "🧑‍🤝‍🧑" },
    { to: "/admin/doctor-management", label: "Doctor Management", icon: "⚕️" },
    { to: "/admin/pharmacy-management", label: "Pharmacy Management", icon: "💊" },
    { to: "/admin/appointment-management", label: "Appointment Management", icon: "📅" },
    { to: "/admin/care-team", label: "Care Team", icon: "🩺" },
    { to: "/admin/emergency-referrals", label: "Emergency Referrals", icon: "🚨" },
    { to: "/admin/resource-monitoring", label: "Resource Monitoring", icon: "📊" },
    { to: "/admin/follow-ups", label: "Follow-ups", icon: "📌" },
    { to: "/admin/medicines", label: "Medicines", icon: "💊" },
    { to: "/admin/alerts", label: "Alerts", icon: "⚠️" },
    { to: "/admin/reports", label: "Reports", icon: "📄" },
    { to: "/admin/impact-analytics", label: "Impact Analytics", icon: "📈" },
    { to: "/admin/notifications", label: "Notifications", icon: "🔔" },
    { action: "logout", label: "Logout", icon: "🚪" },
  ],
};

export const ROLE_LABEL = {
  patient: "Patient",
  healthworker: "ASHA / Health Worker",
  doctor: "Doctor",
  pharmacy: "Pharmacy",
  admin: "District Admin",
};