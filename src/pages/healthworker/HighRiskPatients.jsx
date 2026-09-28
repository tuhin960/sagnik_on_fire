// FILE: src/pages/healthworker/HighRiskPatients.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function HealthWorkerHighRiskPatients() {
  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>High-Risk Patients</h1>
      </div>
      <ComingSoon title="High-Risk Patients" phase="Phase 4 (Health Worker module)" />
    </DashboardLayout>
  );
}