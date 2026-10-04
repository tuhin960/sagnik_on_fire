// FILE: src/pages/healthworker/EmergencyCases.jsx
//
// Real-time — every open alert from Patient Emergency Help shows up
// here within a second or two (onSnapshot), same feed a Doctor would
// see. Acknowledging removes it from "open" for everyone.

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import { listenToOpenAlerts, acknowledgeAlert } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function HealthWorkerEmergencyCases() {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    const unsub = listenToOpenAlerts(
      (list) => { setError(null); setAlerts(list); },
      (err) => setError(err.message || "Couldn't load emergency alerts.")
    );
    return unsub;
  }, []);

  async function handleAcknowledge(alert) {
    setActionError(null);
    setBusyId(alert.id);
    try {
      await acknowledgeAlert(alert.id, profile?.name || "Health Worker");
    } catch (err) {
      console.error("acknowledgeAlert failed:", err);
      setActionError(err.message || "Couldn't acknowledge this alert.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Emergency / Critical Cases</h1>
        <p className="sub">Live alerts from patients — updates automatically.</p>
      </div>

      {actionError && <div className="panel"><p className="panel-note">{actionError}</p></div>}

      <div className="panel">
        {error && <p className="panel-note">Couldn't load alerts: {error}</p>}
        {alerts === null && !error && <p className="panel-note">Loading…</p>}
        {alerts !== null && alerts.length === 0 && (
          <div className="empty-state">
            <div className="big">No open emergencies</div>
            <p>You'll see patient alerts here the moment they're sent.</p>
          </div>
        )}

        {alerts?.map((a) => (
          <div key={a.id} className="panel" style={{ marginTop: 12, borderColor: "var(--red-600)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <h3 style={{ marginBottom: 2 }}>{a.patientName}</h3>
                <p className="panel-note">{a.patientId}</p>
              </div>
              <StatusBadge type="emergency" label="Open" />
            </div>
            <p style={{ marginTop: 8 }}>{a.message}</p>
            <button
              className="btn-primary"
              style={{ width: "auto", padding: "10px 22px", marginTop: 10 }}
              disabled={busyId === a.id}
              onClick={() => handleAcknowledge(a)}
            >
              {busyId === a.id ? "Acknowledging…" : "Acknowledge"}
            </button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}