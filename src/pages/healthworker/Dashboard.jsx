import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import StatusBadge from "../../components/common/StatusBadge";
import { UserPlus, ClipboardPlus, ArrowRightLeft } from "lucide-react";
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

export default function HealthWorkerDashboard() {
  const { profile, firebaseUser } = useAuth();
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
    const onErr = (e) => setError(e.message || "Some data couldn't load.");
    const unsubs = [
      listenToHealthworkerPatients(uid, setPatients, onErr),
      listenToHealthworkerAssessments(uid, setAssessments, onErr),
      listenToHealthworkerBookings(uid, setBookings, onErr),
      listenToReferralsByUser(uid, setReferrals, onErr),
      listenToOpenAlerts(setAlerts, onErr),
    ];
    return () => unsubs.forEach((u) => u());
  }, [firebaseUser]);

  const stats = useMemo(() => {
    const today = todayKey();

    const latest = new Map(); // assessments are newest-first
    (assessments || []).forEach((a) => {
      if (!latest.has(a.fieldPatientId)) latest.set(a.fieldPatientId, a);
    });
    const latestList = Array.from(latest.values());

    const highRisk = latestList.filter((a) => a.riskLevel === "high");
    const followUpsDue = latestList
      .filter((a) => a.followUpDate && a.followUpDate <= today)
      .sort((x, y) => x.followUpDate.localeCompare(y.followUpDate));

    return {
      highRisk,
      followUpsDue,
      referralsActive: (referrals || []).filter((r) => r.status === "sent" || r.status === "accepted").length,
      requestsPending: (bookings || []).filter((b) => b.status === "requested").length,
    };
  }, [assessments, referrals, bookings]);

  const loading = !patients || !assessments || !bookings || !referrals || !alerts;
  const val = (n) => (loading ? "…" : String(n));

  const statCards = [
    { id: 1, icon: "🚨", label: "Open Emergency Alerts", value: alerts?.length ?? 0, tint: "var(--red-100)" },
    { id: 2, icon: "🩺", label: "High-Risk Patients", value: stats.highRisk.length, tint: "var(--red-100)" },
    { id: 3, icon: "📅", label: "Follow-ups Due", value: stats.followUpsDue.length, tint: "var(--amber-100)", meta: "Overdue + today" },
    { id: 4, icon: "👥", label: "Assigned Patients", value: patients?.length ?? 0 },
    { id: 5, icon: "🔁", label: "Referrals In Progress", value: stats.referralsActive },
    { id: 6, icon: "📨", label: "Doctor Requests Pending", value: stats.requestsPending, meta: "Waiting for doctor to accept" },
  ].sort((a, b) => {
    // Only sort non-zero alerts to the front, everything else retains stable relative order
    if (a.id === 1 && a.value > 0) return -1;
    if (b.id === 1 && b.value > 0) return 1;
    return a.id - b.id;
  });

  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Today's field priorities{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}</h1>
        <p className="sub">Live from your patients, assessments, referrals and bookings.</p>
      </div>

      {error && <p className="panel-note">Some data couldn't load: {error}</p>}

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {statCards.map(c => (
          <StatCard key={c.id} icon={c.icon} label={c.label} value={val(c.value)} meta={c.meta} tint={c.tint} />
        ))}
      </div>

      <div className="panel">
        <h2 style={{ fontSize: 18, margin: "0 0 12px 0" }}>
          Follow-ups due
          {!loading && stats.followUpsDue.length > 0 && <StatusBadge type="urgent" label={String(stats.followUpsDue.length)} />}
        </h2>
        {loading && <p className="panel-note">Loading…</p>}
        {!loading && stats.followUpsDue.length === 0 && (
          <p className="panel-note">Nothing due today. You're all caught up.</p>
        )}
        {stats.followUpsDue.slice(0, 5).map((a) => (
          <div key={a.id} style={{ padding: "8px 0", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <strong>{a.fieldPatientName}</strong>
              <p className="panel-note">
                {a.followUpDate < todayKey() ? "Overdue since " : "Due "}
                {new Date(a.followUpDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
            </div>
            <button
              className="btn-primary"
              style={{ width: "auto", padding: "6px 14px" }}
              onClick={() => navigate("/healthworker/health-assessment", { state: { fieldPatientId: a.fieldPatientId, fieldPatientName: a.fieldPatientName } })}
            >
              Re-assess
            </button>
          </div>
        ))}
        {stats.followUpsDue.length > 5 && (
          <button className="btn-logout" style={{ marginTop: 10, padding: "8px 16px" }} onClick={() => navigate("/healthworker/follow-ups")}>
            View all follow-ups
          </button>
        )}
      </div>

      <div className="panel">
        <h2 style={{ fontSize: 18, margin: "0 0 12px 0" }}>
          High-risk patients
          {!loading && stats.highRisk.length > 0 && <StatusBadge type="emergency" label={String(stats.highRisk.length)} />}
        </h2>
        {loading && <p className="panel-note">Loading…</p>}
        {!loading && stats.highRisk.length === 0 && <p className="panel-note">No patients flagged high risk right now.</p>}
        {stats.highRisk.slice(0, 5).map((a) => (
          <div key={a.id} style={{ padding: "8px 0", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <strong>{a.fieldPatientName}</strong>
              {a.symptoms?.length > 0 && <p className="panel-note">{a.symptoms.join(", ")}</p>}
            </div>
            <button
              className="btn-primary"
              style={{ width: "auto", padding: "6px 14px" }}
              onClick={() => navigate("/healthworker/doctor-consultation", { state: { fieldPatientId: a.fieldPatientId, fieldPatientName: a.fieldPatientName } })}
            >
              Book Doctor
            </button>
          </div>
        ))}
        {stats.highRisk.length > 5 && (
          <button className="btn-logout" style={{ marginTop: 10, padding: "8px 16px" }} onClick={() => navigate("/healthworker/high-risk-patients")}>
            View all high-risk patients
          </button>
        )}
      </div>

      <div className="panel">
        <h2 style={{ fontSize: 18, margin: "0 0 12px 0" }}>Quick actions</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 8, width: "auto", padding: "10px 20px" }} onClick={() => navigate("/healthworker/register-patient")}><UserPlus size={18} /> Register Patient</button>
          <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 8, width: "auto", padding: "10px 20px" }} onClick={() => navigate("/healthworker/health-assessment")}><ClipboardPlus size={18} /> New Assessment</button>
          <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 8, width: "auto", padding: "10px 20px" }} onClick={() => navigate("/healthworker/referrals")}><ArrowRightLeft size={18} /> Referral</button>
        </div>
      </div>
    </DashboardLayout>
  );
}
