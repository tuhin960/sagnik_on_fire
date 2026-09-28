// FILE: src/pages/healthworker/Notifications.jsx
//
// Real feature: same live emergency-alert feed as Doctor Notifications
// — both roles watch the same `alerts` collection, so whichever of
// them is free can acknowledge first.

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import { acknowledgeAlert, listenToOpenAlerts } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function HealthWorkerNotifications() {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState(null);

  useEffect(() => {
    const unsub = listenToOpenAlerts(setAlerts);
    return unsub;
  }, []);

  async function handleAcknowledge(alertId) {
    await acknowledgeAlert(alertId, profile?.name || "Health Worker");
  }

  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Notifications</h1>
        <p className="sub">Live emergency alerts from patients.</p>
      </div>

      <div className="panel">
        {alerts === null && <p className="panel-note">Loading…</p>}
        {alerts?.length === 0 && (
          <div className="empty-state">
            <div className="big">No open alerts</div>
            <p>You'll see emergency alerts here the moment a patient sends one.</p>
          </div>
        )}
        {alerts?.map((a) => (
          <div key={a.id} className="medicine-result-row">
            <div>
              <div className="medicine-result-name">
                🚨 {a.patientName} <span className="panel-note">({a.patientId})</span>
              </div>
              <div className="panel-note">{a.message}</div>
            </div>
            <div className="medicine-row-actions">
              <StatusBadge type="emergency" label="Open" />
              <button type="button" className="btn-logout" onClick={() => handleAcknowledge(a.id)}>
                Acknowledge
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}