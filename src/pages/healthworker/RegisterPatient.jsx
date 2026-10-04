// FILE: src/pages/healthworker/RegisterPatient.jsx
//
// Real feature: ASHA/Health Worker registers a patient in person who
// may have no phone or app of their own. Saved to fieldPatients â€” a
// separate collection from users (which is only for self-signed-up
// accounts). After saving, offers to jump straight into an assessment.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import { registerFieldPatient } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

const emptyForm = { name: "", age: "", gender: "", village: "", contactNumber: "" };

export default function HealthWorkerRegisterPatient() {
  const { profile, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(null); // { id, name }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError("Patient's name is required.");
    setSaving(true);
    try {
      const { id, patientId } = await registerFieldPatient({
        name: form.name.trim(),
        age: form.age,
        gender: form.gender,
        village: form.village.trim(),
        contactNumber: form.contactNumber.trim(),
        healthworkerUid: firebaseUser.uid,
        healthworkerName: profile?.name || "Health Worker",
      });
      setSaved({ id, patientId, name: form.name.trim() });
      setForm(emptyForm);
    } catch (err) {
      console.error("registerFieldPatient failed:", err);
      setError(err.message || "Couldn't register this patient. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Register Patient</h1>
        <p className="sub">For patients you meet in the field who don't have their own account.</p>
      </div>

      {saved && (
        <div className="panel">
          <h3>âœ… {saved.name} registered</h3>
          <p className="panel-note">You can now assess them or book a doctor consultation on their behalf.</p>
          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <button
              className="btn-primary"
              style={{ width: "auto", padding: "10px 22px" }}
              onClick={() => navigate("/healthworker/health-assessment", { state: { fieldPatientId: saved.id, fieldPatientName: saved.name } })}
            >
              Start Assessment
            </button>
            <button className="btn-logout" style={{ padding: "10px 22px" }} onClick={() => setSaved(null)}>
              Register another
            </button>
          </div>
        </div>
      )}

      {!saved && (
        <form className="panel" onSubmit={handleSubmit}>
          <div className="field">
            <label>Full name</label>
            <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Rekha Devi" />
          </div>
          <div className="field">
            <label>Age</label>
            <input type="number" min="0" max="120" value={form.age} onChange={(e) => update("age", e.target.value)} placeholder="e.g. 45" />
          </div>
          <div className="field">
            <label>Gender</label>
            <select value={form.gender} onChange={(e) => update("gender", e.target.value)}>
              <option value="">Select</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="field">
            <label>Village / Area</label>
            <input type="text" value={form.village} onChange={(e) => update("village", e.target.value)} placeholder="e.g. Sonarpur" />
          </div>
          <div className="field">
            <label>Contact number (optional)</label>
            <input type="tel" value={form.contactNumber} onChange={(e) => update("contactNumber", e.target.value)} placeholder="e.g. 98765XXXXX" />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className="btn-primary" style={{ width: "auto", padding: "12px 26px" }} disabled={saving}>
            {saving ? "Registeringâ€¦" : "Register Patient"}
          </button>
        </form>
      )}
    </DashboardLayout>
  );
}

