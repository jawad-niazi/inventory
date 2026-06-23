import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ShopSelector from "../../components/common/ShopSelector";
import { apiFetch } from "../../utils/api";

export default function Invoices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shopId, setShopId] = useState(searchParams.get("shop_id") || "");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterInvoiceNum, setFilterInvoiceNum] = useState("");

  const load = async () => {
    if (!shopId) return;
    setLoading(true);
    const res = await apiFetch(`/api/invoices?shop_id=${shopId}`);
    if (res.ok) {
      const body = await res.json();
      setInvoices(body.invoices || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [shopId]);

  useEffect(() => {
    if (shopId) setSearchParams({ shop_id: shopId });
  }, [shopId, setSearchParams]);

  const filtered = invoices.filter((inv) =>
    inv.invoice_number.toLowerCase().includes(filterInvoiceNum.toLowerCase()),
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Invoices</h2>

      <ShopSelector value={shopId} onChange={setShopId} />

      {shopId && (
        <>
          <div className="mb-4">
            <input
              placeholder="Search by invoice number (e.g. INV-)..."
              value={filterInvoiceNum}
              onChange={(e) => setFilterInvoiceNum(e.target.value)}
              className="rounded-md border border-slate-350 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full max-w-md"
            />
          </div>

          {loading ? (
            <p className="text-slate-650">Loading invoices...</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Invoice Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Sale Reference ID
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
                  {filtered.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(inv.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-900 font-mono">
                        {inv.invoice_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 font-mono text-xs">
                        {inv.sale_id || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-900">
                        Rs.{" "}
                        {Number(
                          inv.sales?.total_amount ?? inv.sales?.total ?? 0,
                        ).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            inv.status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : inv.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          to={`/invoices/${inv.id}?shop_id=${shopId}`}
                          className="text-emerald-600 hover:text-emerald-700 font-semibold"
                        >
                          View & Print
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
                        No invoices found.
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
