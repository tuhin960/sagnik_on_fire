// FILE: src/pages/auth/Login.jsx
//
// Role picker mirrors Signup. Doctor / Health Worker / Pharmacy must
// also enter their Registration/License Number, verified against the
// stored specialId after sign-in. If profile.role doesn't match what
// was picked, we sign the session back out rather than land someone
// on a dashboard for a role they didn't pick.

import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginWithEmail, logout } from "../../firebase/auth";
import { getUserProfile, getUserProfileByEmail } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import JourneyPath from "../../components/common/JourneyPath";

const ROLES = [
  { id: "patient", icon: "🧑", name: "Patient", desc: "Track your care journey" },
  { id: "healthworker", icon: "🩺", name: "ASHA / Health Worker", desc: "Register & follow up patients" },
  { id: "doctor", icon: "⚕️", name: "Doctor", desc: "Consult & create referrals" },
  { id: "pharmacy", icon: "💊", name: "Pharmacy", desc: "Manage medicine stock & requests" },
  { id: "admin", icon: "🛡️", name: "Admin", desc: "District network oversight" },
];

const ROLE_HOME = {
  patient: "/patient/dashboard",
  healthworker: "/healthworker/dashboard",
  doctor: "/doctor/dashboard",
  pharmacy: "/pharmacy/dashboard",
  admin: "/admin/command-center",
};

const REG_NO_CONFIG = {
  doctor: { label: "Registration number", placeholder: "REG-2026-XXXX" },
  healthworker: { label: "Registration number", placeholder: "HW-2026-XXXX" },
  pharmacy: { label: "Drug license number", placeholder: "PHR-2026-XXXX" },
};

export default function Login() {
  const [role, setRole] = useState("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regNo, setRegNo] = useState("");
  const [patientIdHint, setPatientIdHint] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { setFirebaseUser, setProfile } = useAuth();
  const lookupTimer = useRef(null);

  useEffect(() => {
    setRegNo("");
    setPatientIdHint(null);
    setError("");
  }, [role]);

  // Debounced Patient ID auto-fetch — only relevant for the patient role.
  useEffect(() => {
    if (role !== "patient" || !email.includes("@")) {
      setPatientIdHint(null);
      return;
    }
    setLookingUp(true);
    clearTimeout(lookupTimer.current);
    lookupTimer.current = setTimeout(async () => {
      const found = await getUserProfileByEmail(email, "patient");
      setPatientIdHint(found?.specialId || null);
      setLookingUp(false);
    }, 500);
    return () => clearTimeout(lookupTimer.current);
  }, [email, role]);

  const needsRegNo = role === "doctor" || role === "healthworker" || role === "pharmacy";
  const regNoConfig = REG_NO_CONFIG[role];

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const cred = await loginWithEmail(email, password);
      const profile = await getUserProfile(cred.user.uid);

      if (!profile) {
        await logout();
        setError("No profile found for this account. Contact your administrator.");
        setSubmitting(false);
        return;
      }

      if (profile.role !== role) {
        await logout();
        const actual = ROLES.find((r) => r.id === profile.role)?.name || profile.role;
        setError(`This account is registered as ${actual}. Please pick the matching role above.`);
        setSubmitting(false);
        return;
      }

      if (needsRegNo) {
        const matches = regNo.trim().toUpperCase() === (profile.specialId || "").toUpperCase();
        if (!matches) {
          await logout();
          setError("Registration/license number doesn't match our records for this account.");
          setSubmitting(false);
          return;
        }
      }

      setFirebaseUser(cred.user);
      setProfile(profile);
      navigate(ROLE_HOME[profile.role] || "/login", { replace: true });
    } catch (err) {
      setError("Email or password didn't match. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <aside className="auth-story">
        <div className="brand-mark">
          <span className="dot" />
          Swasth Setu
        </div>

        <div>
          <h1 className="story-headline">The patient moves. The information doesn't get lost.</h1>
          <p className="story-sub">
            One network connecting Sub-Centres, ASHA workers, doctors and
            pharmacies — so a referral travels with the patient's full
            record, not just their name.
          </p>
          <JourneyPath />
        </div>

        <p className="story-footnote">Built for SIH 2026 — Rural Care Continuity &amp; Emergency Referral Network</p>
      </aside>

      <div className="auth-form-side">
        <form className="auth-card auth-card-wide" onSubmit={handleSubmit}>
          <h2>Welcome back</h2>
          <p className="lede">Choose your role, then sign in to continue.</p>

          {error && <div className="form-error">{error}</div>}

          <div className="role-grid role-grid-5">
            {ROLES.map((r) => (
              <button
                type="button"
                key={r.id}
                className={`role-card${role === r.id ? " selected" : ""}`}
                onClick={() => setRole(r.id)}
              >
                <div className="role-icon">{r.icon}</div>
                <div className="role-name">{r.name}</div>
                <div className="role-desc">{r.desc}</div>
              </button>
            ))}
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {role === "patient" && email.includes("@") && (
              <div className={`field-hint${patientIdHint ? " field-hint-found" : ""}`}>
                {lookingUp && "Looking up your Patient ID…"}
                {!lookingUp && patientIdHint && `Patient ID: ${patientIdHint}`}
                {!lookingUp && !patientIdHint && "No Patient ID found for this email yet."}
              </div>
            )}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {needsRegNo && (
            <div className="field">
              <label htmlFor="regNo">{regNoConfig.label}</label>
              <input
                id="regNo"
                placeholder={regNoConfig.placeholder}
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                required
              />
              <div className="field-hint">Issued to you at signup — check your profile if you've misplaced it.</div>
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : `Sign in as ${ROLES.find((r) => r.id === role).name}`}
          </button>

          <p className="auth-switch">
            New here?{" "}
            <Link to="/signup">
              <button type="button">Create an account</button>
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}