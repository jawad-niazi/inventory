import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch } from "../../utils/api";

export default function Dashboard() {
  const { user, role, shopId } = useAuth();
  const [lowStockCount, setLowStockCount] = useState(null);

  useEffect(() => {
    const loadAlerts = async () => {
      const targetShop = shopId;
      if (!targetShop) return;
      const res = await apiFetch(
        `/api/inventory/low-stock?shop_id=${targetShop}`,
      );
      if (res.ok) {
        const body = await res.json();
        setLowStockCount(body.count ?? 0);
      }
    };
    loadAlerts();
  }, [shopId]);

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold text-gray-900">Dashboard</h2>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Signed in as</p>
          <p className="mt-1 font-medium text-gray-900">{user?.email}</p>
          <p className="mt-2 text-sm text-gray-600">
            Role: <span className="font-medium">{role || "unknown"}</span>
          </p>
        </div>

        {shopId && lowStockCount !== null && (
          <div
            className={`rounded-lg border p-5 shadow-sm ${
              lowStockCount > 0
                ? "border-red-200 bg-red-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <p className="text-sm text-gray-500">Low stock alerts</p>
            <p
              className={`mt-1 text-3xl font-bold ${lowStockCount > 0 ? "text-red-600" : "text-gray-900"}`}
            >
              {lowStockCount}
            </p>
            {lowStockCount > 0 && (
              <Link
                to="/inventory"
                className="mt-2 inline-block text-sm text-red-700 hover:underline"
              >
                View inventory →
              </Link>
            )}
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-medium text-gray-700">Quick links</p>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/products"
              className="rounded-md bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-100"
            >
              Products
            </Link>
            <Link
              to="/inventory"
              className="rounded-md bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-100"
            >
              Inventory
            </Link>
            <Link
              to="/categories"
              className="rounded-md bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-100"
            >
              Categories
            </Link>
          </div>
        </div>
      </div>

      {role === "super_admin" && !shopId && (
        <p className="text-sm text-gray-500">
          Select a shop on Products or Inventory to view shop-scoped alerts.
        </p>
      )}
    </div>
  );
}
