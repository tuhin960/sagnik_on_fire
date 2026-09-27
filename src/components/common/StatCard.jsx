// FILE: src/components/common/StatCard.jsx

import { useRef } from "react";

export default function StatCard({ label, value, meta, tint, icon }) {
  const ref = useRef(null);

  function handleMouseMove(e) {
    const card = ref.current;
    if (!card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 8;   // -4deg .. 4deg
    const rotateX = ((y / rect.height) - 0.5) * -8;  // -4deg .. 4deg
    card.style.transform = `translateY(-4px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  function handleMouseLeave() {
    const card = ref.current;
    if (!card) return;
    card.style.transform = "";
  }

  return (
    <div
      ref={ref}
      className="stat-card"
      style={tint ? { "--accent-tint": tint } : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {meta && <div className="meta">{meta}</div>}
    </div>
  );
}