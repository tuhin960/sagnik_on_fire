// FILE: src/pages/healthworker/MedicineDiagnosticStatus.jsx
//
// Real medicine availability from the medicineStock collection that
// Pharmacy accounts maintain (same source as the patient's Medicines page).
//   - Search one medicine -> which pharmacies have it, qty, price, fresh/stale
//   - "Check essentials" -> common ASHA medicines checked in one click
// Diagnostics: no data source yet (facility module not built), so the page
// says so honestly instead of showing fake numbers.
//
// Note: stock lookup matches the exact medicine name (case-insensitive), the
// same way pharmacies save it. quantity 0 counts as out of stock.

import { useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import { searchMedicineAvailability } from "../../firebase/firestore";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

const ESSENTIALS = [
  "ORS", "Paracetamol", "Zinc", "Iron Folic Acid", "Amoxicillin",
  "Cetirizine", "Metformin", "Amlodipine", "Salbutamol", "Albendazole",
];

export default function HealthWorkerMedicineDiagnosticStatus() {
  const [term, setTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState("");
  const [results, setResults] = useState(null);

  const [checking, setChecking] = useState(false);
  const [essentials, setEssentials] = useState(null);
  const [error, setError] = useState(null);

  const inStock = (list) => list.filter((r) => Number(r.quantity) > 0);

  async function handleSearch(e) {
    e.preventDefault();
    if (!term.trim()) return;
    setError(null);
    setSearching(true);
    try {
      const found = await searchMedicineAvailability(term);
      setResults(inStock(found));
      setSearched(term.trim());
    } catch (err) {
      console.error("searchMedicineAvailability failed:", err);
      setError(err.message || "Couldn't check stock right now.");
    } finally {
      setSearching(false);
    }
  }

  async function checkEssentials() {
    setError(null);
    setChecking(true);
    try {
      const rows = await Promise.all(
        ESSENTIALS.map(async (name) => {
          const found = inStock(await searchMedicineAvailability(name));
          return { name, pharmacies: found, fresh: found.filter((f) => !f.isStale).length };
        })
      );
      setEssentials(rows);
    } catch (err) {
      console.error("essentials check failed:", err);
      setError(err.message || "Couldn't check stock right now.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <DashboardLayout items={NAV.healthworker} roleLabel={ROLE_LABEL.healthworker}>
      <div className="page-head">
        <h1>Medicine / Diagnostic Status</h1>
        <p className="sub">Check which pharmacy has a medicine before you send a patient there.</p>
      </div>

      {error && <p className="form-error">{error}</p>}

      {/* Search one medicine */}
      <div className="panel">
        <h3>💊 Search a medicine</h3>
        <form onSubmit={handleSearch} className="medicine-search-row">
          <input
            className="medicine-search-input"
            placeholder="e.g. Paracetamol"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <button className="btn-primary medicine-search-btn" type="submit" disabled={searching}>
            {searching ? "Searching…" : "Search"}
          </button>
        </form>
        <p className="panel-note" style={{ marginTop: 8 }}>
          Type the medicine name the way pharmacies list it. Only in-stock results are shown.
        </p>
      </div>

      {results !== null && (
        <div className="panel">
          <h3>Results for "{searched}"</h3>
          {results.length === 0 && (
            <div className="empty-state">
              <div className="big">Not in stock</div>
              <p>No pharmacy has reported stock for this medicine, or the name doesn't match exactly.</p>
            </div>
          )}
          {results.map((r) => (
            <div key={r.pharmacyUid} className="medicine-result-row">
              <div>
                <div className="medicine-result-name">{r.pharmacyName}</div>
                <div className="panel-note">{r.quantity} units · ₹{r.price}</div>
              </div>
              <StatusBadge type={r.isStale ? "stale" : "fresh"} />
            </div>
          ))}
        </div>
      )}

      {/* Essentials */}
      <div className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <h3 style={{ marginBottom: 0 }}>🧰 Essential medicines</h3>
          <button className="btn-primary" style={{ width: "auto", padding: "8px 18px" }} disabled={checking} onClick={checkEssentials}>
            {checking ? "Checking…" : essentials ? "Re-check" : "Check essentials"}
          </button>
        </div>
        <p className="panel-note" style={{ marginTop: 6 }}>
          Common field medicines: {ESSENTIALS.join(", ")}.
        </p>

        {essentials && (
          <div style={{ marginTop: 12 }}>
            {essentials.map((row) => (
              <div key={row.name} style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <strong>{row.name}</strong>
                  {row.pharmacies.length === 0 ? (
                    <StatusBadge type="emergency" label="Not in stock" />
                  ) : (
                    <StatusBadge
                      type={row.fresh > 0 ? "fresh" : "stale"}
                      label={`${row.pharmacies.length} pharmac${row.pharmacies.length === 1 ? "y" : "ies"}${row.fresh === 0 ? " (stock may be old)" : ""}`}
                    />
                  )}
                </div>
                {row.pharmacies.length > 0 && (
                  <p className="panel-note">
                    {row.pharmacies.map((p) => `${p.pharmacyName} (${p.quantity})`).join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Diagnostics */}
      <div className="panel">
        <h3>🧪 Diagnostics</h3>
        <p className="panel-note">
          Diagnostic availability isn't connected yet. It will show up here once diagnostic centres start reporting
          their tests and equipment.
        </p>
      </div>
    </DashboardLayout>
  );
}