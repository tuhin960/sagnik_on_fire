// FILE: src/pages/patient/Dashboard.jsx
//
// Appointment cards and the "next appointment" panel are real-time
// (Firestore). "Upcoming" now also counts sent-but-not-yet-accepted
// requests. Referral / care-journey / notification cards are still
// demo data because those modules aren't built yet, and are labelled so.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import StatusBadge from "../../components/common/StatusBadge";
import { listenToPatientAppointments, sendEmergencyAlert, listenToPatientReferrals } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STATUS_BADGE = { requested: "normal", waiting: "urgent", "in-progress": "normal", done: "fresh", rejected: "stale", cancelled: "stale" };
const STATUS_LABEL = { requested: "Request sent", waiting: "Waiting", "in-progress": "In Progress", done: "Done", rejected: "Declined", cancelled: "Cancelled" };

export default function PatientDashboard() {
  const { profile, firebaseUser } = useAuth();
  const [appointments, setAppointments] = useState(null);
  const [referrals, setReferrals] = useState(null);
  const [error, setError] = useState(null);
  
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertSent, setAlertSent] = useState(false);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub1 = listenToPatientAppointments(
      firebaseUser.uid,
      (list) => { setError(null); setAppointments(list); },
      (err) => setError(err.message || "Couldn't load your appointments.")
    );
    const unsub2 = listenToPatientReferrals(
      firebaseUser.uid,
      (list) => { setReferrals(list); },
      (err) => console.error("Couldn't load referrals.", err)
    );
    return () => { unsub1(); unsub2(); };
  }, [firebaseUser]);

  const handleEmergency = async () => {
    if (window.confirm("Are you sure you want to raise an emergency alert to doctors in your area?")) {
      setSendingAlert(true);
      try {
        await sendEmergencyAlert({
          patientUid: firebaseUser.uid,
          patientName: profile?.name || "Unknown",
          patientId: profile?.patientId || firebaseUser.uid.substring(0, 8),
          message: "Patient requires immediate emergency help!"
        });
        setAlertSent(true);
        setTimeout(() => setAlertSent(false), 5000);
      } catch (err) {
        console.error(err);
        alert("Failed to send emergency alert.");
      }
      setSendingAlert(false);
    }
  };

  const today = todayKey();
  const upcoming = appointments?.filter((a) => a.status === "requested" || a.status === "waiting" || a.status === "in-progress") || [];
  const completed = appointments?.filter((a) => a.status === "done") || [];
  // Prefer whichever needs attention first: live call > today's waiting slot > oldest pending request.
  const next =
    upcoming.find((a) => a.status === "in-progress") ||
    upcoming.find((a) => a.date === today && a.status === "waiting") ||
    upcoming[0];

  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1>Where you are in your care</h1>
          <p className="sub">
            {profile?.name ? `Hello, ${profile.name}. ` : ""}A quick view of your current journey, referrals and upcoming visits.
          </p>
        </div>
        <div>
          <button 
            className="btn-primary" 
            style={{ backgroundColor: "var(--red-600)", color: "white", padding: "12px 24px", fontSize: "16px", width: "auto", border: "none" }}
            onClick={handleEmergency}
            disabled={sendingAlert || alertSent}
          >
            {sendingAlert ? "Sending..." : alertSent ? "Emergency Alert Sent!" : "🚨 Raise Emergency Help"}
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard icon="📅" label="Upcoming Appointments" value={appointments === null ? "…" : upcoming.length} meta={upcoming.length === 0 ? "Nothing scheduled" : "Requested, waiting or in progress"} />
        <StatCard icon="✅" label="Completed Consultations" value={appointments === null ? "…" : completed.length} />
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
                <div className="panel-note">{next.tokenNumber ? `Token #${next.tokenNumber} · ` : ""}{next.date}</div>
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
