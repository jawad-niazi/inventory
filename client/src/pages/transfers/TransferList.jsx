import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ShopSelector from "../../components/common/ShopSelector";
import { apiFetch } from "../../utils/api";

export default function TransferList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shopId, setShopId] = useState(searchParams.get("shop_id") || "");
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterDirection, setFilterDirection] = useState("all");

  const load = async () => {
    if (!shopId) return;
    setLoading(true);
    const res = await apiFetch(`/api/transfers?shop_id=${shopId}`);
    if (res.ok) {
      const body = await res.json();
      setTransfers(body.transfers || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [shopId]);

  useEffect(() => {
    if (shopId) setSearchParams({ shop_id: shopId });
  }, [shopId, setSearchParams]);

  const filtered = transfers.filter((t) => {
    if (filterDirection === "outgoing") return t.from_shop_id === shopId;
    if (filterDirection === "incoming") return t.to_shop_id === shopId;
    return true;
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Stock Transfers</h2>
        {shopId && (
          <Link
            to={`/transfers/new?shop_id=${shopId}`}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            New Stock Transfer
          </Link>
        )}
      </div>

      <ShopSelector value={shopId} onChange={setShopId} />

      {shopId && (
        <>
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setFilterDirection("all")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                filterDirection === "all"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Transfers
            </button>
            <button
              onClick={() => setFilterDirection("outgoing")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                filterDirection === "outgoing"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Outgoing (From this Shop)
            </button>
            <button
              onClick={() => setFilterDirection("incoming")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                filterDirection === "incoming"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Incoming (To this Shop)
            </button>
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
                      Direction
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      From Shop
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      To Shop
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
                  {filtered.map((t) => {
                    const isOutgoing = t.from_shop_id === shopId;
                    return (
                      <tr key={t.id}>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {new Date(t.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              isOutgoing
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {isOutgoing ? "Outgoing" : "Incoming"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          {t.from_shop?.name || "Origin Shop"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          {t.to_shop?.name || "Destination Shop"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              t.status === "received"
                                ? "bg-emerald-100 text-emerald-800"
                                : t.status === "shipped"
                                ? "bg-blue-100 text-blue-800"
                                : t.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Link
                            to={`/transfers/${t.id}?shop_id=${shopId}`}
                            className="text-emerald-600 hover:text-emerald-700 font-semibold"
                          >
                            View & Process
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-sm text-slate-500"
                      >
                        No transfers found.
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
