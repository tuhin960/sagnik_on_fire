// FILE: src/pages/doctor/Appointments.jsx
//
// Real feature: live queue for today, sorted by token number. Starting
// a consultation opens the exact same Jitsi room the patient sees on
// their Online Consultation page (same deterministic room name, derived
// from the patient's own Patient ID) — no separate call-link sharing
// needed. Finishing a call now records diagnosis/advice/follow-up notes
// (finishConsultation) instead of just flipping the status.

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import { listenToDoctorQueue, finishConsultation, generateConsultationCode } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { roomNameForPatient, JITSI_DOMAIN } from "../../utils/videoRoom";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";
import { updateAppointmentStatus } from "../../firebase/firestore";

const textareaStyle = {
  width: "100%", minHeight: 80, padding: "10px 12px", fontSize: 14, lineHeight: 1.5,
  border: "1px solid var(--line)", borderRadius: 8, fontFamily: "inherit", resize: "vertical",
  boxSizing: "border-box",
};

export default function DoctorAppointments() {
  const { profile, firebaseUser } = useAuth();
  const [queue, setQueue] = useState(null);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [busyId, setBusyId] = useState(null); // appointment being updated
  const [activeCall, setActiveCall] = useState(null); // appointment currently in a call
  const [finishing, setFinishing] = useState(false); // notes-form open
  const [notes, setNotes] = useState({ diagnosis: "", advice: "", followUpDate: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = listenToDoctorQueue(
      firebaseUser.uid,
      (list) => {
        setError(null);
        setQueue(list);
      },
      (err) => setError(err.message || "Couldn't load today's queue.")
    );
    return unsub;
  }, [firebaseUser]);

  const [scheduleTime, setScheduleTime] = useState({});
  const [generatedCodes, setGeneratedCodes] = useState({});

  async function handleSchedule(appointment) {
    if (!scheduleTime[appointment.id]) {
      setActionError("Please select a time first.");
      return;
    }
    setActionError(null);
    setBusyId(appointment.id);
    try {
      const code = await generateConsultationCode(
        appointment.id, 
        appointment.patientUid, 
        profile?.name || "Doctor", 
        scheduleTime[appointment.id]
      );
      setGeneratedCodes(prev => ({ ...prev, [appointment.id]: code }));
    } catch (err) {
      console.error("handleSchedule failed:", err);
      setActionError(err.message || "Couldn't generate join code. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  function handleRejoin(appointment) {
    setActiveCall(appointment);
  }

  async function handleSaveAndFinish() {
    setActionError(null);
    setSaving(true);
    try {
      await finishConsultation({
        appointmentId: activeCall.id,
        doctorUid: firebaseUser.uid,
        doctorName: profile?.name || "Doctor",
        patientUid: activeCall.patientUid,
        patientName: activeCall.patientName,
        patientId: activeCall.patientId,
        tokenNumber: activeCall.tokenNumber,
        diagnosis: notes.diagnosis.trim(),
        advice: notes.advice.trim(),
        followUpDate: notes.followUpDate,
      });
      setActiveCall(null);
      setFinishing(false);
      setNotes({ diagnosis: "", advice: "", followUpDate: "" });
    } catch (err) {
      console.error("finishConsultation failed:", err);
      setActionError(err.message || "Couldn't save the consultation notes. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (activeCall && finishing) {
    return (
      <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
        <div className="page-head">
          <h1>Consultation notes — Token #{activeCall.tokenNumber}</h1>
          <p className="sub">{activeCall.patientName} ({activeCall.patientId})</p>
        </div>

        <div className="panel">
          <div className="field">
            <label>Diagnosis / impression</label>
            <textarea style={textareaStyle} value={notes.diagnosis} onChange={(e) => setNotes((n) => ({ ...n, diagnosis: e.target.value }))} placeholder="e.g. Acute gastritis" />
          </div>
          <div className="field">
            <label>Advice for the patient</label>
            <textarea style={textareaStyle} value={notes.advice} onChange={(e) => setNotes((n) => ({ ...n, advice: e.target.value }))} placeholder="Medicines, rest, diet, warning signs to watch for…" />
          </div>
          <div className="field">
            <label>Follow-up date (optional)</label>
            <input type="date" value={notes.followUpDate} onChange={(e) => setNotes((n) => ({ ...n, followUpDate: e.target.value }))} />
          </div>

          {actionError && <p className="form-error">{actionError}</p>}

          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <button className="btn-primary" style={{ width: "auto", padding: "12px 26px" }} disabled={saving} onClick={handleSaveAndFinish}>
              {saving ? "Saving…" : "Save & Mark Done"}
            </button>
            <button className="btn-logout" style={{ padding: "12px 20px" }} disabled={saving} onClick={() => setFinishing(false)}>
              Back to call
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
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

        {actionError && <p className="panel-note" style={{ marginTop: 12 }}>{actionError}</p>}

        <button
          className="btn-primary"
          style={{ width: "auto", marginTop: 16, padding: "12px 26px" }}
          onClick={() => setFinishing(true)}
        >
          Finish & Add Notes
        </button>
      </DashboardLayout>
    );
  }

  // "requested" appointments also carry today's date, so listenToDoctorQueue
  // can include them — they belong on Patient Requests, not here.
  const today = queue?.filter((a) => a.status !== "requested") || [];
  const waiting = today.filter((a) => a.status === "waiting");
  const inProgress = today.filter((a) => a.status === "in-progress");
  const done = today.filter((a) => a.status === "done");

  return (
    <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
      <div className="page-head">
        <h1>Appointments</h1>
        <p className="sub">Schedule waiting patients and generate join codes.</p>
      </div>

      {actionError && (
        <div className="panel">
          <p className="panel-note">{actionError}</p>
        </div>
      )}

      <div className="panel">
        <h3>Waiting <StatusBadge type="urgent" label={waiting.length} /></h3>
        {error && <p className="panel-note">Couldn't load the queue: {error}</p>}
        {queue === null && !error && <p className="panel-note">Loading…</p>}
        {queue !== null && waiting.length === 0 && <p className="panel-note">No one waiting right now.</p>}
        {waiting.map((a) => (
          <div key={a.id} className="medicine-result-row">
            <div>
              <div className="medicine-result-name">Token #{a.tokenNumber} — {a.patientName}</div>
              <div className="panel-note">{a.patientId}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {generatedCodes[a.id] ? (
                <div style={{ color: "var(--teal-700)", fontWeight: "bold" }}>
                  Code: {generatedCodes[a.id]}
                </div>
              ) : (
                <>
                  <input 
                    type="time" 
                    value={scheduleTime[a.id] || ""} 
                    onChange={e => setScheduleTime(prev => ({ ...prev, [a.id]: e.target.value }))}
                    style={{ padding: "6px", borderRadius: 4, border: "1px solid var(--line)" }}
                  />
                  <button
                    className="btn-primary"
                    style={{ width: "auto", padding: "8px 18px" }}
                    disabled={busyId === a.id}
                    onClick={() => handleSchedule(a)}
                  >
                    {busyId === a.id ? "Generating..." : "Generate Join Code"}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

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