// FILE: src/components/common/ComingSoon.jsx
//
// Placeholder body for pages scheduled in later phases (Section 13).
// Keeps every route (RULE 10) pointed at a real, distinct component
// without faking data that doesn't exist yet (RULE 3).

export default function ComingSoon({ title, phase }) {
  return (
    <div className="empty-state">
      <div className="big">{title}</div>
      <p>This module is scheduled for {phase}. Layout and data model already exist in the architecture — build begins here next.</p>
    </div>
  );
}
