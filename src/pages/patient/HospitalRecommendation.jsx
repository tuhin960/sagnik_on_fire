// FILE: src/pages/patient/HospitalRecommendation.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function PatientHospitalRecommendation() {
  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>Hospital Recommendation</h1>
      </div>
      <ComingSoon title="Hospital Recommendation" phase="Phase 4 (Patient module)" />
    </DashboardLayout>
  );
}