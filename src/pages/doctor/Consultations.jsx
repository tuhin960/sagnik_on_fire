// FILE: src/pages/doctor/Consultations.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function DoctorConsultations() {
  return (
    <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
      <div className="page-head">
        <h1>Consultations</h1>
      </div>
      <ComingSoon title="Consultations" phase="Phase 5 (Doctor module)" />
    </DashboardLayout>
  );
}
