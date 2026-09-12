/**
 * Advanced types for the Advisor-Grade Travel Planner
 */

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

/** The supported accommodation categories */
export type AccommodationType = "hotel" | "homestay" | "govt_stay" | "hostel" | "resort" | "guest_house" | "eco_stay";
export type TravelGroupType = "solo" | "couple" | "family" | "group";

export interface AccommodationPreferences {
  types: AccommodationType[];
  travelGroup: TravelGroupType;
  rooms: number;
  amenities: string[];
}

export interface TripFormData {
  destination: string;
  startDate: string;
  endDate: string; // New: Range-based
  budget: number;
  people: number;
  interests: string[];
  currency?: string;
  travelStyle?: "budget" | "moderate" | "luxury";
  transportation?: "public" | "cab" | "flight" | string;
  transportationModes?: ("public" | "cab" | "flight")[];
  /** Accommodation preferences selected in the trip form */
  accommodationPreferences?: AccommodationPreferences;
}

export interface ItineraryDay {
  day: number;
  date?: string;
  weather?: {
    condition: string;
    description?: string;
    temp: number;
    icon?: string;
  };
  slots: {
    morning?: { activity: string; place: string; transport: string; lat?: number; lng?: number };
    afternoon?: { activity: string; place: string; transport: string; lat?: number; lng?: number };
    evening?: { activity: string; place: string; transport: string; lat?: number; lng?: number };
    night?: { activity: string; place: string; transport: string; lat?: number; lng?: number };
    [key: string]: any;
  };
  daily_cost?: number;
  estimated_cost?: number;
  places?: any[];
  activities?: any[];
}

export interface HotelOption {
  category: "Budget" | "Mid-Range" | "Luxury" | string;
  type?: AccommodationType;
  name: string;
  price_per_night: number;
  rating: number;
  description: string;
  lat?: number;
  lng?: number;
  amenities?: string[];
  meals_included?: boolean;
  parking?: boolean;
  wifi?: boolean;
  accessibility?: boolean;
  cancellation_policy?: string;
  contact?: { phone?: string; email?: string; website?: string };
  booking_url?: string;
  govt_provider?: string;
  govt_rules?: string;
  govt_booking_note?: string;
  group_types?: TravelGroupType[];
  ai_label?: "bestBudget" | "bestLocal" | "bestComfort" | "bestForGroups";
  is_ai_estimated?: boolean;
  distance_from_itinerary?: number;
}

export interface CulturalEvent {
  name: string;
  type: string;
  description: string;
}

export interface BudgetBreakdown {
  stay: number;
  food: number;
  travel: number;
  activities: number;
}

export interface TripData {
  id?: string;
  userId: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  budget: number;
  people: number;
  interests: string[];
  // AI Generated Data & Status
  status: "valid" | "invalid" | "unsafe";
  status_message?: string;
  safety_warning?: string;
  safety_level?: "safe" | "caution" | "unsafe";
  itinerary: ItineraryDay[];
  hotels: HotelOption[];
  cost_breakdown: BudgetBreakdown;
  events: CulturalEvent[];
  emergency: {
    police: string;
    ambulance: string;
    helpline: string;
  };
  season_info: string;
  clothing: string[];
  createdAt?: string;
  currency?: string;
  expenses?: Expense[];
  isPublic?: boolean;
  publicToken?: string;
  /** Selected accommodation saved to this trip */
  selectedAccommodation?: HotelOption;
  /** Accommodation search preferences */
  accommodationPreferences?: AccommodationPreferences;
}

export interface Expense {
  id: string;
  category: "hotel" | "food" | "transport" | "activity" | "shopping" | "other";
  amount: number;
  currency: string;
  date: string;
  notes?: string;
}

export const INTEREST_OPTIONS = [
  { value: "adventure", label: "🏔️ Adventure" },
  { value: "food", label: "🍜 Food" },
  { value: "culture", label: "🏛️ Culture" },
  { value: "relaxation", label: "🧘 Relaxation" },
  { value: "shopping", label: "🛍️ Shopping" },
  { value: "nature", label: "🌿 Nature" },
] as const;
