// FILE: src/pages/facility/Medicines.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function FacilityMedicines() {
  return (
    <DashboardLayout items={NAV.facility} roleLabel={ROLE_LABEL.facility}>
      <div className="page-head">
        <h1>Medicines</h1>
      </div>
      <ComingSoon title="Medicines" phase="Phase 6 (Facility module)" />
    </DashboardLayout>
  );
}
