// FILE: src/pages/admin/CareTeam.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function AdminCareTeam() {
  return (
    <DashboardLayout items={NAV.admin} roleLabel={ROLE_LABEL.admin}>
      <div className="page-head">
        <h1>Care Team</h1>
      </div>
      <ComingSoon title="Care Team" phase="Phase 11 (Admin module)" />
    </DashboardLayout>
  );
}
