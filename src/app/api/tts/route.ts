import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getTTSConfig } from "@/lib/i18n/tts";

export const maxDuration = 30;

// In-memory LRU-style cache for synthesized audio (holds up to 100 recent audio clips)
const audioCache = new Map<string, string>();
const MAX_CACHE_SIZE = 100;

function setCache(key: string, dataUrl: string) {
  if (audioCache.size >= MAX_CACHE_SIZE) {
    const firstKey = audioCache.keys().next().value;
    if (firstKey) audioCache.delete(firstKey);
  }
  audioCache.set(key, dataUrl);
}

// Splits long text into natural punctuation-delimited chunks under maxLen
function splitTextIntoChunks(text: string, maxLen = 160): string[] {
  const cleanText = text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  if (cleanText.length <= maxLen) return [cleanText];

  const sentences = cleanText.split(/([।!?\n.।]+)/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (let i = 0; i < sentences.length; i++) {
    const part = sentences[i];
    if (!part) continue;

    if ((currentChunk + part).length <= maxLen) {
      currentChunk += part;
    } else {
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
      }
      if (part.length <= maxLen) {
        currentChunk = part;
      } else {
        // Break long segment by comma or space
        const words = part.split(/([,、\s]+)/);
        let wordChunk = "";
        for (const word of words) {
          if ((wordChunk + word).length <= maxLen) {
            wordChunk += word;
          } else {
            if (wordChunk.trim().length > 0) chunks.push(wordChunk.trim());
            wordChunk = word;
          }
        }
        currentChunk = wordChunk;
      }
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((c) => c.length > 0);
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { text, language = "en", speed = 1.0 } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "No text provided for audio synthesis" }, { status: 400 });
    }

    const trimmedText = text.trim().slice(0, 4000); // Safety limit
    const voiceConfig = getTTSConfig(language);
    const speedNum = Math.max(0.75, Math.min(1.5, Number(speed) || 1.0));

    // Check cache
    const cacheKey = crypto
      .createHash("sha256")
      .update(`${voiceConfig.languageCode}_${speedNum}_${trimmedText}`)
      .digest("hex");

    if (audioCache.has(cacheKey)) {
      console.log(`[TTS] Cache hit for ${language} (${voiceConfig.languageCode}) in ${Date.now() - startTime}ms`);
      return NextResponse.json({
        success: true,
        audioUrl: audioCache.get(cacheKey),
        language: voiceConfig.languageCode,
        cached: true,
      });
    }

    // Provider 1: Google Cloud Text-to-Speech API
    const ttsApiKey = process.env.TTS_API_KEY || process.env.GEMINI_API_KEY;
    let audioBase64: string | null = null;

    if (ttsApiKey) {
      try {
        const gcpResponse = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${ttsApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              input: { text: trimmedText },
              voice: {
                languageCode: voiceConfig.languageCode,
                name: voiceConfig.voiceName,
                ssmlGender: "FEMALE",
              },
              audioConfig: {
                audioEncoding: "MP3",
                speakingRate: speedNum,
              },
            }),
          }
        );

        if (gcpResponse.ok) {
          const gcpData = await gcpResponse.json();
          if (gcpData.audioContent) {
            audioBase64 = `data:audio/mp3;base64,${gcpData.audioContent}`;
            console.log(`[TTS] Synthesized via Google Cloud TTS in ${Date.now() - startTime}ms`);
          }
        } else {
          const errText = await gcpResponse.text();
          console.warn(`[TTS] Cloud TTS endpoint returned status ${gcpResponse.status}:`, errText);
        }
      } catch (gcpErr: any) {
        console.warn("[TTS] Cloud TTS request attempt failed:", gcpErr?.message || gcpErr);
      }
    }

    // Provider 2: Reliable regional TTS audio service (supports Indian languages with zero configuration)
    if (!audioBase64) {
      try {
        const chunks = splitTextIntoChunks(trimmedText, 160);
        const chunkBuffers: Buffer[] = [];

        for (const chunk of chunks) {
          const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
            chunk
          )}&tl=${voiceConfig.fallbackLangCode}&client=tw-ob`;

          const res = await fetch(ttsUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              Referer: "https://translate.google.com/",
            },
          });

          if (res.ok) {
            const arrayBuf = await res.arrayBuffer();
            chunkBuffers.push(Buffer.from(arrayBuf));
          } else {
            console.warn(`[TTS] Chunk fetch failed (${res.status}) for ${voiceConfig.fallbackLangCode}`);
          }
        }

        if (chunkBuffers.length > 0) {
          const combined = Buffer.concat(chunkBuffers);
          audioBase64 = `data:audio/mp3;base64,${combined.toString("base64")}`;
          console.log(
            `[TTS] Synthesized ${chunks.length} chunks via regional service in ${Date.now() - startTime}ms`
          );
        }
      } catch (fallbackErr: any) {
        console.error("[TTS] Regional fallback service error:", fallbackErr);
      }
    }

    if (!audioBase64) {
      return NextResponse.json(
        {
          success: false,
          error: "Audio narration is currently unavailable for this language.",
          details: "All TTS provider attempts failed.",
        },
        { status: 503 }
      );
    }

    // Save to cache
    setCache(cacheKey, audioBase64);

    return NextResponse.json({
      success: true,
      audioUrl: audioBase64,
      language: voiceConfig.languageCode,
      cached: false,
      durationMs: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error("[TTS Route Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Audio narration is currently unavailable for this language.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
