import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";

const inputClass =
  "w-full rounded-md border border-slate-350 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

export default function PurchaseCreate() {
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shop_id") || "";
  const navigate = useNavigate();

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

  const [status, setStatus] = useState(() => {
    try {
      const saved = localStorage.getItem("inventory_purchase_cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.status || "received";
      }
    } catch (e) {
      console.error(e);
    }
    return "received";
  });

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Inline Supplier State
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierEmail, setNewSupplierEmail] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");

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
      JSON.stringify({ items, selectedSupplierId, status })
    );
  }, [items, selectedSupplierId, status]);

  const addProductRow = (prodId) => {
    if (!prodId) return;
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const existing = items.find((i) => i.product_id === prodId);
    if (existing) {
      setItems(
        items.map((i) =>
          i.product_id === prodId ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setItems([
        ...items,
        {
          product_id: prod.id,
          name: prod.name,
          quantity: 1,
          unit_cost: Number(prod.price) * 0.7, // Initial default estimated cost (70% of retail price)
        },
      ]);
    }
  };

  const updateItem = (index, field, val) => {
    setItems(
      items.map((item, idx) =>
        idx === index ? { ...item, [field]: val } : item
      )
    );
  };

  const removeItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleAddSupplierSubmit = async (e) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;

    const res = await apiFetch("/api/suppliers", {
      method: "POST",
      body: JSON.stringify({
        shop_id: shopId,
        name: newSupplierName,
        email: newSupplierEmail,
        phone: newSupplierPhone,
      }),
    });

    if (res.ok) {
      const body = await res.json();
      const created = body.supplier;
      setSuppliers([...suppliers, created]);
      setSelectedSupplierId(created.id);
      setNewSupplierName("");
      setNewSupplierEmail("");
      setNewSupplierPhone("");
      setShowAddSupplier(false);
    } else {
      alert("Failed to create supplier");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Please add at least one item.");
      return;
    }
    setSubmitting(true);

    const total_amount = items.reduce(
      (sum, i) => sum + i.quantity * Number(i.unit_cost),
      0
    );

    const res = await apiFetch("/api/purchases", {
      method: "POST",
      body: JSON.stringify({
        shop_id: shopId,
        supplier_id: selectedSupplierId || null,
        total_amount,
        status,
        items,
      }),
    });

    if (res.ok) {
      localStorage.removeItem("inventory_purchase_cart");
      navigate(`/purchases?shop_id=${shopId}`);
    } else {
      const body = await res.json();
      alert(body.error || "Failed to create purchase order");
      setSubmitting(false);
    }
  };

  const totalCost = items.reduce(
    (sum, i) => sum + i.quantity * Number(i.unit_cost),
    0
  );

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Create Purchase Order</h2>
        <button
          onClick={() => navigate(`/purchases?shop_id=${shopId}`)}
          className="rounded-md border border-slate-350 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3"></div>
          <p className="text-sm text-slate-500 font-medium">Loading catalog and suppliers...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supplier Select */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Supplier Vendor</label>
                <button
                  type="button"
                  onClick={() => setShowAddSupplier(!showAddSupplier)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  {showAddSupplier ? "Select Existing" : "+ Register New Supplier"}
                </button>
              </div>

              {showAddSupplier ? (
                <div className="space-y-2 border border-slate-200 rounded p-3 bg-slate-50">
                  <input
                    placeholder="Supplier Name"
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    required
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    placeholder="Email"
                    type="email"
                    value={newSupplierEmail}
                    onChange={(e) => setNewSupplierEmail(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    placeholder="Phone"
                    value={newSupplierPhone}
                    onChange={(e) => setNewSupplierPhone(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSupplierSubmit}
                    className="w-full rounded bg-emerald-600 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    Save Supplier
                  </button>
                </div>
              ) : (
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Direct / Walk-in Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Status Select */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <label className="text-sm font-semibold text-slate-700">Order Delivery Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass}
              >
                <option value="received">Received (Adds directly to inventory stock)</option>
                <option value="pending">Pending (Awaiting intake shipment)</option>
              </select>
            </div>
          </div>

          {/* Add Products Grid */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Purchase Catalog Items</h3>

            <div className="flex gap-3">
              <select
                onChange={(e) => {
                  addProductRow(e.target.value);
                  e.target.value = "";
                }}
                className={inputClass}
              >
                <option value="">-- Choose Product to Restock --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (current stock: {p.quantity})
                  </option>
                ))}
              </select>
            </div>

            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-slate-700">Product</th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-700 w-32">Unit Cost ($)</th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-700 w-28">Quantity</th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-700 w-32">Subtotal</th>
                  <th className="px-4 py-2 text-center font-semibold text-slate-700 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={item.product_id}>
                    <td className="px-4 py-2 text-slate-900 font-medium">{item.name}</td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={item.unit_cost}
                        onChange={(e) =>
                          updateItem(idx, "unit_cost", parseFloat(e.target.value) || 0)
                        }
                        required
                        className="rounded border border-slate-350 bg-white px-2 py-1 text-right text-xs focus:outline-none focus:border-emerald-500 w-24 font-mono font-medium"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(idx, "quantity", parseInt(e.target.value, 10) || 1)
                        }
                        required
                        className="rounded border border-slate-350 bg-white px-2 py-1 text-right text-xs focus:outline-none focus:border-emerald-500 w-20 font-mono font-medium"
                      />
                    </td>
                    <td className="px-4 py-2 text-right text-slate-900 font-bold font-mono">
                      ${(item.quantity * item.unit_cost).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-xs text-red-600 hover:underline font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No products added to PO.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-right font-bold text-slate-700 text-base">
                    Estimated Total Cost
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-slate-900 text-lg font-mono">
                    ${totalCost.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <button
            type="submit"
            disabled={items.length === 0 || submitting}
            className="w-full rounded-md bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Submitting order..." : "Submit Purchase Order"}
          </button>
        </form>
      )}
    </div>
  );
}
