import { useEffect, useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import { listenToPharmacyRequests, updatePharmacyRequest } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function PharmacyPrescriptionRequests() {
  const { profile, firebaseUser } = useAuth();
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState(null);

  const [reviewing, setReviewing] = useState(null);
  const [availability, setAvailability] = useState({}); // { medName: true/false }
  const [prices, setPrices] = useState({}); // { medName: number/string }
  const [manualTotal, setManualTotal] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = listenToPharmacyRequests(
      firebaseUser.uid,
      (list) => { setError(null); setRequests(list); },
      (err) => setError(err.message || "Failed to load requests")
    );
    return unsub;
  }, [firebaseUser]);

  function openReview(req) {
    const initialAvail = {};
    const initialPrices = {};
    (req.prescriptionData?.medicines || []).forEach(m => {
      const statusObj = req.medicinesStatus?.[m.name];
      initialAvail[m.name] = typeof statusObj === 'object' ? statusObj.status === "available" : statusObj === "available";
      initialPrices[m.name] = typeof statusObj === 'object' ? (statusObj.price || "") : "";
    });
    setAvailability(initialAvail);
    setPrices(initialPrices);
    setManualTotal(req.estimatedTotal || "");
    setReviewing(req);
  }

  function toggleAvailable(medName) {
    setAvailability(prev => ({ ...prev, [medName]: !prev[medName] }));
  }

  function handlePriceChange(medName, val) {
    setPrices(prev => ({ ...prev, [medName]: val }));
  }

  async function handleSendResponse() {
    if (!reviewing) return;
    setSending(true);
    try {
      const statuses = {};
      let estimatedTotal = 0;
      
      if (reviewing.prescriptionData?.imageUrl) {
        estimatedTotal = parseFloat(manualTotal) || 0;
      } else {
        Object.keys(availability).forEach(name => {
          const isAvail = availability[name];
          const pr = parseFloat(prices[name]) || 0;
          if (isAvail) estimatedTotal += pr;
          
          statuses[name] = {
            status: isAvail ? "available" : "unavailable",
            price: isAvail ? pr : 0
          };
        });
      }

      await updatePharmacyRequest(reviewing.id, {
        status: "responded",
        medicinesStatus: statuses,
        estimatedTotal: estimatedTotal
      });
      setReviewing(null);
    } catch (e) {
      alert("Error sending response: " + e.message);
    }
    setSending(false);
  }

  const pending = requests?.filter(r => r.status === "pending") || [];
  const responded = requests?.filter(r => r.status === "responded") || [];

  return (
    <DashboardLayout items={NAV.pharmacy} roleLabel={ROLE_LABEL.pharmacy}>
      <div className="page-head">
        <h1>Prescription Requests</h1>
        <p className="sub">Check availability for patients who sent you their prescriptions.</p>
      </div>

      {error && <p className="panel-note">{error}</p>}
      {requests === null && !error && <p className="panel-note">Loading...</p>}

      {!requests && <div style={{ marginBottom: 20 }}></div>}

      {requests && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          <div className="panel" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--teal-600)" }}>{pending.length}</div>
            <p className="panel-note">Pending Requests</p>
          </div>
          <div className="panel" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--slate-600)" }}>{responded.length}</div>
            <p className="panel-note">Responded</p>
          </div>
        </div>
      )}

      {requests?.length === 0 && (
        <div className="empty-state">
          <div className="big">No Requests</div>
          <p>When patients send you a prescription to check stock, it will appear here.</p>
        </div>
      )}

      {pending.length > 0 && <h3>New Requests</h3>}
      {pending.map(req => (
        <div key={req.id} className="panel" style={{ borderLeft: "4px solid var(--teal-600)", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 style={{ marginBottom: 4 }}>{req.patientName}</h3>
              <p className="panel-note">Received: {formatDate(req.createdAt)}</p>
              {req.prescriptionData?.imageUrl ? (
                <p className="panel-note">
                  <strong>Paper Prescription (Photo)</strong> attached
                </p>
              ) : (
                <p className="panel-note">
                  <strong>{req.prescriptionData?.medicines?.length || 0}</strong> medicines requested
                </p>
              )}
            </div>
            <button className="btn-primary" style={{ width: "auto", padding: "8px 16px" }} onClick={() => openReview(req)}>
              Review & Respond
            </button>
          </div>
        </div>
      ))}

      {responded.length > 0 && <h3 style={{ marginTop: 32 }}>Past Responses</h3>}
      {responded.map(req => (
        <div key={req.id} className="panel" style={{ opacity: 0.8, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 style={{ marginBottom: 4 }}>{req.patientName} <StatusBadge type="fresh" label="Responded" /></h3>
              <p className="panel-note">Responded at: {formatDate(req.updatedAt)}</p>
            </div>
            <button className="btn-logout" style={{ width: "auto", padding: "6px 12px" }} onClick={() => openReview(req)}>
              View Sent Response
            </button>
          </div>
        </div>
      ))}

      {reviewing && (
        <div className="modal-overlay" onClick={() => !sending && setReviewing(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 20 }}>Prescription from {reviewing.patientName}</h2>
              <button className="btn-logout" style={{ width: "auto", padding: "4px 8px" }} onClick={() => !sending && setReviewing(null)}>X</button>
            </div>
            
            <p className="panel-note" style={{ marginBottom: 16 }}>
              {reviewing.prescriptionData?.imageUrl 
                ? "Review the uploaded prescription and enter the total estimated price if you can fulfill it."
                : "Tick the medicines you have in stock and enter the estimated price for the prescribed duration."}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16, maxHeight: "40vh", overflowY: "auto" }}>
              {reviewing.prescriptionData?.imageUrl ? (
                <div style={{ marginBottom: 16 }}>
                  <img src={reviewing.prescriptionData.imageUrl} alt="Prescription" style={{ width: "100%", borderRadius: 8, border: "1px solid var(--line)" }} />
                </div>
              ) : (
                (reviewing.prescriptionData?.medicines || []).map((m, i) => {
                  const isAvail = availability[m.name];
                  return (
                    <div key={i} className="medicine-result-row" style={{ border: isAvail ? "1px solid var(--teal-600)" : undefined, backgroundColor: isAvail ? "#f0fdf4" : undefined }}>
                      <div style={{ flex: 1 }}>
                        <div className="medicine-result-name" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input 
                            type="checkbox" 
                            checked={isAvail} 
                            onChange={() => toggleAvailable(m.name)} 
                            style={{ width: 18, height: 18, cursor: "pointer" }}
                          />
                          {m.name}
                        </div>
                        <div className="panel-note" style={{ marginLeft: 28 }}>{m.dosage} - {m.frequency} - {m.duration}</div>
                      </div>
                      {isAvail && (
                        <div style={{ width: 100 }}>
                          <label style={{ fontSize: 11, color: 'var(--slate-600)' }}>Price (₹)</label>
                          <input 
                            type="number"
                            placeholder="e.g. 50"
                            value={prices[m.name] || ""}
                            onChange={(e) => handlePriceChange(m.name, e.target.value)}
                            style={{ width: "100%", padding: "4px 8px", fontSize: 14, borderRadius: 4, border: "1px solid var(--slate-300)" }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            <div style={{ padding: "12px 16px", backgroundColor: "var(--slate-50)", borderRadius: 8, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>Estimated Total:</strong>
              {reviewing.prescriptionData?.imageUrl ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18, color: "var(--teal-700)", fontWeight: 700 }}>₹</span>
                  <input 
                    type="number"
                    placeholder="0"
                    value={manualTotal}
                    onChange={(e) => setManualTotal(e.target.value)}
                    style={{ width: 100, padding: "6px 10px", fontSize: 16, borderRadius: 4, border: "1px solid var(--slate-300)", fontWeight: 700, color: "var(--teal-700)" }}
                  />
                </div>
              ) : (
                <strong style={{ fontSize: 18, color: "var(--teal-700)" }}>
                  ₹{Object.keys(availability).reduce((sum, name) => sum + (availability[name] ? (parseFloat(prices[name]) || 0) : 0), 0)}
                </strong>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button className="btn-logout" style={{ width: "auto", padding: "10px 20px" }} onClick={() => setReviewing(null)} disabled={sending}>
                Cancel
              </button>
              <button className="btn-primary" style={{ width: "auto", padding: "10px 20px" }} onClick={handleSendResponse} disabled={sending}>
                {sending ? "Sending..." : "Send Response"}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
