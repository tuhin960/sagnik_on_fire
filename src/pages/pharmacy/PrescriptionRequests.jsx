// FILE: src/pages/pharmacy/PrescriptionRequests.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function PharmacyPrescriptionRequests() {
  return (
    <DashboardLayout items={NAV.pharmacy} roleLabel={ROLE_LABEL.pharmacy}>
      <div className="page-head">
        <h1>Prescription Requests</h1>
      </div>
      <ComingSoon title="Prescription Requests" phase="Phase 5 (Pharmacy module)" />
    </DashboardLayout>
  );
}