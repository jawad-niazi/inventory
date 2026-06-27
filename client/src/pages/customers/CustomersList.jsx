import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ShopSelector from "../../components/common/ShopSelector";
import { apiFetch } from "../../utils/api";

export default function CustomersList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shopId, setShopId] = useState(searchParams.get("shop_id") || "");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [error, setError] = useState(null);

  const load = async () => {
    if (!shopId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/customers?shop_id=${shopId}`);
      if (res.ok) {
        const body = await res.json();
        setCustomers(body.customers || []);
      } else {
        const body = await res.json();
        setError(body.error || "Failed to load customers");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [shopId]);

  useEffect(() => {
    if (shopId) setSearchParams({ shop_id: shopId });
  }, [shopId, setSearchParams]);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      const res = await apiFetch(`/api/customers/${id}`, { method: "DELETE" });
      if (res.ok) {
        load();
      } else {
        const body = await res.json();
        alert(body.error || "Failed to delete customer");
      }
    } catch {
      alert("Network error. Please try again.");
    }
  };

  const filtered = (customers || []).filter((c) => {
    const name = (c?.name || "").toLowerCase();
    const phone = (c?.phone || "").toLowerCase();
    const email = (c?.email || "").toLowerCase();
    const qv = (q || "").toLowerCase();
    return name.includes(qv) || phone.includes(qv) || email.includes(qv);
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 font-sans">
          Customers
        </h2>
        {shopId && (
          <Link
            to={`/customers/new?shop_id=${shopId}`}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Add New Customer
          </Link>
        )}
      </div>

      <ShopSelector value={shopId} onChange={setShopId} />

      {shopId && (
        <>
          <div className="mt-4 mb-4">
            <input
              placeholder="Search by name, phone, or email..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-4 text-gray-600">Loading...</div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Customer Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Email
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Outstanding Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-8 text-center text-sm text-gray-500"
                      >
                        No customers found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((customer) => (
                      <tr
                        key={customer?.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                          {customer?.name || "—"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {customer?.phone || "—"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {customer?.email || "—"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-right">
                          <span
                            className={
                              Number(customer?.current_balance || 0) > 0
                                ? "font-bold text-red-600"
                                : "text-gray-500"
                            }
                          >
                            Rs.{" "}
                            {Number(customer?.current_balance || 0).toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                navigate(
                                  `/customers/${customer.id}?shop_id=${shopId}`,
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all duration-150"
                            >
                              View Ledger
                            </button>
                            <Link
                              to={`/customers/${customer.id}/edit?shop_id=${shopId}`}
                              className="text-emerald-600 hover:text-emerald-900 transition-colors text-xs font-semibold"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(customer.id)}
                              className="text-red-600 hover:text-red-900 transition-colors text-xs font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
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
