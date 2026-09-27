// FILE: src/pages/healthworker/MyPatients.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function HealthWorkerMyPatients() {
  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>My Patients</h1>
      </div>
      <ComingSoon title="My Patients" phase="Phase 4 (ASHA / Health Worker module)" />
    </DashboardLayout>
  );
}
