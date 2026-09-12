"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signupWithEmail } from "@/lib/db";
import EmailConfirmModal from "@/components/EmailConfirmModal";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import {
  Plane,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Hotel,
  MapPin,
  Star,
} from "lucide-react";

// ── Password strength helpers ──────────────────────────────────────────────────
function getStrength(password: string): { score: number; label: string; color: string } {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[!@#$%^&*(),.?":{}|<>]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  if (score <= 1) return { score, label: "Very weak", color: "#D95C5C" };
  if (score === 2) return { score, label: "Weak", color: "#E8A22A" };
  if (score === 3) return { score, label: "Fair", color: "#C49A2A" };
  if (score === 4) return { score, label: "Good", color: "#2F8F6B" };
  return { score, label: "Strong", color: "#164E3D" };
}

const REQUIREMENTS = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
  { label: "Special character", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

// ── Travel highlights for the side panel ──────────────────────────────────────
const PERKS = [
  { icon: "🗺️", title: "AI Trip Planner", desc: "Get personalized itineraries in seconds" },
  { icon: "🏨", title: "Curated Stays", desc: "Vetted accommodations from local providers" },
  { icon: "💱", title: "Budget Tracker", desc: "Real-time expenses and currency conversion" },
  { icon: "🌏", title: "Cultural Guides", desc: "Heritage and local insights for 120+ destinations" },
];

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Derived state
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const reqs = REQUIREMENTS.map((r) => ({ ...r, met: r.test(password) }));
  const isPasswordValid = reqs.every((r) => r.met);
  const strength = password.length > 0 ? getStrength(password) : null;
  const canSubmit = name.trim().length >= 2 && emailIsValid && isPasswordValid && passwordsMatch && agreedToTerms;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      const { user } = await signupWithEmail(email, password);
      if (user?.emailVerified) {
        router.push("/");
      } else {
        setShowConfirmModal(true);
      }
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Please sign in instead.");
      } else {
        setError(err.message || "Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showConfirmModal && (
        <EmailConfirmModal
          email={email}
          onVerified={() => router.push("/")}
        />
      )}

      <div className="min-h-screen flex">
        {/* ── Left: Feature Hero Panel ──────────────────────────────────────── */}
        <div
          className="hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-between relative overflow-hidden"
          style={{ background: "linear-gradient(160deg, #0F3629 0%, #164E3D 45%, #1F6B52 100%)" }}
        >
          {/* Dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          {/* Top Logo */}
          <div className="relative z-10 p-8 xl:p-10">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Plane className="w-4.5 h-4.5 text-white rotate-[-45deg]" />
              </div>
              <span className="text-white text-xl font-black tracking-tight">Wanderly</span>
            </Link>
          </div>

          {/* Central Content */}
          <div className="relative z-10 px-8 xl:px-10 pb-4">
            <div className="mb-7">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-300/80 mb-4">
                <Star className="w-3 h-3 fill-current" /> Start for free
              </span>
              <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight mb-3">
                Your journey starts<br />
                <span className="text-emerald-300">here.</span>
              </h2>
              <p className="text-sm text-white/60 leading-relaxed max-w-xs">
                Join thousands of travelers who plan smarter, stay better, and explore deeper with Wanderly.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-2.5 mb-8">
              {PERKS.map((perk) => (
                <div
                  key={perk.title}
                  className="flex items-center gap-3.5 bg-white/5 border border-white/10 rounded-xl p-3.5"
                >
                  <span className="text-xl shrink-0">{perk.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-white">{perk.title}</div>
                    <div className="text-[10px] text-white/50 mt-0.5">{perk.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="relative z-10 px-8 xl:px-10 pb-8 xl:pb-10">
            <div className="border-t border-white/10 pt-5 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-white/30 shrink-0" />
              <p className="text-[10px] text-white/30">
                Used by explorers in 80+ countries worldwide.
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: Signup Form Panel ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-screen bg-[var(--cream)] overflow-y-auto">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-between px-5 pt-5 pb-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 bg-[var(--forest)] rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-white rotate-[-45deg]" />
              </div>
              <span className="text-lg font-black text-[var(--charcoal)]">Wanderly</span>
            </Link>
            <Link href="/login" className="text-xs font-bold text-[var(--forest)] hover:underline">
              Sign in →
            </Link>
          </div>

          <div className="flex-1 flex items-center justify-center px-5 py-8 sm:px-8 md:px-12 lg:px-10 xl:px-16">
            <div className="w-full max-w-[420px] animate-fade-in">

              {/* Heading */}
              <div className="mb-7">
                <h1 className="text-2xl sm:text-3xl font-black text-[var(--charcoal)] tracking-tight mb-1.5">
                  Create your account
                </h1>
                <p className="text-sm text-[var(--slate)]">
                  Free forever. No credit card required.
                </p>
              </div>

              {/* Error banner */}
              {error && (
                <div className="mb-4 p-3 bg-[var(--error-bg)] border border-[var(--error)]/30 text-[var(--error)] text-xs rounded-xl flex items-start gap-2 animate-slide-down">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Google Sign-Up */}
              <GoogleSignInButton
                label="Sign up with Google"
                onSuccess={() => router.push("/")}
                onError={(msg) => setError(msg)}
              />

              <div className="relative flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-[var(--light-sage)]" />
                <span className="text-[11px] font-medium text-[var(--slate-light)] whitespace-nowrap">
                  or sign up with email
                </span>
                <div className="flex-1 h-px bg-[var(--light-sage)]" />
              </div>

              {/* ── Form ──────────────────────────────────────────────────────── */}
              <form onSubmit={handleSignup} className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label htmlFor="signup-name" className="block text-xs font-bold uppercase tracking-wider text-[var(--charcoal-80)]">
                    Full name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--slate-light)] transition-colors group-focus-within:text-[var(--teal)]" />
                    <input
                      id="signup-name"
                      type="text"
                      className="input-field pl-10 text-sm"
                      placeholder="Alex Johnson"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="signup-email" className="block text-xs font-bold uppercase tracking-wider text-[var(--charcoal-80)]">
                    Email address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--slate-light)] transition-colors group-focus-within:text-[var(--teal)]" />
                    <input
                      id="signup-email"
                      type="email"
                      className="input-field pl-10 text-sm"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label htmlFor="signup-password" className="block text-xs font-bold uppercase tracking-wider text-[var(--charcoal-80)]">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--slate-light)] transition-colors group-focus-within:text-[var(--teal)]" />
                    <input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      className="input-field pl-10 pr-10 text-sm"
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
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

                  {/* Strength bar + requirements */}
                  {password.length > 0 && strength && (
                    <div className="mt-2 space-y-2 animate-slide-down">
                      {/* Strength bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[var(--slate)]">Password strength</span>
                          <span
                            className="text-[10px] font-bold transition-colors"
                            style={{ color: strength.color }}
                          >
                            {strength.label}
                          </span>
                        </div>
                        <div className="flex gap-1 h-1.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <div
                              key={s}
                              className="flex-1 rounded-full transition-all duration-300"
                              style={{
                                background: s <= strength.score ? strength.color : "var(--light-sage)",
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Requirements grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-3 bg-[var(--sage)] rounded-xl border border-[var(--light-sage)]">
                        {reqs.map((req) => (
                          <div
                            key={req.label}
                            className={`flex items-center gap-1.5 text-[10px] transition-colors ${
                              req.met ? "text-[var(--success)]" : "text-[var(--slate-light)]"
                            }`}
                          >
                            <div
                              className={`w-3 h-3 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                req.met ? "bg-[var(--success)]" : "bg-[var(--light-sage)]"
                              }`}
                            >
                              {req.met && <CheckCircle2 className="w-2 h-2 text-white" />}
                            </div>
                            {req.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label htmlFor="signup-confirm" className="block text-xs font-bold uppercase tracking-wider text-[var(--charcoal-80)]">
                    Confirm password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--slate-light)] transition-colors group-focus-within:text-[var(--teal)]" />
                    <input
                      id="signup-confirm"
                      type={showConfirmPassword ? "text" : "password"}
                      className={`input-field pl-10 pr-10 text-sm transition-all ${
                        confirmPassword.length > 0
                          ? passwordsMatch
                            ? "border-[var(--success)] focus:border-[var(--success)]"
                            : "border-[var(--error)] focus:border-[var(--error)]"
                          : ""
                      }`}
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--slate-light)] hover:text-[var(--charcoal)] transition-colors"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="text-[11px] text-[var(--error)] flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3" /> Passwords do not match
                    </p>
                  )}
                  {confirmPassword.length > 0 && passwordsMatch && (
                    <p className="text-[11px] text-[var(--success)] flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3" /> Passwords match
                    </p>
                  )}
                </div>

                {/* Terms checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <div
                    onClick={() => setAgreedToTerms(!agreedToTerms)}
                    className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      agreedToTerms
                        ? "bg-[var(--forest)] border-[var(--forest)]"
                        : "border-[var(--light-sage)] group-hover:border-[var(--teal)]"
                    }`}
                  >
                    {agreedToTerms && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className="text-[11px] text-[var(--slate)] leading-relaxed select-none">
                    I agree to the{" "}
                    <Link href="/terms" className="font-bold text-[var(--forest)] hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="font-bold text-[var(--forest)] hover:underline">
                      Privacy Policy
                    </Link>
                  </span>
                </label>

                {/* Submit */}
                <button
                  id="signup-submit"
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="btn-primary w-full py-3 justify-center font-bold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              {/* Footer links */}
              <div className="mt-6 pt-5 border-t border-[var(--light-sage)] space-y-3">
                <p className="text-xs text-[var(--slate)] text-center">
                  Already have an account?{" "}
                  <Link href="/login" className="font-bold text-[var(--forest)] hover:underline">
                    Sign in
                  </Link>
                </p>

                <div className="flex items-center justify-center gap-1.5">
                  <Hotel className="w-3.5 h-3.5 text-[var(--teal)]" />
                  <p className="text-xs text-[var(--slate)]">
                    Property owner?{" "}
                    <Link
                      href="/hotel/register"
                      className="font-bold text-[var(--teal)] hover:underline"
                    >
                      Register as Stay Provider
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
