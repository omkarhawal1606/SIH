import { NextRequest, NextResponse } from "next/server";
import { generateCulturalDossier } from "@/services/agents/orchestrator";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { place, regionOrCountry, language = "en", section = "all" } = body;

    if (!place || typeof place !== "string" || place.trim().length === 0) {
      return NextResponse.json(
        { error: "A valid place or monument name is required." },
        { status: 400 }
      );
    }

    const targetPlace = place.trim();
    console.log(`[Cultural Place API] Dispatching to Agent 4 for "${targetPlace}" (${language}, ${section})`);

    const data = await generateCulturalDossier(
      targetPlace,
      "place",
      language,
      undefined,
      section,
      regionOrCountry
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
    console.error("Cultural Place API Error (Agent 4):", error);
    return NextResponse.json(
      {
        error: "We couldn't prepare your cultural guide right now. Please try again.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
