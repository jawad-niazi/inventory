import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTour } from "../../context/TourContext";
import { apiFetch, fetchShops } from "../../utils/api";
import { AlertCircle, Box, Link as LinkIcon, Compass } from "lucide-react";

export default function Dashboard() {
  const { user, role, shopId } = useAuth();
  const { hasSeenTour, startTour } = useTour();
  const [activeShopId, setActiveShopId] = useState(shopId || localStorage.getItem("current_shop_id") || "");
  const [totalProducts, setTotalProducts] = useState(null);
  const [lowStockCount, setLowStockCount] = useState(null);
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);

  // Automatic first-run tour on Dashboard open
  useEffect(() => {
    if (user && !hasSeenTour()) {
      startTour(1);
    }
  }, [user]);

  useEffect(() => {
    if (shopId) {
      setActiveShopId(shopId);
    } else if (role === "super_admin") {
      fetchShops().then((list) => {
        if (list && list.length > 0) {
          setActiveShopId(list[0].id);
        }
      });
    }
  }, [shopId, role]);

  useEffect(() => {
    const targetShop = activeShopId || shopId;
    if (!targetShop) return;

    const loadData = async () => {
      setLoadingTables(true);
      try {
        const [alertRes, prodRes, salesRes, invRes] = await Promise.all([
          apiFetch(`/api/inventory/low-stock?shop_id=${targetShop}`),
          apiFetch(`/api/products?shop_id=${targetShop}`),
          apiFetch(`/api/sales?shop_id=${targetShop}`),
          apiFetch(`/api/invoices?shop_id=${targetShop}`),
        ]);

        if (alertRes.ok) {
          const body = await alertRes.json();
          setLowStockCount(body.count ?? 0);
        }

        if (prodRes.ok) {
          const body = await prodRes.json();
          const list = body.products || [];
          setTotalProducts(list.length);
          setRecentProducts(list.slice(0, 5));
        }

        let invoicesList = [];
        if (invRes.ok) {
          const body = await invRes.json();
          invoicesList = body.invoices || [];
        }

        if (salesRes.ok) {
          const body = await salesRes.json();
          const list = (body.sales || []).slice(0, 5).map((s) => {
            const matchedInv = invoicesList.find((i) => i.sale_id === s.id);
            return {
              ...s,
              invoice_number:
                matchedInv?.invoice_number ||
                ("INV-" + s.id.slice(0, 8).toUpperCase()),
            };
          });
          setRecentSales(list);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoadingTables(false);
      }
    };

    loadData();
  }, [activeShopId, shopId]);

  const targetShop = activeShopId || shopId;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h2>
          <button
            type="button"
            onClick={() => startTour(1)}
            className="flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm hover:scale-105 cursor-pointer"
            title="Start guided tour"
          >
            <Compass className="w-3.5 h-3.5 text-slate-700" />
            Take the tour
          </button>
        </div>
        <Link to="/reports" className="text-sm font-medium text-slate-500 hover:text-slate-900 underline underline-offset-4">
          View All
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8" data-tour="overview-cards">
        {/* Total Products Card (Replaces Account info) */}
        <Link
          to={targetShop ? `/products?shop_id=${targetShop}` : "/products"}
          className="rounded-4xl bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col justify-between group hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-brand-neon/20 text-slate-900 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Total Products</p>
              <p className="text-sm text-slate-500">Products in this shop</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <p className="text-4xl font-bold text-slate-900">
              {totalProducts !== null ? totalProducts : 0}
            </p>
            <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              View →
            </span>
          </div>
        </Link>

        {/* Low Stock Card */}
        <div
          data-tour="low-stock-card"
          className={`rounded-4xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col justify-between ${
            (lowStockCount || 0) > 0 ? "bg-red-50" : "bg-white"
          }`}
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                (lowStockCount || 0) > 0
                  ? "bg-red-100 text-red-600"
                  : "bg-brand-neon/20 text-slate-900"
              }`}
            >
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Low stock</p>
              <p className="text-sm text-slate-500">
                {(lowStockCount || 0) > 0 ? "Inventory alerts" : "All stock healthy"}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <p
              className={`text-4xl font-bold ${
                (lowStockCount || 0) > 0 ? "text-red-600" : "text-slate-900"
              }`}
            >
              {lowStockCount !== null ? lowStockCount : 0}
            </p>
            <Link
              to={targetShop ? `/inventory?shop_id=${targetShop}` : "/inventory"}
              className={`text-sm font-bold ${
                (lowStockCount || 0) > 0
                  ? "text-red-600 hover:underline"
                  : "text-slate-900 group-hover:text-emerald-700 transition-colors"
              }`}
            >
              View →
            </Link>
          </div>
        </div>

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

      {/* ── Two Compact Tables: Recent Products & Recent Sales ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Recent Products */}
        <div data-tour="recent-products" className="rounded-4xl bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Products</h3>
              <Link
                to={targetShop ? `/products?shop_id=${targetShop}` : "/products"}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 underline underline-offset-4"
              >
                View All
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Product</th>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Stock</th>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Price</th>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm font-medium text-slate-400">
                        {loadingTables ? "Loading products..." : "No products yet"}
                      </td>
                    </tr>
                  ) : (
                    recentProducts.map((p) => {
                      const isLow =
                        p.low_stock_threshold > 0 && (p.quantity ?? 0) <= p.low_stock_threshold;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                          <td className="py-3.5 pr-3">
                            <Link
                              to={targetShop ? `/products?shop_id=${targetShop}` : "/products"}
                              className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors block truncate max-w-[150px] sm:max-w-[200px]"
                              title={p.name}
                            >
                              {p.name}
                            </Link>
                            {(p.sku || p.model_name) && (
                              <span className="block text-xs text-slate-400 truncate max-w-[150px] sm:max-w-[200px]">
                                {p.sku || p.model_name}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-2 text-sm font-medium text-slate-700 text-right">
                            {p.quantity ?? 0}
                          </td>
                          <td className="py-3.5 px-2 text-sm font-bold text-slate-900 text-right whitespace-nowrap">
                            {p.price !== undefined && p.price !== null
                              ? `Rs. ${Number(p.price).toFixed(2)}`
                              : "—"}
                          </td>
                          <td className="py-3.5 pl-2 text-right">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                isLow
                                  ? "bg-red-50 text-red-600 ring-1 ring-red-100"
                                  : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                              }`}
                            >
                              {isLow ? "Low Stock" : "In Stock"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Table 2: Recent Sales */}
        <div className="rounded-4xl bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Sales</h3>
              <Link
                to={targetShop ? `/sales?shop_id=${targetShop}` : "/sales"}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 underline underline-offset-4"
              >
                View All
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Invoice</th>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Customer</th>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Date</th>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Total</th>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentSales.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm font-medium text-slate-400">
                        {loadingTables ? "Loading sales..." : "No sales yet"}
                      </td>
                    </tr>
                  ) : (
                    recentSales.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors group">
                        <td className="py-3.5 pr-2">
                          <Link
                            to={targetShop ? `/sales/${s.id}?shop_id=${targetShop}` : `/sales/${s.id}`}
                            className="font-mono text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors block whitespace-nowrap"
                          >
                            {s.invoice_number}
                          </Link>
                        </td>
                        <td
                          className="py-3.5 px-2 text-sm font-medium text-slate-900 truncate max-w-[120px]"
                          title={s.customers?.name || s.customer_name || "Walk-in"}
                        >
                          {s.customers?.name || s.customer_name || "Walk-in"}
                        </td>
                        <td className="py-3.5 px-2 text-xs font-medium text-slate-500 whitespace-nowrap">
                          {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-3.5 px-2 text-sm font-bold text-slate-900 text-right whitespace-nowrap">
                          Rs. {Number(s.total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 pl-2 text-sm font-medium text-slate-700 text-right whitespace-nowrap">
                          Rs. {Number(s.paid_amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {role === "super_admin" && !targetShop && (
        <div className="mt-8 rounded-2xl bg-brand-neon/20 p-4 border border-brand-neon/50 inline-block">
          <p className="text-sm font-medium text-slate-800">
            Select a shop on Products or Inventory to view shop-scoped alerts.
          </p>
        </div>
      )}
    </div>
  );
}
