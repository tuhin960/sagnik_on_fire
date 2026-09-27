// FILE: src/routes/ProtectedRoute.jsx
//
// Implements the chain from Section 8:
//   Firebase user -> Firestore profile -> role -> authorized dashboard
//
// Usage:
//   <ProtectedRoute allowedRoles={["doctor"]}><DoctorDashboard /></ProtectedRoute>

import { Navigate } from "react-router-dom";
import { useAuth } from "../services/AuthContext";

const ROLE_HOME = {
  patient: "/patient/dashboard",
  healthworker: "/healthworker/dashboard",
  doctor: "/doctor/dashboard",
  facility: "/facility/dashboard",
  admin: "/admin/command-center",
};

export default function ProtectedRoute({ allowedRoles, children }) {
  const { firebaseUser, profile, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 40 }}>Checking your session…</div>;
  }

  if (!firebaseUser || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(profile.role)) {
    // Logged in, but wrong dashboard for this role — send them home instead
    // of showing someone else's data.
    return <Navigate to={ROLE_HOME[profile.role] || "/login"} replace />;
  }

  return children;
}
