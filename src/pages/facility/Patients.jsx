// FILE: src/pages/facility/Patients.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function FacilityPatients() {
  return (
    <DashboardLayout items={NAV.facility} roleLabel={ROLE_LABEL.facility}>
      <div className="page-head">
        <h1>Patients</h1>
      </div>
      <ComingSoon title="Patients" phase="Phase 6 (Facility module)" />
    </DashboardLayout>
  );
}
