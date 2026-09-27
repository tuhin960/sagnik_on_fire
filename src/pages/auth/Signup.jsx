// FILE: src/pages/auth/Signup.jsx
//
// Phase 1 requirement: Signup + Role selection. Admin is deliberately
// excluded — Section 8 states admin IDs must not be publicly generated
// through signup.
//
// Doctor / Health Worker / Pharmacy-type Facility now type their real
// registration number, checked against a demo whitelist (see
// firebase/firestore.js) before the Firebase Auth account is even
// created — so an invalid reg no never leaves an orphaned Auth user
// behind.

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerWithEmail } from "../../firebase/auth";
import { createUserProfile, validateSignupCredential } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import JourneyPath from "../../components/common/JourneyPath";

const ROLES = [
  { id: "patient", icon: "🧑", name: "Patient", desc: "Track my own care journey" },
  { id: "healthworker", icon: "🩺", name: "ASHA / Health Worker", desc: "Register & follow up patients" },
  { id: "doctor", icon: "⚕️", name: "Doctor", desc: "Consult & create referrals" },
  { id: "facility", icon: "🏥", name: "Facility", desc: "Manage beds & incoming referrals" },
];

const ROLE_HOME = {
  patient: "/patient/dashboard",
  healthworker: "/healthworker/dashboard",
  doctor: "/doctor/dashboard",
  facility: "/facility/dashboard",
};

const REG_NO_CONFIG = {
  doctor: { label: "Medical Registration Number", placeholder: "REG-2026-XXXX" },
  healthworker: { label: "ASHA / Health Worker ID", placeholder: "HW-2026-XXXX" },
};

export default function Signup() {
  const [role, setRole] = useState("patient");
  const [facilityType, setFacilityType] = useState("hospital");
  const [regNo, setRegNo] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { setFirebaseUser, setProfile } = useAuth();

  // Reset role-specific fields whenever the role card changes, so a
  // stale reg no from a previous role can never sneak into a new one.
  useEffect(() => {
    setRegNo("");
    setFacilityType("hospital");
    setError("");
  }, [role]);

  const needsRegNo = role === "doctor" || role === "healthworker" || (role === "facility" && facilityType === "pharmacy");
  const regNoConfig = REG_NO_CONFIG[role] || { label: "Drug License Number", placeholder: "PHR-2026-XXXX" };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const credentialError = validateSignupCredential(role, regNo, facilityType);
    if (credentialError) {
      setError(credentialError);
      return;
    }

    setSubmitting(true);
    try {
      const cred = await registerWithEmail(email, password);
      const profile = await createUserProfile({ uid: cred.user.uid, name, email, mobile, role, regNo, facilityType });
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
            Pick how you'll use Swasth Setu — your role decides what you can
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

          {role === "facility" && (
            <div className="field">
              <label>Facility type</label>
              <div className="subtype-toggle">
                <button
                  type="button"
                  className={`subtype-btn${facilityType === "hospital" ? " selected" : ""}`}
                  onClick={() => setFacilityType("hospital")}
                >
                  🏥 Hospital / PHC
                </button>
                <button
                  type="button"
                  className={`subtype-btn${facilityType === "pharmacy" ? " selected" : ""}`}
                  onClick={() => setFacilityType("pharmacy")}
                >
                  💊 Pharmacy
                </button>
              </div>
            </div>
          )}

          <div className="field">
            <label htmlFor="name">Full name</label>
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
            {submitting ? "Creating account…" : `Create ${ROLES.find(r => r.id === role).name} account`}
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