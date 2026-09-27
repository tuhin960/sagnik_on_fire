// FILE: src/pages/patient/Appointments.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function PatientAppointments() {
  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>Appointments</h1>
      </div>
      <ComingSoon title="Appointments" phase="Phase 3 (Patient module)" />
    </DashboardLayout>
  );
}
