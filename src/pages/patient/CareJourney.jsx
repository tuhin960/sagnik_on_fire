// FILE: src/pages/patient/CareJourney.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function PatientCareJourney() {
  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>Care Journey</h1>
      </div>
      <ComingSoon title="Care Journey" phase="Phase 3 (Patient module)" />
    </DashboardLayout>
  );
}
