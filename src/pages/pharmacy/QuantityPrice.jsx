// FILE: src/pages/pharmacy/QuantityPrice.jsx
//
// Real feature: the form that actually writes to medicineStock — this
// is what makes a medicine show up (or update) in a patient's search
// on the "Pharmacy / Medicines" page.

import { useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import { upsertMedicineStock } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function PharmacyQuantityPrice() {
  const { profile, firebaseUser } = useAuth();
  const [medicineName, setMedicineName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await upsertMedicineStock({
      pharmacyUid: firebaseUser.uid,
      pharmacyName: profile?.name || "Pharmacy",
      medicineName,
      quantity,
      price,
    });
    setSaving(false);
    setSaved(true);
    setMedicineName("");
    setQuantity("");
    setPrice("");
  }

  return (
    <DashboardLayout items={NAV.pharmacy} roleLabel={ROLE_LABEL.pharmacy}>
      <div className="page-head">
        <h1>Quantity &amp; Price</h1>
        <p className="sub">Add a medicine or update its stock — patients see this instantly.</p>
      </div>

      <div className="panel">
        <form onSubmit={handleSubmit}>
          {saved && <div className="field-hint field-hint-found" style={{ marginBottom: 14 }}>Saved — visible to patients now.</div>}

          <div className="field">
            <label htmlFor="medicineName">Medicine name</label>
            <input id="medicineName" value={medicineName} onChange={(e) => setMedicineName(e.target.value)} required />
          </div>

          <div className="field">
            <label htmlFor="quantity">Quantity (units)</label>
            <input id="quantity" type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          </div>

          <div className="field">
            <label htmlFor="price">Price (₹)</label>
            <input id="price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>

          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}