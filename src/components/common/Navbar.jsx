import { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import { updateUserProfile } from "../../firebase/firestore";
import LanguageSwitcher from "./LanguageSwitcher";
import "./Navbar.css"; // We'll create this for the modal

export default function Navbar({ name, specialId, onMenuClick }) {
  const { profile, firebaseUser, setProfile } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({});
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        age: profile.age || "",
        specialization: profile.specialization || "",
      });
      
      const mob = profile.mobile || "";
      if (mob.startsWith("+")) {
        const spaceIdx = mob.indexOf(" ");
        if (spaceIdx !== -1) {
          setCountryCode(mob.substring(0, spaceIdx));
          setPhoneRaw(mob.substring(spaceIdx + 1));
        } else if (mob.length > 10) {
          setCountryCode(mob.substring(0, mob.length - 10));
          setPhoneRaw(mob.substring(mob.length - 10));
        } else {
          setPhoneRaw(mob);
        }
      } else {
        setPhoneRaw(mob);
      }
    }
  }, [profile, isModalOpen]);

  const initials = (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleOpen = () => {
    setIsModalOpen(true);
    setIsEditing(false);
    setMsg({ type: "", text: "" });
  };
  const handleClose = () => setIsModalOpen(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      const fullMobile = `${countryCode} ${phoneRaw}`;
      const payload = {
        name: formData.name,
        mobile: fullMobile,
      };
      if (profile.role === "patient") {
        payload.age = formData.age;
      } else if (profile.role === "doctor") {
        payload.specialization = formData.specialization;
      }
      
      const updated = await updateUserProfile(firebaseUser.uid, payload);
      setProfile(updated);
      setMsg({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return "N/A";
    const date = ts.toMillis ? new Date(ts.toMillis()) : new Date(ts);
    return date.toLocaleDateString();
  };

  return (
    <>
      <header className="topbar">
        <button className="menu-btn" onClick={onMenuClick} aria-label="Open menu">&#9776;</button>
        
        <div style={{ display: "flex", alignItems: "center", marginLeft: "auto" }}>
          <LanguageSwitcher />
          <div className="who" onClick={handleOpen} style={{ cursor: "pointer" }}>
            <div className="avatar">{initials}</div>
            <div>
              <div className="who-name">{name}</div>
              <div className="who-id">{specialId}</div>
            </div>
          </div>
        </div>
      </header>

      {isModalOpen && profile && (
        <div className="modal-backdrop" onClick={handleClose}>
          <div className="modal-content profile-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={handleClose}>&times;</button>
            <div className="profile-header">
              <div className="profile-avatar-large">{initials}</div>
              <h2>{profile.name}</h2>
              <p className="profile-role-badge">{profile.role.toUpperCase()}</p>
            </div>

            {msg.text && (
              <div className={`alert alert-${msg.type}`} style={{ margin: "10px 0" }}>
                {msg.text}
              </div>
            )}

            {!isEditing ? (
              <div className="profile-details-grid">
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{profile.email}</span>
                </div>
                
                {profile.role === "patient" && (
                  <>
                    <div className="detail-item">
                      <span className="detail-label">Patient ID</span>
                      <span className="detail-value">{profile.specialId}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Age</span>
                      <span className="detail-value">{profile.age || "Not specified"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Join Date</span>
                      <span className="detail-value">{formatDate(profile.createdAt)}</span>
                    </div>
                  </>
                )}

                {profile.role === "doctor" && (
                  <>
                    <div className="detail-item">
                      <span className="detail-label">Reg. No</span>
                      <span className="detail-value">{profile.specialId}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Specialization</span>
                      <span className="detail-value">{profile.specialization}</span>
                    </div>
                  </>
                )}

                {profile.role === "healthworker" && (
                  <div className="detail-item">
                    <span className="detail-label">HW Reg. No</span>
                    <span className="detail-value">{profile.specialId}</span>
                  </div>
                )}

                {profile.role === "pharmacy" && (
                  <div className="detail-item">
                    <span className="detail-label">Drug License No</span>
                    <span className="detail-value">{profile.specialId}</span>
                  </div>
                )}

                <div className="detail-item">
                  <span className="detail-label">Mobile</span>
                  <span className="detail-value">{profile.mobile}</span>
                </div>

                <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
              </div>
            ) : (
              <form onSubmit={handleSave} className="profile-edit-form">
                <div className="field">
                  <label>{profile.role === "pharmacy" ? "Pharmacy Name" : "Naam (Name)"}</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>

                {profile.role === "patient" && (
                  <div className="field">
                    <label>Age</label>
                    <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                  </div>
                )}

                {profile.role === "doctor" && (
                  <div className="field">
                    <label>Specialization</label>
                    <input type="text" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} required />
                  </div>
                )}

                <div className="field">
                  <label>Mobile Number</label>
                  <div className="phone-input-group">
                    <select className="country-code-select" value={countryCode} onChange={e => setCountryCode(e.target.value)}>
                      <option value="+91">+91 (IN)</option>
                      <option value="+1">+1 (US)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+61">+61 (AU)</option>
                      <option value="+971">+971 (AE)</option>
                    </select>
                    <input 
                      type="text" 
                      className="phone-number-input"
                      value={phoneRaw} 
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 10) setPhoneRaw(val);
                      }} 
                      placeholder="9999999999"
                      required 
                    />
                  </div>
                </div>

                <div className="edit-actions">
                  <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}