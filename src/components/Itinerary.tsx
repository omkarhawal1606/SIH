"use client";

import React from "react";
import { type ItineraryDay } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import {
  MapPin,
  Activity,
  ExternalLink,
  Calendar,
  Wallet
} from "lucide-react";

export default function Itinerary({ 
  itinerary, 
  destination, 
  currency = "INR" 
}: { 
  itinerary: ItineraryDay[]; 
  destination: string; 
  currency?: string;
}) {
  const getMapsLink = (place: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      place + " " + destination
    )}`;

  const totalCost = itinerary.reduce((sum, day) => sum + (day.estimated_cost || day.daily_cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-xl font-bold text-[var(--charcoal)] flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[var(--forest)]" />
          Itinerary Summary
        </h3>
        <div className="flex items-center gap-1.5 bg-[var(--sage)] px-3.5 py-1.5 rounded-full border border-[var(--light-sage)] text-xs font-bold text-[var(--forest)]">
          <Wallet className="w-4 h-4" />
          <span>Total: {formatCurrency(totalCost, currency)}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[var(--light-sage)]">
        <div className="space-y-6">
          {itinerary.map((day) => (
            <div
              key={day.day}
              className="pl-12 relative animate-fade-in"
            >
              {/* Timeline dot */}
              <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-[var(--forest)] border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-white z-10">
                {day.day}
              </div>

              {/* Card */}
              <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-5 shadow-sm hover:border-[var(--emerald)] transition-all">
                {/* Day header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--light-sage)]">
                  <h4 className="text-base font-bold text-[var(--charcoal)]">
                    Day {day.day}
                  </h4>
                  <span className="text-xs font-bold text-[var(--forest)] bg-[var(--sage)] px-2.5 py-1 rounded-full">
                    {formatCurrency(day.estimated_cost || day.daily_cost || 0, currency)}
                  </span>
                </div>

                {/* Places */}
                {day.places && day.places.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[11px] uppercase tracking-wider text-[var(--slate)] mb-2 font-bold">
                      Places to Visit
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {day.places.map((place: any, i: number) => (
                        <a
                          key={i}
                          href={getMapsLink(place)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-[var(--cream)] hover:bg-[var(--sage)] border border-[var(--light-sage)] px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--charcoal)] transition-colors"
                          title={`View ${place} on Google Maps`}
                        >
                          <MapPin className="w-3.5 h-3.5 text-[var(--forest)]" />
                          {place}
                          <ExternalLink className="w-3 h-3 text-[var(--slate)]" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activities */}
                {day.activities && day.activities.length > 0 && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-[var(--slate)] mb-2 font-bold">
                      Activities
                    </p>
                    <ul className="space-y-2">
                      {day.activities.map((activity: any, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-[var(--charcoal-80)] leading-relaxed"
                        >
                          <Activity className="w-3.5 h-3.5 text-[var(--emerald)] mt-0.5 shrink-0" />
                          {activity}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
