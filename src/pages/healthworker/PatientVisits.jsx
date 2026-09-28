// FILE: src/pages/healthworker/PatientVisits.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function HealthWorkerPatientVisits() {
  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Patient Visits</h1>
      </div>
      <ComingSoon title="Patient Visits" phase="Phase 2 (Health Worker module)" />
    </DashboardLayout>
  );
}