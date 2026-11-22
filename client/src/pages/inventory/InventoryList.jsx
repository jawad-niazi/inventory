import React, { useEffect, useState } from "react";
import ShopSelector from "../../components/common/ShopSelector";
import CustomSelect from "../../components/common/CustomSelect";
import { apiFetch } from "../../utils/api";
import { AlertCircle, Sliders, History, Package, ArrowUpRight } from "lucide-react";

const inputClass =
  "w-full rounded-2xl border-0 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-neon focus:bg-white transition-all shadow-sm";

export default function InventoryList() {
  const [shopId, setShopId] = useState("");
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("stock");

  const [adjustForm, setAdjustForm] = useState({
    product_id: "",
    quantity_change: "",
    reason: "",
  });

  const loadAll = async () => {
    if (!shopId) return;
    setLoading(true);
    const [invRes, alertRes, histRes] = await Promise.all([
      apiFetch(`/api/inventory?shop_id=${shopId}`),
      apiFetch(`/api/inventory/low-stock?shop_id=${shopId}`),
      apiFetch(`/api/inventory/history?shop_id=${shopId}`),
    ]);
    if (invRes.ok) {
      const body = await invRes.json();
      setInventory(body.inventory || []);
    }
    if (alertRes.ok) {
      const body = await alertRes.json();
      setAlerts(body.alerts || []);
    }
    if (histRes.ok) {
      const body = await histRes.json();
      setHistory(body.history || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [shopId]);

  const handleAdjust = async (e) => {
    e.preventDefault();
    const res = await apiFetch("/api/inventory/adjust", {
      method: "POST",
      body: JSON.stringify({
        shop_id: shopId,
        product_id: adjustForm.product_id,
        quantity_change: parseInt(adjustForm.quantity_change, 10),
        reason: adjustForm.reason || null,
      }),
    });
    if (res.ok) {
      setAdjustForm({ product_id: "", quantity_change: "", reason: "" });
      loadAll();
      setTab("history");
    } else {
      const err = await res.json();
      alert(err.error || "Adjustment failed");
    }
  };

  const tabs = [
    { id: "stock", label: "Current Stock", count: inventory.length },
    { id: "adjust", label: "Adjust Stock" },
    { id: "alerts", label: "Low Stock Alerts", count: alerts.length },
    { id: "history", label: "History", count: history.length },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {inventory.length} {inventory.length === 1 ? "item" : "items"}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <ShopSelector value={shopId} onChange={setShopId} />
      </div>

      {shopId && (
        <>
          {/* Pill-shaped Tabs */}
          <div className="mb-6 flex flex-wrap gap-2.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                {...(t.id === "adjust" ? { "data-tour": "adjust-stock-tab" } : {})}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-200 ${
                  tab === t.id
                    ? "bg-brand-neon text-slate-900 shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-50 ring-1 ring-inset ring-slate-200 shadow-sm"
                }`}
              >
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
                      tab === t.id
                        ? "bg-slate-900/10 text-slate-900"
                        : t.id === "alerts" && t.count > 0
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-slate-500 font-medium ml-2">Loading inventory data...</p>
          ) : (
            <>
              {/* Tab 1: Current Stock */}
              {tab === "stock" && (
                <div className="rounded-4xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="border-b border-slate-100 bg-white">
                        <tr>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                            Product
                          </th>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                            SKU
                          </th>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                            Quantity
                          </th>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                            Threshold
                          </th>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {inventory.map((row) => {
                          const p = row.products;
                          const low =
                            (p?.low_stock_threshold ?? 0) > 0 &&
                            row.quantity <= p.low_stock_threshold;
                          return (
                            <tr
                              key={row.id}
                              className="hover:bg-slate-50/80 transition-colors duration-200 group"
                            >
                              <td className="px-6 py-4">
                                <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                                  {p?.name || "—"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-500">
                                {p?.sku || "—"}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-slate-900">
                                {row.quantity}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-500">
                                {p?.low_stock_threshold ?? 0}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span
                                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                                    low
                                      ? "bg-red-50 text-red-600 ring-1 ring-red-100"
                                      : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                                  }`}
                                >
                                  {low ? "Low Stock" : "In Stock"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {inventory.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-6 py-12 text-center text-sm font-medium text-slate-400"
                            >
                              No inventory records. Add products first.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer */}
                  <div className="border-t border-slate-100 bg-white px-6 py-4 flex items-center justify-between text-sm text-slate-500">
                    <p className="font-medium">
                      Total <span className="font-bold text-slate-900">{inventory.length}</span>{" "}
                      {inventory.length === 1 ? "product" : "products"} in stock
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Adjust Stock */}
              {tab === "adjust" && (
                <div className="rounded-4xl bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] max-w-xl">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-emerald-600" />
                    Manual Stock Adjustment
                  </h3>
                  <form onSubmit={handleAdjust} className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Select Product
                      </label>
                      <CustomSelect
                        value={adjustForm.product_id}
                        onChange={(e) =>
                          setAdjustForm({
                            ...adjustForm,
                            product_id: e.target.value,
                          })
                        }
                        required
                        className={inputClass}
                        placeholder="Choose a product..."
                      >
                        <option value="">Choose a product...</option>
                        {inventory.map((row) => (
                          <option key={row.product_id} value={row.product_id}>
                            {row.products?.name} (Current: {row.quantity})
                          </option>
                        ))}
                      </CustomSelect>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Quantity Change (+ to add, - to remove)
                      </label>
                      <input
                        type="number"
                        value={adjustForm.quantity_change}
                        onChange={(e) =>
                          setAdjustForm({
                            ...adjustForm,
                            quantity_change: e.target.value,
                          })
                        }
                        required
                        className={inputClass}
                        placeholder="e.g. 10 or -5"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Reason
                      </label>
                      <input
                        value={adjustForm.reason}
                        onChange={(e) =>
                          setAdjustForm({ ...adjustForm, reason: e.target.value })
                        }
                        className={inputClass}
                        placeholder="Restock, damage, inventory audit..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 rounded-full bg-brand-neon px-6 py-3.5 text-sm font-bold text-slate-900 shadow-sm hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(206,243,109,0.4)] transition-all duration-200 mt-2"
                    >
                      Apply Stock Adjustment
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 3: Low Stock Alerts */}
              {tab === "alerts" && (
                <div className="rounded-4xl bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                  <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Low Stock Alerts
                  </h3>
                  {alerts.length === 0 ? (
                    <div className="py-12 text-center text-sm font-medium text-slate-400">
                      All products are currently above their low stock thresholds.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {alerts.map((row) => (
                        <div
                          key={row.id}
                          className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50/60 p-5 shadow-sm"
                        >
                          <div>
                            <p className="font-bold text-sm text-slate-900">
                              {row.products?.name}
                            </p>
                            <p className="text-xs font-medium text-red-600 mt-1">
                              {row.quantity} in stock — threshold is{" "}
                              {row.products?.low_stock_threshold}
                            </p>
                          </div>
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                            Low Stock
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: History */}
              {tab === "history" && (
                <div className="rounded-4xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="border-b border-slate-100 bg-white">
                        <tr>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                            Date
                          </th>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                            Product
                          </th>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                            Supplier
                          </th>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                            Change
                          </th>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                            Reason
                          </th>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">
                            Adjusted By
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {history.map((h) => (
                          <tr
                            key={h.id}
                            className="hover:bg-slate-50/80 transition-colors duration-200 group"
                          >
                            <td className="px-6 py-4 text-sm font-medium text-slate-600">
                              {new Date(h.created_at).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-900">
                              {h.products?.name || "—"}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-600">
                              {h.purchase_supplier_company || "—"}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold font-mono ${
                                  h.quantity_change >= 0
                                    ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                                    : "bg-red-50 text-red-600 ring-1 ring-red-100"
                                }`}
                              >
                                {h.quantity_change >= 0 ? "+" : ""}
                                {h.quantity_change}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-600">
                              {h.reason || "—"}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500 font-mono text-xs text-right">
                              {h.app_users?.email || "—"}
                            </td>
                          </tr>
                        ))}
                        {history.length === 0 && (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-6 py-12 text-center text-sm font-medium text-slate-400"
                            >
                              No adjustment history recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer */}
                  <div className="border-t border-slate-100 bg-white px-6 py-4 flex items-center justify-between text-sm text-slate-500">
                    <p className="font-medium">
                      Total <span className="font-bold text-slate-900">{history.length}</span>{" "}
                      history {history.length === 1 ? "record" : "records"}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
