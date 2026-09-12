/**
 * Wanderly 4-Agent Travel Architecture — Type Definitions
 * Defines strictly-typed contracts for all 4 agents and the orchestrator.
 */

export interface ItinerarySlot {
  place: string;
  activity: string;
  transport?: string;
  lat?: number;
  lng?: number;
  time?: string;
  duration?: string;
  notes?: string;
}

export interface DailyItinerary {
  day: number;
  date: string;
  daily_cost?: number;
  weather?: {
    condition: string;
    temp: number;
    description?: string;
    icon?: string;
  };
  slots: {
    morning: ItinerarySlot;
    afternoon: ItinerarySlot;
    evening: ItinerarySlot;
    night: ItinerarySlot;
  };
  highlights?: string[];
}

export type AccommodationType = "hotel" | "homestay" | "govt_stay" | "hostel" | "resort";
export type TravelGroupType = "solo" | "couple" | "family" | "group";
export type AIRecommendationLabel = "bestBudget" | "bestLocal" | "bestComfort" | "bestForGroups";

export interface HotelRecommendation {
  category: "Budget" | "Mid-Range" | "Luxury" | string;
  /** New: one of 5 accommodation types */
  type?: AccommodationType;
  name: string;
  price_per_night: number;
  rating: number;
  description: string;
  lat?: number;
  lng?: number;
  amenities?: string[];
  location_notes?: string;
  /** Distance in km from nearest itinerary location */
  distance_from_itinerary?: number;
  meals_included?: boolean;
  parking?: boolean;
  wifi?: boolean;
  accessibility?: boolean;
  cancellation_policy?: string;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  booking_url?: string;
  /** Government stay specific fields */
  govt_provider?: string;
  govt_rules?: string;
  govt_booking_note?: string;
  /** Group suitability */
  group_types?: TravelGroupType[];
  /** AI recommendation label */
  ai_label?: AIRecommendationLabel;
  /** Whether this is AI-estimated or admin-verified */
  is_ai_estimated?: boolean;
}

export interface RestaurantRecommendation {
  name: string;
  cuisine_type: string;
  price_range: string;
  specialty_dish: string;
  description: string;
  area?: string;
}

export interface LocalExperience {
  name: string;
  category: string;
  description: string;
  best_time?: string;
  estimated_cost?: number;
}

export interface CostBreakdown {
  stay: number;
  food: number;
  travel: number;
  activities: number;
  total?: number;
}

export interface EmergencyContacts {
  police: string;
  ambulance: string;
  helpline: string;
}

// ─── AGENT 1: Travel Planner & Itinerary Agent ──────────────────────────────
export interface Agent1TravelPlannerInput {
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  people: number;
  budget: number;
  currency: string;
  interests?: string[];
  preferences?: Record<string, any>;
  language?: string;
}

export interface Agent1TravelPlannerOutput {
  destination: string;
  days: number;
  itinerary: DailyItinerary[];
  season_info: string;
  clothing: string[];
  trip_summary?: string;
}

// ─── AGENT 2: Stay, Food & Experience Agent ─────────────────────────────────
export interface Agent2StayFoodInput {
  destination: string;
  budget: number;
  currency: string;
  people: number;
  days: number;
  itinerary?: DailyItinerary[];
  food_preferences?: string[];
  interests?: string[];
  language?: string;
  /** Accommodation preferences from TripForm */
  accommodationTypes?: AccommodationType[];
  travelGroup?: TravelGroupType;
  amenities?: string[];
  rooms?: number;
  checkIn?: string;
  checkOut?: string;
}

export interface Agent2StayFoodOutput {
  hotels: HotelRecommendation[];
  restaurants?: RestaurantRecommendation[];
  local_food_guide?: {
    must_try_dishes: string[];
    food_culture_notes: string;
  };
  experiences?: LocalExperience[];
  /** Top AI-labeled recommendations by category */
  recommendations?: {
    bestBudget?: HotelRecommendation;
    bestLocal?: HotelRecommendation;
    bestComfort?: HotelRecommendation;
    bestForGroups?: HotelRecommendation;
  };
}

// ─── AGENT 3: Transport, Budget & Safety Agent ──────────────────────────────
export interface Agent3TransportBudgetSafetyInput {
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  people: number;
  budget: number;
  currency: string;
  itinerary?: DailyItinerary[];
  hotel_estimates?: HotelRecommendation[];
  language?: string;
  /** User's preferred transit modes from multi-select (e.g. ["cab", "flight"]) */
  transportationModes?: string[];
}

export interface Agent3TransportBudgetSafetyOutput {
  transportation: {
    arrival_options: string[];
    local_transit_guide: string;
    estimated_transit_cost: number;
  };
  cost_breakdown: CostBreakdown;
  budget_analysis: {
    is_budget_feasible: boolean;
    budget_warning?: string;
    optimization_suggestions?: string[];
  };
  safety: {
    safety_level: "safe" | "caution" | "unsafe";
    safety_warning: string;
    tourist_precautions: string[];
    emergency: EmergencyContacts;
  };
}

// ─── AGENT 4: Travel Intelligence & Verification Agent ──────────────────────
export interface Agent4TravelIntelligenceInput {
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  people: number;
  budget: number;
  currency: string;
  language: string;
  travelPlan: Agent1TravelPlannerOutput;
  stayFoodExperience: Agent2StayFoodOutput;
  transportBudgetSafety: Agent3TransportBudgetSafetyOutput;
  weatherForecasts?: Array<{ day: number; weather: any }>;
}

export interface Agent4FinalTripOutput {
  status: "valid" | "invalid" | "unsafe";
  safety_level: "safe" | "caution" | "unsafe";
  safety_warning?: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  people: number;
  budget: number;
  currency: string;
  language: string;
  planningLanguage: string;
  itinerary: DailyItinerary[];
  hotels: HotelRecommendation[];
  restaurants?: RestaurantRecommendation[];
  events: Array<{ name: string; type: string; description: string }>;
  cost_breakdown: CostBreakdown;
  emergency: EmergencyContacts;
  season_info: string;
  clothing: string[];
  culture?: {
    overview_snippet?: string;
    traditions?: string[];
    cultural_etiquette?: string[];
  };
  verification?: {
    conflicts_detected: string[];
    optimizations_applied: string[];
    feasibility_score: number;
  };
}

// ─── Chat Routing ───────────────────────────────────────────────────────────
export type AgentRole = "agent1" | "agent2" | "agent3" | "agent4";

export interface ChatRoutingDecision {
  agent: AgentRole;
  reason: string;
  confidence: number;
}
