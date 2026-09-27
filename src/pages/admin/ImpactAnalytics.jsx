// FILE: src/pages/admin/ImpactAnalytics.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function AdminImpactAnalytics() {
  return (
    <DashboardLayout items={NAV.admin} roleLabel={ROLE_LABEL.admin}>
      <div className="page-head">
        <h1>Impact Analytics</h1>
      </div>
      <ComingSoon title="Impact Analytics" phase="Phase 11 (Admin module)" />
    </DashboardLayout>
  );
}
