// FILE: src/pages/healthworker/PatientVisits.jsx
//
// Visit log built from saved assessments (one assessment = one visit).
// Grouped by day, newest first. Filters: patient, risk, time range.
// No new collection / helper needed.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import {
  listenToHealthworkerAssessments,
  listenToHealthworkerPatients,
} from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

const RISK_BADGE = { low: "fresh", medium: "urgent", high: "emergency" };
const RANGES = [
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 days" },
  { value: "all", label: "All time" },
];

function ms(ts) {
  return ts?.toMillis ? ts.toMillis() : Date.now();
}

function dayKey(t) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayLabel(key) {
  const today = dayKey(Date.now());
  const yesterday = dayKey(Date.now() - 86400000);
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  return new Date(key + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function timeOfDay(t) {
  return new Date(t).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export default function HealthWorkerPatientVisits() {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState(null);
  const [patients, setPatients] = useState(null);
  const [error, setError] = useState(null);

  const [range, setRange] = useState("week");
  const [risk, setRisk] = useState("all");
  const [patientId, setPatientId] = useState("all");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const uid = firebaseUser.uid;
    const onErr = (e) => setError(e.message || "Couldn't load visits.");
    const u1 = listenToHealthworkerAssessments(uid, setAssessments, onErr);
    const u2 = listenToHealthworkerPatients(uid, setPatients, onErr);
    return () => { u1(); u2(); };
  }, [firebaseUser]);

  const summary = useMemo(() => {
    if (!assessments) return null;
    const today = dayKey(Date.now());
    const weekAgo = Date.now() - 7 * 86400000;
    const week = assessments.filter((a) => ms(a.createdAt) >= weekAgo);
    return {
      today: assessments.filter((a) => dayKey(ms(a.createdAt)) === today).length,
      week: week.length,
      people: new Set(week.map((a) => a.fieldPatientId)).size,
    };
  }, [assessments]);

  const groups = useMemo(() => {
    if (!assessments) return null;
    const today = dayKey(Date.now());
    const weekAgo = Date.now() - 7 * 86400000;

    const filtered = assessments.filter((a) => {
      const t = ms(a.createdAt);
      if (range === "today" && dayKey(t) !== today) return false;
      if (range === "week" && t < weekAgo) return false;
      if (risk !== "all" && a.riskLevel !== risk) return false;
      if (patientId !== "all" && a.fieldPatientId !== patientId) return false;
      return true;
    });

    const byDay = new Map(); // assessments are newest-first, so days stay in order
    filtered.forEach((a) => {
      const k = dayKey(ms(a.createdAt));
      if (!byDay.has(k)) byDay.set(k, []);
      byDay.get(k).push(a);
    });
    return { total: filtered.length, days: Array.from(byDay.entries()) };
  }, [assessments, range, risk, patientId]);

  function goAssess(a) {
    navigate("/healthworker/health-assessment", {
      state: { fieldPatientId: a.fieldPatientId, fieldPatientName: a.fieldPatientName },
    });
  }

  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Patient Visits</h1>
        <p className="sub">Every assessment you've done, counted as a visit.</p>
      </div>

      {error && <p className="panel-note">Couldn't load visits: {error}</p>}
      {groups === null && !error && <p className="panel-note">Loading…</p>}

      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 16 }}>
          <div className="panel" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--teal-600)" }}>{summary.today}</div>
            <p className="panel-note">Visits today</p>
          </div>
          <div className="panel" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--teal-600)" }}>{summary.week}</div>
            <p className="panel-note">Visits this week</p>
          </div>
          <div className="panel" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--teal-600)" }}>{summary.people}</div>
            <p className="panel-note">Patients met this week</p>
          </div>
        </div>
      )}

      {groups && (
        <div className="panel">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                className={range === r.value ? "btn-primary" : "btn-logout"}
                style={{ width: "auto", padding: "5px 14px", fontSize: 13 }}
                onClick={() => setRange(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Patient</label>
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                <option value="all">All patients</option>
                {patients?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Risk level</label>
              <select value={risk} onChange={(e) => setRisk(e.target.value)}>
                <option value="all">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <p className="panel-note" style={{ marginTop: 10 }}>{groups.total} visit{groups.total === 1 ? "" : "s"} found</p>
        </div>
      )}

      {groups && groups.total === 0 && (
        <div className="empty-state">
          <div className="big">No visits found</div>
          <p>Save a Patient Assessment and it will be logged here as a visit.</p>
          <button className="btn-primary" style={{ width: "auto", marginTop: 14, padding: "12px 26px" }} onClick={() => navigate("/healthworker/health-assessment")}>
            New Assessment
          </button>
        </div>
      )}

      {groups?.days.map(([key, list]) => (
        <div key={key} className="panel">
          <h3>
            {dayLabel(key)} <StatusBadge type="normal" label={`${list.length} visit${list.length === 1 ? "" : "s"}`} />
          </h3>

          {list.map((a) => {
            const v = a.vitals || {};
            const open = openId === a.id;
            return (
              <div key={a.id} style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center", cursor: "pointer" }}
                  onClick={() => setOpenId(open ? null : a.id)}
                >
                  <div>
                    <strong>{a.fieldPatientName}</strong>{" "}
                    <StatusBadge type={RISK_BADGE[a.riskLevel] || "normal"} label={`${a.riskLevel || "low"} risk`} />
                    <p className="panel-note">
                      {timeOfDay(ms(a.createdAt))}
                      {a.symptoms?.length ? ` · ${a.symptoms.join(", ")}` : " · no symptoms noted"}
                    </p>
                  </div>
                  <span className="panel-note">{open ? "Hide ▲" : "Details ▼"}</span>
                </div>

                {open && (
                  <div style={{ marginTop: 8, paddingLeft: 4 }}>
                    <p className="panel-note">
                      {v.temp ? `Temp ${v.temp}°F · ` : ""}
                      {v.pulse ? `Pulse ${v.pulse} bpm · ` : ""}
                      {v.spo2 ? `SpO2 ${v.spo2}% · ` : ""}
                      {v.bp ? `BP ${v.bp}` : ""}
                      {!v.temp && !v.pulse && !v.spo2 && !v.bp ? "No vitals recorded" : ""}
                    </p>
                    {a.notes && <p className="panel-note">📝 {a.notes}</p>}
                    {a.followUpDate && (
                      <p className="panel-note">
                        📌 Follow-up: {new Date(a.followUpDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                    <button className="btn-logout" style={{ padding: "6px 14px", marginTop: 8 }} onClick={() => goAssess(a)}>
                      Re-assess {a.fieldPatientName}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </DashboardLayout>
  );
}