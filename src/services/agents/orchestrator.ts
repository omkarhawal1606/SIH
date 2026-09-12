/**
 * Wanderly Multi-Agent Orchestrator (Backend AI Controller)
 *
 * NOTE: The Orchestrator is PURE BACKEND CONTROLLER LOGIC — NOT an AI agent.
 *
 * Responsibilities:
 *  - Manages dependencies and parallel execution across the 4 specialized agents
 *  - Executes Agent 2 and Agent 3 concurrently via Promise.all after Agent 1 completes
 *  - Fetches live weather and external geocoding concurrently
 *  - Passes intermediate state to Agent 4 for cross-verification & synthesis
 *  - Performs intelligent request routing for the Chatbot across the 4 agents
 *  - Directs Cultural & Heritage dossiers to Agent 4
 */

import { runTravelPlannerAgent, runTravelPlannerChat } from "./travelPlannerAgent";
import { runStayFoodExperienceAgent, runStayFoodChat } from "./stayFoodExperienceAgent";
import { runTransportBudgetSafetyAgent, runTransportBudgetSafetyChat } from "./transportBudgetSafetyAgent";
import {
  runTravelIntelligenceAgent,
  runCulturalIntelligenceDossier,
  runTravelIntelligenceChat,
} from "./travelIntelligenceAgent";
import {
  Agent1TravelPlannerInput,
  Agent4FinalTripOutput,
  AgentRole,
} from "./types";
import { getCoordinates, getDailyWeather } from "@/lib/weather";
import type { CulturalHeritageData } from "@/lib/cultural";

export interface GenerateTripParams {
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  budget: number;
  people: number;
  currency?: string;
  interests?: string[];
  preferences?: Record<string, any>;
  language?: string;
  transportation?: string;
  transportationModes?: string[];
  /** Accommodation preferences from TripForm */
  accommodationTypes?: string[];
  travelGroup?: string;
  amenities?: string[];
  rooms?: number;
}

export interface OrchestrationResult extends Agent4FinalTripOutput {
  timingMs: {
    agent1: number;
    agent2: number;
    agent3: number;
    agent4: number;
    weather: number;
    total: number;
  };
  agentGraph: {
    agent1: string;
    agent2: string;
    agent3: string;
    agent4: string;
    parallelStage: string;
  };
}

import { agentCache } from "./cache";

// In-memory registry for in-flight trip generation requests to prevent duplicate parallel processing
const globalForInFlight = globalThis as unknown as {
  wanderlyInFlightTrips?: Map<string, Promise<OrchestrationResult>>;
};
const inFlightTripRequests =
  globalForInFlight.wanderlyInFlightTrips || new Map<string, Promise<OrchestrationResult>>();
if (process.env.NODE_ENV !== "production") {
  globalForInFlight.wanderlyInFlightTrips = inFlightTripRequests;
}

/**
 * Executes full multi-agent trip generation:
 * - Stage 1 (Fully Parallel): Agents 1, 2, 3, and Geocoding execute concurrently via Promise.all
 * - Stage 2 (Synthesis & Cross-Verification): Weather forecasting + Agent 4 cross-verification
 * Includes in-flight request deduplication and trip-level caching.
 */
export async function generateCompleteTrip(
  params: GenerateTripParams
): Promise<OrchestrationResult> {
  const overallStart = Date.now();
  const lang = params.language || "en";
  const currency = params.currency || "INR";

  // ── 1. Check Full-Trip Cache ────────────────────────────────────────────────
  const tripCacheKey = agentCache.makeFullTripKey(
    params.destination,
    params.days,
    params.people,
    params.budget,
    currency,
    lang
  );

  const cachedTrip = agentCache.get<OrchestrationResult>(tripCacheKey);
  if (cachedTrip) {
    console.log(`[Orchestrator] Full-trip cache HIT for "${params.destination}" (${lang})`);
    return {
      ...cachedTrip,
      timingMs: {
        agent1: 0,
        agent2: 0,
        agent3: 0,
        agent4: 0,
        weather: 0,
        total: Date.now() - overallStart,
      },
    };
  }

  // ── 2. In-Flight Request Deduplication ─────────────────────────────────────
  if (inFlightTripRequests.has(tripCacheKey)) {
    console.log(`[Orchestrator] In-flight request deduplicated for "${params.destination}" (${lang})`);
    return await inFlightTripRequests.get(tripCacheKey)!;
  }

  const executionPromise = (async (): Promise<OrchestrationResult> => {
    // ── STAGE 1: FULLY PARALLEL EXECUTION (Agents 1, 2, 3 + Geocoding) ────────
    const stage1Start = Date.now();

    const plannerInput: Agent1TravelPlannerInput = {
      destination: params.destination,
      startDate: params.startDate,
      endDate: params.endDate,
      days: params.days,
      people: params.people,
      budget: params.budget,
      currency,
      interests: params.interests,
      preferences: params.preferences,
      language: lang,
    };

    // Pre-fetch geocoordinates for destination concurrently
    const coordsPromise = getCoordinates(params.destination).catch((err) => {
      console.warn("[Orchestrator] Geocoding prefetch failed:", err?.message || err);
      return null;
    });

    // Run Agent 1, Agent 2, Agent 3, and Geocoding all concurrently
    const [travelPlan, stayFoodExperience, transportBudgetSafety, coords] = await Promise.all([
      runTravelPlannerAgent(plannerInput),
      runStayFoodExperienceAgent({
        destination: params.destination,
        budget: params.budget,
        currency,
        people: params.people,
        days: params.days,
        interests: params.interests,
        language: lang,
        accommodationTypes: params.accommodationTypes as any,
        travelGroup: params.travelGroup as any,
        amenities: params.amenities,
        rooms: params.rooms,
      }),
      runTransportBudgetSafetyAgent({
        destination: params.destination,
        startDate: params.startDate,
        endDate: params.endDate,
        days: params.days,
        people: params.people,
        budget: params.budget,
        currency,
        language: lang,
        transportationModes: params.transportationModes,
      }),
      coordsPromise,
    ]);

    const stage1Duration = Date.now() - stage1Start;

    // ── STAGE 2: Weather Resolution & Agent 4 Verification ────────────────────
    const weatherStart = Date.now();
    let forecasts: any[] = [];
    try {
      if (coords && Array.isArray(travelPlan.itinerary)) {
        forecasts = await Promise.all(
          travelPlan.itinerary.map(async (item) => {
            try {
              const itemDate = new Date(params.startDate);
              itemDate.setDate(itemDate.getDate() + (item.day - 1));
              const w = await getDailyWeather(coords.lat, coords.lon, itemDate);
              return { day: item.day, weather: w };
            } catch {
              return { day: item.day, weather: null };
            }
          })
        );
      }
    } catch {
      // Ignore weather errors gracefully
    }
    const weatherDuration = Date.now() - weatherStart;

    // Run Agent 4 (Travel Intelligence & Verification Agent)
    const a4Start = Date.now();
    const finalTrip = await runTravelIntelligenceAgent({
      destination: params.destination,
      startDate: params.startDate,
      endDate: params.endDate,
      days: params.days,
      people: params.people,
      budget: params.budget,
      currency,
      language: lang,
      travelPlan,
      stayFoodExperience,
      transportBudgetSafety,
      weatherForecasts: forecasts,
    });
    const a4Duration = Date.now() - a4Start;

    const totalDuration = Date.now() - overallStart;

    console.log(
      `[Orchestrator] Multi-Agent Trip Complete in ${totalDuration}ms | Stage 1 (Agents 1,2,3 Parallel): ${stage1Duration}ms | Stage 2 (Agent 4): ${a4Duration}ms`
    );

    const result: OrchestrationResult = {
      ...finalTrip,
      timingMs: {
        agent1: stage1Duration,
        agent2: stage1Duration,
        agent3: stage1Duration,
        agent4: a4Duration,
        weather: weatherDuration,
        total: totalDuration,
      },
      agentGraph: {
        agent1: "Agent 1: Travel Planner & Itinerary Agent",
        agent2: "Agent 2: Stay, Food & Experience Agent",
        agent3: "Agent 3: Transport, Budget & Safety Agent",
        agent4: "Agent 4: Travel Intelligence & Verification Agent",
        parallelStage: "Agents 1, 2, and 3 executed concurrently via Promise.all",
      },
    };

    // Cache the completed trip
    agentCache.set(tripCacheKey, result, 3600); // 1 hour TTL
    return result;
  })();

  inFlightTripRequests.set(tripCacheKey, executionPromise);
  try {
    return await executionPromise;
  } finally {
    inFlightTripRequests.delete(tripCacheKey);
  }
}

/**
 * Smart Chat Router
 * Evaluates the traveler's question and dispatches directly to the single most
 * appropriate agent among the 4 specialized agents.
 */
export async function routeChatMessage(params: {
  question: string;
  context?: any;
  messages?: any[];
  language?: string;
}): Promise<{ response: string; agentUsed: AgentRole; agentName: string; reason: string }> {
  const { question, context, messages = [], language = "en" } = params;
  const q = question.toLowerCase();

  // Keyword intent heuristics across supported languages
  const stayFoodKeywords = [
    "hotel", "stay", "resort", "hostel", "homestay", "room", "accommodation", "check-in", "checkin",
    "food", "eat", "restaurant", "cafe", "dining", "dish", "cuisine", "breakfast", "lunch", "dinner",
    "snack", "sweet", "thali", "veg", "non-veg", "vegan",
    // Indic terms
    "होटल", "मुक्काम", "जेवण", "भोजन", "खाना", "खाद्य", "मिठाई", "விடுதி", "ஹோட்டல்", "உணவு", "சாப்பாடு",
    "హోటల్", "ఆహారం", "తిండి", "ಹೋಟೆಲ್", "ಊಟ", "ತಿಂಡಿ", "ഹോട്ടൽ", "ഭക്ഷണം", "হোটেল", "খাবার",
    "હોટેલ", "ખોરાક", "ਜਮ੍ਹਾਂ", "ਖਾਣਾ"
  ];

  const transportSafetyKeywords = [
    "flight", "train", "bus", "taxi", "cab", "metro", "auto", "car", "drive", "transit", "reach",
    "airport", "railway", "station", "fare", "commute", "distance",
    "budget", "cost", "price", "expensive", "cheap", "rupees", "inr", "total expense",
    "safe", "safety", "danger", "caution", "scam", "police", "hospital", "ambulance", "helpline", "emergency",
    // Indic terms
    "ट्रेन", "विमान", "बस", "गाड़ी", "भाडे", "खर्च", "बजेट", "सुरक्षा", "पोलीस", "रुग्णवाहिका",
    "விமானம்", "ரயில்", "பேருந்து", "செலவு", "பட்ஜெட்", "பாதுகாப்பு",
    "రైలు", "విమానం", "బస్సు", "ఖర్చు", "భద్రత", "ರೈಲು", "ವಿಮಾನ", "ವೆಚ್ಚ", "ಸುರಕ್ಷತೆ"
  ];

  const itineraryPlannerKeywords = [
    "reschedule", "reorder", "change day", "swap", "add day", "skip", "schedule", "timing", "hours",
    "how many days", "itinerary", "plan", "time slot", "morning slot", "afternoon slot",
    // Indic terms
    "वेळापत्रक", "दिवस", "बदला", "योजना", "திட்டம்", "கால அட்டவணை", "সময়সূচি"
  ];

  // Routing Decision
  let selectedAgent: AgentRole = "agent4";
  let agentName = "Agent 4: Travel Intelligence & Cultural Historian";
  let reason = "Cultural, historical, heritage, or general travel intelligence query";

  if (stayFoodKeywords.some((kw) => q.includes(kw))) {
    selectedAgent = "agent2";
    agentName = "Agent 2: Stay, Food & Experience Specialist";
    reason = "Inquiry pertains to accommodations, local cuisine, restaurants, or dining";
  } else if (transportSafetyKeywords.some((kw) => q.includes(kw))) {
    selectedAgent = "agent3";
    agentName = "Agent 3: Transport, Budget & Safety Analyst";
    reason = "Inquiry pertains to transit routes, commute, financial budget, or safety precautions";
  } else if (itineraryPlannerKeywords.some((kw) => q.includes(kw))) {
    selectedAgent = "agent1";
    agentName = "Agent 1: Travel Planner & Itinerary Architect";
    reason = "Inquiry pertains to itinerary adjustments, scheduling, or attraction sequencing";
  }

  // Dispatch to the selected agent
  let response = "";
  if (selectedAgent === "agent1") {
    response = await runTravelPlannerChat(question, context, messages, language);
  } else if (selectedAgent === "agent2") {
    response = await runStayFoodChat(question, context, messages, language);
  } else if (selectedAgent === "agent3") {
    response = await runTransportBudgetSafetyChat(question, context, messages, language);
  } else {
    response = await runTravelIntelligenceChat(question, context, messages, language);
  }

  return {
    response,
    agentUsed: selectedAgent,
    agentName,
    reason,
  };
}

/**
 * Generates Cultural & Heritage Dossier using Agent 4
 */
export async function generateCulturalDossier(
  target: string,
  mode: "place" | "trip",
  language = "en",
  tripData?: any,
  section: "all" | "core" | "extended" = "all",
  regionOrCountry?: string
): Promise<CulturalHeritageData | any> {
  return runCulturalIntelligenceDossier(target, mode, language, tripData, section, regionOrCountry);
}

