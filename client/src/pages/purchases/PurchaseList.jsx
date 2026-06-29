import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ShopSelector from "../../components/common/ShopSelector";
import { apiFetch } from "../../utils/api";
import { Plus, Search, ExternalLink } from "lucide-react";

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
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Procurement (Purchases)
          </h2>
        </div>
        {shopId && (
          <Link
            to={`/purchases/new?shop_id=${shopId}`}
            className="flex items-center gap-2 rounded-full bg-brand-neon px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(206,243,109,0.4)] transition-all duration-200"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            Create Purchase Order
          </Link>
        )}
      </div>

      <div className="mb-6">
        <ShopSelector value={shopId} onChange={(id) => { setShopId(id); }} />
      </div>

      {shopId && (
        <>
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                placeholder="Search by supplier..."
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="w-full rounded-full border-0 bg-white px-10 py-2.5 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-neon transition-all shadow-sm"
              />
            </div>
          </div>

          {loading ? (
            <p className="text-slate-500 font-medium py-4">Loading purchase orders...</p>
          ) : (
            <div className="rounded-4xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="border-b border-slate-100 bg-white">
                    <tr>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Date
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Supplier
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Created By
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">
                        Total Cost
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Status
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors duration-200 group">
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">
                          {new Date(p.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                          {p.suppliers?.company_name || "Direct Supplier"}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">
                          {p.app_users?.email || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 font-mono text-right">
                          Rs. {Number(p.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                              p.status === "received"
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50"
                                : "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50"
                            }`}
                          >
                            {p.status || "received"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/purchases/${p.id}?shop_id=${shopId}`}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-sm font-medium text-slate-400"
                        >
                          No purchase orders found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
