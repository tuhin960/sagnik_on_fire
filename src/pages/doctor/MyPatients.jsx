// FILE: src/pages/doctor/MyPatients.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function DoctorMyPatients() {
  return (
    <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
      <div className="page-head">
        <h1>My Patients</h1>
      </div>
      <ComingSoon title="My Patients" phase="Phase 5 (Doctor module)" />
    </DashboardLayout>
  );
}
