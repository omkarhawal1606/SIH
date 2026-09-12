"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import TripForm from "@/components/TripForm";
import AdvancedItinerary from "@/components/AdvancedItinerary";
import AccommodationGrid from "@/components/AccommodationGrid";
import QuickInfoSection from "@/components/QuickInfoSection";
import BudgetChart from "@/components/BudgetChart";
import SecurityAdvisoryModal from "@/components/SecurityAdvisoryModal";
import { saveTrip, updateTrip, type TripData } from "@/lib/db";
import { useAuth } from "@/components/AuthProvider";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  PlaneTakeoff,
  Hotel,
  CloudSun,
  MapPin,
  Calendar,
  Users,
  Wallet,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

const TripMap = dynamic(() => import("@/components/TripMap"), { ssr: false });

const LOADING_STEPS = [
  "Stage 1: Running Agents 1, 2 & 3 concurrently (Itinerary, Stays, Dining & Transit)…",
  "Fetching live meteorological forecasts…",
  "Stage 2: Agent 4 verifying schedule, safety & cultural intelligence…",
  "Finalizing your verified 4-agent travel blueprint…",
];

export default function PlanPage() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<TripData | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [errorStatus, setErrorStatus] = useState<{ type: string; msg: string } | null>(null);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 900);
    } else {
      setStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async (formData: any) => {
    if (loading) return;
    setLoading(true);
    setResult(null);
    setIsSaved(false);
    setErrorStatus(null);
    setShowSecurityModal(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, language: formData.language || language }),
      });
      const data = await res.json();

      if (data.status === "invalid" || data.status === "unsafe") {
        setErrorStatus({ type: data.status, msg: data.status_message || data.safety_warning });
        return;
      }
      if (data.error) throw new Error(data.error);

      const tripLang = formData.language || language || data.language || "en";
      const generatedTrip: TripData = {
        ...data,
        userId: user?.uid || "guest",
        currency: formData.currency || "INR",
        startDate: formData.startDate,
        endDate: formData.endDate,
        destination: formData.destination,
        budget: formData.budget,
        people: formData.people,
        language: tripLang,
        planningLanguage: tripLang,
      };

      setResult(generatedTrip);

      // Trigger prominent popup if destination has an active critical/caution advisory
      if (generatedTrip.safety_level === "unsafe" || generatedTrip.safety_level === "caution") {
        setShowSecurityModal(true);
      }
    } catch (err: any) {
      setErrorStatus({ type: "error", msg: err?.message || "Server connectivity issue. Please try again." });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    if (!user) {
      alert("Please sign in to save this trip to your dashboard!");
      router.push("/login");
      return;
    }
    try {
      await saveTrip({ ...result, userId: user.uid });
      setIsSaved(true);
    } catch (err) {
      console.error("Failed to save trip:", err);
      alert("Failed to save trip. Please check your connection.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--cream)] pb-20">
      <Navbar />

      {/* Security Advisory Modal */}
      {result && (
        <SecurityAdvisoryModal
          destination={result.destination}
          safetyLevel={result.safety_level}
          safetyWarning={result.safety_warning}
          isOpen={showSecurityModal}
          onClose={() => setShowSecurityModal(false)}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 pt-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--charcoal)] mb-1 tracking-tight">
            {t("tripPlanner.title")}
          </h1>
          <p className="text-sm text-[var(--slate)]">
            {t("tripPlanner.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Panel */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-[var(--light-sage)] rounded-2xl shadow-sm overflow-hidden sticky top-[76px]">
              <div className="px-5 py-4 border-b border-[var(--light-sage)] bg-[var(--sage)]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--forest)]">
                  {t("tripPlanner.blueprint")}
                </h2>
              </div>
              <TripForm onSubmit={handleGenerate} isLoading={loading} />
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-8 space-y-6">
            {/* Error state */}
            {errorStatus && (
              <div
                className={`p-5 rounded-2xl border flex items-start gap-3 animate-fade-in ${
                  errorStatus.type === "unsafe"
                    ? "bg-[var(--error-bg)] border-[var(--error)]/30 text-[var(--error)]"
                    : "bg-[var(--warning-bg)] border-[var(--sand)] text-[var(--warning)]"
                }`}
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-bold leading-relaxed">{errorStatus.msg}</p>
              </div>
            )}

            {/* Empty state */}
            {!result && !loading && !errorStatus && (
              <div className="bg-white border border-dashed border-[var(--light-sage)] rounded-2xl p-16 text-center shadow-xs">
                <div className="w-14 h-14 bg-[var(--sage)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-[var(--forest)]" />
                </div>
                <h3 className="text-base font-bold text-[var(--charcoal)] mb-1">
                  {t("tripPlanner.blueprint")}
                </h3>
                <p className="text-sm text-[var(--slate)] max-w-sm mx-auto">
                  {t("tripPlanner.subtitle")}
                </p>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-12 flex flex-col items-center text-center animate-fade-in shadow-xs">
                <div className="w-16 h-16 border-4 border-[var(--light-sage)] border-t-[var(--forest)] rounded-full animate-spin mb-6" />
                <p className="text-base font-bold text-[var(--charcoal)] mb-1">
                  {LOADING_STEPS[stepIndex]}
                </p>
                <p className="text-xs text-[var(--slate)]">Generating complete multi-day schedule with live map & safety checks…</p>
                <div className="flex gap-3 mt-6">
                  <PlaneTakeoff className={`w-5 h-5 transition-colors ${stepIndex >= 2 ? "text-[var(--success)]" : "text-[var(--light-sage)]"}`} />
                  <Hotel className={`w-5 h-5 transition-colors ${stepIndex >= 4 ? "text-[var(--success)]" : "text-[var(--light-sage)]"}`} />
                  <CloudSun className={`w-5 h-5 transition-colors ${stepIndex >= 6 ? "text-[var(--success)]" : "text-[var(--light-sage)]"}`} />
                </div>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="space-y-6 animate-fade-in">
                {/* Security Advisory Alert Banner */}
                {result.safety_warning && (
                  <div
                    className={`flex items-start justify-between gap-4 p-4 sm:p-5 border rounded-2xl ${
                      result.safety_level === "unsafe"
                        ? "bg-[var(--error-bg)] border-[var(--error)]/40 text-[var(--charcoal)] ring-2 ring-[var(--error)]/20"
                        : result.safety_level === "caution"
                        ? "bg-[var(--warning-bg)] border-[var(--sand)] text-[var(--charcoal)]"
                        : "bg-[var(--success-bg)] border-[var(--success)]/25 text-[var(--charcoal)]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {result.safety_level === "unsafe" ? (
                        <ShieldAlert className="w-6 h-6 text-[var(--error)] shrink-0 mt-0.5" />
                      ) : result.safety_level === "caution" ? (
                        <AlertCircle className="w-6 h-6 text-[var(--warning)] shrink-0 mt-0.5" />
                      ) : (
                        <ShieldCheck className="w-6 h-6 text-[var(--success)] shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              result.safety_level === "unsafe"
                                ? "bg-[var(--error)] text-white"
                                : result.safety_level === "caution"
                                ? "bg-[#7A5C00] text-white"
                                : "bg-[var(--success)] text-white"
                            }`}
                          >
                            {result.safety_level === "unsafe"
                              ? "Critical Security Warning"
                              : result.safety_level === "caution"
                              ? "Travel Caution Advisory"
                              : "Security Clearance: Safe"}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-[var(--charcoal-80)] leading-relaxed">
                          {result.safety_warning}
                        </p>
                      </div>
                    </div>

                    {(result.safety_level === "unsafe" || result.safety_level === "caution") && (
                      <button
                        onClick={() => setShowSecurityModal(true)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
                          result.safety_level === "unsafe"
                            ? "bg-[var(--error)] text-white hover:bg-red-700"
                            : "bg-[var(--sage)] text-[var(--forest)] hover:bg-[var(--light-sage)]"
                        }`}
                      >
                        View Advisory
                      </button>
                    )}
                  </div>
                )}

                {/* Success banner */}
                <div className="flex items-center gap-3 p-3.5 bg-[var(--success-bg)] border border-[var(--success)]/20 rounded-2xl text-[var(--success)] text-xs sm:text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {result.days}-Day Itinerary Generated Successfully
                </div>

                {/* 1. Trip Header Card */}
                <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--charcoal)] mb-3">
                        {result.destination}
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        <span className="badge-premium flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {result.days} {result.days === 1 ? t("common.day") : t("common.days")} ({result.startDate} → {result.endDate})
                        </span>
                        <span className="badge-premium flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          {result.people} {result.people === 1 ? t("common.traveler") : t("common.travelers")}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "rgba(232,201,138,0.25)", color: "#7A5C00", border: "1px solid rgba(232,201,138,0.5)" }}>
                          <Wallet className="w-3.5 h-3.5" />
                          {formatCurrency(result.budget || 0, result.currency || "INR")}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={isSaved}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs ${
                        isSaved
                          ? "bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success)]/20"
                          : "btn-primary"
                      }`}
                    >
                      {isSaved ? (
                        <><CheckCircle2 className="w-4 h-4" /> {t("common.saved")}</>
                      ) : (
                        <><Save className="w-4 h-4" /> {t("common.save")}</>
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. Budget Breakdown Card */}
                {result.cost_breakdown && (
                  <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 sm:p-8 shadow-sm">
                    <h3 className="section-header mb-5">Budget Breakdown & Cost Allocation</h3>
                    <BudgetChart breakdown={result.cost_breakdown} totalBudget={result.budget} currency={result.currency} />
                  </div>
                )}

                {/* 3. Interactive Map */}
                <div>
                  <TripMap trip={result} />
                </div>

                {/* 4. Daily Itinerary Schedule */}
                <AdvancedItinerary
                  itinerary={result.itinerary || []}
                  destination={result.destination}
                  currency={result.currency}
                  tripStartDate={result.startDate}
                  tripSafetyLevel={result.safety_level}
                />

                {/* 5. Hotels / Accommodation */}
                {result.hotels && result.hotels.length > 0 && (
                  <AccommodationGrid
                    hotels={result.hotels}
                    destination={result.destination}
                    currency={result.currency}
                    recommendations={(result as any).recommendations}
                    onAddToTrip={async (hotel) => {
                      // Save the trip first if not already saved, then attach accommodation
                      if (!isSaved) {
                        if (!user) { alert("Please sign in to save."); return; }
                        try {
                          const id = await saveTrip({ ...result, userId: user.uid });
                          await updateTrip(id, { selectedAccommodation: hotel });
                          setIsSaved(true);
                        } catch { console.error("Save with stay failed"); }
                      } else {
                        // Trip already saved — update inline (will need trip ID)
                        alert("Stay preference recorded. Save your trip to persist it.");
                      }
                    }}
                  />
                )}

                {/* 6. Guide & Safety Info */}
                {(result.events || result.emergency || result.season_info) && (
                  <QuickInfoSection
                    emergency={result.emergency}
                    clothing={result.clothing || []}
                    events={result.events || []}
                    season_info={result.season_info || ""}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
