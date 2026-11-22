import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase embeds the reset token in the URL hash as #access_token=...&type=recovery
  // We need to detect this and let Supabase set up the session automatically.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setSessionReady(true);
      }
    });

    // Also check if session is already established (e.g. page reload)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setStatus("loading");

    // Use Supabase client directly — the reset token session is already active
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setStatus("error");
    } else {
      setStatus("success");
      setTimeout(() => navigate("/login"), 3000);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#07090e] overflow-hidden select-none">
      {/* ── Glassy Ambient Glow Orbs ── */}
      <div className="absolute -top-32 -left-32 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-brand-neon/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-slate-800/20 rounded-full blur-[110px] pointer-events-none" />

      {/* ── Subtle Geometric Grid Overlay ── */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative w-full max-w-md backdrop-blur-2xl bg-slate-900/60 border border-white/10 rounded-4xl p-8 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.65)] ring-1 ring-white/5 transition-all">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-neon text-slate-950 shadow-[0_0_25px_rgba(206,243,109,0.35)] mb-3">
            <svg
              className="text-slate-950 w-7 h-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Set New Password</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Enter your new secure password below
          </p>
        </div>

        <div>
          {status === "success" ? (
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 border rounded-full bg-emerald-950/60 border-emerald-500/30">
                <svg
                  className="w-8 h-8 text-brand-neon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-lg font-bold text-white">
                Password Updated!
              </p>
              <p className="text-xs sm:text-sm text-slate-400">
                Your password has been changed successfully. Redirecting to
                login…
              </p>
            </div>
          ) : !sessionReady ? (
            <div className="py-4 space-y-3 text-center">
              <div className="w-8 h-8 mx-auto border-b-2 rounded-full animate-spin border-brand-neon" />
              <p className="text-sm text-slate-400">Verifying reset link…</p>
              <p className="mt-4 text-xs text-slate-500">
                If this takes too long, the link may have expired.{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-brand-neon hover:underline"
                >
                  Request a new one
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-2xl border border-slate-700/70 bg-slate-800/40 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-neon focus:outline-none focus:ring-1 focus:ring-brand-neon transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="Repeat your new password"
                  className="w-full rounded-2xl border border-slate-700/70 bg-slate-800/40 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-neon focus:outline-none focus:ring-1 focus:ring-brand-neon transition-all"
                />
              </div>

              {/* Password strength hint */}
              {password && (
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        password.length >= i * 3
                          ? password.length >= 12
                            ? "bg-brand-neon"
                            : password.length >= 8
                              ? "bg-yellow-400"
                              : "bg-red-400"
                          : "bg-slate-700"
                      }`}
                    />
                  ))}
                </div>
              )}

              {error && (
                <div className="rounded-2xl bg-red-950/50 border border-red-500/30 p-3 text-xs text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full mt-2 rounded-full bg-brand-neon hover:bg-[#bde85b] py-3.5 px-6 text-sm font-bold text-slate-950 shadow-[0_4px_20px_rgba(206,243,109,0.35)] disabled:opacity-50 transition-all cursor-pointer"
              >
                {status === "loading" ? "Updating…" : "Update Password"}
              </button>

              <p className="text-xs text-center text-slate-400 mt-2">
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-brand-neon hover:underline font-semibold"
                >
                  Back to login
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
