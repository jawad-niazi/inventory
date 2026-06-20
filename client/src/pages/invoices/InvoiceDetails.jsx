import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";

export default function InvoiceDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shop_id") || "";
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch(`/api/invoices/${id}`);
    if (res.ok) {
      const body = await res.json();
      setInvoice(body.invoice);
    } else {
      setError("Failed to retrieve invoice details");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleUpdateStatus = async (status) => {
    setSubmitting(true);
    const res = await apiFetch(`/api/invoices/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await load();
    } else {
      alert("Failed to update invoice status");
    }
    setSubmitting(false);
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    try {
      const res = await apiFetch(`/api/invoices/${id}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${invoice.invoice_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to generate PDF invoice");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while exporting PDF invoice");
    }
  };

  if (loading) return <div className="p-6 text-slate-655">Loading details...</div>;
  if (error && !invoice) return <div className="p-6 text-red-655 font-semibold">{error}</div>;
  if (!invoice) return <div className="p-6 text-red-655">Invoice not found.</div>;

  const sale = invoice.sales;
  const items = sale?.sale_items || invoice.invoice_items || [];
  const total = sale ? sale.total : items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Invoice Details</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownloadPDF}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            Download PDF
          </button>
          <button
            onClick={() => navigate(`/invoices?shop_id=${shopId}`)}
            className="rounded-md border border-slate-350 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Back to Invoices
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm space-y-8">
        {/* Invoice Header */}
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Invoice Statement</h3>
            <p className="text-sm font-mono text-emerald-600 font-bold">{invoice.invoice_number}</p>
          </div>
          <div className="text-right">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                invoice.status === "paid"
                  ? "bg-emerald-100 text-emerald-800"
                  : invoice.status === "cancelled"
                  ? "bg-red-100 text-red-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Invoice Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm border-t border-b border-slate-100 py-6">
          <div>
            <p className="font-semibold text-slate-700 uppercase tracking-wide text-xs mb-2">Billed To</p>
            <p className="font-semibold text-slate-900">{sale?.customers?.name || "Walk-in Customer"}</p>
            {sale?.customers?.phone && <p className="text-slate-600">Phone: {sale.customers.phone}</p>}
            {sale?.customers?.email && <p className="text-slate-600">Email: {sale.customers.email}</p>}
          </div>
          <div className="sm:text-right">
            <p className="font-semibold text-slate-700 uppercase tracking-wide text-xs mb-2">Payment Details</p>
            <p className="text-slate-600">Date Issued: {new Date(invoice.created_at).toLocaleDateString()}</p>
            <p className="text-slate-600 font-semibold mt-1">Total Amount: ${Number(total).toFixed(2)}</p>
          </div>
        </div>

        {/* Invoice Table Items */}
        <div className="space-y-4">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-slate-700">Product / Item</th>
                <th className="px-4 py-2 text-right font-semibold text-slate-700 w-28">Price</th>
                <th className="px-4 py-2 text-right font-semibold text-slate-700 w-20">Qty</th>
                <th className="px-4 py-2 text-right font-semibold text-slate-700 w-28">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-slate-900 font-medium">{item.products?.name || item.description || "Product Item"}</td>
                  <td className="px-4 py-3 text-right text-slate-600">${Number(item.unit_price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-slate-900 font-semibold font-mono">${Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="px-4 py-4 text-right font-bold text-slate-700 text-base">Grand Total</td>
                <td className="px-4 py-4 text-right font-bold text-slate-900 text-lg font-mono">${Number(total).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Invoice Actions */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-slate-900">Update Invoice Billing Status</h3>
        <div className="flex flex-wrap gap-2">
          {["draft", "sent", "paid", "cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => handleUpdateStatus(st)}
              disabled={invoice.status === st || submitting}
              className={`rounded-md px-4 py-2 text-xs font-semibold uppercase transition-colors ${
                invoice.status === st
                  ? "bg-slate-800 text-white cursor-default"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
