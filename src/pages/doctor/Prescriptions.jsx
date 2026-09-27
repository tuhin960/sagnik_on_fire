// FILE: src/pages/doctor/Prescriptions.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function DoctorPrescriptions() {
  return (
    <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
      <div className="page-head">
        <h1>Prescriptions</h1>
      </div>
      <ComingSoon title="Prescriptions" phase="Phase 5 (Doctor module)" />
    </DashboardLayout>
  );
}
