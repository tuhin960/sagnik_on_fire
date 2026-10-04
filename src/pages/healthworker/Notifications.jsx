import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import { listenToHealthworkerBookings, listenToReferralsByUser } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

function ms(timestamp) {
  if (!timestamp) return 0;
  return timestamp.toMillis ? timestamp.toMillis() : Date.now();
}

function timeAgo(ms) {
  const diff = Math.floor((Date.now() - ms) / 60000); // minutes
  if (diff < 1) return "Just now";
  if (diff < 60) return diff + " min ago";
  const h = Math.floor(diff / 60);
  if (h < 24) return h + " hr ago";
  return Math.floor(h / 24) + " days ago";
}

export default function HealthWorkerNotifications() {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();
  const uid = firebaseUser?.uid;
  
  const [appts, setAppts] = useState(null);
  const [refs, setRefs] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid) return;
    const onErr = (e) => setError(e.message || "Some notifications couldn't load.");
    const unsubs = [
      listenToHealthworkerBookings(uid, setAppts, onErr),
      listenToReferralsByUser(uid, setRefs, onErr),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid]);

  const loading = !appts || !refs;

  const items = useMemo(() => {
    const out = [];

    // Appointments (Consultations)
    (appts || []).forEach((a) => {
      if (a.status === "waiting") {
        out.push({
          id: `a-${a.id}-w`, type: "consultation", time: ms(a.acceptedAt || a.createdAt),
          title: `Dr. ${a.doctorName} accepted consultation`,
          body: `Token number is #${a.tokenNumber} for your patient ${a.patientName}.`,
          to: "/healthworker/doctor-consultation"
        });
      } else if (a.status === "rejected") {
        out.push({
          id: `a-${a.id}-r`, type: "consultation", time: ms(a.rejectedAt || a.createdAt), tone: "emergency",
          title: `Dr. ${a.doctorName} declined consultation`,
          body: a.rejectReason ? `Reason: ${a.rejectReason} (Patient: ${a.patientName})` : `Request for ${a.patientName} was declined.`,
          to: "/healthworker/doctor-consultation"
        });
      }
    });

    // Referrals
    (refs || []).forEach((r) => {
      if (r.status === "accepted") {
        out.push({
          id: `rf-${r.id}`, type: "referral", time: ms(r.updatedAt || r.createdAt), tone: "fresh",
          title: `Referral Accepted at ${r.toFacility}`,
          body: `Your referral for ${r.patientName} has been accepted.`,
          to: "/healthworker/referrals"
        });
      } else if (r.status === "completed") {
        out.push({
          id: `rf-${r.id}-c`, type: "referral", time: ms(r.updatedAt || r.createdAt), tone: "normal",
          title: `Referral Completed`,
          body: `Treatment for ${r.patientName} at ${r.toFacility} is complete.`,
          to: "/healthworker/referrals"
        });
      }
    });

    out.sort((x, y) => y.time - x.time);
    return out.slice(0, 60);
  }, [appts, refs]);

  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Notifications</h1>
        <p className="sub">Updates on your patients' referrals and doctor consultations.</p>
      </div>

      {error && <p className="panel-note">Some notifications couldn't load: {error}</p>}
      {loading && !error && <p className="panel-note">Loading...</p>}

      {!loading && items.length === 0 && (
        <div className="empty-state">
          <div className="big">No recent updates</div>
          <p>When a doctor accepts your consultation request or referral, it will appear here.</p>
        </div>
      )}

      {!loading && items.map((n) => (
        <div
          key={n.id}
          className="panel"
          style={{ cursor: "pointer", borderLeft: "4px solid var(--teal-600)" }}
          onClick={() => navigate(n.to)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <strong>
              {n.title}
              {n.tone && <StatusBadge type={n.tone} label={n.tone === "emergency" ? "Declined" : "Update"} />}
            </strong>
            <span className="panel-note">{timeAgo(n.time)}</span>
          </div>
          <p className="panel-note">{n.body}</p>
        </div>
      ))}
    </DashboardLayout>
  );
}
