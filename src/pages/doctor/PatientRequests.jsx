// FILE: src/pages/doctor/PatientRequests.jsx
//
// New consultation requests, oldest first. Each card shows the AI's
// English medical summary (never a diagnosis) plus the patient's own
// original words, so the doctor can always double-check the AI.
// Accept assigns the next token and adds the patient to "My Patients".
// A doctor can cap how many patients they accept per day.

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import {
  listenToDoctorRequests, getIntake, acceptAppointment,
  rejectAppointment, setDoctorDailyLimit, listenToDoctorQueue,
} from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

const SEVERITY_BADGE = { mild: "normal", moderate: "urgent", severe: "emergency", unspecified: "normal" };

export default function DoctorPatientRequests() {
  const { profile, firebaseUser, setProfile } = useAuth();
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState(null);
  const [intakes, setIntakes] = useState({}); // appointmentId -> intake doc
  const [acceptedToday, setAcceptedToday] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const [limitInput, setLimitInput] = useState(profile?.dailyLimit ?? "");
  const [savingLimit, setSavingLimit] = useState(false);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = listenToDoctorRequests(
      firebaseUser.uid,
      (list) => { setError(null); setRequests(list); },
      (err) => setError(err.message || "Couldn't load requests.")
    );
    return unsub;
  }, [firebaseUser]);

  // Today's already-accepted count, to show "X / limit used" live.
  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = listenToDoctorQueue(firebaseUser.uid, (list) => {
      setAcceptedToday(list.filter((a) => a.status !== "requested" && a.status !== "rejected").length);
    });
    return unsub;
  }, [firebaseUser]);

  // Fetch the AI intake for each request the first time we see it.
  useEffect(() => {
    if (!requests) return;
    requests.forEach((r) => {
      if (r.hasIntake && !intakes[r.id]) {
        getIntake(r.id).then((intake) => {
          if (intake) setIntakes((prev) => ({ ...prev, [r.id]: intake }));
        });
      }
    });
  }, [requests]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveLimit() {
    setSavingLimit(true);
    setActionError(null);
    try {
      const n = Number(limitInput);
      if (!limitInput || Number.isNaN(n) || n < 1) throw new Error("Enter a number of at least 1.");
      await setDoctorDailyLimit(firebaseUser.uid, n);
      setProfile((prev) => (prev ? { ...prev, dailyLimit: n } : prev));
    } catch (err) {
      setActionError(err.message || "Couldn't save the limit.");
    } finally {
      setSavingLimit(false);
    }
  }

  async function handleAccept(req) {
    setActionError(null);
    setBusyId(req.id);
    try {
      await acceptAppointment({
        appointmentId: req.id,
        doctorUid: firebaseUser.uid,
        patientUid: req.patientUid,
        patientName: req.patientName,
        patientId: req.patientId,
        dailyLimit: profile?.dailyLimit || null,
      });
    } catch (err) {
      console.error("acceptAppointment failed:", err);
      setActionError(err.message || "Couldn't accept this request.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(req) {
    setActionError(null);
    setBusyId(req.id);
    try {
      await rejectAppointment(req.id, rejectReason.trim());
      setRejectingId(null);
      setRejectReason("");
    } catch (err) {
      console.error("rejectAppointment failed:", err);
      setActionError(err.message || "Couldn't reject this request.");
    } finally {
      setBusyId(null);
    }
  }

  const limitReached = profile?.dailyLimit && acceptedToday >= Number(profile.dailyLimit);

  return (
    <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
      <div className="page-head">
        <h1>Patient Requests</h1>
        <p className="sub">New consultation requests waiting for your response.</p>
      </div>

      <div className="panel">
        <h3>Daily patient limit</h3>
        <p className="panel-note">
          {profile?.dailyLimit
            ? `Accepting up to ${profile.dailyLimit} patients today. Accepted so far: ${acceptedToday}.`
            : "No limit set — you can accept as many patients as you like."}
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          <input
            type="number"
            min="1"
            value={limitInput}
            onChange={(e) => setLimitInput(e.target.value)}
            placeholder="e.g. 20"
            style={{ width: 100, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8 }}
          />
          <button className="btn-primary" style={{ width: "auto", padding: "8px 18px" }} onClick={handleSaveLimit} disabled={savingLimit}>
            {savingLimit ? "Saving…" : "Save limit"}
          </button>
        </div>
        {limitReached && (
          <p className="panel-note" style={{ marginTop: 8 }}>
            You've reached today's limit. New accepts will be blocked until tomorrow, or raise the limit above.
          </p>
        )}
      </div>

      {actionError && (
        <div className="panel"><p className="panel-note">{actionError}</p></div>
      )}

      <div className="panel">
        <h3>Requests {requests !== null && `(${requests.length})`}</h3>
        {error && <p className="panel-note">Couldn't load requests: {error}</p>}
        {requests === null && !error && <p className="panel-note">Loading…</p>}
        {requests !== null && requests.length === 0 && (
          <div className="empty-state">
            <div className="big">No pending requests</div>
            <p>New patient requests will show up here.</p>
          </div>
        )}

        {requests?.map((req) => {
          const intake = intakes[req.id];
          const summary = intake?.summary;
          const hasRedFlags = summary?.redFlags?.length > 0;

          return (
            <div key={req.id} className="panel" style={{ marginTop: 14, borderColor: hasRedFlags ? "var(--red-600)" : undefined }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h3 style={{ marginBottom: 2 }}>{req.patientName}</h3>
                  <p className="panel-note">{req.patientId}</p>
                </div>
                {hasRedFlags && <StatusBadge type="emergency" label="Possible red flags" />}
              </div>

              {req.hasIntake && !intake && <p className="panel-note" style={{ marginTop: 10 }}>Loading AI summary…</p>}

              {summary && (
                <div style={{ marginTop: 10 }}>
                  <p><strong>Chief complaint:</strong> {summary.chiefComplaint || "—"}</p>
                  {summary.symptoms?.length > 0 && <p><strong>Symptoms:</strong> {summary.symptoms.join(", ")}</p>}
                  <p><strong>Duration:</strong> {summary.duration || "—"} &nbsp; <StatusBadge type={SEVERITY_BADGE[summary.severity]} label={summary.severity} /></p>
                  {hasRedFlags && <p style={{ color: "var(--red-600)" }}><strong>Red flags:</strong> {summary.redFlags.join(", ")}</p>}
                </div>
              )}

              {intake?.originalText && (
                <details style={{ marginTop: 10 }}>
                  <summary style={{ cursor: "pointer" }} className="panel-note">
                    Patient's own words ({intake.language || "original language"})
                  </summary>
                  <p style={{ marginTop: 6 }}>{intake.originalText}</p>
                </details>
              )}

              {!req.hasIntake && <p className="panel-note" style={{ marginTop: 10 }}>Patient sent this request without an AI summary.</p>}

              {rejectingId === req.id ? (
                <div style={{ marginTop: 12 }}>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason (optional) — shown to the patient"
                    style={{ width: "100%", minHeight: 60, padding: 10, border: "1px solid var(--line)", borderRadius: 8, fontFamily: "inherit", boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button className="btn-primary" style={{ width: "auto", padding: "8px 18px", background: "var(--red-600)" }} disabled={busyId === req.id} onClick={() => handleReject(req)}>
                      {busyId === req.id ? "Rejecting…" : "Confirm reject"}
                    </button>
                    <button className="btn-logout" style={{ padding: "8px 18px" }} onClick={() => { setRejectingId(null); setRejectReason(""); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  <button
                    className="btn-primary"
                    style={{ width: "auto", padding: "8px 18px" }}
                    disabled={busyId === req.id || limitReached}
                    onClick={() => handleAccept(req)}
                    title={limitReached ? "Daily limit reached" : undefined}
                  >
                    {busyId === req.id ? "Accepting…" : "Accept"}
                  </button>
                  <button className="btn-logout" style={{ padding: "8px 18px" }} onClick={() => setRejectingId(req.id)} disabled={busyId === req.id}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}