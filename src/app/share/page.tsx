"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { type TripData } from "@/lib/types";
import Navbar from "@/components/Navbar";
import AdvancedItinerary from "@/components/AdvancedItinerary";
import HotelGrid from "@/components/HotelGrid";
import QuickInfoSection from "@/components/QuickInfoSection";
import LZString from "lz-string";
import {
  Calendar,
  Wallet,
  Users,
  Plane,
  AlertCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

const BudgetChart = dynamic(() => import("@/components/BudgetChart"), { ssr: false });
const TripMap = dynamic(() => import("@/components/TripMap"), { ssr: false });

export default function PublicSharePage() {
  const [trip, setTrip] = useState<TripData | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    try {
      const hash = window.location.hash.substring(1);
      if (!hash) {
        setError("Invalid link. No trip data found.");
        return;
      }
      
      const json = LZString.decompressFromEncodedURIComponent(hash);
      if (!json) {
        setError("Link is corrupted or invalid.");
        return;
      }

      const data = JSON.parse(json);
      setTrip(data);
    } catch (e) {
      console.error(e);
      setError("Failed to decode trip.");
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--cream)]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center p-8 bg-white rounded-2xl border border-[var(--light-sage)] shadow-sm max-w-md w-full">
            <AlertCircle className="w-10 h-10 text-[var(--error)] mx-auto mb-3" />
            <p className="text-[var(--charcoal)] font-bold text-lg mb-1">Invalid Link</p>
            <p className="text-[var(--slate)] text-sm mb-5">{error}</p>
            <a href="/" className="btn-primary text-sm inline-flex">Go to Wanderly</a>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--cream)] items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--cream)] pb-20">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="mb-6 p-4 bg-[var(--sage)] border border-[var(--light-sage)] rounded-xl flex items-center gap-3">
          <Plane className="w-5 h-5 text-[var(--forest)] shrink-0" />
          <p className="text-sm text-[var(--charcoal)] font-medium">
            You are viewing a shared travel plan. <a href="/" className="underline text-[var(--forest)] font-bold">Create your own trip →</a>
          </p>
        </div>

        {/* Header Board */}
        <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--charcoal)] mb-3">
            {trip.destination}
          </h1>
          <div className="flex flex-wrap gap-2.5">
            <span className="badge-premium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {trip.days} Days
            </span>
            <span className="badge-premium flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {trip.people || 1} {trip.people === 1 ? 'Person' : 'People'}
            </span>
            <span
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                background: "rgba(232,201,138,0.2)",
                color: "#7A5C00",
                border: "1px solid rgba(232,201,138,0.5)",
              }}
            >
              <Wallet className="w-3.5 h-3.5" />
              Budget: {formatCurrency(trip.budget || 0, trip.currency || "INR")}
            </span>
          </div>
          <div className="flex gap-2 mt-4 flex-wrap">
            {trip.interests?.map(i => (
              <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--sage)] border border-[var(--light-sage)] text-[var(--forest)]">
                #{i}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <TripMap trip={trip} />

          {(trip.events || trip.emergency || trip.season_info) && (
            <QuickInfoSection 
              emergency={trip.emergency} 
              clothing={trip.clothing || []} 
              events={trip.events || []} 
              season_info={trip.season_info || ""} 
            />
          )}

          {trip.hotels && trip.hotels.length > 0 && (
            <HotelGrid hotels={trip.hotels} destination={trip.destination} currency={trip.currency} />
          )}

          <div className="animate-slide-up">
            <AdvancedItinerary itinerary={trip.itinerary || []} destination={trip.destination} currency={trip.currency} />
          </div>

          {trip.cost_breakdown && (
            <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-[var(--charcoal)] mb-6 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[var(--forest)]" />
                Budget Breakdown
              </h3>
              <BudgetChart breakdown={trip.cost_breakdown} totalBudget={trip.budget} currency={trip.currency} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
