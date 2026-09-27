// FILE: src/pages/doctor/Notifications.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function DoctorNotifications() {
  return (
    <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
      <div className="page-head">
        <h1>Notifications</h1>
      </div>
      <ComingSoon title="Notifications" phase="Phase 5 (Doctor module)" />
    </DashboardLayout>
  );
}
