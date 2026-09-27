// FILE: src/pages/healthworker/HealthAssessment.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function HealthWorkerHealthAssessment() {
  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Health Assessment</h1>
      </div>
      <ComingSoon title="Health Assessment" phase="Phase 4 (ASHA / Health Worker module)" />
    </DashboardLayout>
  );
}
