// FILE: src/pages/admin/AppointmentManagement.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function AdminAppointmentManagement() {
  return (
    <DashboardLayout items={NAV.admin} roleLabel={ROLE_LABEL.admin}>
      <div className="page-head">
        <h1>Appointment Management</h1>
      </div>
      <ComingSoon title="Appointment Management" phase="Phase 6 (Admin module)" />
    </DashboardLayout>
  );
}