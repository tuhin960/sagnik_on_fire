// FILE: src/pages/patient/Appointments.jsx
//
// Real feature: shows every appointment this patient requested/booked,
// and for today's accepted-but-still-waiting one, listens live to that
// doctor's queue to show how many patients are ahead. Also handles the
// newer "requested" (waiting on doctor) and "rejected" statuses.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import { listenToDoctorQueue, listenToPatientAppointments } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STATUS_BADGE = { requested: "normal", waiting: "urgent", "in-progress": "normal", done: "fresh", rejected: "stale", cancelled: "stale" };
const STATUS_LABEL = { requested: "Request sent", waiting: "Waiting", "in-progress": "In Progress", done: "Done", rejected: "Declined", cancelled: "Cancelled" };

export default function PatientAppointments() {
  const { firebaseUser } = useAuth();
  const [appointments, setAppointments] = useState(null);
  const [error, setError] = useState(null);
  const [aheadCount, setAheadCount] = useState(null);
  const [queueError, setQueueError] = useState(false);

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
  const requestedToday = appointments?.filter((a) => a.status === "requested") || [];
  const activeToday = appointments?.find((a) => a.date === today && a.status === "waiting");
  const liveToday = appointments?.find((a) => a.date === today && a.status === "in-progress");

  // For today's accepted-but-waiting appointment, live-track queue position.
  useEffect(() => {
    if (!activeToday) {
      setAheadCount(null);
      setQueueError(false);
      return;
    }
    setQueueError(false);
    const unsub = listenToDoctorQueue(
      activeToday.doctorUid,
      (queue) => {
        const ahead = queue.filter((q) => q.status === "waiting" && q.tokenNumber < activeToday.tokenNumber).length;
        setAheadCount(ahead);
      },
      () => setQueueError(true)
    );
    return unsub;
  }, [activeToday?.id, activeToday?.doctorUid, activeToday?.tokenNumber]);

  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>My Appointments</h1>
        <p className="sub">Every booking, updated live.</p>
      </div>

      {liveToday && (
        <div className="panel">
          <h3>Your consultation has started <StatusBadge type="normal" label="Live" /></h3>
          <p className="panel-note">Token #{liveToday.tokenNumber} — {liveToday.doctorName}</p>
          <Link
            to="/patient/online-consultation"
            className="btn-primary"
            style={{ display: "inline-block", width: "auto", marginTop: 12, padding: "10px 22px", textDecoration: "none" }}
          >
            Join call
          </Link>
        </div>
      )}

      {activeToday && (
        <div className="panel">
          <h3>Today's queue <StatusBadge type="urgent" label="Waiting" /></h3>
          <p className="panel-note">Token #{activeToday.tokenNumber} — {activeToday.doctorName}</p>
          <p className="panel-note">
            {queueError
              ? "Couldn't check the queue right now."
              : aheadCount === null
              ? "Checking queue…"
              : aheadCount === 0
              ? "You're next!"
              : `${aheadCount} patient${aheadCount === 1 ? "" : "s"} ahead of you`}
          </p>
        </div>
      )}

      {requestedToday.length > 0 && (
        <div className="panel">
          <h3>Sent, waiting for doctor</h3>
          {requestedToday.map((a) => (
            <div key={a.id} className="medicine-result-row">
              <div>
                <div className="medicine-result-name">{a.doctorName}</div>
                <div className="panel-note">Requested on {a.date}</div>
              </div>
              <StatusBadge type="normal" label="Request sent" />
            </div>
          ))}
        </div>
      )}

      <div className="panel">
        <h3>All bookings</h3>
        {error && <p className="panel-note">Couldn't load your appointments: {error}</p>}
        {appointments === null && !error && <p className="panel-note">Loading…</p>}
        {appointments?.length === 0 && (
          <div className="empty-state">
            <div className="big">No appointments yet</div>
            <p>Book one from Find Doctor.</p>
          </div>
        )}
        {appointments?.map((a) => (
          <div key={a.id} className="medicine-result-row">
            <div>
              <div className="medicine-result-name">{a.doctorName}</div>
              <div className="panel-note">{a.tokenNumber ? `Token #${a.tokenNumber} · ` : ""}{a.date}</div>
              {a.status === "rejected" && a.rejectReason && (
                <div className="panel-note">Reason: {a.rejectReason}</div>
              )}
            </div>
            <StatusBadge type={STATUS_BADGE[a.status] || "normal"} label={STATUS_LABEL[a.status] || a.status} />
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}