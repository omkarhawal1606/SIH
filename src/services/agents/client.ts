/**
 * Wanderly 4-Agent Architecture — Gemini AI Client Layer
 * Provides isolated GoogleGenAI SDK instances for each agent with dedicated API keys,
 * automatic fallback to GEMINI_API_KEY, multi-model cascade, retry with exponential backoff,
 * and strict timeout safeguards.
 */

import { GoogleGenAI } from "@google/genai";

const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.6-flash",
  "gemini-flash-latest",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
];

export interface AgentApiKeys {
  agent1: string;
  agent2: string;
  agent3: string;
  agent4: string;
}

/**
 * Returns the configured API key for Agent 1 (Travel Planner & Itinerary Agent)
 * Env: GEMINI_TRAVEL_PLANNER_API_KEY -> fallback to GEMINI_API_KEY
 */
export function getAgent1Key(): string {
  const key = process.env.GEMINI_TRAVEL_PLANNER_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "API key missing for Agent 1 (Travel Planner). Please configure GEMINI_TRAVEL_PLANNER_API_KEY or GEMINI_API_KEY."
    );
  }
  return key;
}

/**
 * Returns the configured API key for Agent 2 (Stay, Food & Experience Agent)
 * Env: GEMINI_STAY_FOOD_API_KEY -> fallback to GEMINI_API_KEY
 */
export function getAgent2Key(): string {
  const key = process.env.GEMINI_STAY_FOOD_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "API key missing for Agent 2 (Stay, Food & Experience). Please configure GEMINI_STAY_FOOD_API_KEY or GEMINI_API_KEY."
    );
  }
  return key;
}

/**
 * Returns the configured API key for Agent 3 (Transport, Budget & Safety Agent)
 * Env: GEMINI_TRANSPORT_SAFETY_API_KEY -> fallback to GEMINI_API_KEY
 */
export function getAgent3Key(): string {
  const key = process.env.GEMINI_TRANSPORT_SAFETY_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "API key missing for Agent 3 (Transport, Budget & Safety). Please configure GEMINI_TRANSPORT_SAFETY_API_KEY or GEMINI_API_KEY."
    );
  }
  return key;
}

/**
 * Returns the configured API key for Agent 4 (Travel Intelligence & Verification Agent)
 * Env: GEMINI_TRAVEL_INTELLIGENCE_API_KEY -> GEMINI_CULTURE_API_KEY -> GEMINI_API_KEY
 */
export function getAgent4Key(): string {
  const key =
    process.env.GEMINI_TRAVEL_INTELLIGENCE_API_KEY ||
    process.env.GEMINI_CULTURE_API_KEY ||
    process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "API key missing for Agent 4 (Travel Intelligence). Please configure GEMINI_TRAVEL_INTELLIGENCE_API_KEY or GEMINI_API_KEY."
    );
  }
  return key;
}

/**
 * Robust JSON extractor that strips markdown fences and finds matching braces.
 */
export function extractJsonFromText(rawText: string): any {
  if (!rawText) throw new Error("Empty response from AI model");

  let cleaned = rawText.trim();
  // Strip ```json ... ``` blocks
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Attempt substring extraction between first { and last }
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const sliced = cleaned.substring(firstBrace, lastBrace + 1);
      return JSON.parse(sliced);
    }
    throw new Error("Failed to parse valid JSON from AI response");
  }
}

/**
 * Executes a single AI prompt with model fallback, timeout, and backoff retries.
 */
export async function executeAgentPrompt(
  apiKey: string,
  prompt: string,
  options: {
    systemInstruction?: string;
    temperature?: number;
    timeoutMs?: number;
    agentLabel?: string;
    expectJson?: boolean;
  } = {}
): Promise<string> {
  const {
    systemInstruction,
    temperature = 0.4,
    timeoutMs = 30000,
    agentLabel = "Agent",
    expectJson = true,
  } = options;

  const ai = new GoogleGenAI({ apiKey });
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`[${agentLabel}] Request timeout after ${timeoutMs}ms`)), timeoutMs)
        );

        const config: any = {
          temperature,
        };
        if (systemInstruction) {
          config.systemInstruction = systemInstruction;
        }
        if (expectJson) {
          config.responseMimeType = "application/json";
        }

        const apiPromise = ai.models.generateContent({
          model,
          contents: prompt,
          config,
        });

        const response: any = await Promise.race([apiPromise, timeoutPromise]);
        const text = response?.text;

        if (text && text.trim().length > 0) {
          return text;
        }
        throw new Error(`[${agentLabel}] Empty text received from model ${model}`);
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const isTransient503 =
          msg.includes("503") ||
          msg.includes("overloaded") ||
          msg.includes("UNAVAILABLE");

        // Only retry same model on transient server overloads; 429/quota limits move immediately to next model
        if (isTransient503 && attempt < 2) {
          await new Promise((res) => setTimeout(res, 500 * attempt));
          continue;
        }
        // Fall through to try next candidate model without wasting delay
        break;
      }
    }
  }

  throw new Error(`[${agentLabel}] All candidate models failed. Last error: ${lastError?.message || lastError}`);
}
