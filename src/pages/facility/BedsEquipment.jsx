// FILE: src/pages/facility/BedsEquipment.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function FacilityBedsEquipment() {
  return (
    <DashboardLayout items={NAV.facility} roleLabel={ROLE_LABEL.facility}>
      <div className="page-head">
        <h1>Beds & Critical Equipment</h1>
      </div>
      <ComingSoon title="Beds & Critical Equipment" phase="Phase 6 (Facility module)" />
    </DashboardLayout>
  );
}
