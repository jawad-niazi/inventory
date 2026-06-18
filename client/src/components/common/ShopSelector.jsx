import React, { useEffect, useState } from "react";
import { apiFetch, fetchShops } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";

export default function ShopSelector({ value, onChange }) {
  const { role, shopId } = useAuth();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (role === "super_admin") {
        const list = await fetchShops();
        setShops(list);
        if (!value && list.length > 0) onChange(list[0].id);
      } else if (shopId) {
        onChange(shopId);
      }
      setLoading(false);
    };
    load();
  }, [role, shopId]);

  if (loading) return <div className="text-sm text-gray-500">Loading shops...</div>;

  if (role !== "super_admin") return null;

  return (
    <div className="mb-4">
      <label className="mb-1 block text-sm font-medium text-gray-700">Shop</label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">Select a shop</option>
        {shops.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
