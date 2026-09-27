// FILE: src/pages/facility/Dashboard.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import StatusBadge from "../../components/common/StatusBadge";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function FacilityDashboard() {
  return (
    <DashboardLayout items={NAV.facility} roleLabel={ROLE_LABEL.facility}>
      <div className="page-head">
        <h1>Facility overview</h1>
        <p className="sub">Incoming referrals and current resource status — District Hospital, Howrah.</p>
      </div>

      <div className="stat-grid">
        <StatCard icon="📨" label="Incoming Referrals" value="3" tint="var(--amber-100)" />
        <StatCard icon="🛏️" label="General Beds" value="24 available" meta="Updated 8 minutes ago" />
        <StatCard icon="🚨" label="ICU Beds" value="2 available" meta="Updated 4 hours ago" tint="var(--red-100)" />
        <StatCard icon="🏥" label="Admitted Patients" value="47" />
      </div>

      <div className="panel">
        <h3>Resource freshness <StatusBadge type="demo" /></h3>
        <p className="panel-note">
          General beds <StatusBadge type="fresh" /> &nbsp;·&nbsp; ICU beds <StatusBadge type="stale" />
        </p>
        <p className="panel-note">
          Stale resource data can lead to unsafe referrals — ICU count needs re-confirmation before it's used for matching.
        </p>
      </div>
    </DashboardLayout>
  );
}