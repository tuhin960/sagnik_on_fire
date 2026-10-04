import { useEffect, useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import { getPharmacyStock } from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function PharmacyDashboard() {
  const { profile, firebaseUser } = useAuth();
  const [stock, setStock] = useState([]);

  useEffect(() => {
    if (firebaseUser?.uid) {
      getPharmacyStock(firebaseUser.uid).then(setStock);
    }
  }, [firebaseUser]);

  const lowStockCount = stock.filter((m) => m.quantity > 0 && m.quantity < 10).length;
  const outOfStockCount = stock.filter((m) => m.quantity === 0).length;

  return (
    <DashboardLayout items={NAV.pharmacy} roleLabel={ROLE_LABEL.pharmacy}>
      <div className="page-head">
        <h1>Welcome, {profile?.name || "Pharmacy"}</h1>
        <p className="sub">Your medicine stock and incoming prescription requests at a glance.</p>
      </div>

      <div className="stat-grid">
        <StatCard icon="💊" label="Medicines Listed" value={stock.length} />
        <StatCard icon="⚠️" label="Low Stock (<10 units)" value={lowStockCount} tint="var(--amber-100)" />
        <StatCard icon="🚨" label="Out of Stock" value={outOfStockCount} tint="var(--red-100)" />
        <StatCard icon="📜" label="License No." value={profile?.regNo || profile?.specialId || "N/A"} meta="Verified" />
      </div>
    </DashboardLayout>
  );
}