/**
 * Centralized Text-to-Speech (TTS) Configuration for Wanderly
 * Covers all 12 supported languages with accurate language and voice codes.
 */

export interface TTSVoiceConfig {
  languageCode: string; // BCP-47 language tag e.g. "hi-IN", "mr-IN"
  voiceName: string; // Standard/Neural2 voice code
  nativeName: string;
  fallbackLangCode: string; // ISO 639-1 code for fallback audio service
}

export const TTS_LANGUAGES: Record<string, TTSVoiceConfig> = {
  en: {
    languageCode: "en-IN",
    voiceName: "en-IN-Standard-A",
    nativeName: "English (India)",
    fallbackLangCode: "en",
  },
  hi: {
    languageCode: "hi-IN",
    voiceName: "hi-IN-Standard-A",
    nativeName: "हिन्दी",
    fallbackLangCode: "hi",
  },
  mr: {
    languageCode: "mr-IN",
    voiceName: "mr-IN-Standard-A",
    nativeName: "मराठी",
    fallbackLangCode: "mr",
  },
  bn: {
    languageCode: "bn-IN",
    voiceName: "bn-IN-Standard-A",
    nativeName: "বাংলা",
    fallbackLangCode: "bn",
  },
  gu: {
    languageCode: "gu-IN",
    voiceName: "gu-IN-Standard-A",
    nativeName: "ગુજરાતી",
    fallbackLangCode: "gu",
  },
  ta: {
    languageCode: "ta-IN",
    voiceName: "ta-IN-Standard-A",
    nativeName: "தமிழ்",
    fallbackLangCode: "ta",
  },
  te: {
    languageCode: "te-IN",
    voiceName: "te-IN-Standard-A",
    nativeName: "తెలుగు",
    fallbackLangCode: "te",
  },
  kn: {
    languageCode: "kn-IN",
    voiceName: "kn-IN-Standard-A",
    nativeName: "ಕನ್ನಡ",
    fallbackLangCode: "kn",
  },
  ml: {
    languageCode: "ml-IN",
    voiceName: "ml-IN-Standard-A",
    nativeName: "മലയാളം",
    fallbackLangCode: "ml",
  },
  pa: {
    languageCode: "pa-IN",
    voiceName: "pa-IN-Standard-A",
    nativeName: "ਪੰਜਾਬੀ",
    fallbackLangCode: "pa",
  },
  or: {
    languageCode: "or-IN",
    voiceName: "or-IN-Standard-A",
    nativeName: "ଓଡ଼ିଆ",
    fallbackLangCode: "hi",
  },
  as: {
    languageCode: "as-IN",
    voiceName: "as-IN-Standard-A",
    nativeName: "অসমীয়া",
    fallbackLangCode: "bn",
  },
};

export function getTTSConfig(language: string): TTSVoiceConfig {
  const normalized = (language || "en").toLowerCase().trim();
  return TTS_LANGUAGES[normalized] || TTS_LANGUAGES["en"];
}
