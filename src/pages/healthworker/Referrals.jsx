// FILE: src/pages/healthworker/Referrals.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function HealthWorkerReferrals() {
  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Referrals</h1>
      </div>
      <ComingSoon title="Referrals" phase="Phase 4 (ASHA / Health Worker module)" />
    </DashboardLayout>
  );
}
