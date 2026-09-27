// FILE: src/components/common/Sidebar.jsx
//
// One Sidebar, driven by a `items` prop, so each role's dashboard layout
// (Section 6) supplies its own nav list instead of five near-duplicate
// sidebar components (RULE 6 / RULE 7).

import { NavLink } from "react-router-dom";

export default function Sidebar({ items, open, roleLabel }) {
  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <div className="brand-mark">
        <span className="dot" />
        Swasth Setu
      </div>
      <nav>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-foot">{roleLabel}</div>
    </aside>
  );
}