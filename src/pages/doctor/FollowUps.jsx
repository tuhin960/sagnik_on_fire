// FILE: src/pages/doctor/FollowUps.jsx
//
// Follow-ups come from the follow-up date the doctor set when finishing a
// consultation. Only each patient's LATEST consultation counts, so a newer
// consultation (with or without a new date) replaces the old follow-up.
// Grouped: Overdue / Today / Upcoming, with quick actions per patient.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import { listenToDoctorConsultations } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(fromKey, toKey) {
  const a = new Date(fromKey + "T00:00:00");
  const b = new Date(toKey + "T00:00:00");
  return Math.round((b - a) / 86400000);
}

function prettyDate(key) {
  return new Date(key + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function DoctorFollowUps() {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = listenToDoctorConsultations(
      firebaseUser.uid,
      (list) => { setError(null); setConsultations(list); },
      (err) => setError(err.message || "Couldn't load follow-ups.")
    );
    return unsub;
  }, [firebaseUser]);

  const groups = useMemo(() => {
    if (!consultations) return null;
    const today = todayKey();

    // list is newest-first, so the first one seen per patient is the latest
    const latest = new Map();
    for (const c of consultations) {
      const key = c.patientUid || c.patientId;
      if (key && !latest.has(key)) latest.set(key, c);
    }

    const overdue = [], dueToday = [], upcoming = [];
    for (const c of latest.values()) {
      if (!c.followUpDate) continue;
      const diff = daysBetween(today, c.followUpDate);
      const item = { ...c, diff };
      if (diff < 0) overdue.push(item);
      else if (diff === 0) dueToday.push(item);
      else upcoming.push(item);
    }
    overdue.sort((x, y) => x.diff - y.diff);   // most overdue first
    upcoming.sort((x, y) => x.diff - y.diff);  // soonest first
    return { overdue, dueToday, upcoming };
  }, [consultations]);

  const total = groups ? groups.overdue.length + groups.dueToday.length + groups.upcoming.length : 0;

  function patientState(c) {
    return { patientUid: c.patientUid, patientName: c.patientName, patientId: c.patientId };
  }

  function Section({ title, tone, items, note }) {
    if (!items.length) return null;
    return (
      <div className="panel">
        <h3>
          {title} <StatusBadge type={tone} label={String(items.length)} />
        </h3>
        {items.map((c) => (
          <div
            key={c.id}
            style={{ padding: "12px 0", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}
          >
            <div>
              <strong>{c.patientName}</strong>
              <p className="panel-note">
                Follow-up: {prettyDate(c.followUpDate)} · {note(c.diff)}
              </p>
              {c.diagnosis && <p className="panel-note">Last diagnosis: {c.diagnosis}</p>}
              {c.advice && <p className="panel-note">Advice: {c.advice}</p>}
            </div>
            {c.patientUid ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className="btn-primary"
                  style={{ width: "auto", padding: "8px 16px" }}
                  onClick={() => navigate("/doctor/patient-details", { state: patientState(c) })}
                >
                  Patient Details
                </button>
                <button
                  className="btn-logout"
                  style={{ padding: "8px 16px" }}
                  onClick={() => navigate("/doctor/prescriptions", { state: patientState(c) })}
                >
                  Prescribe
                </button>
                <button
                  className="btn-logout"
                  style={{ padding: "8px 16px" }}
                  onClick={() => navigate("/doctor/refer-patient", { state: patientState(c) })}
                >
                  Refer
                </button>
              </div>
            ) : (
              <span className="panel-note">Field patient (booked by health worker)</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
      <div className="page-head">
        <h1>Follow-up</h1>
        <p className="sub">Patients due for a revisit, based on the date you set in their last consultation.</p>
      </div>

      {error && <p className="panel-note">Couldn't load follow-ups: {error}</p>}
      {groups === null && !error && <p className="panel-note">Loading…</p>}

      {groups && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 16 }}>
          <div className="panel" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--red-600)" }}>{groups.overdue.length}</div>
            <p className="panel-note">Overdue</p>
          </div>
          <div className="panel" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--amber-600)" }}>{groups.dueToday.length}</div>
            <p className="panel-note">Due today</p>
          </div>
          <div className="panel" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--teal-600)" }}>{groups.upcoming.length}</div>
            <p className="panel-note">Upcoming</p>
          </div>
        </div>
      )}

      {groups && total === 0 && (
        <div className="empty-state">
          <div className="big">No follow-ups scheduled</div>
          <p>Set a follow-up date while finishing a consultation and it will show up here.</p>
        </div>
      )}

      {groups && (
        <>
          <Section title="Overdue" tone="emergency" items={groups.overdue} note={(d) => `${Math.abs(d)} day${Math.abs(d) === 1 ? "" : "s"} overdue`} />
          <Section title="Due today" tone="urgent" items={groups.dueToday} note={() => "due today"} />
          <Section title="Upcoming" tone="normal" items={groups.upcoming} note={(d) => `in ${d} day${d === 1 ? "" : "s"}`} />
        </>
      )}
    </DashboardLayout>
  );
}