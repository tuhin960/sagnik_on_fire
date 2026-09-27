// FILE: src/pages/doctor/PatientRecords.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function DoctorPatientRecords() {
  return (
    <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
      <div className="page-head">
        <h1>Patient Records</h1>
      </div>
      <ComingSoon title="Patient Records" phase="Phase 5 (Doctor module)" />
    </DashboardLayout>
  );
}
