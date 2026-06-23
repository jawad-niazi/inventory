import React, { useEffect, useState } from "react";
import ShopSelector from "../../components/common/ShopSelector";
import { apiFetch } from "../../utils/api";

const inputClass =
  "rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

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
    { id: "stock", label: "Current Stock" },
    { id: "adjust", label: "Adjust Stock" },
    { id: "alerts", label: `Low Stock (${alerts.length})` },
    { id: "history", label: "History" },
  ];

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Inventory</h2>
      <ShopSelector value={shopId} onChange={setShopId} />

      {shopId && (
        <>
          <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-200">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm font-medium ${
                  tab === t.id
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : (
            <>
              {tab === "stock" && (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          SKU
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Threshold
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {inventory.map((row) => {
                        const p = row.products;
                        const low =
                          (p?.low_stock_threshold ?? 0) > 0 &&
                          row.quantity <= p.low_stock_threshold;
                        return (
                          <tr key={row.id}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {p?.name || "—"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {p?.sku || "—"}
                            </td>
                            <td
                              className={`px-4 py-3 text-sm font-medium ${low ? "text-red-600" : "text-gray-900"}`}
                            >
                              {row.quantity}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {p?.low_stock_threshold ?? 0}
                            </td>
                          </tr>
                        );
                      })}
                      {inventory.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-8 text-center text-sm text-gray-500"
                          >
                            No inventory records. Add products first.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === "adjust" && (
                <form
                  onSubmit={handleAdjust}
                  className="max-w-md space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Product
                    </label>
                    <select
                      value={adjustForm.product_id}
                      onChange={(e) =>
                        setAdjustForm({
                          ...adjustForm,
                          product_id: e.target.value,
                        })
                      }
                      required
                      className={`${inputClass} w-full`}
                    >
                      <option value="">Select product</option>
                      {inventory.map((row) => (
                        <option key={row.product_id} value={row.product_id}>
                          {row.products?.name} (current: {row.quantity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Quantity change (+ add / − remove)
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
                      className={`${inputClass} w-full`}
                      placeholder="e.g. 10 or -5"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Reason
                    </label>
                    <input
                      value={adjustForm.reason}
                      onChange={(e) =>
                        setAdjustForm({ ...adjustForm, reason: e.target.value })
                      }
                      className={`${inputClass} w-full`}
                      placeholder="Restock, damage, correction..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Apply Adjustment
                  </button>
                </form>
              )}

              {tab === "alerts" && (
                <div className="space-y-3">
                  {alerts.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No low stock alerts.
                    </p>
                  ) : (
                    alerts.map((row) => (
                      <div
                        key={row.id}
                        className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-red-900">
                            {row.products?.name}
                          </p>
                          <p className="text-sm text-red-700">
                            {row.quantity} in stock — threshold{" "}
                            {row.products?.low_stock_threshold}
                          </p>
                        </div>
                        <span className="rounded-full bg-red-200 px-2 py-1 text-xs font-medium text-red-800">
                          Low
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === "history" && (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Supplier
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Change
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Reason
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          By
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {history.map((h) => (
                        <tr key={h.id}>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(h.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {h.products?.name || "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {h.purchase_supplier_company || "—"}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm font-medium ${h.quantity_change >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {h.quantity_change >= 0 ? "+" : ""}
                            {h.quantity_change}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {h.reason || "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {h.app_users?.email || "—"}
                          </td>
                        </tr>
                      ))}
                      {history.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-8 text-center text-sm text-gray-500"
                          >
                            No adjustment history yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
