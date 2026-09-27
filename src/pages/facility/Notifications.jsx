// FILE: src/pages/facility/Notifications.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function FacilityNotifications() {
  return (
    <DashboardLayout items={NAV.facility} roleLabel={ROLE_LABEL.facility}>
      <div className="page-head">
        <h1>Notifications</h1>
      </div>
      <ComingSoon title="Notifications" phase="Phase 6 (Facility module)" />
    </DashboardLayout>
  );
}
