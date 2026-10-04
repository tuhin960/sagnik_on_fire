import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import { listenToDoctorConsultations, listenToDoctorQueue, finishConsultation, getUserProfile } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { roomNameForPatient, JITSI_DOMAIN } from "../../utils/videoRoom";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

const textareaStyle = {
  width: "100%", minHeight: 80, padding: "10px 12px", fontSize: 14, lineHeight: 1.5,
  border: "1px solid var(--line)", borderRadius: 8, fontFamily: "inherit", resize: "vertical",
  boxSizing: "border-box",
};

export default function DoctorConsultations() {
  const { profile, firebaseUser } = useAuth();
  const navigate = useNavigate();

  const [consultations, setConsultations] = useState(null);
  const [queue, setQueue] = useState(null);
  const [error, setError] = useState(null);
  const [patientProfiles, setPatientProfiles] = useState({});
  
  const [activeCall, setActiveCall] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [notes, setNotes] = useState({ diagnosis: "", advice: "", followUpDate: "" });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsubCons = listenToDoctorConsultations(
      firebaseUser.uid,
      (list) => { setError(null); setConsultations(list); },
      (err) => setError(err.message || "Couldn't load your consultations.")
    );
    const unsubQueue = listenToDoctorQueue(
      firebaseUser.uid,
      (list) => { setQueue(list); },
      (err) => console.error(err)
    );
    return () => { unsubCons(); unsubQueue(); };
  }, [firebaseUser]);

  const inProgress = queue?.filter(a => a.status === "in-progress") || [];

  useEffect(() => {
    const fetchProfiles = async () => {
      const allPatients = [...inProgress, ...(consultations || [])];
      let newProfiles = {};
      let changed = false;
      
      for (const a of allPatients) {
        if (a.patientUid && !patientProfiles[a.patientUid] && !newProfiles[a.patientUid]) {
          try {
            const p = await getUserProfile(a.patientUid);
            newProfiles[a.patientUid] = p;
            changed = true;
          } catch (e) {
            console.error(e);
          }
        }
      }
      
      if (changed) {
        setPatientProfiles(prev => ({ ...prev, ...newProfiles }));
      }
    };
    fetchProfiles();
  }, [inProgress, consultations]); // Removed patientProfiles from deps to prevent infinite loops
  const activeNow = activeCall || inProgress.find((a) => a.id === activeCall?.id);

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

  if (activeNow) {
    const room = roomNameForPatient(activeNow.patientId);
    return (
      <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
        <div className="page-head">
          <h1>Consultation — Token #{activeNow.tokenNumber}</h1>
          <p className="sub">{activeNow.patientName} ({activeNow.patientId})</p>
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

  return (
    <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
      <div className="page-head">
        <h1>Consultation Dashboard</h1>
        <p className="sub">Join active calls and view past consultation records.</p>
      </div>

      <div className="panel">
        <h3 style={{ marginBottom: 16 }}>Active Consultations</h3>
        {inProgress.length === 0 ? (
          <p className="panel-note">You don't have any active consultations. Schedule one from the Appointments tab.</p>
        ) : (
          inProgress.map((a) => {
            const timeStr = a.scheduledTime?.toDate ? a.scheduledTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Time not set";
            const p = patientProfiles[a.patientUid];
            const ageDisplay = p?.age ? p.age : "Not set";
            
            return (
              <div key={a.id} className="medicine-result-row">
                <div>
                  <div className="medicine-result-name">
                    {timeStr && <span style={{ color: "var(--teal-700)", marginRight: 8 }}>{timeStr}</span>}
                    Token #{a.tokenNumber} — {a.patientName}
                    <span style={{ fontWeight: "normal", color: "var(--grey-600)", marginLeft: 6 }}>(Age: {ageDisplay})</span>
                  </div>
                  <div className="panel-note">Patient ID: {a.patientId}</div>
                  <div className="panel-note" style={{ marginTop: 4 }}>
                    {a.joinCode ? `Join Code sent: ${a.joinCode}` : "No code generated (legacy appointment)"}
                  </div>
                </div>
                <button className="btn-primary" style={{ width: "auto", padding: "8px 18px" }} onClick={() => setActiveCall(a)}>
                  Start Call
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="panel">
        <h3 style={{ marginBottom: 16 }}>Past Consultations</h3>
        {error && <p className="panel-note">Couldn't load consultations: {error}</p>}
        {consultations === null && !error && <p className="panel-note">Loading…</p>}
        {consultations !== null && consultations.length === 0 && (
          <div className="empty-state">
            <div className="big">No consultations yet</div>
            <p>Notes you save after finishing a call will show up here.</p>
          </div>
        )}

        {consultations?.map((c) => {
          const timeStr = c.createdAt?.toDate ? c.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Time not set";
          const p = patientProfiles[c.patientUid];
          const ageDisplay = p?.age ? p.age : "Not set";
          
          return (
            <div key={c.id} className="panel" style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <h3 style={{ marginBottom: 2 }}>
                    {timeStr && <span style={{ color: "var(--teal-700)", marginRight: 8 }}>{timeStr}</span>}
                    {c.patientName}
                    <span style={{ fontWeight: "normal", color: "var(--grey-600)", fontSize: "0.9em", marginLeft: 8 }}>(Age: {ageDisplay})</span>
                  </h3>
                  <p className="panel-note">{c.patientId} · {c.date}{c.tokenNumber ? ` · Token #${c.tokenNumber}` : ""}</p>
                </div>
                <button
                  className="btn-primary"
                  style={{ width: "auto", padding: "8px 18px" }}
                  onClick={() => navigate("/doctor/patient-details", { state: { patientUid: c.patientUid, patientName: c.patientName, patientId: c.patientId } })}
                >
                  Open Patient
                </button>
              </div>
              {c.diagnosis && <p style={{ marginTop: 8 }}><strong>Diagnosis:</strong> {c.diagnosis}</p>}
              {c.advice && <p><strong>Advice:</strong> {c.advice}</p>}
              {c.followUpDate && <p><strong>Follow-up:</strong> {c.followUpDate}</p>}
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}