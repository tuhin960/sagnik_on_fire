// FILE: src/pages/patient/Medicines.jsx
//
// Real feature (not a stub): searches the medicineStock collection
// that Pharmacy accounts maintain, and shows which pharmacy has the
// medicine, how much, at what price — with a fresh/stale badge so the
// patient knows how recent the stock count is.

import { useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import { searchMedicineAvailability } from "../../firebase/firestore";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function PatientMedicines() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!term.trim()) return;
    setSearching(true);
    const found = await searchMedicineAvailability(term);
    setResults(found);
    setSearching(false);
  }

  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>Pharmacy / Medicines</h1>
        <p className="sub">Check which nearby pharmacy has your medicine in stock right now.</p>
      </div>

      <div className="panel">
        <form onSubmit={handleSearch} className="medicine-search-row">
          <input
            className="medicine-search-input"
            placeholder="e.g. Paracetamol 500mg"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <button className="btn-primary medicine-search-btn" type="submit" disabled={searching}>
            {searching ? "Searching…" : "Search"}
          </button>
        </form>
      </div>

      {results !== null && (
        <div className="panel">
          <h3>Results for "{term}"</h3>
          {results.length === 0 && (
            <div className="empty-state">
              <div className="big">Not available nearby</div>
              <p>No pharmacy has reported stock for this medicine yet.</p>
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
    </DashboardLayout>
  );
}