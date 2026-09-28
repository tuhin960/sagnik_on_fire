// FILE: src/pages/healthworker/TodaysTasks.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function HealthWorkerTodaysTasks() {
  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Today's Tasks</h1>
      </div>
      <ComingSoon title="Today's Tasks" phase="Phase 2 (Health Worker module)" />
    </DashboardLayout>
  );
}