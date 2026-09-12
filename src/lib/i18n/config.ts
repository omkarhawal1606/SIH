/**
 * Centralized Language Registry & Configuration for Wanderly
 */

export type LanguageCode =
  | "en" // English
  | "hi" // Hindi (हिन्दी)
  | "mr" // Marathi (मराठी)
  | "bn" // Bengali (বাংলা)
  | "gu" // Gujarati (ગુજરાતી)
  | "ta" // Tamil (தமிழ்)
  | "te" // Telugu (తెలుగు)
  | "kn" // Kannada (ಕನ್ನಡ)
  | "ml" // Malayalam (മലയാളം)
  | "pa" // Punjabi (ਪੰਜਾਬੀ)
  | "or" // Odia (ଓଡ଼ିଆ)
  | "as"; // Assamese (অসমীয়া)

export interface LanguageMeta {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  direction: "ltr" | "rtl";
  ttsLocale: string;
  fontFamily?: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
    direction: "ltr",
    ttsLocale: "en-IN",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    direction: "ltr",
    ttsLocale: "hi-IN",
  },
  {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    flag: "🇮🇳",
    direction: "ltr",
    ttsLocale: "mr-IN",
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    flag: "🇮🇳",
    direction: "ltr",
    ttsLocale: "bn-IN",
  },
  {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    flag: "🇮🇳",
    direction: "ltr",
    ttsLocale: "gu-IN",
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    flag: "🇮🇳",
    direction: "ltr",
    ttsLocale: "ta-IN",
  },
  {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    flag: "🇮🇳",
    direction: "ltr",
    ttsLocale: "te-IN",
  },
  {
    code: "kn",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    flag: "🇮🇳",
    direction: "ltr",
    ttsLocale: "kn-IN",
  },
  {
    code: "ml",
    name: "Malayalam",
    nativeName: "മലയാളം",
    flag: "🇮🇳",
    direction: "ltr",
    ttsLocale: "ml-IN",
  },
  {
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    flag: "🇮🇳",
    direction: "ltr",
    ttsLocale: "pa-IN",
  },
  {
    code: "or",
    name: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    flag: "🇮🇳",
    direction: "ltr",
    ttsLocale: "or-IN",
  },
  {
    code: "as",
    name: "Assamese",
    nativeName: "অসমীয়া",
    flag: "🇮🇳",
    direction: "ltr",
    ttsLocale: "as-IN",
  },
];

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export const LANGUAGE_MAP = new Map<LanguageCode, LanguageMeta>(
  SUPPORTED_LANGUAGES.map((l) => [l.code, l])
);

export function getLanguageMeta(code: string): LanguageMeta {
  return LANGUAGE_MAP.get(code as LanguageCode) || LANGUAGE_MAP.get(DEFAULT_LANGUAGE)!;
}
