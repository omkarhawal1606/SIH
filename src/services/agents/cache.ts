/**
 * Wanderly 4-Agent Architecture — High-Performance Cache Layer
 * Provides fast, in-memory TTL caching for reusable agent outputs (destinations,
 * places, accommodations, and cultural knowledge) without leaking user PII.
 */

interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
}

const globalForAgentCache = globalThis as unknown as {
  wanderlyAgentCache?: Map<string, CacheEntry>;
};

const cacheMap = globalForAgentCache.wanderlyAgentCache || new Map<string, CacheEntry>();
if (process.env.NODE_ENV !== "production") {
  globalForAgentCache.wanderlyAgentCache = cacheMap;
}

const MAX_CACHE_SIZE = 150;
const DEFAULT_TTL_SECONDS = 7200; // 2 hours

export const agentCache = {
  get<T = any>(key: string): T | null {
    const entry = cacheMap.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      cacheMap.delete(key);
      return null;
    }
    return entry.value as T;
  },

  set<T = any>(key: string, value: T, ttlSeconds = DEFAULT_TTL_SECONDS): void {
    // Evict oldest entry if at capacity
    if (cacheMap.size >= MAX_CACHE_SIZE) {
      const firstKey = cacheMap.keys().next().value;
      if (firstKey) cacheMap.delete(firstKey);
    }

    cacheMap.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  has(key: string): boolean {
    return this.get(key) !== null;
  },

  delete(key: string): void {
    cacheMap.delete(key);
  },

  clear(): void {
    cacheMap.clear();
  },

  // Key generators
  makeTripPlanKey(dest: string, days: number, lang: string): string {
    return `plan:${dest.toLowerCase().trim()}:${days}:${lang.toLowerCase()}`;
  },

  makeStayFoodKey(dest: string, budget: number, lang: string): string {
    const budgetBracket = Math.round(budget / 5000) * 5000;
    return `stays:${dest.toLowerCase().trim()}:${budgetBracket}:${lang.toLowerCase()}`;
  },

  makeTransportSafetyKey(dest: string, lang: string): string {
    return `transit_safety:${dest.toLowerCase().trim()}:${lang.toLowerCase()}`;
  },

  makeCulturalKey(place: string, lang: string, section = "all"): string {
    return `culture:${place.toLowerCase().trim()}:${lang.toLowerCase()}:${section}`;
  },

  makeFullTripKey(dest: string, days: number, people: number, budget: number, curr: string, lang: string): string {
    const budgetBracket = Math.round(budget / 5000) * 5000;
    return `full_trip:${dest.toLowerCase().trim()}:${days}:${people}:${budgetBracket}:${curr.toUpperCase()}:${lang.toLowerCase()}`;
  },
};
