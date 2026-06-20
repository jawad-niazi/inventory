import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";

export default function SaleDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shop_id") || "";
  const navigate = useNavigate();

  const [sale, setSale] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await apiFetch(`/api/sales/${id}`);
      if (res.ok) {
        const body = await res.json();
        setSale(body.sale);
      }
      
      // Try fetching the invoice for this sale
      const invsRes = await apiFetch(`/api/invoices?shop_id=${shopId}`);
      if (invsRes.ok) {
        const body = await invsRes.json();
        const linkedInvoice = (body.invoices || []).find((inv) => inv.sale_id === id);
        if (linkedInvoice) {
          setInvoice(linkedInvoice);
        }
      }
      setLoading(false);
    };
    load();
  }, [id, shopId]);

  if (loading) return <div className="p-6 text-slate-600">Loading details...</div>;
  if (!sale) return <div className="p-6 text-red-600">Sale not found.</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Sale Details</h2>
        <div className="flex gap-2">
          {invoice && (
            <Link
              to={`/invoices/${invoice.id}?shop_id=${shopId}`}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              View Invoice
            </Link>
          )}
          <button
            onClick={() => navigate(`/sales?shop_id=${shopId}`)}
            className="rounded-md border border-slate-350 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Back to Sales
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Sale Overview</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-slate-500 font-medium">Transaction ID:</span>{" "}
              <span className="text-slate-900 font-mono">{sale.id}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Date & Time:</span>{" "}
              <span className="text-slate-900">
                {new Date(sale.created_at).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Status:</span>{" "}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                  sale.status === "completed"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {sale.status}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Customer Details</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-slate-500 font-medium">Name:</span>{" "}
              <span className="text-slate-900 font-medium">
                {sale.customers?.name || "Walk-in Customer"}
              </span>
            </div>
            {sale.customers?.phone && (
              <div>
                <span className="text-slate-500 font-medium">Phone:</span>{" "}
                <span className="text-slate-900">{sale.customers.phone}</span>
              </div>
            )}
            {sale.customers?.email && (
              <div>
                <span className="text-slate-500 font-medium">Email:</span>{" "}
                <span className="text-slate-900">{sale.customers.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Items Purchased</h3>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-slate-700">Product</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-700">Price</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-700">Qty</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-700">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(sale.sale_items || []).map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-slate-900 font-medium">{item.products?.name || "Product Item"}</td>
                <td className="px-4 py-3 text-right text-slate-600">${Number(item.unit_price).toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-slate-600">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-slate-900 font-semibold">${Number(item.subtotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="px-4 py-4 text-right font-bold text-slate-700 text-base">Grand Total</td>
              <td className="px-4 py-4 text-right font-bold text-slate-900 text-lg">${Number(sale.total).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
