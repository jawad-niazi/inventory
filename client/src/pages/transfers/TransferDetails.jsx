import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch } from "../../utils/api";

export default function TransferDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const activeShopId = searchParams.get("shop_id") || "";
  const navigate = useNavigate();
  const { role, shopId: userShopId } = useAuth();

  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch(`/api/transfers/${id}`);
    if (res.ok) {
      const body = await res.json();
      setTransfer(body.transfer);
    } else {
      setError("Failed to retrieve stock transfer details");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = async (targetStatus) => {
    setSubmitting(true);
    setError(null);

    const res = await apiFetch(`/api/transfers/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: targetStatus }),
    });

    if (res.ok) {
      await load();
    } else {
      const body = await res.json();
      setError(body.error || "Failed to update transfer status");
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-6 text-slate-600">Loading details...</div>;
  if (error && !transfer) return <div className="p-6 text-red-655 font-semibold">{error}</div>;
  if (!transfer) return <div className="p-6 text-red-655">Transfer not found.</div>;

  const isOutgoingFromActive = transfer.from_shop_id === userShopId;
  const isIncomingToActive = transfer.to_shop_id === userShopId;
  const isSuperAdmin = role === "super_admin";

  const allowShip = (isSuperAdmin || isOutgoingFromActive) && transfer.status === "pending";
  const allowReceive = (isSuperAdmin || isIncomingToActive) && (transfer.status === "pending" || transfer.status === "shipped");

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Transfer Invoice & Log</h2>
        <button
          onClick={() => navigate(`/transfers?shop_id=${activeShopId}`)}
          className="rounded-md border border-slate-350 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Back to Transfers
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Log Details</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-slate-500 font-medium">Transfer ID:</span>{" "}
              <span className="text-slate-900 font-mono text-xs select-all">{transfer.id}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Date & Time:</span>{" "}
              <span className="text-slate-900">
                {new Date(transfer.created_at).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Current Status:</span>{" "}
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                  transfer.status === "received"
                    ? "bg-emerald-100 text-emerald-800"
                    : transfer.status === "shipped"
                    ? "bg-blue-100 text-blue-800"
                    : transfer.status === "cancelled"
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {transfer.status}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Transit Manifest</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-slate-500 font-medium">Dispatch Origin:</span>{" "}
              <span className="text-slate-900 font-semibold">{transfer.from_shop?.name}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Destination:</span>{" "}
              <span className="text-slate-900 font-semibold">{transfer.to_shop?.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Transfer Manifest Items</h3>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-slate-700">Product</th>
              <th className="px-4 py-2 text-left font-semibold text-slate-700 w-36">SKU</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-700 w-32">Qty Dispatched</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(transfer.stock_transfer_items || []).map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-slate-900 font-medium">{item.products?.name || "Product Item"}</td>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{item.products?.sku || "—"}</td>
                <td className="px-4 py-3 text-right text-slate-900 font-bold font-mono">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(allowShip || allowReceive) && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900">Manage Dispatch & intake</h3>
          <p className="text-sm text-slate-500">
            Click the appropriate button below to progress this transfer sheet along the supply pipeline.
          </p>
          <div className="flex flex-wrap gap-3">
            {allowShip && (
              <button
                onClick={() => updateStatus("shipped")}
                disabled={submitting}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Mark as Shipped (Deducts Stock from Origin)
              </button>
            )}
            {allowReceive && (
              <button
                onClick={() => updateStatus("received")}
                disabled={submitting}
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                Mark as Received (Adds Stock to Destination)
              </button>
            )}
            {transfer.status !== "received" && transfer.status !== "cancelled" && (
              <button
                onClick={() => updateStatus("cancelled")}
                disabled={submitting}
                className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Cancel Transfer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
