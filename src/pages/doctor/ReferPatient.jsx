// FILE: src/pages/doctor/ReferPatient.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function DoctorReferPatient() {
  return (
    <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
      <div className="page-head">
        <h1>Refer Patient</h1>
      </div>
      <ComingSoon title="Refer Patient" phase="Phase 5 (Doctor module)" />
    </DashboardLayout>
  );
}
