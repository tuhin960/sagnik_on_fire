// FILE: src/routes/AppRoutes.jsx
//
// Every route here has a real, distinct component matching the folder
// structure and the sidebar in navConfig.js.
//
// Facility role removed entirely — Pharmacy is now its own standalone
// role with its own routes.

import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";

// Patient
import PatientDashboard from "../pages/patient/Dashboard";
import PatientFindDoctor from "../pages/patient/FindDoctor";
import PatientBookAppointment from "../pages/patient/BookAppointment";
import PatientAppointments from "../pages/patient/Appointments";
import PatientOnlineConsultation from "../pages/patient/OnlineConsultation";
import PatientPrescriptions from "../pages/patient/Prescriptions";
import PatientMedicines from "../pages/patient/Medicines";
import PatientHealthRecord from "../pages/patient/HealthRecord";
import PatientHospitalRecommendation from "../pages/patient/HospitalRecommendation";
import PatientReferrals from "../pages/patient/Referrals";
import PatientEmergencyHelp from "../pages/patient/EmergencyHelp";
import PatientNotifications from "../pages/patient/Notifications";

// Health Worker
import HealthWorkerDashboard from "../pages/healthworker/Dashboard";
import HealthWorkerTodaysTasks from "../pages/healthworker/TodaysTasks";
import HealthWorkerEmergencyCases from "../pages/healthworker/EmergencyCases";
import HealthWorkerPatientVisits from "../pages/healthworker/PatientVisits";
import HealthWorkerMyPatients from "../pages/healthworker/MyPatients";
import HealthWorkerRegisterPatient from "../pages/healthworker/RegisterPatient";
import HealthWorkerHealthAssessment from "../pages/healthworker/HealthAssessment";
import HealthWorkerDoctorConsultation from "../pages/healthworker/DoctorConsultation";
import HealthWorkerReferrals from "../pages/healthworker/Referrals";
import HealthWorkerFollowUps from "../pages/healthworker/FollowUps";
import HealthWorkerHighRiskPatients from "../pages/healthworker/HighRiskPatients";
import HealthWorkerMedicineDiagnosticStatus from "../pages/healthworker/MedicineDiagnosticStatus";
import HealthWorkerOfflineSync from "../pages/healthworker/OfflineSync";
import HealthWorkerNotifications from "../pages/healthworker/Notifications";

// Doctor
import DoctorDashboard from "../pages/doctor/Dashboard";
import DoctorPatientRequests from "../pages/doctor/PatientRequests";
import DoctorAppointments from "../pages/doctor/Appointments";
import DoctorMyPatients from "../pages/doctor/MyPatients";
import DoctorPatientDetails from "../pages/doctor/PatientDetails";
import DoctorConsultations from "../pages/doctor/Consultations";
import DoctorPrescriptions from "../pages/doctor/Prescriptions";
import DoctorReferPatient from "../pages/doctor/ReferPatient";
import DoctorFollowUps from "../pages/doctor/FollowUps";
import DoctorNotifications from "../pages/doctor/Notifications";

// Pharmacy
import PharmacyDashboard from "../pages/pharmacy/Dashboard";
import PharmacyPrescriptionRequests from "../pages/pharmacy/PrescriptionRequests";
import PharmacyMedicineAvailability from "../pages/pharmacy/MedicineAvailability";
import PharmacyQuantityPrice from "../pages/pharmacy/QuantityPrice";
import PharmacyRespondRequests from "../pages/pharmacy/RespondRequests";
import PharmacyDetails from "../pages/pharmacy/PharmacyDetails";
import PharmacyNotifications from "../pages/pharmacy/Notifications";

// Admin
import AdminCommandCenter from "../pages/admin/CommandCenter";
import AdminPatients from "../pages/admin/Patients";
import AdminDoctorManagement from "../pages/admin/DoctorManagement";
import AdminPharmacyManagement from "../pages/admin/PharmacyManagement";
import AdminAppointmentManagement from "../pages/admin/AppointmentManagement";
import AdminCareTeam from "../pages/admin/CareTeam";
import AdminEmergencyReferrals from "../pages/admin/EmergencyReferrals";
import AdminResourceMonitoring from "../pages/admin/ResourceMonitoring";
import AdminFollowUps from "../pages/admin/FollowUps";
import AdminMedicines from "../pages/admin/Medicines";
import AdminAlerts from "../pages/admin/Alerts";
import AdminReports from "../pages/admin/Reports";
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
      <Route path="/patient/find-doctor" element={guarded("patient", <PatientFindDoctor />)} />
      <Route path="/patient/book-appointment" element={guarded("patient", <PatientBookAppointment />)} />
      <Route path="/patient/appointments" element={guarded("patient", <PatientAppointments />)} />
      <Route path="/patient/online-consultation" element={guarded("patient", <PatientOnlineConsultation />)} />
      <Route path="/patient/prescriptions" element={guarded("patient", <PatientPrescriptions />)} />
      <Route path="/patient/medicines" element={guarded("patient", <PatientMedicines />)} />
      <Route path="/patient/health-record" element={guarded("patient", <PatientHealthRecord />)} />
      <Route path="/patient/hospital-recommendation" element={guarded("patient", <PatientHospitalRecommendation />)} />
      <Route path="/patient/referrals" element={guarded("patient", <PatientReferrals />)} />
      <Route path="/patient/emergency-help" element={guarded("patient", <PatientEmergencyHelp />)} />
      <Route path="/patient/notifications" element={guarded("patient", <PatientNotifications />)} />

      {/* Health Worker */}
      <Route path="/healthworker/dashboard" element={guarded("healthworker", <HealthWorkerDashboard />)} />
      <Route path="/healthworker/todays-tasks" element={guarded("healthworker", <HealthWorkerTodaysTasks />)} />
      <Route path="/healthworker/emergency-cases" element={guarded("healthworker", <HealthWorkerEmergencyCases />)} />
      <Route path="/healthworker/patient-visits" element={guarded("healthworker", <HealthWorkerPatientVisits />)} />
      <Route path="/healthworker/my-patients" element={guarded("healthworker", <HealthWorkerMyPatients />)} />
      <Route path="/healthworker/register-patient" element={guarded("healthworker", <HealthWorkerRegisterPatient />)} />
      <Route path="/healthworker/health-assessment" element={guarded("healthworker", <HealthWorkerHealthAssessment />)} />
      <Route path="/healthworker/doctor-consultation" element={guarded("healthworker", <HealthWorkerDoctorConsultation />)} />
      <Route path="/healthworker/referrals" element={guarded("healthworker", <HealthWorkerReferrals />)} />
      <Route path="/healthworker/follow-ups" element={guarded("healthworker", <HealthWorkerFollowUps />)} />
      <Route path="/healthworker/high-risk-patients" element={guarded("healthworker", <HealthWorkerHighRiskPatients />)} />
      <Route path="/healthworker/medicine-diagnostic-status" element={guarded("healthworker", <HealthWorkerMedicineDiagnosticStatus />)} />
      <Route path="/healthworker/offline-sync" element={guarded("healthworker", <HealthWorkerOfflineSync />)} />
      <Route path="/healthworker/notifications" element={guarded("healthworker", <HealthWorkerNotifications />)} />

      {/* Doctor */}
      <Route path="/doctor/dashboard" element={guarded("doctor", <DoctorDashboard />)} />
      <Route path="/doctor/patient-requests" element={guarded("doctor", <DoctorPatientRequests />)} />
      <Route path="/doctor/appointments" element={guarded("doctor", <DoctorAppointments />)} />
      <Route path="/doctor/my-patients" element={guarded("doctor", <DoctorMyPatients />)} />
      <Route path="/doctor/patient-details" element={guarded("doctor", <DoctorPatientDetails />)} />
      <Route path="/doctor/consultations" element={guarded("doctor", <DoctorConsultations />)} />
      <Route path="/doctor/prescriptions" element={guarded("doctor", <DoctorPrescriptions />)} />
      <Route path="/doctor/refer-patient" element={guarded("doctor", <DoctorReferPatient />)} />
      <Route path="/doctor/follow-ups" element={guarded("doctor", <DoctorFollowUps />)} />
      <Route path="/doctor/notifications" element={guarded("doctor", <DoctorNotifications />)} />

      {/* Pharmacy */}
      <Route path="/pharmacy/dashboard" element={guarded("pharmacy", <PharmacyDashboard />)} />
      <Route path="/pharmacy/prescription-requests" element={guarded("pharmacy", <PharmacyPrescriptionRequests />)} />
      <Route path="/pharmacy/medicine-availability" element={guarded("pharmacy", <PharmacyMedicineAvailability />)} />
      <Route path="/pharmacy/quantity-price" element={guarded("pharmacy", <PharmacyQuantityPrice />)} />
      <Route path="/pharmacy/respond-requests" element={guarded("pharmacy", <PharmacyRespondRequests />)} />
      <Route path="/pharmacy/details" element={guarded("pharmacy", <PharmacyDetails />)} />
      <Route path="/pharmacy/notifications" element={guarded("pharmacy", <PharmacyNotifications />)} />

      {/* Admin */}
      <Route path="/admin/command-center" element={guarded("admin", <AdminCommandCenter />)} />
      <Route path="/admin/patients" element={guarded("admin", <AdminPatients />)} />
      <Route path="/admin/doctor-management" element={guarded("admin", <AdminDoctorManagement />)} />
      <Route path="/admin/pharmacy-management" element={guarded("admin", <AdminPharmacyManagement />)} />
      <Route path="/admin/appointment-management" element={guarded("admin", <AdminAppointmentManagement />)} />
      <Route path="/admin/care-team" element={guarded("admin", <AdminCareTeam />)} />
      <Route path="/admin/emergency-referrals" element={guarded("admin", <AdminEmergencyReferrals />)} />
      <Route path="/admin/resource-monitoring" element={guarded("admin", <AdminResourceMonitoring />)} />
      <Route path="/admin/follow-ups" element={guarded("admin", <AdminFollowUps />)} />
      <Route path="/admin/medicines" element={guarded("admin", <AdminMedicines />)} />
      <Route path="/admin/alerts" element={guarded("admin", <AdminAlerts />)} />
      <Route path="/admin/reports" element={guarded("admin", <AdminReports />)} />
      <Route path="/admin/impact-analytics" element={guarded("admin", <AdminImpactAnalytics />)} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}