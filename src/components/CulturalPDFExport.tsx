"use client";

import React, { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { exportCulturalGuidePDF, resolveTripLanguage } from "@/lib/pdf";
import type { CulturalHeritageData } from "@/lib/cultural";

interface CulturalPDFExportProps {
  culturalData: CulturalHeritageData;
  mode: "trip" | "place";
  /** The language of this cultural data / trip */
  globalLanguage?: string;
  language?: string;
  /** Optional trip data for trip-mode PDFs */
  tripData?: any;
  className?: string;
}

export default function CulturalPDFExport({
  culturalData,
  mode,
  globalLanguage = "en",
  language: propLanguage,
  tripData,
  className = "",
}: CulturalPDFExportProps) {
  const [generating, setGenerating] = useState(false);

  const handleExport = async () => {
    if (generating || !culturalData) return;
    setGenerating(true);
    try {
      // Determine the PDF language:
      // 1. Explicit prop language if provided
      // 2. If mode === "trip" and tripData is present, use trip's planning language
      // 3. Fallback to globalLanguage
      let targetLang = propLanguage;
      if (!targetLang && mode === "trip" && tripData) {
        targetLang = resolveTripLanguage(tripData, globalLanguage);
      }
      if (!targetLang) {
        targetLang = globalLanguage || "en";
      }

      await exportCulturalGuidePDF(
        culturalData,
        mode,
        targetLang,
        mode === "trip" ? tripData : undefined
      );
    } catch (err) {
      console.error("[CulturalPDFExport] Error:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={generating}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--light-sage)] bg-white text-xs font-bold text-[var(--forest)] hover:bg-[var(--sage)] hover:border-[var(--forest)] transition-all shadow-xs active:scale-95 disabled:opacity-60 ${className}`}
      title="Export Cultural Guide PDF"
    >
      {generating ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Generating PDF...</span>
        </>
      ) : (
        <>
          <FileText className="w-3.5 h-3.5" />
          <span>Export Cultural Guide</span>
        </>
      )}
    </button>
  );
}
