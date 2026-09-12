/**
 * AGENT 3 — TRANSPORT, BUDGET & SAFETY AGENT
 *
 * Responsibilities:
 *  - Long-distance inbound transit (flight, rail, road) & intra-destination transport
 *  - Cost breakdown & financial feasibility analysis
 *  - Safety evaluation, travel advisories, and emergency protocols
 *
 * API Key: GEMINI_TRANSPORT_SAFETY_API_KEY (with fallback to GEMINI_API_KEY)
 */

import { getAgent3Key, executeAgentPrompt, extractJsonFromText } from "./client";
import {
  Agent3TransportBudgetSafetyInput,
  Agent3TransportBudgetSafetyOutput,
  CostBreakdown,
} from "./types";
import { getLanguageInstruction } from "@/lib/i18n/ai";
import { agentCache } from "./cache";

export async function runTransportBudgetSafetyAgent(
  input: Agent3TransportBudgetSafetyInput
): Promise<Agent3TransportBudgetSafetyOutput> {
  const lang = input.language || "en";
  const cacheKey = agentCache.makeTransportSafetyKey(input.destination, lang);

  const cached = agentCache.get<Agent3TransportBudgetSafetyOutput>(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = getAgent3Key();

  const modeLabel = (m: string) =>
    m === "flight" ? "Flights/Air Travel" : m === "public" ? "Train & Public Transit" : "Private Cab/Taxi";

  const preferredModesText =
    input.transportationModes && input.transportationModes.length > 0
      ? `User's Preferred Transit Modes: ${input.transportationModes.map(modeLabel).join(", ")} — prioritize these in all transit recommendations.`
      : "No specific transit preference specified — provide balanced options.";

  const prompt = `You are AGENT 3: The Transport Logistics, Budget Economist & Travel Safety Analyst.
Analyze travel feasibility for "${input.destination}".
Trip Window: ${input.startDate} to ${input.endDate} (${input.days} days).
Travelers: ${input.people} person(s).
Total Stated Budget: ${input.currency} ${input.budget}.
${preferredModesText}

${getLanguageInstruction(lang)}

MANDATORY LOGISTICAL REQUIREMENTS:
1. TRANSPORTATION:
   - "arrival_options": Realistic options for reaching ${input.destination}, PRIORITIZING the user's preferred modes (${input.transportationModes?.map(modeLabel).join(", ") || "all modes"}).
   - "local_transit_guide": Practical advice on getting around, emphasizing the preferred transit modes.
   - "estimated_transit_cost": Realistic estimated total transit cost for ${input.people} people.
2. BUDGET & COST BREAKDOWN:
   - Provide realistic numeric breakdown that sums approximately to total budget (${input.currency} ${input.budget}):
     "stay": estimated lodging cost,
     "food": estimated meals & dining,
     "travel": transit & commute,
     "activities": entry tickets, activities.
   - "is_budget_feasible": boolean.
   - "budget_warning": alert if budget is too constrained or realistic budget guidance.
3. SAFETY & EMERGENCY:
   - "safety_level": Choose exactly one: "safe", "caution", or "unsafe".
   - "safety_warning": Current travel advisory or tourist safety summary for ${input.destination}.
   - "tourist_precautions": 3-4 specific local safety tips.
   - "emergency": {"police": "100" or local number, "ambulance": "102" or local number, "helpline": "112" or "1363"}.

RETURN STRICT JSON ONLY MATCHING THIS SCHEMA:
{
  "transportation": {
    "arrival_options": ["By Air: ...", "By Train: ...", "By Road: ..."],
    "local_transit_guide": "...",
    "estimated_transit_cost": ${Math.round(input.budget * 0.18)}
  },
  "cost_breakdown": {
    "stay": ${Math.round(input.budget * 0.4)},
    "food": ${Math.round(input.budget * 0.25)},
    "travel": ${Math.round(input.budget * 0.15)},
    "activities": ${Math.round(input.budget * 0.2)},
    "total": ${input.budget}
  },
  "budget_analysis": {
    "is_budget_feasible": true,
    "budget_warning": "...",
    "optimization_suggestions": ["..."]
  },
  "safety": {
    "safety_level": "safe",
    "safety_warning": "Safe for domestic and international travelers.",
    "tourist_precautions": ["Keep emergency numbers saved", "Use verified transport"],
    "emergency": {
      "police": "112",
      "ambulance": "102",
      "helpline": "1363"
    }
  }
}`;

  const raw = await executeAgentPrompt(apiKey, prompt, {
    agentLabel: "Agent 3: Transport, Budget & Safety",
    temperature: 0.3,
    timeoutMs: 30000,
    expectJson: true,
  });

  const parsed = extractJsonFromText(raw);

  const defaultCostBreakdown: CostBreakdown = {
    stay: Math.round(input.budget * 0.4),
    food: Math.round(input.budget * 0.25),
    travel: Math.round(input.budget * 0.15),
    activities: Math.round(input.budget * 0.2),
    total: input.budget,
  };

  const output: Agent3TransportBudgetSafetyOutput = {
    transportation: {
      arrival_options: Array.isArray(parsed.transportation?.arrival_options)
        ? parsed.transportation.arrival_options
        : [`Accessible via nearest airport or rail hub to ${input.destination}.`],
      local_transit_guide:
        parsed.transportation?.local_transit_guide ||
        "Taxis, auto-rickshaws, and ride-hailing services are widely available.",
      estimated_transit_cost:
        Number(parsed.transportation?.estimated_transit_cost) || Math.round(input.budget * 0.15),
    },
    cost_breakdown: parsed.cost_breakdown || defaultCostBreakdown,
    budget_analysis: parsed.budget_analysis || {
      is_budget_feasible: true,
      budget_warning: `Budget is well-allocated for ${input.days} days in ${input.destination}.`,
      optimization_suggestions: ["Book transport in advance for best rates."],
    },
    safety: {
      safety_level: ["safe", "caution", "unsafe"].includes(parsed.safety?.safety_level)
        ? parsed.safety.safety_level
        : "safe",
      safety_warning:
        parsed.safety?.safety_warning || `Travel advisory: Normal tourist precautions apply in ${input.destination}.`,
      tourist_precautions: Array.isArray(parsed.safety?.tourist_precautions)
        ? parsed.safety.tourist_precautions
        : ["Keep official ID and emergency contacts handy."],
      emergency: parsed.safety?.emergency || {
        police: "112",
        ambulance: "102",
        helpline: "1363",
      },
    },
  };

  agentCache.set(cacheKey, output, 3600);
  return output;
}

/**
 * Handles chat queries concerning transit, flights, trains, local cabs, budgets, and travel safety.
 */
export async function runTransportBudgetSafetyChat(
  question: string,
  context: any,
  messages: any[],
  language = "en"
): Promise<string> {
  const apiKey = getAgent3Key();

  const prompt = `You are AGENT 3: Wanderly's Transport, Budget & Travel Security Analyst.
You advise travelers on how to reach destinations, trains/flights/cabs, cost estimations, budget planning, tourist precautions, and travel safety.

${getLanguageInstruction(language)}

CURRENT DESTINATION & CONTEXT:
${context ? JSON.stringify(context).slice(0, 1000) : "General transit & budget inquiry"}

RECENT CONVERSATION:
${messages.slice(-4).map((m: any) => `${m.role === "user" ? "Traveler" : "Logistics Analyst"}: ${m.content}`).join("\n")}

Traveler's Question: ${question.trim()}

Provide realistic, reassuring, and financially sound advice as Agent 3:`;

  return executeAgentPrompt(apiKey, prompt, {
    agentLabel: "Agent 3: Transport & Budget (Chat)",
    temperature: 0.4,
    timeoutMs: 25000,
    expectJson: false,
  });
}
