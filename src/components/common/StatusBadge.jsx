// FILE: src/components/common/StatusBadge.jsx
//
// One reusable status pill used across Referral, Resource-freshness and
// Urgency states (RULE 6 — reusable across Doctor/Facility/Patient/Admin).

const MAP = {
  emergency: { cls: "badge-emergency", label: "Emergency" },
  urgent: { cls: "badge-urgent", label: "Urgent" },
  normal: { cls: "badge-normal", label: "Normal" },
  fresh: { cls: "badge-fresh", label: "Fresh" },
  stale: { cls: "badge-stale", label: "Stale" },
  demo: { cls: "badge-demo", label: "Demo Data" },
};

export default function StatusBadge({ type, label }) {
  const cfg = MAP[type] || MAP.normal;
  return (
    <span className={`badge ${cfg.cls}`}>
      <span className="badge-dot" />
      {label || cfg.label}
    </span>
  );
}