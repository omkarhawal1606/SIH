/**
 * Types & Utilities for Wanderly Cultural & Heritage Storyteller
 */

export interface HeritagePlace {
  name: string;
  dayReference?: string; // e.g., "Day 1 (Morning)" or "Day 2" if from a trip
  historicalPeriod?: string; // e.g., "12th Century CE", "Maratha Empire"
  historicalBackground: string;
  historicalSignificance: string;
  importantEvents: string[];
  historicalFigures: string[];
  culturalSignificance: string;
  interestingFacts: string[];
  historicalStory: string;
  lat?: number;
  lng?: number;
}

export interface HistoricalFact {
  fact: string;
  periodOrEra?: string;
  sourceOrAuthority?: string; // e.g., "Archaeological Survey of India", "UNESCO"
}

export interface LegendItem {
  title: string;
  story: string;
  culturalMeaning: string;
  warningNote?: string; // e.g. "Oral folklore, not verified by formal historical records"
}

export interface HistoricalFigure {
  name: string;
  role: string; // e.g. "Chhatrapati Shivaji Maharaj - Founder of Maratha Empire"
  era: string;
  significance: string;
}

export interface LocalCulture {
  traditions: string[];
  artAndHandicrafts: string[];
  musicAndDance: string[];
  clothingAndAttire: string[];
  customsAndSocialNorms: string[];
}

export interface CulinaryHeritageItem {
  name: string;
  description: string;
  culturalOrigin: string;
  isMustTry: boolean;
}

export interface FestivalItem {
  name: string;
  timing: string; // e.g., "October / November (Ashwin)", "Spring"
  celebrationStyle: string;
  culturalSignificance: string;
}

export interface LocalPhrase {
  phrase: string;
  englishMeaning: string;
  pronunciation: string;
  context: string; // e.g. "Polite greeting", "Asking for directions"
}

export interface CulturalEtiquette {
  dos: string[];
  donts: string[];
  attireGuidance: string;
  photographyRules: string;
}

export interface HiddenGem {
  name: string;
  distanceOrLocation: string;
  whyVisit: string;
  culturalValue: string;
}

export interface CulturalHeritageData {
  overview: {
    title: string;
    location: string;
    historicalBackground: string;
    culturalIdentity: string;
    historicalImportance: string;
    historicalPeriod: string;
    culturalSignificance: string;
    majorTraditions: string[];
  };
  tripStory?: string; // Continuous journey storytelling narrative
  placeStory?: string; // Engaging deep-dive narrative for place mode
  heritagePlaces: HeritagePlace[];
  historicalFacts: HistoricalFact[];
  legends: LegendItem[];
  historicalFigures: HistoricalFigure[];
  localCulture: LocalCulture;
  culinaryHeritage: CulinaryHeritageItem[];
  festivals: FestivalItem[];
  localPhrases: LocalPhrase[];
  culturalEtiquette: CulturalEtiquette;
  hiddenGems: HiddenGem[];
}

export interface CulturalChatMessage {
  role: "user" | "model";
  content: string;
}

/**
 * Sanitizes trip data so no credentials, tokens, or sensitive user IDs
 * are passed to the Gemini prompt.
 */
export function sanitizeTripForCulturalAI(trip: any) {
  if (!trip) return null;

  return {
    destination: trip.destination || "Unknown Destination",
    startDate: trip.startDate || "",
    endDate: trip.endDate || "",
    days: trip.days || 1,
    travelers: trip.people || 1,
    interests: Array.isArray(trip.interests) ? trip.interests : [],
    season_info: trip.season_info || "",
    // Extract itinerary places & activities without unnecessary internal fields
    itinerary: Array.isArray(trip.itinerary)
      ? trip.itinerary.map((day: any) => ({
          day: day.day,
          date: day.date,
          slots: {
            morning: {
              place: day.slots?.morning?.place || "",
              activity: day.slots?.morning?.activity || "",
            },
            afternoon: {
              place: day.slots?.afternoon?.place || "",
              activity: day.slots?.afternoon?.activity || "",
            },
            evening: {
              place: day.slots?.evening?.place || "",
              activity: day.slots?.evening?.activity || "",
            },
            night: {
              place: day.slots?.night?.place || "",
              activity: day.slots?.night?.activity || "",
            },
          },
        }))
      : [],
    hotels: Array.isArray(trip.hotels)
      ? trip.hotels.map((h: any) => ({
          name: h.name,
          category: h.category,
        }))
      : [],
  };
}

/**
 * Resilient JSON parser that handles markdown fencing, control characters,
 * and invalid escape characters often returned when models generate regional text.
 */
export function safeJsonParse<T = any>(rawText: string): T {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Empty AI response.");
  }
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("AI response did not contain valid JSON structure.");
  }
  const jsonStr = match[0];
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    // Sanitize bad escapes and raw control characters
    const sanitized = jsonStr
      .replace(/[\u0000-\u001F]+/g, (m) => (m === "\n" || m === "\r" || m === "\t" ? m : " "))
      .replace(/\\[^"\\/bfnrtu]/g, (m) => m.slice(1));
    return JSON.parse(sanitized) as T;
  }
}
