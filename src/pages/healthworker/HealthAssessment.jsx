// FILE: src/pages/healthworker/HealthAssessment.jsx
//
// Real feature: vitals + symptoms form for a field patient. A simple,
// transparent rule-based screen (NOT a diagnosis) flags low/medium/high
// risk from the numbers entered, so High-Risk Patients and Follow-ups
// can pick it up automatically.

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import { listenToHealthworkerPatients, saveAssessment } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

const SYMPTOM_OPTIONS = [
  "Fever", "Cough", "Breathlessness", "Chest pain", "Abdominal pain",
  "Diarrhoea", "Vomiting", "Weakness", "Swelling", "Bleeding", "Convulsion", "Unconsciousness",
];
const RED_FLAG_SYMPTOMS = ["Breathlessness", "Chest pain", "Bleeding", "Convulsion", "Unconsciousness"];

const RISK_BADGE = { low: "fresh", medium: "urgent", high: "emergency" };



export default function HealthWorkerHealthAssessment() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { profile, firebaseUser } = useAuth();

  const [patients, setPatients] = useState(null);
  const [fieldPatientId, setFieldPatientId] = useState(state?.fieldPatientId || "");
  const [fieldPatientName, setFieldPatientName] = useState(state?.fieldPatientName || "");

  const [vitals, setVitals] = useState({ temp: "", pulse: "", spo2: "", systolic: "", diastolic: "" });
  const [symptoms, setSymptoms] = useState([]);
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [manualRisk, setManualRisk] = useState("low");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  // If we weren't handed a patient, let the worker pick one from their list.
  useEffect(() => {
    if (fieldPatientId || !firebaseUser?.uid) return;
    const unsub = listenToHealthworkerPatients(firebaseUser.uid, setPatients);
    return unsub;
  }, [fieldPatientId, firebaseUser]);

  function toggleSymptom(s) {
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  

  async function handleSave() {
    setError(null);
    if (!fieldPatientId) return setError("Choose a patient first.");
    setSaving(true);
    try {
      await saveAssessment({
        fieldPatientId, fieldPatientName,
        healthworkerUid: firebaseUser.uid,
        healthworkerName: profile?.name || "Health Worker",
        vitals: {
          temp: vitals.temp || null, pulse: vitals.pulse || null, spo2: vitals.spo2 || null,
          bp: vitals.systolic && vitals.diastolic ? `${vitals.systolic}/${vitals.diastolic}` : "",
        },
        symptoms, notes: notes.trim(), riskLevel: manualRisk, followUpDate,
      });
      setSaved(true);
    } catch (err) {
      console.error("saveAssessment failed:", err);
      setError(err.message || "Couldn't save this assessment.");
    } finally {
      setSaving(false);
    }
  }

  if (!fieldPatientId) {
    return (
      <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
        <div className="page-head">
          <h1>Patient Assessment</h1>
        </div>
        <div className="panel">
          <h3>Choose a patient</h3>
          {patients === null && <p className="panel-note">Loadingâ€¦</p>}
          {patients?.length === 0 && (
            <div className="empty-state">
              <div className="big">No patients registered yet</div>
              <p>Register a patient first.</p>
              <button className="btn-primary" style={{ width: "auto", marginTop: 14, padding: "12px 26px" }} onClick={() => navigate("/healthworker/register-patient")}>
                Register Patient
              </button>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            {patients?.map((p) => (
              <button key={p.id} className="btn-primary" style={{ width: "auto", padding: "8px 18px" }} onClick={() => { setFieldPatientId(p.id); setFieldPatientName(p.name); }}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (saved) {
    return (
      <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
        <div className="page-head">
          <h1>Assessment saved</h1>
        </div>
        <div className="panel">
          <h3>{fieldPatientName} <StatusBadge type={RISK_BADGE[manualRisk]} label={`${manualRisk} risk`} /></h3>
          {manualRisk === "high" && (
            <p className="panel-note" style={{ color: "var(--red-600)" }}>
            🔴 High Risk. Consider Emergency / Critical Cases or an urgent doctor consultation.
            </p>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <button className="btn-primary" style={{ width: "auto", padding: "10px 22px" }} onClick={() => navigate("/healthworker/doctor-consultation", { state: { fieldPatientId, fieldPatientName, isEmergency: manualRisk === "high" } })}>
              Book Doctor Consultation
            </button>
            <button className="btn-logout" style={{ padding: "10px 22px" }} onClick={() => navigate("/healthworker/my-patients")}>
              Back to My Patients
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Patient Assessment</h1>
        <p className="sub">{fieldPatientName}</p>
      </div>

      <div className="panel">
        <h3>Vitals</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
          <div className="field">
            <label>Temperature (°F)</label>
            <input type="number" step="0.1" value={vitals.temp} onChange={(e) => setVitals((v) => ({ ...v, temp: e.target.value }))} placeholder="98.6" />
          </div>
          <div className="field">
            <label>Pulse (bpm)</label>
            <input type="number" value={vitals.pulse} onChange={(e) => setVitals((v) => ({ ...v, pulse: e.target.value }))} placeholder="72" />
          </div>
          <div className="field">
            <label>SpO2 (%)</label>
            <input type="number" value={vitals.spo2} onChange={(e) => setVitals((v) => ({ ...v, spo2: e.target.value }))} placeholder="98" />
          </div>
          <div className="field">
            <label>BP Systolic</label>
            <input type="number" value={vitals.systolic} onChange={(e) => setVitals((v) => ({ ...v, systolic: e.target.value }))} placeholder="120" />
          </div>
          <div className="field">
            <label>BP Diastolic</label>
            <input type="number" value={vitals.diastolic} onChange={(e) => setVitals((v) => ({ ...v, diastolic: e.target.value }))} placeholder="80" />
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>Symptoms</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {SYMPTOM_OPTIONS.map((s) => (
            <label key={s} style={{ display: "flex", gap: 6, alignItems: "center", padding: "6px 12px", border: "1px solid var(--line)", borderRadius: 20, cursor: "pointer", fontSize: 13 }}>
              <input type="checkbox" checked={symptoms.includes(s)} onChange={() => toggleSymptom(s)} />
              {s}
            </label>
          ))}
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label>Other symptoms & Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: "100%", minHeight: 70, padding: 10, border: "1px solid var(--line)", borderRadius: 8, fontFamily: "inherit", boxSizing: "border-box" }}
          />
        </div>
        <div className="field">
          <label>Follow-up date (optional)</label>
          <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
        </div>
      </div>

      <div className="panel">
        <h3>Final Assessment & Risk Level</h3>
        <p className="panel-note">Determine the patient's risk based on your observation.</p>
        
        <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
          <button 
            type="button"
            className={manualRisk === "low" ? "btn-primary" : "btn-logout"}
            style={{ width: "auto", padding: "10px 20px", backgroundColor: manualRisk === "low" ? "var(--green-600)" : undefined, color: manualRisk === "low" ? "white" : undefined, border: manualRisk === "low" ? "none" : undefined }}
            onClick={() => setManualRisk("low")}
          >
            🟢 Low Risk
          </button>
          <button 
            type="button"
            className={manualRisk === "medium" ? "btn-primary" : "btn-logout"}
            style={{ width: "auto", padding: "10px 20px", backgroundColor: manualRisk === "medium" ? "var(--amber-600)" : undefined, color: manualRisk === "medium" ? "white" : undefined, border: manualRisk === "medium" ? "none" : undefined }}
            onClick={() => setManualRisk("medium")}
          >
            🟡 Moderate Risk
          </button>
          <button 
            type="button"
            className={manualRisk === "high" ? "btn-primary" : "btn-logout"}
            style={{ width: "auto", padding: "10px 20px", backgroundColor: manualRisk === "high" ? "var(--red-600)" : undefined, color: manualRisk === "high" ? "white" : undefined, border: manualRisk === "high" ? "none" : undefined }}
            onClick={() => setManualRisk("high")}
          >
            🔴 High Risk
          </button>
        </div>

        {error && <p className="form-error" style={{ marginTop: 14 }}>{error}</p>}

        <button className="btn-primary" style={{ width: "auto", padding: "12px 26px", marginTop: 24 }} disabled={saving} onClick={handleSave}>
          {saving ? "Saving..." : "Save Assessment"}
        </button>
      </div>
    </DashboardLayout>
  );
}






