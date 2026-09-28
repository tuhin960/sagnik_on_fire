// FILE: src/pages/doctor/Dashboard.jsx
//
// Real-time doctor dashboard: every appointment a patient books for
// this doctor (today) shows up here instantly, with live counts.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import StatusBadge from "../../components/common/StatusBadge";
import { listenToDoctorQueue } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

const STATUS_BADGE = { waiting: "urgent", "in-progress": "normal", done: "fresh", cancelled: "stale" };
const STATUS_LABEL = { waiting: "Waiting", "in-progress": "In Progress", done: "Done", cancelled: "Cancelled" };

export default function DoctorDashboard() {
  const { profile, firebaseUser } = useAuth();
  const [queue, setQueue] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = listenToDoctorQueue(
      firebaseUser.uid,
      (list) => {
        setError(null);
        setQueue(list);
      },
      (err) => setError(err.message || "Couldn't load today's appointments.")
    );
    return unsub;
  }, [firebaseUser]);

  const total = queue?.length ?? 0;
  const waiting = queue?.filter((a) => a.status === "waiting") || [];
  const inProgress = queue?.filter((a) => a.status === "in-progress") || [];
  const done = queue?.filter((a) => a.status === "done") || [];

  return (
    <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
      <div className="page-head">
        <h1>Today's consultations</h1>
        <p className="sub">
          {profile?.name ? `${profile.name} — ` : ""}
          {profile?.specialization || "Doctor"} · live queue, updates automatically.
        </p>
      </div>

      <div className="stat-grid">
        <StatCard icon="🩺" label="Appointments Today" value={queue === null ? "…" : total} />
        <StatCard icon="⏳" label="Waiting" value={queue === null ? "…" : waiting.length} tint="var(--amber-100)" />
        <StatCard icon="📹" label="In Consultation" value={queue === null ? "…" : inProgress.length} />
        <StatCard icon="✅" label="Completed" value={queue === null ? "…" : done.length} />
      </div>

      <div className="panel">
        <h3>Today's queue</h3>

        {error && <p className="panel-note">Couldn't load appointments: {error}</p>}
        {queue === null && !error && <p className="panel-note">Loading…</p>}
        {queue !== null && queue.length === 0 && (
          <p className="panel-note">No appointments booked for today yet.</p>
        )}

        {queue?.map((a) => (
          <div key={a.id} className="medicine-result-row">
            <div>
              <div className="medicine-result-name">Token #{a.tokenNumber} — {a.patientName}</div>
              <div className="panel-note">{a.patientId}</div>
            </div>
            <StatusBadge type={STATUS_BADGE[a.status] || "normal"} label={STATUS_LABEL[a.status] || a.status} />
          </div>
        ))}

        {queue !== null && queue.length > 0 && (
          <Link to="/doctor/appointments" className="btn-primary" style={{ display: "inline-block", width: "auto", marginTop: 14, padding: "10px 22px", textDecoration: "none" }}>
            Open Appointments to start a call
          </Link>
        )}
      </div>
    </DashboardLayout>
  );
}