/**
 * AGENT 4 — TRAVEL INTELLIGENCE & VERIFICATION AGENT
 *
 * Responsibilities:
 *  - Final cross-agent verification & conflict detection
 *  - Deduplication and schedule optimization
 *  - Budget consistency and feasibility scoring
 *  - Cultural & Heritage intelligence integration
 *  - Standalone Cultural & Heritage dossier generation
 *  - Production of the final verified Wanderly trip blueprint
 *
 * API Key: GEMINI_TRAVEL_INTELLIGENCE_API_KEY (with fallback to GEMINI_CULTURE_API_KEY / GEMINI_API_KEY)
 */

import { getAgent4Key, executeAgentPrompt, extractJsonFromText } from "./client";
import {
  Agent4TravelIntelligenceInput,
  Agent4FinalTripOutput,
} from "./types";
import { getLanguageInstruction } from "@/lib/i18n/ai";
import { type CulturalHeritageData } from "@/lib/cultural";
import { agentCache } from "./cache";

export async function runTravelIntelligenceAgent(
  input: Agent4TravelIntelligenceInput
): Promise<Agent4FinalTripOutput> {
  const apiKey = getAgent4Key();
  const lang = input.language || "en";

  const prompt = `You are AGENT 4: The Chief Travel Intelligence, Cross-Verification & Cultural Synthesizer.
Cross-verify the preliminary trip inputs for "${input.destination}" (${input.days} days, ${input.people} travelers, budget ${input.currency} ${input.budget}).

${getLanguageInstruction(lang)}

SUMMARY CONTEXT:
- Sights & Schedule: ${Array.isArray(input.travelPlan?.itinerary) ? input.travelPlan.itinerary.map(d => `Day ${d.day}: ${d.slots?.morning?.place || ""}, ${d.slots?.afternoon?.place || ""}`).join(" | ") : ""}
- Accommodations: ${Array.isArray(input.stayFoodExperience?.hotels) ? input.stayFoodExperience.hotels.map(h => h.name).join(", ") : ""}
- Budget Feasibility: ${input.transportBudgetSafety?.budget_analysis?.is_budget_feasible !== false ? "Feasible" : "Constrained"} (${input.currency} ${input.budget})
- Safety Assessment: ${input.transportBudgetSafety?.safety?.safety_level || "safe"}

YOUR TASKS:
1. VERIFY: Confirm destination safety, lack of schedule conflicts, and budget realism.
2. CULTURAL ENRICHMENT: Provide an evocative 2-sentence cultural overview snippet, 2-3 key traditions, and 2-3 etiquette tips for ${input.destination}.
3. SCORING: Provide a feasibility score (1-100) and brief optimization note.

RETURN STRICT JSON ONLY MATCHING THIS SCHEMA:
{
  "status": "valid",
  "safety_level": "${input.transportBudgetSafety?.safety?.safety_level || "safe"}",
  "safety_warning": "${input.transportBudgetSafety?.safety?.safety_warning || ""}",
  "culture": {
    "overview_snippet": "Evocative cultural essence of ${input.destination}...",
    "traditions": ["...", "..."],
    "cultural_etiquette": ["...", "..."]
  },
  "verification": {
    "conflicts_detected": [],
    "optimizations_applied": ["Verified geographic sequence and budget realism."],
    "feasibility_score": 95
  }
}`;

  const raw = await executeAgentPrompt(apiKey, prompt, {
    agentLabel: "Agent 4: Travel Intelligence",
    temperature: 0.2,
    timeoutMs: 25000,
    expectJson: true,
  });

  const parsed = extractJsonFromText(raw);

  // Merge weather data into itinerary days if present
  const finalizedItinerary = Array.isArray(input.travelPlan.itinerary) ? [...input.travelPlan.itinerary] : [];
  if (Array.isArray(input.weatherForecasts)) {
    for (const item of finalizedItinerary) {
      const match = input.weatherForecasts.find((wf) => wf.day === item.day);
      if (match && match.weather) {
        item.weather = match.weather;
      }
    }
  }

  return {
    status: parsed.status === "invalid" || parsed.status === "unsafe" ? parsed.status : "valid",
    safety_level: parsed.safety_level || input.transportBudgetSafety.safety.safety_level || "safe",
    safety_warning: parsed.safety_warning || input.transportBudgetSafety.safety.safety_warning,
    destination: input.destination,
    startDate: input.startDate,
    endDate: input.endDate,
    days: input.days,
    people: input.people,
    budget: input.budget,
    currency: input.currency,
    language: lang,
    planningLanguage: lang,
    itinerary: finalizedItinerary,
    hotels: input.stayFoodExperience.hotels,
    restaurants: input.stayFoodExperience.restaurants,
    events: (input.stayFoodExperience.experiences as any) || [],
    cost_breakdown: input.transportBudgetSafety.cost_breakdown,
    emergency: input.transportBudgetSafety.safety.emergency,
    season_info: input.travelPlan.season_info,
    clothing: input.travelPlan.clothing,
    culture: parsed.culture || {
      overview_snippet: `${input.destination} offers rich cultural traditions and heritage.`,
      traditions: ["Local celebrations", "Regional crafts"],
      cultural_etiquette: ["Respect local customs", "Modest attire at sacred sites"],
    },
    verification: parsed.verification || {
      conflicts_detected: [],
      optimizations_applied: ["Verified geographic sequence and budget realism."],
      feasibility_score: 95,
    },
  };
}

/**
 * AGENT 4 Cultural & Heritage Dossier Generator (Place & Trip)
 * Supports progressive sections ("core", "extended", "all") for rapid rendering.
 */
export async function runCulturalIntelligenceDossier(
  target: string,
  mode: "place" | "trip",
  language = "en",
  tripData?: any,
  section: "all" | "core" | "extended" = "all",
  regionOrCountry?: string
): Promise<CulturalHeritageData | any> {
  const cacheKey = `${agentCache.makeCulturalKey(target, language, mode)}_${section}`;
  const cached = agentCache.get<any>(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = getAgent4Key();

  const contextHint =
    mode === "trip" && tripData
      ? `Trip Itinerary Context: ${Array.isArray(tripData.itinerary) ? tripData.itinerary.map((d: any) => `Day ${d.day}: ${d.slots?.morning?.place || ""}, ${d.slots?.afternoon?.place || ""}`).join(" | ") : ""}`
      : regionOrCountry
      ? `Regional Context: ${regionOrCountry}`
      : "";

  let prompt = "";

  if (section === "core") {
    prompt = `You are AGENT 4: The Cultural & Heritage Intelligence Specialist and World Historian.
Generate the CORE Cultural & Heritage Guide for: "${target}" (${mode === "trip" ? "Trip Journey" : "Heritage Site"}).
${contextHint}

${getLanguageInstruction(language)}

REQUIREMENTS:
1. "overview": { "title", "location", "historicalBackground", "culturalIdentity", "historicalPeriod", "majorTraditions" }
2. "${mode === "trip" ? "tripStory" : "placeStory"}": An evocative, atmospheric narrative bringing the soul and history of ${target} to life.
3. "heritagePlaces": Array of 3-5 sub-monuments/sites with name, historicalPeriod, historicalBackground, historicalSignificance, historicalStory.
4. "historicalFacts": Array of 3-5 strictly verified historical facts with periodOrEra and sourceOrAuthority.
5. "legends": Array of 2-3 local oral folklore tales with title, story, culturalMeaning, warningNote.
6. "historicalFigures": Array of 2-4 prominent historical figures with name, role, era, significance.

RETURN STRICT JSON ONLY MATCHING CORE SCHEMA:
{
  "overview": {
    "title": "${target} — Heritage & Cultural Dossier",
    "location": "${target}",
    "historicalBackground": "...",
    "culturalIdentity": "...",
    "historicalImportance": "...",
    "historicalPeriod": "...",
    "culturalSignificance": "...",
    "majorTraditions": ["..."]
  },
  "${mode === "trip" ? "tripStory" : "placeStory"}": "...",
  "heritagePlaces": [{ "name": "...", "historicalPeriod": "...", "historicalBackground": "...", "historicalSignificance": "...", "historicalStory": "..." }],
  "historicalFacts": [{ "fact": "...", "periodOrEra": "...", "sourceOrAuthority": "Historical consensus" }],
  "legends": [{ "title": "...", "story": "...", "culturalMeaning": "...", "warningNote": "Oral folklore" }],
  "historicalFigures": [{ "name": "...", "role": "...", "era": "...", "significance": "..." }]
}`;
  } else if (section === "extended") {
    prompt = `You are AGENT 4: The Cultural Anthropologist and Culinary Historian.
Generate the EXTENDED Cultural, Culinary & Practical Traditions for: "${target}".
${contextHint}

${getLanguageInstruction(language)}

REQUIREMENTS:
1. "localCulture": { "traditions", "artAndHandicrafts", "musicAndDance", "clothingAndAttire", "customsAndSocialNorms" }
2. "culinaryHeritage": Array of authentic regional dishes with name, description, culturalOrigin, isMustTry.
3. "festivals": Array of cultural celebrations with name, timing, celebrationStyle, culturalSignificance.
4. "localPhrases": Array of regional phrases with phrase, englishMeaning, pronunciation, context.
5. "culturalEtiquette": { "dos", "donts", "attireGuidance", "photographyRules" }
6. "hiddenGems": Array of offbeat heritage locations nearby.

RETURN STRICT JSON ONLY MATCHING EXTENDED SCHEMA:
{
  "localCulture": {
    "traditions": ["..."],
    "artAndHandicrafts": ["..."],
    "musicAndDance": ["..."],
    "clothingAndAttire": ["..."],
    "customsAndSocialNorms": ["..."]
  },
  "culinaryHeritage": [{ "name": "...", "description": "...", "culturalOrigin": "...", "isMustTry": true }],
  "festivals": [{ "name": "...", "timing": "...", "celebrationStyle": "...", "culturalSignificance": "..." }],
  "localPhrases": [{ "phrase": "...", "englishMeaning": "...", "pronunciation": "...", "context": "..." }],
  "culturalEtiquette": { "dos": ["..."], "donts": ["..."], "attireGuidance": "...", "photographyRules": "..." },
  "hiddenGems": [{ "name": "...", "distanceOrLocation": "...", "whyVisit": "...", "culturalValue": "..." }]
}`;
  } else {
    // Complete section ("all")
    prompt = `You are AGENT 4: The Cultural & Heritage Intelligence Specialist.
Produce a rich, authoritative Cultural & Heritage Dossier for "${target}" (${mode === "trip" ? "Trip Cultural Story" : "Place Cultural Guide"}).
${contextHint}

${getLanguageInstruction(language)}

REQUIREMENTS:
1. "overview": { "title", "location", "historicalBackground", "culturalIdentity", "historicalPeriod", "majorTraditions" }
2. "${mode === "trip" ? "tripStory" : "placeStory"}": An immersive, vivid narrative suitable for text-to-speech storytelling.
3. "heritagePlaces": Array of 3-5 monuments with name, historicalPeriod, historicalBackground, historicalStory.
4. "historicalFacts": Array of 3-5 verified historical facts with periodOrEra and sourceOrAuthority.
5. "legends": Array of 2-3 local folklore tales with title, story, warningNote.
6. "historicalFigures": Array of 2-4 key historical personalities with name, role, era, significance.
7. "localCulture": { "traditions", "musicAndDance", "artAndHandicrafts", "clothingAndAttire", "customsAndSocialNorms" }.
8. "culinaryHeritage": Array of 3-5 authentic dishes with name, description, culturalOrigin, isMustTry.
9. "festivals": Array of 2-4 cultural celebrations with name, timing, celebrationStyle.
10. "localPhrases": Array of 4-6 regional phrases with phrase, englishMeaning, pronunciation, context.
11. "culturalEtiquette": { "dos", "donts", "attireGuidance", "photographyRules" }.
12. "hiddenGems": Array of 2-3 nearby offbeat heritage spots.

RETURN STRICT JSON ONLY MATCHING CulturalHeritageData SCHEMA:`;
  }

  const raw = await executeAgentPrompt(apiKey, prompt, {
    agentLabel: `Agent 4: Cultural Intelligence Dossier (${section})`,
    temperature: 0.35,
    timeoutMs: 40000,
    expectJson: true,
  });

  const parsed = extractJsonFromText(raw);
  agentCache.set(cacheKey, parsed, 7200); // 2 hours
  return parsed;
}

/**
 * Handles chat queries concerning history, monuments, folklore, traditions, and verification.
 */
export async function runTravelIntelligenceChat(
  question: string,
  context: any,
  messages: any[],
  language = "en"
): Promise<string> {
  const apiKey = getAgent4Key();

  const prompt = `You are AGENT 4: Wanderly's Cultural Historian & Travel Intelligence Guide.
You assist travelers with deep historical insights, monument significance, folklore, cultural etiquette, verified facts, and verifying travel details.

${getLanguageInstruction(language)}

CURRENT CONTEXT:
${context ? JSON.stringify(context).slice(0, 1000) : "Heritage exploration"}

RECENT CONVERSATION:
${messages.slice(-4).map((m: any) => `${m.role === "user" ? "Traveler" : "Historian"}: ${m.content}`).join("\n")}

Traveler's Question: ${question.trim()}

Provide a rich, respectful, historically accurate and engaging response as Agent 4:`;

  return executeAgentPrompt(apiKey, prompt, {
    agentLabel: "Agent 4: Cultural Historian (Chat)",
    temperature: 0.45,
    timeoutMs: 25000,
    expectJson: false,
  });
}
