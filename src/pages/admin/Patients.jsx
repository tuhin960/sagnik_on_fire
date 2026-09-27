// FILE: src/pages/admin/Patients.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function AdminPatients() {
  return (
    <DashboardLayout items={NAV.admin} roleLabel={ROLE_LABEL.admin}>
      <div className="page-head">
        <h1>Patients</h1>
      </div>
      <ComingSoon title="Patients" phase="Phase 11 (Admin module)" />
    </DashboardLayout>
  );
}
