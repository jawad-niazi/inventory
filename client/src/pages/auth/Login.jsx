import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { BASE_URL } from "../../utils/api";
import {
  Box,
  Mail,
  Lock,
  Store,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function Login({ defaultTab = "signin" }) {
  const [mode, setMode] = useState(defaultTab); // "signin" | "signup" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState(null);

  const { signin, signup } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await signin(email.trim().toLowerCase(), password);
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

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanShop = shopName.trim();
    if (!cleanShop) {
      setError("Please enter a shop name");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await signup(email.trim().toLowerCase(), password, cleanShop);
      navigate("/dashboard");
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "An error occurred during sign up");
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
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#07090e] overflow-hidden select-none">
      {/* ── Glassy Ambient Glow Orbs ── */}
      <div className="absolute -top-32 -left-32 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-brand-neon/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-slate-800/20 rounded-full blur-[110px] pointer-events-none" />

      {/* ── Subtle Geometric Grid Overlay ── */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* ── Main Glass Card ── */}
      <div className="relative w-full max-w-md backdrop-blur-2xl bg-slate-900/60 border border-white/10 rounded-4xl p-8 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.65)] ring-1 ring-white/5 transition-all">
        {/* Logo & Heading */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-neon text-slate-950 shadow-[0_0_25px_rgba(206,243,109,0.35)] mb-3">
            <Box className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Inventory Manager
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            {mode === "signin"
              ? "Sign in to manage your shop"
              : mode === "signup"
              ? "Create your account and dedicated shop"
              : "Reset your account password"}
          </p>
        </div>

        {/* ── Tab Switcher (Sign In vs Create Account) ── */}
        {mode !== "forgot" && (
          <div className="flex bg-slate-950/70 p-1.5 rounded-full border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-full transition-all duration-200 cursor-pointer ${
                mode === "signin"
                  ? "bg-brand-neon text-slate-950 shadow-md shadow-brand-neon/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-full transition-all duration-200 cursor-pointer ${
                mode === "signup"
                  ? "bg-brand-neon text-slate-950 shadow-md shadow-brand-neon/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* ── Error Banner ── */}
        {error && (
          <div className="mb-5 rounded-2xl bg-red-950/50 border border-red-500/30 p-3.5 text-xs sm:text-sm text-red-300 flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* MODE: SIGN IN                                                */}
        {/* ──────────────────────────────────────────────────────────── */}
        {mode === "signin" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-slate-700/70 bg-slate-800/40 px-4 py-3 pl-10 text-sm text-white placeholder-slate-500 focus:border-brand-neon focus:outline-none focus:ring-1 focus:ring-brand-neon transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setForgotEmail(email);
                    setForgotError(null);
                    setForgotSuccess(false);
                  }}
                  className="text-xs text-brand-neon hover:underline font-semibold transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-700/70 bg-slate-800/40 px-4 py-3 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:border-brand-neon focus:outline-none focus:ring-1 focus:ring-brand-neon transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 rounded-full bg-brand-neon hover:bg-[#bde85b] py-3.5 px-6 text-sm font-bold text-slate-950 shadow-[0_4px_20px_rgba(206,243,109,0.35)] hover:shadow-[0_6px_25px_rgba(206,243,109,0.5)] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* MODE: SIGN UP (CREATE ACCOUNT & SHOP)                        */}
        {/* ──────────────────────────────────────────────────────────── */}
        {mode === "signup" && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Shop Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Store className="h-4 w-4" />
                </div>
                <input
                  id="signup-shop-name"
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                  placeholder="e.g. Acme Tech, Prime Goods"
                  className="w-full rounded-2xl border border-slate-700/70 bg-slate-800/40 px-4 py-3 pl-10 text-sm text-white placeholder-slate-500 focus:border-brand-neon focus:outline-none focus:ring-1 focus:ring-brand-neon transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-neon shrink-0" />
                Your shop will be created and assigned to your account.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="manager@example.com"
                  className="w-full rounded-2xl border border-slate-700/70 bg-slate-800/40 px-4 py-3 pl-10 text-sm text-white placeholder-slate-500 focus:border-brand-neon focus:outline-none focus:ring-1 focus:ring-brand-neon transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="w-full rounded-2xl border border-slate-700/70 bg-slate-800/40 px-4 py-3 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:border-brand-neon focus:outline-none focus:ring-1 focus:ring-brand-neon transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="signup-confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat your password"
                  className="w-full rounded-2xl border border-slate-700/70 bg-slate-800/40 px-4 py-3 pl-10 text-sm text-white placeholder-slate-500 focus:border-brand-neon focus:outline-none focus:ring-1 focus:ring-brand-neon transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 rounded-full bg-brand-neon hover:bg-[#bde85b] py-3.5 px-6 text-sm font-bold text-slate-950 shadow-[0_4px_20px_rgba(206,243,109,0.35)] hover:shadow-[0_6px_25px_rgba(206,243,109,0.5)] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating your shop…</span>
                </>
              ) : (
                <>
                  <span>Create Shop & Account</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* MODE: FORGOT PASSWORD                                        */}
        {/* ──────────────────────────────────────────────────────────── */}
        {mode === "forgot" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setForgotSuccess(false);
                setForgotError(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </button>

            {forgotSuccess ? (
              <div className="rounded-2xl bg-emerald-950/40 border border-emerald-500/30 p-5 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 mx-auto text-brand-neon" />
                <h3 className="font-bold text-white text-base">Check Your Inbox</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  A password reset link has been dispatched to{" "}
                  <span className="text-white font-semibold">{forgotEmail}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setForgotSuccess(false);
                  }}
                  className="mt-3 inline-block rounded-full bg-brand-neon px-5 py-2 text-xs font-bold text-slate-950 hover:bg-[#bde85b] transition-all cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your registered account email and we'll send you a secure link to reset your password.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full rounded-2xl border border-slate-700/70 bg-slate-800/40 px-4 py-3 pl-10 text-sm text-white placeholder-slate-500 focus:border-brand-neon focus:outline-none focus:ring-1 focus:ring-brand-neon transition-all"
                    />
                  </div>
                </div>

                {forgotError && (
                  <div className="rounded-2xl bg-red-950/50 border border-red-500/30 p-3 text-xs text-red-300">
                    {forgotError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full rounded-full bg-brand-neon hover:bg-[#bde85b] py-3.5 px-6 text-sm font-bold text-slate-950 shadow-[0_4px_20px_rgba(206,243,109,0.35)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {forgotLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending reset link…</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
