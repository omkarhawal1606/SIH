"use client";

import React, { useState, useMemo } from "react";
import { type TripData } from "@/lib/types";
import { updateTrip } from "@/lib/db";
import { QRCodeSVG } from "qrcode.react";
import {
  Share2,
  Copy,
  Check,
  X,
  Globe,
  Lock,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";

function generateToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "t_" + Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
}

// Stable QR component wrapped in React.memo to prevent flickering/re-renders
const StableQRCode = React.memo(({ value }: { value: string }) => {
  return (
    <div className="bg-[var(--cream)] p-4 rounded-xl flex items-center justify-center w-[192px] h-[192px] mx-auto border border-[var(--light-sage)] shadow-sm">
      <QRCodeSVG value={value} size={160} />
    </div>
  );
});
StableQRCode.displayName = "StableQRCode";

export default function ShareTrip({ trip, onUpdate }: { trip: TripData; onUpdate?: (t: Partial<TripData>) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(trip.isPublic || false);
  const [token, setToken] = useState(trip.publicToken || "");
  const [loading, setLoading] = useState(false);

  // Memoize shareUrl so reference is stable
  const shareUrl = useMemo(() => {
    if (!token) return "";
    return `${typeof window !== "undefined" ? window.location.origin : ""}/shared-trip/${token}`;
  }, [token]);

  const enableSharing = async () => {
    setLoading(true);
    const newToken = generateToken();
    await updateTrip(trip.id!, { isPublic: true, publicToken: newToken });
    setIsPublic(true);
    setToken(newToken);
    onUpdate?.({ isPublic: true, publicToken: newToken });
    setLoading(false);
  };

  const disableSharing = async () => {
    setLoading(true);
    await updateTrip(trip.id!, { isPublic: false, publicToken: "" });
    setIsPublic(false);
    setToken("");
    onUpdate?.({ isPublic: false, publicToken: "" });
    setLoading(false);
  };

  const revokeAndRegenerate = async () => {
    setLoading(true);
    const newToken = generateToken();
    await updateTrip(trip.id!, { isPublic: true, publicToken: newToken });
    setToken(newToken);
    onUpdate?.({ isPublic: true, publicToken: newToken });
    setLoading(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-secondary text-sm flex items-center gap-2 py-2"
      >
        <Share2 className="w-4 h-4 text-[var(--forest)]" /> Share Trip
      </button>

      {showModal && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" 
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 max-w-md w-full shadow-xl overflow-hidden animate-scale-in" 
            onClick={e => e.stopPropagation()}
            style={{ minHeight: isPublic ? "450px" : "240px", transition: "min-height 0.2s ease-in-out" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-[var(--charcoal)] flex items-center gap-2">
                <Globe className="w-5 h-5 text-[var(--forest)]" />
                Share This Trip
              </h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-1 hover:bg-[var(--sage)] rounded-lg transition-colors text-[var(--slate)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle sharing */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--sage)] border border-[var(--light-sage)] mb-5">
              <div className="flex items-center gap-3">
                {isPublic
                  ? <Eye className="w-5 h-5 text-[var(--success)]" />
                  : <EyeOff className="w-5 h-5 text-[var(--slate)]" />
                }
                <div>
                  <p className="text-sm font-bold text-[var(--charcoal)]">{isPublic ? "Public Sharing Active" : "Public Sharing Disabled"}</p>
                  <p className="text-xs text-[var(--slate)]">
                    {isPublic ? "Anyone with the link can view this trip" : "Only you can see this trip"}
                  </p>
                </div>
              </div>
              <button
                onClick={isPublic ? disableSharing : enableSharing}
                disabled={loading}
                className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  isPublic
                    ? "bg-[var(--error-bg)] text-[var(--error)] hover:bg-red-200 border border-[var(--error)]/30"
                    : "btn-primary py-1.5 px-3.5 text-xs"
                }`}
              >
                {loading ? "..." : isPublic ? "Disable" : "Enable"}
              </button>
            </div>

            {isPublic && token && (
              <div className="space-y-4">
                {/* QR Code Container with stable rendering */}
                <StableQRCode value={shareUrl} />

                {/* Copy Link */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="input-field text-xs text-[var(--charcoal)] font-mono py-2 truncate flex-1"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`btn-primary text-xs py-2 px-3.5 shrink-0 ${copied ? "bg-[var(--success)] border-[var(--success)]" : ""}`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                <button
                  onClick={revokeAndRegenerate}
                  disabled={loading}
                  className="w-full py-2 text-xs font-semibold text-[var(--slate)] hover:text-[var(--forest)] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Revoke & Generate New Link
                </button>

                <p className="text-[11px] text-[var(--slate)] text-center leading-relaxed">
                  Only destination, itinerary, hotels, and budget breakdown are shared. Your personal account information is never exposed.
                </p>
              </div>
            )}

            {!isPublic && (
              <div className="text-center py-6 flex flex-col items-center gap-2 text-[var(--slate)]">
                <Lock className="w-8 h-8 opacity-40 text-[var(--forest)]" />
                <p className="text-sm">Enable public sharing to generate a shareable link and QR code.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
