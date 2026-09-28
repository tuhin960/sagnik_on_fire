// FILE: src/pages/patient/Dashboard.jsx
//
// Appointment cards and the "next appointment" panel are real-time
// (Firestore). Referral / care-journey / notification cards are still
// demo data because those modules aren't built yet, and are labelled so.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import StatusBadge from "../../components/common/StatusBadge";
import { listenToPatientAppointments } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STATUS_BADGE = { waiting: "urgent", "in-progress": "normal", done: "fresh", cancelled: "stale" };
const STATUS_LABEL = { waiting: "Waiting", "in-progress": "In Progress", done: "Done", cancelled: "Cancelled" };

export default function PatientDashboard() {
  const { profile, firebaseUser } = useAuth();
  const [appointments, setAppointments] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = listenToPatientAppointments(
      firebaseUser.uid,
      (list) => {
        setError(null);
        setAppointments(list);
      },
      (err) => setError(err.message || "Couldn't load your appointments.")
    );
    return unsub;
  }, [firebaseUser]);

  const today = todayKey();
  const upcoming = appointments?.filter((a) => a.status === "waiting" || a.status === "in-progress") || [];
  const completed = appointments?.filter((a) => a.status === "done") || [];
  const next = upcoming.find((a) => a.date === today) || upcoming[0];

  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>Where you are in your care</h1>
        <p className="sub">
          {profile?.name ? `Hello, ${profile.name}. ` : ""}A quick view of your current journey, referrals and upcoming visits.
        </p>
      </div>

      <div className="stat-grid">
        <StatCard icon="📅" label="Upcoming Appointments" value={appointments === null ? "…" : upcoming.length} meta={upcoming.length === 0 ? "Nothing scheduled" : "Waiting or in progress"} />
        <StatCard icon="✅" label="Completed Consultations" value={appointments === null ? "…" : completed.length} />
        <StatCard icon="🗺️" label="Care Journey Stage" value="Referral Sent" meta="Demo data" tint="var(--amber-100)" />
        <StatCard icon="🔔" label="Unread Notifications" value="2" meta="Demo data" tint="var(--teal-100)" />
      </div>

      <div className="panel">
        <h3>Next appointment</h3>
        {error && <p className="panel-note">Couldn't load your appointments: {error}</p>}
        {appointments === null && !error && <p className="panel-note">Loading…</p>}
        {appointments !== null && !next && (
          <div className="empty-state">
            <div className="big">No upcoming appointments</div>
            <p>Find a doctor and book a consultation.</p>
            <Link
              to="/patient/find-doctor"
              className="btn-primary"
              style={{ display: "inline-block", width: "auto", marginTop: 12, padding: "10px 22px", textDecoration: "none" }}
            >
              Find Doctor
            </Link>
          </div>
        )}
        {next && (
          <>
            <div className="medicine-result-row">
              <div>
                <div className="medicine-result-name">{next.doctorName}</div>
                <div className="panel-note">Token #{next.tokenNumber} · {next.date}</div>
              </div>
              <StatusBadge type={STATUS_BADGE[next.status] || "normal"} label={STATUS_LABEL[next.status] || next.status} />
            </div>
            <Link
              to={next.status === "in-progress" ? "/patient/online-consultation" : "/patient/appointments"}
              className="btn-primary"
              style={{ display: "inline-block", width: "auto", marginTop: 12, padding: "10px 22px", textDecoration: "none" }}
            >
              {next.status === "in-progress" ? "Join call" : "View my appointments"}
            </Link>
          </>
        )}
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