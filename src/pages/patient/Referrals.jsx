// FILE: src/pages/patient/Referrals.jsx
//
// Read-only, real-time list of referrals a doctor made for this patient
// (referrals where patientUid == my uid). Each card shows who referred,
// which facility, why, urgency, and a small progress tracker.

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import { listenToPatientReferrals } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

const STEPS = ["sent", "accepted", "completed"];
const STEP_LABEL = { sent: "Sent", accepted: "Accepted", completed: "Completed" };

const STATUS_VIEW = {
  sent: { type: "urgent", label: "Sent" },
  accepted: { type: "fresh", label: "Accepted" },
  completed: { type: "normal", label: "Completed" },
  rejected: { type: "emergency", label: "Rejected" },
};

function formatDate(ts) {
  const d = ts?.toDate ? ts.toDate() : new Date();
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function Tracker({ status }) {
  if (status === "rejected") {
    return (
      <p className="panel-note" style={{ color: "var(--red-600)", marginTop: 8 }}>
        This referral was rejected by the facility. Please contact your doctor.
      </p>
    );
  }
  const current = Math.max(0, STEPS.indexOf(status));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
      {STEPS.map((s, i) => {
        const done = i <= current;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 22, height: 22, borderRadius: "50%", display: "inline-flex",
                alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
                background: done ? "var(--teal-600)" : "var(--slate-300)",
                color: done ? "#fff" : "var(--ink-700)",
              }}
            >
              {done ? "✓" : i + 1}
            </span>
            <span style={{ fontSize: 12.5, fontWeight: done ? 600 : 400 }}>{STEP_LABEL[s]}</span>
            {i < STEPS.length - 1 && (
              <span style={{ width: 24, height: 2, background: i < current ? "var(--teal-600)" : "var(--slate-300)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PatientReferrals() {
  const { firebaseUser } = useAuth();
  const [referrals, setReferrals] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = listenToPatientReferrals(
      firebaseUser.uid,
      (list) => { setError(null); setReferrals(list); },
      (err) => setError(err.message || "Couldn't load your referrals.")
    );
    return unsub;
  }, [firebaseUser]);

  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>Referrals</h1>
        <p className="sub">Hospitals your doctor has referred you to.</p>
      </div>

      {error && <p className="panel-note">Couldn't load referrals: {error}</p>}
      {referrals === null && !error && <p className="panel-note">Loading…</p>}

      {referrals?.length === 0 && (
        <div className="empty-state">
          <div className="big">No referrals yet</div>
          <p>If your doctor refers you to a hospital, it will appear here.</p>
        </div>
      )}

      {referrals?.map((r) => {
        const v = STATUS_VIEW[r.status] || STATUS_VIEW.sent;
        return (
          <div key={r.id} className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <h3 style={{ marginBottom: 0 }}>🏥 {r.toFacility}</h3>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {r.urgency && r.urgency !== "normal" && <StatusBadge type={r.urgency} />}
                <StatusBadge type={v.type} label={v.label} />
              </div>
            </div>

            <p className="panel-note" style={{ marginTop: 6 }}>
              Referred by {r.referredByName || "your doctor"} · {formatDate(r.createdAt)}
            </p>

            {r.reason && (
              <div style={{ marginTop: 10 }}>
                <p className="panel-note" style={{ fontWeight: 600 }}>Reason</p>
                <p className="panel-note">{r.reason}</p>
              </div>
            )}

            <Tracker status={r.status} />
          </div>
        );
      })}
    </DashboardLayout>
  );
}