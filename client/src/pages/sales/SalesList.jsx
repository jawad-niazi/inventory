import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ShopSelector from "../../components/common/ShopSelector";
import { apiFetch } from "../../utils/api";

export default function SalesList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shopId, setShopId] = useState(searchParams.get("shop_id") || "");
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const load = async () => {
    if (!shopId) return;
    setLoading(true);
    const res = await apiFetch(`/api/sales?shop_id=${shopId}`);
    if (res.ok) {
      const body = await res.json();
      setSales(body.sales || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [shopId]);

  useEffect(() => {
    if (shopId) setSearchParams({ shop_id: shopId });
  }, [shopId, setSearchParams]);

  const filtered = sales.filter((s) => {
    const matchCust = (s.customers?.name || "Walk-in")
      .toLowerCase()
      .includes(filterCustomer.toLowerCase());
    const matchStatus = filterStatus ? s.status === filterStatus : true;
    return matchCust && matchStatus;
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Sales</h2>
        {shopId && (
          <Link
            to={`/sales/new?shop_id=${shopId}`}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            New Sale (POS)
          </Link>
        )}
      </div>

      <ShopSelector value={shopId} onChange={setShopId} />

      {shopId && (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            <input
              placeholder="Search by customer"
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              className="rounded-md border border-slate-350 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full max-w-xs"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border border-slate-350 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {loading ? (
            <p className="text-slate-650">Loading...</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Created By
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Total
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
                  {filtered.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(s.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {s.customers?.name || "Walk-in Customer"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {s.app_users?.email || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-900">
                        Rs. {Number(s.total).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            s.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : s.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          to={`/sales/${s.id}?shop_id=${shopId}`}
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
                        No sales found.
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
