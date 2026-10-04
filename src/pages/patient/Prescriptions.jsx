import { useEffect, useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import { listenToPatientPrescriptions, getPharmacies, sendPrescriptionToPharmacy } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

function formatDate(ts) {
  const d = ts?.toDate ? ts.toDate() : new Date();
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function printPrescription(rx, patientName) {
  const rows = (rx.medicines || [])
    .map(
      (m, i) => `<tr>
        <td>${i + 1}</td>
        <td><strong>${esc(m.name)}</strong></td>
        <td>${esc(m.dosage)}</td>
        <td>${esc(m.frequency)}</td>
        <td>${esc(m.duration)}</td>
        <td>${esc(m.instructions)}</td>
      </tr>`
    )
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Prescription</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;padding:32px;color:#111}
      h1{margin:0 0 4px;font-size:22px} .muted{color:#555;font-size:13px}
      table{width:100%;border-collapse:collapse;margin-top:18px;font-size:14px}
      th,td{border:1px solid #bbb;padding:8px;text-align:left;vertical-align:top}
      th{background:#f0f0f0} .notes{margin-top:18px;font-size:14px}
      .foot{margin-top:40px;font-size:12px;color:#777}
    </style></head><body>
      <h1>Swasth Setu - Prescription</h1>
      <p class="muted">Date: ${esc(formatDate(rx.createdAt))}</p>
      <p><strong>Patient:</strong> ${esc(patientName || rx.patientName)}${rx.patientId ? ` (${esc(rx.patientId)})` : ""}<br>
         <strong>Doctor:</strong> ${esc(rx.doctorName)}</p>
      <table>
        <thead><tr><th>#</th><th>Medicine</th><th>Dosage</th><th>How often</th><th>Duration</th><th>Instructions</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${rx.notes ? `<p class="notes"><strong>Advice:</strong> ${esc(rx.notes)}</p>` : ""}
      <p class="foot">Take medicines only as prescribed. This is a digital copy.</p>
      <script>window.onload=function(){window.print();}</script>
    </body></html>`;

  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) {
    alert("Please allow pop-ups to print this prescription.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export default function PatientPrescriptions() {
  const { profile, firebaseUser } = useAuth();
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);

  const [checkingFor, setCheckingFor] = useState(null); // rx
  const [pharmacies, setPharmacies] = useState(null);
  const [loadingPharma, setLoadingPharma] = useState(false);
  const [sendingPharma, setSendingPharma] = useState(false);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = listenToPatientPrescriptions(
      firebaseUser.uid,
      (l) => { setError(null); setList(l); },
      (err) => setError(err.message || "Couldn't load your prescriptions.")
    );
    return unsub;
  }, [firebaseUser]);

  async function openCheckModal(rx) {
    setCheckingFor(rx);
    setPharmacies(null);
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
    if (!checkingFor || !firebaseUser?.uid || !profile?.name) return;
    setSendingPharma(true);
    try {
      await sendPrescriptionToPharmacy(firebaseUser.uid, profile.name, checkingFor, pharmacy.uid, pharmacy.name);
      alert(`Sent prescription to ${pharmacy.name}. They will check their stock and update you!`);
      setCheckingFor(null);
    } catch (e) {
      alert("Error sending request: " + e.message);
    }
    setSendingPharma(false);
  }

  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>Prescriptions</h1>
        <p className="sub">Medicines your doctors have prescribed to you.</p>
      </div>

      {error && <p className="panel-note">Couldn't load prescriptions: {error}</p>}
      {list === null && !error && <p className="panel-note">Loading...</p>}

      {list?.length === 0 && (
        <div className="empty-state">
          <div className="big">No prescriptions yet</div>
          <p>After a consultation, your doctor's prescription will appear here.</p>
        </div>
      )}

      {list?.map((rx, idx) => (
        <div key={rx.id} className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <h3 style={{ marginBottom: 0 }}>
              💊 {rx.doctorName || "Doctor"} {idx === 0 && <StatusBadge type="fresh" label="Latest" />}
            </h3>
            <span className="panel-note">{formatDate(rx.createdAt)}</span>
          </div>

          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--slate-600)", fontSize: 12.5 }}>
                  <th style={{ padding: "6px 8px" }}>Medicine</th>
                  <th style={{ padding: "6px 8px" }}>Dosage</th>
                  <th style={{ padding: "6px 8px" }}>How often</th>
                  <th style={{ padding: "6px 8px" }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {rx.medicines?.map((m, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--line)", verticalAlign: "top" }}>
                    <td style={{ padding: "8px" }}>
                      <strong>{m.name}</strong>
                      {m.instructions && <div className="panel-note">{m.instructions}</div>}
                    </td>
                    <td style={{ padding: "8px" }}>{m.dosage}</td>
                    <td style={{ padding: "8px" }}>{m.frequency}</td>
                    <td style={{ padding: "8px" }}>{m.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rx.notes && (
            <p className="panel-note" style={{ marginTop: 10 }}>
              💡 <strong>Advice:</strong> {rx.notes}
            </p>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <button
              className="btn-logout"
              style={{ padding: "8px 18px", width: "auto" }}
              onClick={() => printPrescription(rx, profile?.name)}
            >
              🖨️ Print / Save PDF
            </button>
            <button
              className="btn-primary"
              style={{ padding: "8px 18px", width: "auto" }}
              onClick={() => openCheckModal(rx)}
            >
              Check Availability at Pharmacy
            </button>
          </div>
        </div>
      ))}

      {checkingFor && (
        <div className="modal-overlay" onClick={() => !sendingPharma && setCheckingFor(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 20 }}>Select Pharmacy</h2>
              <button className="btn-logout" style={{ width: "auto", padding: "4px 8px" }} onClick={() => !sendingPharma && setCheckingFor(null)}>X</button>
            </div>
            <p className="panel-note" style={{ marginBottom: 16 }}>
              Send this prescription to a pharmacy. They will reply with availability.
            </p>

            {loadingPharma && <p>Loading pharmacies...</p>}
            {!loadingPharma && pharmacies?.length === 0 && <p>No pharmacies registered in the system yet.</p>}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pharmacies?.map(ph => (
                <div key={ph.uid} className="medicine-result-row">
                  <div>
                    <div className="medicine-result-name">{ph.name}</div>
                    <div className="panel-note">{ph.email || "Pharmacy"}</div>
                  </div>
                  <button 
                    className="btn-primary" 
                    style={{ width: "auto", padding: "6px 14px", fontSize: 13 }}
                    disabled={sendingPharma}
                    onClick={() => handleSendToPharmacy(ph)}
                  >
                    {sendingPharma ? "Sending..." : "Send Request"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
