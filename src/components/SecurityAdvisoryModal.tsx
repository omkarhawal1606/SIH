"use client";

import React, { useState } from "react";
import { ShieldAlert, AlertTriangle, X, ChevronDown, ChevronUp, CheckCircle, ShieldCheck } from "lucide-react";

interface SecurityAdvisoryModalProps {
  destination: string;
  safetyLevel?: "safe" | "caution" | "unsafe";
  safetyWarning?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SecurityAdvisoryModal({
  destination,
  safetyLevel = "unsafe",
  safetyWarning,
  isOpen,
  onClose,
}: SecurityAdvisoryModalProps) {
  const [showDetailedGuidelines, setShowDetailedGuidelines] = useState(false);

  if (!isOpen || !safetyWarning || safetyLevel === "safe") return null;

  const isCritical = safetyLevel === "unsafe";

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="security-modal-title"
    >
      <div
        className={`bg-white border rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-scale-in relative overflow-hidden ${
          isCritical ? "border-[var(--error)]/40 ring-4 ring-[var(--error)]/10" : "border-[var(--warning)]/40 ring-4 ring-[var(--warning)]/10"
        }`}
      >
        {/* Top Warning Banner Stripe */}
        <div
          className={`absolute top-0 left-0 right-0 h-2 ${
            isCritical ? "bg-[var(--error)]" : "bg-[var(--warning)]"
          }`}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5 pt-1">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                isCritical ? "bg-[var(--error-bg)] text-[var(--error)] border border-[var(--error)]/30" : "bg-[var(--warning-bg)] text-[var(--warning)] border border-[var(--sand)]"
              }`}
            >
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                  isCritical
                    ? "bg-[var(--error-bg)] text-[var(--error)] border-[var(--error)]/30"
                    : "bg-[var(--warning-bg)] text-[#7A5C00] border-[var(--sand)]"
                }`}
              >
                {isCritical ? "Active Security Alert" : "Travel Caution Advisory"}
              </span>
              <h2 id="security-modal-title" className="text-xl font-extrabold text-[var(--charcoal)] tracking-tight mt-1">
                {destination}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--slate)] hover:bg-[var(--sage)] hover:text-[var(--charcoal)] transition-colors"
            aria-label="Close Advisory"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Advisory Content Body */}
        <div className="space-y-4">
          <div
            className={`p-4 rounded-xl border text-sm leading-relaxed ${
              isCritical
                ? "bg-[var(--error-bg)] border-[var(--error)]/25 text-[var(--charcoal)]"
                : "bg-[var(--warning-bg)] border-[var(--sand)] text-[var(--charcoal)]"
            }`}
          >
            <p className="font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5 text-[var(--error)]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Official Threat Summary
            </p>
            <p className="text-xs sm:text-sm font-medium text-[var(--charcoal-80)]">
              {safetyWarning}
            </p>
          </div>

          {/* Toggleable Guidelines */}
          <div className="bg-[var(--cream)] border border-[var(--light-sage)] rounded-xl overflow-hidden">
            <button
              onClick={() => setShowDetailedGuidelines(!showDetailedGuidelines)}
              className="w-full px-4 py-3 text-xs font-bold text-[var(--charcoal)] hover:bg-[var(--sage)] transition-colors flex items-center justify-between"
            >
              <span>View Safety Precautions & Protocol</span>
              {showDetailedGuidelines ? (
                <ChevronUp className="w-4 h-4 text-[var(--slate)]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[var(--slate)]" />
              )}
            </button>

            {showDetailedGuidelines && (
              <div className="px-4 pb-4 pt-1 border-t border-[var(--light-sage)] space-y-2 text-xs text-[var(--slate)] bg-white">
                <div className="flex items-start gap-2 pt-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[var(--forest)] shrink-0 mt-0.5" />
                  <span>Register with your local embassy prior to departure.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[var(--forest)] shrink-0 mt-0.5" />
                  <span>Save local emergency hotlines in your contacts.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[var(--forest)] shrink-0 mt-0.5" />
                  <span>Monitor local news broadcasts for active area curfews.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-[var(--light-sage)]">
          <button
            onClick={() => setShowDetailedGuidelines(!showDetailedGuidelines)}
            className="btn-secondary text-xs py-2.5 px-4 font-bold justify-center"
          >
            {showDetailedGuidelines ? "Hide Details" : "View Advisory Details"}
          </button>
          <button
            onClick={onClose}
            className={`flex-1 font-bold text-xs py-2.5 px-5 rounded-lg transition-all text-white shadow-sm flex items-center justify-center gap-1.5 ${
              isCritical
                ? "bg-[var(--error)] hover:bg-red-700"
                : "bg-[var(--forest)] hover:bg-[var(--forest-light)]"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Acknowledge & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
