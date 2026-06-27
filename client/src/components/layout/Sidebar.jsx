import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { APP_NAME } from "../../constants";

const navLinkClass = (active) =>
  `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${active
    ? "bg-emerald-600 text-white"
    : "text-slate-300 hover:bg-slate-700 hover:text-white"
  }`;

export default function Sidebar() {
  const { role, loading, profileLoading } = useAuth();
  const location = useLocation();

  if (loading || profileLoading) {
    return (
      <aside className="w-56 shrink-0 bg-slate-900 p-4 text-slate-400 border-r border-slate-800">
        Loading...
      </aside>
    );
  }

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/products", label: "Products" },
    { to: "/categories", label: "Categories" },
    { to: "/inventory", label: "Inventory" },
    { to: "/sales", label: "Sales" },
    { to: "/quotations", label: "Quotations" },
    { to: "/purchases", label: "Purchases" },
    { to: "/suppliers", label: "Suppliers" },
    { to: "/customers", label: "Customers" },
    { to: "/transfers", label: "Transfers" },
    { to: "/invoices", label: "Invoices" },
  ];

  if (role === "super_admin") {
    links.push({ to: "/shops", label: "Shops" });
  }

  const isActive = (to) => {
    if (to === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(to);
  };

  return (
    <aside className="flex w-56 shrink-0 flex-col bg-slate-900 border-r border-slate-800">
      <div className="border-b border-slate-800 px-4 py-5">
        <p className="text-sm font-bold uppercase tracking-wider text-emerald-500">
          {APP_NAME}
        </p>
      </div>
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {links.map(({ to, label }) => (
          <Link key={to} to={to} className={navLinkClass(isActive(to))}>
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
