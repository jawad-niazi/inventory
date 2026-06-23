import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";

export default function PurchaseDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shop_id") || "";
  const navigate = useNavigate();

  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await apiFetch(`/api/purchases/${id}`);
      if (res.ok) {
        const body = await res.json();
        setPurchase(body.purchase);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <div className="p-6 text-slate-600">Loading details...</div>;
  if (!purchase) return <div className="p-6 text-red-650">Purchase order not found.</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Purchase Order Details</h2>
        <button
          onClick={() => navigate(`/purchases?shop_id=${shopId}`)}
          className="rounded-md border border-slate-350 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Back to Purchases
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Purchase Overview</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-slate-500 font-medium">Order ID:</span>{" "}
              <span className="text-slate-900 font-mono">{purchase.id}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Order Date:</span>{" "}
              <span className="text-slate-900">
                {new Date(purchase.created_at).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Status:</span>{" "}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                  purchase.status === "received"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {purchase.status || "received"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Supplier Vendor</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-slate-500 font-medium">Company Name:</span>{" "}
              <span className="text-slate-900 font-medium">
                {purchase.suppliers?.company_name || "Direct Supplier"}
              </span>
            </div>
            {purchase.suppliers?.phone && (
              <div>
                <span className="text-slate-500 font-medium">Phone:</span>{" "}
                <span className="text-slate-900">{purchase.suppliers.phone}</span>
              </div>
            )}
            {purchase.suppliers?.address && (
              <div>
                <span className="text-slate-500 font-medium">Address:</span>{" "}
                <span className="text-slate-900">{purchase.suppliers.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Item Breakdown</h3>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-slate-700">Product</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-700">Unit Cost</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-700">Qty</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-700">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(purchase.purchase_items || []).map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-slate-900 font-medium">{item.products?.name || "Product Item"}</td>
                <td className="px-4 py-3 text-right text-slate-600">Rs. {Number(item.unit_cost).toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-slate-600">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-slate-900 font-semibold font-mono">Rs. {Number(item.subtotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="px-4 py-4 text-right font-bold text-slate-700 text-base">Order Total</td>
              <td className="px-4 py-4 text-right font-bold text-slate-900 text-lg font-mono">Rs. {Number(purchase.total_amount).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
