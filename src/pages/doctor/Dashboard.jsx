// FILE: src/pages/doctor/Dashboard.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import StatusBadge from "../../components/common/StatusBadge";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function DoctorDashboard() {
  return (
    <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
      <div className="page-head">
        <h1>Today's consultations</h1>
        <p className="sub">Patients waiting, active referrals and follow-ups you own.</p>
      </div>

      <div className="stat-grid">
        <StatCard icon="🩺" label="Appointments Today" value="6" />
        <StatCard icon="📨" label="Referrals Awaiting Response" value="1" tint="var(--amber-100)" />
        <StatCard icon="📋" label="Patients Under Follow-up" value="9" />
        <StatCard icon="💊" label="Prescriptions Issued (7d)" value="21" />
      </div>

      <div className="panel">
        <h3>Referral you created <StatusBadge type="demo" /></h3>
        <p className="panel-note">
          Patient PAT-2026-4821 → District Hospital, Howrah — <StatusBadge type="urgent" label="Sent" /> · cardiology required.
        </p>
      </div>
    </DashboardLayout>
  );
}