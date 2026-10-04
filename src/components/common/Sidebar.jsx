// FILE: src/components/common/Sidebar.jsx
//
// One Sidebar, driven by a `items` prop, so each role's dashboard layout
// (Section 6) supplies its own nav list instead of five near-duplicate
// sidebar components (RULE 6 / RULE 7).
//
// Items are one of two shapes:
//   { to, label, icon }            -> normal NavLink
//   { action: "logout", label, icon } -> signs the user out instead of
//                                        navigating (every role's list
//                                        ends with one of these now).

import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../firebase/auth";
import * as LucideIcons from "lucide-react";

export default function Sidebar({ items, open, roleLabel }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  function renderIcon(iconName) {
    if (!iconName) return null;
    const IconComponent = LucideIcons[iconName];
    if (!IconComponent) return <span>{iconName}</span>;
    return <IconComponent size={20} />;
  }

  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <div className="brand-mark">
        <span className="dot" />
        Swasth Setu
      </div>
      <nav>
        {items.map((item) =>
          item.action === "logout" ? (
            <button
              key="logout"
              type="button"
              className="nav-item nav-item-logout"
              onClick={handleLogout}
            >
              <span className="nav-icon">{renderIcon(item.icon)}</span>
              <span>{item.label}</span>
            </button>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span className="nav-icon">{renderIcon(item.icon)}</span>
              <span>{item.label}</span>
            </NavLink>
          )
        )}
      </nav>
      <div className="sidebar-foot">{roleLabel}</div>
    </aside>
  );
}