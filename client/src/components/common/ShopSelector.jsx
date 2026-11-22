import React, { useEffect, useState } from "react";
import { apiFetch, fetchShops } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import CustomSelect from "./CustomSelect";

export default function ShopSelector({ value, onChange }) {
  const { role, shopId, switchShop } = useAuth();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (role === "super_admin") {
        const list = await fetchShops();
        setShops(list);
        if (!value && list.length > 0) {
          onChange(list[0].id);
          switchShop(list[0].id, list[0].name);
        }
      } else if (shopId) {
        onChange(shopId);
      }
      setLoading(false);
    };
    load();
  }, [role, shopId]);

  if (loading) return <div className="text-sm text-gray-500">Loading shops...</div>;

  if (role !== "super_admin") return null;

  const handleChange = (e) => {
    const newId = e.target.value;
    onChange(newId);
    const selected = shops.find((s) => s.id === newId);
    if (selected) {
      switchShop(selected.id, selected.name);
    }
  };

  return (
    <div className="mb-4 max-w-xs">
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Shop</label>
      <CustomSelect
        value={value || ""}
        onChange={handleChange}
        className="rounded-2xl border-0 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-brand-neon shadow-sm"
        placeholder="Select a shop"
      >
        <option value="">Select a shop</option>
        {shops.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </CustomSelect>
    </div>
  );
}
