import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";

function getToken() {
  return supabase.auth.getSession().then((s) => s.data.session?.access_token);
}

const btnSecondary =
  "rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200";
const btnDanger =
  "rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100";

export default function ShopsList() {
  const [shops, setShops] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchShops = async () => {
    setLoading(true);
    const token = await getToken();
    const res = await fetch("/api/shops", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const body = await res.json();
      setShops(body.shops || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete shop?")) return;
    const token = await getToken();
    const res = await fetch(`/api/shops/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchShops();
  };

  const toggleStatus = async (shop) => {
    const token = await getToken();
    const newStatus = shop.status === "active" ? "inactive" : "active";
    const res = await fetch(`/api/shops/${shop.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchShops();
  };

  const filtered = shops.filter(
    (s) =>
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Shops</h2>
        <Link
          to="/shops/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Create Shop
        </Link>
      </div>

      <div className="mb-4">
        <input
          placeholder="Search by name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((shop) => (
                <tr key={shop.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{shop.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {shop.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {shop.phone || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        shop.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {shop.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={btnSecondary}
                        onClick={() => navigate(`/shops/${shop.id}/edit`)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={btnDanger}
                        onClick={() => handleDelete(shop.id)}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className={btnSecondary}
                        onClick={() => toggleStatus(shop)}
                      >
                        {shop.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No shops found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
