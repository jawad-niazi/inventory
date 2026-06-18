import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { APP_NAME } from "../../constants";

const navLinkClass = (active) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${
    active
      ? "bg-indigo-700 text-white"
      : "text-indigo-100 hover:bg-indigo-600 hover:text-white"
  }`;

export default function Sidebar() {
  const { role, loading, profileLoading } = useAuth();
  const location = useLocation();

  if (loading || profileLoading) {
    return (
      <aside className="w-56 shrink-0 bg-indigo-800 p-4 text-indigo-100">
        Loading...
      </aside>
    );
  }

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/products", label: "Products" },
    { to: "/categories", label: "Categories" },
    { to: "/inventory", label: "Inventory" },
  ];

  if (role === "super_admin") {
    links.push({ to: "/shops", label: "Shops" });
  }

  const isActive = (to) => {
    if (to === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(to);
  };

  return (
    <aside className="flex w-56 shrink-0 flex-col bg-indigo-800">
      <div className="border-b border-indigo-700 px-4 py-5">
        <p className="text-xs uppercase tracking-wide text-indigo-200">
          {APP_NAME}
        </p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map(({ to, label }) => (
          <Link key={to} to={to} className={navLinkClass(isActive(to))}>
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
