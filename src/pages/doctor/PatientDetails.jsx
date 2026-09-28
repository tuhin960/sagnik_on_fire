// FILE: src/pages/doctor/PatientDetails.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function DoctorPatientDetails() {
  return (
    <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
      <div className="page-head">
        <h1>Patient Details</h1>
      </div>
      <ComingSoon title="Patient Details" phase="Phase 3 (Doctor module)" />
    </DashboardLayout>
  );
}