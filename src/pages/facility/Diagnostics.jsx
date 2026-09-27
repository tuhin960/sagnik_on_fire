// FILE: src/pages/facility/Diagnostics.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function FacilityDiagnostics() {
  return (
    <DashboardLayout items={NAV.facility} roleLabel={ROLE_LABEL.facility}>
      <div className="page-head">
        <h1>Diagnostics</h1>
      </div>
      <ComingSoon title="Diagnostics" phase="Phase 6 (Facility module)" />
    </DashboardLayout>
  );
}
