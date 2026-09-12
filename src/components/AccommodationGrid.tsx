"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/lib/currency";
import {
  Hotel,
  Star,
  Map,
  Wifi,
  Car,
  Utensils,
  Accessibility,
  Phone,
  Globe,
  BookmarkPlus,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  X,
  CheckCircle2,
  Sparkles,
  Home,
  Landmark,
  BedDouble,
  TreePine,
} from "lucide-react";
import type { HotelOption } from "@/lib/types";

type AccommodationType = "hotel" | "homestay" | "govt_stay" | "hostel" | "resort";

interface AccommodationGridProps {
  hotels: HotelOption[];
  destination: string;
  currency?: string;
  tripId?: string;
  /** If provided, show "Add to Trip" button and call this when clicked */
  onAddToTrip?: (hotel: HotelOption) => void;
  /** Currently selected accommodation for this trip */
  selectedAccommodation?: HotelOption | null;
  /** AI recommendation labels summary */
  recommendations?: {
    bestBudget?: any;
    bestLocal?: any;
    bestComfort?: any;
    bestForGroups?: any;
  };
}

const TYPE_CONFIG: Record<
  AccommodationType,
  { icon: React.ElementType; label: string; color: string; bg: string; border: string }
> = {
  hotel: {
    icon: Hotel,
    label: "Hotel",
    color: "#1F6B52",
    bg: "#E4EFE9",
    border: "#C8DBCF",
  },
  homestay: {
    icon: Home,
    label: "Homestay",
    color: "#7A5C00",
    bg: "rgba(232,201,138,0.2)",
    border: "rgba(232,201,138,0.5)",
  },
  govt_stay: {
    icon: Landmark,
    label: "Govt Stay",
    color: "#2B6CB0",
    bg: "#EBF4FF",
    border: "#BEE3F8",
  },
  hostel: {
    icon: BedDouble,
    label: "Hostel",
    color: "#744210",
    bg: "#FEFCBF",
    border: "#ECC94B",
  },
  resort: {
    icon: TreePine,
    label: "Resort / Eco-Stay",
    color: "#276749",
    bg: "#C6F6D5",
    border: "#9AE6B4",
  },
};

const AI_LABEL_CONFIG = {
  bestBudget: {
    label: "🏆 Best Budget",
    color: "#276749",
    bg: "#C6F6D5",
    border: "#9AE6B4",
  },
  bestLocal: {
    label: "🌟 Best Local Experience",
    color: "#7A5C00",
    bg: "rgba(232,201,138,0.3)",
    border: "rgba(232,201,138,0.6)",
  },
  bestComfort: {
    label: "✨ Best Comfort",
    color: "#1F6B52",
    bg: "#E4EFE9",
    border: "#C8DBCF",
  },
  bestForGroups: {
    label: "👥 Best for Groups",
    color: "#553C9A",
    bg: "#E9D8FD",
    border: "#D6BCFA",
  },
};

const AMENITY_ICONS: Record<string, React.ElementType> = {
  WiFi: Wifi,
  Parking: Car,
  Meals: Utensils,
  Breakfast: Utensils,
  Pool: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12h20M2 18l3-3 3 3 3-3 3 3 3-3 3 3" />
    </svg>
  ),
};

function AmenityIcon({ amenity }: { amenity: string }) {
  const Icon = AMENITY_ICONS[amenity];
  if (!Icon) return null;
  return <Icon className="w-3 h-3" />;
}

function GovernmentStayDisclaimer() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-800 hover:bg-blue-100 transition-colors"
      >
        <Info className="w-3.5 h-3.5 shrink-0" />
        Government Stay — Important Notice
        {open ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
      </button>
      {open && (
        <div className="px-3 pb-3 text-xs text-blue-700 leading-relaxed space-y-1.5">
          <p>
            <strong>This is an AI-estimated listing.</strong> Prices, availability, and booking details shown here are indicative only.
          </p>
          <p>
            For confirmed bookings, contact the government tourism authority directly or visit their official website.
          </p>
          <p className="text-blue-600 italic">
            Do not rely on this information for confirmed reservations without verifying with the official provider.
          </p>
        </div>
      )}
    </div>
  );
}

export default function AccommodationGrid({
  hotels,
  destination,
  currency = "INR",
  tripId,
  onAddToTrip,
  selectedAccommodation,
  recommendations,
}: AccommodationGridProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(
    selectedAccommodation?.name || null
  );

  const handleAddToTrip = (hotel: HotelOption) => {
    setAddedId(hotel.name);
    onAddToTrip?.(hotel);
  };

  if (!hotels || hotels.length === 0) return null;

  // AI Recommendation Highlights (if available)
  const recEntries = recommendations
    ? (Object.entries(recommendations) as [string, any][]).filter(([, v]) => v?.name)
    : [];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="section-header mb-0 flex items-center gap-2">
          <Hotel className="w-5 h-5 text-[var(--forest)]" />
          Stays & Accommodation
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          AI Estimated
        </span>
      </div>

      {/* AI Recommendation Quick Picks */}
      {recEntries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {recEntries.map(([key, rec]) => {
            const cfg = AI_LABEL_CONFIG[key as keyof typeof AI_LABEL_CONFIG];
            if (!cfg || !rec) return null;
            return (
              <div
                key={key}
                className="p-3 rounded-xl border text-xs font-medium"
                style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}
              >
                <div className="font-bold text-[11px] mb-1">{cfg.label}</div>
                <div className="font-extrabold text-sm leading-tight">{rec.name}</div>
                {rec.price_per_night && (
                  <div className="text-[11px] mt-1 opacity-80">
                    {formatCurrency(rec.price_per_night, currency)}/night
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Hotel Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {hotels.map((hotel, idx) => {
          const typeKey = (hotel.type || "hotel") as AccommodationType;
          const typeConfig = TYPE_CONFIG[typeKey] || TYPE_CONFIG.hotel;
          const TypeIcon = typeConfig.icon;
          const aiLabelKey = hotel.ai_label as keyof typeof AI_LABEL_CONFIG | undefined;
          const aiCfg = aiLabelKey ? AI_LABEL_CONFIG[aiLabelKey] : null;
          const cardId = hotel.name + idx;
          const isExpanded = expandedId === cardId;
          const isSelected = addedId === hotel.name;

          return (
            <div
              key={idx}
              className={`bg-white border rounded-2xl flex flex-col transition-all group relative overflow-hidden ${
                isSelected
                  ? "border-[var(--forest)] ring-2 ring-[var(--forest)]/20 shadow-md"
                  : "border-[var(--light-sage)] hover:border-[var(--emerald)] hover:shadow-md"
              }`}
            >
              {/* Top Color Bar by type */}
              <div
                className="h-1 w-full rounded-t-2xl"
                style={{ background: typeConfig.color }}
              />

              <div className="p-5 flex flex-col flex-1">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Type badge */}
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1"
                      style={{
                        background: typeConfig.bg,
                        color: typeConfig.color,
                        borderColor: typeConfig.border,
                      }}
                    >
                      <TypeIcon className="w-3 h-3" />
                      {typeConfig.label}
                    </span>
                    {/* AI Recommendation label */}
                    {aiCfg && (
                      <span
                        className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border"
                        style={{
                          background: aiCfg.bg,
                          color: aiCfg.color,
                          borderColor: aiCfg.border,
                        }}
                      >
                        {aiCfg.label}
                      </span>
                    )}
                  </div>
                  {/* Rating */}
                  <div className="flex items-center gap-1 bg-[var(--cream)] px-2 py-0.5 rounded-full border border-[var(--light-sage)] shrink-0">
                    <Star className="w-3 h-3 fill-[var(--sand-dark)] text-[var(--sand-dark)]" />
                    <span className="text-xs font-bold text-[var(--charcoal)]">
                      {hotel.rating?.toFixed(1) || "—"}
                    </span>
                  </div>
                </div>

                {/* Category chip + Name */}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border self-start mb-2 ${
                    hotel.category === "Luxury"
                      ? "bg-[rgba(232,201,138,0.3)] text-[#7A5C00] border-[rgba(232,201,138,0.6)]"
                      : hotel.category === "Budget"
                      ? "bg-[var(--success-bg)] text-[var(--success)] border-[var(--success)]/30"
                      : "bg-[var(--sage)] text-[var(--forest)] border-[var(--light-sage)]"
                  }`}
                >
                  {hotel.category || "Recommended"}
                </span>

                <h4 className="font-bold text-[var(--charcoal)] text-base mb-1.5 group-hover:text-[var(--forest)] transition-colors leading-snug">
                  {hotel.name}
                </h4>

                <p className="text-xs text-[var(--slate)] mb-3 leading-relaxed line-clamp-2">
                  {hotel.description}
                </p>

                {/* Amenity icons */}
                {hotel.amenities && hotel.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {hotel.amenities.slice(0, 5).map((a) => (
                      <span
                        key={a}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--sage)] text-[var(--forest)] border border-[var(--light-sage)] flex items-center gap-1"
                      >
                        <AmenityIcon amenity={a} />
                        {a}
                      </span>
                    ))}
                    {hotel.amenities.length > 5 && (
                      <span className="text-[10px] text-[var(--slate)] font-medium px-2 py-0.5">
                        +{hotel.amenities.length - 5} more
                      </span>
                    )}
                  </div>
                )}

                {/* Quick flags */}
                <div className="flex flex-wrap gap-2 mb-3 text-[10px]">
                  {hotel.wifi && (
                    <span className="flex items-center gap-1 text-[var(--forest)]">
                      <Wifi className="w-3 h-3" /> WiFi
                    </span>
                  )}
                  {hotel.parking && (
                    <span className="flex items-center gap-1 text-[var(--forest)]">
                      <Car className="w-3 h-3" /> Parking
                    </span>
                  )}
                  {hotel.meals_included && (
                    <span className="flex items-center gap-1 text-[var(--forest)]">
                      <Utensils className="w-3 h-3" /> Meals Incl.
                    </span>
                  )}
                  {hotel.accessibility && (
                    <span className="flex items-center gap-1 text-[var(--forest)]">
                      <Accessibility className="w-3 h-3" /> Accessible
                    </span>
                  )}
                  {hotel.distance_from_itinerary && (
                    <span className="text-[var(--slate)]">
                      ~{hotel.distance_from_itinerary}km from attractions
                    </span>
                  )}
                </div>

                {/* Expand/Collapse for details */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : cardId)}
                  className="text-xs text-[var(--forest)] font-bold flex items-center gap-1 mb-3 hover:underline"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" /> Less details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" /> More details
                    </>
                  )}
                </button>

                {isExpanded && (
                  <div className="space-y-2 mb-3 text-xs text-[var(--slate)] border-t border-[var(--light-sage)] pt-3">
                    {hotel.cancellation_policy && (
                      <p>
                        <span className="font-bold text-[var(--charcoal)]">Cancellation: </span>
                        {hotel.cancellation_policy}
                      </p>
                    )}
                    {hotel.group_types && hotel.group_types.length > 0 && (
                      <p>
                        <span className="font-bold text-[var(--charcoal)]">Suitable for: </span>
                        {hotel.group_types.join(", ")}
                      </p>
                    )}
                    {hotel.contact?.phone && (
                      <p className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[var(--forest)]" />
                        {hotel.contact.phone}
                      </p>
                    )}
                    {hotel.contact?.website && (
                      <a
                        href={
                          hotel.contact.website.startsWith("http")
                            ? hotel.contact.website
                            : `https://${hotel.contact.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[var(--forest)] hover:underline"
                      >
                        <Globe className="w-3 h-3" />
                        Official Website
                      </a>
                    )}
                    {/* Govt stay disclaimer */}
                    {hotel.type === "govt_stay" && <GovernmentStayDisclaimer />}
                    {hotel.govt_provider && (
                      <p>
                        <span className="font-bold text-[var(--charcoal)]">Provider: </span>
                        {hotel.govt_provider}
                      </p>
                    )}
                    {hotel.govt_booking_note && (
                      <p className="text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1.5 leading-snug">
                        <Info className="w-3 h-3 inline mr-1" />
                        {hotel.govt_booking_note}
                      </p>
                    )}
                    {/* AI estimated notice */}
                    {hotel.is_ai_estimated && (
                      <p className="flex items-start gap-1 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 leading-snug">
                        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                        Prices & details are AI-estimated. Verify with the property before booking.
                      </p>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--light-sage)] mt-auto">
                  <div className="text-sm font-bold text-[var(--forest)]">
                    {formatCurrency(hotel.price_per_night || 0, currency)}
                    <span className="text-[11px] text-[var(--slate)] font-normal ml-0.5">/night</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Map link */}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${hotel.name} ${destination}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-[var(--sage)] rounded-lg hover:bg-[var(--light-sage)] transition-colors text-[var(--forest)]"
                      title="View on Map"
                    >
                      <Map className="w-4 h-4" />
                    </a>

                    {/* Add to Trip button */}
                    {onAddToTrip && (
                      <button
                        onClick={() => handleAddToTrip(hotel)}
                        disabled={isSelected}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success)]/30 cursor-default"
                            : "bg-[var(--forest)] text-white hover:bg-[var(--forest-light)] shadow-sm"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <BookmarkCheck className="w-3.5 h-3.5" /> Saved
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="w-3.5 h-3.5" /> Add to Trip
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Estimated Footer Note */}
      <p className="text-xs text-[var(--slate)] text-center flex items-center justify-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        All accommodation details are AI-estimated. Prices, availability, and amenities should be verified directly with properties before booking.
      </p>
    </div>
  );
}
