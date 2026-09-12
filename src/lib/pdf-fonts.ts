/**
 * Wanderly PDF Font Loader
 * Fetches and caches Noto Sans TTF fonts for Indian-script PDF rendering.
 * Fonts are served from /public/fonts/ as static Next.js assets.
 *
 * Each language code maps to the correct Unicode font family.
 * Latin/English uses jsPDF's built-in Helvetica (no download needed).
 */

import type jsPDF from "jspdf";

// Cache: fontName → base64 string
const fontCache = new Map<string, string>();

/**
 * Script family → font file mapping.
 * One font covers multiple language codes sharing the same script.
 */
const SCRIPT_FONT_MAP: Record<string, string> = {
  // Devanagari — Hindi, Marathi
  hi: "NotoSansDevanagari-Regular.ttf",
  mr: "NotoSansDevanagari-Regular.ttf",
  // Bengali — Bengali, Assamese
  bn: "NotoSansBengali-Regular.ttf",
  as: "NotoSansBengali-Regular.ttf",
  // Gujarati
  gu: "NotoSansGujarati-Regular.ttf",
  // Tamil
  ta: "NotoSansTamil-Regular.ttf",
  // Telugu
  te: "NotoSansTelugu-Regular.ttf",
  // Kannada
  kn: "NotoSansKannada-Regular.ttf",
  // Malayalam
  ml: "NotoSansMalayalam-Regular.ttf",
  // Gurmukhi (Punjabi)
  pa: "NotoSansGurmukhi-Regular.ttf",
  // Odia
  or: "NotoSansOriya-Regular.ttf",
};

/** Returns the jsPDF font family name for a language code. */
export function getFontFamily(language: string): string {
  if (!language || language === "en") return "helvetica";
  const fileName = SCRIPT_FONT_MAP[language];
  if (!fileName) return "helvetica";
  // Derive a clean font family name from the filename
  return fileName.replace("-Regular.ttf", "").replace(/-/g, "");
}

/** Converts an ArrayBuffer to a base64 string (browser-safe). */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/**
 * Loads and embeds the required font into a jsPDF document.
 * Uses in-memory caching to avoid redundant network fetches.
 *
 * @param doc  - The jsPDF document instance
 * @param language - The active language code (e.g. "hi", "mr", "ta")
 * @returns The font family name to use with doc.setFont()
 */
export async function embedFontForLanguage(
  doc: jsPDF,
  language: string
): Promise<string> {
  if (!language || language === "en") {
    return "helvetica";
  }

  const fileName = SCRIPT_FONT_MAP[language];
  if (!fileName) return "helvetica";

  const fontFamily = getFontFamily(language);

  // Already embedded in this doc instance? Just return the family name.
  // jsPDF tracks added fonts internally; safe to call addFont again if needed.
  try {
    let base64: string | undefined = fontCache.get(fileName);

    if (!base64) {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const response = await fetch(`${origin}/fonts/${fileName}`);
      if (!response.ok) {
        console.warn(
          `[PDF Fonts] Font file not found: ${fileName} (${response.status}). Falling back to helvetica.`
        );
        return "helvetica";
      }
      const buffer = await response.arrayBuffer();
      base64 = arrayBufferToBase64(buffer);
      fontCache.set(fileName, base64);
    }

    // Register font with jsPDF virtual file system and add it
    doc.addFileToVFS(fileName, base64);
    doc.addFont(fileName, fontFamily, "normal");
    return fontFamily;
  } catch (err) {
    console.warn(
      `[PDF Fonts] Failed to load font for "${language}":`,
      err
    );
    return "helvetica";
  }
}
