import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Search } from "lucide-react";

export default function Header() {
  const { user, role, signout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signout();
    navigate("/login", { replace: true });
  };

  // Get name from email for placeholder
  const displayName = user?.email?.split('@')[0] || "Taylor";
  const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

  return (
    <header className="flex items-center justify-between px-6 py-8 md:px-8 lg:px-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          Welcome back {capitalizedName} <span className="text-3xl">👋</span>
        </h1>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-64 rounded-full border-0 py-2.5 pl-10 pr-4 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-neon bg-white shadow-sm"
            placeholder="Search courses..."
          />
        </div>
        
        {role && (
          <span className="hidden md:inline-flex rounded-full bg-brand-neon/20 px-3 py-1 text-xs font-semibold text-slate-800">
            {role.replace("_", " ")}
          </span>
        )}
        
        <div className="relative flex items-center gap-3">
          <button
            type="button"
            onClick={handleLogout}
            className="hidden md:block text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            Logout
          </button>
          <img
            className="inline-block h-10 w-10 rounded-full ring-2 ring-white shadow-sm object-cover"
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt="User avatar"
          />
        </div>
      </div>
    </header>
  );
}
