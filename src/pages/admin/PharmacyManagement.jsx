// FILE: src/pages/admin/PharmacyManagement.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function AdminPharmacyManagement() {
  return (
    <DashboardLayout items={NAV.admin} roleLabel={ROLE_LABEL.admin}>
      <div className="page-head">
        <h1>Pharmacy Management</h1>
      </div>
      <ComingSoon title="Pharmacy Management" phase="Phase 6 (Admin module)" />
    </DashboardLayout>
  );
}