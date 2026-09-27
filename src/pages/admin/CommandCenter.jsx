// FILE: src/pages/admin/CommandCenter.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import StatusBadge from "../../components/common/StatusBadge";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function CommandCenter() {
  return (
    <DashboardLayout items={NAV.admin} roleLabel={ROLE_LABEL.admin}>
      <div className="page-head">
        <h1>District network status</h1>
        <p className="sub">Live view across facilities, referrals and care team activity.</p>
      </div>

      <div className="stat-grid">
        <StatCard icon="🚨" label="Active Emergency Referrals" value="5" tint="var(--red-100)" />
        <StatCard icon="🏥" label="Facilities Online" value="11 / 12" />
        <StatCard icon="🧑‍⚕️" label="Care Team Members" value="64" />
        <StatCard icon="⏰" label="Pending Follow-ups" value="27" tint="var(--amber-100)" />
      </div>

      <div className="panel">
        <h3>Network alerts <StatusBadge type="demo" /></h3>
        <p className="panel-note">
          PHC Domjur — resource data <StatusBadge type="stale" /> not updated in 6 hours.
        </p>
      </div>
    </DashboardLayout>
  );
}