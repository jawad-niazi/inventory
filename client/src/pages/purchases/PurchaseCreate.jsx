import React, { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";

const inputClass =
  "w-full rounded-2xl border-0 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-neon focus:bg-white transition-all";

export default function PurchaseCreate({ shopId, onSuccess, onCancel }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem("inventory_purchase_cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.items || [];
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [selectedSupplierId, setSelectedSupplierId] = useState(() => {
    try {
      const saved = localStorage.getItem("inventory_purchase_cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.selectedSupplierId || "";
      }
    } catch (e) {
      console.error(e);
    }
    return "";
  });

  const [paidAmount, setPaidAmount] = useState(() => {
    try {
      const saved = localStorage.getItem("inventory_purchase_cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.paidAmount || 0;
      }
    } catch (e) {
      console.error(e);
    }
    return 0;
  });

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    if (!shopId) return;
    setLoading(true);
    const [pRes, sRes] = await Promise.all([
      apiFetch(`/api/products?shop_id=${shopId}`),
      apiFetch(`/api/suppliers?shop_id=${shopId}`),
    ]);
    if (pRes.ok) {
      const body = await pRes.json();
      setProducts(body.products || []);
    }
    if (sRes.ok) {
      const body = await sRes.json();
      setSuppliers(body.suppliers || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem(
      "inventory_purchase_cart",
      JSON.stringify({ items, selectedSupplierId, paidAmount }),
    );
  }, [items, selectedSupplierId, paidAmount]);

  const addProductRow = (prodId) => {
    if (!prodId) return;
    const prod = (products || []).find((p) => String(p.id) === String(prodId));
    if (!prod) return;

    const existing = items.find((i) => i.product_id === prodId);
    if (existing) {
      setItems(
        items.map((i) =>
          i.product_id === prodId ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      );
    } else {
      setItems([
        ...items,
        {
          product_id: prod.id,
          name: prod.name,
          quantity: 1,
          purchase_price: Number(prod.price) * 0.7, // Initial default estimated cost (70% of retail price)
        },
      ]);
    }
  };

  const updateItem = (index, field, val) => {
    setItems(
      items.map((item, idx) =>
        idx === index ? { ...item, [field]: val } : item,
      ),
    );
  };

  const removeItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (items.length === 0) {
      setError("Please add at least one item.");
      return;
    }
    setSubmitting(true);

    const total_amount = items.reduce(
      (sum, i) =>
        sum + i.quantity * Number(i.purchase_price ?? i.unit_cost ?? 0),
      0,
    );

    const due_amount = Number(total_amount) - Number(paidAmount || 0);
    const res = await apiFetch("/api/purchases", {
      method: "POST",
      body: JSON.stringify({
        shop_id: shopId,
        supplier_id: selectedSupplierId || null,
        total_amount,
        paid_amount: Number(paidAmount || 0),
        due_amount: due_amount > 0 ? Number(due_amount) : 0,
        items,
      }),
    });

    if (res.ok) {
      localStorage.removeItem("inventory_purchase_cart");
      if (onSuccess) onSuccess();
    } else {
      const body = await res.json();
      setError(body.error || "Failed to create purchase order");
      setSubmitting(false);
    }
  };

  const totalCost = items.reduce(
    (sum, i) => sum + i.quantity * Number(i.purchase_price ?? i.unit_cost ?? 0),
    0,
  );

  if (loading) {
    return <p className="text-slate-500 font-medium py-4">Loading catalog and suppliers...</p>;
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
          {/* Supplier Select */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Supplier Vendor
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className={inputClass}
            >
              <option value="">Direct / Walk-in Supplier</option>
              {(suppliers || []).map((s) => (
                <option key={s?.id} value={s?.id}>
                  {s?.company_name || "Supplier"}
                </option>
              ))}
            </select>
          </div>

          {/* Paid Amount */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Amount Paid (Rs.)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Add Products Grid */}
        <div className="rounded-4xl border border-slate-100 bg-slate-50/50 p-6 space-y-4">
          <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
            Purchase Catalog Items
          </h3>

          <select
            onChange={(e) => {
              addProductRow(e.target.value);
              e.target.value = "";
            }}
            className={inputClass}
          >
            <option value="">-- Choose Product to Restock --</option>
            {(products || []).map((p) => (
              <option key={p?.id} value={p?.id}>
                {p?.model_name ? `${p.model_name} · ` : ""}
                {p?.product_code || p?.sku || ""}
                {` — ${p?.name || "Product"} (stock: ${p?.quantity ?? 0})`}
              </option>
            ))}
          </select>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Product
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right w-36">
                    Unit Cost
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right w-32">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right w-36">
                    Subtotal
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-center w-16"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.product_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-bold text-slate-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={item.purchase_price ?? item.unit_cost}
                        onChange={(e) =>
                          updateItem(
                            idx,
                            "purchase_price",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        required
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-right text-sm w-32 focus:outline-none focus:ring-2 focus:ring-brand-neon font-mono"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => updateItem(idx, "quantity", Math.max(1, item.quantity - 1))}
                          className="h-7 w-7 flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-100 font-bold text-slate-600 transition-colors"
                        >
                          -
                        </button>
                        <span className="text-sm font-bold w-8 text-center text-slate-900">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateItem(idx, "quantity", item.quantity + 1)}
                          className="h-7 w-7 flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-100 font-bold text-slate-600 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-900 font-bold font-mono">
                      Rs.{" "}
                      {(
                        item.quantity * (item.purchase_price ?? item.unit_cost)
                      ).toFixed(2)}
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
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm font-medium text-slate-400"
                    >
                      No products added to PO.
                    </td>
                  </tr>
                )}
              </tbody>
              {items.length > 0 && (
                <tfoot>
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-5 text-right font-bold text-slate-700 text-base"
                    >
                      Estimated Total Cost
                    </td>
                    <td className="px-4 py-5 text-right font-bold text-slate-900 text-lg font-mono">
                      Rs. {totalCost.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
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
            {submitting ? "Submitting..." : "Submit Purchase Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
