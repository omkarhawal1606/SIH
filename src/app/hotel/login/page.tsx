"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginWithRole } from "@/lib/db";
import {
  Hotel,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Building2,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Plane,
  ChevronRight,
} from "lucide-react";

// ── Provider Highlights for the Left Showcase Panel ─────────────────────────
const PROVIDER_BENEFITS = [
  {
    icon: TrendingUp,
    title: "Zero Commission Onboarding",
    desc: "Maximize margins with direct booking inquiries & transparent rates.",
  },
  {
    icon: Building2,
    title: "Multi-Property Dashboard",
    desc: "Manage luxury resorts, boutique villas, heritage stays, or eco-lodges.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Traveler Community",
    desc: "Connect with vetted explorers seeking authentic cultural stays.",
  },
];

function HotelLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Surface errors passed in URL (e.g. account suspended redirect)
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) setError(decodeURIComponent(urlError));
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError("");

    try {
      // loginWithRole validates stay_provider role (accepts legacy hotel_provider too)
      await loginWithRole(email, password, "stay_provider");
      router.push("/hotel/dashboard");
    } catch (err: any) {
      console.error("Provider login error:", err);
      const msg = err?.message || "Failed to sign in. Please verify your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isSuspended = error.toLowerCase().includes("suspended");

  return (
    <div className="min-h-screen flex">
      {/* ── Left: Hospitality Provider Hero Showcase Panel ───────────────────── */}
      <div
        className="hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-between relative overflow-hidden text-white"
        style={{
          background: "linear-gradient(155deg, #07271E 0%, #0F3D30 40%, #155E49 85%, #1B745A 100%)",
        }}
      >
        {/* Subtle architectural dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Ambient glow accent */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10 p-8 xl:p-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-all">
              <Hotel className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-white text-xl font-black tracking-tight flex items-center gap-1.5">
                Wanderly
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Provider
                </span>
              </div>
              <p className="text-[11px] text-white/50 font-medium">Hospitality Partner Portal</p>
            </div>
          </Link>
        </div>

        {/* Central Content */}
        <div className="relative z-10 px-8 xl:px-10 pb-4">
          <div className="mb-7">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-300/90 mb-3 bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
              <Sparkles className="w-3 h-3 text-emerald-300" /> Host With Wanderly
            </span>
            <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight mb-3">
              Turn your property into an unforgettable journey.
            </h2>
            <p className="text-sm text-white/70 leading-relaxed max-w-sm">
              Join curated hotels, homestays, and eco-lodges hosting mindful travelers across 120+ destinations.
            </p>
          </div>

          {/* Benefit Cards */}
          <div className="space-y-3 mb-8">
            {PROVIDER_BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="flex items-start gap-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3.5 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-wide">{b.title}</h3>
                    <p className="text-[11px] text-white/60 leading-relaxed mt-0.5">{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { val: "1,200+", label: "Verified Stays" },
              { val: "98.4%", label: "Host Satisfaction" },
              { val: "100%", label: "Direct Inquiries" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/5 border border-white/10 rounded-xl p-3 text-center backdrop-blur-xs"
              >
                <div className="text-lg font-black text-white">{stat.val}</div>
                <div className="text-[10px] text-white/50 font-medium mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Panel Note */}
        <div className="relative z-10 px-8 xl:px-10 pb-8 xl:pb-10">
          <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs text-white/40">
            <span>Enterprise-grade host security & SSL encryption</span>
            <span className="font-mono text-[10px]">W-HOST v2.4</span>
          </div>
        </div>
      </div>

      {/* ── Right: Authentication Form Panel ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen bg-[var(--cream)] overflow-y-auto">
        {/* Mobile Header (visible on < lg) */}
        <div className="lg:hidden flex items-center justify-between px-5 pt-5 pb-3 bg-white/60 border-b border-[var(--light-sage)] backdrop-blur-sm">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--forest)] rounded-lg flex items-center justify-center text-white shadow-xs">
              <Hotel className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-black text-[var(--charcoal)] leading-none block">Wanderly</span>
              <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--teal)] block">
                Stay Provider Portal
              </span>
            </div>
          </Link>
          <Link
            href="/hotel/register"
            className="text-xs font-bold text-[var(--teal)] hover:underline flex items-center gap-0.5"
          >
            Register stay <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-5 py-8 sm:px-8 md:px-12 lg:px-10 xl:px-16">
          <div className="w-full max-w-[420px] animate-fade-in">
            {/* Form Heading */}
            <div className="mb-7">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold uppercase tracking-wider mb-3">
                <Hotel className="w-3.5 h-3.5 text-teal-600" />
                Stay Provider Sign In
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--charcoal)] tracking-tight mb-1.5">
                Welcome to your host portal
              </h1>
              <p className="text-sm text-[var(--slate)]">
                Manage room inventories, pricing tiers, guest inquiries, and stay reviews.
              </p>
            </div>

            {/* Error / Suspension Banner */}
            {error && (
              <div
                className={`p-4 rounded-xl mb-5 flex items-start gap-3 text-sm animate-slide-down ${
                  isSuspended
                    ? "bg-red-50 border border-red-300 text-red-800"
                    : "bg-[var(--error-bg)] border border-[var(--error)]/30 text-[var(--error)]"
                }`}
              >
                {isSuspended ? (
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[var(--error)]" />
                )}
                <div className="leading-snug">
                  {isSuspended ? (
                    <>
                      <strong className="block font-bold text-xs mb-0.5">Account Suspended</strong>
                      <span>{error}</span>
                      <span className="block text-xs mt-1.5 text-red-700">
                        Please contact{" "}
                        <a href="mailto:admin@wanderly.com" className="underline font-bold hover:text-red-900">
                          admin@wanderly.com
                        </a>{" "}
                        to appeal or reactivate your listing.
                      </span>
                    </>
                  ) : (
                    <span>{error}</span>
                  )}
                </div>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Business Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="provider-email"
                  className="block text-xs font-bold uppercase tracking-wider text-[var(--charcoal-80)]"
                >
                  Provider Business Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--slate-light)] transition-colors group-focus-within:text-[var(--teal)]" />
                  <input
                    id="provider-email"
                    type="email"
                    className="input-field pl-10 text-sm"
                    placeholder="host@boutiquehotel.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="provider-password"
                    className="block text-xs font-bold uppercase tracking-wider text-[var(--charcoal-80)]"
                  >
                    Password
                  </label>
                  <Link
                    href="/hotel/forgot-password"
                    className="text-xs font-semibold text-[var(--teal)] hover:text-[var(--forest)] hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--slate-light)] transition-colors group-focus-within:text-[var(--teal)]" />
                  <input
                    id="provider-password"
                    type={showPassword ? "text" : "password"}
                    className="input-field pl-10 pr-10 text-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--slate-light)] hover:text-[var(--charcoal)] transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="provider-login-submit"
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 justify-center font-bold text-sm shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    Signing in to dashboard…
                  </>
                ) : (
                  <>
                    Sign In to Provider Dashboard
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </button>
            </form>

            {/* Registration CTA Card */}
            <div className="mt-6 pt-5 border-t border-[var(--light-sage)] text-center space-y-3">
              <p className="text-xs text-[var(--slate)]">
                Looking to list your boutique stay, resort, or homestay?
              </p>
              <Link
                href="/hotel/register"
                className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl border-2 border-[var(--teal)] text-[var(--teal)] hover:bg-[var(--teal)] hover:text-white font-bold text-xs transition-all shadow-2xs hover:shadow-xs group"
              >
                <span>Register Your Property on Wanderly</span>
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Portal Cross-Links */}
            <div className="mt-5 p-3.5 bg-white border border-[var(--light-sage)] rounded-xl flex items-center justify-between text-xs text-[var(--slate)]">
              <span className="flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-[var(--forest)]" />
                Are you a traveler?
              </span>
              <Link
                href="/login"
                className="font-bold text-[var(--forest)] hover:underline flex items-center gap-0.5"
              >
                Traveler Sign In →
              </Link>
            </div>

            {/* Admin Backdoor Link */}
            <div className="mt-4 text-center">
              <Link
                href="/admin/login"
                className="text-[10px] text-[var(--slate-light)] hover:text-[var(--slate)] transition-colors"
              >
                Platform Admin Login →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HotelLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--cream)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--forest)]" />
        </div>
      }
    >
      <HotelLoginForm />
    </Suspense>
  );
}
