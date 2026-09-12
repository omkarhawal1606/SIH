/**
 * Wanderly Dynamic Minimum Budget Recommender
 *
 * Algorithmic, ultra-fast (0ms) cost estimation engine that dynamically computes
 * realistic minimum and recommended budget ranges based on:
 *  - Destination (tier, cost-of-living index, international vs domestic)
 *  - Number of travelers (room sharing logic, per-person rates)
 *  - Trip duration (days & nights)
 *  - Transportation mode (public/train, private cab, flight)
 *  - Accommodation style (budget, moderate, luxury)
 *  - Food & dining habits
 *  - Activities & interest complexity
 *  - Active currency conversion (INR, USD, EUR, GBP, AED, JPY)
 */

import { convertCurrency, formatCurrency } from "./currency";
import type { AccommodationType } from "./types";

export type TravelStyle = "budget" | "moderate" | "luxury";
export type TransportationMode = "public" | "cab" | "flight";

export interface BudgetRecommenderInput {
  destination?: string;
  people?: number;
  days?: number;
  rooms?: number;
  travelStyle?: TravelStyle;
  transportation?: TransportationMode;
  interests?: string[];
  currency?: string;
  accommodationTypes?: AccommodationType[];
}

export interface BudgetRecommendation {
  minBudget: number;
  maxBudget: number;
  currency: string;
  formattedMin: string;
  formattedMax: string;
  formattedRange: string;
  breakdown: {
    accommodation: { min: number; max: number };
    food: { min: number; max: number };
    transportation: { min: number; max: number };
    activities: { min: number; max: number };
  };
  destinationTier: "metro" | "tourist_hub" | "heritage_town" | "international" | "standard";
  travelStyle: TravelStyle;
  transportation: TransportationMode;
  isBelowMinimum: (enteredBudget: number) => boolean;
  isHealthy: (enteredBudget: number) => boolean;
}

// Destination Tiers & Multipliers
const TIER_1_METROS = [
  "mumbai", "delhi", "new delhi", "bengaluru", "bangalore", "chennai", "hyderabad", "kolkata", "pune", "gurugram", "noida"
];

const TIER_2_TOURIST_HUBS = [
  "goa", "jaipur", "udaipur", "kerala", "munnar", "alleppey", "manali", "shimla", "darjeeling",
  "ooty", "kodaikanal", "pondicherry", "puducherry", "agra", "leh", "ladakh", "srinagar",
  "gangtok", "andaman", "port blair", "coorg", "wayanad", "rishikesh"
];

const TIER_3_HERITAGE = [
  "hampi", "varanasi", "kashi", "madurai", "amritsar", "aurangabad", "khajuraho", "badami",
  "gokarna", "mysore", "mysuru", "mahabaleshwar", "shirdi", "haridwar", "puri", "bhubaneswar",
  "panhala", "kolhapur", "trivandrum", "thiruvananthapuram"
];

const INTERNATIONAL_DESTINATIONS = [
  "dubai", "paris", "london", "tokyo", "singapore", "new york", "switzerland", "rome",
  "amsterdam", "barcelona", "bali", "bangkok", "maldives", "thailand", "vietnam", "kuala lumpur"
];

function resolveDestinationTier(dest: string = ""): {
  tier: "metro" | "tourist_hub" | "heritage_town" | "international" | "standard";
  multiplier: number;
} {
  const clean = dest.toLowerCase().trim();
  if (!clean) return { tier: "standard", multiplier: 1.0 };

  if (INTERNATIONAL_DESTINATIONS.some((d) => clean.includes(d))) {
    return { tier: "international", multiplier: 2.8 };
  }
  if (TIER_1_METROS.some((d) => clean.includes(d))) {
    return { tier: "metro", multiplier: 1.35 };
  }
  if (TIER_2_TOURIST_HUBS.some((d) => clean.includes(d))) {
    return { tier: "tourist_hub", multiplier: 1.15 };
  }
  if (TIER_3_HERITAGE.some((d) => clean.includes(d))) {
    return { tier: "heritage_town", multiplier: 0.9 };
  }
  return { tier: "standard", multiplier: 1.0 };
}

/**
 * Calculates dynamic recommended minimum and comfort budget.
 * Returns values converted to the user's selected currency.
 */
export function calculateRecommendedBudget(input: BudgetRecommenderInput): BudgetRecommendation {
  const dest = input.destination || "";
  const people = Math.max(1, input.people || 2);
  const days = Math.max(1, input.days || 3);
  const nights = Math.max(1, days - 1);
  const rooms = input.rooms && input.rooms > 0 ? input.rooms : Math.ceil(people / 2);
  const travelStyle: TravelStyle = input.travelStyle || "moderate";
  const transportation: TransportationMode = input.transportation || "cab";
  const currency = input.currency || "INR";
  const interestsCount = input.interests?.length || 1;

  const { tier, multiplier } = resolveDestinationTier(dest);

  // ── 1. ACCOMMODATION (per room per night) ──────────────────────────────────
  let roomMinINR = 1400;
  let roomMaxINR = 2200;

  // Custom base ranges per accommodation type if selected
  const typeCostMap: Record<AccommodationType, { min: number; max: number }> = {
    hostel: { min: 600, max: 1400 },
    govt_stay: { min: 900, max: 2000 },
    homestay: { min: 1500, max: 3500 },
    hotel: { min: 2200, max: 5500 },
    resort: { min: 5500, max: 16000 },
    guest_house: { min: 1400, max: 3200 },
    eco_stay: { min: 3000, max: 8000 },
  };

  if (input.accommodationTypes && input.accommodationTypes.length > 0) {
    // Average rates among the selected accommodation types
    const matching = input.accommodationTypes.map((t) => typeCostMap[t] || { min: 1800, max: 4000 });
    const avgMin = matching.reduce((sum, r) => sum + r.min, 0) / matching.length;
    const avgMax = matching.reduce((sum, r) => sum + r.max, 0) / matching.length;

    // Apply travel style modifier
    const styleMult = travelStyle === "budget" ? 0.8 : travelStyle === "luxury" ? 1.8 : 1.1;
    roomMinINR = Math.round(avgMin * styleMult);
    roomMaxINR = Math.round(avgMax * styleMult);
  } else {
    if (travelStyle === "moderate") {
      roomMinINR = 3200;
      roomMaxINR = 5000;
    } else if (travelStyle === "luxury") {
      roomMinINR = 9000;
      roomMaxINR = 17000;
    }
  }

  const stayMinINR = Math.round(rooms * nights * roomMinINR * multiplier);
  const stayMaxINR = Math.round(rooms * nights * roomMaxINR * multiplier);

  // ── 2. FOOD & DINING (per person per day) ──────────────────────────────────
  let foodPerPersonMinINR = 450;
  let foodPerPersonMaxINR = 750;
  if (travelStyle === "moderate") {
    foodPerPersonMinINR = 950;
    foodPerPersonMaxINR = 1600;
  } else if (travelStyle === "luxury") {
    foodPerPersonMinINR = 2600;
    foodPerPersonMaxINR = 4800;
  }
  const foodMinINR = Math.round(people * days * foodPerPersonMinINR * multiplier);
  const foodMaxINR = Math.round(people * days * foodPerPersonMaxINR * multiplier);

  // ── 3. TRANSPORTATION (Local commute + Inbound estimate) ───────────────────
  let transitMinINR = 0;
  let transitMaxINR = 0;

  if (transportation === "public") {
    // Train, bus, metro, shared auto
    const dailyLocalPerPerson = 250;
    const inboundAllowancePerPerson = 900 * multiplier;
    transitMinINR = Math.round(people * (days * dailyLocalPerPerson + inboundAllowancePerPerson));
    transitMaxINR = Math.round(transitMinINR * 1.35);
  } else if (transportation === "cab") {
    // Private cab / auto-rickshaw hire / outstation car
    const dailyCabGroupRateMin = 1600 * multiplier;
    const dailyCabGroupRateMax = 2500 * multiplier;
    const cabInbound = 1800 * multiplier;
    transitMinINR = Math.round(days * dailyCabGroupRateMin + cabInbound);
    transitMaxINR = Math.round(days * dailyCabGroupRateMax + cabInbound * 1.4);
  } else {
    // Flights + local premium airport cabs
    const flightRoundTripMin = 4500 * multiplier;
    const flightRoundTripMax = 8000 * multiplier;
    const dailyLocalPerPerson = 700;
    transitMinINR = Math.round(people * (flightRoundTripMin + days * dailyLocalPerPerson));
    transitMaxINR = Math.round(people * (flightRoundTripMax + days * dailyLocalPerPerson * 1.3));
  }

  // ── 4. ACTIVITIES & ATTRACTIONS (per person per day) ───────────────────────
  const interestBonus = Math.min(1.4, 1.0 + (interestsCount - 1) * 0.08);
  let activityDailyMin = 250;
  let activityDailyMax = 500;
  if (travelStyle === "moderate") {
    activityDailyMin = 500;
    activityDailyMax = 900;
  } else if (travelStyle === "luxury") {
    activityDailyMin = 1200;
    activityDailyMax = 2500;
  }
  const activitiesMinINR = Math.round(people * days * activityDailyMin * interestBonus);
  const activitiesMaxINR = Math.round(people * days * activityDailyMax * interestBonus);

  // ── 5. TOTAL SUM (INR Base) ────────────────────────────────────────────────
  const totalMinINR = stayMinINR + foodMinINR + transitMinINR + activitiesMinINR;
  const totalMaxINR = stayMaxINR + foodMaxINR + transitMaxINR + activitiesMaxINR;

  // Round INR totals to clean thousand/five-hundred brackets
  const roundedMinINR = Math.max(2000, Math.round(totalMinINR / 1000) * 1000);
  const roundedMaxINR = Math.max(roundedMinINR + 1000, Math.round(totalMaxINR / 1000) * 1000);

  // ── 6. CURRENCY CONVERSION ─────────────────────────────────────────────────
  const minConverted = Math.round(convertCurrency(roundedMinINR, "INR", currency));
  const maxConverted = Math.round(convertCurrency(roundedMaxINR, "INR", currency));

  const formattedMin = formatCurrency(minConverted, currency);
  const formattedMax = formatCurrency(maxConverted, currency);
  const formattedRange = `${formattedMin}–${formattedMax}`;

  return {
    minBudget: minConverted,
    maxBudget: maxConverted,
    currency,
    formattedMin,
    formattedMax,
    formattedRange,
    breakdown: {
      accommodation: {
        min: Math.round(convertCurrency(stayMinINR, "INR", currency)),
        max: Math.round(convertCurrency(stayMaxINR, "INR", currency)),
      },
      food: {
        min: Math.round(convertCurrency(foodMinINR, "INR", currency)),
        max: Math.round(convertCurrency(foodMaxINR, "INR", currency)),
      },
      transportation: {
        min: Math.round(convertCurrency(transitMinINR, "INR", currency)),
        max: Math.round(convertCurrency(transitMaxINR, "INR", currency)),
      },
      activities: {
        min: Math.round(convertCurrency(activitiesMinINR, "INR", currency)),
        max: Math.round(convertCurrency(activitiesMaxINR, "INR", currency)),
      },
    },
    destinationTier: tier,
    travelStyle,
    transportation,
    isBelowMinimum: (enteredBudget: number) => enteredBudget > 0 && enteredBudget < minConverted,
    isHealthy: (enteredBudget: number) => enteredBudget >= minConverted,
  };
}
