// FILE: src/pages/healthworker/DoctorConsultation.jsx
//
// ASHA books a doctor consultation on behalf of a field patient.
// Flow: choose patient -> choose doctor -> optional note -> Send request.
// The doctor sees it in Patient Requests (status "requested"); token is
// assigned only when the doctor accepts. Live status list is shown below.

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import {
  listAllDoctors,
  listenToHealthworkerPatients,
  listenToHealthworkerBookings,
  requestAppointmentForFieldPatient,
  sendEmergencyAlert,
} from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

const STATUS_VIEW = {
  requested: { type: "urgent", label: "Waiting for doctor" },
  waiting: { type: "fresh", label: "Accepted" },
  "in-progress": { type: "normal", label: "In consultation" },
  done: { type: "normal", label: "Completed" },
  rejected: { type: "emergency", label: "Rejected" },
};

export default function HealthWorkerDoctorConsultation() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { profile, firebaseUser } = useAuth();

  const [patients, setPatients] = useState(null);
  const [doctors, setDoctors] = useState(null);
  const [bookings, setBookings] = useState(null);

  const [fieldPatientId, setFieldPatientId] = useState(state?.fieldPatientId || "");
  const [fieldPatientName, setFieldPatientName] = useState(state?.fieldPatientName || "");
  const [isEmergency, setIsEmergency] = useState(state?.isEmergency || false);
  const [doctor, setDoctor] = useState(null);
  const [note, setNote] = useState("");
  const [specFilter, setSpecFilter] = useState("All");

  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const u1 = listenToHealthworkerPatients(firebaseUser.uid, setPatients, (e) => setError(e.message));
    const u2 = listenToHealthworkerBookings(firebaseUser.uid, setBookings, (e) => setError(e.message));
    return () => { u1(); u2(); };
  }, [firebaseUser]);

  useEffect(() => {
    let cancelled = false;
    listAllDoctors()
      .then((l) => { if (!cancelled) setDoctors(l); })
      .catch((e) => { if (!cancelled) { setDoctors([]); setError(e.message || "Couldn't load doctors."); } });
    return () => { cancelled = true; };
  }, []);

  const specializations = useMemo(() => {
    const set = new Set((doctors || []).map((d) => d.specialization || "General Physician"));
    return ["All", ...Array.from(set)];
  }, [doctors]);

  const visibleDoctors = (doctors || []).filter(
    (d) => specFilter === "All" || (d.specialization || "General Physician") === specFilter
  );

  async function handleSend() {
    setError(null);
    setSuccess(null);
    if (!fieldPatientId) return setError("Choose a patient first.");
    if (!doctor) return setError("Choose a doctor first.");

    // Block accidental duplicates: same patient + same doctor still pending today.
    const dup = (bookings || []).find(
      (b) => b.patientId === fieldPatientId && b.doctorUid === doctor.uid && b.status === "requested"
    );
    if (dup) return setError(`A request for ${fieldPatientName} to ${doctor.name} is already waiting.`);

    setSending(true);
    try {
      await requestAppointmentForFieldPatient({
        doctorUid: doctor.uid,
        doctorName: doctor.name,
        fieldPatientId,
        fieldPatientName,
        healthworkerUid: firebaseUser.uid,
        healthworkerName: profile?.name || "Health Worker",
        note: note.trim(),
      });

      if (isEmergency) {
        await sendEmergencyAlert({
          patientUid: fieldPatientId,
          patientName: fieldPatientName,
          patientId: fieldPatientId,
          message: `URGENT (From ${profile?.name}): High-risk patient ${fieldPatientName} requesting consultation with Dr. ${doctor.name}. ${note.trim()}`,
        });
      }

      setSuccess(isEmergency ? `Emergency request sent to ${doctor.name} for ${fieldPatientName}.` : `Request sent to ${doctor.name} for ${fieldPatientName}.`);
      setNote("");
      setDoctor(null);
      setIsEmergency(false);
    } catch (err) {
      console.error("requestAppointmentForFieldPatient failed:", err);
      setError(err.message || "Couldn't send the request.");
    } finally {
      setSending(false);
    }
  }

  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Doctor Consultation</h1>
        <p className="sub">Request a doctor for a patient you registered. The token is given once the doctor accepts.</p>
        {isEmergency && (
          <div style={{ marginTop: 12, padding: "10px 14px", backgroundColor: "var(--red-50)", color: "var(--red-700)", borderLeft: "4px solid var(--red-600)", borderRadius: 4, display: "flex", alignItems: "center", gap: 10 }}>
            <strong>⚠️ HIGH RISK PATIENT:</strong> Sending this request will trigger a critical emergency alert for the doctor.
          </div>
        )}
      </div>

      {/* 1 — Patient */}
      <div className="panel">
        <h3>1 · Patient {fieldPatientId && <StatusBadge type="fresh" label={fieldPatientName} />}</h3>
        {patients === null && <p className="panel-note">Loading…</p>}
        {patients?.length === 0 && (
          <div className="empty-state">
            <div className="big">No patients registered yet</div>
            <button className="btn-primary" style={{ width: "auto", marginTop: 14, padding: "12px 26px" }} onClick={() => navigate("/healthworker/register-patient")}>
              Register Patient
            </button>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
          {patients?.map((p) => {
            const active = p.id === fieldPatientId;
            return (
              <button
                key={p.id}
                type="button"
                className={active ? "btn-primary" : "btn-logout"}
                style={{ width: "auto", padding: "8px 18px" }}
                onClick={() => { setFieldPatientId(p.id); setFieldPatientName(p.name); setSuccess(null); }}
              >
                {p.name}{p.age ? ` · ${p.age}` : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2 — Doctor */}
      <div className="panel">
        <h3>2 · Doctor {doctor && <StatusBadge type="fresh" label={doctor.name} />}</h3>
        {doctors === null && <p className="panel-note">Loading doctors…</p>}
        {doctors?.length === 0 && <p className="panel-note">No doctors registered yet.</p>}

        {doctors?.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {specializations.map((s) => (
              <button
                key={s}
                type="button"
                className={s === specFilter ? "btn-primary" : "btn-logout"}
                style={{ width: "auto", padding: "5px 14px", fontSize: 13 }}
                onClick={() => setSpecFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="doctor-grid">
          {visibleDoctors.map((d) => {
            const active = doctor?.uid === d.uid;
            return (
              <div key={d.uid} className="panel doctor-card" style={active ? { outline: "2px solid var(--teal-600)" } : undefined}>
                <div className="doctor-card-avatar">⚕️</div>
                <div>
                  <h3 style={{ marginBottom: 2 }}>{d.name}</h3>
                  <p className="panel-note">{d.specialization || "General Physician"}</p>
                </div>
                <button
                  type="button"
                  className={active ? "btn-primary doctor-card-btn" : "btn-logout doctor-card-btn"}
                  onClick={() => { setDoctor(d); setSuccess(null); }}
                >
                  {active ? "Selected ✓" : "Select"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3 — Note + send */}
      <div className="panel">
        <h3>3 · Note for doctor (optional)</h3>
        <div className="field">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Main problem, since when, anything the doctor should know…"
            style={{ width: "100%", minHeight: 80, padding: 10, border: "1px solid var(--line)", borderRadius: 8, fontFamily: "inherit", boxSizing: "border-box" }}
          />
        </div>

        {error && <p className="form-error">{error}</p>}
        {success && <p className="panel-note" style={{ color: "var(--green-600)" }}>{success}</p>}

        <button className="btn-primary" style={{ width: "auto", padding: "12px 26px" }} disabled={sending} onClick={handleSend}>
          {sending ? "Sending…" : "Send Request"}
        </button>
      </div>

      {/* Live bookings */}
      <div className="panel">
        <h3>My Bookings</h3>
        {bookings === null && <p className="panel-note">Loading…</p>}
        {bookings?.length === 0 && <p className="panel-note">No consultation requests yet.</p>}

        {bookings?.map((b) => {
          const v = STATUS_VIEW[b.status] || STATUS_VIEW.requested;
          return (
            <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 0", borderTop: "1px solid var(--line)", flexWrap: "wrap" }}>
              <div>
                <strong>{b.patientName}</strong>
                <p className="panel-note">→ {b.doctorName} · {b.date}</p>
                {b.status === "rejected" && b.rejectReason && (
                  <p className="panel-note" style={{ color: "var(--red-600)" }}>Reason: {b.rejectReason}</p>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {b.tokenNumber != null && <span className="panel-note">Token #{b.tokenNumber}</span>}
                <StatusBadge type={v.type} label={v.label} />
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}