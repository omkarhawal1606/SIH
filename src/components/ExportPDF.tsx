"use client";

import React, { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { exportTripPDF } from "@/lib/pdf";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface ExportPDFProps {
  trip: any;
  /** Optional language override; if not provided, automatically resolved from trip */
  language?: string;
  className?: string;
}

export default function ExportPDF({ trip, language: propLanguage, className = "" }: ExportPDFProps) {
  const { t, language: currentUiLanguage } = useTranslation();
  const [generating, setGenerating] = useState(false);

  const exportToPDF = async () => {
    if (generating || !trip) return;
    setGenerating(true);
    try {
      // exportTripPDF will automatically detect the trip's planning language
      // with multi-tier fallback (trip.planningLanguage -> trip.language -> content script -> currentUiLanguage -> 'en')
      await exportTripPDF(trip, propLanguage || undefined, currentUiLanguage);
    } catch (err) {
      console.error("[ExportPDF] Failed to export trip PDF:", err);
    } finally {
      setGenerating(false);
    }
  };

  const buttonText = t("common.exportPDF") || "Export PDF";

  return (
    <button
      type="button"
      onClick={exportToPDF}
      disabled={generating}
      className={`btn-secondary text-sm flex items-center gap-2 py-2 disabled:opacity-60 transition-all ${className}`}
      title="Download Trip PDF"
    >
      {generating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-[var(--forest)]" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <FileText className="w-4 h-4 text-[var(--forest)]" />
          <span>{buttonText}</span>
        </>
      )}
    </button>
  );
}
