// FILE: src/pages/admin/DoctorManagement.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function AdminDoctorManagement() {
  return (
    <DashboardLayout items={NAV.admin} roleLabel={ROLE_LABEL.admin}>
      <div className="page-head">
        <h1>Doctor Management</h1>
      </div>
      <ComingSoon title="Doctor Management" phase="Phase 6 (Admin module)" />
    </DashboardLayout>
  );
}