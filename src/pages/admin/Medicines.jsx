// FILE: src/pages/admin/Medicines.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function AdminMedicines() {
  return (
    <DashboardLayout items={NAV.admin} roleLabel={ROLE_LABEL.admin}>
      <div className="page-head">
        <h1>Medicines</h1>
      </div>
      <ComingSoon title="Medicines" phase="Phase 11 (Admin module)" />
    </DashboardLayout>
  );
}
