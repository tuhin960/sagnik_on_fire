// FILE: src/pages/healthworker/MedicineDiagnosticStatus.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function HealthWorkerMedicineDiagnosticStatus() {
  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Medicine / Diagnostic Status</h1>
      </div>
      <ComingSoon title="Medicine / Diagnostic Status" phase="Phase 4 (Health Worker module)" />
    </DashboardLayout>
  );
}