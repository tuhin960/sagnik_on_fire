// FILE: src/pages/healthworker/MyPatients.jsx
//
// Every patient this Health Worker has registered in the field.
// Quick actions per patient: assess, or book a doctor consultation.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import { listenToHealthworkerPatients } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function HealthWorkerMyPatients() {
  const { firebaseUser } = useAuth();
  const [patients, setPatients] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = listenToHealthworkerPatients(
      firebaseUser.uid,
      (list) => { setError(null); setPatients(list); },
      (err) => setError(err.message || "Couldn't load your patients.")
    );
    return unsub;
  }, [firebaseUser]);

  const filteredPatients = patients?.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.patientId && p.patientId.toLowerCase().includes(q)) ||
      (p.contactNumber && p.contactNumber.includes(q))
    );
  });

  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>My Patients</h1>
        <p className="sub">Everyone you've registered in the field.</p>
        <input 
          type="text" 
          placeholder="Search by name, ID, or phone number..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginTop: 12, padding: "10px 14px", width: "100%", maxWidth: 400, borderRadius: 8, border: "1px solid var(--line)" }}
        />
      </div>

      {error && <p className="panel-note">Couldn't load your patients: {error}</p>}
      {patients === null && !error && <p className="panel-note">Loading...</p>}
      {filteredPatients && filteredPatients.length === 0 && (
        <div className="empty-state">
          <div className="big">No patients found</div>
          <p>Try a different search term or register a new patient.</p>
          <button className="btn-primary" style={{ width: "auto", marginTop: 14, padding: "12px 26px" }} onClick={() => navigate("/healthworker/register-patient")}>
            Register Patient
          </button>
        </div>
      )}

      <div className="doctor-grid">
        {filteredPatients?.map((p) => (
          <div key={p.id} className="panel doctor-card">
            <div className="doctor-card-avatar">👤</div>
            <div>
              <h3 style={{ marginBottom: 2 }}>{p.name}</h3>
              <p className="panel-note" style={{ color: "var(--teal-700)", fontWeight: 600 }}>{p.patientId}</p>
              <p className="panel-note">{p.age ? p.age + " yrs • " : ""}{p.gender || ""}</p>
              <p className="panel-note">{p.village || "No village noted"} {p.contactNumber ? " • " + p.contactNumber : ""}</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="btn-primary doctor-card-btn"
                style={{ flex: 1 }}
                onClick={() => navigate("/healthworker/health-assessment", { state: { fieldPatientId: p.id, fieldPatientName: p.name } })}
              >
                Assess
              </button>
              <button
                className="btn-primary doctor-card-btn"
                style={{ flex: 1 }}
                onClick={() => navigate("/healthworker/doctor-consultation", { state: { fieldPatientId: p.id, fieldPatientName: p.name } })}
              >
                Book Doctor
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

