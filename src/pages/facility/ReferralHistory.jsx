// FILE: src/pages/facility/ReferralHistory.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function FacilityReferralHistory() {
  return (
    <DashboardLayout items={NAV.facility} roleLabel={ROLE_LABEL.facility}>
      <div className="page-head">
        <h1>Referral History</h1>
      </div>
      <ComingSoon title="Referral History" phase="Phase 6 (Facility module)" />
    </DashboardLayout>
  );
}
