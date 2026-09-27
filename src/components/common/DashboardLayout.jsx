// FILE: src/components/common/DashboardLayout.jsx
//
// Shared shell for every role dashboard: Sidebar + Navbar + content slot.
// Each role page passes its own nav `items`; everything else (responsive
// drawer behaviour, avatar, logout) is written once (RULE 7).

import { useState } from "react";
import { useAuth } from "../../services/AuthContext";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout({ items, roleLabel, children }) {
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();

  return (
    <div className="app-shell">
      <Sidebar items={items} open={open} roleLabel={roleLabel} />
      {open && (
        <div
          className="sidebar-scrim"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <div>
        <Navbar
          name={profile?.name}
          specialId={profile?.specialId}
          onMenuClick={() => setOpen((v) => !v)}
        />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}