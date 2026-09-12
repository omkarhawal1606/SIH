"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { loginWithGoogle } from "@/lib/db";

interface GoogleSignInButtonProps {
  onSuccess: () => void;
  onError?: (message: string) => void;
  label?: string;
}

// Official Google "G" SVG logo — exact brand colors per Google guidelines
function GoogleLogo() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  label = "Continue with Google",
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await loginWithGoogle();
      onSuccess();
    } catch (err: any) {
      const code: string = err?.code || "";
      const message: string = err?.message || "";

      // User closed the popup — not an error, just ignore
      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        return;
      }

      // Popup blocked by browser
      if (code === "auth/popup-blocked") {
        onError?.("Popup was blocked by your browser. Please allow popups for this site and try again.");
        return;
      }

      // Network / account issues
      if (code === "auth/network-request-failed") {
        onError?.("Network error. Please check your connection and try again.");
        return;
      }

      if (code === "auth/account-exists-with-different-credential") {
        onError?.("An account with this email already exists using a different sign-in method. Please use email and password to sign in.");
        return;
      }

      onError?.(message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      id="google-signin-btn"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 bg-white border border-[var(--light-sage)] text-[var(--charcoal)] text-sm font-semibold rounded-xl py-3 px-4 transition-all hover:bg-[var(--sage)] hover:border-[var(--emerald)] hover:shadow-sm active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-[var(--slate)]" />
          <span>Connecting to Google…</span>
        </>
      ) : (
        <>
          <GoogleLogo />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
