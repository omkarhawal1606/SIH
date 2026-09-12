"use client";

import React, { useEffect, useState, use } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import AdvancedItinerary from "@/components/AdvancedItinerary";
import HotelGrid from "@/components/HotelGrid";
import QuickInfoSection from "@/components/QuickInfoSection";
import { getPublicTrip } from "@/lib/db";
import { type TripData } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import {
  MapPin, Calendar, Wallet, Users, Plane, Lock, AlertCircle, ShieldAlert, ShieldCheck
} from "lucide-react";

const BudgetChart = dynamic(() => import("@/components/BudgetChart"), { ssr: false });
const TripMap = dynamic(() => import("@/components/TripMap"), { ssr: false });

export default function SharedTripPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const data = await getPublicTrip(token);
        if (!data) {
          setError("This trip is private or no longer publicly shared.");
        } else {
          setTrip(data);
        }
      } catch (e) {
        console.error(e);
        setError("Failed to load shared trip. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--cream)] items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--cream)]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center p-8 bg-white rounded-2xl border border-[var(--light-sage)] shadow-sm max-w-md w-full">
            <Lock className="w-10 h-10 text-[var(--slate)] mx-auto mb-3" />
            <p className="text-[var(--charcoal)] font-bold text-lg mb-1">Access Restricted</p>
            <p className="text-[var(--slate)] text-sm mb-5">{error}</p>
            <a href="/" className="btn-primary text-sm inline-flex">Go to Wanderly</a>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--cream)] pb-20">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {/* Banner */}
        <div className="mb-6 p-4 bg-[var(--sage)] border border-[var(--light-sage)] rounded-xl flex items-center gap-3">
          <Plane className="w-5 h-5 text-[var(--forest)] shrink-0" />
          <p className="text-sm text-[var(--charcoal)] font-medium">
            You are viewing a shared public trip blueprint. <a href="/" className="underline text-[var(--forest)] font-bold">Plan your own trip →</a>
          </p>
        </div>

        {/* Security Advisory Active Banner */}
        {trip.safety_warning && (
          <div
            className={`flex items-start justify-between gap-4 p-4 sm:p-5 border rounded-2xl mb-6 shadow-xs ${
              trip.safety_level === "unsafe"
                ? "bg-[var(--error-bg)] border-[var(--error)]/40 text-[var(--charcoal)] ring-2 ring-[var(--error)]/20"
                : trip.safety_level === "caution"
                ? "bg-[var(--warning-bg)] border-[var(--sand)] text-[var(--charcoal)]"
                : "bg-[var(--success-bg)] border-[var(--success)]/25 text-[var(--charcoal)]"
            }`}
          >
            <div className="flex items-start gap-3">
              {trip.safety_level === "unsafe" ? (
                <ShieldAlert className="w-6 h-6 text-[var(--error)] shrink-0 mt-0.5" />
              ) : trip.safety_level === "caution" ? (
                <AlertCircle className="w-6 h-6 text-[var(--warning)] shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-[var(--success)] shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      trip.safety_level === "unsafe"
                        ? "bg-[var(--error)] text-white"
                        : trip.safety_level === "caution"
                        ? "bg-[#7A5C00] text-white"
                        : "bg-[var(--success)] text-white"
                    }`}
                  >
                    {trip.safety_level === "unsafe"
                      ? "Critical Security Warning"
                      : trip.safety_level === "caution"
                      ? "Travel Caution Advisory"
                      : "Security Clearance: Safe"}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-[var(--charcoal-80)] leading-relaxed">
                  {trip.safety_warning}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--charcoal)] mb-3">{trip.destination}</h1>
          <div className="flex flex-wrap gap-2.5">
            <span className="badge-premium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {trip.days} Days
            </span>
            <span className="badge-premium flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {trip.people || 1} {trip.people === 1 ? "Person" : "People"}
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
            {trip.startDate && (
              <span className="badge-premium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {trip.startDate} → {trip.endDate}
              </span>
            )}
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

          {(trip.events?.length || trip.emergency || trip.season_info) && (
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

          <AdvancedItinerary
            itinerary={trip.itinerary || []}
            destination={trip.destination}
            currency={trip.currency}
            tripStartDate={trip.startDate}
            tripSafetyLevel={trip.safety_level}
          />

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
