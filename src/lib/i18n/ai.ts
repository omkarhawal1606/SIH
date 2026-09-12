import { getLanguageMeta, type LanguageCode } from "./config";

/**
 * Generates an AI prompt instruction directing Gemini to output
 * content naturally in the user's selected language.
 */
export function getLanguageInstruction(languageCode?: string): string {
  if (!languageCode || languageCode === "en") {
    return "LANGUAGE INSTRUCTION: Generate all text content, descriptions, and narratives in fluent English.";
  }

  const meta = getLanguageMeta(languageCode);

  return `CRITICAL LANGUAGE REQUIREMENT:
Target Language: ${meta.name} (${meta.nativeName}) [Code: ${meta.code}]
1. You MUST generate all narrative text, titles, descriptions, stories, facts, folklore, cultural notes, clothing advice, and activity descriptions fluently and naturally in ${meta.name} using its native script (${meta.nativeName}).
2. Use correct, natural ${meta.name} grammar, vocabulary, and culturally respectful regional expressions.
3. Preserve key monument/city proper nouns with helpful bilingual clarity where beneficial (e.g., in Marathi: "पन्हाळा किल्ला (Panhala Fort)").
4. IMPORTANT TECHNICAL INTEGRITY:
   - JSON keys, status codes, object keys (e.g. "day", "date", "slots", "morning", "lat", "lng", "daily_cost", "safety_level") MUST REMAIN strictly in English as specified in the schema.
   - Numeric values, coordinates, and prices must remain standard numbers.
   - Only user-facing string values should be translated into ${meta.name} (${meta.nativeName}).`;
}
