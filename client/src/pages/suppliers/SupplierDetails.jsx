import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";

export default function SupplierDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shop_id") || "";
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    if (!shopId || !id) return;
    const res = await apiFetch(`/api/suppliers/${id}?shop_id=${shopId}`);
    if (res.ok) {
      const body = await res.json();
      setSupplier(body.supplier);
      setLedger(body.ledger || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id, shopId]);

  if (!shopId)
    return (
      <div className="p-6 font-medium text-center text-gray-500">
        Please select a shop first.
      </div>
    );
  if (loading)
    return (
      <div className="p-6 font-medium text-center text-gray-500">
        Loading Ledger History...
      </div>
    );
  if (!supplier)
    return (
      <div className="p-6 font-medium text-center text-red-500">
        Supplier not found.
      </div>
    );

  return (
    <div className="max-w-6xl p-4 mx-auto space-y-6">
      {/* Top Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {supplier.company_name}
          </h2>
          <p className="text-sm text-gray-500">
            Phone: {supplier.phone || "—"} | Address: {supplier.address || "—"}
          </p>
        </div>
        <button
          onClick={() => navigate(`/suppliers?shop_id=${shopId}`)}
          className="px-4 py-2 font-medium transition border rounded-md hover:bg-gray-50"
        >
          Back to List
        </button>
      </div>

      {/* Outstanding Udhaar Liability Banner */}
      <div className="flex items-center justify-between p-6 bg-white border-l-4 border-red-500 rounded-lg shadow-sm">
        <div>
          <span className="block text-sm font-semibold tracking-wider text-gray-500 uppercase">
            Payable Liability Status
          </span>
          <p className="mt-1 text-xs text-gray-400">
            * This shows the total outstanding amount you owe to this supplier.
          </p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-red-600">
            Rs.{" "}
            {Number(supplier.current_balance || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      {/* Ledger History Table with Paid and Due Columns */}
      <div className="p-6 overflow-hidden bg-white border rounded-lg shadow-sm">
        <h3 className="pb-2 mb-4 text-lg font-bold text-gray-700 border-b">
          Ledger & Transaction Statement
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead>
              <tr className="text-xs font-semibold text-gray-600 uppercase border-b bg-gray-50">
                <th className="p-3">Date</th>
                <th className="p-3">Type / Ref</th>
                <th className="p-3 text-right">Total Invoice</th>
                <th className="p-3 text-right text-green-600">Paid Amount</th>
                <th className="p-3 text-right text-red-600">Remaining Due</th>
                <th className="p-3">Note</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 divide-y">
              {ledger.map((row) => {
                const isPurchase = row.reference_type === "purchase";
                const totalInvoice = isPurchase ? Number(row.total_amount || 0) : 0;
                const paidAmount = isPurchase 
                  ? Number(row.paid_amount || 0) 
                  : Number(row.amount || 0); // For direct payments
                const remainingDue = isPurchase ? Number(row.due_amount || 0) : 0;

                return (
                  <tr key={row.id} className="transition hover:bg-gray-50">
                    <td className="p-3 text-xs">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-medium">
                      <span className="block text-gray-800">
                        {isPurchase ? "Purchase" : "Payment"}
                      </span>
                      <span className="font-mono text-xs text-gray-400">
                        ID: {row.reference_id ? row.reference_id.substring(0, 8) : "—"}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-right text-gray-800">
                      {isPurchase ? `Rs. ${totalInvoice.toFixed(2)}` : "—"}
                    </td>
                    <td className="p-3 font-semibold text-right text-green-600">
                      Rs. {paidAmount.toFixed(2)}
                    </td>
                    <td className="p-3 font-bold text-right text-red-600">
                      {isPurchase ? `Rs. ${remainingDue.toFixed(2)}` : "—"}
                    </td>
                    <td className="p-3 text-xs italic text-gray-400">
                      {row.note || "—"}
                    </td>
                  </tr>
                );
              })}
              {ledger.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 italic text-center text-slate-400">
                    No ledger entries recorded yet for this supplier.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
