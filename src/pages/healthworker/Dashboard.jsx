// FILE: src/pages/healthworker/Dashboard.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import StatusBadge from "../../components/common/StatusBadge";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function HealthWorkerDashboard() {
  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Today's field priorities</h1>
        <p className="sub">Assigned patients, pending assessments and follow-ups due.</p>
      </div>

      <div className="stat-grid">
        <StatCard icon="🧑‍🤝‍🧑" label="Assigned Patients" value="18" />
        <StatCard icon="⏰" label="Pending Follow-ups" value="4" tint="var(--amber-100)" />
        <StatCard icon="📨" label="Referrals In Progress" value="2" />
        <StatCard icon="📶" label="Pending Sync" value="3" meta="Will sync when online" tint="var(--red-100)" />
      </div>

      <div className="panel">
        <h3>Follow-up due today <StatusBadge type="demo" /></h3>
        <p className="panel-note">
          Rekha Devi, PAT-2026-4821 — discharged 3 days ago, post-referral check-in due.
        </p>
      </div>
    </DashboardLayout>
  );
}