import { useState, useEffect } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import { searchMedicineAvailability, listenToPatientPharmacyRequests, listenToPatientPrescriptions, getPharmacies, sendPrescriptionToPharmacy } from "../../firebase/firestore";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";
import { useAuth } from "../../services/AuthContext";

function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function PatientMedicines() {
  const { firebaseUser, profile } = useAuth();
  const [term, setTerm] = useState("");
  
  const [requests, setRequests] = useState(null);

  const [importing, setImporting] = useState(false);
  const [prescriptions, setPrescriptions] = useState(null);
  const [rxToPharm, setRxToPharm] = useState(null);
  const [pharmacies, setPharmacies] = useState(null);
  const [loadingPharma, setLoadingPharma] = useState(false);
  const [sendingPharma, setSendingPharma] = useState(false);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub1 = listenToPatientPharmacyRequests(
      firebaseUser.uid,
      (list) => setRequests(list),
      (err) => console.error(err)
    );
    const unsub2 = listenToPatientPrescriptions(
      firebaseUser.uid,
      (list) => setPrescriptions(list),
      (err) => console.error(err)
    );
    return () => { unsub1(); unsub2(); };
  }, [firebaseUser]);

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Compress and convert to base64
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > 800) { height *= 800 / width; width = 800; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
        
        const fakeRx = {
          doctorName: "Uploaded Paper Prescription",
          createdAt: new Date(),
          medicines: [], // No structured medicines
          imageUrl: dataUrl
        };
        handleSelectRx(fakeRx);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function handleSelectRx(rx) {
    setRxToPharm(rx);
    setLoadingPharma(true);
    try {
      const ph = await getPharmacies();
      setPharmacies(ph);
    } catch (e) {
      alert("Failed to load pharmacies.");
    }
    setLoadingPharma(false);
  }

  async function handleSendToPharmacy(pharmacy) {
    if (!rxToPharm || !firebaseUser?.uid || !profile?.name) return;
    setSendingPharma(true);
    try {
      await sendPrescriptionToPharmacy(firebaseUser.uid, profile.name, rxToPharm, pharmacy.uid, pharmacy.name);
      alert(`Sent prescription to ${pharmacy.name}. They will check their stock and update you!`);
      setRxToPharm(null);
      setImporting(false);
    } catch (e) {
      alert("Error sending request: " + e.message);
    }
    setSendingPharma(false);
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!term.trim()) return;
    
    // Instead of querying a global stock DB, we create a single-medicine "prescription" 
    // and send it to the pharmacy for real-time review.
    const fakeRx = {
      doctorName: "Self Request",
      createdAt: new Date(),
      medicines: [{ name: term, dosage: "-", frequency: "-", duration: "-" }]
    };
    
    setImporting(true);
    handleSelectRx(fakeRx);
    setTerm("");
  }

  const pending = requests?.filter(r => r.status === "pending") || [];
  const responded = requests?.filter(r => r.status === "responded") || [];

  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>Pharmacy / Medicines</h1>
        <p className="sub">Track your prescription requests and check nearby stock.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
        <div className="panel" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--teal-600)" }}>{pending.length}</div>
          <p className="panel-note">Pending at Pharmacy</p>
        </div>
        <div className="panel" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--slate-600)" }}>{responded.length}</div>
          <p className="panel-note">Responses Received</p>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <button className="btn-primary" style={{ width: 320, maxWidth: "100%", padding: "14px", fontSize: 16 }} onClick={() => { setImporting(true); setRxToPharm(null); }}>
          + Import Prescription to Check Pharmacy Availability
        </button>
      </div>

      {responded.length > 0 && <h2 style={{ marginBottom: 12, fontSize: 18 }}>Pharmacy Responses</h2>}
      {responded.map(req => (
        <div key={req.id} className="panel" style={{ marginBottom: 16, borderLeft: "4px solid var(--teal-600)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
            <div>
              <h3 style={{ marginBottom: 4 }}>{req.pharmacyName}</h3>
              <p className="panel-note">Responded: {formatDate(req.updatedAt)}</p>
              {req.prescriptionData?.imageUrl && (
                <span className="badge badge-normal" style={{ marginTop: 8 }}>Paper Prescription</span>
              )}
            </div>
            {req.estimatedTotal > 0 && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "var(--slate-600)" }}>Estimated Total</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--teal-700)" }}>₹{req.estimatedTotal}</div>
              </div>
            )}
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {req.prescriptionData?.imageUrl && (
              <div style={{ padding: "8px 12px", backgroundColor: "#f8fafc", borderRadius: 6, border: "1px solid var(--line)" }}>
                <a href={req.prescriptionData.imageUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--teal-600)", fontWeight: 600, textDecoration: "none" }}>
                  View Uploaded Image ↗
                </a>
              </div>
            )}
            {(req.prescriptionData?.medicines || []).map((m, i) => {
              const statusObj = req.medicinesStatus?.[m.name];
              const isAvail = (statusObj?.status || statusObj) === "available";
              const price = typeof statusObj === "object" ? statusObj.price : null;
              
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: isAvail ? "#f0fdf4" : "#f8fafc", borderRadius: 6, border: isAvail ? "1px solid #bbf7d0" : "1px solid var(--slate-200)" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: isAvail ? "var(--teal-800)" : "var(--slate-500)", textDecoration: isAvail ? "none" : "line-through" }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: "var(--slate-500)" }}>{m.dosage} - {m.frequency}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {isAvail ? (
                      <>
                        <StatusBadge type="fresh" label="Available" />
                        {price > 0 && <div style={{ fontSize: 13, fontWeight: 600, color: "var(--teal-700)", marginTop: 4 }}>₹{price}</div>}
                      </>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--slate-400)", fontWeight: 500 }}>Out of Stock</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {pending.length > 0 && <h2 style={{ marginBottom: 12, marginTop: 24, fontSize: 18 }}>Awaiting Response</h2>}
      {pending.map(req => (
        <div key={req.id} className="panel" style={{ marginBottom: 16, opacity: 0.7 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ marginBottom: 4 }}>{req.pharmacyName}</h3>
              <p className="panel-note">Sent: {formatDate(req.createdAt)}</p>
              {req.prescriptionData?.imageUrl && (
                <span className="badge badge-normal" style={{ marginTop: 8 }}>Paper Prescription</span>
              )}
            </div>
            <StatusBadge type="normal" label="Pending" />
          </div>
        </div>
      ))}

      <div className="panel" style={{ marginTop: 32 }}>
        <h2 style={{ marginBottom: 16, fontSize: 18 }}>Request Specific Medicine</h2>
        <form onSubmit={handleSearch} className="medicine-search-row">
          <input
            className="medicine-search-input"
            placeholder="e.g. Paracetamol 500mg"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <button className="btn-primary medicine-search-btn" type="submit">
            Send Request to Pharmacy
          </button>
        </form>
      </div>

      {importing && (
        <div className="modal-overlay" onClick={() => !sendingPharma && setImporting(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 20 }}>Select a Prescription</h2>
              <button className="btn-logout" style={{ width: "auto", padding: "8px 16px" }} onClick={() => !sendingPharma && setImporting(false)}>X</button>
            </div>
            
            {!rxToPharm ? (
              <>
                <p className="panel-note" style={{ marginBottom: 16 }}>
                  Choose a prescription from your records to send to a pharmacy.
                </p>
                <div style={{ marginBottom: 16 }}>
                  <label className="btn-primary" style={{ display: "inline-block", cursor: "pointer", width: "100%", textAlign: "center", padding: "10px", boxSizing: "border-box" }}>
                    + Upload Paper Prescription (Photo)
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: "none" }} 
                      onChange={handleFileUpload} 
                    />
                  </label>
                </div>
                <div style={{ maxHeight: "40vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                  {!prescriptions && <p>Loading prescriptions...</p>}
                  {prescriptions?.length === 0 && <p>You don't have any digital prescriptions yet.</p>}
                  {prescriptions?.map((rx) => (
                    <div key={rx.id} className="panel" style={{ cursor: "pointer", border: "1px solid var(--line)" }} onClick={() => handleSelectRx(rx)}>
                      <h4 style={{ marginBottom: 4 }}>Dr. {rx.doctorName}</h4>
                      <p className="panel-note">{formatDate(rx.createdAt)}</p>
                      <p className="panel-note" style={{ marginTop: 4 }}><strong>{rx.medicines?.length || 0}</strong> medicines</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="panel-note" style={{ marginBottom: 16 }}>
                  Select a pharmacy to send this prescription to.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "50vh", overflowY: "auto" }}>
                  {loadingPharma && <p>Loading pharmacies...</p>}
                  {!loadingPharma && pharmacies?.length === 0 && <p>No pharmacies registered in the system yet.</p>}
                  {pharmacies?.map(ph => (
                    <div key={ph.uid} className="medicine-result-row" style={{ cursor: "pointer" }} onClick={() => handleSendToPharmacy(ph)}>
                      <div>
                        <div className="medicine-result-name">{ph.name}</div>
                      </div>
                      <button className="btn-primary" style={{ padding: "4px 12px", width: "auto", fontSize: 13 }} disabled={sendingPharma}>
                        {sendingPharma ? "Sending..." : "Send Request"}
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16 }}>
                  <button className="btn-logout" onClick={() => setRxToPharm(null)} disabled={sendingPharma}>
                    Back to Prescriptions
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
