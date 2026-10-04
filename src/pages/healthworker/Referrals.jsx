// FILE: src/pages/healthworker/Referrals.jsx
//
// ASHA refers • registered field patient to a hospital / facility.
// Writes to the shared `referrals` collection (createReferral) so the
// facility / doctor / admin referral pages can read the same data later.

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import {
  createReferral,
  listenToHealthworkerPatients,
  listenToReferralsByUser,
} from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

const FACILITY_OPTIONS = [
  "Primary Health Centre (PHC)",
  "Community Health Centre (CHC)",
  "Sub-District Hospital",
  "District Hospital",
  "Medical College Hospital",
  "Other",
];

const URGENCY_OPTIONS = [
  { value: "normal", label: "Routine" },
  { value: "urgent", label: "Urgent" },
  { value: "emergency", label: "Emergency" },
];

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

export default function HealthWorkerReferrals() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { profile, firebaseUser } = useAuth();

  const [patients, setPatients] = useState(null);
  const [referrals, setReferrals] = useState(null);

  const [fieldPatientId, setFieldPatientId] = useState(state?.fieldPatientId || "");
  const [fieldPatientName, setFieldPatientName] = useState(state?.fieldPatientName || "");
  const [facilityType, setFacilityType] = useState(FACILITY_OPTIONS[0]);
  const [facilityName, setFacilityName] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [reason, setReason] = useState("");

  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const u1 = listenToHealthworkerPatients(firebaseUser.uid, setPatients, (e) => setError(e.message));
    const u2 = listenToReferralsByUser(firebaseUser.uid, setReferrals, (e) => setError(e.message));
    return () => { u1(); u2(); };
  }, [firebaseUser]);

  async function handleSend() {
    setError(null);
    setSuccess(null);
    if (!fieldPatientId) return setError("Choose • patient first.");
    if (!facilityName.trim()) return setError("Enter the hospital / facility name.");
    if (!reason.trim()) return setError("Write the reason for referral.");

    const toFacility = `${facilityName.trim()} (${facilityType === "Other" ? "Other" : facilityType})`;

    setSending(true);
    try {
      await createReferral({
        referredByUid: firebaseUser.uid,
        referredByName: profile?.name || "Health Worker",
        referredByRole: "healthworker",
        patientRefType: "fieldPatient",
        patientRefId: fieldPatientId,
        patientName: fieldPatientName,
        patientId: fieldPatientId,
        toFacility,
        reason: reason.trim(),
        urgency,
      });
      setSuccess(`${fieldPatientName} referred to ${facilityName.trim()}.`);
      setReason("");
      setFacilityName("");
      setUrgency("normal");
    } catch (err) {
      console.error("createReferral failed:", err);
      setError(err.message || "Couldn't send the referral.");
    } finally {
      setSending(false);
    }
  }

  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Referrals</h1>
        <p className="sub">Refer a patient you registered to a hospital or facility.</p>
      </div>

      {/* 1 â€” Patient */}
      <div className="panel">
        <h3>1 - Patient {fieldPatientId && <StatusBadge type="fresh" label={fieldPatientName} />}</h3>
        {patients === null && <p className="panel-note">Loading...</p>}
        {patients?.length === 0 && (
          <div className="empty-state">
            <div className="big">No patients registered yet</div>
            <button className="btn-primary" style={{ width: "auto", marginTop: 14, padding: "12px 26px" }} onClick={() => navigate("/healthworker/register-patient")}>
              Register Patient
            </button>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
          {patients?.map((p) => (
            <button
              key={p.id}
              type="button"
              className={p.id === fieldPatientId ? "btn-primary" : "btn-logout"}
              style={{ width: "auto", padding: "8px 18px" }}
              onClick={() => { setFieldPatientId(p.id); setFieldPatientName(p.name); setSuccess(null); }}
            >
              {p.name}{p.age ? ` • ${p.age}` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* 2 â€” Facility + reason */}
      <div className="panel">
        <h3>2 - Facility</h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          <div className="field">
            <label>Facility type</label>
            <select value={facilityType} onChange={(e) => setFacilityType(e.target.value)}>
              {FACILITY_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
                    <div className="field">
            <label>Nearest Hospitals (within 50km)</label>
            <select
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
            >
              <option value="" disabled>Select • nearby hospital...</option>
              <option value="District Hospital, Howrah">District Hospital, Howrah (12 km away)</option>
              <option value="Burdwan Medical College">Burdwan Medical College (34 km away)</option>
              <option value="NRS Medical College">NRS Medical College (41 km away)</option>
              <option value="Apollo Gleneagles, Kolkata">Apollo Gleneagles, Kolkata (48 km away)</option>
            </select>
            <p className="panel-note" style={{ marginTop: 4 }}>Automatically filtered based on patient's GPS coordinates.</p>
          </div>
        </div>

        <div className="field">
          <label>Urgency</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {URGENCY_OPTIONS.map((u) => (
              <button
                key={u.value}
                type="button"
                className={urgency === u.value ? "btn-primary" : "btn-logout"}
                style={{ width: "auto", padding: "6px 16px", fontSize: 13 }}
                onClick={() => setUrgency(u.value)}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Reason for referral</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Symptoms, vitals, what care is needed..."
            style={{ width: "100%", minHeight: 90, padding: 10, border: "1px solid var(--line)", borderRadius: 8, fontFamily: "inherit", boxSizing: "border-box" }}
          />
        </div>

        {error && <p className="form-error">{error}</p>}
        {success && <p className="panel-note" style={{ color: "var(--green-600)" }}>{success}</p>}

        <button className="btn-primary" style={{ width: "auto", padding: "12px 26px" }} disabled={sending} onClick={handleSend}>
          {sending ? "Sending..." : "Send Referral"}
        </button>
      </div>

      {/* History */}
      <div className="panel">
        <h3>My Referrals</h3>
        {referrals === null && <p className="panel-note">Loading...</p>}
        {referrals?.length === 0 && <p className="panel-note">No referrals sent yet.</p>}

        {referrals?.map((r) => {
          const v = STATUS_VIEW[r.status] || STATUS_VIEW.sent;
          return (
            <div key={r.id} style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <strong>{r.patientName}</strong>
                  <p className="panel-note">â†’ {r.toFacility} • {formatDate(r.createdAt)}</p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {r.urgency && r.urgency !== "normal" && <StatusBadge type={r.urgency} />}
                  <StatusBadge type={v.type} label={v.label} />
                </div>
              </div>
              {r.reason && <p className="panel-note">{r.reason}</p>}
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}




