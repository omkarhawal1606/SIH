import { NextRequest, NextResponse } from "next/server";
import { generateCompleteTrip } from "@/services/agents/orchestrator";

function calculateDays(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 1;
  const [sy, sm, sd] = startDateStr.split("-").map(Number);
  const [ey, em, ed] = endDateStr.split("-").map(Number);
  if (!sy || !sm || !sd || !ey || !em || !ed) return 1;
  
  const startUtc = Date.UTC(sy, sm - 1, sd);
  const endUtc = Date.UTC(ey, em - 1, ed);
  const diffDays = Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      destination,
      startDate,
      endDate,
      budget,
      interests,
      people,
      currency = "INR",
      language = "en",
      preferences,
      transportation,
      transportationModes,
      accommodationTypes = body.accommodationPreferences?.types,
      travelGroup = body.accommodationPreferences?.travelGroup,
      amenities = body.accommodationPreferences?.amenities,
      rooms = body.accommodationPreferences?.rooms,
    } = body;

    if (!destination || typeof destination !== "string" || destination.trim().length === 0) {
      return NextResponse.json({ error: "A valid destination is required." }, { status: 400 });
    }

    const days = calculateDays(startDate, endDate);

    // Multi-Agent Execution:
    // Agent 1 (Planner) -> Parallel [Agent 2 (Stays & Food) + Agent 3 (Transport & Safety)] -> Agent 4 (Intelligence)
    const tripResult = await generateCompleteTrip({
      destination: destination.trim(),
      startDate,
      endDate,
      days,
      budget: Number(budget) || 25000,
      people: Number(people) || 1,
      currency: currency || "INR",
      interests: Array.isArray(interests) ? interests : [],
      preferences,
      language: language || "en",
      transportation: transportation || "cab",
      transportationModes: Array.isArray(transportationModes) && transportationModes.length > 0
        ? transportationModes
        : transportation ? [transportation] : ["cab"],
      accommodationTypes: Array.isArray(accommodationTypes) ? accommodationTypes : undefined,
      travelGroup: travelGroup || undefined,
      amenities: Array.isArray(amenities) ? amenities : undefined,
      rooms: rooms ? Number(rooms) : undefined,
    });

    return NextResponse.json(tripResult);
  } catch (error: any) {
    console.error("[API Generate Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate trip with multi-agent system." },
      { status: 500 }
    );
  }
}
