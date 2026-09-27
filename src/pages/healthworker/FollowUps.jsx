// FILE: src/pages/healthworker/FollowUps.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function HealthWorkerFollowUps() {
  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Follow-ups</h1>
      </div>
      <ComingSoon title="Follow-ups" phase="Phase 4 (ASHA / Health Worker module)" />
    </DashboardLayout>
  );
}
