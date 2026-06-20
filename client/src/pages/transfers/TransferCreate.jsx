import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";

const inputClass =
  "w-full rounded-md border border-slate-350 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

export default function TransferCreate() {
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shop_id") || "";
  const navigate = useNavigate();

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
      alert("Please select a destination shop.");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one product to transfer.");
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
      navigate(`/transfers?shop_id=${shopId}`);
    } else {
      const body = await res.json();
      setError(body.error || "Failed to dispatch stock transfer");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Initiate Stock Transfer</h2>
        <button
          onClick={() => navigate(`/transfers?shop_id=${shopId}`)}
          className="rounded-md border border-slate-350 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-650">Loading form...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <label className="text-sm font-semibold text-slate-700">Origin Dispatch Shop</label>
              <input
                value="Current Shop (Active Context)"
                disabled
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 font-medium"
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <label className="text-sm font-semibold text-slate-700">Destination Shop</label>
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

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Select Transfer Items</h3>

            <div className="flex gap-3">
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

            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-slate-700">Product</th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-700 w-32">Available Stock</th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-700 w-32">Transfer Qty</th>
                  <th className="px-4 py-2 text-center font-semibold text-slate-700 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={item.product_id}>
                    <td className="px-4 py-3 text-slate-900 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-right text-slate-500 font-mono font-medium">{item.max_qty}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateItemQty(idx, item.quantity - 1)}
                          className="h-6 w-6 flex items-center justify-center rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateItemQty(idx, item.quantity + 1)}
                          className="h-6 w-6 flex items-center justify-center rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-xs text-red-600 hover:underline font-semibold"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No products added to transfer request.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <button
            type="submit"
            disabled={items.length === 0 || submitting}
            className="w-full rounded-md bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Dispatching transfer..." : "Dispatch Stock Transfer"}
          </button>
        </form>
      )}
    </div>
  );
}
