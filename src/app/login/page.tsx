"use client";

import React, { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginWithEmail, loginWithRole, resetPassword } from "@/lib/db";
import EmailConfirmModal from "@/components/EmailConfirmModal";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import {
  Plane,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  User,
  Hotel,
  ArrowRight,
  CheckCircle2,
  Building,
  MapPin,
  Star,
  X,
} from "lucide-react";

// ── Travel destination cards shown in the hero panel ──────────────────────────
const DESTINATIONS = [
  { name: "Santorini", tag: "🌅 Europe", color: "#3FAF8F" },
  { name: "Kyoto", tag: "🌸 Asia", color: "#164E3D" },
  { name: "Goa", tag: "🏖️ India", color: "#2F8F6B" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeRole, setActiveRole] = useState<"traveler" | "provider">("traveler");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [showResetPanel, setShowResetPanel] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [destIdx, setDestIdx] = useState(0);

  useEffect(() => {
    const err = searchParams.get("auth_error");
    if (err) setAuthError(decodeURIComponent(err));
    const roleParam = searchParams.get("role") || searchParams.get("type");
    if (roleParam === "provider" || roleParam === "hotel") setActiveRole("provider");
  }, [searchParams]);

  // Cycle through destinations in hero panel
  useEffect(() => {
    const id = setInterval(() => setDestIdx((i) => (i + 1) % DESTINATIONS.length), 3500);
    return () => clearInterval(id);
  }, []);

  const handleRoleSwitch = (role: "traveler" | "provider") => {
    setActiveRole(role);
    setError("");
    setAuthError("");
    setShowResetPanel(false);
    setResetSuccess(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");
    setAuthError("");
    try {
      if (activeRole === "provider") {
        await loginWithRole(email, password, "stay_provider");
        router.push("/hotel/dashboard");
      } else {
        await loginWithEmail(email, password);
        router.push("/dashboard");
      }
    } catch (err: any) {
      const msg: string = err.message || "Invalid email or password";
      if (
        msg.toLowerCase().includes("email not confirmed") ||
        msg.toLowerCase().includes("not confirmed")
      ) {
        setShowConfirmModal(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTravelerReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setResetLoading(true);
    setError("");
    try {
      await resetPassword(email);
      setResetSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Failed to send reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  const dest = DESTINATIONS[destIdx];

  return (
    <>
      {showConfirmModal && (
        <EmailConfirmModal
          email={email}
          onClose={() => setShowConfirmModal(false)}
          onVerified={() => router.push("/dashboard")}
        />
      )}

      <div className="min-h-screen flex">
        {/* ── Left: Hero Travel Panel ──────────────────────────────────────── */}
        <div
          className="hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-between relative overflow-hidden"
          style={{ background: "linear-gradient(160deg, #0F3629 0%, #164E3D 45%, #1F6B52 100%)" }}
        >
          {/* Subtle dot pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          {/* Top Logo */}
          {/* Top Logo */}
          <div className="relative z-10 p-8 xl:p-10">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                {activeRole === "provider" ? (
                  <Hotel className="w-4.5 h-4.5 text-emerald-300" />
                ) : (
                  <Plane className="w-4.5 h-4.5 text-white rotate-[-45deg]" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white text-xl font-black tracking-tight">Wanderly</span>
                {activeRole === "provider" && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Host
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* Central Hero Content */}
          <div className="relative z-10 px-8 xl:px-10 pb-4">
            {activeRole === "traveler" ? (
              <div className="animate-fade-in">
                <div className="mb-6">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-300/80 mb-4">
                    <Star className="w-3 h-3 fill-current" /> AI-Powered Travel
                  </span>
                  <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight mb-3">
                    Plan your next<br />
                    <span
                      className="transition-all duration-700"
                      style={{ color: dest.color === "#3FAF8F" ? "#6FCBAD" : "#A7DBCA" }}
                    >
                      {dest.name}
                    </span>{" "}
                    adventure.
                  </h2>
                  <p className="text-sm text-white/60 leading-relaxed max-w-xs">
                    Smart itineraries, curated stays, and real-time AI guidance — all in one place.
                  </p>
                </div>

                {/* Destination Indicator */}
                <div className="flex items-center gap-2 mb-8">
                  {DESTINATIONS.map((d, i) => (
                    <button
                      key={d.name}
                      onClick={() => setDestIdx(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        i === destIdx ? "w-8 bg-emerald-300" : "w-2.5 bg-white/20"
                      }`}
                      aria-label={d.name}
                    />
                  ))}
                  <span className="ml-2 text-xs text-white/40">{dest.tag}</span>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[
                    { n: "50K+", label: "Trips planned" },
                    { n: "120+", label: "Destinations" },
                    { n: "4.9★", label: "User rating" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                      <div className="text-lg font-black text-white">{s.n}</div>
                      <div className="text-[10px] text-white/50 font-medium mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="mb-6">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-300/80 mb-4">
                    <Hotel className="w-3 h-3" /> Hospitality Partner Portal
                  </span>
                  <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight mb-3">
                    Grow your stay<br />
                    <span className="text-emerald-300">with Wanderly.</span>
                  </h2>
                  <p className="text-sm text-white/60 leading-relaxed max-w-xs">
                    Showcase your boutique hotel, villa, or eco-lodge to mindful travelers searching for authentic stays.
                  </p>
                </div>

                {/* Provider Perks Row */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[
                    { n: "1,200+", label: "Verified stays" },
                    { n: "0%", label: "Listing fee" },
                    { n: "98.4%", label: "Host rating" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                      <div className="text-lg font-black text-white">{s.n}</div>
                      <div className="text-[10px] text-white/50 font-medium mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Quote */}
          <div className="relative z-10 px-8 xl:px-10 pb-8 xl:pb-10">
            <div className="border-t border-white/10 pt-5">
              {activeRole === "traveler" ? (
                <>
                  <p className="text-xs text-white/40 italic leading-relaxed">
                    &ldquo;The world is a book, and those who do not travel read only one page.&rdquo;
                  </p>
                  <p className="text-[10px] text-white/25 mt-1 font-medium">— Saint Augustine</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-white/40 italic leading-relaxed">
                    &ldquo;Hospitality is simply an opportunity to show love and care.&rdquo;
                  </p>
                  <p className="text-[10px] text-white/25 mt-1 font-medium">— Wanderly Host Ethos</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Auth Form Panel ────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-screen bg-[var(--cream)] overflow-y-auto">
          {/* Mobile logo (hidden on lg+) */}
          <div className="lg:hidden flex items-center justify-between px-5 pt-5 pb-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 bg-[var(--forest)] rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-white rotate-[-45deg]" />
              </div>
              <span className="text-lg font-black text-[var(--charcoal)]">Wanderly</span>
            </Link>
            <Link href="/signup" className="text-xs font-bold text-[var(--forest)] hover:underline">
              New account →
            </Link>
          </div>

          <div className="flex-1 flex items-center justify-center px-5 py-8 sm:px-8 md:px-12 lg:px-10 xl:px-16">
            <div className="w-full max-w-[420px] animate-fade-in">

              {/* Heading */}
              <div className="mb-7">
                <h1 className="text-2xl sm:text-3xl font-black text-[var(--charcoal)] tracking-tight mb-1.5">
                  {activeRole === "provider" ? "Provider Sign In" : "Welcome back"}
                </h1>
                <p className="text-sm text-[var(--slate)]">
                  {activeRole === "traveler"
                    ? "Sign in to access your trips, stays, and itineraries."
                    : "Manage your property listings, rates, and bookings."}
                </p>
              </div>

              {/* ── Role Selector ──────────────────────────────────────────── */}
              <div className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--slate)] mb-2">Sign in as</p>
                <div className="flex p-1 bg-white border border-[var(--light-sage)] rounded-xl gap-1 shadow-xs">
                  <button
                    type="button"
                    id="tab-traveler"
                    onClick={() => handleRoleSwitch("traveler")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeRole === "traveler"
                        ? "bg-[var(--forest)] text-white shadow-sm"
                        : "text-[var(--slate)] hover:text-[var(--charcoal)] hover:bg-[var(--sage)]"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    Traveler
                  </button>
                  <button
                    type="button"
                    id="tab-provider"
                    onClick={() => handleRoleSwitch("provider")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeRole === "provider"
                        ? "bg-[var(--teal)] text-white shadow-sm"
                        : "text-[var(--slate)] hover:text-[var(--charcoal)] hover:bg-[var(--sage)]"
                    }`}
                  >
                    <Hotel className="w-3.5 h-3.5" />
                    Stay Provider
                  </button>
                </div>
              </div>

              {/* Provider context badge */}
              {activeRole === "provider" && (
                <div className="mb-4 flex items-start gap-2.5 p-3 bg-teal-50 border border-teal-200 rounded-xl animate-slide-down">
                  <Building className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-teal-800 leading-relaxed">
                    <strong>Accommodation Provider Portal</strong> — Hotels, homestays, hostels, resorts, govt stays, guest houses, and eco-lodges.
                  </p>
                </div>
              )}

              {/* Error banners */}
              {authError && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start gap-2 animate-slide-down">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold mb-0.5">Email Link Issue</strong>
                    {authError}. Please request a new confirmation email.
                  </div>
                </div>
              )}
              {error && (
                <div className="mb-4 p-3 bg-[var(--error-bg)] border border-[var(--error)]/30 text-[var(--error)] text-xs rounded-xl flex items-start gap-2 animate-slide-down">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Google sign-in — traveler only */}
              {activeRole === "traveler" && (
                <>
                  <GoogleSignInButton
                    onSuccess={() => router.push("/dashboard")}
                    onError={(msg) => setError(msg)}
                  />
                  <div className="relative flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-[var(--light-sage)]" />
                    <span className="text-[11px] font-medium text-[var(--slate-light)] whitespace-nowrap">
                      or continue with email
                    </span>
                    <div className="flex-1 h-px bg-[var(--light-sage)]" />
                  </div>
                </>
              )}

              {/* ── Login Form ──────────────────────────────────────────────── */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-[var(--charcoal-80)]">
                    {activeRole === "traveler" ? "Email address" : "Business email"}
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--slate-light)] transition-colors group-focus-within:text-[var(--teal)]" />
                    <input
                      id="login-email"
                      type="email"
                      className="input-field pl-10 text-sm"
                      placeholder={activeRole === "traveler" ? "you@example.com" : "contact@hotelproperty.com"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-[var(--charcoal-80)]">
                      Password
                    </label>
                    {activeRole === "provider" ? (
                      <Link
                        href="/hotel/forgot-password"
                        className="text-xs font-semibold text-[var(--teal)] hover:text-[var(--forest)] hover:underline transition-colors"
                      >
                        Forgot password?
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setShowResetPanel(!showResetPanel); setResetSuccess(false); }}
                        className="text-xs font-semibold text-[var(--teal)] hover:text-[var(--forest)] hover:underline transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--slate-light)] transition-colors group-focus-within:text-[var(--teal)]" />
                    <input
                      id="login-password"
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
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--slate-light)] hover:text-[var(--charcoal)] transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Inline password reset (traveler only) */}
                {activeRole === "traveler" && showResetPanel && (
                  <div className="p-3.5 bg-[var(--sage)] border border-[var(--light-sage)] rounded-xl space-y-2.5 text-xs animate-slide-down">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--charcoal)]">Reset your password</span>
                      <button
                        type="button"
                        onClick={() => { setShowResetPanel(false); setResetSuccess(false); }}
                        className="text-[var(--slate)] hover:text-[var(--charcoal)] transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {resetSuccess ? (
                      <div className="flex items-center gap-1.5 text-[var(--success)] font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        Reset link sent! Check your inbox.
                      </div>
                    ) : (
                      <>
                        <p className="text-[var(--slate)]">
                          We&apos;ll send a reset link to <strong>{email || "your email"}</strong>.
                        </p>
                        <button
                          type="button"
                          onClick={handleTravelerReset}
                          disabled={resetLoading || !email}
                          className="w-full py-2 rounded-lg bg-[var(--forest)] text-white font-bold text-xs hover:bg-[var(--forest-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          {resetLoading ? (
                            <span className="flex items-center justify-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…
                            </span>
                          ) : (
                            "Send Reset Link"
                          )}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Remember me */}
                {activeRole === "traveler" && (
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div
                      onClick={() => setRememberMe(!rememberMe)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                        rememberMe
                          ? "bg-[var(--forest)] border-[var(--forest)]"
                          : "border-[var(--light-sage)] group-hover:border-[var(--teal)]"
                      }`}
                    >
                      {rememberMe && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="text-xs text-[var(--slate)] select-none">Remember me for 30 days</span>
                  </label>
                )}

                {/* Submit */}
                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 justify-center font-bold text-sm shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in…
                    </>
                  ) : activeRole === "provider" ? (
                    <>
                      Sign In to Provider Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              {/* Resend confirm email */}
              {authError && email && activeRole === "traveler" && (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full mt-3 py-2 text-xs text-[var(--teal)] hover:text-[var(--forest)] font-bold transition-colors text-center"
                >
                  Resend confirmation email →
                </button>
              )}

              {/* ── Footer Links ──────────────────────────────────────────── */}
              <div className="mt-6 pt-5 border-t border-[var(--light-sage)] space-y-3">
                {activeRole === "provider" ? (
                  <div className="text-center">
                    <p className="text-xs text-[var(--slate)] mb-2">Don&apos;t have a provider account yet?</p>
                    <Link
                      href="/hotel/register"
                      className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl border border-[var(--teal)] text-[var(--teal)] hover:bg-[var(--teal)] hover:text-white font-bold text-xs transition-all"
                    >
                      Register as Stay Provider →
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--slate)]">
                      New to Wanderly?{" "}
                      <Link href="/signup" className="font-bold text-[var(--forest)] hover:underline">
                        Create account
                      </Link>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRoleSwitch("provider")}
                      className="inline-flex items-center gap-1 text-[var(--slate)] hover:text-[var(--forest)] font-medium hover:underline transition-colors cursor-pointer"
                    >
                      <Hotel className="w-3 h-3" /> Provider?
                    </button>
                  </div>
                )}
              </div>

              {/* Admin link — subtle, not visible in main UI */}
              <div className="mt-4 text-center">
                <Link
                  href="/admin/login"
                  className="text-[10px] text-[var(--slate-light)] hover:text-[var(--slate)] transition-colors"
                >
                  Platform admin →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--cream)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--forest)]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
