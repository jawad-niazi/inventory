import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";

export default function QuotationDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shop_id") || "";
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState(null);

  const loadQuotation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/quotations/${id}?shop_id=${shopId}`);
      if (res.ok) {
        const body = await res.json();
        setQuotation(body.quotation);
      } else {
        const body = await res.json();
        setError(body.error || "Failed to load quotation details");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadQuotation();
  }, [id, shopId]);

  const handleConvertToSale = async () => {
    if (
      !confirm(
        "Are you sure you want to convert this quotation into a finalized sale/invoice? This will create a sale record without adjusting inventory stock.",
      )
    )
      return;
    setConverting(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/quotations/${id}/convert`, {
        method: "POST",
      });
      const body = await res.json();
      if (res.ok) {
        alert("Quotation converted to sale successfully!");
        navigate(`/sales/${body.sale_id}?shop_id=${shopId}`);
      } else {
        setError(body.error || "Failed to convert quotation to sale");
      }
    } catch {
      setError("Network error converting quotation.");
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (error && !quotation) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
        <p className="font-semibold">{error}</p>
        <button
          onClick={() => navigate(`/quotations?shop_id=${shopId}`)}
          className="mt-2 text-xs text-red-600 underline font-medium"
        >
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 font-mono">
              {quotation.quote_number}
            </h2>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                quotation.status === "draft"
                  ? "bg-slate-100 text-slate-700"
                  : quotation.status === "sent"
                    ? "bg-blue-100 text-blue-700"
                    : quotation.status === "accepted"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
              }`}
            >
              {quotation.status}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Created on {new Date(quotation.created_at).toLocaleString("en-PK")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/quotations?shop_id=${shopId}`)}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Back to List
          </button>

          {["draft", "sent"].includes(quotation.status) && (
            <button
              onClick={handleConvertToSale}
              disabled={converting}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {converting ? "Converting..." : "Convert to Invoice"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Meta Info card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Customer Name
          </span>
          <span className="mt-1 block text-base font-semibold text-slate-900">
            {quotation.customer_name || "Walk-in Customer"}
          </span>
        </div>
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Valid Until
          </span>
          <span className="mt-1 block text-base font-medium text-slate-900">
            {quotation.valid_until
              ? new Date(quotation.valid_until).toLocaleDateString("en-PK")
              : "No expiry date"}
          </span>
        </div>
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Estimated Total
          </span>
          <span className="mt-1 block text-lg font-bold text-emerald-600 font-mono">
            Rs. {Number(quotation.total || 0).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Items Table card */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Items List</h3>
        </div>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-slate-600">
                Product Name / Description
              </th>
              <th className="px-6 py-3 text-left font-semibold text-slate-600">
                Product Code
              </th>
              <th className="px-6 py-3 text-left font-semibold text-slate-600">
                Model
              </th>
              <th className="px-6 py-3 text-right font-semibold text-slate-600">
                Unit Price
              </th>
              <th className="px-6 py-3 text-right font-semibold text-slate-600">
                Qty
              </th>
              <th className="px-6 py-3 text-right font-semibold text-slate-600">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {(quotation.quotation_items || []).map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-900">
                    {item.description}
                  </p>
                </td>
                <td className="px-6 py-4 text-slate-600 font-mono">
                  {item.products?.sku || "—"}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {item.products?.model_name || "—"}
                </td>
                <td className="px-6 py-4 text-right text-slate-900 font-mono">
                  Rs. {Number(item.unit_price).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right text-slate-600 font-mono">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 text-right font-semibold text-slate-900 font-mono">
                  Rs. {Number(item.subtotal).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-semibold text-slate-900">
              <td colSpan="5" className="px-6 py-4 text-right">
                Grand Total
              </td>
              <td className="px-6 py-4 text-right font-bold text-emerald-600 font-mono text-base">
                Rs. {Number(quotation.total || 0).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Notes / Remarks */}
      {quotation.notes && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Notes / Terms
          </h4>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">
            {quotation.notes}
          </p>
        </div>
      )}
    </div>
  );
}
