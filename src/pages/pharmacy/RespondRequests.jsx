// FILE: src/pages/pharmacy/RespondRequests.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import ComingSoon from "../../components/common/ComingSoon";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function PharmacyRespondRequests() {
  return (
    <DashboardLayout items={NAV.pharmacy} roleLabel={ROLE_LABEL.pharmacy}>
      <div className="page-head">
        <h1>Accept / Respond to Requests</h1>
      </div>
      <ComingSoon title="Accept / Respond to Requests" phase="Phase 5 (Pharmacy module)" />
    </DashboardLayout>
  );
}