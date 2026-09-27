// FILE: src/pages/healthworker/RegisterPatient.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function HealthWorkerRegisterPatient() {
  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Register Patient</h1>
      </div>
      <ComingSoon title="Register Patient" phase="Phase 4 (ASHA / Health Worker module)" />
    </DashboardLayout>
  );
}
