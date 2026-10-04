// FILE: src/pages/patient/Notifications.jsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import {
  listenToPatientAppointments,
  listenToPatientPrescriptions,
  listenToPatientReferrals,
  listenToPatientConsultations,
  listenToPatientAlerts,
  listenToPatientPharmacyRequests,
} from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

function ms(timestamp) {
  if (!timestamp) return 0;
  return timestamp.toMillis ? timestamp.toMillis() : Date.now();
}

function timeAgo(ms) {
  const diff = Math.floor((Date.now() - ms) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return diff + " min ago";
  const h = Math.floor(diff / 60);
  if (h < 24) return h + " hr ago";
  return Math.floor(h / 24) + " days ago";
}

function prettyDate(key) {
  return new Date(key + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const FILTERS = ["all", "appointment", "prescription", "referral", "followup", "alert", "pharmacy"];
const TYPE_META = {
  appointment: { label: "Appointments", icon: "📅", to: "/patient/appointments" },
  prescription: { label: "Prescriptions", icon: "📝", to: "/patient/prescriptions" },
  referral: { label: "Referrals", icon: "🔁", to: "/patient/referrals" },
  followup: { label: "Follow-ups", icon: "⏰", to: "/patient/prescriptions" },
  alert: { label: "Alerts", icon: "🚨", to: "/patient/emergency-help" },
  pharmacy: { label: "Pharmacy", icon: "💊", to: "/patient/prescriptions" },
};

export default function PatientNotifications() {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();
  const uid = firebaseUser?.uid;
  const storeKey = uid ? `swasth_notif_seen_${uid}` : null;

  const [appts, setAppts] = useState(null);
  const [rx, setRx] = useState(null);
  const [refs, setRefs] = useState(null);
  const [cons, setCons] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [pharmReqs, setPharmReqs] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [seenAt, setSeenAt] = useState(0);

  useEffect(() => {
    if (!storeKey) return;
    try {
      setSeenAt(Number(localStorage.getItem(storeKey)) || 0);
    } catch {
      setSeenAt(0);
    }
  }, [storeKey]);

  useEffect(() => {
    if (!uid) return;
    const onErr = (e) => setError(e.message || "Some notifications couldn't load.");
    const unsubs = [
      listenToPatientAppointments(uid, setAppts, onErr),
      listenToPatientPrescriptions(uid, setRx, onErr),
      listenToPatientReferrals(uid, setRefs, onErr),
      listenToPatientConsultations(uid, setCons, onErr),
      listenToPatientAlerts(uid, setAlerts, onErr),
      listenToPatientPharmacyRequests(uid, setPharmReqs, onErr),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid]);

  const loading = !appts || !rx || !refs || !cons || !alerts || !pharmReqs;

  const items = useMemo(() => {
    const out = [];

    (appts || []).forEach((a) => {
      if (a.status === "waiting") {
        out.push({
          id: `a-${a.id}-w`, type: "appointment", time: ms(a.acceptedAt || a.createdAt),
          title: `${a.doctorName || "Doctor"} accepted your request`,
          body: a.tokenNumber != null ? `Your token number is #${a.tokenNumber}. Please wait for your turn.` : "Please wait for your turn.",
        });
      } else if (a.status === "in-progress") {
        if (a.joinCode) {
          const scheduledDate = a.scheduledTime?.toMillis ? new Date(a.scheduledTime.toMillis()) : new Date();
          const timeStr = scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          out.push({
            id: `a-${a.id}-p`, type: "appointment", time: ms(a.scheduledTime || a.createdAt),
            title: "Consultation Scheduled",
            body: `Dr. ${a.doctorName || "Your doctor"} has scheduled a call at ${timeStr}. Join code: ${a.joinCode} (Valid for 3 mins).`,
          });
        } else {
          out.push({
            id: `a-${a.id}-p`, type: "appointment", time: ms(a.acceptedAt || a.createdAt),
            title: "Your consultation has started",
            body: `${a.doctorName || "Your doctor"} is ready for you${a.tokenNumber != null ? ` (token #${a.tokenNumber})` : ""}.`,
          });
        }
      } else if (a.status === "rejected") {
        out.push({
          id: `a-${a.id}-r`, type: "appointment", time: ms(a.rejectedAt || a.createdAt), tone: "emergency",
          title: `${a.doctorName || "Doctor"} couldn't accept your request`,
          body: a.rejectReason ? `Reason: ${a.rejectReason}` : "You can book another doctor from Find Doctor.",
        });
      }
    });

    (rx || []).forEach((p) => {
      const n = p.medicines?.length || 0;
      out.push({
        id: `rx-${p.id}`, type: "prescription", time: ms(p.createdAt),
        title: `New prescription from ${p.doctorName || "your doctor"}`,
        body: `${n} medicine${n === 1 ? "" : "s"} prescribed${p.medicines?.[0]?.name ? `, including ${p.medicines[0].name}` : ""}.`,
      });
    });

    (refs || []).forEach((r) => {
      out.push({
        id: `rf-${r.id}`, type: "referral", time: ms(r.createdAt),
        tone: r.urgency === "emergency" ? "emergency" : r.urgency === "urgent" ? "urgent" : undefined,
        title: `Referred to ${r.toFacility}`,
        body: `By ${r.referredByName || "your doctor"}${r.reason ? `: ${r.reason}` : ""}`,
      });
    });

    (cons || []).forEach((c) => {
      if (c.followUpDate) {
        out.push({
          id: `fu-${c.id}`, type: "followup", time: ms(c.createdAt),
          title: `Follow-up on ${prettyDate(c.followUpDate)}`,
          body: `${c.doctorName || "Your doctor"} asked you to come back for a check-up.`,
        });
      }
    });

    (alerts || []).forEach((al) => {
      if (al.status === "acknowledged") {
        out.push({
          id: `al-${al.id}`, type: "alert", time: ms(al.acknowledgedAt || al.createdAt), tone: "fresh",
          title: "Your emergency alert was received",
          body: `Acknowledged by ${al.acknowledgedBy || "a health worker"}.`,
        });
      }
    });

    (pharmReqs || []).forEach((req) => {
      if (req.status === "responded") {
        const avail = Object.values(req.medicinesStatus || {}).filter(v => v === "available").length;
        const total = req.prescriptionData?.medicines?.length || 0;
        out.push({
          id: `phr-${req.id}`, type: "pharmacy", time: ms(req.updatedAt), tone: "fresh",
          title: `Pharmacy Response: ${req.pharmacyName}`,
          body: `${avail} out of ${total} medicines are available in stock.`,
        });
      }
    });

    out.sort((x, y) => y.time - x.time);
    return out.slice(0, 60);
  }, [appts, rx, refs, cons, alerts, pharmReqs]);

  const shown = filter === "all" ? items : items.filter((i) => i.type === filter);
  const unread = items.filter((i) => i.time > seenAt).length;

  function markAllRead() {
    const now = Date.now();
    setSeenAt(now);
    try {
      if (storeKey) localStorage.setItem(storeKey, String(now));
    } catch {
      // ignore
    }
  }

  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>Notifications</h1>
        <p className="sub">Live updates on your appointments, prescriptions and referrals.</p>
      </div>

      {error && <p className="panel-note">Some notifications couldn't load: {error}</p>}
      {loading && !error && <p className="panel-note">Loading...</p>}

      {!loading && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={filter === f ? "btn-primary" : "btn-logout"}
                  style={{ width: "auto", padding: "5px 14px", fontSize: 13 }}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "All" : `${TYPE_META[f].icon} ${TYPE_META[f].label}`}
                </button>
              ))}
            </div>
            <button className="btn-logout" style={{ padding: "6px 16px", fontSize: 13 }} disabled={unread === 0} onClick={markAllRead}>
              Mark all as read {unread > 0 && `(${unread})`}
            </button>
          </div>

          {shown.length === 0 && (
            <div className="empty-state">
              <div className="big">No notifications</div>
              <p>Updates from your doctors and pharmacies will show up here.</p>
            </div>
          )}

          {shown.map((n) => {
            const meta = TYPE_META[n.type];
            const isNew = n.time > seenAt;
            return (
              <div
                key={n.id}
                className="panel"
                style={{ cursor: "pointer", borderLeft: isNew ? "4px solid var(--teal-600)" : "4px solid transparent" }}
                onClick={() => navigate(meta.to)}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 24 }}>{meta.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <strong>
                        {n.title}{" "}
                        {isNew && <StatusBadge type={n.tone || "normal"} label="New" />}
                      </strong>
                      <span className="panel-note">{timeAgo(n.time)}</span>
                    </div>
                    <p className="panel-note">{n.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </DashboardLayout>
  );
}
