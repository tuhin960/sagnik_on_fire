// FILE: src/components/common/Navbar.jsx

import { useNavigate } from "react-router-dom";
import { logout } from "../../firebase/auth";

export default function Navbar({ name, specialId, onMenuClick }) {
  const navigate = useNavigate();
  const initials = (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="topbar">
      <button className="menu-btn" onClick={onMenuClick} aria-label="Open menu">☰</button>
      <div className="who">
        <div className="avatar">{initials}</div>
        <div>
          <div className="who-name">{name}</div>
          <div className="who-id">{specialId}</div>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}