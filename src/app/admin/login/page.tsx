"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginWithRole } from "@/lib/db";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ShieldAlert,
  Terminal,
  Activity,
  KeyRound,
  FileCheck2,
  Users,
  Hotel,
  Plane,
  Sparkles,
  CheckCircle2,
  Copy,
} from "lucide-react";

// ── Admin Telemetry Highlights ──────────────────────────────────────────────
const ADMIN_CAPABILITIES = [
  {
    icon: FileCheck2,
    title: "Property Verification Pipeline",
    desc: "Review, approve, or reject hotel & stay listings with audit notes.",
  },
  {
    icon: Users,
    title: "User & Role Governance",
    desc: "Inspect traveler and provider accounts with instant suspension controls.",
  },
  {
    icon: Activity,
    title: "Real-Time Platform Telemetry",
    desc: "Monitor live travel bookings, itinerary generation, and system uptime.",
  },
];

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError("");

    try {
      await loginWithRole(email, password, "admin");
      router.push("/admin/dashboard");
    } catch (err: any) {
      console.error("Admin login error:", err);
      const msg = err?.message || "Invalid administrative credentials or insufficient permissions.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = () => {
    setEmail("admin@wanderly.com");
    setPassword("Admin@12345");
    setError("");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left: Executive Admin Security & Ops Showcase ────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-between relative overflow-hidden text-white"
        style={{
          background: "linear-gradient(155deg, #090E14 0%, #0F1A24 35%, #0B251E 75%, #064E3B 100%)",
        }}
      >
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, #34D399 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Ambient security glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo & System Badge */}
        <div className="relative z-10 p-8 xl:p-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all shadow-inner">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-white text-xl font-black tracking-tight flex items-center gap-2">
                Wanderly
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  Admin Ops
                </span>
              </div>
              <p className="text-[11px] text-white/50 font-medium">Platform Governance Center</p>
            </div>
          </Link>
        </div>

        {/* Central Content */}
        <div className="relative z-10 px-8 xl:px-10 pb-4">
          <div className="mb-7">
            {/* Real-time Status Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-4 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational · v2.4 Secure
            </div>

            <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight mb-3">
              Platform administration and oversight.
            </h2>
            <p className="text-sm text-white/70 leading-relaxed max-w-sm">
              Manage verified stays, enforce marketplace integrity, audit travel logs, and support global hosts.
            </p>
          </div>

          {/* Capability Cards */}
          <div className="space-y-3 mb-8">
            {ADMIN_CAPABILITIES.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.title}
                  className="flex items-start gap-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3.5 transition-colors backdrop-blur-xs"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-wide">{cap.title}</h3>
                    <p className="text-[11px] text-white/60 leading-relaxed mt-0.5">{cap.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Security Telemetry Counters */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { val: "99.99%", label: "Uptime SLA" },
              { val: "AES-256", label: "Encryption" },
              { val: "RBAC", label: "Access Policy" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/5 border border-white/10 rounded-xl p-3 text-center backdrop-blur-xs"
              >
                <div className="text-base font-black text-emerald-300 font-mono">{stat.val}</div>
                <div className="text-[10px] text-white/50 font-medium mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Security Disclaimer */}
        <div className="relative z-10 px-8 xl:px-10 pb-8 xl:pb-10">
          <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs text-white/40">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400/80" />
              Role-restricted administrative environment
            </span>
            <span className="font-mono text-[10px] text-emerald-400/60">AUDIT LOGGED</span>
          </div>
        </div>
      </div>

      {/* ── Right: Admin Authentication Panel ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen bg-[var(--cream)] overflow-y-auto">
        {/* Mobile Header (visible on < lg) */}
        <div className="lg:hidden flex items-center justify-between px-5 pt-5 pb-3 bg-white/60 border-b border-[var(--light-sage)] backdrop-blur-sm">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--charcoal)] rounded-lg flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-base font-black text-[var(--charcoal)] leading-none block">Wanderly Admin</span>
              <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-700 block">
                Control Center
              </span>
            </div>
          </Link>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        </div>

        {/* Form Center */}
        <div className="flex-1 flex items-center justify-center px-5 py-8 sm:px-8 md:px-12 lg:px-10 xl:px-16">
          <div className="w-full max-w-[420px] animate-fade-in">
            {/* Form Heading */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Administrative Access
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--charcoal)] tracking-tight mb-1.5">
                Sign in to Control Center
              </h1>
              <p className="text-sm text-[var(--slate)]">
                Authenticate with verified admin credentials to access system management.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-4 rounded-xl mb-5 flex items-start gap-3 text-sm bg-[var(--error-bg)] border border-[var(--error)]/30 text-[var(--error)] animate-slide-down">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                <div className="leading-snug">
                  <strong className="block font-bold text-xs mb-0.5">Access Denied</strong>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleAdminLogin} className="space-y-4">
              {/* Admin Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-bold uppercase tracking-wider text-[var(--charcoal-80)]"
                >
                  Admin Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--slate-light)] transition-colors group-focus-within:text-[var(--forest)]" />
                  <input
                    id="admin-email"
                    type="email"
                    className="input-field pl-10 text-sm font-medium"
                    placeholder="admin@wanderly.com"
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
                    htmlFor="admin-password"
                    className="block text-xs font-bold uppercase tracking-wider text-[var(--charcoal-80)]"
                  >
                    Password
                  </label>
                  <Link
                    href="/admin/forgot-password"
                    className="text-xs font-semibold text-[var(--teal)] hover:text-[var(--forest)] hover:underline transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--slate-light)] transition-colors group-focus-within:text-[var(--forest)]" />
                  <input
                    id="admin-password"
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
                id="admin-login-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-[var(--charcoal)] hover:bg-black text-white font-bold text-sm transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    Verifying Credentials…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Authorize & Sign In
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>

            {/* 1-Click Credentials Helper Card */}
            <div className="mt-5 p-4 bg-emerald-50/90 border border-emerald-300 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-emerald-700" />
                  Dev & Testing Admin Access
                </span>
                <button
                  type="button"
                  onClick={handleAutoFill}
                  className="text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-2.5 py-1 rounded-lg transition-all shadow-2xs hover:shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-200" /> Filled!
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-emerald-200" /> Auto-Fill
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-lg border border-emerald-200/80 text-emerald-950">
                <div>
                  <span className="text-[10px] text-emerald-700 block font-bold">Email ID:</span>
                  <span className="font-mono font-bold text-xs select-all break-all">admin@wanderly.com</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 block font-bold">Password:</span>
                  <span className="font-mono font-bold text-xs select-all">Admin@12345</span>
                </div>
              </div>
            </div>

            {/* Portal Cross-Links */}
            <div className="mt-5 pt-4 border-t border-[var(--light-sage)] flex items-center justify-between text-xs text-[var(--slate)]">
              <Link
                href="/login"
                className="hover:text-[var(--forest)] font-semibold transition-colors flex items-center gap-1"
              >
                <Plane className="w-3.5 h-3.5" /> Traveler Login
              </Link>
              <span className="text-[var(--light-sage)]">|</span>
              <Link
                href="/hotel/login"
                className="hover:text-[var(--forest)] font-semibold transition-colors flex items-center gap-1"
              >
                <Hotel className="w-3.5 h-3.5" /> Stay Provider Portal
              </Link>
            </div>

            {/* Compliance Footer */}
            <div className="mt-4 text-center">
              <p className="text-[11px] text-[var(--slate-light)] leading-relaxed">
                Protected by Wanderly RBAC security protocols. All access attempts are timestamped and logged.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
