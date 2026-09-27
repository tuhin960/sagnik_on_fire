// FILE: src/pages/healthworker/OfflineSync.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function HealthWorkerOfflineSync() {
  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Offline Sync</h1>
      </div>
      <ComingSoon title="Offline Sync" phase="Phase 4 (ASHA / Health Worker module)" />
    </DashboardLayout>
  );
}
