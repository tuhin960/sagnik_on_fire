// FILE: src/routes/AppRoutes.jsx
//
// Every route here has a real, distinct component (RULE 10) matching
// the folder structure in Section 9 and the sidebar in Section 6.

import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";

// Patient
import PatientDashboard from "../pages/patient/Dashboard";
import PatientHealthRecord from "../pages/patient/HealthRecord";
import PatientCareJourney from "../pages/patient/CareJourney";
import PatientAppointments from "../pages/patient/Appointments";
import PatientReferrals from "../pages/patient/Referrals";
import PatientMedicines from "../pages/patient/Medicines";
import PatientNotifications from "../pages/patient/Notifications";

// Health Worker
import HealthWorkerDashboard from "../pages/healthworker/Dashboard";
import HealthWorkerMyPatients from "../pages/healthworker/MyPatients";
import HealthWorkerRegisterPatient from "../pages/healthworker/RegisterPatient";
import HealthWorkerHealthAssessment from "../pages/healthworker/HealthAssessment";
import HealthWorkerReferrals from "../pages/healthworker/Referrals";
import HealthWorkerFollowUps from "../pages/healthworker/FollowUps";
import HealthWorkerOfflineSync from "../pages/healthworker/OfflineSync";
import HealthWorkerNotifications from "../pages/healthworker/Notifications";

// Doctor
import DoctorDashboard from "../pages/doctor/Dashboard";
import DoctorMyPatients from "../pages/doctor/MyPatients";
import DoctorAppointments from "../pages/doctor/Appointments";
import DoctorConsultations from "../pages/doctor/Consultations";
import DoctorPatientRecords from "../pages/doctor/PatientRecords";
import DoctorReferPatient from "../pages/doctor/ReferPatient";
import DoctorFollowUps from "../pages/doctor/FollowUps";
import DoctorPrescriptions from "../pages/doctor/Prescriptions";
import DoctorNotifications from "../pages/doctor/Notifications";

// Facility
import FacilityDashboard from "../pages/facility/Dashboard";
import FacilityIncomingReferrals from "../pages/facility/IncomingReferrals";
import FacilityPatients from "../pages/facility/Patients";
import FacilityResourceAvailability from "../pages/facility/ResourceAvailability";
import FacilityBedsEquipment from "../pages/facility/BedsEquipment";
import FacilityDiagnostics from "../pages/facility/Diagnostics";
import FacilityMedicines from "../pages/facility/Medicines";
import FacilityReferralHistory from "../pages/facility/ReferralHistory";
import FacilityNotifications from "../pages/facility/Notifications";

// Admin
import AdminCommandCenter from "../pages/admin/CommandCenter";
import AdminPatients from "../pages/admin/Patients";
import AdminCareTeam from "../pages/admin/CareTeam";
import AdminFacilities from "../pages/admin/Facilities";
import AdminEmergencyReferrals from "../pages/admin/EmergencyReferrals";
import AdminResourceMonitoring from "../pages/admin/ResourceMonitoring";
import AdminFollowUps from "../pages/admin/FollowUps";
import AdminMedicines from "../pages/admin/Medicines";
import AdminAlerts from "../pages/admin/Alerts";
import AdminImpactAnalytics from "../pages/admin/ImpactAnalytics";

function guarded(role, element) {
  return <ProtectedRoute allowedRoles={[role]}>{element}</ProtectedRoute>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Patient */}
      <Route path="/patient/dashboard" element={guarded("patient", <PatientDashboard />)} />
      <Route path="/patient/health-record" element={guarded("patient", <PatientHealthRecord />)} />
      <Route path="/patient/care-journey" element={guarded("patient", <PatientCareJourney />)} />
      <Route path="/patient/appointments" element={guarded("patient", <PatientAppointments />)} />
      <Route path="/patient/referrals" element={guarded("patient", <PatientReferrals />)} />
      <Route path="/patient/medicines" element={guarded("patient", <PatientMedicines />)} />
      <Route path="/patient/notifications" element={guarded("patient", <PatientNotifications />)} />

      {/* Health Worker */}
      <Route path="/healthworker/dashboard" element={guarded("healthworker", <HealthWorkerDashboard />)} />
      <Route path="/healthworker/my-patients" element={guarded("healthworker", <HealthWorkerMyPatients />)} />
      <Route path="/healthworker/register-patient" element={guarded("healthworker", <HealthWorkerRegisterPatient />)} />
      <Route path="/healthworker/health-assessment" element={guarded("healthworker", <HealthWorkerHealthAssessment />)} />
      <Route path="/healthworker/referrals" element={guarded("healthworker", <HealthWorkerReferrals />)} />
      <Route path="/healthworker/follow-ups" element={guarded("healthworker", <HealthWorkerFollowUps />)} />
      <Route path="/healthworker/offline-sync" element={guarded("healthworker", <HealthWorkerOfflineSync />)} />
      <Route path="/healthworker/notifications" element={guarded("healthworker", <HealthWorkerNotifications />)} />

      {/* Doctor */}
      <Route path="/doctor/dashboard" element={guarded("doctor", <DoctorDashboard />)} />
      <Route path="/doctor/my-patients" element={guarded("doctor", <DoctorMyPatients />)} />
      <Route path="/doctor/appointments" element={guarded("doctor", <DoctorAppointments />)} />
      <Route path="/doctor/consultations" element={guarded("doctor", <DoctorConsultations />)} />
      <Route path="/doctor/patient-records" element={guarded("doctor", <DoctorPatientRecords />)} />
      <Route path="/doctor/refer-patient" element={guarded("doctor", <DoctorReferPatient />)} />
      <Route path="/doctor/follow-ups" element={guarded("doctor", <DoctorFollowUps />)} />
      <Route path="/doctor/prescriptions" element={guarded("doctor", <DoctorPrescriptions />)} />
      <Route path="/doctor/notifications" element={guarded("doctor", <DoctorNotifications />)} />

      {/* Facility */}
      <Route path="/facility/dashboard" element={guarded("facility", <FacilityDashboard />)} />
      <Route path="/facility/incoming-referrals" element={guarded("facility", <FacilityIncomingReferrals />)} />
      <Route path="/facility/patients" element={guarded("facility", <FacilityPatients />)} />
      <Route path="/facility/resource-availability" element={guarded("facility", <FacilityResourceAvailability />)} />
      <Route path="/facility/beds-equipment" element={guarded("facility", <FacilityBedsEquipment />)} />
      <Route path="/facility/diagnostics" element={guarded("facility", <FacilityDiagnostics />)} />
      <Route path="/facility/medicines" element={guarded("facility", <FacilityMedicines />)} />
      <Route path="/facility/referral-history" element={guarded("facility", <FacilityReferralHistory />)} />
      <Route path="/facility/notifications" element={guarded("facility", <FacilityNotifications />)} />

      {/* Admin */}
      <Route path="/admin/command-center" element={guarded("admin", <AdminCommandCenter />)} />
      <Route path="/admin/patients" element={guarded("admin", <AdminPatients />)} />
      <Route path="/admin/care-team" element={guarded("admin", <AdminCareTeam />)} />
      <Route path="/admin/facilities" element={guarded("admin", <AdminFacilities />)} />
      <Route path="/admin/emergency-referrals" element={guarded("admin", <AdminEmergencyReferrals />)} />
      <Route path="/admin/resource-monitoring" element={guarded("admin", <AdminResourceMonitoring />)} />
      <Route path="/admin/follow-ups" element={guarded("admin", <AdminFollowUps />)} />
      <Route path="/admin/medicines" element={guarded("admin", <AdminMedicines />)} />
      <Route path="/admin/alerts" element={guarded("admin", <AdminAlerts />)} />
      <Route path="/admin/impact-analytics" element={guarded("admin", <AdminImpactAnalytics />)} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
