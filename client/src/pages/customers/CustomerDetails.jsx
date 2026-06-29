import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";

export default function CustomerDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shop_id") || localStorage.getItem("current_shop_id") || "";
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    if (!shopId || !id) {
      console.log("🔍 DEBUG: shopId or id is missing on load execution", { shopId, id });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const supabaseRawData = localStorage.getItem("sb-vrxbpjclusvuxmcsmzbi-auth-token");
      console.log("🔍 DEBUG: Raw Supabase Data from LocalStorage:", supabaseRawData);

      let accessToken = "";
      if (supabaseRawData) {
        try {
          const parsed = JSON.parse(supabaseRawData);
          accessToken = parsed.access_token || "";
          console.log("🔍 DEBUG: Parsed Access Token (First 15 chars):", accessToken ? accessToken.substring(0, 15) + "..." : "EMPTY");
        } catch (e) {
          console.error("❌ DEBUG: JSON Parse Error on token string:", e);
        }
      }

      const targetUrl = `http://localhost:4000/api/customers/${id}?shop_id=${shopId}`;
      const authHeader = accessToken ? `Bearer ${accessToken}` : "NONE";
      console.log("🚀 DEBUG: Sending Fetch Request to:", targetUrl, "with Authorization Header:", authHeader);

      const res = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": accessToken ? `Bearer ${accessToken}` : ""
        }
      });

      console.log("📥 DEBUG: Server Response Status Code:", res.status);

      if (res.ok) {
        const body = await res.json();
        console.log("✅ DEBUG: Data payload received successfully:", body);
        setCustomer(body.customer);
        setLedger(body.ledger || []);
        setError(null);
      } else {
        console.error(`❌ DEBUG: Response not OK. Status: ${res.status}`);
        setError("Failed to load ledger data");
      }
    } catch (err) {
      console.error("❌ DEBUG: Network Try/Catch Error:", err);
      setError("Network error loading ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id, shopId]);

  if (loading)
    return (
      <div className="p-6 text-center text-gray-500">
        Loading Ledger History...
      </div>
    );

  if (!shopId)
    return (
      <div className="p-6 text-center text-gray-500">
        Please select a shop first.
      </div>
    );

  if (error || !customer)
    return (
      <div className="p-6 text-center text-red-500">
        {error || "Customer not found."}
      </div>
    );

  return (
    <div className="max-w-6xl p-4 mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{customer.name}</h2>
          <p className="text-sm text-gray-500">
            Phone: {customer.phone || "—"}
            {customer.address ? ` | Address: ${customer.address}` : ""}
          </p>
        </div>
        <button
          onClick={() => navigate(`/customers?shop_id=${shopId}`)}
          className="px-4 py-2 text-sm font-medium transition border rounded-md bg-white hover:bg-gray-50 shadow-sm"
        >
          Back to Customers
        </button>
      </div>

      {/* Outstanding Balance Banner */}
      <div className="flex items-center justify-between p-6 bg-white border-l-4 border-emerald-500 rounded-lg shadow-sm">
        <div>
          <span className="block text-sm font-semibold tracking-wider text-gray-500 uppercase">
            Total Outstanding Receivable Balance (Kul Udhaar)
          </span>
          <p className="mt-1 text-xs text-gray-400">
            * This shows the total outstanding amount this customer owes you.
          </p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-emerald-600">
            Rs.{" "}
            {Number(customer.current_balance || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="p-6 overflow-hidden bg-white border rounded-lg shadow-sm">
        <h3 className="pb-2 mb-4 text-lg font-bold text-gray-700 border-b">
          Ledger &amp; Transaction Statement
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
                // 🎯 Safe database mapping
                const totalInvoice = Number(row.total_amount || row.amount || 0);
                const paidAmount = Number(row.paid_amount || (row.direction === "credit" ? row.amount : 0));
                const remainingDue = Number(row.due_amount || row.remaining_due || 0);

                return (
                  <tr key={row.id} className="transition hover:bg-gray-50">
                    <td className="p-3 text-xs">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-medium">
                      <span className="block text-gray-800">
                        {row.direction === "debit" ? "Sales Invoice" : "Cash Received"}
                      </span>
                      <span className="font-mono text-xs text-gray-400">
                        Ref: {row.reference_id ? row.reference_id.substring(0, 8) : "—"}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-right text-gray-800">
                      Rs. {totalInvoice.toFixed(2)}
                    </td>
                    <td className="p-3 font-semibold text-right text-green-600">
                      Rs. {paidAmount.toFixed(2)}
                    </td>
                    <td className="p-3 font-bold text-right text-red-600">
                      Rs. {remainingDue.toFixed(2)}
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
                    No ledger entries recorded yet for this customer.
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