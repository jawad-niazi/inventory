import React, { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";

const inputClass =
  "w-full rounded-2xl border-0 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-neon focus:bg-white transition-all";

export default function TransferCreate({ shopId, onSuccess, onCancel }) {
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedToShopId, setSelectedToShopId] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    if (!shopId) return;
    setLoading(true);
    setError(null);
    const [pRes, sRes] = await Promise.all([
      apiFetch(`/api/products?shop_id=${shopId}`),
      apiFetch(`/api/shops`),
    ]);
    if (pRes.ok) {
      const body = await pRes.json();
      setProducts(body.products || []);
    }
    if (sRes.ok) {
      const body = await sRes.json();
      setShops((body.shops || []).filter((s) => s.id !== shopId));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

  const addProductRow = (prodId) => {
    if (!prodId) return;
    setError(null);
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const existing = items.find((i) => i.product_id === prodId);
    if (existing) {
      if (existing.quantity >= prod.quantity) {
        setError(`Cannot exceed available stock of ${prod.quantity} for ${prod.name}`);
        return;
      }
      setItems(
        items.map((i) =>
          i.product_id === prodId ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      if (prod.quantity <= 0) {
        setError(`Product ${prod.name} has no available stock to transfer`);
        return;
      }
      setItems([
        ...items,
        {
          product_id: prod.id,
          name: prod.name,
          quantity: 1,
          max_qty: prod.quantity,
        },
      ]);
    }
  };

  const updateItemQty = (index, qty) => {
    setError(null);
    const item = items[index];
    if (!item) return;

    if (qty > item.max_qty) {
      setError(`Cannot exceed available stock of ${item.max_qty} for ${item.name}`);
      return;
    }

    if (qty <= 0) {
      setItems(items.filter((_, idx) => idx !== index));
    } else {
      setItems(
        items.map((it, idx) => (idx === index ? { ...it, quantity: qty } : it))
      );
    }
  };

  const removeItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedToShopId) {
      setError("Please select a destination shop.");
      return;
    }
    if (items.length === 0) {
      setError("Please add at least one product to transfer.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await apiFetch("/api/transfers", {
      method: "POST",
      body: JSON.stringify({
        from_shop_id: shopId,
        to_shop_id: selectedToShopId,
        status: "pending",
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
      }),
    });

    if (res.ok) {
      if (onSuccess) onSuccess();
    } else {
      const body = await res.json();
      setError(body.error || "Failed to dispatch stock transfer");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-slate-500 font-medium py-4">Loading transfer data...</p>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Origin Dispatch Shop</label>
            <input
              value="Current Shop (Active Context)"
              disabled
              className="w-full rounded-2xl border-0 bg-slate-100 px-4 py-3.5 text-sm text-slate-500 font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Destination Shop</label>
            <select
              value={selectedToShopId}
              onChange={(e) => setSelectedToShopId(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">-- Select Destination Shop --</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-4xl border border-slate-100 bg-slate-50/50 p-6 space-y-4">
          <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">Select Transfer Items</h3>

          <div>
            <select
              onChange={(e) => {
                addProductRow(e.target.value);
                e.target.value = "";
              }}
              className={inputClass}
            >
              <option value="">-- Choose Product to Transfer --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (available: {p.quantity})
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Product</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right w-32">Available</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right w-32">Transfer Qty</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-center w-20"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.product_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-bold text-slate-900">{item.name}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-slate-500">{item.max_qty}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => updateItemQty(idx, item.quantity - 1)}
                          className="h-7 w-7 flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-100 font-bold text-slate-600 transition-colors"
                        >
                          -
                        </button>
                        <span className="text-sm font-bold w-8 text-center text-slate-900">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateItemQty(idx, item.quantity + 1)}
                          className="h-7 w-7 flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-100 font-bold text-slate-600 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm font-medium text-slate-400">
                      No products added to transfer request.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-sm font-bold text-slate-600 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={items.length === 0 || submitting}
            className="px-6 py-3 text-sm font-bold text-slate-900 bg-brand-neon rounded-full hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(206,243,109,0.4)] disabled:opacity-50 transition-all duration-200"
          >
            {submitting ? "Dispatching..." : "Dispatch Stock Transfer"}
          </button>
        </div>
      </form>
    </div>
  );
}
