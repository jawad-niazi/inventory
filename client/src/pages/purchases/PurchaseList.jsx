import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ShopSelector from "../../components/common/ShopSelector";
import { apiFetch } from "../../utils/api";

export default function PurchaseList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shopId, setShopId] = useState(searchParams.get("shop_id") || "");
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterSupplier, setFilterSupplier] = useState("");

  const load = async () => {
    if (!shopId) return;
    setLoading(true);
    const res = await apiFetch(`/api/purchases?shop_id=${shopId}`);
    if (res.ok) {
      const body = await res.json();
      setPurchases(body.purchases || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [shopId]);

  useEffect(() => {
    if (shopId) setSearchParams({ shop_id: shopId });
  }, [shopId, setSearchParams]);

  const filtered = purchases.filter((p) =>
    (p.suppliers?.company_name || "Direct Supplier")
      .toLowerCase()
      .includes(filterSupplier.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">
          Procurement (Purchases)
        </h2>
        {shopId && (
          <Link
            to={`/purchases/new?shop_id=${shopId}`}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            Create Purchase Order
          </Link>
        )}
      </div>

      <ShopSelector value={shopId} onChange={setShopId} />

      {shopId && (
        <>
          <div className="mb-4">
            <input
              placeholder="Search by supplier..."
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="rounded-md border border-slate-350 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full max-w-md"
            />
          </div>

          {loading ? (
            <p className="text-slate-600">Loading...</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Supplier
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Created By
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Total Cost
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(p.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {p.suppliers?.company_name || "Direct Supplier"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {p.app_users?.email || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-900">
                        Rs. {Number(p.total_amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              p.status === "received"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {p.status || "received"}
                          </span>
                          {/* Auto-received on creation; manual receive button removed */}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          to={`/purchases/${p.id}?shop_id=${shopId}`}
                          className="text-emerald-600 hover:text-emerald-700 font-semibold"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-sm text-slate-500"
                      >
                        No purchase orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
