// FILE: src/pages/patient/Profile.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function PatientProfile() {
  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>My Profile</h1>
      </div>
      <ComingSoon title="My Profile" phase="Phase 2 (Patient module)" />
    </DashboardLayout>
  );
}