import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch } from "../../utils/api";
import { AlertCircle, User, Link as LinkIcon } from "lucide-react";

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
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h2>
        <Link to="/reports" className="text-sm font-medium text-slate-500 hover:text-slate-900 underline underline-offset-4">
          View All
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="rounded-4xl bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Account info</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <p className="text-sm text-slate-500">Role</p>
            <p className="font-bold text-slate-900">{role || "unknown"}</p>
          </div>
        </div>

        {shopId && lowStockCount !== null && (
          <div
            className={`rounded-4xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col justify-between ${
              lowStockCount > 0 ? "bg-red-50" : "bg-white"
            }`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${lowStockCount > 0 ? 'bg-red-100 text-red-600' : 'bg-brand-neon/20 text-brand-neon'}`}>
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Low stock</p>
                <p className="text-sm text-slate-500">Inventory alerts</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-auto">
              <p className={`text-4xl font-bold ${lowStockCount > 0 ? "text-red-600" : "text-slate-900"}`}>
                {lowStockCount}
              </p>
              {lowStockCount > 0 && (
                <Link to="/inventory" className="text-sm font-bold text-red-600 hover:underline">
                  View →
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="rounded-4xl bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <LinkIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Quick Links</p>
              <p className="text-sm text-slate-500">Shortcuts</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-auto">
            <Link to="/products" className="rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Products
            </Link>
            <Link to="/inventory" className="rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Inventory
            </Link>
            <Link to="/categories" className="rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Categories
            </Link>
          </div>
        </div>
      </div>

      {role === "super_admin" && !shopId && (
        <div className="rounded-2xl bg-brand-neon/20 p-4 border border-brand-neon/50 inline-block">
          <p className="text-sm font-medium text-slate-800">
            Select a shop on Products or Inventory to view shop-scoped alerts.
          </p>
        </div>
      )}
    </div>
  );
}
