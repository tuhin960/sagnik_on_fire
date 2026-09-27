// FILE: src/pages/facility/ResourceAvailability.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function FacilityResourceAvailability() {
  return (
    <DashboardLayout items={NAV.facility} roleLabel={ROLE_LABEL.facility}>
      <div className="page-head">
        <h1>Resource Availability</h1>
      </div>
      <ComingSoon title="Resource Availability" phase="Phase 6 (Facility module)" />
    </DashboardLayout>
  );
}
