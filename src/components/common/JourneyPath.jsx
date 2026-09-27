// FILE: src/components/common/JourneyPath.jsx
//
// The single "orchestrated moment" of motion on the login screen:
// one dot travels the referral path once, continuously — Village to
// Facility — echoing the product's core idea. Not decorative confetti,
// it's literally the workflow diagram from the architecture doc
// (Section 2), animated.

export default function JourneyPath() {
  const stops = [
    { x: 10, y: 40, label: "Village" },
    { x: 170, y: 100, label: "ASHA" },
    { x: 330, y: 40, label: "Doctor" },
    { x: 480, y: 100, label: "Facility" },
  ];

  return (
    <div className="journey-path">
      <svg viewBox="0 0 500 140" preserveAspectRatio="xMidYMid meet">
        <path
          className="journey-line"
          d="M 10 40 C 90 40, 90 100, 170 100 S 250 40, 330 40 S 410 100, 480 100"
        />
        {stops.map((s, i) => (
          <g key={s.label} className="journey-node" style={{ "--node-delay": `${i * 0.15}s` }}>
            <circle cx={s.x} cy={s.y} r="9" className="journey-node-halo" />
            <circle cx={s.x} cy={s.y} r="5" className="journey-node-dot" />
            <text x={s.x} y={s.y - 16} textAnchor="middle" className="journey-node-label">
              {s.label}
            </text>
          </g>
        ))}
        <circle r="6" className="journey-dot journey-dot-anim" />
      </svg>
    </div>
  );
}