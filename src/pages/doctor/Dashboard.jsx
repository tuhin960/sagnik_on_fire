// FILE: src/pages/doctor/Dashboard.jsx
//
// Real-time doctor dashboard. Two separate live feeds:
//   - requests  (status "requested") -> needs the doctor's attention
//   - queue     (status waiting/in-progress/done, today) -> the day's work

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import StatusBadge from "../../components/common/StatusBadge";
import { listenToDoctorQueue, listenToDoctorRequests, listenToOpenAlerts, acknowledgeAlert } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

const STATUS_BADGE = { waiting: "urgent", "in-progress": "normal", done: "fresh", cancelled: "stale" };
const STATUS_LABEL = { waiting: "Waiting", "in-progress": "In Progress", done: "Done", cancelled: "Cancelled" };

export default function DoctorDashboard() {
  const { profile, firebaseUser } = useAuth();
  const [queue, setQueue] = useState(null);
  const [requests, setRequests] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = listenToDoctorQueue(
      firebaseUser.uid,
      (list) => { setError(null); setQueue(list); },
      (err) => setError(err.message || "Couldn't load today's appointments.")
    );
    return unsub;
  }, [firebaseUser]);

  useEffect(() => {
    const unsub = listenToOpenAlerts((list) => {
      setAlerts(list);
    }, console.error);
    return unsub;
  }, []);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = listenToDoctorRequests(firebaseUser.uid, setRequests);
    return unsub;
  }, [firebaseUser]);

  // listenToDoctorQueue matches on today's date only, so "requested"
  // appointments (which also carry today's date) can appear in it too —
  // filter those out here, Patient Requests is where they belong.
  const today = queue?.filter((a) => a.status !== "requested") || [];
  const total = today.length;
  const waiting = today.filter((a) => a.status === "waiting");
  const inProgress = today.filter((a) => a.status === "in-progress");
  const done = today.filter((a) => a.status === "done");

  return (
    <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
      <div className="page-head">
        <h1>Today's consultations</h1>
        <p className="sub">
          {profile?.name ? `${profile.name} — ` : ""}
          {profile?.specialization || "Doctor"} · live queue, updates automatically.
        </p>
      </div>

      {alerts.length > 0 && (
        <div className="panel panel-danger" style={{ backgroundColor: "var(--red-50)" }}>
          <h2 style={{ margin: 0, color: "var(--red-700)", display: "flex", alignItems: "center", gap: "8px", fontSize: 18 }}>
            <span style={{ fontSize: "1.2em" }}>🚨</span> Emergency Alerts ({alerts.length})
          </h2>
          {alerts.map(alert => (
            <div key={alert.id} style={{ marginTop: 12, padding: "12px", backgroundColor: "white", borderRadius: "8px", border: "1px solid var(--red-200)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0, color: "var(--red-700)", fontSize: 16 }}>{alert.patientName}</h3>
                  <p style={{ margin: "4px 0 0 0", color: "var(--grey-800)" }}>{alert.message}</p>
                  <p className="panel-note" style={{ marginTop: 4 }}>
                    {alert.createdAt?.toDate ? alert.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                  </p>
                </div>
                <button 
                  className="btn-primary" 
                  style={{ backgroundColor: "var(--red-600)", border: "none", padding: "8px 16px", width: "auto" }}
                  onClick={() => acknowledgeAlert(alert.id, profile?.name || "Doctor")}
                >
                  Acknowledge & Help
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {requests !== null && requests.length > 0 && (
        <div className="panel panel-warning">
          <h2 style={{ fontSize: 18, margin: "0 0 8px 0" }}>📋 {requests.length} new patient request{requests.length === 1 ? "" : "s"} waiting</h2>
          <p className="panel-note">Review the AI summary and accept or reject each one.</p>
          <div style={{ textAlign: "right" }}>
            <Link
              to="/doctor/patient-requests"
              className="btn-primary"
              style={{ display: "inline-block", width: "auto", marginTop: 10, padding: "10px 22px", textDecoration: "none" }}
            >
              Open Patient Requests
            </Link>
          </div>
        </div>
      )}

      <div className="stat-grid">
        <StatCard icon="📅" label="Appointments Today" value={queue === null ? "…" : total} />
        <StatCard icon="⏳" label="Waiting" value={queue === null ? "…" : waiting.length} tint="var(--amber-100)" />
        <StatCard icon="🩺" label="In Consultation" value={queue === null ? "…" : inProgress.length} />
        <StatCard icon="✅" label="Completed" value={queue === null ? "…" : done.length} />
      </div>

      <div className="panel">
        <h2 style={{ fontSize: 18, margin: "0 0 12px 0" }}>Today's queue</h2>

        {error && <p className="panel-note">Couldn't load appointments: {error}</p>}
        {queue === null && !error && <p className="panel-note">Loading…</p>}
        {queue !== null && today.length === 0 && (
          <p className="panel-note">No appointments booked for today yet.</p>
        )}

        {today.map((a) => (
          <div key={a.id} className="medicine-result-row">
            <div>
              <div className="medicine-result-name">Token #{a.tokenNumber} — {a.patientName}</div>
              <div className="panel-note">{a.patientId}</div>
            </div>
            <StatusBadge type={STATUS_BADGE[a.status] || "normal"} label={STATUS_LABEL[a.status] || a.status} />
          </div>
        ))}

        {today.length > 0 && (
          <div style={{ textAlign: "right" }}>
            <Link to="/doctor/appointments" className="btn-primary" style={{ display: "inline-block", width: "auto", marginTop: 14, padding: "10px 22px", textDecoration: "none" }}>
              Open Appointments to start a call
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}