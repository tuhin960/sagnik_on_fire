// FILE: src/pages/patient/OnlineConsultation.jsx
//
// Real feature: same live Jitsi call the doctor starts from
// doctor/Appointments.jsx — patient joins the exact same room
// (deterministic room name, derived from the patient's own Patient ID),
// no call link sharing needed. Auto-detects today's "in-progress"
// appointment and drops the patient straight into the call.

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import { listenToPatientAppointments } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { roomNameForPatient, JITSI_DOMAIN } from "../../utils/videoRoom";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function PatientOnlineConsultation() {
  const { profile, firebaseUser } = useAuth();
  const [appointments, setAppointments] = useState(null);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = listenToPatientAppointments(firebaseUser.uid, setAppointments);
    return unsub;
  }, [firebaseUser]);

  const today = todayKey();
  const activeCall = appointments?.find((a) => a.date === today && a.status === "in-progress");
  const waitingToday = appointments?.find((a) => a.date === today && a.status === "waiting");

  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>Online Consultation</h1>
        <p className="sub">Join your video call the moment the doctor starts it — no link needed.</p>
      </div>

      {appointments === null && <p className="panel-note">Loading…</p>}

      {appointments !== null && activeCall && (
        <>
          <div className="panel">
            <h3>Live now — Token #{activeCall.tokenNumber}</h3>
            <p className="panel-note">{activeCall.doctorName}</p>
          </div>
          <div className="video-call-frame">
            <iframe
              title="Consultation call"
              src={`https://${JITSI_DOMAIN}/${roomNameForPatient(profile?.specialId)}#config.prejoinPageEnabled=false&userInfo.displayName=${encodeURIComponent(profile?.name || "Patient")}`}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
            />
          </div>
        </>
      )}

      {appointments !== null && !activeCall && waitingToday && (
        <div className="panel">
          <div className="empty-state">
            <div className="big">Waiting for {waitingToday.doctorName} to start</div>
            <p>Token #{waitingToday.tokenNumber} — this page will connect you automatically once the doctor starts the call.</p>
          </div>
        </div>
      )}

      {appointments !== null && !activeCall && !waitingToday && (
        <div className="panel">
          <div className="empty-state">
            <div className="big">No active consultation</div>
            <p>Book an appointment from Find Doctor, then come back here once it's your turn.</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}