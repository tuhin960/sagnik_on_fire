// FILE: src/pages/admin/ResourceMonitoring.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function AdminResourceMonitoring() {
  return (
    <DashboardLayout items={NAV.admin} roleLabel={ROLE_LABEL.admin}>
      <div className="page-head">
        <h1>Resource Monitoring</h1>
      </div>
      <ComingSoon title="Resource Monitoring" phase="Phase 11 (Admin module)" />
    </DashboardLayout>
  );
}
