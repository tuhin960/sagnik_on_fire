// FILE: src/pages/patient/Appointments.jsx
//
// Real feature: shows every appointment this patient booked, and for
// today's still-waiting one, listens live to that doctor's queue to
// show how many patients are still ahead — updates automatically as
// the doctor moves through tokens (no refresh needed).

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import { listenToDoctorQueue, listenToPatientAppointments } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STATUS_BADGE = { waiting: "urgent", "in-progress": "normal", done: "fresh", cancelled: "stale" };

export default function PatientAppointments() {
  const { firebaseUser } = useAuth();
  const [appointments, setAppointments] = useState(null);
  const [aheadCount, setAheadCount] = useState(null);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = listenToPatientAppointments(firebaseUser.uid, setAppointments);
    return unsub;
  }, [firebaseUser]);

  // For today's still-waiting appointment, live-track queue position.
  useEffect(() => {
    const today = todayKey();
    const active = appointments?.find((a) => a.date === today && a.status === "waiting");
    if (!active) {
      setAheadCount(null);
      return;
    }
    const unsub = listenToDoctorQueue(active.doctorUid, (queue) => {
      const ahead = queue.filter((q) => q.status === "waiting" && q.tokenNumber < active.tokenNumber).length;
      setAheadCount(ahead);
    });
    return unsub;
  }, [appointments]);

  const today = todayKey();
  const activeToday = appointments?.find((a) => a.date === today && a.status === "waiting");

  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>My Appointments</h1>
      </div>

      {activeToday && (
        <div className="panel">
          <h3>Today's queue <StatusBadge type="urgent" label="Waiting" /></h3>
          <p className="panel-note">Token #{activeToday.tokenNumber} — {activeToday.doctorName}</p>
          <p className="panel-note">
            {aheadCount === null ? "Checking queue…" : aheadCount === 0 ? "You're next!" : `${aheadCount} patient${aheadCount === 1 ? "" : "s"} ahead of you`}
          </p>
        </div>
      )}

      <div className="panel">
        <h3>All bookings</h3>
        {appointments === null && <p className="panel-note">Loading…</p>}
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
              <div className="panel-note">Token #{a.tokenNumber} · {a.date}</div>
            </div>
            <StatusBadge type={STATUS_BADGE[a.status] || "normal"} label={a.status} />
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}