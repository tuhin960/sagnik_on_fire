// FILE: src/pages/patient/BookAppointment.jsx
//
// Step 3: patient describes the problem (typing or voice, in their own
// language) -> AI turns it into an English medical summary -> patient
// reviews it -> sends a REQUEST to the doctor. No token is issued here;
// the token is assigned only when the doctor accepts (Patient Requests).
//
// The AI never diagnoses — it only translates and structures. The
// original text is always saved next to the summary.

import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import { requestAppointment } from "../../firebase/firestore";
import { summarizeIntake } from "../../utils/intakeApi";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

const LANGUAGES = [
  { label: "বাংলা (Bengali)", name: "Bengali", speech: "bn-IN" },
  { label: "हिन्दी (Hindi)", name: "Hindi", speech: "hi-IN" },
  { label: "English", name: "English", speech: "en-IN" },
];

const SEVERITY_BADGE = { mild: "normal", moderate: "urgent", severe: "emergency", unspecified: "normal" };

const SpeechRecognition =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

const textareaStyle = {
  width: "100%", minHeight: 130, padding: "12px 14px", fontSize: 15, lineHeight: 1.5,
  border: "1px solid var(--line)", borderRadius: 10, fontFamily: "inherit", resize: "vertical",
  boxSizing: "border-box",
};

export default function PatientBookAppointment() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { profile, firebaseUser } = useAuth();

  const [langIdx, setLangIdx] = useState(0);
  const [text, setText] = useState("");
  const [consent, setConsent] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState(null);

  const [step, setStep] = useState("write"); // write | review | sent
  const [working, setWorking] = useState(false); // summarizing or sending
  const [error, setError] = useState(null);
  const [ai, setAi] = useState(null); // { language, summary, hasRedFlags } or null if AI unavailable

  const recognitionRef = useRef(null);
  useEffect(() => () => recognitionRef.current?.abort?.(), []);

  if (!state?.doctorUid) {
    return (
      <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
        <div className="page-head">
          <h1>Book Appointment</h1>
        </div>
        <div className="empty-state">
          <div className="big">No doctor selected</div>
          <p>Pick a doctor from Find Doctor first.</p>
          <button className="btn-primary" style={{ width: "auto", marginTop: 14, padding: "12px 26px" }} onClick={() => navigate("/patient/find-doctor")}>
            Go to Find Doctor
          </button>
        </div>
      </DashboardLayout>
    );
  }

  function toggleVoice() {
    setVoiceError(null);
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = LANGUAGES[langIdx].speech;
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const spoken = Array.from(e.results).map((r) => r[0].transcript).join(" ").trim();
      if (spoken) setText((prev) => (prev ? `${prev} ${spoken}` : spoken));
    };
    rec.onerror = (e) => {
      setListening(false);
      setVoiceError(
        e.error === "not-allowed"
          ? "Microphone permission is blocked. Allow it in the browser, or type instead."
          : "Couldn't hear that clearly. Try again or type instead."
      );
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  }

  async function handleSummarize() {
    setError(null);
    if (!text.trim()) return setError("Please describe your problem first.");
    if (!consent) return setError("Please tick the consent box so we can prepare the summary.");
    setWorking(true);
    try {
      const result = await summarizeIntake(firebaseUser, text.trim());
      setAi(result);
      setStep("review");
    } catch (err) {
      console.error("summarizeIntake failed:", err);
      setError(err.message || "Couldn't prepare the summary.");
    } finally {
      setWorking(false);
    }
  }

  // If AI is down, the patient can still send their own words.
  function handleSkipAi() {
    setError(null);
    if (!text.trim()) return setError("Please describe your problem first.");
    setAi(null);
    setStep("review");
  }

  async function handleSend() {
    setError(null);
    setWorking(true);
    try {
      await requestAppointment({
        doctorUid: state.doctorUid,
        doctorName: state.doctorName,
        patientUid: firebaseUser.uid,
        patientName: profile?.name,
        patientId: profile?.specialId,
        intake: {
          originalText: text.trim(),
          language: ai?.language || LANGUAGES[langIdx].name,
          summary: ai?.summary || null,
          consent: true,
        },
      });
      setStep("sent");
    } catch (err) {
      console.error("requestAppointment failed:", err);
      setError(err.message || "Couldn't send your request. Try again.");
    } finally {
      setWorking(false);
    }
  }

  const summary = ai?.summary;

  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>Book Appointment</h1>
        <p className="sub">{state.doctorName} — {state.specialization}</p>
      </div>

      {/* ---------------- STEP 1: WRITE ---------------- */}
      {step === "write" && (
        <div className="panel">
          <h3>Tell the doctor what's wrong</h3>
          <p className="panel-note">
            Speak or type in your own language. We'll translate it into a short medical note for the doctor.
            Your token number is given only after the doctor accepts your request.
          </p>

          <div className="field" style={{ marginTop: 14 }}>
            <label>Language</label>
            <select value={langIdx} onChange={(e) => setLangIdx(Number(e.target.value))}>
              {LANGUAGES.map((l, i) => (
                <option key={l.name} value={i}>{l.label}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Your problem</label>
            <textarea
              style={textareaStyle}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={2000}
              placeholder="e.g. 3 din se pet me dard hai aur bukhar bhi hai…"
            />
            {SpeechRecognition ? (
              <button
                type="button"
                className="btn-primary"
                style={{ width: "auto", marginTop: 10, padding: "8px 18px", background: listening ? "var(--red-600)" : undefined }}
                onClick={toggleVoice}
              >
                {listening ? "⏹ Stop listening" : "🎤 Speak instead"}
              </button>
            ) : (
              <p className="panel-note" style={{ marginTop: 8 }}>Voice input isn't supported in this browser. Please type (Chrome supports voice).</p>
            )}
            {listening && <p className="panel-note" style={{ marginTop: 6 }}>Listening… speak now.</p>}
            {voiceError && <p className="panel-note" style={{ marginTop: 6 }}>{voiceError}</p>}
          </div>

          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3 }} />
            <span>
              I agree that my text will be processed by an AI service to prepare a medical summary,
              and shared with the doctor I'm booking.
            </span>
          </label>

          {error && <p className="form-error" style={{ marginTop: 12 }}>{error}</p>}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
            <button className="btn-primary" style={{ width: "auto", padding: "12px 26px" }} onClick={handleSummarize} disabled={working}>
              {working ? "Preparing summary…" : "Prepare summary"}
            </button>
            <button
              type="button"
              className="btn-logout"
              style={{ padding: "12px 20px" }}
              onClick={handleSkipAi}
              disabled={working}
              title="Send your own words without AI translation"
            >
              Skip AI
            </button>
          </div>
        </div>
      )}

      {/* ---------------- STEP 2: REVIEW ---------------- */}
      {step === "review" && (
        <>
          {ai?.hasRedFlags && (
            <div className="panel" style={{ borderColor: "var(--red-600)" }}>
              <h3>⚠️ This may be an emergency</h3>
              <p className="panel-note">
                You mentioned: {summary.redFlags.join(", ")}. If this is happening right now, don't wait for an appointment.
              </p>
              <Link to="/patient/emergency-help" className="btn-primary" style={{ display: "inline-block", width: "auto", marginTop: 12, padding: "12px 26px", textDecoration: "none", background: "var(--red-600)" }}>
                🚨 Go to Emergency Help
              </Link>
            </div>
          )}

          <div className="panel">
            <h3>Summary for the doctor</h3>
            {summary ? (
              <>
                <p className="panel-note">AI-generated summary — not a diagnosis. The doctor also sees your own words.</p>
                <div className="medicine-result-row">
                  <div>
                    <div className="medicine-result-name">{summary.chiefComplaint || "—"}</div>
                    <div className="panel-note">Chief complaint</div>
                  </div>
                  <StatusBadge type={SEVERITY_BADGE[summary.severity] || "normal"} label={summary.severity} />
                </div>
                <div className="medicine-result-row">
                  <div>
                    <div className="medicine-result-name">{summary.symptoms.length ? summary.symptoms.join(", ") : "—"}</div>
                    <div className="panel-note">Symptoms</div>
                  </div>
                </div>
                <div className="medicine-result-row">
                  <div>
                    <div className="medicine-result-name">{summary.duration || "—"}</div>
                    <div className="panel-note">Duration</div>
                  </div>
                </div>
              </>
            ) : (
              <p className="panel-note">No AI summary — the doctor will see your own words only.</p>
            )}
          </div>

          <div className="panel">
            <h3>Your own words {ai?.language ? `(${ai.language})` : ""}</h3>
            <p className="panel-note" style={{ whiteSpace: "pre-wrap" }}>{text}</p>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn-primary" style={{ width: "auto", padding: "12px 26px" }} onClick={handleSend} disabled={working}>
              {working ? "Sending…" : "Send request to doctor"}
            </button>
            <button className="btn-logout" style={{ padding: "12px 20px" }} onClick={() => { setStep("write"); setError(null); }} disabled={working}>
              ← Edit description
            </button>
          </div>
        </>
      )}

      {/* ---------------- STEP 3: SENT ---------------- */}
      {step === "sent" && (
        <div className="panel">
          <div className="empty-state">
            <div className="big">Request sent to {state.doctorName}</div>
            <p>
              Your token number will appear in "My Appointments" once the doctor accepts your request.
            </p>
            <button className="btn-primary" style={{ width: "auto", marginTop: 14, padding: "12px 26px" }} onClick={() => navigate("/patient/appointments")}>
              View My Appointments
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}