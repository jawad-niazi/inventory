import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";

// Matches the exact rounded-full pill design and brand-neon color of "+ Add Product"
const navLinkClass = (active) =>
  `flex items-center gap-3 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-200 ${
    active
      ? "bg-brand-neon text-slate-900 shadow-sm shadow-[0_4px_15px_rgba(206,243,109,0.35)]"
      : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
  }`;

export default function Sidebar() {
  const { role, shopName, shopId, shops, loading, profileLoading } = useAuth();
  const sidebarRef = useRef(null);
  const [stickyTop, setStickyTop] = useState(16);
  const location = useLocation();

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

  // Dynamic sticky behavior:
  // When scrolling down, sidebar scrolls with the page until its last button is in view,
  // then it stops and sticks so the user can reach every button while page content continues to scroll!
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (!sidebarRef.current) return;
      const sidebarHeight = sidebarRef.current.offsetHeight;
      const windowHeight = window.innerHeight;

      // If sidebar fits completely on screen, pin to top
      if (sidebarHeight <= windowHeight - 32) {
        setStickyTop(16);
        lastScrollY = window.scrollY;
        return;
      }

      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      // Bottom stop bound: sidebar bottom stays 16px above screen bottom
      const minTop = windowHeight - sidebarHeight - 16;
      // Top stop bound: 16px from top of screen
      const maxTop = 16;

      setStickyTop((prevTop) => {
        const nextTop = prevTop - delta;
        return Math.max(minTop, Math.min(maxTop, nextTop));
      });
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    const timer = setTimeout(handleScroll, 150);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      clearTimeout(timer);
    };
  }, [role, shops, links.length]);

  if (loading || profileLoading) {
    return (
      <aside className="sticky top-4 self-start w-[260px] my-4 ml-4 shrink-0 bg-sidebar-bg p-4 text-slate-400 rounded-tr-4xl rounded-br-4xl border-r border-slate-800 shadow-xl">
        Loading...
      </aside>
    );
  }

  const isActive = (to) => {
    if (to === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(to);
  };

  // Capitalize shop name or fallback to APP_NAME
  const rawShopName = shopName || (shops && shops.find((s) => s.id === shopId)?.name);
  const displayName = rawShopName
    ? rawShopName.charAt(0).toUpperCase() + rawShopName.slice(1)
    : APP_NAME;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside
      ref={sidebarRef}
      data-tour="sidebar"
      style={{
        top: `${stickyTop}px`,
      }}
      className="sticky self-start flex w-[260px] shrink-0 flex-col bg-sidebar-bg rounded-tr-4xl rounded-br-4xl my-4 ml-4 shadow-xl z-20 transition-[top] duration-75"
    >
      {/* ── Sidebar Header: Active Shop Name (Clean & Static - Everyone has their own shop) ── */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-3 min-w-0" title={displayName}>
          <div className="w-10 h-10 rounded-full bg-brand-neon flex items-center justify-center text-slate-950 font-black text-lg shrink-0 shadow-sm shadow-[0_2px_10px_rgba(206,243,109,0.3)]">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-white tracking-tight truncate leading-tight">
              {displayName}
            </p>
            <p className="text-[11px] font-semibold text-slate-400 truncate mt-0.5">
              Active Shop
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation Links ── */}
      <nav className="flex-1 space-y-2 px-4 overflow-y-auto scrollbar-hide pb-4">
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={shopId ? `${to}?shop_id=${shopId}` : to}
            className={navLinkClass(isActive(to))}
          >
            <Icon className="w-5 h-5" strokeWidth={isActive(to) ? 2.5 : 2} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
