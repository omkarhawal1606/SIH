"use client";

import React, { useState, useEffect } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
  saveCulturalInfo,
  getCulturalInfoDocId,
} from "@/lib/db";
import type { CulturalHeritageData } from "@/lib/cultural";

interface SaveCulturalInfoProps {
  culturalData: CulturalHeritageData;
  mode: "trip" | "place";
  language: string;
  place: string;        // destination or place name
  tripId?: string;      // only for trip mode
  className?: string;
}

type SaveState = "idle" | "checking" | "saving" | "saved" | "error";

export default function SaveCulturalInfo({
  culturalData,
  mode,
  language,
  place,
  tripId,
  className = "",
}: SaveCulturalInfoProps) {
  const { user } = useAuth();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedDocId, setSavedDocId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Check on mount whether this cultural info was already saved
  useEffect(() => {
    if (!user || !place || !language) return;
    setSaveState("checking");
    getCulturalInfoDocId(place, language, tripId)
      .then((existingId) => {
        if (existingId) {
          setSavedDocId(existingId);
          setSaveState("saved");
        } else {
          setSaveState("idle");
        }
      })
      .catch(() => setSaveState("idle"));
  }, [user, place, language, tripId]);

  const handleSave = async () => {
    if (!user) {
      setErrorMsg("Please sign in to save cultural information.");
      setSaveState("error");
      return;
    }
    if (saveState === "saving" || saveState === "checking") return;

    setSaveState("saving");
    setErrorMsg("");

    try {
      const title =
        culturalData.overview?.title ||
        (mode === "trip" ? `${place} — Trip Cultural Guide` : `${place} — Cultural Guide`);

      const docId = await saveCulturalInfo({
        userId: user.uid,
        mode,
        title,
        place,
        tripId,
        language,
        culturalData: culturalData as any,
      });

      setSavedDocId(docId);
      setSaveState("saved");
    } catch (err: any) {
      console.error("[SaveCulturalInfo] Error:", err);
      setErrorMsg(err?.message || "Failed to save. Please try again.");
      setSaveState("error");
    }
  };

  if (!user) {
    return null; // Don't show the button for unauthenticated users
  }

  return (
    <div className={`flex flex-col items-start gap-1 ${className}`}>
      <button
        onClick={handleSave}
        disabled={saveState === "saving" || saveState === "checking" || saveState === "saved"}
        title={savedDocId ? "Cultural info already saved — click to update" : "Save this cultural guide to your profile"}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-xs
          ${saveState === "saved"
            ? "bg-[var(--sage)] border-[var(--forest)] text-[var(--forest)] cursor-default"
            : saveState === "error"
            ? "bg-[var(--error-bg)] border-[var(--error)]/40 text-[var(--error)] hover:bg-white"
            : "bg-white border-[var(--light-sage)] text-[var(--forest)] hover:bg-[var(--sage)] hover:border-[var(--forest)] active:scale-95"
          }
          disabled:opacity-70
        `}
      >
        {saveState === "checking" || saveState === "saving" ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {saveState === "checking" ? "Checking..." : "Saving..."}
          </>
        ) : saveState === "saved" ? (
          <>
            <BookmarkCheck className="w-3.5 h-3.5" />
            ✓ Saved
          </>
        ) : (
          <>
            <Bookmark className="w-3.5 h-3.5" />
            🔖 Save Cultural Info
          </>
        )}
      </button>

      {saveState === "error" && errorMsg && (
        <p className="text-[11px] text-[var(--error)] max-w-[240px]">{errorMsg}</p>
      )}

      {saveState === "saved" && (
        <button
          onClick={() => { setSaveState("idle"); setSavedDocId(null); }}
          className="text-[11px] text-[var(--slate)] hover:text-[var(--forest)] underline"
        >
          Update saved info
        </button>
      )}
    </div>
  );
}
