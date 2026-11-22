import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ShopSelector from "../../components/common/ShopSelector";
import { apiFetch } from "../../utils/api";
import { Search, Printer, FileText } from "lucide-react";

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
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Invoices</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"}
          </span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <ShopSelector value={shopId} onChange={setShopId} />

        {shopId && (
          <div className="relative flex-1 max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              placeholder="Search by invoice number (e.g. INV-)..."
              value={filterInvoiceNum}
              onChange={(e) => setFilterInvoiceNum(e.target.value)}
              className="block w-full rounded-full border-0 py-2.5 pl-10 pr-4 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-neon bg-white shadow-sm"
            />
          </div>
        )}
      </div>

      {shopId && (
        <>
          {loading ? (
            <p className="text-slate-500 font-medium ml-2">Loading invoices...</p>
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
                        Invoice Number
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Sale Reference ID
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Total
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Status
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-50/80 transition-colors duration-200 group"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">
                          {new Date(inv.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 font-mono">
                          {inv.invoice_number}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400 font-mono text-xs">
                          {inv.sale_id ? (
                            <Link
                              to={`/sales/${inv.sale_id}?shop_id=${shopId}`}
                              className="hover:underline hover:text-slate-700"
                            >
                              {inv.sale_id.slice(0, 8)}...
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                          Rs.{" "}
                          {Number(
                            inv.sales?.total_amount ?? inv.sales?.total ?? 0,
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                              inv.status === "paid"
                                ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                                : inv.status === "cancelled"
                                  ? "bg-red-50 text-red-600 ring-1 ring-red-100"
                                  : "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/invoices/${inv.id}?shop_id=${shopId}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            View & Print
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
                          No invoices found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="border-t border-slate-100 bg-white px-6 py-4 flex items-center justify-between text-sm text-slate-500">
                <p className="font-medium">
                  Showing <span className="font-bold text-slate-900">{filtered.length}</span> of{" "}
                  <span className="font-bold text-slate-900">{invoices.length}</span>{" "}
                  {invoices.length === 1 ? "invoice" : "invoices"}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
