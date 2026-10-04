// FILE: src/pages/healthworker/FollowUps.jsx
//
// Follow-ups come from the follow-up date set in each patient's LATEST
// assessment. Grouped: Overdue / Today / Upcoming. Doing • fresh
// assessment (with or without • new date) automatically replaces the old
// follow-up, so nothing needs to be "marked done".

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import { listenToHealthworkerAssessments } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

const RISK_BADGE = { low: "fresh", medium: "urgent", high: "emergency" };

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

export default function HealthWorkerFollowUps() {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = listenToHealthworkerAssessments(
      firebaseUser.uid,
      (list) => { setError(null); setAssessments(list); },
      (err) => setError(err.message || "Couldn't load follow-ups.")
    );
    return unsub;
  }, [firebaseUser]);

  const groups = useMemo(() => {
    if (!assessments) return null;
    const today = todayKey();

    // list is already newest-first, so the first one seen per patient is the latest
    const latest = new Map();
    for (const a of assessments) {
      if (!latest.has(a.fieldPatientId)) latest.set(a.fieldPatientId, a);
    }

    const overdue = [], dueToday = [], upcoming = [];
    for (const a of latest.values()) {
      if (!a.followUpDate) continue;
      const diff = daysBetween(today, a.followUpDate);
      const item = { ...a, diff };
      if (diff < 0) overdue.push(item);
      else if (diff === 0) dueToday.push(item);
      else upcoming.push(item);
    }
    overdue.sort((x, y) => x.diff - y.diff);       // most overdue first
    upcoming.sort((x, y) => x.diff - y.diff);      // soonest first
    return { overdue, dueToday, upcoming };
  }, [assessments]);

  const total = groups ? groups.overdue.length + groups.dueToday.length + groups.upcoming.length : 0;

  function Section({ title, tone, items, note }) {
    if (!items.length) return null;
    return (
      <div className="panel">
        <h3>
          {title} <StatusBadge type={tone} label={String(items.length)} />
        </h3>
        {items.map((a) => (
          <div
            key={a.id}
            style={{ padding: "12px 0", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}
          >
            <div>
              <strong>{a.fieldPatientName}</strong>{" "}
              <StatusBadge type={RISK_BADGE[a.riskLevel] || "normal"} label={`${a.riskLevel || "low"} risk`} />
              <p className="panel-note">
                Follow-up: {prettyDate(a.followUpDate)} • {note(a.diff)}
              </p>
              {a.symptoms?.length > 0 && <p className="panel-note">Symptoms: {a.symptoms.join(", ")}</p>}
              {a.notes && <p className="panel-note">{a.notes}</p>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn-primary"
                style={{ width: "auto", padding: "8px 16px" }}
                onClick={() => navigate("/healthworker/health-assessment", { state: { fieldPatientId: a.fieldPatientId, fieldPatientName: a.fieldPatientName } })}
              >
                Re-assess
              </button>
              <button
                className="btn-logout"
                style={{ padding: "8px 16px" }}
                onClick={() => navigate("/healthworker/doctor-consultation", { state: { fieldPatientId: a.fieldPatientId, fieldPatientName: a.fieldPatientName } })}
              >
                Book Doctor
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Follow-ups</h1>
        <p className="sub">Patients due for • revisit, based on the date set in their last assessment.</p>
      </div>

      {error && <p className="panel-note">Couldn't load follow-ups: {error}</p>}
      {groups === null && !error && <p className="panel-note">Loading...</p>}

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
          <p>Set • follow-up date while saving • Patient Assessment and it will show up here.</p>
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


