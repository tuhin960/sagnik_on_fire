// FILE: src/pages/pharmacy/PharmacyDetails.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function PharmacyDetails() {
  return (
    <DashboardLayout items={NAV.pharmacy} roleLabel={ROLE_LABEL.pharmacy}>
      <div className="page-head">
        <h1>Pharmacy Details</h1>
      </div>
      <ComingSoon title="Pharmacy Details" phase="Phase 2 (Pharmacy module)" />
    </DashboardLayout>
  );
}