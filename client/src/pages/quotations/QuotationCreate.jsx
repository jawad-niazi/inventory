import React, { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";

const inputClass =
  "w-full rounded-2xl border-0 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-neon focus:bg-white transition-all";

export default function QuotationCreate({ shopId, onSuccess, onCancel }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!shopId) return;
    setLoading(true);
    apiFetch(`/api/products?shop_id=${shopId}`).then(async (res) => {
      if (res.ok) {
        const body = await res.json();
        setProducts(body.products || []);
      }
      setLoading(false);
    });
  }, [shopId]);

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
          name: prod?.name || "",
          model_name: prod?.model_name || "",
          description: prod?.name || "",
          quantity: 1,
          unit_price: Number(prod?.price) || 0,
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

  const total = items.reduce(
    (sum, i) => sum + (i.quantity || 0) * (Number(i.unit_price) || 0),
    0,
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("Please add at least one item.");
      return;
    }
    setSubmitting(true);

    const payload = {
      shop_id: shopId,
      customer_name: customerName || null,
      notes: notes || null,
      valid_until: validUntil || null,
      items: items.map((i) => ({
        product_id: i.product_id,
        description: i.name,
        quantity: parseInt(i.quantity, 10),
        unit_price: parseFloat(i.unit_price),
      })),
    };

    const res = await apiFetch("/api/quotations", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const body = await res.json();
      if (onSuccess) onSuccess(body.quotation.id);
    } else {
      const body = await res.json();
      setError(body.error || "Failed to create quotation");
      setSubmitting(false);
    }
  };

  if (!shopId) {
    return (
      <div className="p-6 text-center text-slate-500 font-medium">
        Please select a shop first.
      </div>
    );
  }

  if (loading) {
    return <p className="text-slate-500 font-medium py-4">Loading quotation data...</p>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Customer Name
            </label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Ahmed Traders"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Valid Until
            </label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Notes / Remarks
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              className={inputClass}
            />
          </div>
        </div>

        <div className="rounded-4xl border border-slate-100 bg-slate-50/50 p-6 space-y-4">
          <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
            Quotation Items
          </h3>

          <select
            onChange={(e) => {
              addProductRow(e.target.value);
              e.target.value = "";
            }}
            className={inputClass}
          >
            <option value="">— Select a product to add —</option>
            {(products || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.model_name ? ` · ${p.model_name}` : ""}
                {p.sku ? ` (${p.sku})` : ""}
              </option>
            ))}
          </select>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Product / Model
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right w-36">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right w-32">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right w-36">
                    Subtotal
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-center w-16" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={`${item.product_id}-${idx}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      {item.model_name && (
                        <p className="text-xs font-medium text-slate-500">
                          {item.model_name}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItem(
                            idx,
                            "unit_price",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        required
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-right text-sm w-32 focus:outline-none focus:ring-2 focus:ring-brand-neon"
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
                    <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">
                      Rs. {(item.quantity * Number(item.unit_price)).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline transition-colors"
                        title="Remove"
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
                      className="px-4 py-8 text-center text-slate-400 font-medium text-sm"
                    >
                      No items added yet. Select a product above.
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
                      Estimated Total
                    </td>
                    <td className="px-4 py-5 text-right font-bold text-slate-900 text-lg font-mono">
                      Rs. {total.toFixed(2)}
                    </td>
                    <td />
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
            {submitting ? "Creating..." : "Create Quotation (Kacha Bill)"}
          </button>
        </div>
      </form>
    </div>
  );
}
