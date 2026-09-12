"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  INTEREST_OPTIONS,
  type TripFormData,
  type AccommodationType,
  type TravelGroupType,
  type AccommodationPreferences,
} from "@/lib/types";
import { CURRENCIES, formatCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import {
  calculateRecommendedBudget,
  type TravelStyle,
  type TransportationMode,
} from "@/lib/budgetRecommender";
import {
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Compass,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  Sparkles,
  Car,
  Plane,
  Train,
  ShieldCheck,
  Hotel,
  Home,
  Landmark,
  BedDouble,
  TreePine,
  Wifi,
  Utensils,
  Accessibility,
  Snowflake,
  Waves,
} from "lucide-react";

interface TripFormProps {
  onSubmit: (data: TripFormData) => void;
  isLoading: boolean;
}

export default function TripForm({ onSubmit, isLoading }: TripFormProps) {
  const { t, language } = useTranslation();
  const [formData, setFormData] = useState<TripFormData>({
    destination: "",
    startDate: "",
    endDate: "",
    budget: 60000,
    people: 2,
    interests: [],
    currency: "INR",
    travelStyle: "moderate",
    transportation: "cab",
    transportationModes: ["cab"],
    accommodationPreferences: {
      types: ["hotel"],
      travelGroup: "couple",
      rooms: 1,
      amenities: ["wifi"],
    },
  });

  // Derive a single dominant mode for budget estimation (flight > cab > public)
  const getDominantMode = (modes: string[]): TransportationMode => {
    if (modes.includes("flight")) return "flight";
    if (modes.includes("cab")) return "cab";
    return "public";
  };

  const [budgetInput, setBudgetInput] = useState<string>("60000");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notifications, setNotifications] = useState<{ type: "warn" | "info"; msg: string }[]>([]);

  useEffect(() => {
    if (!isLoading) {
      setIsSubmitting(false);
    }
  }, [isLoading]);

  const getTomorrowStr = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split("T")[0];
  };

  const getDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const days = getDays();

  // Dynamic Minimum Budget Calculation (0ms, 0 API calls, updates in real time)
  const recommendedBudget = useMemo(() => {
    const modes = formData.transportationModes ?? [formData.transportation ?? "cab"];
    return calculateRecommendedBudget({
      destination: formData.destination,
      people: formData.people,
      days: days > 0 ? days : 3,
      rooms: formData.accommodationPreferences?.rooms,
      travelStyle: formData.travelStyle || "moderate",
      transportation: getDominantMode(modes),
      interests: formData.interests,
      currency: formData.currency,
      accommodationTypes: formData.accommodationPreferences?.types,
    });
  }, [
    formData.destination,
    formData.people,
    days,
    formData.travelStyle,
    formData.transportationModes,
    formData.transportation,
    formData.interests,
    formData.currency,
    formData.accommodationPreferences,
  ]);

  useEffect(() => {
    const notes: { type: "warn" | "info"; msg: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = formData.startDate ? new Date(formData.startDate) : null;
    const end = formData.endDate ? new Date(formData.endDate) : null;

    if (start && start <= today)
      notes.push({ type: "warn", msg: "Arrival must be at least tomorrow." });
    if (end && start && end <= start)
      notes.push({ type: "warn", msg: "Departure must be after arrival." });
    if (days > 14)
      notes.push({ type: "warn", msg: "Itineraries over 14 days may have simplified slots." });

    setNotifications(notes);
  }, [formData.startDate, formData.endDate, days]);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow positive digits (no negative values, letters, or symbols)
    const sanitized = e.target.value.replace(/[^0-9]/g, "");
    setBudgetInput(sanitized);
    const numericVal = sanitized === "" ? 0 : parseInt(sanitized, 10);
    setFormData((prev) => ({
      ...prev,
      budget: Math.max(0, numericVal),
    }));
  };

  const applyRecommendedBudget = () => {
    setBudgetInput(String(recommendedBudget.minBudget));
    setFormData((prev) => ({
      ...prev,
      budget: recommendedBudget.minBudget,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isSubmitting) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (start <= today) {
      alert("Arrival date must be later than today.");
      return;
    }
    if (end <= start) {
      alert("Departure date must be after the arrival date.");
      return;
    }
    if (formData.destination && formData.startDate && formData.endDate && formData.interests.length > 0) {
      setIsSubmitting(true);
      onSubmit({ ...formData, language } as any);
    } else {
      alert("Please enter a destination, valid dates, and at least one travel interest.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="divide-y divide-[var(--light-sage)]">
      {/* ── STEP 1: DESTINATION ─────────────────────── */}
      <div className="p-5 sm:p-6 space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--forest)]">
            <MapPin className="w-4 h-4 text-[var(--forest)]" />
            1. {t("tripPlanner.whereTo")}
          </label>
        </div>
        <input
          type="text"
          className="input-field py-2.5 text-sm font-semibold"
          placeholder={t("tripPlanner.destinationPlaceholder")}
          value={formData.destination}
          onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
          required
        />
      </div>

      {/* ── STEP 2: DATES ───────────────────────────── */}
      <div className="p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--forest)]">
            <Calendar className="w-4 h-4 text-[var(--forest)]" />
            2. Travel Window
          </label>
          {days > 0 && (
            <span className="text-xs font-bold text-[var(--forest)] bg-[var(--sage)] px-2.5 py-0.5 rounded-full border border-[var(--light-sage)]">
              {days} {days === 1 ? "Day Trip" : "Days Trip"}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="block text-[11px] font-medium text-[var(--slate)] mb-1">{t("tripPlanner.startDate")}</span>
            <input
              type="date"
              className="input-field py-2 text-xs sm:text-sm font-medium"
              min={getTomorrowStr()}
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>
          <div>
            <span className="block text-[11px] font-medium text-[var(--slate)] mb-1">{t("tripPlanner.endDate")}</span>
            <input
              type="date"
              className="input-field py-2 text-xs sm:text-sm font-medium"
              min={formData.startDate || getTomorrowStr()}
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>
        </div>
      </div>

      {/* ── STEP 3: TRAVELERS ───────────────────────── */}
      <div className="p-5 sm:p-6 space-y-2">
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--forest)]">
          <Users className="w-4 h-4 text-[var(--forest)]" />
          3. {t("tripPlanner.peopleLabel")}
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            inputMode="numeric"
            className="input-field py-2.5 text-sm font-bold w-full"
            min={1}
            max={50}
            value={formData.people}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              const nextPeople = isNaN(val) || val < 1 ? 1 : Math.min(val, 50);
              setFormData((prev) => ({
                ...prev,
                people: nextPeople,
                accommodationPreferences: prev.accommodationPreferences
                  ? {
                      ...prev.accommodationPreferences,
                      rooms: Math.max(1, Math.ceil(nextPeople / 2)),
                    }
                  : undefined,
              }));
            }}
            required
          />
          <span className="text-xs font-medium text-[var(--slate)] whitespace-nowrap">
            {formData.people} {formData.people === 1 ? t("common.traveler") : t("common.travelers")}
          </span>
        </div>
      </div>

      {/* ── STEP 4: PREFERENCES / INTERESTS ─────────── */}
      <div className="p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--forest)]">
            <Compass className="w-4 h-4 text-[var(--forest)]" />
            4. {t("tripPlanner.interestsLabel")}
          </label>
          <span className="text-xs text-[var(--slate)]">
            {formData.interests.length} selected
          </span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {INTEREST_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                setFormData((p) => ({
                  ...p,
                  interests: p.interests.includes(opt.value)
                    ? p.interests.filter((i) => i !== opt.value)
                    : [...p.interests, opt.value],
                }))
              }
              className={`interest-chip ${formData.interests.includes(opt.value) ? "selected" : ""}`}
            >
              {t(`interests.${opt.value}`, undefined, opt.label)}
            </button>
          ))}
        </div>
      </div>

      {/* ── STEP 5: TRAVEL STYLE & TRANSPORTATION ──────────── */}
      <div className="p-5 sm:p-6 space-y-4">
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--forest)] mb-2">
            <Sparkles className="w-4 h-4 text-[var(--forest)]" />
            5. Travel Style & Comfort
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "budget", label: "Budget", desc: "Hostels & local eats" },
              { id: "moderate", label: "Standard", desc: "3-4★ hotels & cafes" },
              { id: "luxury", label: "Luxury", desc: "5★ resorts & fine dining" },
            ].map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    travelStyle: style.id as TravelStyle,
                  }))
                }
                className={`flex flex-col items-start p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  (formData.travelStyle || "moderate") === style.id
                    ? "bg-[var(--forest)] text-white border-[var(--forest)] shadow-xs"
                    : "bg-white text-[var(--charcoal)] border-[var(--light-sage)] hover:border-[var(--emerald)]"
                }`}
              >
                <span className="text-xs sm:text-sm font-bold">{style.label}</span>
                <span
                  className={`text-[10px] line-clamp-1 ${
                    (formData.travelStyle || "moderate") === style.id
                      ? "text-emerald-100"
                      : "text-[var(--slate)]"
                  }`}
                >
                  {style.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--forest)]">
              <Car className="w-4 h-4 text-[var(--forest)]" />
              Preferred Transit Mode
            </label>
            <span className="text-[10px] text-[var(--slate)] font-medium">
              {(formData.transportationModes ?? []).length} selected · multi-select
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: "public", label: "🚆 Train & Public", icon: Train },
              { id: "cab", label: "🚕 Private Cab", icon: Car },
              { id: "flight", label: "✈️ Flights", icon: Plane },
            ] as const).map((mode) => {
              const Icon = mode.icon;
              const modes = formData.transportationModes ?? [];
              const isSelected = modes.includes(mode.id);
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    setFormData((prev) => {
                      const current = prev.transportationModes ?? [];
                      const updated = current.includes(mode.id)
                        ? current.filter((m) => m !== mode.id)
                        : [...current, mode.id];
                      // Keep at least one selected
                      const next = updated.length > 0 ? updated : [mode.id];
                      return {
                        ...prev,
                        transportationModes: next,
                        // Keep legacy field in sync with dominant mode
                        transportation: getDominantMode(next),
                      };
                    });
                  }}
                  className={`relative flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[var(--forest)] text-white border-[var(--forest)] shadow-sm"
                      : "bg-white text-[var(--charcoal)] border-[var(--light-sage)] hover:border-[var(--emerald)]"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-1 right-1.5 text-[9px] font-black text-emerald-200">✓</span>
                  )}
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] sm:text-xs text-center leading-tight">{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── STEP 6: ACCOMMODATION PREFERENCES ──────────── */}
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--forest)]">
            <Hotel className="w-4 h-4 text-[var(--forest)]" />
            6. Accommodation Preferences
          </label>
          <span className="text-[10px] text-[var(--slate)] font-medium">
            {(formData.accommodationPreferences?.types ?? []).length} selected · multi-select
          </span>
        </div>

        {/* Accommodation Types Multi-Select */}
        <div>
          <span className="block text-[11px] font-medium text-[var(--slate)] mb-1.5">
            Stay Categories (Select all that fit)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {[
              { id: "hotel" as const, label: "Hotels", emoji: "🏨" },
              { id: "homestay" as const, label: "Homestays", emoji: "🏠" },
              { id: "govt_stay" as const, label: "Govt / Hostels", emoji: "🏛️" },
              { id: "hostel" as const, label: "Hostels", emoji: "🛏️" },
              { id: "resort" as const, label: "Resorts / Eco", emoji: "🏕️" },
            ].map((type) => {
              const currentTypes = formData.accommodationPreferences?.types ?? ["hotel"];
              const isSelected = currentTypes.includes(type.id);
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    const next = isSelected
                      ? currentTypes.length > 1
                        ? currentTypes.filter((t) => t !== type.id)
                        : currentTypes
                      : [...currentTypes, type.id];
                    setFormData((prev) => ({
                      ...prev,
                      accommodationPreferences: {
                        types: next,
                        travelGroup: prev.accommodationPreferences?.travelGroup || "couple",
                        rooms: prev.accommodationPreferences?.rooms || Math.max(1, Math.ceil(prev.people / 2)),
                        amenities: prev.accommodationPreferences?.amenities || ["wifi"],
                      },
                    }));
                  }}
                  className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[var(--forest)] text-white border-[var(--forest)] shadow-xs"
                      : "bg-white text-[var(--charcoal)] border-[var(--light-sage)] hover:border-[var(--emerald)]"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-1 right-1.5 text-[9px] font-black text-emerald-200">✓</span>
                  )}
                  <span className="text-base mb-0.5">{type.emoji}</span>
                  <span className="text-xs font-bold leading-tight">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Travel Group & Room Count */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <span className="block text-[11px] font-medium text-[var(--slate)] mb-1.5">
              Travel Group Dynamic
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: "solo" as const, label: "Solo", icon: "👤" },
                { id: "couple" as const, label: "Couple", icon: "👫" },
                { id: "family" as const, label: "Family", icon: "👨‍👩‍👧" },
                { id: "group" as const, label: "Group", icon: "👥" },
              ].map((grp) => {
                const isSelected = (formData.accommodationPreferences?.travelGroup || "couple") === grp.id;
                return (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        accommodationPreferences: {
                          types: prev.accommodationPreferences?.types || ["hotel"],
                          travelGroup: grp.id,
                          rooms: prev.accommodationPreferences?.rooms || Math.max(1, Math.ceil(prev.people / 2)),
                          amenities: prev.accommodationPreferences?.amenities || ["wifi"],
                        },
                      }));
                    }}
                    className={`py-2 px-1 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--forest)] text-white border-[var(--forest)] shadow-xs"
                        : "bg-white text-[var(--charcoal)] border-[var(--light-sage)] hover:border-[var(--emerald)]"
                    }`}
                  >
                    <div className="text-sm">{grp.icon}</div>
                    <div className="text-[11px] font-bold mt-0.5">{grp.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-medium text-[var(--slate)] mb-1.5">
              Required Rooms
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={20}
                value={formData.accommodationPreferences?.rooms || Math.max(1, Math.ceil(formData.people / 2))}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  setFormData((prev) => ({
                    ...prev,
                    accommodationPreferences: {
                      types: prev.accommodationPreferences?.types || ["hotel"],
                      travelGroup: prev.accommodationPreferences?.travelGroup || "couple",
                      rooms: val,
                      amenities: prev.accommodationPreferences?.amenities || ["wifi"],
                    },
                  }));
                }}
                className="input-field py-2 text-sm font-bold"
              />
              <span className="text-xs text-[var(--slate)] font-medium whitespace-nowrap">
                Room{((formData.accommodationPreferences?.rooms || Math.max(1, Math.ceil(formData.people / 2))) > 1) ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Must-Have Amenities */}
        <div>
          <span className="block text-[11px] font-medium text-[var(--slate)] mb-1.5">
            Key Stay Amenities
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "wifi", label: "Wi-Fi", icon: Wifi },
              { id: "parking", label: "Parking", icon: Car },
              { id: "meals", label: "Meals Included", icon: Utensils },
              { id: "ac", label: "Air Conditioning", icon: Snowflake },
              { id: "pool", label: "Swimming Pool", icon: Waves },
              { id: "accessibility", label: "Accessible", icon: Accessibility },
            ].map((am) => {
              const Icon = am.icon;
              const curAmenities = formData.accommodationPreferences?.amenities || ["wifi"];
              const isSelected = curAmenities.includes(am.id);
              return (
                <button
                  key={am.id}
                  type="button"
                  onClick={() => {
                    const next = isSelected
                      ? curAmenities.filter((a) => a !== am.id)
                      : [...curAmenities, am.id];
                    setFormData((prev) => ({
                      ...prev,
                      accommodationPreferences: {
                        types: prev.accommodationPreferences?.types || ["hotel"],
                        travelGroup: prev.accommodationPreferences?.travelGroup || "couple",
                        rooms: prev.accommodationPreferences?.rooms || Math.max(1, Math.ceil(prev.people / 2)),
                        amenities: next,
                      },
                    }));
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                      : "bg-white border-[var(--light-sage)] text-[var(--slate)] hover:border-[var(--emerald)]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{am.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── STEP 7: BUDGET, RECOMMENDER & CURRENCY ──────────── */}
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="trip-budget-input" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--forest)]">
            <DollarSign className="w-4 h-4 text-[var(--forest)]" />
            7. {t("tripPlanner.budgetLabel")}
          </label>
          <span className="text-xs font-bold text-[var(--forest)] bg-[var(--sage)] px-2.5 py-0.5 rounded-full border border-[var(--light-sage)]">
            {formatCurrency(formData.budget, formData.currency)}
          </span>
        </div>

        {/* ── DYNAMIC MINIMUM BUDGET RECOMMENDER CARD ────────── */}
        <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-3.5 sm:p-4 space-y-2.5 transition-all shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Recommended Minimum Budget:</span>
                <span className="text-sm font-extrabold text-emerald-800 underline decoration-emerald-400 decoration-2">
                  {recommendedBudget.formattedRange}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-snug">
                Dynamically calculated for {formData.destination ? `“${formData.destination}”` : "your destination"}, {days > 0 ? `${days} days` : "duration"}, {formData.people} traveler{formData.people > 1 ? "s" : ""}, {formData.travelStyle || "standard"} style &amp; {(formData.transportationModes ?? [formData.transportation ?? "cab"]).map((m) => m === "flight" ? "flights" : m === "public" ? "public transit" : "private cab").join(" + ")}.
              </p>
            </div>
            <button
              type="button"
              onClick={applyRecommendedBudget}
              className="self-start sm:self-auto shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Apply Recommended
            </button>
          </div>

          {/* Itemized Estimate Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] text-emerald-900 border-t border-emerald-200/60 pt-2">
            <span className="bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200 font-medium">
              Stays: {formatCurrency(recommendedBudget.breakdown.accommodation.min, formData.currency)}–{formatCurrency(recommendedBudget.breakdown.accommodation.max, formData.currency)}
            </span>
            <span className="bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200 font-medium">
              Food: {formatCurrency(recommendedBudget.breakdown.food.min, formData.currency)}–{formatCurrency(recommendedBudget.breakdown.food.max, formData.currency)}
            </span>
            <span className="bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200 font-medium">
              Transit: {formatCurrency(recommendedBudget.breakdown.transportation.min, formData.currency)}–{formatCurrency(recommendedBudget.breakdown.transportation.max, formData.currency)}
            </span>
            <span className="bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200 font-medium">
              Activities: {formatCurrency(recommendedBudget.breakdown.activities.min, formData.currency)}–{formatCurrency(recommendedBudget.breakdown.activities.max, formData.currency)}
            </span>
          </div>

          {/* Live Warning if below minimum */}
          {formData.budget > 0 && formData.budget < recommendedBudget.minBudget && (
            <div className="flex items-start gap-2 text-xs text-amber-950 bg-amber-100/90 border border-amber-300 p-2.5 rounded-lg mt-1">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Budget Warning:</strong> Your entered budget ({formatCurrency(formData.budget, formData.currency)}) is below the recommended minimum ({recommendedBudget.formattedMin}). You may experience constraints on hotel standards, transportation, or monument entry.
              </div>
            </div>
          )}

          {/* Live Healthy Confirmation if meets or exceeds minimum */}
          {formData.budget >= recommendedBudget.minBudget && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-900 font-semibold bg-white/70 border border-emerald-200 px-2.5 py-1.5 rounded-lg mt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Budget looks healthy! Matches or exceeds the recommended minimum for this plan.</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          {/* Currency Dropdown */}
          <div className="sm:w-36 shrink-0">
            <select
              aria-label="Currency"
              className="w-full bg-white border border-[var(--light-sage)] text-[var(--charcoal)] font-bold text-sm px-3.5 py-2.5 rounded-xl cursor-pointer hover:border-[var(--emerald)] focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20 outline-none transition-all shadow-2xs"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code}
                </option>
              ))}
            </select>
          </div>

          {/* High Contrast, High Visibility Budget Input */}
          <div className="relative flex-1">
            <input
              id="trip-budget-input"
              name="trip-budget"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full bg-white border border-[var(--light-sage)] focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20 rounded-xl px-4 py-2.5 text-base sm:text-lg font-extrabold text-[var(--charcoal)] placeholder:text-[var(--slate-light)] transition-all outline-none shadow-2xs"
              placeholder="e.g. 60000"
              value={budgetInput}
              onChange={handleBudgetChange}
              required
            />
          </div>
        </div>
      </div>

      {/* ── STEP 7: NOTIFICATIONS & SUBMIT ──────────── */}
      <div className="p-5 sm:p-6 space-y-4 bg-[var(--cream)]">
        {notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((n, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 text-xs p-3 rounded-xl border ${
                  n.type === "warn"
                    ? "bg-[var(--warning-bg)] border-[var(--sand)] text-[var(--warning)]"
                    : "bg-[var(--success-bg)] border-[var(--success)]/30 text-[var(--success)]"
                }`}
              >
                {n.type === "warn" ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{n.msg}</span>
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || isSubmitting}
          className="btn-primary w-full py-4 justify-center text-base font-bold shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading || isSubmitting ? (
            <><Loader2 className="w-5 h-5 animate-spin mr-1" /> {t("tripPlanner.generating")}</>
          ) : (
            <>
              <Compass className="w-5 h-5 mr-1" />
              {t("tripPlanner.generateBtn")}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
