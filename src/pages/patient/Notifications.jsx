// FILE: src/pages/patient/Notifications.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function PatientNotifications() {
  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>Notifications</h1>
      </div>
      <ComingSoon title="Notifications" phase="Phase 3 (Patient module)" />
    </DashboardLayout>
  );
}
