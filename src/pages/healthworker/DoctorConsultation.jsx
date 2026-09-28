// FILE: src/pages/healthworker/DoctorConsultation.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function HealthWorkerDoctorConsultation() {
  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Doctor Consultation</h1>
      </div>
      <ComingSoon title="Doctor Consultation" phase="Phase 3 (Health Worker module)" />
    </DashboardLayout>
  );
}