// FILE: src/pages/healthworker/TodaysTasks.jsx
//
// Auto-generated to-do list from live data (no extra collection):
//   1. Open emergency alerts
//   2. High-risk patients with NO doctor booking / referral made since
//      their latest assessment
//   3. Follow-ups due today or overdue (latest assessment per patient)
//   4. Registered patients never assessed yet
// A task disappears by itself once the underlying work is done.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import {
  listenToHealthworkerPatients,
  listenToHealthworkerAssessments,
  listenToHealthworkerBookings,
  listenToReferralsByUser,
  listenToOpenAlerts,
} from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ms(ts) {
  return ts?.toMillis ? ts.toMillis() : Date.now();
}

function prettyDate(key) {
  return new Date(key + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function HealthWorkerTodaysTasks() {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();

  const [patients, setPatients] = useState(null);
  const [assessments, setAssessments] = useState(null);
  const [bookings, setBookings] = useState(null);
  const [referrals, setReferrals] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const uid = firebaseUser.uid;
    const onErr = (e) => setError(e.message || "Some tasks couldn't load.");
    const unsubs = [
      listenToHealthworkerPatients(uid, setPatients, onErr),
      listenToHealthworkerAssessments(uid, setAssessments, onErr),
      listenToHealthworkerBookings(uid, setBookings, onErr),
      listenToReferralsByUser(uid, setReferrals, onErr),
      listenToOpenAlerts(setAlerts, onErr),
    ];
    return () => unsubs.forEach((u) => u());
  }, [firebaseUser]);

  const loading = !patients || !assessments || !bookings || !referrals || !alerts;

  const tasks = useMemo(() => {
    if (loading) return [];
    const today = todayKey();
    const out = [];

    // 1 — emergency alerts
    alerts.forEach((a) => {
      out.push({
        id: `al-${a.id}`, priority: 1, tone: "emergency", icon: "🚨",
        title: `Emergency: ${a.patientName || "a patient"}`,
        detail: a.message || "Patient requested emergency help.",
        action: { label: "Open Emergency Cases", to: "/healthworker/emergency-cases" },
      });
    });

    // latest assessment per patient (list is newest-first)
    const latest = new Map();
    assessments.forEach((a) => { if (!latest.has(a.fieldPatientId)) latest.set(a.fieldPatientId, a); });

    // 2 — high-risk with no follow-through since that assessment
    latest.forEach((a) => {
      if (a.riskLevel !== "high") return;
      const since = ms(a.createdAt);
      const booked = bookings.some((b) => b.patientId === a.fieldPatientId && ms(b.createdAt) >= since);
      const referred = referrals.some((r) => r.patientRefId === a.fieldPatientId && ms(r.createdAt) >= since);
      if (booked || referred) return;
      out.push({
        id: `hr-${a.id}`, priority: 2, tone: "emergency", icon: "⚠️",
        title: `${a.fieldPatientName} is high risk`,
        detail: `${a.symptoms?.length ? a.symptoms.join(", ") : "Flagged from vitals"} · no doctor booking or referral yet`,
        action: { label: "Book Doctor", to: "/healthworker/doctor-consultation", patient: a },
        action2: { label: "Refer", to: "/healthworker/referrals", patient: a },
      });
    });

    // 3 — follow-ups due today or overdue
    latest.forEach((a) => {
      if (!a.followUpDate || a.followUpDate > today) return;
      const overdue = a.followUpDate < today;
      out.push({
        id: `fu-${a.id}`, priority: 3, tone: overdue ? "urgent" : "normal", icon: "⏰",
        title: `Follow-up: ${a.fieldPatientName}`,
        detail: overdue ? `Overdue since ${prettyDate(a.followUpDate)}` : "Due today",
        action: { label: "Re-assess", to: "/healthworker/health-assessment", patient: a },
      });
    });

    // 4 — never assessed
    patients.forEach((p) => {
      if (latest.has(p.id)) return;
      out.push({
        id: `na-${p.id}`, priority: 4, tone: "normal", icon: "🩺",
        title: `First assessment: ${p.name}`,
        detail: `${p.village || "Village not noted"} · registered, not yet assessed`,
        action: { label: "Assess", to: "/healthworker/health-assessment", patient: { fieldPatientId: p.id, fieldPatientName: p.name } },
      });
    });

    out.sort((x, y) => x.priority - y.priority);
    return out;
  }, [loading, patients, assessments, bookings, referrals, alerts]);

  function go(a) {
    navigate(a.to, a.patient ? { state: { fieldPatientId: a.patient.fieldPatientId, fieldPatientName: a.patient.fieldPatientName } } : undefined);
  }

  const counts = {
    emergency: tasks.filter((t) => t.priority === 1).length,
    highRisk: tasks.filter((t) => t.priority === 2).length,
    followUps: tasks.filter((t) => t.priority === 3).length,
    firstAssess: tasks.filter((t) => t.priority === 4).length,
  };

  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Today's Tasks</h1>
        <p className="sub">Built live from your patients. A task disappears once the work is done.</p>
      </div>

      {error && <p className="panel-note">Some tasks couldn't load: {error}</p>}
      {loading && !error && <p className="panel-note">Loading…</p>}

      {!loading && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 16 }}>
            {[
              ["🚨 Emergency", counts.emergency, "var(--red-600)"],
              ["⚠️ High-risk", counts.highRisk, "var(--red-600)"],
              ["⏰ Follow-ups", counts.followUps, "var(--amber-600)"],
              ["🩺 First assessments", counts.firstAssess, "var(--teal-600)"],
            ].map(([label, n, color]) => (
              <div key={label} className="panel" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color }}>{n}</div>
                <p className="panel-note">{label}</p>
              </div>
            ))}
          </div>

          {tasks.length === 0 && (
            <div className="empty-state">
              <div className="big">All done for today 🎉</div>
              <p>No pending emergencies, follow-ups or assessments.</p>
            </div>
          )}

          {tasks.map((t) => (
            <div key={t.id} className="panel">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 24 }}>{t.icon}</div>
                  <div>
                    <strong>{t.title}</strong>{" "}
                    <StatusBadge type={t.tone} label={t.priority === 1 ? "Now" : t.priority === 2 ? "Urgent" : t.priority === 3 ? "Due" : "To do"} />
                    <p className="panel-note">{t.detail}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn-primary" style={{ width: "auto", padding: "8px 16px" }} onClick={() => go(t.action)}>
                    {t.action.label}
                  </button>
                  {t.action2 && (
                    <button className="btn-logout" style={{ padding: "8px 16px" }} onClick={() => go(t.action2)}>
                      {t.action2.label}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </DashboardLayout>
  );
}