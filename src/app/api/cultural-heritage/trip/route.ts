import { NextRequest, NextResponse } from "next/server";
import { sanitizeTripForCulturalAI } from "@/lib/cultural";
import { generateCulturalDossier } from "@/services/agents/orchestrator";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { trip, language = "en", section = "all" } = body;

    if (!trip || !trip.destination) {
      return NextResponse.json(
        { error: "Invalid trip details provided. Destination is required." },
        { status: 400 }
      );
    }

    const sanitized = sanitizeTripForCulturalAI(trip);
    if (!sanitized) {
      return NextResponse.json({ error: "Could not sanitize trip data." }, { status: 400 });
    }

    console.log(
      `[Cultural Trip API] Dispatching to Agent 4 for "${sanitized.destination}" (${language}, ${section})`
    );

    const data = await generateCulturalDossier(
      sanitized.destination,
      "trip",
      language,
      sanitized,
      section
    );

    const duration = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      data,
      section,
      agentUsed: "agent4",
      agentName: "Agent 4: Travel Intelligence & Cultural Historian",
      durationMs: duration,
      cached: false,
    });
  } catch (error: any) {
    console.error("Cultural Trip API Error (Agent 4):", error);
    return NextResponse.json(
      {
        error: "We couldn't prepare your cultural guide right now. Please try again.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
