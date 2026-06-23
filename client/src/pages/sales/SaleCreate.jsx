import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";

const inputClass =
  "w-full rounded-md border border-slate-350 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

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

  // Inline Customer Create State
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

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

  const handleAddCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;

    const res = await apiFetch("/api/customers", {
      method: "POST",
      body: JSON.stringify({
        shop_id: shopId,
        name: newCustomerName,
        phone: newCustomerPhone,
      }),
    });

    if (res.ok) {
      const body = await res.json();
      const created = body.customer;
      setCustomers([...customers, created]);
      setSelectedCustomerId(created.id);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setShowAddCustomer(false);
    } else {
      alert("Failed to create customer");
    }
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
      navigate(`/sales/${body.sale_id}?shop_id=${shopId}`);
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
        <h2 className="text-2xl font-bold text-slate-900">POS Cash Register</h2>
        <button
          onClick={() => navigate(`/sales?shop_id=${shopId}`)}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-800">
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
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3"></div>
              <p className="text-sm text-slate-500 font-medium">
                Fetching product catalog...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((p) => {
                const inCart = cart.find((item) => item.product_id === p.id);
                const currentAvailable = p.quantity - (inCart?.quantity || 0);

                return (
                  <div
                    key={p.id}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between hover:shadow transition-shadow"
                  >
                    <div>
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt=""
                          className="h-24 w-full rounded object-cover mb-2"
                        />
                      ) : (
                        <div className="flex h-24 w-full items-center justify-center rounded bg-slate-100 text-xs text-slate-400 mb-2">
                          No Image
                        </div>
                      )}
                      <h4 className="font-semibold text-slate-900 line-clamp-1">
                        {p.name}
                      </h4>
                      <p className="text-xs text-slate-500 mb-1">
                        Product Code: {p.product_code || p.sku || "—"}
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        Rs. {Number(p.price).toFixed(2)}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          currentAvailable <= 0
                            ? "text-red-600"
                            : currentAvailable <= (p.low_stock_threshold || 5)
                              ? "text-amber-600"
                              : "text-slate-600"
                        }`}
                      >
                        Stock: {currentAvailable}
                      </span>
                      <button
                        type="button"
                        onClick={() => addToCart(p)}
                        disabled={currentAvailable <= 0}
                        className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                );
              })}
              {products.length === 0 && (
                <div className="col-span-full py-8 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
                  No products found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart & Customer Panel */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {/* Customer Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-700">
                Customer
              </label>
              <button
                type="button"
                onClick={() => setShowAddCustomer(!showAddCustomer)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                {showAddCustomer ? "Select Existing" : "+ Add Customer"}
              </button>
            </div>

            {showAddCustomer ? (
              <form
                onSubmit={handleAddCustomerSubmit}
                className="space-y-2 border border-slate-200 rounded p-3 bg-slate-50"
              >
                <input
                  placeholder="Customer Name"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  required
                  className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                />
                <input
                  placeholder="Phone"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="w-full rounded bg-emerald-600 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  Save Customer
                </button>
              </form>
            ) : (
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
            )}
          </div>

          {/* Cart Items */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              Cart Items
            </h3>
            <div className="divide-y divide-slate-100 max-h-64 overflow-auto">
              {cart.map((item) => (
                <div
                  key={item.product_id}
                  className="py-3 flex items-start justify-between gap-2"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Rs. {item.unit_price.toFixed(2)} x {item.quantity}
                    </p>
                    <p className="text-xs text-slate-500">
                      Cost: Rs. {(item.purchase_price ?? 0).toFixed(2)} |
                      Profit: Rs.{" "}
                      {(
                        (item.unit_price - (item.purchase_price ?? 0)) *
                        item.quantity
                      ).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        updateCartQty(item.product_id, item.quantity - 1)
                      }
                      className="h-6 w-6 flex items-center justify-center rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold"
                    >
                      -
                    </button>
                    <span className="text-sm font-medium w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateCartQty(item.product_id, item.quantity + 1)
                      }
                      className="h-6 w-6 flex items-center justify-center rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product_id)}
                      className="ml-2 text-xs text-red-650 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Cart is empty
                </p>
              )}
            </div>
          </div>

          {/* Totals & Actions */}
          <div className="border-t border-slate-200 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Total</span>
              <span className="text-xl font-bold text-slate-900">
                Rs. {cartTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Estimated Profit
              </span>
              <span className="text-lg font-semibold text-emerald-700">
                Rs. {cartProfit.toFixed(2)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={cart.length === 0 || submitting}
              className="w-full rounded-md bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Processing..." : "Finalize checkout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
