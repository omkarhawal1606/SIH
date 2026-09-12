"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import AccommodationSearch, {
  DEFAULT_FILTERS,
  type AccommodationFilters,
} from "@/components/AccommodationSearch";
import AccommodationGrid from "@/components/AccommodationGrid";
import { useAuth } from "@/components/AuthProvider";
import {
  getAccommodationListings,
  saveAccommodationToTrip,
  getUserTrips,
  type AccommodationListing,
} from "@/lib/db";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import {
  Hotel,
  Sparkles,
  MapPin,
  Info,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { HotelOption } from "@/lib/types";

// Stays page inner content (uses useSearchParams — must be wrapped in Suspense)
function StaysContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { language } = useTranslation();

  const [filters, setFilters] = useState<AccommodationFilters>({
    ...DEFAULT_FILTERS,
    destination: searchParams?.get("destination") || "",
  });

  const [isSearching, setIsSearching] = useState(false);
  const [aiResults, setAiResults] = useState<HotelOption[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);
  const [dbListings, setDbListings] = useState<AccommodationListing[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");
  const [userTrips, setUserTrips] = useState<any[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [saveSuccess, setSaveSuccess] = useState("");

  // Load user trips for "Add to Trip" functionality
  useEffect(() => {
    if (user) {
      getUserTrips(user.uid).then((trips) => {
        setUserTrips(trips);
        if (trips.length > 0) setSelectedTripId(trips[0].id || "");
      });
    }
  }, [user]);

  // Auto-search if destination provided via query param
  useEffect(() => {
    if (searchParams?.get("destination")) {
      handleSearch();
    }
  }, []);

  const handleSearch = async () => {
    if (!filters.destination.trim()) return;
    setIsSearching(true);
    setError("");
    setHasSearched(true);

    try {
      // 1. Fetch admin-verified listings from Firestore
      const listings = await getAccommodationListings({
        destination: filters.destination,
        type: filters.accommodationTypes.length === 1 ? filters.accommodationTypes[0] : undefined,
        adminView: false,
      });

      // Filter client-side by additional criteria
      const filtered = listings.filter((l) => {
        if (filters.accommodationTypes.length > 0 && !filters.accommodationTypes.includes(l.type)) return false;
        if (l.pricePerNight && filters.priceMin > 0 && l.pricePerNight < filters.priceMin) return false;
        if (l.pricePerNight && l.pricePerNight > filters.priceMax) return false;
        if (filters.minRating > 0 && (l.rating || 0) < filters.minRating) return false;
        if (filters.wifi && !l.wifi) return false;
        if (filters.parking && !l.parking) return false;
        if (filters.mealsIncluded && !l.mealsIncluded) return false;
        if (filters.accessibility && !l.accessibility) return false;
        return true;
      });
      setDbListings(filtered);

      // 2. Call AI (Agent 2) for AI-estimated results
      const response = await fetch("/api/stays/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: filters.destination,
          budget: filters.priceMax * 5 || 50000,
          currency: "INR",
          people: filters.guests,
          days: 3,
          language,
          accommodationTypes: filters.accommodationTypes.length > 0
            ? filters.accommodationTypes
            : ["hotel", "homestay", "hostel", "resort"],
          travelGroup: filters.travelGroup || undefined,
          amenities: filters.amenities.length > 0 ? filters.amenities : undefined,
          rooms: filters.rooms,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const hotels: HotelOption[] = (data.hotels || [])
          .filter((h: any) => {
            if (filters.accommodationTypes.length > 0 && !filters.accommodationTypes.includes(h.type)) return false;
            if (filters.minRating > 0 && (h.rating || 0) < filters.minRating) return false;
            if (filters.priceMin > 0 && (h.price_per_night || 0) < filters.priceMin) return false;
            if ((h.price_per_night || 0) > filters.priceMax) return false;
            return true;
          });
        setAiResults(hotels);
        setAiRecommendations(data.recommendations || null);
      }
    } catch (err: any) {
      console.error("[Stays Search Error]:", err);
      setError("Unable to load accommodation results. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToTrip = async (hotel: HotelOption) => {
    if (!user) {
      alert("Please sign in to save a stay to your trip.");
      return;
    }
    if (!selectedTripId) {
      alert("Please select a trip first.");
      return;
    }
    try {
      await saveAccommodationToTrip(selectedTripId, hotel);
      setSaveSuccess(`"${hotel.name}" added to your trip!`);
      setTimeout(() => setSaveSuccess(""), 4000);
    } catch (err) {
      console.error("Save accommodation error:", err);
    }
  };

  // Combine verified + AI results
  const combinedHotels: HotelOption[] = [
    // Admin-verified listings take priority
    ...dbListings.map((l) => ({
      name: l.name,
      category: l.pricePerNight <= 1500 ? "Budget" : l.pricePerNight <= 5000 ? "Mid-Range" : "Luxury",
      type: l.type as any,
      price_per_night: l.pricePerNight,
      rating: l.rating || 4.0,
      description: l.description,
      lat: l.lat,
      lng: l.lng,
      amenities: l.amenities,
      meals_included: l.mealsIncluded,
      parking: l.parking,
      wifi: l.wifi,
      accessibility: l.accessibility,
      cancellation_policy: l.cancellationPolicy,
      contact: l.contact,
      booking_url: l.bookingUrl,
      govt_provider: l.govtProvider,
      govt_rules: l.govtRules,
      govt_booking_note: l.govtBookingNote,
      group_types: l.groupTypes as any,
      is_ai_estimated: false,
    })),
    // AI results
    ...aiResults,
  ];

  return (
    <div className="min-h-screen bg-[var(--cream)] pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 pt-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-[var(--sage)] border border-[var(--light-sage)] px-3 py-1.5 rounded-full text-xs font-bold text-[var(--forest)] mb-3">
            <Hotel className="w-3.5 h-3.5" />
            Stays & Accommodation
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--charcoal)] tracking-tight mb-1">
            Find Your Perfect Stay
          </h1>
          <p className="text-sm text-[var(--slate)]">
            Hotels, homestays, government stays, hostels, and resorts — all in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Filter Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-[76px]">
              <AccommodationSearch
                filters={filters}
                onChange={setFilters}
                onSearch={handleSearch}
                isLoading={isSearching}
              />
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {/* Success banner */}
            {saveSuccess && (
              <div className="flex items-center gap-2 p-4 bg-[var(--success-bg)] border border-[var(--success)]/20 rounded-2xl text-[var(--success)] text-sm font-bold animate-fade-in">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                {saveSuccess}
              </div>
            )}

            {/* Trip selector */}
            {user && userTrips.length > 0 && combinedHotels.length > 0 && (
              <div className="flex items-center gap-3 p-4 bg-white border border-[var(--light-sage)] rounded-2xl">
                <span className="text-xs font-bold text-[var(--charcoal)] shrink-0">
                  Add to trip:
                </span>
                <select
                  className="flex-1 bg-white border border-[var(--light-sage)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--charcoal)] outline-none focus:border-[var(--teal)] transition-colors"
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
                >
                  {userTrips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.destination} ({t.days} days)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-[var(--error-bg)] border border-[var(--error)]/30 rounded-2xl text-[var(--error)] text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Loading state */}
            {isSearching && (
              <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-16 flex flex-col items-center gap-4 text-center animate-fade-in">
                <Loader2 className="w-10 h-10 text-[var(--forest)] animate-spin" />
                <p className="text-sm font-bold text-[var(--charcoal)]">
                  Searching stays in {filters.destination}…
                </p>
                <p className="text-xs text-[var(--slate)]">
                  Querying AI recommendations and verified listings
                </p>
              </div>
            )}

            {/* No results yet */}
            {!isSearching && !hasSearched && (
              <div className="bg-white border border-dashed border-[var(--light-sage)] rounded-2xl p-16 text-center">
                <div className="w-16 h-16 bg-[var(--sage)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Hotel className="w-8 h-8 text-[var(--forest)]" />
                </div>
                <h3 className="text-base font-bold text-[var(--charcoal)] mb-2">
                  Discover places to stay
                </h3>
                <p className="text-sm text-[var(--slate)] max-w-sm mx-auto">
                  Enter a destination to search hotels, homestays, government stays, hostels, and resorts.
                </p>
              </div>
            )}

            {/* Results */}
            {!isSearching && hasSearched && combinedHotels.length === 0 && !error && (
              <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-12 text-center">
                <MapPin className="w-10 h-10 text-[var(--slate)] mx-auto mb-3" />
                <h3 className="text-base font-bold text-[var(--charcoal)] mb-2">
                  No stays found for "{filters.destination}"
                </h3>
                <p className="text-sm text-[var(--slate)]">
                  Try adjusting your filters or searching a nearby city.
                </p>
              </div>
            )}

            {!isSearching && combinedHotels.length > 0 && (
              <div className="animate-fade-in">
                {/* Verified listings notice */}
                {dbListings.length > 0 && (
                  <div className="flex items-center gap-2 mb-4 text-xs font-bold text-[var(--success)] bg-[var(--success-bg)] border border-[var(--success)]/20 px-4 py-2 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                    {dbListings.length} verified listing{dbListings.length !== 1 ? "s" : ""} available
                  </div>
                )}
                {aiResults.length > 0 && (
                  <div className="flex items-center gap-2 mb-4 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
                    <Sparkles className="w-4 h-4" />
                    {aiResults.length} AI-suggested options — prices are estimated, verify before booking
                  </div>
                )}

                <AccommodationGrid
                  hotels={combinedHotels}
                  destination={filters.destination}
                  onAddToTrip={user ? handleAddToTrip : undefined}
                  recommendations={aiRecommendations}
                />
              </div>
            )}

            {/* Government stays info box */}
            {hasSearched && (
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-700">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                <div>
                  <p className="font-bold mb-1">About Government Stays</p>
                  <p className="leading-relaxed">
                    Government tourist bungalows, ITDC properties, youth hostels, and state tourism
                    accommodation are operated by official bodies. AI-generated suggestions for these
                    are indicative only. For confirmed booking, contact the provider directly or visit
                    their official website (e.g., YTCA, state tourism departments).
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function StaysPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--cream)]">
          <div className="spinner" />
        </div>
      }
    >
      <StaysContent />
    </Suspense>
  );
}
