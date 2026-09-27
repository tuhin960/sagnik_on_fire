// FILE: src/pages/facility/IncomingReferrals.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function FacilityIncomingReferrals() {
  return (
    <DashboardLayout items={NAV.facility} roleLabel={ROLE_LABEL.facility}>
      <div className="page-head">
        <h1>Incoming Referrals</h1>
      </div>
      <ComingSoon title="Incoming Referrals" phase="Phase 6 (Facility module)" />
    </DashboardLayout>
  );
}
