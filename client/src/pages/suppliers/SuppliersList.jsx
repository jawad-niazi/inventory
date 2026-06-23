import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ShopSelector from "../../components/common/ShopSelector";
import { apiFetch } from "../../utils/api";

export default function SuppliersList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shopId, setShopId] = useState(searchParams.get("shop_id") || "");
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [error, setError] = useState(null);

  const load = async () => {
    if (!shopId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/suppliers?shop_id=${shopId}`);
      if (res.ok) {
        const body = await res.json();
        setSuppliers(body.suppliers || []);
      } else {
        const body = await res.json();
        setError(body.error || "Failed to load suppliers");
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

  const handleShopChange = (id) => setShopId(id);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;
    try {
      const res = await apiFetch(`/api/suppliers/${id}`, { method: "DELETE" });
      if (res.ok) {
        load();
      } else {
        const body = await res.json();
        alert(body.error || "Failed to delete supplier");
      }
    } catch {
      alert("Network error. Please try again.");
    }
  };

  const filtered = (suppliers || []).filter((s) => {
    const name = (s?.company_name || "").toString().toLowerCase();
    const phone = (s?.phone || "").toString().toLowerCase();
    const addr = (s?.address || "").toString().toLowerCase();
    const qv = (q || "").toLowerCase();
    return name.includes(qv) || phone.includes(qv) || addr.includes(qv);
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 font-sans">
          Suppliers
        </h2>
        {shopId && (
          <Link
            to={`/suppliers/new?shop_id=${shopId}`}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Add Supplier
          </Link>
        )}
      </div>

      <ShopSelector value={shopId} onChange={handleShopChange} />

      {shopId && (
        <>
          <div className="mt-4 mb-4">
            <input
              placeholder="Search by company name, phone, address..."
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
                      Company Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Address
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
                        colSpan="4"
                        className="px-6 py-8 text-center text-sm text-gray-500"
                      >
                        No suppliers found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((supplier) => (
                      <tr
                        key={supplier?.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                          {supplier?.company_name || "—"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {supplier?.phone || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {supplier?.address || "—"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium space-x-3">
                          <Link
                            to={`/suppliers/${supplier.id}/edit?shop_id=${shopId}`}
                            className="text-emerald-600 hover:text-emerald-900 transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            Delete
                          </button>
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
