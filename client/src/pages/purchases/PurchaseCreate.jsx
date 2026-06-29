import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";

const inputClass =
  "w-full rounded-2xl border-0 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-neon focus:bg-white transition-all";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem(
      "inventory_purchase_cart",
      JSON.stringify({ items, selectedSupplierId, paidAmount }),
    );
  }, [items, selectedSupplierId, paidAmount]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadProducts = async (q) => {
    if (!shopId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/products?shop_id=${shopId}&q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const body = await res.json();
        setProducts(body.products || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load catalog");
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    if (!shopId) return;
    try {
      const res = await apiFetch(`/api/suppliers?shop_id=${shopId}`);
      if (res.ok) {
        const body = await res.json();
        setSuppliers(body.suppliers || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProducts(debouncedSearchQuery);
  }, [debouncedSearchQuery, shopId]);

  useEffect(() => {
    loadSuppliers();
  }, [shopId]);

  const addProductRow = (prod) => {
    if (!prod) return;
    setError(null);

    const existing = items.find((i) => i.product_id === prod.id);
    if (existing) {
      setItems(
        items.map((i) =>
          i.product_id === prod.id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      );
    } else {
      setItems([
        ...items,
        {
          product_id: prod.id,
          name: prod.name,
          quantity: 1,
          purchase_price: Number(prod.price) * 0.7, // Initial default estimated cost
        },
      ]);
    }
  };

  const updateItemQty = (prodId, qty) => {
    if (qty <= 0) {
      setItems(items.filter((i) => i.product_id !== prodId));
    } else {
      setItems(
        items.map((i) =>
          i.product_id === prodId ? { ...i, quantity: qty } : i,
        ),
      );
    }
  };

  const updateItemPrice = (prodId, price) => {
    const p = parseFloat(price) || 0;
    setItems(
      items.map((i) =>
        i.product_id === prodId ? { ...i, purchase_price: p } : i,
      ),
    );
  };

  const removeItem = (prodId) => {
    setItems(items.filter((i) => i.product_id !== prodId));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    
    if (items.length === 0) {
      setError("Please add at least one item to purchase.");
      return;
    }
    setSubmitting(true);

    const total_amount = items.reduce(
      (sum, i) => sum + i.quantity * Number(i.purchase_price ?? 0),
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
        due_amount: Math.max(0, due_amount),
        items,
      }),
    });

    if (res.ok) {
      const body = await res.json();
      localStorage.removeItem("inventory_purchase_cart");
      navigate(`/purchases/${body.purchase_id}?shop_id=${shopId}`);
    } else {
      const body = await res.json();
      setError(body.error || "Failed to create purchase order");
      setSubmitting(false);
    }
  };

  const totalCost = items.reduce(
    (sum, i) => sum + i.quantity * Number(i.purchase_price ?? 0),
    0,
  );

  if (!shopId) {
    return (
      <div className="p-6 text-center text-slate-650">
        Please select a shop first from the Procurement module.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create Purchase Order</h2>
        <button
          onClick={() => navigate(`/purchases?shop_id=${shopId}`)}
          className="rounded-full bg-slate-100 px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-start">
        {/* Products Panel */}
        <div className="lg:col-span-2 space-y-4">
          <input
            placeholder="Search catalog to restock..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={inputClass}
          />

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-slate-50/50 rounded-4xl border border-slate-100 shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3"></div>
              <p className="text-sm text-slate-500 font-medium">Loading catalog...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto pr-2">
              {products.map((p) => {
                const currentAvailable = p.quantity || 0;
                return (
                  <div
                    key={p.id}
                    className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-all duration-300"
                  >
                    <div>
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt=""
                          className="h-32 w-full rounded-2xl object-cover mb-4 shadow-sm"
                        />
                      ) : (
                        <div className="flex h-32 w-full items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-300 mb-4">
                          NO IMAGE
                        </div>
                      )}
                      <h4 className="font-bold text-slate-900 line-clamp-1 mb-1">
                        {p.name}
                      </h4>
                      <p className="text-xs font-medium text-slate-400 mb-2">
                        SKU: {p.product_code || p.sku || "—"}
                      </p>
                      <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full mb-3">
                        Current Stock: {currentAvailable}
                      </span>
                    </div>

                    <div className="mt-2 border-t border-slate-50 pt-4">
                      <button
                        type="button"
                        onClick={() => addProductRow(p)}
                        className="w-full rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all"
                      >
                        Add to PO
                      </button>
                    </div>
                  </div>
                );
              })}
              {products.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 font-medium bg-slate-50/50 rounded-4xl border border-slate-100">
                  No products found matching your search.
                </div>
              )}
            </div>
          )}
        </div>

        {/* PO & Supplier Panel */}
        <div className="rounded-4xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-6 flex flex-col h-full max-h-[80vh]">
          {/* Supplier Section */}
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">
              Supplier Vendor
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className={inputClass}
            >
              <option value="">Direct / Walk-in Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.company_name}
                </option>
              ))}
            </select>
          </div>

          {/* PO Items */}
          <div className="flex-1 min-h-0 flex flex-col">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">
              Purchase Items
            </h3>
            <div className="overflow-y-auto pr-2 space-y-2 flex-1">
              {items.map((item) => (
                <div
                  key={item.product_id}
                  className="p-3 bg-slate-50 rounded-2xl flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-bold text-slate-900 flex-1 pr-2 leading-tight">
                      {item.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.product_id)}
                      className="text-red-500 hover:text-red-700 bg-white border border-red-100 hover:bg-red-50 h-6 w-6 flex items-center justify-center rounded-full transition-colors"
                    >
                      <span className="text-xs font-bold">×</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Unit Cost (Rs)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.purchase_price}
                        onChange={(e) => updateItemPrice(item.product_id, e.target.value)}
                        className="w-20 rounded-lg border-0 bg-white py-1 px-2 text-xs font-bold text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-brand-neon font-mono"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1 items-end">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Quantity</label>
                      <div className="flex items-center gap-2 bg-white rounded-full p-1 ring-1 ring-slate-200">
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.product_id, item.quantity - 1)}
                          className="h-5 w-5 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 font-bold text-slate-600 text-xs"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-4 text-center text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.product_id, item.quantity + 1)}
                          className="h-5 w-5 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 font-bold text-slate-600 text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="flex h-32 items-center justify-center text-sm font-medium text-slate-400">
                  No items added to PO.
                </div>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-sm font-bold text-slate-500">Est. Total Cost</span>
              <span className="text-2xl font-bold text-slate-900 font-mono">
                Rs. {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">
                Amount Paid Upfront (Rs.)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full rounded-xl border-0 bg-white px-3 py-2 text-sm font-bold text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-brand-neon font-mono"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs font-bold text-slate-400">Balance Owed:</span>
                <span className="text-xs font-bold text-slate-900 font-mono">Rs. {Math.max(0, totalCost - Number(paidAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={items.length === 0 || submitting}
              className="w-full rounded-full bg-brand-neon py-3.5 text-sm font-bold text-slate-900 hover:shadow-[0_4px_15px_rgba(206,243,109,0.4)] disabled:opacity-50 disabled:shadow-none transition-all"
            >
              {submitting ? "Processing..." : "Confirm Purchase Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
