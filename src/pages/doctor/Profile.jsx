// FILE: src/pages/doctor/Profile.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function DoctorProfile() {
  return (
    <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
      <div className="page-head">
        <h1>Doctor Profile</h1>
      </div>
      <ComingSoon title="Doctor Profile" phase="Phase 2 (Doctor module)" />
    </DashboardLayout>
  );
}