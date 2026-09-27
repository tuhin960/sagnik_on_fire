// FILE: src/pages/patient/Medicines.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function PatientMedicines() {
  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>Medicines</h1>
      </div>
      <ComingSoon title="Medicines" phase="Phase 3 (Patient module)" />
    </DashboardLayout>
  );
}
