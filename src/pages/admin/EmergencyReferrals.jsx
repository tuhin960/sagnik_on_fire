// FILE: src/pages/admin/EmergencyReferrals.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function AdminEmergencyReferrals() {
  return (
    <DashboardLayout items={NAV.admin} roleLabel={ROLE_LABEL.admin}>
      <div className="page-head">
        <h1>Emergency Referrals</h1>
      </div>
      <ComingSoon title="Emergency Referrals" phase="Phase 11 (Admin module)" />
    </DashboardLayout>
  );
}
