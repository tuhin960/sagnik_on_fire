// FILE: src/pages/healthworker/Notifications.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function HealthWorkerNotifications() {
  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Notifications</h1>
      </div>
      <ComingSoon title="Notifications" phase="Phase 4 (ASHA / Health Worker module)" />
    </DashboardLayout>
  );
}
