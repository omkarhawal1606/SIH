"use client";

import React, { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Hotel,
  Home,
  Landmark,
  BedDouble,
  TreePine,
  Wifi,
  Car,
  Utensils,
  Accessibility,
  Users,
  Star,
  X,
  ChevronDown,
  ChevronUp,
  Coffee,
  Leaf,
} from "lucide-react";
import type { AccommodationType, TravelGroupType } from "@/lib/types";

export type { AccommodationType, TravelGroupType };

export interface AccommodationFilters {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  priceMin: number;
  priceMax: number;
  minRating: number;
  accommodationTypes: AccommodationType[];
  amenities: string[];
  travelGroup: TravelGroupType | "";
  mealsIncluded: boolean;
  parking: boolean;
  wifi: boolean;
  accessibility: boolean;
}

interface AccommodationSearchProps {
  filters: AccommodationFilters;
  onChange: (filters: AccommodationFilters) => void;
  onSearch: () => void;
  currency?: string;
  isLoading?: boolean;
}

const ACCOMMODATION_TYPES: {
  id: AccommodationType;
  label: string;
  emoji: string;
  icon: React.ElementType;
}[] = [
  { id: "hotel", label: "Hotels", emoji: "🏨", icon: Hotel },
  { id: "homestay", label: "Homestays", emoji: "🏠", icon: Home },
  { id: "govt_stay", label: "Govt Stays", emoji: "🏛️", icon: Landmark },
  { id: "hostel", label: "Hostels", emoji: "🛏️", icon: BedDouble },
  { id: "resort", label: "Resorts", emoji: "🏕️", icon: TreePine },
  { id: "guest_house", label: "Guest Houses", emoji: "🏡", icon: Coffee },
  { id: "eco_stay", label: "Eco-Stays", emoji: "🌿", icon: Leaf },
];

const AMENITY_OPTIONS = [
  { id: "WiFi", label: "WiFi", icon: Wifi },
  { id: "Parking", label: "Parking", icon: Car },
  { id: "Meals", label: "Meals", icon: Utensils },
  { id: "Pool", label: "Pool", icon: null },
  { id: "AC", label: "Air Conditioning", icon: null },
  { id: "Gym", label: "Gym", icon: null },
  { id: "Laundry", label: "Laundry", icon: null },
  { id: "Room Service", label: "Room Service", icon: null },
];

const GROUP_TYPES: { id: TravelGroupType; label: string; emoji: string }[] = [
  { id: "solo", label: "Solo", emoji: "🧍" },
  { id: "couple", label: "Couple", emoji: "👫" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧" },
  { id: "group", label: "Group", emoji: "👥" },
];

export const DEFAULT_FILTERS: AccommodationFilters = {
  destination: "",
  checkIn: "",
  checkOut: "",
  guests: 2,
  rooms: 1,
  priceMin: 0,
  priceMax: 20000,
  minRating: 0,
  accommodationTypes: [],
  amenities: [],
  travelGroup: "",
  mealsIncluded: false,
  parking: false,
  wifi: false,
  accessibility: false,
};

export default function AccommodationSearch({
  filters,
  onChange,
  onSearch,
  currency = "INR",
  isLoading = false,
}: AccommodationSearchProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (partial: Partial<AccommodationFilters>) =>
    onChange({ ...filters, ...partial });

  const toggleType = (type: AccommodationType) => {
    const current = filters.accommodationTypes;
    update({
      accommodationTypes: current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type],
    });
  };

  const toggleAmenity = (amenity: string) => {
    const current = filters.amenities;
    update({
      amenities: current.includes(amenity)
        ? current.filter((a) => a !== amenity)
        : [...current, amenity],
    });
  };

  const clearAll = () => onChange({ ...DEFAULT_FILTERS });

  const activeFilterCount =
    filters.accommodationTypes.length +
    filters.amenities.length +
    (filters.travelGroup ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.mealsIncluded ? 1 : 0) +
    (filters.parking ? 1 : 0) +
    (filters.wifi ? 1 : 0) +
    (filters.accessibility ? 1 : 0);

  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  return (
    <div className="bg-white border border-[var(--light-sage)] rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-[var(--sage)] border-b border-[var(--light-sage)] flex items-center justify-between">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--forest)] flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Search Stays
        </h2>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAll}
            className="text-[10px] font-bold text-[var(--error)] flex items-center gap-1 hover:underline"
          >
            <X className="w-3 h-3" />
            Clear ({activeFilterCount})
          </button>
        )}
      </div>

      <div className="divide-y divide-[var(--light-sage)]">
        {/* Destination */}
        <div className="p-4 space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--forest)]">
            Destination
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--slate)]" />
            <input
              type="text"
              className="input-field pl-9 py-2.5 text-sm"
              placeholder="City, region or property..."
              value={filters.destination}
              onChange={(e) => update({ destination: e.target.value })}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="p-4 space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--forest)]">
            Check-in / Check-out
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-[var(--slate)] font-medium">Check-in</span>
              <input
                type="date"
                className="input-field py-2 text-xs mt-0.5"
                min={getTomorrowStr()}
                value={filters.checkIn}
                onChange={(e) => update({ checkIn: e.target.value })}
              />
            </div>
            <div>
              <span className="text-[10px] text-[var(--slate)] font-medium">Check-out</span>
              <input
                type="date"
                className="input-field py-2 text-xs mt-0.5"
                min={filters.checkIn || getTomorrowStr()}
                value={filters.checkOut}
                onChange={(e) => update({ checkOut: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Guests & Rooms */}
        <div className="p-4 space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--forest)]">
            Guests & Rooms
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-[var(--slate)] font-medium">Guests</span>
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  onClick={() => update({ guests: Math.max(1, filters.guests - 1) })}
                  className="w-8 h-8 rounded-lg border border-[var(--light-sage)] flex items-center justify-center font-bold text-[var(--forest)] hover:bg-[var(--sage)] transition-colors"
                >
                  −
                </button>
                <span className="text-sm font-bold text-[var(--charcoal)] w-6 text-center">
                  {filters.guests}
                </span>
                <button
                  onClick={() => update({ guests: Math.min(30, filters.guests + 1) })}
                  className="w-8 h-8 rounded-lg border border-[var(--light-sage)] flex items-center justify-center font-bold text-[var(--forest)] hover:bg-[var(--sage)] transition-colors"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-[var(--slate)] font-medium">Rooms</span>
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  onClick={() => update({ rooms: Math.max(1, filters.rooms - 1) })}
                  className="w-8 h-8 rounded-lg border border-[var(--light-sage)] flex items-center justify-center font-bold text-[var(--forest)] hover:bg-[var(--sage)] transition-colors"
                >
                  −
                </button>
                <span className="text-sm font-bold text-[var(--charcoal)] w-6 text-center">
                  {filters.rooms}
                </span>
                <button
                  onClick={() => update({ rooms: Math.min(20, filters.rooms + 1) })}
                  className="w-8 h-8 rounded-lg border border-[var(--light-sage)] flex items-center justify-center font-bold text-[var(--forest)] hover:bg-[var(--sage)] transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Accommodation Type */}
        <div className="p-4 space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--forest)]">
            Accommodation Type
          </label>
          <div className="flex flex-col gap-1.5">
            {ACCOMMODATION_TYPES.map((type) => {
              const Icon = type.icon;
              const selected = filters.accommodationTypes.includes(type.id);
              return (
                <button
                  key={type.id}
                  onClick={() => toggleType(type.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all text-left ${
                    selected
                      ? "bg-[var(--forest)] text-white border-[var(--forest-dark)]"
                      : "bg-white text-[var(--charcoal)] border-[var(--light-sage)] hover:border-[var(--emerald)] hover:bg-[var(--sage)]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>
                    {type.emoji} {type.label}
                  </span>
                  {selected && (
                    <span className="ml-auto text-emerald-300 text-[10px] font-black">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Travel Group */}
        <div className="p-4 space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--forest)]">
            <Users className="w-3.5 h-3.5 inline mr-1" />
            Travel Group
          </label>
          <div className="grid grid-cols-2 gap-2">
            {GROUP_TYPES.map((g) => (
              <button
                key={g.id}
                onClick={() =>
                  update({ travelGroup: filters.travelGroup === g.id ? "" : g.id })
                }
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                  filters.travelGroup === g.id
                    ? "bg-[var(--forest)] text-white border-[var(--forest-dark)]"
                    : "bg-white text-[var(--charcoal)] border-[var(--light-sage)] hover:border-[var(--emerald)]"
                }`}
              >
                {g.emoji} {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters toggle */}
        <div className="p-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-xs font-bold text-[var(--forest)] hover:text-[var(--emerald)] transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Advanced Filters
              {activeFilterCount > 0 && (
                <span className="bg-[var(--forest)] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--slate)]">
                  Price Range / Night
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-[var(--slate)]">Min</span>
                    <input
                      type="number"
                      className="input-field py-1.5 text-xs mt-0.5"
                      min={0}
                      value={filters.priceMin}
                      onChange={(e) => update({ priceMin: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--slate)]">Max</span>
                    <input
                      type="number"
                      className="input-field py-1.5 text-xs mt-0.5"
                      min={0}
                      value={filters.priceMax}
                      onChange={(e) => update({ priceMax: Number(e.target.value) || 20000 })}
                    />
                  </div>
                </div>
              </div>

              {/* Minimum Rating */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--slate)]">
                  Minimum Rating
                </label>
                <div className="flex gap-1.5">
                  {[0, 3, 3.5, 4, 4.5].map((r) => (
                    <button
                      key={r}
                      onClick={() => update({ minRating: r })}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                        filters.minRating === r
                          ? "bg-[var(--sand-dark)] text-white border-[var(--sand-dark)]"
                          : "bg-white text-[var(--charcoal)] border-[var(--light-sage)] hover:border-[var(--sand-dark)]"
                      }`}
                    >
                      {r === 0 ? (
                        "Any"
                      ) : (
                        <>
                          <Star className="w-3 h-3" />
                          {r}+
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--slate)]">
                  Amenities
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AMENITY_OPTIONS.map((a) => {
                    const selected = filters.amenities.includes(a.id);
                    const Icon = a.icon;
                    return (
                      <button
                        key={a.id}
                        onClick={() => toggleAmenity(a.id)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-[11px] font-bold transition-all ${
                          selected
                            ? "bg-[var(--forest)] text-white border-[var(--forest-dark)]"
                            : "bg-white text-[var(--charcoal)] border-[var(--light-sage)] hover:border-[var(--emerald)]"
                        }`}
                      >
                        {Icon && <Icon className="w-3 h-3" />}
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick toggles */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--slate)]">
                  Must Have
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "mealsIncluded" as const, label: "Meals Included", icon: Utensils },
                    { key: "parking" as const, label: "Parking", icon: Car },
                    { key: "wifi" as const, label: "Wi-Fi", icon: Wifi },
                    { key: "accessibility" as const, label: "Accessible", icon: Accessibility },
                  ].map((toggle) => {
                    const Icon = toggle.icon;
                    const active = filters[toggle.key];
                    return (
                      <button
                        key={toggle.key}
                        onClick={() => update({ [toggle.key]: !active })}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                          active
                            ? "bg-[var(--forest)] text-white border-[var(--forest-dark)]"
                            : "bg-white text-[var(--charcoal)] border-[var(--light-sage)] hover:border-[var(--emerald)]"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {toggle.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Button */}
        <div className="p-4">
          <button
            onClick={onSearch}
            disabled={isLoading || !filters.destination.trim()}
            className="btn-primary w-full py-3.5 justify-center text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Searching stays…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search Accommodation
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
