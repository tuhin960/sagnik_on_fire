// FILE: src/pages/patient/BookAppointment.jsx
//
// Real feature: books an appointment and returns a queue-based token
// number via a Firestore transaction (see bookAppointment() in
// firestore.js) — so two patients booking the same doctor at the same
// instant can never receive the same token.

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import { bookAppointment } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function PatientBookAppointment() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { profile, firebaseUser } = useAuth();
  const [booking, setBooking] = useState(false);
  const [result, setResult] = useState(null);

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

  async function handleBook() {
    setBooking(true);
    const res = await bookAppointment({
      doctorUid: state.doctorUid,
      doctorName: state.doctorName,
      patientUid: firebaseUser.uid,
      patientName: profile?.name,
      patientId: profile?.specialId,
    });
    setResult(res);
    setBooking(false);
  }

  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>Book Appointment</h1>
        <p className="sub">{state.doctorName} — {state.specialization}</p>
      </div>

      {!result && (
        <div className="panel">
          <p className="panel-note">Booking for today. You'll get a queue token number — no time slot to pick, just show up and wait for your number.</p>
          <button className="btn-primary" style={{ width: "auto", marginTop: 14, padding: "12px 26px" }} onClick={handleBook} disabled={booking}>
            {booking ? "Booking…" : "Confirm Booking"}
          </button>
        </div>
      )}

      {result && (
        <div className="panel">
          <div className="empty-state">
            <div className="big">Booked! Your token number is #{result.tokenNumber}</div>
            <p>You'll be called in order. Check "My Appointments" for live queue status.</p>
            <button className="btn-primary" style={{ width: "auto", marginTop: 14, padding: "12px 26px" }} onClick={() => navigate("/patient/appointments")}>
              View My Appointments
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}