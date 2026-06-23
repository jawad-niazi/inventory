import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

export default function QuotationCreate() {
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shop_id") || "";
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    if (items.length === 0) {
      alert("Please add at least one item.");
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
      navigate(`/quotations/${body.quotation.id}?shop_id=${shopId}`);
    } else {
      const body = await res.json();
      alert(body.error || "Failed to create quotation");
      setSubmitting(false);
    }
  };

  if (!shopId) {
    return (
      <div className="p-6 text-center text-slate-600">
        Please select a shop first.
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">New Quotation</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Kacha Bill — stock will NOT be deducted
          </p>
        </div>
        <button
          onClick={() => navigate(`/quotations?shop_id=${shopId}`)}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Customer Name
              </label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Ahmed Traders"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Valid Until
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
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

          {/* Items */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">
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

            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-slate-700">
                    Product / Model
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-700 w-36">
                    Unit Price (Rs.)
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-700 w-28">
                    Qty
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-700 w-36">
                    Subtotal
                  </th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={`${item.product_id}-${idx}`}>
                    <td className="px-4 py-2">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      {item.model_name && (
                        <p className="text-xs text-slate-500">
                          {item.model_name}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
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
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-right text-xs w-28 focus:outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            idx,
                            "quantity",
                            parseInt(e.target.value, 10) || 1,
                          )
                        }
                        required
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-right text-xs w-20 focus:outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-slate-900 font-mono">
                      Rs. {(item.quantity * Number(item.unit_price)).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-red-500 hover:text-red-700 text-lg leading-none"
                        title="Remove"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-slate-400 text-sm"
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
                      className="px-4 py-4 text-right font-bold text-slate-700 text-base"
                    >
                      Estimated Total
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-slate-900 text-lg font-mono">
                      Rs. {total.toFixed(2)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <button
            type="submit"
            disabled={items.length === 0 || submitting}
            className="w-full rounded-md bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {submitting
              ? "Creating Quotation…"
              : "Create Quotation (Kacha Bill)"}
          </button>
        </form>
      )}
    </div>
  );
}
