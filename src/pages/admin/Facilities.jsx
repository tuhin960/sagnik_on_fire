// FILE: src/pages/admin/Facilities.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function AdminFacilities() {
  return (
    <DashboardLayout items={NAV.admin} roleLabel={ROLE_LABEL.admin}>
      <div className="page-head">
        <h1>Facilities</h1>
      </div>
      <ComingSoon title="Facilities" phase="Phase 11 (Admin module)" />
    </DashboardLayout>
  );
}
