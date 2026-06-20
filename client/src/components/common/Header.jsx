import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function Header() {
  const { user, role, signout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">Welcome back</h1>
        <p className="text-sm text-slate-400">{user?.email}</p>
      </div>
      <div className="flex items-center gap-4">
        {role && (
          <span className="rounded-full bg-emerald-900 px-3 py-1 text-xs font-medium text-emerald-200">
            {role.replace("_", " ")}
          </span>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
