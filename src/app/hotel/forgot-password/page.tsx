"use client";

import React, { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/db";
import { Hotel, Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function HotelForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");

    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err?.message || "Failed to send reset link. Please check your email address.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--cream)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 bg-[var(--forest)] rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Hotel className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-xl font-extrabold text-[var(--charcoal)] tracking-tight block">Wanderly</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--teal)] -mt-1 block">Provider Portal</span>
            </div>
          </Link>
          <h1 className="text-2xl font-black text-[var(--charcoal)] mb-1">Reset Provider Password</h1>
          <p className="text-[var(--slate)] text-sm">
            Enter your registered property email to receive a password reset link.
          </p>
        </div>

        <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-8 shadow-sm">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-[var(--charcoal)]">Reset Link Sent!</h2>
              <p className="text-xs text-[var(--slate)] leading-relaxed">
                If an account exists for <span className="font-semibold text-[var(--charcoal)]">{email}</span>, you will receive instructions to reset your password shortly.
              </p>
              <Link
                href="/hotel/login"
                className="btn-primary w-full py-3 justify-center text-sm font-bold shadow-2xs mt-4"
              >
                Back to Provider Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              {error && (
                <div className="bg-[var(--error-bg)] border border-[var(--error)]/30 text-[var(--error)] text-sm p-3.5 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="leading-snug">{error}</div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--forest)] mb-1.5">
                  Registered Business Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--slate-light)]" />
                  <input
                    type="email"
                    className="input-field pl-10"
                    placeholder="contact@hotelroyal.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 justify-center font-bold text-sm shadow-sm cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    Sending Reset Link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/hotel/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--teal)] hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Provider Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
