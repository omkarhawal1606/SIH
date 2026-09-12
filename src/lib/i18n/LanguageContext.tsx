"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  type LanguageCode,
  type LanguageMeta,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  getLanguageMeta,
} from "./config";
import { LOCALES, en } from "./locales";

interface LanguageContextType {
  language: LanguageCode;
  meta: LanguageMeta;
  setLanguage: (lang: LanguageCode) => void;
  t: (path: string, params?: Record<string, string | number>, fallback?: string) => string;
  speak: (
    text: string,
    options?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
    }
  ) => { success: boolean; reason?: string };
  stopSpeech: () => void;
}

const STORAGE_KEY = "wanderly_preferred_language";

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper to safely get nested value by dot notation
function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj || !path) return undefined;
  const parts = path.split(".");
  let current: any = obj;
  for (const part of parts) {
    if (current === undefined || current === null || typeof current !== "object") {
      return undefined;
    }
    current = current[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [mounted, setMounted] = useState(false);

  // Initialize from storage or browser preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (saved && LOCALES[saved]) {
        setLanguageState(saved);
      } else if (typeof navigator !== "undefined" && navigator.language) {
        const browserLang = navigator.language.split("-")[0].toLowerCase() as LanguageCode;
        if (LOCALES[browserLang]) {
          setLanguageState(browserLang);
        }
      }
    } catch {
      // Ignore storage errors in private browsing
    }
    setMounted(true);
  }, []);

  const meta = useMemo(() => getLanguageMeta(language), [language]);

  // Update HTML document attributes on change
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
      document.documentElement.dir = meta.direction;
    }
  }, [language, meta]);

  const setLanguage = useCallback((code: LanguageCode) => {
    if (LOCALES[code]) {
      setLanguageState(code);
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  // Translation lookup with fallback to English
  const t = useCallback(
    (path: string, params?: Record<string, string | number>, fallback?: string): string => {
      // 1. Try active language
      let text = getNestedValue(LOCALES[language], path);

      // 2. Fallback to English
      if (text === undefined && language !== "en") {
        text = getNestedValue(en, path);
      }

      // 3. Fallback to provided default or last segment of key
      if (text === undefined) {
        text = fallback !== undefined ? fallback : path.split(".").pop() || path;
      }

      // 4. Interpolate variables e.g. {count}, {name}
      if (params && typeof text === "string") {
        for (const [key, val] of Object.entries(params)) {
          text = text.replace(new RegExp(`\\{${key}\\}`, "g"), String(val));
        }
      }

      return text;
    },
    [language]
  );

  // Stop active speech
  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Text-To-Speech with locale matching
  const speak = useCallback(
    (
      text: string,
      options?: {
        onStart?: () => void;
        onEnd?: () => void;
        onError?: () => void;
      }
    ): { success: boolean; reason?: string } => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return { success: false, reason: "SpeechSynthesis not supported by browser" };
      }

      const synth = window.speechSynthesis;
      synth.cancel();

      if (!text || text.trim().length === 0) {
        return { success: false, reason: "No text to speak" };
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = meta.ttsLocale;

      // Try finding a matching voice for the target locale
      const voices = synth.getVoices();
      const targetLangPrefix = meta.ttsLocale.split("-")[0].toLowerCase();
      const matchingVoice = voices.find(
        (v) =>
          v.lang.toLowerCase() === meta.ttsLocale.toLowerCase() ||
          v.lang.toLowerCase().startsWith(targetLangPrefix)
      );

      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onstart = () => options?.onStart?.();
      utterance.onend = () => options?.onEnd?.();
      utterance.onerror = () => options?.onError?.();

      synth.speak(utterance);
      return { success: true };
    },
    [meta.ttsLocale]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        meta,
        setLanguage,
        t,
        speak,
        stopSpeech,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
