// FILE: src/pages/doctor/Appointments.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function DoctorAppointments() {
  return (
    <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
      <div className="page-head">
        <h1>Appointments</h1>
      </div>
      <ComingSoon title="Appointments" phase="Phase 5 (Doctor module)" />
    </DashboardLayout>
  );
}
