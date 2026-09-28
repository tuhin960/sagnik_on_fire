// FILE: src/pages/admin/Reports.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function AdminReports() {
  return (
    <DashboardLayout items={NAV.admin} roleLabel={ROLE_LABEL.admin}>
      <div className="page-head">
        <h1>Reports</h1>
      </div>
      <ComingSoon title="Reports" phase="Phase 7 (Admin module)" />
    </DashboardLayout>
  );
}