// FILE: src/pages/patient/Dashboard.jsx

import DashboardLayout from "../../components/common/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import StatusBadge from "../../components/common/StatusBadge";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function PatientDashboard() {
  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>Where you are in your care</h1>
        <p className="sub">A quick view of your current journey, referrals and upcoming visits.</p>
      </div>

      <div className="stat-grid">
        <StatCard icon="🗺️" label="Care Journey Stage" value="Referral Sent" meta="Updated 2 hours ago" tint="var(--amber-100)" />
        <StatCard icon="📨" label="Active Referral" value="1" meta="Awaiting facility acceptance" />
        <StatCard icon="📅" label="Upcoming Appointments" value="0" meta="Nothing scheduled" />
        <StatCard icon="🔔" label="Unread Notifications" value="2" tint="var(--teal-100)" />
      </div>

      <div className="panel">
        <h3>Current referral <StatusBadge type="demo" /></h3>
        <p className="panel-note">
          District Hospital, Howrah — <StatusBadge type="urgent" label="Sent" /> — awaiting acceptance.
        </p>
      </div>
    </DashboardLayout>
  );
}