// FILE: src/pages/pharmacy/Notifications.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function PharmacyNotifications() {
  return (
    <DashboardLayout items={NAV.pharmacy} roleLabel={ROLE_LABEL.pharmacy}>
      <div className="page-head">
        <h1>Notifications</h1>
      </div>
      <ComingSoon title="Notifications" phase="Phase 3 (Pharmacy module)" />
    </DashboardLayout>
  );
}