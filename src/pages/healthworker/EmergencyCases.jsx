// FILE: src/pages/healthworker/EmergencyCases.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function HealthWorkerEmergencyCases() {
  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Emergency / Critical Cases</h1>
      </div>
      <ComingSoon title="Emergency / Critical Cases" phase="Phase 3 (Health Worker module)" />
    </DashboardLayout>
  );
}