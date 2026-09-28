// FILE: src/pages/patient/Prescriptions.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function PatientPrescriptions() {
  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>Prescriptions</h1>
      </div>
      <ComingSoon title="Prescriptions" phase="Phase 3 (Patient module)" />
    </DashboardLayout>
  );
}