// FILE: src/pages/doctor/Appointments.jsx
//
// Real feature: live queue for today, sorted by token number. Starting
// a consultation opens the exact same Jitsi room the patient sees on
// their Online Consultation page (same deterministic room name, derived
// from the patient's own Patient ID) — no separate call-link sharing
// needed.

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import { listenToDoctorQueue, updateAppointmentStatus } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { roomNameForPatient, JITSI_DOMAIN } from "../../utils/videoRoom";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

const STATUS_BADGE = { waiting: "urgent", "in-progress": "normal", done: "fresh", cancelled: "stale" };

export default function DoctorAppointments() {
  const { profile, firebaseUser } = useAuth();
  const [queue, setQueue] = useState(null);
  const [activeCall, setActiveCall] = useState(null); // appointment currently in a call

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = listenToDoctorQueue(firebaseUser.uid, setQueue);
    return unsub;
  }, [firebaseUser]);

  async function handleStart(appointment) {
    await updateAppointmentStatus(appointment.id, "in-progress");
    setActiveCall(appointment);
  }

  async function handleFinish(appointment) {
    await updateAppointmentStatus(appointment.id, "done");
    setActiveCall(null);
  }

  if (activeCall) {
    const room = roomNameForPatient(activeCall.patientId);
    return (
      <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
        <div className="page-head">
          <h1>Consultation — Token #{activeCall.tokenNumber}</h1>
          <p className="sub">{activeCall.patientName} ({activeCall.patientId})</p>
        </div>

        <div className="video-call-frame">
          <iframe
            title="Consultation call"
            src={`https://${JITSI_DOMAIN}/${room}#config.prejoinPageEnabled=false&userInfo.displayName=${encodeURIComponent(profile?.name || "Doctor")}`}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
          />
        </div>

        <button className="btn-primary" style={{ width: "auto", marginTop: 16, padding: "12px 26px" }} onClick={() => handleFinish(activeCall)}>
          Finish &amp; Mark Done
        </button>
      </DashboardLayout>
    );
  }

  const waiting = queue?.filter((a) => a.status === "waiting") || [];
  const inProgress = queue?.filter((a) => a.status === "in-progress") || [];
  const done = queue?.filter((a) => a.status === "done") || [];

  return (
    <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
      <div className="page-head">
        <h1>Appointments</h1>
        <p className="sub">Today's queue, in token order.</p>
      </div>

      <div className="panel">
        <h3>Waiting <StatusBadge type="urgent" label={waiting.length} /></h3>
        {queue === null && <p className="panel-note">Loading…</p>}
        {queue !== null && waiting.length === 0 && <p className="panel-note">No one waiting right now.</p>}
        {waiting.map((a) => (
          <div key={a.id} className="medicine-result-row">
            <div>
              <div className="medicine-result-name">Token #{a.tokenNumber} — {a.patientName}</div>
              <div className="panel-note">{a.patientId}</div>
            </div>
            <button className="btn-primary" style={{ width: "auto", padding: "8px 18px" }} onClick={() => handleStart(a)}>
              Start Consultation
            </button>
          </div>
        ))}
      </div>

      {inProgress.length > 0 && (
        <div className="panel">
          <h3>In Progress</h3>
          {inProgress.map((a) => (
            <div key={a.id} className="medicine-result-row">
              <div>
                <div className="medicine-result-name">Token #{a.tokenNumber} — {a.patientName}</div>
              </div>
              <button className="btn-primary" style={{ width: "auto", padding: "8px 18px" }} onClick={() => setActiveCall(a)}>
                Rejoin Call
              </button>
            </div>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className="panel">
          <h3>Completed today</h3>
          {done.map((a) => (
            <div key={a.id} className="medicine-result-row">
              <div className="medicine-result-name">Token #{a.tokenNumber} — {a.patientName}</div>
              <StatusBadge type="fresh" label="Done" />
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}