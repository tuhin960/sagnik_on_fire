// FILE: src/pages/pharmacy/MedicineAvailability.jsx
//
// Real feature: shows this pharmacy's own current stock list, so staff
// can see at a glance what's low/stale, and remove an item that's sold
// out (delete sets quantity to 0 rather than deleting the doc, so the
// medicine name stays searchable with a clear "0 in stock" result).

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import { deleteMedicineStock, getPharmacyStock } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function PharmacyMedicineAvailability() {
  const { firebaseUser } = useAuth();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!firebaseUser?.uid) return;
    setLoading(true);
    const list = await getPharmacyStock(firebaseUser.uid);
    setStock(list.sort((a, b) => a.medicineName.localeCompare(b.medicineName)));
    setLoading(false);
  }

  useEffect(() => { refresh(); }, [firebaseUser]);

  async function handleMarkOut(medicineName) {
    await deleteMedicineStock(firebaseUser.uid, medicineName);
    refresh();
  }

  return (
    <DashboardLayout items={NAV.pharmacy} roleLabel={ROLE_LABEL.pharmacy}>
      <div className="page-head">
        <h1>Medicine Availability</h1>
        <p className="sub">Your current stock, as patients see it when they search.</p>
      </div>

      <div className="panel">
        {loading && <p className="panel-note">Loading…</p>}
        {!loading && stock.length === 0 && (
          <div className="empty-state">
            <div className="big">No medicines listed yet</div>
            <p>Add stock from the "Quantity &amp; Price" page.</p>
          </div>
        )}
        {stock.map((m) => {
          const updatedAtMs = m.updatedAt?.toMillis ? m.updatedAt.toMillis() : null;
          const isStale = updatedAtMs ? Date.now() - updatedAtMs > 6 * 60 * 60 * 1000 : true;
          return (
            <div key={m.medicineNameLower} className="medicine-result-row">
              <div>
                <div className="medicine-result-name">{m.medicineName}</div>
                <div className="panel-note">{m.quantity} units · ₹{m.price}</div>
              </div>
              <div className="medicine-row-actions">
                <StatusBadge type={m.quantity === 0 ? "stale" : isStale ? "stale" : "fresh"} label={m.quantity === 0 ? "Out of stock" : undefined} />
                {m.quantity > 0 && (
                  <button type="button" className="btn-logout" onClick={() => handleMarkOut(m.medicineName)}>
                    Mark out of stock
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}