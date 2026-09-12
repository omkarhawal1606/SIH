/**
 * AGENT 2 — STAY, FOOD & EXPERIENCE AGENT
 *
 * Responsibilities:
 *  - Categorized accommodations across 5 types (hotel, homestay, govt_stay, hostel, resort)
 *  - AI-labeled recommendation highlights (bestBudget, bestLocal, bestComfort, bestForGroups)
 *  - Regional dining, authentic local restaurants, cafes, street food
 *  - Must-try culinary specialties
 *  - Immersive local experiences
 *
 * API Key: GEMINI_STAY_FOOD_API_KEY (with fallback to GEMINI_API_KEY)
 *
 * GOVERNMENT STAY POLICY:
 *  - Do NOT fabricate official prices, availability, or booking information.
 *  - Clearly label govt stays with provider name and official contact info.
 *  - Always include a disclaimer note for government properties.
 */

import { getAgent2Key, executeAgentPrompt, extractJsonFromText } from "./client";
import {
  Agent2StayFoodInput,
  Agent2StayFoodOutput,
  HotelRecommendation,
  AccommodationType,
} from "./types";
import { getLanguageInstruction } from "@/lib/i18n/ai";
import { agentCache } from "./cache";

const ACCOMMODATION_TYPE_LABELS: Record<AccommodationType, string> = {
  hotel: "🏨 Hotels",
  homestay: "🏠 Homestays",
  govt_stay: "🏛️ Government Stays / Tourist Hostels",
  hostel: "🛏️ Hostels",
  resort: "🏕️ Resorts / Guest Houses / Eco-Stays",
};

export async function runStayFoodExperienceAgent(
  input: Agent2StayFoodInput
): Promise<Agent2StayFoodOutput> {
  const lang = input.language || "en";

  // Build cache key incorporating accommodation preferences
  const typesSuffix = (input.accommodationTypes || []).sort().join(",");
  const cacheKey =
    agentCache.makeStayFoodKey(input.destination, input.budget, lang) +
    `_${typesSuffix}_${input.travelGroup || "any"}`;

  const cached = agentCache.get<Agent2StayFoodOutput>(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = getAgent2Key();

  // Extract key places from itinerary for geographic proximity
  const keyPlaces: string[] = [];
  if (Array.isArray(input.itinerary)) {
    for (const d of input.itinerary.slice(0, 3)) {
      if (d.slots) {
        if (d.slots.morning?.place) keyPlaces.push(d.slots.morning.place);
        if (d.slots.afternoon?.place) keyPlaces.push(d.slots.afternoon.place);
      }
    }
  }
  const proximityHint =
    keyPlaces.length > 0
      ? `Near key itinerary attractions: ${keyPlaces.slice(0, 5).join(", ")}`
      : "";

  // Build accommodation type instruction
  const requestedTypes =
    input.accommodationTypes && input.accommodationTypes.length > 0
      ? input.accommodationTypes
      : (["hotel", "homestay", "hostel", "resort"] as AccommodationType[]);

  const typeLabels = requestedTypes.map((t) => ACCOMMODATION_TYPE_LABELS[t]).join(", ");
  const hasGovtStay = requestedTypes.includes("govt_stay");

  const groupHint = input.travelGroup
    ? `Travel group: ${input.travelGroup} traveler(s).`
    : "";
  const amenityHint =
    input.amenities && input.amenities.length > 0
      ? `Required amenities: ${input.amenities.join(", ")}.`
      : "";
  const roomsHint = input.rooms ? `Rooms needed: ${input.rooms}.` : "";

  const govtStayInstruction = hasGovtStay
    ? `
GOVERNMENT STAY RULES (STRICT):
- Include 1-2 government / state tourism / ITDC / youth hostel type properties if available in ${input.destination}.
- Set "type": "govt_stay" for these entries.
- Use "govt_provider" field for the operating authority (e.g. "Rajasthan Tourism Development Corporation", "MTDC", "Youth Hostels Association of India").
- Set "govt_booking_note" to: "Contact the government provider directly for current availability and booking. Prices shown are indicative only."
- Do NOT fabricate official booking URLs, real-time availability, or confirmed prices.
- Set "is_ai_estimated": true for all government stay entries.
`
    : "";

  const prompt = `You are AGENT 2: The Stay, Food & Local Experience Specialist for Wanderly.
Your mission is to recommend verified accommodations, local gastronomy, and immersive experiences for "${input.destination}".
Travelers: ${input.people} person(s).
Total Trip Budget: ${input.currency} ${input.budget} (${input.days} days).
${groupHint}
${amenityHint}
${roomsHint}
${proximityHint}

Requested Accommodation Types: ${typeLabels}

${getLanguageInstruction(lang)}

${govtStayInstruction}

MANDATORY REQUIREMENTS:
1. ACCOMMODATIONS: Provide 4-6 accommodation options across the requested types: ${typeLabels}.
   Each accommodation MUST include:
   - "type": one of "hotel", "homestay", "govt_stay", "hostel", "resort"
   - "category": "Budget", "Mid-Range", or "Luxury"
   - "name": realistic property name for ${input.destination}
   - "price_per_night": realistic number in ${input.currency}
   - "rating": float 1.0-5.0
   - "description": 1-2 sentence description
   - "lat", "lng": approximate coordinates
   - "amenities": array of key amenities (e.g. ["WiFi", "Parking", "Pool", "AC", "Breakfast"])
   - "meals_included": boolean
   - "parking": boolean
   - "wifi": boolean
   - "accessibility": boolean
   - "cancellation_policy": short string
   - "distance_from_itinerary": estimated km from main attractions (0.5-5.0)
   - "group_types": array from ["solo", "couple", "family", "group"] — who is this suitable for
   - "is_ai_estimated": true (all AI-generated results must be marked as estimated)
   - "contact": { "website": "...", "phone": "..." } — use realistic contact info for type

2. AI RECOMMENDATION LABELS — assign one unique label to 4 of the best options:
   - "bestBudget" → Best value for money
   - "bestLocal" → Best authentic local experience (homestay/eco-stay preferred)
   - "bestComfort" → Best comfort and amenities
   - "bestForGroups" → Best for group travelers

3. DINING & LOCAL CUISINE:
   - List 3-4 authentic restaurants/cafes.
   - Provide "must_try_dishes" array (3-6 signature regional delicacies).
   - Provide "food_culture_notes".

4. LOCAL EXPERIENCES: Recommend 2-3 unique local experiences.

RETURN STRICT JSON ONLY:
{
  "hotels": [
    {
      "type": "hotel",
      "category": "Budget",
      "name": "...",
      "price_per_night": 1800,
      "rating": 4.1,
      "description": "...",
      "lat": 0.0,
      "lng": 0.0,
      "amenities": ["WiFi", "AC"],
      "meals_included": false,
      "parking": true,
      "wifi": true,
      "accessibility": false,
      "cancellation_policy": "Free cancellation 24h before",
      "distance_from_itinerary": 1.2,
      "group_types": ["solo", "couple"],
      "is_ai_estimated": true,
      "ai_label": "bestBudget",
      "contact": { "website": "", "phone": "" }
    }
  ],
  "restaurants": [
    { "name": "...", "cuisine_type": "...", "price_range": "₹₹", "specialty_dish": "...", "description": "..." }
  ],
  "local_food_guide": {
    "must_try_dishes": ["Dish 1", "Dish 2"],
    "food_culture_notes": "..."
  },
  "experiences": [
    { "name": "...", "category": "Culinary", "description": "..." }
  ],
  "recommendations": {
    "bestBudget": { "name": "...", "type": "hostel", "price_per_night": 800 },
    "bestLocal": { "name": "...", "type": "homestay", "price_per_night": 1500 },
    "bestComfort": { "name": "...", "type": "hotel", "price_per_night": 4500 },
    "bestForGroups": { "name": "...", "type": "resort", "price_per_night": 3000 }
  }
}`;

  const raw = await executeAgentPrompt(apiKey, prompt, {
    agentLabel: "Agent 2: Stay, Food & Experience",
    temperature: 0.4,
    timeoutMs: 35000,
    expectJson: true,
  });

  const parsed = extractJsonFromText(raw);

  // Fallback defaults for hotels if malformed
  const defaultHotels: HotelRecommendation[] = [
    {
      type: "hotel",
      category: "Budget",
      name: `${input.destination} City Stay`,
      price_per_night: 2000,
      rating: 4.0,
      description: "Central, budget-friendly accommodation.",
      amenities: ["WiFi", "AC"],
      wifi: true,
      meals_included: false,
      parking: false,
      accessibility: false,
      group_types: ["solo", "couple"],
      is_ai_estimated: true,
      ai_label: "bestBudget",
    },
    {
      type: "homestay",
      category: "Budget",
      name: `${input.destination} Heritage Homestay`,
      price_per_night: 1500,
      rating: 4.3,
      description: "Authentic local homestay with homemade meals.",
      amenities: ["WiFi", "Meals"],
      wifi: true,
      meals_included: true,
      parking: false,
      accessibility: false,
      group_types: ["solo", "couple", "family"],
      is_ai_estimated: true,
      ai_label: "bestLocal",
    },
    {
      type: "hotel",
      category: "Mid-Range",
      name: `${input.destination} Grand Residency`,
      price_per_night: 4500,
      rating: 4.4,
      description: "Comfortable hospitality with modern amenities.",
      amenities: ["WiFi", "AC", "Pool", "Parking"],
      wifi: true,
      meals_included: false,
      parking: true,
      accessibility: true,
      group_types: ["solo", "couple", "family", "group"],
      is_ai_estimated: true,
      ai_label: "bestComfort",
    },
    {
      type: "resort",
      category: "Mid-Range",
      name: `${input.destination} Eco Resort`,
      price_per_night: 3500,
      rating: 4.5,
      description: "Comfortable resort ideal for groups and families.",
      amenities: ["WiFi", "Meals", "Parking", "Pool"],
      wifi: true,
      meals_included: true,
      parking: true,
      accessibility: false,
      group_types: ["family", "group"],
      is_ai_estimated: true,
      ai_label: "bestForGroups",
    },
  ];

  // Build recommendations map from ai_label fields in hotels array
  const allHotels: HotelRecommendation[] =
    Array.isArray(parsed.hotels) && parsed.hotels.length >= 2
      ? parsed.hotels
      : defaultHotels;

  const recommendations: Agent2StayFoodOutput["recommendations"] = {};
  for (const hotel of allHotels) {
    if (hotel.ai_label && !recommendations[hotel.ai_label]) {
      recommendations[hotel.ai_label] = hotel;
    }
  }

  const output: Agent2StayFoodOutput = {
    hotels: allHotels,
    restaurants: Array.isArray(parsed.restaurants) ? parsed.restaurants : [],
    local_food_guide: parsed.local_food_guide || {
      must_try_dishes: ["Local Thali", "Traditional Sweets"],
      food_culture_notes: "Rich regional culinary traditions.",
    },
    experiences: Array.isArray(parsed.experiences) ? parsed.experiences : [],
    recommendations:
      parsed.recommendations && Object.keys(parsed.recommendations).length > 0
        ? parsed.recommendations
        : recommendations,
  };

  agentCache.set(cacheKey, output, 3600);
  return output;
}

/**
 * Handles chat queries specifically regarding hotels, restaurants, food, cafes, and dining.
 */
export async function runStayFoodChat(
  question: string,
  context: any,
  messages: any[],
  language = "en"
): Promise<string> {
  const apiKey = getAgent2Key();

  const prompt = `You are AGENT 2: Wanderly's Stay, Food & Local Experience Specialist.
You help travelers with hotel recommendations, homestays, government tourist stays, hostels, resorts,
budget-friendly vs luxury stays, authentic regional dining, must-try food, and local culinary traditions.

ACCOMMODATION TYPES YOU KNOW ABOUT:
🏨 Hotels (Budget/Mid-Range/Luxury)
🏠 Homestays (Authentic local living)
🏛️ Government Stays (ITDC, State Tourism, Youth Hostels — always advise contacting official sources for booking)
🛏️ Hostels (Budget, social, backpacker-friendly)
🏕️ Resorts / Guest Houses / Eco-Stays

${getLanguageInstruction(language)}

CURRENT DESTINATION & CONTEXT:
${context ? JSON.stringify(context).slice(0, 1200) : "General travel food & stay query"}

RECENT CONVERSATION:
${messages.slice(-4).map((m: any) => `${m.role === "user" ? "Traveler" : "Hospitality Guide"}: ${m.content}`).join("\n")}

Traveler's Question: ${question.trim()}

Respond with warm, appetizing, and practical advice as Agent 2 (Stay & Food Specialist):`;

  return executeAgentPrompt(apiKey, prompt, {
    agentLabel: "Agent 2: Stay & Food (Chat)",
    temperature: 0.5,
    timeoutMs: 25000,
    expectJson: false,
  });
}
