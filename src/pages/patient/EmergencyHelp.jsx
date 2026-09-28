// FILE: src/pages/patient/EmergencyHelp.jsx
//
// Real feature: writes to the `alerts` collection. Doctor and Health
// Worker Notifications pages listen to this collection in real time
// (onSnapshot), so an alert shows up there within a second or two —
// no refresh needed on their side.

import { useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import { sendEmergencyAlert } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function PatientEmergencyHelp() {
  const { profile, firebaseUser } = useAuth();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    setSending(true);
    await sendEmergencyAlert({
      patientUid: firebaseUser.uid,
      patientName: profile?.name,
      patientId: profile?.specialId,
      message: message.trim() || undefined,
    });
    setSending(false);
    setSent(true);
  }

  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>Emergency Help</h1>
        <p className="sub">This sends an immediate alert to doctors and health workers in your network.</p>
      </div>

      {!sent && (
        <div className="panel">
          <div className="field">
            <label htmlFor="message">What's happening? (optional)</label>
            <input
              id="message"
              placeholder="e.g. Severe chest pain, need help now"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <button
            className="btn-primary"
            style={{ background: "var(--grad-amber)" }}
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? "Sending alert…" : "🚨 Send Emergency Alert"}
          </button>
        </div>
      )}

      {sent && (
        <div className="panel">
          <div className="empty-state">
            <div className="big">Alert sent</div>
            <p>Doctors and health workers in your network have been notified. Stay where you are if possible.</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}