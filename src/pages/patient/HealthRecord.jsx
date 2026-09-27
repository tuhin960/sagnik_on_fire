// FILE: src/pages/patient/HealthRecord.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function PatientHealthRecord() {
  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>My Health Record</h1>
      </div>
      <ComingSoon title="My Health Record" phase="Phase 3 (Patient module)" />
    </DashboardLayout>
  );
}
