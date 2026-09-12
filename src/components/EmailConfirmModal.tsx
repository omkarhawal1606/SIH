"use client";

import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import { Mail, X, Loader2, CheckCircle2, XCircle, RefreshCw, Clock } from "lucide-react";

interface EmailConfirmModalProps {
  email: string;
  onClose?: () => void;
  onVerified?: () => void;
}

type ResendState = "idle" | "loading" | "success" | "error" | "ratelimit";

export default function EmailConfirmModal({ email, onClose, onVerified }: EmailConfirmModalProps) {
  const [resendState, setResendState] = useState<ResendState>("idle");
  const [resendError, setResendError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Poll every 3s — reload the Firebase user token and check emailVerified
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        // Force-refresh the user token so emailVerified reflects the latest state
        await user.reload();
        if (user.emailVerified) {
          clearInterval(interval);
          onVerified?.();
        }
      } catch {
        // Silently ignore transient network errors during polling
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [onVerified]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || resendState === "loading") return;
    setResendState("loading");
    setResendError("");
    try {
      const user = auth.currentUser;
      if (!user) {
        setResendState("error");
        setResendError("Session expired. Please sign up again.");
        return;
      }
      await sendEmailVerification(user);
      setResendState("success");
      setCooldown(60);
      setTimeout(() => setResendState("idle"), 4000);
    } catch (err: any) {
      const msg: string = err?.message || "";
      if (msg.toLowerCase().includes("too-many-requests") || err?.code === "auth/too-many-requests") {
        setResendState("ratelimit");
        setCooldown(60);
      } else {
        setResendState("error");
        setResendError(err?.message || "Network error. Check your connection.");
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-8 max-w-md w-full shadow-xl animate-scale-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="w-12 h-12 bg-[var(--sage)] rounded-xl flex items-center justify-center border border-[var(--light-sage)] shrink-0">
            <Mail className="w-6 h-6 text-[var(--forest)]" />
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[var(--sage)] rounded-lg transition-colors text-[var(--slate)] hover:text-[var(--charcoal)] ml-4 mt-0.5"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <h2 id="confirm-modal-title" className="text-xl font-bold text-[var(--charcoal)] mb-2">
          Confirm your email
        </h2>
        <p className="text-sm text-[var(--slate)] mb-1">
          We sent a confirmation link to:
        </p>
        <div className="font-semibold text-sm text-[var(--charcoal)] mb-5 bg-[var(--sage)] border border-[var(--light-sage)] rounded-lg px-3.5 py-2.5 truncate font-mono">
          {email}
        </div>

        <p className="text-sm text-[var(--slate)] leading-relaxed mb-5">
          Click the link in your inbox to verify your account. This page will redirect
          automatically once verified. Check your <strong className="text-[var(--charcoal-80)]">spam folder</strong> if
          you don&apos;t see the email.
        </p>

        {/* Auto-checking indicator */}
        <div className="flex items-center gap-2 text-xs text-[var(--slate)] mb-6 bg-[var(--sage)] border border-[var(--light-sage)] rounded-lg px-3.5 py-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse shrink-0" />
          Checking for verification automatically…
        </div>

        {/* Feedback messages */}
        {resendState === "success" && (
          <div className="flex items-center gap-2 text-sm text-[var(--success)] bg-[var(--success-bg)] border border-[var(--success)]/20 rounded-lg px-3.5 py-2.5 mb-3">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Confirmation email resent successfully!
          </div>
        )}
        {resendState === "error" && (
          <div className="flex items-center gap-2 text-sm text-[var(--error)] bg-[var(--error-bg)] border border-[var(--error)]/20 rounded-lg px-3.5 py-2.5 mb-3">
            <XCircle className="w-4 h-4 shrink-0" />
            {resendError || "Failed to resend. Try again."}
          </div>
        )}
        {resendState === "ratelimit" && (
          <div className="flex items-center gap-2 text-sm text-[var(--warning)] bg-[var(--warning-bg)] border border-[var(--sand)]/50 rounded-lg px-3.5 py-2.5 mb-3">
            <Clock className="w-4 h-4 shrink-0" />
            Too many requests. Wait {cooldown}s before trying again.
          </div>
        )}

        <button
          onClick={handleResend}
          disabled={resendState === "loading" || cooldown > 0}
          className="btn-secondary w-full justify-center py-2.5"
        >
          {resendState === "loading" ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
          ) : cooldown > 0 ? (
            <><Clock className="w-4 h-4" /> Resend in {cooldown}s</>
          ) : (
            <><RefreshCw className="w-4 h-4" /> Resend Confirmation Email</>
          )}
        </button>
      </div>
    </div>
  );
}
