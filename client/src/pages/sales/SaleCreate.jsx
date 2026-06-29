import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";

const inputClass =
  "w-full rounded-2xl border-0 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-neon focus:bg-white transition-all";

export default function SaleCreate() {
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shop_id") || "";
  const navigate = useNavigate();

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("inventory_pos_cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.cart || [];
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState(() => {
    try {
      const saved = localStorage.getItem("inventory_pos_cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.selectedCustomerId || "";
      }
    } catch (e) {
      console.error(e);
    }
    return "";
  });

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [paidAmount, setPaidAmount] = useState(0);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem(
      "inventory_pos_cart",
      JSON.stringify({ cart, selectedCustomerId }),
    );
  }, [cart, selectedCustomerId]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Fetch products based on debounced query
  const loadProducts = async (q) => {
    if (!shopId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(
        `/api/products?shop_id=${shopId}&q=${encodeURIComponent(q)}`,
      );
      if (res.ok) {
        const body = await res.json();
        setProducts(body.products || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const updateCartPrice = (productId, price) => {
    setError(null);
    const p = Number(price) || 0;
    setCart(
      cart.map((i) =>
        i.product_id === productId ? { ...i, unit_price: p } : i,
      ),
    );
  };

  // Fetch customers once
  const loadCustomers = async () => {
    if (!shopId) return;
    try {
      const res = await apiFetch(`/api/customers?shop_id=${shopId}`);
      if (res.ok) {
        const body = await res.json();
        setCustomers(body.customers || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProducts(debouncedSearchQuery);
  }, [debouncedSearchQuery, shopId]);

  useEffect(() => {
    loadCustomers();
  }, [shopId]);

  const addToCart = async (product) => {
    setError(null);
    const existing = cart.find((item) => item.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.quantity) {
        setError(
          `Cannot exceed available stock of ${product.quantity} for ${product.name}`,
        );
        return;
      }
      setCart(
        cart.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
      return;
    }

    if (product.quantity <= 0) {
      setError(`Product ${product.name} is out of stock`);
      return;
    }

    // Fetch latest purchase cost for this product and store as purchase_price
    let purchase_price = 0;
    try {
      const res = await apiFetch(`/api/products/${product.id}/cost`);
      if (res.ok) {
        const body = await res.json();
        purchase_price = Number(body.latest_cost ?? product.price ?? 0);
      } else {
        purchase_price = Number(product.price ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch product cost", err);
      purchase_price = Number(product.price ?? 0);
    }

    setCart([
      ...cart,
      {
        product_id: product.id,
        name: product.name,
        unit_price: Number(product.price),
        purchase_price,
        quantity: 1,
        max_qty: product.quantity,
      },
    ]);
  };

  const updateCartQty = (productId, qty) => {
    setError(null);
    const item = cart.find((i) => i.product_id === productId);
    if (!item) return;

    if (qty > item.max_qty) {
      setError(
        `Cannot exceed available stock of ${item.max_qty} for ${item.name}`,
      );
      return;
    }

    if (qty <= 0) {
      setCart(cart.filter((i) => i.product_id !== productId));
    } else {
      setCart(
        cart.map((i) =>
          i.product_id === productId ? { ...i, quantity: qty } : i,
        ),
      );
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };


  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    setError(null);

    const total = cart.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0,
    );

    const payload = {
      shop_id: shopId,
      customer_id: selectedCustomerId || null,
      total,
      total_profit: cartProfit,
      paid_amount: Number(paidAmount || 0),
      due_amount: Math.max(0, Number(total) - Number(paidAmount || 0)),
      items: cart.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        name: item.name,
        purchase_price: item.purchase_price ?? 0,
      })),
    };

    const res = await apiFetch("/api/sales", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const body = await res.json();

    if (res.ok) {
      localStorage.removeItem("inventory_pos_cart");
      if (body.invoice_id) {
        navigate(`/invoices/${body.invoice_id}?shop_id=${shopId}`);
      } else {
        navigate(`/sales/${body.sale_id}?shop_id=${shopId}`);
      }
    } else {
      setError(body.error || "Failed to finalize checkout");
      setSubmitting(false);
    }
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );

  const cartProfit = cart.reduce(
    (sum, item) =>
      sum +
      (Number(item.unit_price || 0) - Number(item.purchase_price || 0)) *
        item.quantity,
    0,
  );

  if (!shopId) {
    return (
      <div className="p-6 text-center text-slate-650">
        Please select a shop first from the main Sales module.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">POS Cash Register</h2>
        <button
          onClick={() => navigate(`/sales?shop_id=${shopId}`)}
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
            placeholder="Search products by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={inputClass}
          />

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-slate-50/50 rounded-4xl border border-slate-100 shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3"></div>
              <p className="text-sm text-slate-500 font-medium">
                Fetching product catalog...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto pr-2">
              {products.map((p) => {
                const inCart = cart.find((item) => item.product_id === p.id);
                const currentAvailable = p.quantity - (inCart?.quantity || 0);

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
                      <p className="text-xs font-medium text-slate-400 mb-3">
                        SKU: {p.product_code || p.sku || "—"}
                      </p>
                      <p className="text-xl font-bold text-slate-900 font-mono">
                        Rs. {Number(p.price).toLocaleString()}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-50 pt-4">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          currentAvailable <= 0
                            ? "bg-red-50 text-red-600"
                            : currentAvailable <= (p.low_stock_threshold || 5)
                              ? "bg-amber-50 text-amber-600"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        Stock: {currentAvailable}
                      </span>
                      <button
                        type="button"
                        onClick={() => addToCart(p)}
                        disabled={currentAvailable <= 0}
                        className="rounded-full bg-brand-neon px-4 py-2 text-xs font-bold text-slate-900 hover:shadow-[0_4px_15px_rgba(206,243,109,0.4)] disabled:opacity-50 disabled:shadow-none transition-all"
                      >
                        Add
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

        {/* Cart & Customer Panel */}
        <div className="rounded-4xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-6 flex flex-col h-full max-h-[80vh]">
          {/* Customer Section */}
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">
              Customer
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className={inputClass}
            >
              <option value="">Walk-in Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Cart Items */}
          <div className="flex-1 min-h-0 flex flex-col">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">
              Cart Items
            </h3>
            <div className="overflow-y-auto pr-2 space-y-2 flex-1">
              {cart.map((item) => (
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
                      onClick={() => removeFromCart(item.product_id)}
                      className="text-red-500 hover:text-red-700 bg-white border border-red-100 hover:bg-red-50 h-6 w-6 flex items-center justify-center rounded-full transition-colors"
                    >
                      <span className="text-xs font-bold">×</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-bold text-slate-400">Rs.</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateCartPrice(item.product_id, e.target.value)
                        }
                        className="w-20 rounded-lg border-0 bg-white py-1 px-2 text-xs font-bold text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-brand-neon font-mono"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 bg-white rounded-full p-1 ring-1 ring-slate-200">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQty(item.product_id, item.quantity - 1)
                        }
                        className="h-5 w-5 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 font-bold text-slate-600 text-xs"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold w-4 text-center text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQty(item.product_id, item.quantity + 1)
                        }
                        className="h-5 w-5 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 font-bold text-slate-600 text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="flex h-32 items-center justify-center text-sm font-medium text-slate-400">
                  Cart is empty
                </div>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-sm font-bold text-slate-500">Cart Total</span>
              <span className="text-2xl font-bold text-slate-900 font-mono">
                Rs. {cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">
                Amount Paid (Rs.)
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
                <span className="text-xs font-bold text-slate-400">Balance Due:</span>
                <span className="text-xs font-bold text-slate-900 font-mono">Rs. {Math.max(0, cartTotal - Number(paidAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleCheckout}
              disabled={cart.length === 0 || submitting}
              className="w-full rounded-full bg-brand-neon py-3.5 text-sm font-bold text-slate-900 hover:shadow-[0_4px_15px_rgba(206,243,109,0.4)] disabled:opacity-50 disabled:shadow-none transition-all"
            >
              {submitting ? "Processing..." : "Complete Sale"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
