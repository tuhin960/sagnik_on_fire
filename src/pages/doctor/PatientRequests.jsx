// FILE: src/pages/doctor/PatientRequests.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function DoctorPatientRequests() {
  return (
    <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
      <div className="page-head">
        <h1>Patient Requests</h1>
        <p className="sub">New consultation requests waiting for your response.</p>
      </div>
      <ComingSoon title="Patient Requests" phase="Phase 3 (Doctor module)" />
    </DashboardLayout>
  );
}