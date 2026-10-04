// FILE: src/pages/auth/Signup.jsx
//
// Admin is deliberately excluded â€” admin IDs must not be publicly
// generated through signup.
//
// Doctor also picks a Specialization now, shown to patients on the
// Find Doctor page.

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerWithEmail } from "../../firebase/auth";
import { createUserProfile, validateSignupCredential, DOCTOR_SPECIALIZATIONS } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import JourneyPath from "../../components/common/JourneyPath";
import * as LucideIcons from "lucide-react";

const ROLES = [
  { id: "patient", icon: "User", name: "Patient", desc: "Manage my health" },
  { id: "healthworker", icon: "HeartPulse", name: "ASHA / Health Worker", desc: "Register & follow up patients" },
  { id: "doctor", icon: "Stethoscope", name: "Doctor", desc: "Consult & create referrals" },
  { id: "pharmacy", icon: "Store", name: "Pharmacy", desc: "Manage medicine stock & requests" },
];

const ROLE_HOME = {
  patient: "/patient/dashboard",
  healthworker: "/healthworker/dashboard",
  doctor: "/doctor/dashboard",
  pharmacy: "/pharmacy/dashboard",
};

const REG_NO_CONFIG = {
  doctor: { label: "Medical Registration Number", placeholder: "e.g. REG-2026-1001" },
  healthworker: { label: "ASHA / Health Worker ID", placeholder: "e.g. HW-2026-2001" },
  pharmacy: { label: "Drug License Number", placeholder: "e.g. PHR-2026-3001" },
};

export default function Signup() {
  const [role, setRole] = useState("patient");
  const [regNo, setRegNo] = useState("");
  const [specialization, setSpecialization] = useState(DOCTOR_SPECIALIZATIONS[0]);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { setFirebaseUser, setProfile } = useAuth();

  useEffect(() => {
    setRegNo("");
    setError("");
  }, [role]);

  const needsRegNo = role === "doctor" || role === "healthworker" || role === "pharmacy";
  const regNoConfig = REG_NO_CONFIG[role];

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const credentialError = validateSignupCredential(role, regNo);
    if (credentialError) {
      setError(credentialError);
      return;
    }

    setSubmitting(true);
    try {
      const cred = await registerWithEmail(email, password);
      const profile = await createUserProfile({
        uid: cred.user.uid, name, email, mobile, role, regNo,
        specialization: role === "doctor" ? specialization : undefined,
      });
      setFirebaseUser(cred.user);
      setProfile(profile);
      navigate(ROLE_HOME[role], { replace: true });
    } catch (err) {
      setError(err.code === "auth/email-already-in-use" ? "That email is already registered." : (err.message || "Signup failed. Please check your details."));
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
          <h1 className="story-headline">One account. One role. The right dashboard.</h1>
          <p className="story-sub">
            Pick how you'll use Swasth Setu - your role decides what you can
            see and do, nothing more, nothing less.
          </p>
          <JourneyPath />
        </div>
        <p className="story-footnote">Admin access is issued directly by the district team, not through signup.</p>
      </aside>

      <div className="auth-form-side">
        <form className="auth-card auth-card-wide" onSubmit={handleSubmit}>
          <h2>Create your account</h2>
          <p className="lede">Tell us who you are and how you'll use Swasth Setu.</p>

          {error && <div className="form-error">{error}</div>}

          <div className="role-grid">
            {ROLES.map((r) => {
              const IconComponent = LucideIcons[r.icon];
              return (
                <button
                  type="button"
                  key={r.id}
                  className={`role-card${role === r.id ? " selected" : ""}`}
                  onClick={() => setRole(r.id)}
                >
                  <div className="role-icon">
                    {IconComponent && <IconComponent size={24} color="var(--teal-600)" />}
                  </div>
                  <div className="role-name">{r.name}</div>
                  <div className="role-desc">{r.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="field">
            <label htmlFor="name">{role === "pharmacy" ? "Pharmacy Name" : "Full name"}</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="field">
            <label htmlFor="mobile">Mobile number</label>
            <input id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>

          {role === "doctor" && (
            <div className="field">
              <label htmlFor="specialization">Specialization</label>
              <select id="specialization" value={specialization} onChange={(e) => setSpecialization(e.target.value)}>
                {DOCTOR_SPECIALIZATIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

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
              <div className="field-hint">Checked against the district's verified registry before your account is created.</div>
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Creating accountâ€¦" : `Create ${ROLES.find(r => r.id === role).name} account`}
          </button>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login">
              <button type="button">Sign in</button>
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
