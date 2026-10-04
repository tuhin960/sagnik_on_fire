import { useEffect, useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import { listenToPatientAppointments, destroyConsultation } from "../../firebase/firestore";
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
  const [inputCode, setInputCode] = useState("");
  const [activeCall, setActiveCall] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = listenToPatientAppointments(firebaseUser.uid, setAppointments);
    return unsub;
  }, [firebaseUser]);

  const today = todayKey();
  const todayAppointments = appointments?.filter((a) => a.date === today) || [];
  
  // If we already joined, stay in the call
  const activeNow = activeCall || todayAppointments.find((a) => a.status === "in-progress" && a.id === activeCall?.id);

  const handleJoin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!inputCode.trim()) {
      setErrorMsg("Please enter a join code.");
      return;
    }

    // Find the appointment with this code
    const match = todayAppointments.find((a) => a.joinCode === inputCode.trim() && a.status === "in-progress");
    
    if (!match) {
      setErrorMsg("Invalid join code. Please check your notifications.");
      return;
    }

    // Check expiration (3 minutes from scheduled time)
    const now = Date.now();
    const expiresAt = match.joinCodeExpiresAt?.toMillis() || 0;
    
    if (now > expiresAt) {
      await destroyConsultation(match.id);
      setErrorMsg("This consultation has expired (more than 3 minutes passed). It has been cancelled.");
      return;
    }

    // Success!
    setActiveCall(match);
  };

  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>Online Consultation</h1>
        <p className="sub">Enter your join code from notifications to start the video call.</p>
      </div>

      {appointments === null && <p className="panel-note">Loading…</p>}

      {appointments !== null && activeNow && (
        <>
          <div className="panel">
            <h3>Live now — Token #{activeNow.tokenNumber}</h3>
            <p className="panel-note">Dr. {activeNow.doctorName}</p>
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

      {appointments !== null && !activeNow && (
        <div className="panel" style={{ maxWidth: 500 }}>
          <h3 style={{ marginBottom: 16 }}>Join Consultation</h3>
          <p style={{ marginBottom: 20, color: "var(--grey-600)", lineHeight: 1.5 }}>
            When your doctor schedules a consultation, you will receive a notification with a joining code. 
            <strong> You must join within 3 minutes</strong> of the scheduled time or the consultation will be cancelled.
          </p>
          
          <form onSubmit={handleJoin} style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input 
              type="text" 
              placeholder="Enter 6-digit Join Code" 
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              style={{ flex: 1, padding: "12px", borderRadius: 8, border: "1px solid var(--line)", fontSize: 16, letterSpacing: 2 }}
              required
            />
            <button type="submit" className="btn-primary" style={{ padding: "12px 24px", width: "auto" }}>
              Join Call
            </button>
          </form>
          
          {errorMsg && <p style={{ color: "red", marginTop: 16 }}>{errorMsg}</p>}
        </div>
      )}
    </DashboardLayout>
  );
}