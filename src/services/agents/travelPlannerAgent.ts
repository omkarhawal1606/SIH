/**
 * AGENT 1 — TRAVEL PLANNER & ITINERARY AGENT
 *
 * Responsibilities:
 *  - Core destination planning
 *  - Day-by-day scheduling for exactly N days
 *  - 4 slots per day (morning, afternoon, evening, night)
 *  - Activity sequencing, realistic timing, and coordinate tagging
 *  - Season guidance and clothing checklist
 *
 * API Key: GEMINI_TRAVEL_PLANNER_API_KEY (with fallback to GEMINI_API_KEY)
 */

import { getAgent1Key, executeAgentPrompt, extractJsonFromText } from "./client";
import { Agent1TravelPlannerInput, Agent1TravelPlannerOutput } from "./types";
import { getLanguageInstruction } from "@/lib/i18n/ai";
import { agentCache } from "./cache";

export async function runTravelPlannerAgent(
  input: Agent1TravelPlannerInput
): Promise<Agent1TravelPlannerOutput> {
  const lang = input.language || "en";
  const cacheKey = agentCache.makeTripPlanKey(input.destination, input.days, lang);

  // Check reusable cache
  const cached = agentCache.get<Agent1TravelPlannerOutput>(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = getAgent1Key();
  const interestsStr =
    input.interests && input.interests.length > 0
      ? input.interests.join(", ")
      : "Sightseeing, Local Culture, Heritage, Cuisine";

  const prompt = `You are AGENT 1: The Master Travel Itinerary Architect.
Your sole mission is to design a complete, immersive, day-by-day ${input.days}-DAY itinerary to "${input.destination}".
Trip Window: ${input.startDate} to ${input.endDate} (Total: exactly ${input.days} days).
Travelers: ${input.people} person(s).
Budget Bracket: ${input.currency} ${input.budget}.
Interests: ${interestsStr}.

${getLanguageInstruction(lang)}

MANDATORY ITINERARY REQUIREMENTS:
1. ITINERARY COMPLETENESS: Generate exactly ${input.days} day objects in the "itinerary" array (days 1 through ${input.days}).
2. 4 TIME SLOTS PER DAY: Every day MUST contain all 4 slots: "morning", "afternoon", "evening", and "night".
   For each slot provide:
   - "place": exact name of the attraction, monument, or neighborhood
   - "activity": engaging description of what to do
   - "transport": realistic travel advice (e.g. "15 min auto-rickshaw", "10 min walk")
   - "lat": approximate latitude float
   - "lng": approximate longitude float
3. LOGICAL GEOGRAPHIC ORDERING: Sequence places so travel between consecutive slots is realistic and minimized.
4. DAILY BUDGET: Estimate realistic "daily_cost" number per day.
5. SEASON & CLOTHING: Provide accurate "season_info" and a 3-5 item "clothing" array suitable for the climate.

RETURN STRICT JSON ONLY MATCHING THIS SCHEMA:
{
  "destination": "${input.destination}",
  "days": ${input.days},
  "season_info": "...",
  "clothing": ["Comfortable walking shoes", "..."],
  "itinerary": [
    {
      "day": 1,
      "date": "${input.startDate}",
      "daily_cost": ${Math.round(input.budget / input.days)},
      "slots": {
        "morning": { "place": "...", "activity": "...", "transport": "...", "lat": 0.0, "lng": 0.0 },
        "afternoon": { "place": "...", "activity": "...", "transport": "...", "lat": 0.0, "lng": 0.0 },
        "evening": { "place": "...", "activity": "...", "transport": "...", "lat": 0.0, "lng": 0.0 },
        "night": { "place": "...", "activity": "...", "transport": "...", "lat": 0.0, "lng": 0.0 }
      }
    }
  ]
}`;

  const raw = await executeAgentPrompt(apiKey, prompt, {
    agentLabel: "Agent 1: Travel Planner",
    temperature: 0.35,
    timeoutMs: 35000,
    expectJson: true,
  });

  const parsed = extractJsonFromText(raw);

  const output: Agent1TravelPlannerOutput = {
    destination: parsed.destination || input.destination,
    days: Number(parsed.days) || input.days,
    itinerary: Array.isArray(parsed.itinerary) ? parsed.itinerary : [],
    season_info: parsed.season_info || `Seasonal travel weather in ${input.destination}`,
    clothing: Array.isArray(parsed.clothing) ? parsed.clothing : ["Comfortable walking shoes", "Light layers"],
    trip_summary: parsed.trip_summary,
  };

  // Cache valid output
  if (output.itinerary.length > 0) {
    agentCache.set(cacheKey, output, 3600); // 1 hour
  }

  return output;
}

/**
 * Handles chat queries directed specifically at itinerary planning and scheduling.
 */
export async function runTravelPlannerChat(
  question: string,
  context: any,
  messages: any[],
  language = "en"
): Promise<string> {
  const apiKey = getAgent1Key();

  const prompt = `You are AGENT 1: Wanderly's Travel Planner & Itinerary Architect.
You help travelers with scheduling, attractions, activity sequencing, and optimizing day-by-day travel plans.

${getLanguageInstruction(language)}

TRIP CONTEXT:
${context ? JSON.stringify(context).slice(0, 1000) : "General destination inquiry"}

RECENT CONVERSATION:
${messages.slice(-4).map((m: any) => `${m.role === "user" ? "Traveler" : "Planner"}: ${m.content}`).join("\n")}

Traveler's Question: ${question.trim()}

Respond authoritatively, clearly, and concisely as Agent 1 (Travel Planner):`;

  return executeAgentPrompt(apiKey, prompt, {
    agentLabel: "Agent 1: Travel Planner (Chat)",
    temperature: 0.5,
    timeoutMs: 25000,
    expectJson: false,
  });
}
