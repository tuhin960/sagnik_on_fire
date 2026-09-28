// FILE: src/components/common/DashboardLayout.jsx
//
// Shared shell for every role dashboard: Sidebar + Navbar + content slot.
// Each role page passes its own nav `items`; everything else (responsive
// drawer behaviour, avatar, logout) is written once.
//
// ChatbotWidget only mounts for the patient role — it's a general
// health-info assistant, not something a doctor/pharmacy/admin needs.

import { useState } from "react";
import { useAuth } from "../../services/AuthContext";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import ChatbotWidget from "./ChatbotWidget";

export default function DashboardLayout({ items, roleLabel, children }) {
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();

  return (
    <div className="app-shell">
      <Sidebar items={items} open={open} roleLabel={roleLabel} />
      <div>
        <Navbar
          name={profile?.name}
          specialId={profile?.specialId}
          onMenuClick={() => setOpen((v) => !v)}
        />
        <main className="main-content">{children}</main>
      </div>
      {profile?.role === "patient" && <ChatbotWidget />}
    </div>
  );
}