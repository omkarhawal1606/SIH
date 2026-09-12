"use client";

import React from "react";
import { type HotelOption } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { Hotel, Star, Map } from "lucide-react";

export default function HotelGrid({
  hotels,
  destination,
  currency = "INR",
}: {
  hotels: HotelOption[];
  destination: string;
  currency?: string;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-[var(--charcoal)] flex items-center gap-2">
        <Hotel className="w-5 h-5 text-[var(--forest)]" />
        Recommended Accommodations
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {hotels.map((hotel, idx) => (
          <div
            key={idx}
            className="bg-white border border-[var(--light-sage)] rounded-xl p-5 flex flex-col hover:border-[var(--emerald)] hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-2.5">
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  hotel.category === "Luxury"
                    ? "bg-[rgba(232,201,138,0.3)] text-[#7A5C00] border border-[rgba(232,201,138,0.6)]"
                    : hotel.category === "Budget"
                    ? "bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success)]/30"
                    : "bg-[var(--sage)] text-[var(--forest)] border border-[var(--light-sage)]"
                }`}
              >
                {hotel.category || "Recommended"}
              </span>
              <div className="flex items-center gap-1 bg-[var(--cream)] px-2 py-0.5 rounded-full border border-[var(--light-sage)]">
                <Star className="w-3 h-3 fill-[var(--sand-dark)] text-[var(--sand-dark)]" />
                <span className="text-xs font-bold text-[var(--charcoal)]">{hotel.rating}</span>
              </div>
            </div>

            <h4 className="font-bold text-[var(--charcoal)] text-base mb-1.5 group-hover:text-[var(--forest)] transition-colors leading-snug">
              {hotel.name}
            </h4>

            <p className="text-xs text-[var(--slate)] mb-4 flex-1 leading-relaxed">
              {hotel.description}
            </p>

            <div className="flex items-center justify-between pt-3.5 border-t border-[var(--light-sage)] mt-auto">
              <div className="text-sm font-bold text-[var(--forest)]">
                {formatCurrency(hotel.price_per_night || 0, currency)}
                <span className="text-[11px] text-[var(--slate)] font-normal ml-0.5">/night</span>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${hotel.name} ${destination}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-[var(--sage)] rounded-lg hover:bg-[var(--light-sage)] transition-colors text-[var(--forest)]"
                title="View on Google Maps"
              >
                <Map className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
