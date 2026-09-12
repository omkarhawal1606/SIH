import { NextRequest, NextResponse } from "next/server";
import { runStayFoodExperienceAgent } from "@/services/agents/stayFoodExperienceAgent";
import { getAccommodationListings } from "@/lib/db";
import type { HotelRecommendation } from "@/services/agents/types";

export const maxDuration = 45;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      destination,
      budget = 30000,
      currency = "INR",
      people = 2,
      days = 3,
      language = "en",
      accommodationTypes,
      travelGroup,
      amenities,
      rooms,
    } = body;

    if (!destination || typeof destination !== "string") {
      return NextResponse.json({ error: "Destination is required." }, { status: 400 });
    }

    const trimmedDest = destination.trim();

    // 1. Run AI Stay & Food Agent
    const result = await runStayFoodExperienceAgent({
      destination: trimmedDest,
      budget: Number(budget) || 30000,
      currency,
      people: Number(people) || 2,
      days: Number(days) || 3,
      language,
      accommodationTypes: Array.isArray(accommodationTypes) ? accommodationTypes : undefined,
      travelGroup: travelGroup || undefined,
      amenities: Array.isArray(amenities) ? amenities : undefined,
      rooms: rooms ? Number(rooms) : undefined,
    });

    // 2. Fetch verified approved accommodations from Firestore
    try {
      const approvedListings = await getAccommodationListings({
        destination: trimmedDest,
        adminView: false,
      });

      if (approvedListings && approvedListings.length > 0) {
        const verifiedHotels: HotelRecommendation[] = approvedListings.map((l) => ({
          category: l.pricePerNight < 1500 ? "Budget" : l.pricePerNight < 4000 ? "Mid-Range" : "Luxury",
          type: (l.type === "eco_stay" || l.type === "guest_house") ? "resort" : (l.type as any),
          name: l.name,
          price_per_night: l.pricePerNight,
          rating: l.rating || 4.7,
          description: l.description,
          lat: l.lat,
          lng: l.lng,
          amenities: l.amenities || ["WiFi", "Clean Rooms"],
          location_notes: l.address ? `${l.address}, ${l.destination}` : l.destination,
          meals_included: Boolean(l.mealsIncluded),
          parking: Boolean(l.parking),
          wifi: Boolean(l.wifi),
          accessibility: Boolean(l.accessibility),
          contact: l.contact,
          booking_url: l.bookingUrl,
          is_ai_estimated: false,
          is_verified: true,
          ai_label: "bestComfort",
        }));

        // Prepend verified approved properties so travelers see official providers first
        result.hotels = [...verifiedHotels, ...result.hotels];
        if (verifiedHotels.length > 0 && result.recommendations) {
          result.recommendations.bestComfort = verifiedHotels[0];
        }
      }
    } catch (dbErr) {
      console.warn("[Stays Search API] Firestore approved properties fetch note:", dbErr);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Stays Search API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch accommodation recommendations." },
      { status: 500 }
    );
  }
}
