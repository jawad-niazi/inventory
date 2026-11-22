import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTour } from "../../context/TourContext";
import { Search, LogOut, Compass } from "lucide-react";

export default function Header() {
  const { user, role, signout } = useAuth();
  const { startTour } = useTour();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    await signout();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Get name from email for placeholder
  const displayName = user?.email?.split('@')[0] || "Taylor";
  const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

  return (
    <header className="flex items-center justify-between gap-6 px-6 py-6 md:px-8 lg:px-10">
      {/* 1. Left: Welcome heading + sub-line */}
      <div className="min-w-0 flex-1">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight whitespace-nowrap">
          Welcome back {capitalizedName}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 whitespace-nowrap">
          {new Date().toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}{" "}
          · Inventory Overview & Activity
        </p>
      </div>

      {/* 2. Middle: Search box */}
      <div className="relative shrink-0" data-tour="header-search">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-72 sm:w-80 md:w-96 rounded-full border-0 py-2.5 pl-10 pr-4 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-neon bg-white shadow-sm"
          placeholder="Search products, orders or suppliers..."
        />
      </div>

      {/* 3. Right: User avatar with dropdown */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center rounded-full ring-2 ring-transparent hover:ring-brand-neon focus:outline-none transition-all"
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
          aria-label="User menu"
        >
          <img
            className="inline-block h-10 w-10 rounded-full ring-2 ring-white shadow-sm object-cover cursor-pointer"
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt="User avatar"
          />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-3 w-64 rounded-3xl bg-white p-5 shadow-[0_12px_36px_rgba(0,0,0,0.12)] border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-100">
            {/* User Info (Display Only) */}
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {capitalizedName}
              </p>
              <p className="text-xs text-slate-500 truncate mt-0.5" title={user?.email || ""}>
                {user?.email || "—"}
              </p>
            </div>

            {/* Role (Display Only) */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 border border-slate-100">
              <span className="text-xs font-medium text-slate-500">Role</span>
              <span className="inline-flex items-center rounded-full bg-brand-neon/20 px-2.5 py-0.5 text-xs font-bold text-slate-800">
                {role || "unknown"}
              </span>
            </div>

            {/* Divider Line */}
            <div className="my-3 border-t border-slate-100" />

            {/* Take the Tour Item (Clickable) */}
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                startTour(1);
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer mb-1"
            >
              <Compass className="h-4 w-4 text-slate-400" />
              Take the tour
            </button>

            {/* Logout Item (Clickable) */}
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4 text-slate-400" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
