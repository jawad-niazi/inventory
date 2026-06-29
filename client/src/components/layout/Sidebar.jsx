import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { APP_NAME } from "../../constants";
import {
  LayoutDashboard,
  Box,
  Tags,
  Warehouse,
  TrendingUp,
  FileText,
  ShoppingCart,
  Truck,
  Users,
  ArrowRightLeft,
  Receipt,
  Store,
  ArrowUpRight
} from "lucide-react";

const navLinkClass = (active) =>
  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
    active
      ? "bg-brand-neon text-slate-900 shadow-[0_0_15px_rgba(206,243,109,0.3)]"
      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
  }`;

export default function Sidebar() {
  const { role, loading, profileLoading } = useAuth();
  const location = useLocation();

  if (loading || profileLoading) {
    return (
      <aside className="w-[260px] shrink-0 bg-sidebar-bg p-4 text-slate-400 border-r border-slate-800">
        Loading...
      </aside>
    );
  }

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/products", label: "Products", icon: Box },
    { to: "/categories", label: "Categories", icon: Tags },
    { to: "/inventory", label: "Inventory", icon: Warehouse },
    { to: "/sales", label: "Sales", icon: TrendingUp },
    { to: "/quotations", label: "Quotations", icon: FileText },
    { to: "/purchases", label: "Purchases", icon: ShoppingCart },
    { to: "/suppliers", label: "Suppliers", icon: Truck },
    { to: "/customers", label: "Customers", icon: Users },
    { to: "/transfers", label: "Transfers", icon: ArrowRightLeft },
    { to: "/invoices", label: "Invoices", icon: Receipt },
  ];

  if (role === "super_admin") {
    links.push({ to: "/shops", label: "Shops", icon: Store });
  }

  const isActive = (to) => {
    if (to === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(to);
  };

  return (
    <aside className="flex w-[260px] shrink-0 flex-col bg-sidebar-bg rounded-tr-4xl rounded-br-4xl my-4 ml-4 shadow-xl overflow-hidden relative">
      <div className="px-6 py-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-brand-neon flex items-center justify-center text-slate-900 font-bold text-lg">
          {APP_NAME.charAt(0)}
        </div>
        <p className="text-xl font-bold text-white tracking-tight">
          {APP_NAME}
        </p>
      </div>
      
      <nav className="flex-1 space-y-2 px-4 overflow-y-auto scrollbar-hide pb-4">
        {links.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={navLinkClass(isActive(to))}>
            <Icon className="w-5 h-5" strokeWidth={isActive(to) ? 2.5 : 2} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
