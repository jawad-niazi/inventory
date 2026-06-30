import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { BASE_URL } from "../../utils/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Forgot Password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState(null);

  const [selectedShop, setSelectedShop] = useState(null);

  const { signin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await signin(email, password);
      if (res.error) {
        setError(res.error.message);
        return;
      }
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "An error occurred during sign in");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError(null);
    setForgotLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const body = await res.json();
      if (!res.ok) {
        setForgotError(body.error || "Something went wrong");
      } else {
        setForgotSuccess(true);
      }
    } catch {
      setForgotError("Network error. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-900 to-slate-900 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-900/50 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Inventory Manager</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 backdrop-blur-sm p-8 shadow-2xl">
          {!selectedShop ? (
            /* ── Shop Selection Panel ── */
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white">Select Your Shop</h2>
                <p className="text-slate-400 text-sm mt-1">Choose a shop to continue</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedShop("Shop 1")}
                  className="flex flex-col items-center justify-center p-6 rounded-xl border border-slate-600 bg-slate-700/50 hover:bg-emerald-600/20 hover:border-emerald-500/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-600 group-hover:bg-emerald-500/20 flex items-center justify-center mb-3 transition-colors">
                    <svg className="w-6 h-6 text-slate-300 group-hover:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span className="text-white font-medium">Shop 1</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedShop("Shop 2")}
                  className="flex flex-col items-center justify-center p-6 rounded-xl border border-slate-600 bg-slate-700/50 hover:bg-emerald-600/20 hover:border-emerald-500/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-600 group-hover:bg-emerald-500/20 flex items-center justify-center mb-3 transition-colors">
                    <svg className="w-6 h-6 text-slate-300 group-hover:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <span className="text-white font-medium">Shop 2</span>
                </button>
              </div>
            </div>
          ) : !showForgot ? (
            /* ── Login Form ── */
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => setSelectedShop(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label="Back"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-lg font-semibold text-white">Login to {selectedShop}</h2>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgot(true);
                      setForgotEmail(email);
                      setForgotError(null);
                      setForgotSuccess(false);
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-900/40 border border-red-700/50 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-md shadow-emerald-900/30"
              >
                {submitting ? "Signing in…" : "Sign in"}
              </button>
            </form>
          ) : (
            /* ── Forgot Password Panel ── */
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => { setShowForgot(false); setForgotSuccess(false); setForgotError(null); }}
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label="Back"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-lg font-semibold text-white">Reset Password</h2>
              </div>

              {forgotSuccess ? (
                <div className="rounded-lg bg-emerald-900/40 border border-emerald-700/50 px-4 py-4 text-sm text-emerald-300 text-center space-y-2">
                  <svg className="w-8 h-8 mx-auto text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="font-medium">Check your email!</p>
                  <p className="text-slate-400">A password reset link has been sent to <span className="text-white">{forgotEmail}</span>.</p>
                  <button
                    type="button"
                    onClick={() => { setShowForgot(false); setForgotSuccess(false); }}
                    className="mt-2 text-xs text-emerald-400 hover:underline"
                  >
                    Back to login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-sm text-slate-400">
                    Enter your registered email address and we'll send you a password reset link.
                  </p>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">
                      Email address
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>
                  {forgotError && (
                    <div className="rounded-lg bg-red-900/40 border border-red-700/50 px-4 py-3 text-sm text-red-300">
                      {forgotError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                  >
                    {forgotLoading ? "Sending…" : "Send Reset Link"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
