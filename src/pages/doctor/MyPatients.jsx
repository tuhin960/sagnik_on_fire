// FILE: src/pages/doctor/MyPatients.jsx
//
// Every patient this doctor has accepted at least once. Click a card
// to open Patient Details (AI summaries, consultation history, reports).

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import { listenToDoctorPatients } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function DoctorMyPatients() {
  const { firebaseUser } = useAuth();
  const [patients, setPatients] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = listenToDoctorPatients(
      firebaseUser.uid,
      (list) => { setError(null); setPatients(list); },
      (err) => setError(err.message || "Couldn't load your patients.")
    );
    return unsub;
  }, [firebaseUser]);

  return (
    <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
      <div className="page-head">
        <h1>My Patients</h1>
        <p className="sub">Everyone you've accepted a consultation from.</p>
      </div>

      {error && <p className="panel-note">Couldn't load your patients: {error}</p>}
      {patients === null && !error && <p className="panel-note">Loading…</p>}
      {patients !== null && patients.length === 0 && (
        <div className="empty-state">
          <div className="big">No patients yet</div>
          <p>Accept a request from Patient Requests to see them here.</p>
        </div>
      )}

      <div className="doctor-grid">
        {patients?.map((p) => (
          <div key={p.id} className="panel doctor-card">
            <div className="doctor-card-avatar">🧑</div>
            <div>
              <h3 style={{ marginBottom: 2 }}>{p.patientName}</h3>
              <p className="panel-note">{p.patientId}</p>
            </div>
            <button
              className="btn-primary doctor-card-btn"
              type="button"
              onClick={() => navigate("/doctor/patient-details", { state: { patientUid: p.patientUid, patientName: p.patientName, patientId: p.patientId } })}
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}