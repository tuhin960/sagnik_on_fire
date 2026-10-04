// FILE: src/pages/doctor/Prescriptions.jsx
//
// Doctor writes a prescription for one of their accepted patients
// (My Patients). Multiple medicines per prescription. Saved prescriptions
// are immutable and show up on the patient's Prescriptions page.
// Below the form: live history of every prescription this doctor wrote.

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import {
  createPrescription,
  listenToDoctorPatients,
  listenToDoctorPrescriptions,
} from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

const FREQUENCIES = [
  "Once daily",
  "Twice daily",
  "Thrice daily",
  "Four times daily",
  "At bedtime",
  "Only when needed",
];

const emptyMedicine = () => ({
  key: Math.random().toString(36).slice(2),
  name: "",
  dosage: "",
  frequency: FREQUENCIES[1],
  duration: "",
  instructions: "",
});

function formatDate(ts) {
  const d = ts?.toDate ? ts.toDate() : new Date();
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function DoctorPrescriptions() {
  const { state } = useLocation();
  const { profile, firebaseUser } = useAuth();

  const [patients, setPatients] = useState(null);
  const [history, setHistory] = useState(null);

  // Other pages can pass { patientUid, patientName, patientId } here.
  const [patient, setPatient] = useState(
    state?.patientUid
      ? { patientUid: state.patientUid, patientName: state.patientName, patientId: state.patientId }
      : null
  );
  const [medicines, setMedicines] = useState([emptyMedicine()]);
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const u1 = listenToDoctorPatients(firebaseUser.uid, setPatients, (e) => setError(e.message));
    const u2 = listenToDoctorPrescriptions(firebaseUser.uid, setHistory, (e) => setError(e.message));
    return () => { u1(); u2(); };
  }, [firebaseUser]);

  function updateMedicine(key, field, value) {
    setMedicines((prev) => prev.map((m) => (m.key === key ? { ...m, [field]: value } : m)));
  }

  function removeMedicine(key) {
    setMedicines((prev) => (prev.length === 1 ? prev : prev.filter((m) => m.key !== key)));
  }

  async function handleSave() {
    setError(null);
    setSuccess(null);
    if (!patient) return setError("Choose a patient first.");

    const filled = medicines.filter((m) => m.name.trim());
    if (filled.length === 0) return setError("Add at least one medicine name.");
    if (filled.some((m) => !m.dosage.trim() || !m.duration.trim())) {
      return setError("Every medicine needs a dosage and a duration.");
    }

    setSaving(true);
    try {
      await createPrescription({
        doctorUid: firebaseUser.uid,
        doctorName: profile?.name || "Doctor",
        patientUid: patient.patientUid,
        patientName: patient.patientName,
        patientId: patient.patientId || "",
        medicines: filled,
        notes,
      });
      setSuccess(`Prescription saved for ${patient.patientName}.`);
      setMedicines([emptyMedicine()]);
      setNotes("");
    } catch (err) {
      console.error("createPrescription failed:", err);
      setError(err.message || "Couldn't save the prescription.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = { width: "100%", padding: "9px 10px", border: "1px solid var(--line)", borderRadius: 8, fontFamily: "inherit", boxSizing: "border-box" };

  return (
    <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
      <div className="page-head">
        <h1>Prescription</h1>
        <p className="sub">Write a prescription for one of your patients. It appears on their Prescriptions page instantly.</p>
      </div>

      {/* 1 — Patient */}
      <div className="panel">
        <h3>1 · Patient {patient && <StatusBadge type="fresh" label={patient.patientName} />}</h3>
        {patients === null && <p className="panel-note">Loading…</p>}
        {patients?.length === 0 && !patient && (
          <p className="panel-note">No patients yet. Accept a consultation request first.</p>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
          {patients?.map((p) => (
            <button
              key={p.id}
              type="button"
              className={patient?.patientUid === p.patientUid ? "btn-primary" : "btn-logout"}
              style={{ width: "auto", padding: "8px 18px" }}
              onClick={() => {
                setPatient({ patientUid: p.patientUid, patientName: p.patientName, patientId: p.patientId });
                setSuccess(null);
              }}
            >
              {p.patientName}
            </button>
          ))}
        </div>
      </div>

      {/* 2 — Medicines */}
      <div className="panel">
        <h3>2 · Medicines</h3>

        {medicines.map((m, i) => (
          <div key={m.key} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <strong>Medicine {i + 1}</strong>
              {medicines.length > 1 && (
                <button type="button" className="btn-logout" style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => removeMedicine(m.key)}>
                  Remove
                </button>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Medicine name</label>
                <input style={inputStyle} value={m.name} onChange={(e) => updateMedicine(m.key, "name", e.target.value)} placeholder="e.g. Paracetamol" />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Dosage</label>
                <input style={inputStyle} value={m.dosage} onChange={(e) => updateMedicine(m.key, "dosage", e.target.value)} placeholder="e.g. 500 mg" />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>How often</label>
                <select value={m.frequency} onChange={(e) => updateMedicine(m.key, "frequency", e.target.value)}>
                  {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Duration</label>
                <input style={inputStyle} value={m.duration} onChange={(e) => updateMedicine(m.key, "duration", e.target.value)} placeholder="e.g. 5 days" />
              </div>
            </div>

            <div className="field" style={{ marginTop: 12, marginBottom: 0 }}>
              <label>Instructions (optional)</label>
              <input style={inputStyle} value={m.instructions} onChange={(e) => updateMedicine(m.key, "instructions", e.target.value)} placeholder="e.g. After food, with warm water" />
            </div>
          </div>
        ))}

        <button type="button" className="btn-logout" style={{ padding: "8px 18px" }} onClick={() => setMedicines((p) => [...p, emptyMedicine()])}>
          + Add another medicine
        </button>
      </div>

      {/* 3 — Notes + save */}
      <div className="panel">
        <h3>3 · Advice (optional)</h3>
        <div className="field">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Diet, rest, warning signs, when to come back…"
            style={{ ...inputStyle, minHeight: 80 }}
          />
        </div>

        {error && <p className="form-error">{error}</p>}
        {success && <p className="panel-note" style={{ color: "var(--green-600)" }}>{success}</p>}

        <button className="btn-primary" style={{ width: "auto", padding: "12px 26px" }} disabled={saving} onClick={handleSave}>
          {saving ? "Saving…" : "Save Prescription"}
        </button>
        <p className="panel-note" style={{ marginTop: 8 }}>A saved prescription can't be edited. Write a new one for any change.</p>
      </div>

      {/* History */}
      <div className="panel">
        <h3>Prescriptions I've written</h3>
        {history === null && <p className="panel-note">Loading…</p>}
        {history?.length === 0 && <p className="panel-note">No prescriptions yet.</p>}

        {history?.map((rx) => (
          <div key={rx.id} style={{ padding: "12px 0", borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <strong>{rx.patientName}</strong>
              <span className="panel-note">{formatDate(rx.createdAt)}</span>
            </div>
            {rx.medicines?.map((m, i) => (
              <p key={i} className="panel-note">
                💊 <strong>{m.name}</strong> {m.dosage} · {m.frequency} · {m.duration}
                {m.instructions ? ` · ${m.instructions}` : ""}
              </p>
            ))}
            {rx.notes && <p className="panel-note">📝 {rx.notes}</p>}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}