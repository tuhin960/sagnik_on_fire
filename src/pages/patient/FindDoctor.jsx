// FILE: src/pages/patient/FindDoctor.jsx
//
// Real feature: lists every registered Doctor with their specialization.
// "Book Appointment" carries the chosen doctor forward via router state,
// so BookAppointment.jsx doesn't need to ask again.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import { listAllDoctors } from "../../firebase/firestore";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function PatientFindDoctor() {
  const [doctors, setDoctors] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setDoctors(null);

    listAllDoctors()
      .then((list) => {
        if (!cancelled) setDoctors(list);
      })
      .catch((err) => {
        console.error("listAllDoctors failed:", err);
        if (!cancelled) setError(err.message || "Couldn't load doctors right now.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>Find Doctor</h1>
        <p className="sub">Registered doctors, by specialization.</p>
      </div>

      {doctors === null && !error && <p className="panel-note">Loading…</p>}

      {error && (
        <div className="empty-state">
          <div className="big">Couldn't load doctors</div>
          <p>{error}</p>
          <button
            className="btn-primary"
            style={{ width: "auto", marginTop: 14, padding: "12px 26px" }}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      {doctors !== null && doctors.length === 0 && !error && (
        <div className="empty-state">
          <div className="big">No doctors registered yet</div>
          <p>Check back once your district's doctors have signed up.</p>
        </div>
      )}

      <div className="doctor-grid">
        {doctors?.map((doc) => (
          <div key={doc.uid} className="panel doctor-card">
            <div className="doctor-card-avatar">⚕️</div>
            <div>
              <h3 style={{ marginBottom: 2 }}>{doc.name}</h3>
              <p className="panel-note">{doc.specialization || "General Physician"}</p>
              <p className="panel-note">Reg. No: {doc.specialId}</p>
            </div>
            <button
              className="btn-primary doctor-card-btn"
              type="button"
              onClick={() => navigate("/patient/book-appointment", { state: { doctorUid: doc.uid, doctorName: doc.name, specialization: doc.specialization } })}
            >
              Book Appointment
            </button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}