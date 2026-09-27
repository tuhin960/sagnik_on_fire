// FILE: src/pages/doctor/FollowUps.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function DoctorFollowUps() {
  return (
    <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
      <div className="page-head">
        <h1>Follow-ups</h1>
      </div>
      <ComingSoon title="Follow-ups" phase="Phase 5 (Doctor module)" />
    </DashboardLayout>
  );
}
