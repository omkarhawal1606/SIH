/**
 * Wanderly PDF Builder
 * Generates professional, publication-quality, multilingual PDFs for:
 *  1. Trip Itinerary (exportTripPDF)
 *  2. Cultural & Heritage Guide (exportCulturalGuidePDF)
 *
 * Uses jsPDF + jspdf-autotable.
 * Embeds Noto Sans Unicode fonts (via pdf-fonts.ts) for all 12 supported scripts.
 * All content is read from already-fetched data — zero additional Gemini calls.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { embedFontForLanguage } from "./pdf-fonts";
import type { CulturalHeritageData } from "./cultural";

// ─── Brand Colors ───────────────────────────────────────────────────────────
const FOREST: [number, number, number] = [22, 78, 61];
const EMERALD: [number, number, number] = [47, 143, 107];
const CREAM: [number, number, number] = [248, 246, 240];
const CHARCOAL: [number, number, number] = [23, 35, 31];
const SLATE: [number, number, number] = [90, 110, 100];
const SOFT_BG: [number, number, number] = [242, 248, 244];
const BORDER_COLOR: [number, number, number] = [200, 222, 212];
const WHITE: [number, number, number] = [255, 255, 255];
const ERROR_RED: [number, number, number] = [217, 92, 92];
const ERROR_BG: [number, number, number] = [254, 242, 242];

// ─── Page Constants (A4 in mm) ──────────────────────────────────────────────
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_LEFT = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT * 2; // 182mm
const CONTENT_BOTTOM = PAGE_HEIGHT - 22; // 275mm max Y before footer

// ─── Sanitizer ──────────────────────────────────────────────────────────────
function safeName(str: string): string {
  if (!str) return "trip";
  return str
    .replace(/[^a-zA-Z0-9À-ÿ\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/g, "_")
    .replace(/_+/g, "_")
    .trim();
}

/** Format currency with safe fallback */
function formatCurrencyStr(amount: number | string, currency = "INR"): string {
  const num = Number(amount) || 0;
  return `${currency} ${num.toLocaleString()}`;
}

// ─── 12-Language Localization Dictionary ─────────────────────────────────────
export interface PdfLabels {
  brand: string;
  tagline: string;
  preparedBy: string;
  tripOverview: string;
  destination: string;
  travelDates: string;
  duration: string;
  travelers: string;
  budget: string;
  season: string;
  interests: string;
  emergency: string;
  police: string;
  ambulance: string;
  helpline: string;
  advisory: string;
  hotels: string;
  category: string;
  hotel: string;
  price: string;
  rating: string;
  notes: string;
  itinerary: string;
  day: string;
  estCost: string;
  time: string;
  location: string;
  activity: string;
  transport: string;
  morning: string;
  afternoon: string;
  evening: string;
  night: string;
  costBreakdown: string;
  stay: string;
  food: string;
  travel: string;
  activities: string;
  packing: string;
  page: string;
  of: string;
  // Cultural guide keys
  culturalOverview: string;
  historicalBackground: string;
  culturalIdentity: string;
  historicalPeriod: string;
  majorTraditions: string;
  journeyStory: string;
  heritageStory: string;
  heritagePlaces: string;
  verifiedHistory: string;
  era: string;
  source: string;
  legends: string;
  figures: string;
  role: string;
  significance: string;
  localCulture: string;
  culinaryHeritage: string;
  festivals: string;
  localPhrases: string;
  phrase: string;
  meaning: string;
  pronunciation: string;
  context: string;
  culturalEtiquette: string;
  dos: string;
  donts: string;
  hiddenGems: string;
  traditions?: string;
  musicAndDance?: string;
  artsAndCrafts?: string;
  clothing?: string;
  dish?: string;
  description?: string;
  origin?: string;
  mustTry?: string;
  timing?: string;
  celebration?: string;
  attire?: string;
  photography?: string;
}

const PDF_TRANSLATIONS: Record<string, PdfLabels> = {
  en: {
    brand: "WANDERLY",
    tagline: "AI-Powered Travel Planner",
    preparedBy: "Prepared by Wanderly",
    tripOverview: "Trip Overview",
    destination: "Destination",
    travelDates: "Travel Dates",
    duration: "Duration",
    travelers: "Travelers",
    budget: "Estimated Budget",
    season: "Season & Weather",
    interests: "Interests",
    emergency: "Emergency Contacts",
    police: "Police",
    ambulance: "Ambulance",
    helpline: "Tourist Helpline",
    advisory: "Safety Advisory",
    hotels: "Recommended Hotels",
    category: "Category",
    hotel: "Hotel",
    price: "Price",
    rating: "Rating",
    notes: "Notes",
    itinerary: "Day-by-Day Itinerary",
    day: "Day",
    estCost: "Est. Cost",
    time: "Time",
    location: "Location",
    activity: "Activity",
    transport: "Transport",
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    night: "Night",
    costBreakdown: "Cost Breakdown",
    stay: "Stay",
    food: "Food",
    travel: "Travel",
    activities: "Activities",
    packing: "Packing & Clothing Guide",
    page: "Page",
    of: "of",
    culturalOverview: "Cultural Overview",
    historicalBackground: "Historical Background",
    culturalIdentity: "Cultural Identity",
    historicalPeriod: "Historical Period",
    majorTraditions: "Major Traditions",
    journeyStory: "The Story of Your Journey",
    heritageStory: "The Heritage Story",
    heritagePlaces: "Heritage Places",
    verifiedHistory: "Verified Historical Facts",
    era: "Era",
    source: "Source",
    legends: "Legends & Folklore",
    figures: "Historical Figures",
    role: "Role",
    significance: "Significance",
    localCulture: "Local Culture",
    culinaryHeritage: "Culinary Heritage",
    festivals: "Cultural Festivals",
    localPhrases: "Local Language & Phrases",
    phrase: "Phrase",
    meaning: "Meaning",
    pronunciation: "Pronunciation",
    context: "Context",
    culturalEtiquette: "Cultural Etiquette",
    dos: "Respectful Practices",
    donts: "Things to Avoid",
    hiddenGems: "Hidden Cultural Gems Nearby",
  },
  hi: {
    brand: "वांडरली",
    tagline: "एआई-संचालित यात्रा योजनाकार",
    preparedBy: "वांडरली द्वारा तैयार",
    tripOverview: "यात्रा अवलोकन",
    destination: "गंतव्य",
    travelDates: "यात्रा तिथियाँ",
    duration: "अवधि",
    travelers: "यात्री",
    budget: "अनुमानित बजट",
    season: "मौसम और जलवायु",
    interests: "रुचियाँ",
    emergency: "आपातकालीन संपर्क",
    police: "पुलिस",
    ambulance: "एम्बुलेंस",
    helpline: "पर्यटक हेल्पलाइन",
    advisory: "सुरक्षा सलाह",
    hotels: "अनुशंसित होटल",
    category: "श्रेणी",
    hotel: "होटल",
    price: "मूल्य",
    rating: "रेटिंग",
    notes: "विवरण",
    itinerary: "दिन-प्रतिदिन का यात्रा कार्यक्रम",
    day: "दिन",
    estCost: "अनुमानित खर्च",
    time: "समय",
    location: "स्थान",
    activity: "गतिविधि",
    transport: "परिवहन",
    morning: "सुबह",
    afternoon: "दोपहर",
    evening: "शाम",
    night: "रात",
    costBreakdown: "लागत विवरण",
    stay: "आवास",
    food: "भोजन",
    travel: "यात्रा",
    activities: "गतिविधियाँ",
    packing: "पैकिंग और वस्त्र गाइड",
    page: "पृष्ठ",
    of: "का",
    culturalOverview: "सांस्कृतिक अवलोकन",
    historicalBackground: "ऐतिहासिक पृष्ठभूमि",
    culturalIdentity: "सांस्कृतिक पहचान",
    historicalPeriod: "ऐतिहासिक काल",
    majorTraditions: "प्रमुख परंपराएं",
    journeyStory: "आपकी यात्रा की कहानी",
    heritageStory: "विरासत की कहानी",
    heritagePlaces: "विरासत स्थल",
    verifiedHistory: "प्रमाणित ऐतिहासिक तथ्य",
    era: "युग",
    source: "स्रोत",
    legends: "दंतकथाएं और लोककथाएं",
    figures: "ऐतिहासिक हस्तियां",
    role: "भूमिका",
    significance: "महत्व",
    localCulture: "स्थानीय संस्कृति",
    culinaryHeritage: "पारंपरिक व्यंजन",
    festivals: "सांस्कृतिक उत्सव",
    localPhrases: "स्थानीय भाषा और वाक्यांश",
    phrase: "वाक्यांश",
    meaning: "अर्थ",
    pronunciation: "उच्चारण",
    context: "संदर्भ",
    culturalEtiquette: "सांस्कृतिक शिष्टाचार",
    dos: "आदरणीय आचरण",
    donts: "बचने योग्य बातें",
    hiddenGems: "आसपास के छिपे हुए सांस्कृतिक रत्न",
  },
  mr: {
    brand: "वांडरली",
    tagline: "एआय-सक्षम प्रवास नियोजक",
    preparedBy: "वांडरली द्वारे तयार",
    tripOverview: "प्रवास सारांश",
    destination: "गंतव्य ठिकाण",
    travelDates: "प्रवासाच्या तारखा",
    duration: "कालावधी",
    travelers: "प्रवासी",
    budget: "अंदाजे बजेट",
    season: "हवामान आणि ऋतू",
    interests: "आवड आणि छंद",
    emergency: "तातडीचे संपर्क",
    police: "पोलीस",
    ambulance: "रुग्णवाहिका",
    helpline: "पर्यटक हेल्पलाइन",
    advisory: "सुरक्षा सल्ला",
    hotels: "शिफारस केलेली हॉटेल्स",
    category: "श्रेणी",
    hotel: "हॉटेल",
    price: "दर",
    rating: "रेटिंग",
    notes: "नोंदी",
    itinerary: "दिवसनिहाय प्रवास योजना",
    day: "दिवस",
    estCost: "अंदाजे खर्च",
    time: "वेळ",
    location: "ठिकाण",
    activity: "कार्यक्रम",
    transport: "वाहतूक",
    morning: "सकाळ",
    afternoon: "दुपार",
    evening: "संध्याकाळ",
    night: "रात्र",
    costBreakdown: "खर्चाचे विभाजन",
    stay: "मुक्काम",
    food: "जेवण",
    travel: "प्रवास",
    activities: "कार्यक्रम",
    packing: "साहित्य व कपडे मार्गदर्शक",
    page: "पान",
    of: "पैकी",
    culturalOverview: "सांस्कृतिक ओळख",
    historicalBackground: "ऐतिहासिक पार्श्वभूमी",
    culturalIdentity: "सांस्कृतिक ओळख",
    historicalPeriod: "ऐतिहासिक काळ",
    majorTraditions: "प्रमुख परंपरा",
    journeyStory: "तुमच्या प्रवासाची गौरवगाथा",
    heritageStory: "वारसा कथा",
    heritagePlaces: "ऐतिहासिक व वारसा स्थळे",
    verifiedHistory: "प्रमाणित ऐतिहासिक तथ्ये",
    era: "काळ",
    source: "संदर्भ",
    legends: "लोककथा आणि आख्यायिका",
    figures: "ऐतिहासिक व्यक्ती",
    role: "भूमिका",
    significance: "महत्त्व",
    localCulture: "स्थानिक संस्कृती",
    culinaryHeritage: "पारंपरिक खाद्यसंस्कृती",
    festivals: "सांस्कृतिक सण",
    localPhrases: "स्थानिक भाषा व संभाषण",
    phrase: "वाक्य",
    meaning: "अर्थ",
    pronunciation: "उच्चार",
    context: "संदर्भ",
    culturalEtiquette: "सांस्कृतिक शिष्टाचार",
    dos: "करावयाच्या गोष्टी",
    donts: "टाळावयाच्या गोष्टी",
    hiddenGems: "परिसरातील अप्रसिद्ध वारसा ठिकाणे",
  },
  bn: {
    brand: "ওয়ান্ডারলি",
    tagline: "এআই-চালিত ভ্রমণ পরিকল্পনাকারী",
    preparedBy: "ওয়ান্ডারলি দ্বারা প্রস্তুত",
    tripOverview: "ভ্রমণ সংক্ষেপ",
    destination: "গন্তব্য",
    travelDates: "ভ্রমণের তারিখ",
    duration: "সময়কাল",
    travelers: "যাত্রী",
    budget: "আনুমানিক বাজেট",
    season: "আবহাওয়া ও ঋতু",
    interests: "আগ্রহ",
    emergency: "জরুরী যোগাযোগ",
    police: "পুলিশ",
    ambulance: "অ্যাম্বুলেন্স",
    helpline: "পর্যটক হেল্পলাইন",
    advisory: "নিরাপত্তা পরামর্শ",
    hotels: "প্রস্তাবিত হোটেল",
    category: "বিভাগ",
    hotel: "হোটেল",
    price: "মূল্য",
    rating: "রেটিং",
    notes: "বিবরণ",
    itinerary: "প্রতিদিনের ভ্রমণসূচি",
    day: "দিন",
    estCost: "আনুমানিক খরচ",
    time: "সময়",
    location: "স্থান",
    activity: "কার্যক্রম",
    transport: "পরিবহন",
    morning: "সকাল",
    afternoon: "দুপুর",
    evening: "সন্ধ্যা",
    night: "রাত",
    costBreakdown: "ব্যয় বিভাজন",
    stay: "থাকা",
    food: "খাবার",
    travel: "ভ্রমণ",
    activities: "কার্যকলাপ",
    packing: "পোশাক ও প্যাকিং গাইড",
    page: "পৃষ্ঠা",
    of: "এর",
    culturalOverview: "সাংস্কৃতিক সংক্ষিপ্ত বিবরণ",
    historicalBackground: "ঐতিহাসিক পটভূমি",
    culturalIdentity: "সাংস্কৃতিক পরিচয়",
    historicalPeriod: "ঐতিহাসিক সময়কাল",
    majorTraditions: "প্রধান ঐতিহ্য",
    journeyStory: "আপনার ভ্রমণের কাহিনী",
    heritageStory: "ঐতিহ্যের গল্প",
    heritagePlaces: "ঐতিহ্যবাহী স্থানসমূহ",
    verifiedHistory: "যাচাইকৃত ঐতিহাসিক তথ্য",
    era: "যুগ",
    source: "উৎস",
    legends: "কিংবদন্তি ও লোকগাথা",
    figures: "ঐতিহাসিক ব্যক্তিবর্গ",
    role: "ভূমিকা",
    significance: "তাৎপর্য",
    localCulture: "স্থানীয় সংস্কৃতি",
    culinaryHeritage: "রন্ধন ঐতিহ্য",
    festivals: "সাংস্কৃতিক উৎসব",
    localPhrases: "স্থানীয় ভাষা ও বাক্য",
    phrase: "বাক্য",
    meaning: "অর্থ",
    pronunciation: "উচ্চারণ",
    context: "প্রসঙ্গ",
    culturalEtiquette: "সাংস্কৃতিক শিষ্টাচার",
    dos: "করণীয়",
    donts: "বর্জনীয়",
    hiddenGems: "নিকটবর্তী অপ্রকাশিত রত্ন",
  },
  gu: {
    brand: "વાન્ડરલી",
    tagline: "એઆઈ-આધારિત પ્રવાસ આયોજક",
    preparedBy: "વાન્ડરલી દ્વારા નિર્મિત",
    tripOverview: "પ્રવાસ વિહંગાવલોકન",
    destination: "સ્થળ",
    travelDates: "પ્રવાસ તારીખો",
    duration: "સમયગાળો",
    travelers: "મુસાફરો",
    budget: "અંદાજિત બજેટ",
    season: "હવામાન અને ઋતુ",
    interests: "રુચિઓ",
    emergency: "કટોકટી સંપર્કો",
    police: "પોલીસ",
    ambulance: "એમ્બ્યુલન્સ",
    helpline: "ટૂરિસ્ટ હેલ્પલાઇન",
    advisory: "સુરક્ષા સલાહ",
    hotels: "ભલામણ કરેલ હોટેલ્સ",
    category: "શ્રેણી",
    hotel: "હોટેલ",
    price: "કિંમત",
    rating: "રેટિંગ",
    notes: "નોંધ",
    itinerary: "દૈનિક પ્રવાસ કાર્યક્રમ",
    day: "દિવસ",
    estCost: "અંદાજિત ખર્ચ",
    time: "સમય",
    location: "સ્થળ",
    activity: "પ્રવૃત્તિ",
    transport: "પરિવહન",
    morning: "સવાર",
    afternoon: "બપોર",
    evening: "સાંજ",
    night: "રાત",
    costBreakdown: "ખર્ચ વિભાજન",
    stay: "રોકાણ",
    food: "ખોરાક",
    travel: "મુસાફરી",
    activities: "પ્રવૃત્તિઓ",
    packing: "પેકિંગ માર્ગદર્શિકા",
    page: "પૃષ્ઠ",
    of: "માંથી",
    culturalOverview: "સાંસ્કૃતિક વિહંગાવલોકન",
    historicalBackground: "ઐતિહાસિક પૃષ્ઠભૂમિ",
    culturalIdentity: "સાંસ્કૃતિક ઓળખ",
    historicalPeriod: "ઐતિહાસિક સમયગાળો",
    majorTraditions: "મુખ્ય પરંપરાઓ",
    journeyStory: "તમારી મુસાફરીની વાર્તા",
    heritageStory: "વારસાની વાર્તા",
    heritagePlaces: "વારસાના સ્થળો",
    verifiedHistory: "ચકાસાયેલ ઐતિહાસિક તથ્યો",
    era: "યુગ",
    source: "સ્ત્રોત",
    legends: "દંતકથાઓ અને લોકવાર્તાઓ",
    figures: "ઐતિહાસિક વ્યક્તિઓ",
    role: "ભૂમિકા",
    significance: "મહત્વ",
    localCulture: "સ્થાનિક સંસ્કૃતિ",
    culinaryHeritage: "વાનગી વારસો",
    festivals: "સાંસ્કૃતિક તહેવારો",
    localPhrases: "સ્થાનિક ભાષા અને શબ્દસમૂહો",
    phrase: "શબ્દસમૂહ",
    meaning: "અર્થ",
    pronunciation: "ઉચ્ચાર",
    context: "સંદર્ભ",
    culturalEtiquette: "સાંસ્કૃતિક શિષ્ટાચાર",
    dos: "કરવા જેવું",
    donts: "ન કરવા જેવું",
    hiddenGems: "નજીકના છુપાયેલા રત્નો",
  },
  ta: {
    brand: "வாண்டர்லி",
    tagline: "ஏஐ பயண திட்டமிடுபவர்",
    preparedBy: "வாண்டர்லி தயாரித்தது",
    tripOverview: "பயணக் கண்ணோட்டம்",
    destination: "இலக்கு",
    travelDates: "பயண தேதிகள்",
    duration: "கால அளவு",
    travelers: "பயணிகள்",
    budget: "மதிப்பிடப்பட்ட பட்ஜெட்",
    season: "பருவம் & வானிலை",
    interests: "ஆர்வங்கள்",
    emergency: "அவசர தொடர்புகள்",
    police: "காவல்துறை",
    ambulance: "ஆம்புலன்ஸ்",
    helpline: "சுற்றுலா உதவி எண்",
    advisory: "பாதுகாப்பு ஆலோசனை",
    hotels: "பரிந்துரைக்கப்பட்ட விடுதிகள்",
    category: "வகை",
    hotel: "விடுதி",
    price: "விலை",
    rating: "மதிப்பீடு",
    notes: "குறிப்புகள்",
    itinerary: "நாட்குறிப்பு பயணத்திட்டம்",
    day: "நாள்",
    estCost: "மதிப்பிடப்பட்ட செலவு",
    time: "நேரம்",
    location: "இடம்",
    activity: "செயல்பாடு",
    transport: "போக்குவரத்து",
    morning: "காலை",
    afternoon: "மதியம்",
    evening: "மாலை",
    night: "இரவு",
    costBreakdown: "செலவு விவரம்",
    stay: "தங்குமிடம்",
    food: "உணவு",
    travel: "பயணம்",
    activities: "செயல்பாடுகள்",
    packing: "ஆடை மற்றும் பொதி வழிகாட்டி",
    page: "பக்கம்",
    of: "இல்",
    culturalOverview: "கலாச்சார கண்ணோட்டம்",
    historicalBackground: "வரலாற்று பின்னணி",
    culturalIdentity: "கலாச்சார அடையாளம்",
    historicalPeriod: "வரலாற்றுக்காலம்",
    majorTraditions: "முக்கிய பாரம்பரியங்கள்",
    journeyStory: "உங்கள் பயணத்தின் கதை",
    heritageStory: "பாரம்பரிய கதை",
    heritagePlaces: "பாரம்பரிய இடங்கள்",
    verifiedHistory: "சரிபார்க்கப்பட்ட வரலாற்று உண்மைகள்",
    era: "காலம்",
    source: "மூலம்",
    legends: "புராணங்கள் மற்றும் நாட்டுப்புற கதைகள்",
    figures: "வரலாற்று நாயகர்கள்",
    role: "பங்கு",
    significance: "முக்கியத்துவம்",
    localCulture: "உள்ளூர் கலாச்சாரம்",
    culinaryHeritage: "பாரம்பரிய உணவு முறை",
    festivals: "கலாச்சார திருவிழாக்கள்",
    localPhrases: "உள்ளூர் மொழி மற்றும் சொற்றொடர்கள்",
    phrase: "சொற்றொடர்",
    meaning: "பொருள்",
    pronunciation: "உச்சரிப்பு",
    context: "சூழல்",
    culturalEtiquette: "கலாச்சார நடத்தை விதிகள்",
    dos: "செய்ய வேண்டியவை",
    donts: "தவிர்க்க வேண்டியவை",
    hiddenGems: "அருகிலுள்ள மறைக்கப்பட்ட பொக்கிஷங்கள்",
  },
  te: {
    brand: "వాండర్లీ",
    tagline: "ఏఐ ఆధారిత ప్రయాణ ప్రణాళిక",
    preparedBy: "వాండర్లీ ద్వారా రూపొందించబడింది",
    tripOverview: "ప్రయాణ అవలోకనం",
    destination: "గమ్యస్థానం",
    travelDates: "ప్రయాణ తేదీలు",
    duration: "వ్యవధి",
    travelers: "ప్రయాణికులు",
    budget: "అంచనా బడ్జెట్",
    season: "వాతావరణం & కాలం",
    interests: "ఆసక్తులు",
    emergency: "అత్యవసర పరిచయాలు",
    police: "పోలీసులు",
    ambulance: "అంబులెన్స్",
    helpline: "టూరిస్ట్ హెల్ప్‌లైన్",
    advisory: "భద్రతా సలహా",
    hotels: "సిఫార్సు చేయబడిన హోటళ్ళు",
    category: "వర్గం",
    hotel: "హోటల్",
    price: "ధర",
    rating: "రేటింగ్",
    notes: "వివరాలు",
    itinerary: "రోజువారీ ప్రయాణ ప్రణాళిక",
    day: "రోజు",
    estCost: "అంచనా ఖర్చు",
    time: "సమయం",
    location: "ప్రదేశం",
    activity: "కార్యకలాపం",
    transport: "రవాణా",
    morning: "ఉదయం",
    afternoon: "మధ్యాహ్నం",
    evening: "సాయంత్రం",
    night: "రాత్రి",
    costBreakdown: "ఖర్చుల వివరాలు",
    stay: "వసతి",
    food: "ఆహారం",
    travel: "ప్రయాణం",
    activities: "కార్యకలాపాలు",
    packing: "ప్యాకింగ్ గైడ్",
    page: "పేజీ",
    of: "లో",
    culturalOverview: "సాంస్కృతిక అవలోకనం",
    historicalBackground: "చారిత్రక నేపథ్యం",
    culturalIdentity: "సాంస్కృతిక గుర్తింపు",
    historicalPeriod: "చారిత్రక కాలం",
    majorTraditions: "ప్రధాన సంప్రదాయాలు",
    journeyStory: "మీ ప్రయాణ గాథ",
    heritageStory: "వారసత్వ కథ",
    heritagePlaces: "వారసత్వ ప్రదేశాలు",
    verifiedHistory: "ధృవీకరించబడిన చారిత్రక వాస్తవాలు",
    era: "యుగం",
    source: "మూలం",
    legends: "పురాణాలు & జానపద కథలు",
    figures: "చారిత్రక ప్రముఖులు",
    role: "పాత్ర",
    significance: "ప్రాముఖ్యత",
    localCulture: "స్థానిక సంస్కృతి",
    culinaryHeritage: "ఆహార వారసత్వం",
    festivals: "సాంస్కృతిక పండుగలు",
    localPhrases: "స్థానిక భాష మరియు పదాలు",
    phrase: "పదం",
    meaning: "అర్థం",
    pronunciation: "ఉచ్చారణ",
    context: "సందర్భం",
    culturalEtiquette: "సాంస్కృతిక మర్యాదలు",
    dos: "చేయవలసినవి",
    donts: "చేయకూడనివి",
    hiddenGems: "సమీపంలోని దాగి ఉన్న అద్భుతాలు",
  },
  kn: {
    brand: "ವಾಂಡರ್ಲಿ",
    tagline: "ಎಐ-ಆಧಾರಿತ ಪ್ರವಾಸ ಯೋಜಕ",
    preparedBy: "ವಾಂಡರ್ಲಿ ರಚಿಸಿದೆ",
    tripOverview: "ಪ್ರವಾಸ ಅವಲೋಕನ",
    destination: "ಗಮ್ಯಸ್ಥಾನ",
    travelDates: "ಪ್ರವಾಸದ ದಿನಾಂಕಗಳು",
    duration: "ಅವಧಿ",
    travelers: "ಪ್ರವಾಸಿಗರು",
    budget: "ಅಂದಾಜು ಬಜೆಟ್",
    season: "ಹವಾಮಾನ ಮತ್ತು ಋತು",
    interests: "ಆಸಕ್ತಿಗಳು",
    emergency: "ತುರ್ತು ಸಂಪರ್ಕಗಳು",
    police: "ಪೊಲೀಸ್",
    ambulance: "ಆಂಬ್ಯುಲೆನ್ಸ್",
    helpline: "ಪ್ರವಾಸಿ ಹೆಲ್ಪ್‌ಲೈನ್",
    advisory: "ಸುರಕ್ಷತಾ ಸಲಹೆ",
    hotels: "ಶಿಫಾರಸು ಮಾಡಿದ ಹೋಟೆಲ್‌ಗಳು",
    category: "ವರ್ಗ",
    hotel: "ಹೋಟೆಲ್",
    price: "ದರ",
    rating: "ರೇಟಿಂಗ್",
    notes: "ಟಿಪ್ಪಣಿಗಳು",
    itinerary: "ದೈನಂದಿನ ಪ್ರವಾಸ ವಿವರ",
    day: "ದಿನ",
    estCost: "ಅಂದಾಜು ವೆಚ್ಚ",
    time: "ಸಮಯ",
    location: "ಸ್ಥಳ",
    activity: "ಚಟುವಟಿಕೆ",
    transport: "ಸಾರಿಗೆ",
    morning: "ಬೆಳಗ್ಗೆ",
    afternoon: "ಮಧ್ಯಾಹ್ನ",
    evening: "ಸಂಜೆ",
    night: "ರಾತ್ರಿ",
    costBreakdown: "ವೆಚ್ಚದ ವಿವರಣೆ",
    stay: "ವಸತಿ",
    food: "ಆಹಾರ",
    travel: "ಪ್ರಯಾಣ",
    activities: "ಚಟುವಟಿಕೆಗಳು",
    packing: "ಉಡುಪು ಮತ್ತು ಪ್ಯಾಕಿಂಗ್ ಮಾರ್ಗದರ್ಶಿ",
    page: "ಪುಟ",
    of: "ರಲ್ಲಿ",
    culturalOverview: "ಸಾಂಸ್ಕೃತಿಕ ಅವಲೋಕನ",
    historicalBackground: "ಐತಿಹಾಸಿಕ ಹಿನ್ನೆಲೆ",
    culturalIdentity: "ಸಾಂಸ್ಕೃತಿಕ ಗುರುತು",
    historicalPeriod: "ಐತಿಹಾಸಿಕ ಕಾಲ",
    majorTraditions: "ಪ್ರಮುಖ ಸಂಪ್ರದಾಯಗಳು",
    journeyStory: "ನಿಮ್ಮ ಪ್ರವಾಸದ ಕಥೆ",
    heritageStory: "ಪರಂಪರೆಯ ಕಥೆ",
    heritagePlaces: "ಪಾರಂಪರಿಕ ತಾಣಗಳು",
    verifiedHistory: "ದೃಢೀಕರಿಸಿದ ಐತಿಹಾಸಿಕ ಸತ್ಯಗಳು",
    era: "ಯುಗ",
    source: "ಮೂಲ",
    legends: "ಪುರಾಣಗಳು ಮತ್ತು ಜಾನಪದ ಕಥೆಗಳು",
    figures: "ಐತಿಹಾಸಿಕ ವ್ಯಕ್ತಿಗಳು",
    role: "ಪಾತ್ರ",
    significance: "ಮಹತ್ವ",
    localCulture: "ಸ್ಥಳೀಯ ಸಂಸ್ಕೃತಿ",
    culinaryHeritage: "ಆಹಾರ ಸಂಸ್ಕೃತಿ",
    festivals: "ಸಾಂಸ್ಕೃತಿಕ ಹಬ್ಬಗಳು",
    localPhrases: "ಸ್ಥಳೀಯ ಭಾಷೆ ಮತ್ತು ವಾಕ್ಯಗಳು",
    phrase: "ವಾಕ್ಯ",
    meaning: "ಅರ್ಥ",
    pronunciation: "ಉಚ್ಚಾರಣೆ",
    context: "ಸಂದರ್ಭ",
    culturalEtiquette: "ಸಾಂಸ್ಕೃತಿಕ ಶಿಷ್ಟಾಚಾರ",
    dos: "ಮಾಡಬೇಕಾದವು",
    donts: "ಮಾಡಬಾರದವು",
    hiddenGems: "ಹತ್ತಿರದ ರಹಸ್ಯ ತಾಣಗಳು",
  },
  ml: {
    brand: "വാണ്ടർലി",
    tagline: "എഐ യാത്രാ സഹായി",
    preparedBy: "വാണ്ടർലി തയ്യാറാക്കിയത്",
    tripOverview: "യാത്രാ അവലോകനം",
    destination: "ലക്ഷ്യസ്ഥാനം",
    travelDates: "യാത്രാ തീയതികൾ",
    duration: "ദൈർഘ്യം",
    travelers: "യാത്രികർ",
    budget: "കണക്കാക്കിയ ബജറ്റ്",
    season: "കാലാവസ്ഥയും ഋതുവും",
    interests: "താൽപ്പര്യങ്ങൾ",
    emergency: "അടിയന്തര ബന്ധപ്പെടലുകൾ",
    police: "പോലീസ്",
    ambulance: "ആംബുലൻസ്",
    helpline: "ടൂറിസ്റ്റ് ഹെൽപ്പ്‌ലൈൻ",
    advisory: "സുരക്ഷാ നിർദ്ദേശം",
    hotels: "ശുപാർശ ചെയ്യുന്ന ഹോട്ടലുകൾ",
    category: "വിഭാഗം",
    hotel: "ഹോട്ടൽ",
    price: "വില",
    rating: "റേറ്റിംഗ്",
    notes: "വിവരങ്ങൾ",
    itinerary: "ദിവസേനയുള്ള യാത്രാ പദ്ധതി",
    day: "ദിവസം",
    estCost: "പ്രതീക്ഷിക്കുന്ന ചെലവ്",
    time: "സമയം",
    location: "സ്ഥലം",
    activity: "പ്രവർത്തനം",
    transport: "ഗതാഗതം",
    morning: "രാവിലെ",
    afternoon: "ഉച്ചയ്ക്ക്",
    evening: "വൈകുന്നേരം",
    night: "രാത്രി",
    costBreakdown: "ചെലവ് വിഭജനം",
    stay: "താമസം",
    food: "ഭക്ഷണം",
    travel: "യാത്ര",
    activities: "പ്രവർത്തനങ്ങൾ",
    packing: "വസ്ത്രധാരണ മാർഗ്ഗനിർദ്ദേശം",
    page: "പേജ്",
    of: "ൽ",
    culturalOverview: "സാംസ്കാരിക അവലോകനം",
    historicalBackground: "ചരിത്ര പശ്ചാത്തലം",
    culturalIdentity: "സാംസ്കാരിക വ്യക്തിത്വം",
    historicalPeriod: "ചരിത്ര കാലഘട്ടം",
    majorTraditions: "പ്രധാന പാരമ്പര്യങ്ങൾ",
    journeyStory: "നിങ്ങളുടെ യാത്രയുടെ കഥ",
    heritageStory: "പൈതൃക കഥ",
    heritagePlaces: "പൈതൃക കേന്ദ്രങ്ങൾ",
    verifiedHistory: "സ്ഥിരീകരിച്ച ചരിത്ര വസ്തുതകൾ",
    era: "കാലഘട്ടം",
    source: "ഉറവിടം",
    legends: "ഐതിഹ്യങ്ങളും നാടോടിക്കഥകളും",
    figures: "ചരിത്ര പുരുഷന്മാർ",
    role: "പങ്ക്",
    significance: "പ്രാധാന്യം",
    localCulture: "പ്രാദേശിക സംസ്കാരം",
    culinaryHeritage: "ഭക്ഷണ പാരമ്പര്യം",
    festivals: "സാംസ്കാരിക ഉത്സവങ്ങൾ",
    localPhrases: "പ്രാദേശിക ഭാഷാ പ്രയോഗങ്ങൾ",
    phrase: "വാചകം",
    meaning: "അർത്ഥം",
    pronunciation: "ഉച്ചാരണം",
    context: "സന്ദർഭം",
    culturalEtiquette: "സാംസ്കാരിക മര്യാദകൾ",
    dos: "ചെയ്യേണ്ടവ",
    donts: "ഒഴിവാക്കേണ്ടവ",
    hiddenGems: "അടുത്തുള്ള മറഞ്ഞിരിക്കുന്ന വിസ്മയങ്ങൾ",
  },
  pa: {
    brand: "ਵਾਂਡਰਲੀ",
    tagline: "ਏਆਈ ਯਾਤਰਾ ਯੋਜਨਾਕਾਰ",
    preparedBy: "ਵਾਂਡਰਲੀ ਦੁਆਰਾ ਤਿਆਰ",
    tripOverview: "ਯਾਤਰਾ ਸੰਖੇਪ",
    destination: "ਮੰਜ਼ਿਲ",
    travelDates: "ਯਾਤਰਾ ਦੀਆਂ ਤਾਰੀਖਾਂ",
    duration: "ਮਿਆਦ",
    travelers: "ਯਾਤਰੀ",
    budget: "ਅਨੁਮਾਨਿਤ ਬਜਟ",
    season: "ਮੌਸਮ ਅਤੇ ਰੁੱਤ",
    interests: "ਦਿਲਚਸਪੀਆਂ",
    emergency: "ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ",
    police: "ਪੁਲਿਸ",
    ambulance: "ਐਂਬੂਲੈਂਸ",
    helpline: "ਟੂਰਿਸਟ ਹੈਲਪਲਾਈਨ",
    advisory: "ਸੁਰੱਖਿਆ ਸਲਾਹ",
    hotels: "ਸਿਫ਼ਾਰਿਸ਼ ਕੀਤੇ ਹੋਟਲ",
    category: "ਸ਼੍ਰੇਣੀ",
    hotel: "ਹੋਟਲ",
    price: "ਕੀਮਤ",
    rating: "ਰੇਟਿੰਗ",
    notes: "ਵੇਰਵੇ",
    itinerary: "ਰੋਜ਼ਾਨਾ ਯਾਤਰਾ ਯੋਜਨਾ",
    day: "ਦਿਨ",
    estCost: "ਅਨੁਮਾਨਿਤ ਖ਼ਰਚ",
    time: "ਸਮਾਂ",
    location: "ਸਥਾਨ",
    activity: "ਗਤੀਵਿਧੀ",
    transport: "ਆਵਾਜਾਈ",
    morning: "ਸਵੇਰ",
    afternoon: "ਦੁਪਹਿਰ",
    evening: "ਸ਼ਾਮ",
    night: "ਰਾਤ",
    costBreakdown: "ਖ਼ਰਚੇ ਦਾ ਵੇਰਵਾ",
    stay: "ਰਿਹਾਇਸ਼",
    food: "ਖਾਣਾ",
    travel: "ਸਫ਼ਰ",
    activities: "ਗਤੀਵਿਧੀਆਂ",
    packing: "ਕੱਪੜੇ ਅਤੇ ਪੈਕਿੰਗ ਗਾਈਡ",
    page: "ਪੰਨਾ",
    of: "ਵਿੱਚੋਂ",
    culturalOverview: "ਸੱਭਿਆਚਾਰਕ ਸੰਖੇਪ",
    historicalBackground: "ਇਤਿਹਾਸਕ ਪਿਛੋਕੜ",
    culturalIdentity: "ਸੱਭਿਆਚਾਰਕ ਪਛਾਣ",
    historicalPeriod: "ਇਤਿਹਾਸਕ ਦੌਰ",
    majorTraditions: "ਮੁੱਖ ਰਵਾਇਤਾਂ",
    journeyStory: "ਤੁਹਾਡੀ ਯਾਤਰਾ ਦੀ ਕਹਾਣੀ",
    heritageStory: "ਵਿਰਾਸਤੀ ਕਹਾਣੀ",
    heritagePlaces: "ਵਿਰਾਸਤੀ ਸਥਾਨ",
    verifiedHistory: "ਪ੍ਰਮਾਣਿਤ ਇਤਿਹਾਸਕ ਤੱਥ",
    era: "ਯੁੱਗ",
    source: "ਸਰੋਤ",
    legends: "ਲੋਕ ਕਹਾਣੀਆਂ ਅਤੇ ਮਿੱਥਾਂ",
    figures: "ਇਤਿਹਾਸਕ ਸ਼ਖ਼ਸੀਅਤਾਂ",
    role: "ਭੂਮਿਕਾ",
    significance: "ਮਹੱਤਵ",
    localCulture: "ਸਥਾਨਕ ਸੱਭਿਆਚਾਰ",
    culinaryHeritage: "ਖਾਣ-ਪੀਣ ਦੀ ਵਿਰਾਸਤ",
    festivals: "ਸੱਭਿਆਚਾਰਕ ਤਿਉਹਾਰ",
    localPhrases: "ਸਥਾਨਕ ਬੋਲੀ ਅਤੇ ਵਾਕ",
    phrase: "ਵਾਕ",
    meaning: "ਅਰਥ",
    pronunciation: "ਉਚਾਰਨ",
    context: "ਪ੍ਰਸੰਗ",
    culturalEtiquette: "ਸੱਭਿਆਚਾਰਕ ਸ਼ਿਸ਼ਟਾਚਾਰ",
    dos: "ਕਰਨ ਯੋਗ",
    donts: "ਨਾ ਕਰਨ ਯੋਗ",
    hiddenGems: "ਨੇੜਲੇ ਅਣਦੇਖੇ ਸਥਾਨ",
  },
  or: {
    brand: "ୱାଣ୍ଡରଲି",
    tagline: "ଏଆଇ ଯାତ୍ରା ଯୋଜନାକାରୀ",
    preparedBy: "ୱାଣ୍ଡରଲି ଦ୍ୱାରା ପ୍ରସ୍ତୁତ",
    tripOverview: "ଯାତ୍ରା ସମୀକ୍ଷା",
    destination: "ଗନ୍ତବ୍ୟ ସ୍ଥଳ",
    travelDates: "ଯାତ୍ରା ତାରିଖ",
    duration: "ସମୟସୀମା",
    travelers: "ଯାତ୍ରୀ",
    budget: "ଆନୁମାନିକ ବଜେଟ",
    season: "ଋତୁ ଏବଂ ପାଣିପାଗ",
    interests: "ଆଗ୍ରହ",
    emergency: "ଜରୁରୀକାଳୀନ ଯୋଗାଯୋଗ",
    police: "ପୋଲିସ",
    ambulance: "ଆମ୍ବୁଲାନ୍ସ",
    helpline: "ପର୍ଯ୍ୟଟକ ହେଲ୍ପଲାଇନ",
    advisory: "ସୁରକ୍ଷା ପରାମର୍ଶ",
    hotels: "ଅନୁମୋଦିତ ହୋଟେଲ",
    category: "ବର୍ଗ",
    hotel: "ହୋଟେଲ",
    price: "ମୂଲ୍ୟ",
    rating: "ରେଟିଂ",
    notes: "ଟିପ୍ପଣୀ",
    itinerary: "ଦୈନନ୍ଦିନ ଯାତ୍ରା ବିବରଣୀ",
    day: "ଦିନ",
    estCost: "ଆନୁମାନିକ ଖର୍ଚ୍ଚ",
    time: "ସମୟ",
    location: "ସ୍ଥାନ",
    activity: "କାର୍ଯ୍ୟକଳାପ",
    transport: "ପରିବହନ",
    morning: "ସକାଳ",
    afternoon: "ମଧ୍ୟାହ୍ନ",
    evening: "ସନ୍ଧ୍ୟା",
    night: "ରାତି",
    costBreakdown: "ଖର୍ଚ୍ଚ ବିଭାଜନ",
    stay: "ରହଣି",
    food: "ଖାଦ୍ୟ",
    travel: "ଯାତ୍ରା",
    activities: "କାର୍ଯ୍ୟକଳାପ",
    packing: "ପୋଷାକ ଏବଂ ପ୍ୟାକିଂ ମାର୍ଗଦର୍ଶିକା",
    page: "ପୃଷ୍ଠା",
    of: "ର",
    culturalOverview: "ସାଂସ୍କୃତିକ ଅବଲୋକନ",
    historicalBackground: "ଐତିହାସିକ ପୃଷ୍ଠଭୂମି",
    culturalIdentity: "ସାଂସ୍କୃତିକ ପରିଚୟ",
    historicalPeriod: "ଐତିହାସିକ ଯୁଗ",
    majorTraditions: "ପ୍ରମୁଖ ପରମ୍ପରା",
    journeyStory: "ଆପଣଙ୍କ ଯାତ୍ରାର କାହାଣୀ",
    heritageStory: "ଐତିହ୍ୟ କାହାଣୀ",
    heritagePlaces: "ଐତିହ୍ୟ ସ୍ଥଳୀ",
    verifiedHistory: "ପ୍ରମାଣିତ ଐତିହାସିକ ତଥ୍ୟ",
    era: "ଯୁଗ",
    source: "ଉତ୍ସ",
    legends: "ଲୋକକଥା ଓ ପୌରାଣିକ କାହାଣୀ",
    figures: "ଐତିହାସିକ ବ୍ୟକ୍ତିବିଶେଷ",
    role: "ଭୂମିକା",
    significance: "ମହତ୍ତ୍ୱ",
    localCulture: "ସ୍ଥାନୀୟ ସଂସ୍କୃତି",
    culinaryHeritage: "ରନ୍ଧନ ଐତିହ୍ୟ",
    festivals: "ସାଂସ୍କୃତିକ ପର୍ବପର୍ବାଣି",
    localPhrases: "ସ୍ଥାନୀୟ ଭାଷା ଏବଂ ବାକ୍ୟାଂଶ",
    phrase: "ବାକ୍ୟାଂଶ",
    meaning: "ଅର୍ଥ",
    pronunciation: "ଉଚ୍ଚାରଣ",
    context: "ପ୍ରସଙ୍ଗ",
    culturalEtiquette: "ସାଂସ୍କୃତିକ ଶିଷ୍ଟାଚାର",
    dos: "କରଣୀୟ",
    donts: "ବର୍ଜନୀୟ",
    hiddenGems: "ନିକଟସ୍ଥ ଅଜ୍ଞାତ ଆକର୍ଷଣ",
  },
  as: {
    brand: "ৱাণ্ডাৰলী",
    tagline: "এআই চালিত ভ্ৰমণ পৰিকল্পনাকাৰী",
    preparedBy: "ৱাণ্ডাৰলী দ্বাৰা প্ৰস্তুত",
    tripOverview: "ভ্ৰমণৰ সংক্ষিপ্ত বিৱৰণ",
    destination: "গন্তব্যস্থল",
    travelDates: "ভ্ৰমণৰ তাৰিখ",
    duration: "সময়সীমা",
    travelers: "যাত্ৰী",
    budget: "আনুমানিক বাজেট",
    season: "বতৰ আৰু ঋতু",
    interests: "ৰুচি",
    emergency: "জৰুৰীকালীন যোগাযোগ",
    police: "আৰক্ষী",
    ambulance: "এম্বুলেন্স",
    helpline: "পৰ্যটক হেল্পলাইন",
    advisory: "সুৰক্ষা পৰামৰ্শ",
    hotels: "পৰামৰ্শিত হোটেল",
    category: "শ্ৰেণী",
    hotel: "হোটেল",
    price: "মূল্য",
    rating: "ৰেটিং",
    notes: "টোকা",
    itinerary: "দৈনন্দিন ভ্ৰমণসূচী",
    day: "দিন",
    estCost: "আনুমানিক খৰচ",
    time: "সময়",
    location: "স্থান",
    activity: "কাৰ্যসূচী",
    transport: "যাতায়াত",
    morning: "ৰাতিপুৱা",
    afternoon: "দুপৰীয়া",
    evening: "গধূলি",
    night: "ৰাতি",
    costBreakdown: "খৰচৰ বিভাজন",
    stay: "থকা",
    food: "খোৱা",
    travel: "ভ্ৰমণ",
    activities: "কাৰ্যকলাপ",
    packing: "পোছাক আৰু পেকিং নিৰ্দেশনা",
    page: "পৃষ্ঠা",
    of: "ৰ",
    culturalOverview: "সাংস্কৃতিক সংক্ষিপ্ত ৰূপ",
    historicalBackground: "ঐতিহাসিক পটভূমি",
    culturalIdentity: "সাংস্কৃতিক পৰিচয়",
    historicalPeriod: "ঐতিহাসিক যুগ",
    majorTraditions: "প্ৰধান পৰম্পৰা",
    journeyStory: "আপোনাৰ যাত্ৰাৰ কাহিনী",
    heritageStory: "ঐতিহ্যৰ কাহিনী",
    heritagePlaces: "ঐতিহাসিক স্থানসমূহ",
    verifiedHistory: "প্ৰমাণিত ঐতিহাসিক তথ্য",
    era: "যুগ",
    source: "উৎস",
    legends: "কিংবদন্তি আৰু লোককথা",
    figures: "ঐতিহাসিক ব্যক্তিসকল",
    role: "ভূমিকা",
    significance: "গুৰুত্ব",
    localCulture: "স্থানীয় সংস্কৃতি",
    culinaryHeritage: "খাদ্য সংস্কৃতি",
    festivals: "সাংস্কৃতিক উৎসৱ",
    localPhrases: "স্থানীয় ভাষা আৰু বাক্য",
    phrase: "বাক্য",
    meaning: "অৰ্থ",
    pronunciation: "উচ্চাৰণ",
    context: "প্ৰসংগ",
    culturalEtiquette: "সাংস্কৃতিক শিষ্টাচাৰ",
    dos: "কৰণীয়",
    donts: "বৰ্জনীয়",
    hiddenGems: "কাষৰীয়া অপ্ৰকাশিত স্থান",
  },
};

function getLabels(lang: string): PdfLabels {
  return PDF_TRANSLATIONS[lang] || PDF_TRANSLATIONS.en;
}

// ─── Automatic Trip Language Resolver with Multi-Tier Fallback ───────────────
export function resolveTripLanguage(trip: any, fallbackLang = "en"): string {
  // Priority 1: Explicit stored planningLanguage or language on the trip object
  if (trip?.planningLanguage && typeof trip.planningLanguage === "string") {
    const l = trip.planningLanguage.trim().toLowerCase();
    if (PDF_TRANSLATIONS[l]) return l;
  }
  if (trip?.language && typeof trip.language === "string") {
    const l = trip.language.trim().toLowerCase();
    if (PDF_TRANSLATIONS[l]) return l;
  }

  // Priority 2: Content script detection from itinerary, destination, season
  const sampleParts: string[] = [];
  if (trip?.destination) sampleParts.push(String(trip.destination));
  if (trip?.season_info) sampleParts.push(String(trip.season_info));
  if (trip?.status_message) sampleParts.push(String(trip.status_message));
  if (Array.isArray(trip?.itinerary)) {
    for (const day of trip.itinerary.slice(0, 4)) {
      if (day?.slots) {
        for (const slotKey of ["morning", "afternoon", "evening", "night"]) {
          const s = day.slots[slotKey];
          if (s?.place) sampleParts.push(String(s.place));
          if (s?.activity) sampleParts.push(String(s.activity));
          if (s?.transport) sampleParts.push(String(s.transport));
        }
      }
    }
  }
  const sample = sampleParts.join(" ");

  // Devanagari script (\u0900-\u097F) -> mr or hi
  if (/[\u0900-\u097F]/.test(sample)) {
    // Marathi specific letter: ळ (\u0933)
    if (/[\u0933]/.test(sample)) return "mr";
    // Check common Marathi vocabulary markers
    if (/\b(आहे|करा|ठिकाण|पर्यटन|दिवस|सकाळ|दुपार|संध्याकाळ|रात्र|प्रवास|किल्ला|पहाट|मार्गदर्शन|मुक्काम|जेवण|साहित्य)\b/.test(sample)) {
      return "mr";
    }
    return "hi";
  }
  // Bengali / Assamese script (\u0980-\u09FF)
  if (/[\u0980-\u09FF]/.test(sample)) {
    // Assamese specific characters: ৰ (\u09F0), ৱ (\u09F1)
    if (/[\u09F0\u09F1]/.test(sample)) return "as";
    return "bn";
  }
  // Gujarati (\u0A80-\u0AFF)
  if (/[\u0A80-\u0AFF]/.test(sample)) return "gu";
  // Gurmukhi / Punjabi (\u0A00-\u0A7F)
  if (/[\u0A00-\u0A7F]/.test(sample)) return "pa";
  // Odia (\u0B00-\u0B7F)
  if (/[\u0B00-\u0B7F]/.test(sample)) return "or";
  // Tamil (\u0B80-\u0BFF)
  if (/[\u0B80-\u0BFF]/.test(sample)) return "ta";
  // Telugu (\u0C00-\u0C7F)
  if (/[\u0C00-\u0C7F]/.test(sample)) return "te";
  // Kannada (\u0C80-\u0CFF)
  if (/[\u0C80-\u0CFF]/.test(sample)) return "kn";
  // Malayalam (\u0D00-\u0D7F)
  if (/[\u0D00-\u0D7F]/.test(sample)) return "ml";

  // Priority 3: Fallback user preference
  if (fallbackLang && PDF_TRANSLATIONS[fallbackLang.toLowerCase()]) {
    return fallbackLang.toLowerCase();
  }

  // Priority 4: English
  return "en";
}

// ─── Header & Footer Helpers ────────────────────────────────────────────────
/** Running top header on Page 2+ */
function drawRunningHeader(doc: jsPDF, title: string, font: string): void {
  doc.setFont(font, "normal");
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  doc.text("WANDERLY", MARGIN_LEFT, 11);
  doc.text(`|   ${title}`, MARGIN_LEFT + 22, 11);

  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, 14, PAGE_WIDTH - MARGIN_LEFT, 14);
}

/** Apply footers across all pages */
function applyRunningFooters(doc: jsPDF, font: string, labels: PdfLabels): void {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Separator rule
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_LEFT, PAGE_HEIGHT - 12, PAGE_WIDTH - MARGIN_LEFT, PAGE_HEIGHT - 12);

    doc.setFont(font, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE);
    doc.text("wanderly.ai  •  AI Travel Companion", MARGIN_LEFT, PAGE_HEIGHT - 7);

    const pageStr = `${labels.page} ${i} ${labels.of} ${totalPages}`;
    doc.text(pageStr, PAGE_WIDTH - MARGIN_LEFT, PAGE_HEIGHT - 7, { align: "right" });
  }
}

// ─── Section Header with Smart Page-Break ("Keep With Next") ─────────────────
function addSectionHeader(
  doc: jsPDF,
  title: string,
  y: number,
  font: string,
  minRemainingHeight = 45
): number {
  // If remaining space on the page is less than minRemainingHeight, advance to new page
  if (y + minRemainingHeight > CONTENT_BOTTOM) {
    doc.addPage();
    y = 22;
  }

  // Draw elegant section header bar
  doc.setFillColor(...SOFT_BG);
  doc.setDrawColor(...EMERALD);
  doc.setLineWidth(0.4);
  doc.roundedRect(MARGIN_LEFT, y, CONTENT_WIDTH, 9, 2, 2, "FD");

  // Left accent indicator
  doc.setFillColor(...FOREST);
  doc.rect(MARGIN_LEFT, y, 3, 9, "F");

  doc.setFont(font, "normal");
  doc.setFontSize(10);
  doc.setTextColor(...FOREST);
  doc.text(title, MARGIN_LEFT + 7, y + 6.2);

  return y + 14;
}

// ─── Paragraph with Dynamic Height Measurement ──────────────────────────────
function addParagraph(
  doc: jsPDF,
  text: string,
  y: number,
  font: string,
  fontSize = 9,
  color: [number, number, number] = CHARCOAL,
  indent = 0
): number {
  if (!text || text.trim().length === 0) return y;

  doc.setFont(font, "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);

  const usableWidth = CONTENT_WIDTH - indent;
  const lines = doc.splitTextToSize(text.trim(), usableWidth);
  const lineHeight = Math.max(fontSize * 0.48, 4.8); // Calibrated for Indic scripts

  for (let i = 0; i < lines.length; i++) {
    if (y + lineHeight > CONTENT_BOTTOM) {
      doc.addPage();
      y = 22;
      doc.setFont(font, "normal");
      doc.setFontSize(fontSize);
      doc.setTextColor(...color);
    }
    doc.text(lines[i], MARGIN_LEFT + indent, y);
    y += lineHeight;
  }

  return y + 2;
}

// ─── Bullet List ─────────────────────────────────────────────────────────────
function addBulletList(
  doc: jsPDF,
  items: string[],
  y: number,
  font: string,
  fontSize = 8.5,
  color: [number, number, number] = CHARCOAL
): number {
  if (!items || items.length === 0) return y;

  const bulletSymbol = "•";
  const usableWidth = CONTENT_WIDTH - 8;
  const lineHeight = Math.max(fontSize * 0.48, 4.6);

  doc.setFont(font, "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);

  for (const item of items) {
    if (!item) continue;
    const lines = doc.splitTextToSize(item.trim(), usableWidth);

    if (y + lines.length * lineHeight > CONTENT_BOTTOM) {
      doc.addPage();
      y = 22;
      doc.setFont(font, "normal");
      doc.setFontSize(fontSize);
      doc.setTextColor(...color);
    }

    doc.text(bulletSymbol, MARGIN_LEFT + 2, y);
    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], MARGIN_LEFT + 7, y);
      y += lineHeight;
    }
    y += 1;
  }

  return y + 2;
}

// ─── Key-Value Pair with Safe Offset ─────────────────────────────────────────
function addKeyValue(
  doc: jsPDF,
  key: string,
  value: string,
  y: number,
  font: string,
  fontSize = 8.5
): number {
  if (!value) return y;
  if (y + 8 > CONTENT_BOTTOM) {
    doc.addPage();
    y = 22;
  }

  doc.setFont(font, "normal");
  doc.setFontSize(fontSize);

  // Measure key width dynamically
  doc.setTextColor(...SLATE);
  doc.text(key, MARGIN_LEFT + 4, y);
  const keyWidth = doc.getTextWidth(key);
  const valueStartX = Math.max(MARGIN_LEFT + 4 + keyWidth + 4, MARGIN_LEFT + 46);
  const valueWidth = PAGE_WIDTH - MARGIN_LEFT - valueStartX;

  doc.setTextColor(...CHARCOAL);
  const valLines = doc.splitTextToSize(value, valueWidth);
  const lineHeight = Math.max(fontSize * 0.48, 4.6);

  for (let i = 0; i < valLines.length; i++) {
    if (y + lineHeight > CONTENT_BOTTOM) {
      doc.addPage();
      y = 22;
      doc.setFont(font, "normal");
      doc.setFontSize(fontSize);
      doc.setTextColor(...CHARCOAL);
    }
    doc.text(valLines[i], valueStartX, y);
    y += lineHeight;
  }

  return y + 1.5;
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. TRIP ITINERARY PDF EXPORT
// ═════════════════════════════════════════════════════════════════════════════
export async function exportTripPDF(
  trip: any,
  explicitLanguage?: string,
  activeUiLanguage = "en"
): Promise<void> {
  if (!trip) return;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // 1. Resolve Language Automatically:
  // Priority: explicit parameter -> trip.planningLanguage -> trip.language -> content script -> activeUiLanguage -> 'en'
  const lang = explicitLanguage || resolveTripLanguage(trip, activeUiLanguage);
  const labels = getLabels(lang);
  const font = await embedFontForLanguage(doc, lang);

  // ───────────────────────────────────────────────────────────────────────────
  // COVER PAGE (PAGE 1)
  // ───────────────────────────────────────────────────────────────────────────
  // Top Forest Green Header Banner
  doc.setFillColor(...FOREST);
  doc.rect(0, 0, PAGE_WIDTH, 62, "F");

  // Emerald accent ribbon
  doc.setFillColor(...EMERALD);
  doc.rect(0, 62, PAGE_WIDTH, 3, "F");

  // Brand Name & Tagline
  doc.setFont(font, "normal");
  doc.setFontSize(22);
  doc.setTextColor(...WHITE);
  doc.text("WANDERLY", MARGIN_LEFT, 24);

  doc.setFontSize(9.5);
  doc.setTextColor(200, 235, 220);
  doc.text(labels.tagline, MARGIN_LEFT, 33);

  // Destination Hero Title on Cover
  doc.setFont(font, "normal");
  doc.setFontSize(22);
  doc.setTextColor(...FOREST);
  const destLines = doc.splitTextToSize(trip.destination || "Travel Plan", CONTENT_WIDTH);
  let coverY = 82;
  for (const line of destLines) {
    doc.text(line, MARGIN_LEFT, coverY);
    coverY += 9;
  }

  // Subtitle
  doc.setFontSize(11);
  doc.setTextColor(...SLATE);
  doc.text(`${trip.days || 1} ${labels.day} ${labels.itinerary}`, MARGIN_LEFT, coverY + 1);
  coverY += 14;

  // ── Cover Metadata Grid (Clean 4 Cards) ───────────────────────────────────
  const cardW = (CONTENT_WIDTH - 6) / 2; // 88mm each
  const cardH = 26;

  // Card 1: Dates & Duration
  doc.setFillColor(...CREAM);
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN_LEFT, coverY, cardW, cardH, 3, 3, "FD");

  doc.setFont(font, "normal");
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  doc.text(labels.travelDates.toUpperCase(), MARGIN_LEFT + 5, coverY + 7);
  doc.setFontSize(9);
  doc.setTextColor(...CHARCOAL);
  doc.text(`${trip.startDate || "―"}  →  ${trip.endDate || "―"}`, MARGIN_LEFT + 5, coverY + 14);
  doc.setFontSize(8);
  doc.setTextColor(...EMERALD);
  doc.text(`${labels.duration}: ${trip.days || 1} ${labels.day}`, MARGIN_LEFT + 5, coverY + 21);

  // Card 2: Travelers & Budget
  const card2X = MARGIN_LEFT + cardW + 6;
  doc.setFillColor(...CREAM);
  doc.roundedRect(card2X, coverY, cardW, cardH, 3, 3, "FD");

  doc.setFont(font, "normal");
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  doc.text(labels.budget.toUpperCase(), card2X + 5, coverY + 7);
  doc.setFontSize(11);
  doc.setTextColor(...FOREST);
  doc.text(formatCurrencyStr(trip.budget, trip.currency), card2X + 5, coverY + 15);
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  doc.text(`${labels.travelers}: ${trip.people || 1}`, card2X + 5, coverY + 21);

  coverY += cardH + 6;

  // Card 3: Season & Climate Info (if available)
  if (trip.season_info) {
    doc.setFillColor(...SOFT_BG);
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(MARGIN_LEFT, coverY, CONTENT_WIDTH, 24, 3, 3, "FD");

    doc.setFont(font, "normal");
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);
    doc.text(labels.season.toUpperCase(), MARGIN_LEFT + 5, coverY + 7);
    doc.setFontSize(8.5);
    doc.setTextColor(...CHARCOAL);
    const seasonLines = doc.splitTextToSize(trip.season_info, CONTENT_WIDTH - 10);
    doc.text(seasonLines.slice(0, 2), MARGIN_LEFT + 5, coverY + 14);
    coverY += 30;
  }

  // Card 4: Interests Tags
  if (Array.isArray(trip.interests) && trip.interests.length > 0) {
    doc.setFillColor(...CREAM);
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(MARGIN_LEFT, coverY, CONTENT_WIDTH, 22, 3, 3, "FD");

    doc.setFont(font, "normal");
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);
    doc.text(labels.interests.toUpperCase(), MARGIN_LEFT + 5, coverY + 6.5);
    doc.setFontSize(8.5);
    doc.setTextColor(...CHARCOAL);
    const interestStr = trip.interests.map((i: string) => `• ${i}`).join("   ");
    const intLines = doc.splitTextToSize(interestStr, CONTENT_WIDTH - 10);
    doc.text(intLines.slice(0, 2), MARGIN_LEFT + 5, coverY + 13.5);
    coverY += 28;
  }

  // Cover Page Seal / Footer
  doc.setFont(font, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...SLATE);
  doc.text(labels.preparedBy, PAGE_WIDTH / 2, 266, { align: "center" });
  doc.setFontSize(7.5);
  doc.setTextColor(...EMERALD);
  doc.text("wanderly.ai  •  Verified Itinerary Dossier", PAGE_WIDTH / 2, 272, { align: "center" });

  // ───────────────────────────────────────────────────────────────────────────
  // PAGE 2+: DETAILED ITINERARY & TRIP CONTENT
  // ───────────────────────────────────────────────────────────────────────────
  doc.addPage();
  let y = 22;

  // Draw running header on page 2
  drawRunningHeader(doc, trip.destination || "Trip Itinerary", font);

  // ── 1. Safety Advisory / Emergency Contacts (High Priority) ───────────────
  if (trip.safety_warning || trip.emergency) {
    y = addSectionHeader(doc, `[!] ${labels.advisory} & ${labels.emergency}`, y, font, 40);

    if (trip.safety_warning) {
      doc.setFillColor(...ERROR_BG);
      doc.setDrawColor(...ERROR_RED);
      doc.setLineWidth(0.4);
      const warnLines = doc.splitTextToSize(trip.safety_warning, CONTENT_WIDTH - 8);
      const warnH = Math.max(warnLines.length * 4.8 + 6, 14);

      doc.roundedRect(MARGIN_LEFT, y, CONTENT_WIDTH, warnH, 2, 2, "FD");
      doc.setFont(font, "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...ERROR_RED);
      doc.text(warnLines, MARGIN_LEFT + 4, y + 5);
      y += warnH + 4;
    }

    if (trip.emergency) {
      const em = trip.emergency;
      const emText = `${labels.police}: ${em.police || "112"}    |    ${labels.ambulance}: ${em.ambulance || "102"}    |    ${labels.helpline}: ${em.helpline || "1363"}`;
      y = addParagraph(doc, emText, y, font, 8.5, CHARCOAL, 4);
      y += 3;
    }
  }

  // ── 2. Trip Overview Details ──────────────────────────────────────────────
  y = addSectionHeader(doc, labels.tripOverview, y, font, 40);
  y = addKeyValue(doc, `${labels.destination}:`, trip.destination || "―", y, font);
  y = addKeyValue(doc, `${labels.travelDates}:`, `${trip.startDate || "―"}  →  ${trip.endDate || "―"}`, y, font);
  y = addKeyValue(doc, `${labels.duration}:`, `${trip.days || 1} ${labels.day}`, y, font);
  y = addKeyValue(doc, `${labels.travelers}:`, String(trip.people || 1), y, font);
  y = addKeyValue(doc, `${labels.budget}:`, formatCurrencyStr(trip.budget, trip.currency), y, font);
  y += 4;

  // ── 3. Cost Breakdown (Table) ─────────────────────────────────────────────
  if (trip.cost_breakdown) {
    const cb = trip.cost_breakdown;
    y = addSectionHeader(doc, labels.costBreakdown, y, font, 50);

    const cbData = [
      [labels.stay, formatCurrencyStr(cb.stay, trip.currency)],
      [labels.food, formatCurrencyStr(cb.food, trip.currency)],
      [labels.travel, formatCurrencyStr(cb.travel, trip.currency)],
      [labels.activities, formatCurrencyStr(cb.activities, trip.currency)],
    ];

    autoTable(doc, {
      startY: y,
      head: [[labels.category, labels.budget]],
      body: cbData,
      theme: "striped",
      headStyles: {
        fillColor: FOREST,
        textColor: WHITE,
        font,
        fontSize: 8.5,
        cellPadding: 2.8,
      },
      styles: {
        font,
        fontSize: 8.5,
        cellPadding: 2.8,
        textColor: CHARCOAL,
      },
      alternateRowStyles: { fillColor: SOFT_BG },
      margin: { left: MARGIN_LEFT, right: MARGIN_LEFT },
      tableWidth: 105,
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── 4. Recommended Hotels ─────────────────────────────────────────────────
  if (Array.isArray(trip.hotels) && trip.hotels.length > 0) {
    y = addSectionHeader(doc, labels.hotels, y, font, 55);

    const hotelRows = trip.hotels.map((h: any) => [
      h.category || "Standard",
      h.name || "―",
      formatCurrencyStr(h.price_per_night, trip.currency) + "/night",
      h.rating ? `${h.rating} / 5` : "―",
      h.description ? h.description.slice(0, 75) : "",
    ]);

    autoTable(doc, {
      startY: y,
      head: [[labels.category, labels.hotel, labels.price, labels.rating, labels.notes]],
      body: hotelRows,
      theme: "striped",
      headStyles: {
        fillColor: FOREST,
        textColor: WHITE,
        font,
        fontSize: 8.5,
        cellPadding: 2.8,
      },
      styles: {
        font,
        fontSize: 8,
        cellPadding: 2.6,
        textColor: CHARCOAL,
        overflow: "linebreak",
      },
      alternateRowStyles: { fillColor: SOFT_BG },
      columnStyles: {
        0: { cellWidth: 26 },
        1: { cellWidth: 42 },
        2: { cellWidth: 32 },
        3: { cellWidth: 20 },
        4: { cellWidth: 62 },
      },
      margin: { left: MARGIN_LEFT, right: MARGIN_LEFT },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── 5. Day-by-Day Itinerary ───────────────────────────────────────────────
  if (Array.isArray(trip.itinerary) && trip.itinerary.length > 0) {
    y = addSectionHeader(doc, labels.itinerary, y, font, 65);

    for (const day of trip.itinerary) {
      // Check if there is enough space for day ribbon + at least 2 rows
      if (y + 58 > CONTENT_BOTTOM) {
        doc.addPage();
        y = 22;
        drawRunningHeader(doc, trip.destination || "Trip Itinerary", font);
      }

      // Day Header Ribbon
      doc.setFillColor(...EMERALD);
      doc.roundedRect(MARGIN_LEFT, y, CONTENT_WIDTH, 7.5, 1.5, 1.5, "F");

      doc.setFont(font, "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...WHITE);

      const dayTitle = `${labels.day} ${day.day}${day.date ? `  ―  ${day.date}` : ""}`;
      const costBadge = day.daily_cost ? `   |   ${labels.estCost}: ${formatCurrencyStr(day.daily_cost, trip.currency)}` : "";
      const weatherBadge = day.weather ? `   |   ${day.weather.temp}°C ${day.weather.condition || ""}` : "";

      doc.text(`${dayTitle}${costBadge}${weatherBadge}`, MARGIN_LEFT + 4, y + 5.2);
      y += 10;

      // Slot Data
      const slots = day.slots || {};
      const slotRows = [
        [labels.morning, slots.morning?.place || "―", slots.morning?.activity || "―", slots.morning?.transport || "―"],
        [labels.afternoon, slots.afternoon?.place || "―", slots.afternoon?.activity || "―", slots.afternoon?.transport || "―"],
        [labels.evening, slots.evening?.place || "―", slots.evening?.activity || "―", slots.evening?.transport || "―"],
        [labels.night, slots.night?.place || "―", slots.night?.activity || "―", slots.night?.transport || "―"],
      ];

      autoTable(doc, {
        startY: y,
        head: [[labels.time, labels.location, labels.activity, labels.transport]],
        body: slotRows,
        theme: "striped",
        headStyles: {
          fillColor: FOREST,
          textColor: WHITE,
          font,
          fontSize: 8,
          cellPadding: 2.6,
        },
        styles: {
          font,
          fontSize: 8,
          cellPadding: 2.8,
          textColor: CHARCOAL,
          overflow: "linebreak",
        },
        alternateRowStyles: { fillColor: SOFT_BG },
        columnStyles: {
          0: { cellWidth: 24 }, // Time
          1: { cellWidth: 42 }, // Location
          2: { cellWidth: 84 }, // Activity (largest column)
          3: { cellWidth: 32 }, // Transport
        },
        margin: { left: MARGIN_LEFT, right: MARGIN_LEFT },
      });

      y = (doc as any).lastAutoTable.finalY + 7;
    }
  }

  // ── 6. Packing & Clothing Guide ───────────────────────────────────────────
  if (Array.isArray(trip.clothing) && trip.clothing.length > 0) {
    y = addSectionHeader(doc, labels.packing, y, font, 40);
    y = addBulletList(doc, trip.clothing, y, font, 8.5);
  }

  // Apply running footers to all pages with total page count
  applyRunningFooters(doc, font, labels);

  // Save the professional PDF
  const filename = `Wanderly_${safeName(trip.destination || "Trip")}_${lang.toUpperCase()}.pdf`;
  doc.save(filename);
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. CULTURAL & HERITAGE GUIDE PDF EXPORT
// ═════════════════════════════════════════════════════════════════════════════
export async function exportCulturalGuidePDF(
  culturalData: CulturalHeritageData,
  mode: "trip" | "place",
  language = "en",
  tripData?: any
): Promise<void> {
  if (!culturalData) return;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const lang = language.toLowerCase();
  const labels = getLabels(lang);
  const font = await embedFontForLanguage(doc, lang);

  const title = culturalData.overview?.title || labels.culturalOverview;
  const location = culturalData.overview?.location || (mode === "trip" ? tripData?.destination : "") || "";

  // ── Page 1 Hero Header Banner ─────────────────────────────────────────────
  doc.setFillColor(...FOREST);
  doc.rect(0, 0, PAGE_WIDTH, 48, "F");

  doc.setFillColor(...EMERALD);
  doc.rect(0, 48, PAGE_WIDTH, 3, "F");

  doc.setFont(font, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...WHITE);
  doc.text("WANDERLY  •  CULTURAL & HERITAGE DOSSIER", MARGIN_LEFT, 13);

  doc.setFontSize(15);
  doc.setTextColor(...WHITE);
  const titleLines = doc.splitTextToSize(title, CONTENT_WIDTH);
  doc.text(titleLines.slice(0, 2), MARGIN_LEFT, 25);

  doc.setFontSize(8.5);
  doc.setTextColor(200, 235, 220);
  const subMode = mode === "trip" ? labels.journeyStory : labels.heritageStory;
  doc.text(`${subMode}${location ? `   |   ${location}` : ""}`, MARGIN_LEFT, 41);

  let y = 60;

  // ── 1. Cultural Overview ──────────────────────────────────────────────────
  y = addSectionHeader(doc, labels.culturalOverview, y, font, 45);
  if (culturalData.overview?.historicalBackground) {
    y = addKeyValue(doc, `${labels.historicalBackground}:`, culturalData.overview.historicalBackground, y, font);
  }
  if (culturalData.overview?.culturalIdentity) {
    y = addKeyValue(doc, `${labels.culturalIdentity}:`, culturalData.overview.culturalIdentity, y, font);
  }
  if (culturalData.overview?.historicalPeriod) {
    y = addKeyValue(doc, `${labels.historicalPeriod}:`, culturalData.overview.historicalPeriod, y, font);
  }
  if (Array.isArray(culturalData.overview?.majorTraditions) && culturalData.overview.majorTraditions.length > 0) {
    y = addKeyValue(doc, `${labels.majorTraditions}:`, culturalData.overview.majorTraditions.join("  •  "), y, font);
  }
  y += 4;

  // ── 2. Journey / Heritage Narrative Story ─────────────────────────────────
  const story = culturalData.tripStory || culturalData.placeStory;
  if (story && story.trim().length > 0) {
    y = addSectionHeader(doc, mode === "trip" ? labels.journeyStory : labels.heritageStory, y, font, 50);

    doc.setFillColor(...CREAM);
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.3);

    const storyLines = doc.splitTextToSize(story.trim(), CONTENT_WIDTH - 8);
    const storyH = Math.min(storyLines.length * 4.6 + 8, 90);

    doc.roundedRect(MARGIN_LEFT, y, CONTENT_WIDTH, storyH, 2, 2, "FD");
    doc.setFont(font, "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...CHARCOAL);

    const maxLines = Math.floor((storyH - 8) / 4.6);
    doc.text(storyLines.slice(0, maxLines), MARGIN_LEFT + 4, y + 6);
    y += storyH + 6;
  }

  // ── 3. Heritage Places ────────────────────────────────────────────────────
  if (Array.isArray(culturalData.heritagePlaces) && culturalData.heritagePlaces.length > 0) {
    y = addSectionHeader(doc, `${labels.heritagePlaces} (${culturalData.heritagePlaces.length})`, y, font, 55);

    for (const place of culturalData.heritagePlaces) {
      if (y + 35 > CONTENT_BOTTOM) {
        doc.addPage();
        y = 22;
        drawRunningHeader(doc, title, font);
      }

      // Place banner
      doc.setFillColor(...SOFT_BG);
      doc.roundedRect(MARGIN_LEFT, y, CONTENT_WIDTH, 7, 1.5, 1.5, "F");

      doc.setFont(font, "normal");
      doc.setFontSize(9);
      doc.setTextColor(...FOREST);
      const placeHeading = `• ${place.name}${place.dayReference ? `   |   ${place.dayReference}` : ""}${place.historicalPeriod ? `   |   ${place.historicalPeriod}` : ""}`;
      doc.text(placeHeading, MARGIN_LEFT + 3, y + 5);
      y += 9.5;

      if (place.historicalBackground) {
        y = addParagraph(doc, place.historicalBackground, y, font, 8.5, CHARCOAL, 4);
      }
      if (place.historicalStory) {
        y = addParagraph(doc, `" ${place.historicalStory} "`, y, font, 8, SLATE, 6);
      }
      y += 2.5;
    }
  }

  // ── 4. Verified Historical Facts ──────────────────────────────────────────
  if (Array.isArray(culturalData.historicalFacts) && culturalData.historicalFacts.length > 0) {
    y = addSectionHeader(doc, labels.verifiedHistory, y, font, 45);

    for (const factItem of culturalData.historicalFacts) {
      if (y + 20 > CONTENT_BOTTOM) {
        doc.addPage();
        y = 22;
        drawRunningHeader(doc, title, font);
      }

      y = addParagraph(doc, `• ${factItem.fact}`, y, font, 8.5, CHARCOAL, 3);
      if (factItem.periodOrEra || factItem.sourceOrAuthority) {
        const metaStr = `[${labels.era}: ${factItem.periodOrEra || "―"}   |   ${labels.source}: ${factItem.sourceOrAuthority || "Historical Consensus"}]`;
        y = addParagraph(doc, metaStr, y, font, 7.5, SLATE, 6);
      }
      y += 1;
    }
  }

  // ── 5. Legends & Folklore ─────────────────────────────────────────────────
  if (Array.isArray(culturalData.legends) && culturalData.legends.length > 0) {
    y = addSectionHeader(doc, labels.legends, y, font, 45);

    for (const leg of culturalData.legends) {
      if (y + 26 > CONTENT_BOTTOM) {
        doc.addPage();
        y = 22;
        drawRunningHeader(doc, title, font);
      }

      doc.setFont(font, "normal");
      doc.setFontSize(9);
      doc.setTextColor(...FOREST);
      doc.text(`• ${leg.title}`, MARGIN_LEFT + 3, y);
      y += 5;

      y = addParagraph(doc, leg.story, y, font, 8.5, CHARCOAL, 5);
      if (leg.warningNote) {
        y = addParagraph(doc, `[!] ${leg.warningNote}`, y, font, 7.5, SLATE, 6);
      }
      y += 2;
    }
  }

  // ── 6. Historical Figures (Table) ─────────────────────────────────────────
  if (Array.isArray(culturalData.historicalFigures) && culturalData.historicalFigures.length > 0) {
    y = addSectionHeader(doc, labels.figures, y, font, 50);

    const figRows = culturalData.historicalFigures.map((f) => [
      f.name,
      f.role || "―",
      f.era || "―",
      f.significance ? f.significance.slice(0, 95) : "",
    ]);

    autoTable(doc, {
      startY: y,
      head: [[labels.figures, labels.role, labels.era, labels.significance]],
      body: figRows,
      theme: "striped",
      headStyles: {
        fillColor: FOREST,
        textColor: WHITE,
        font,
        fontSize: 8,
        cellPadding: 2.6,
      },
      styles: {
        font,
        fontSize: 8,
        cellPadding: 2.8,
        textColor: CHARCOAL,
        overflow: "linebreak",
      },
      alternateRowStyles: { fillColor: SOFT_BG },
      columnStyles: {
        0: { cellWidth: 36 },
        1: { cellWidth: 32 },
        2: { cellWidth: 28 },
        3: { cellWidth: 86 },
      },
      margin: { left: MARGIN_LEFT, right: MARGIN_LEFT },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── 7. Local Culture ──────────────────────────────────────────────────────
  if (culturalData.localCulture) {
    const lc = culturalData.localCulture;
    y = addSectionHeader(doc, labels.localCulture, y, font, 40);

    if (Array.isArray(lc.traditions) && lc.traditions.length > 0) {
      y = addKeyValue(doc, `${labels.traditions || "Traditions"}:`, lc.traditions.join("  •  "), y, font);
    }
    if (Array.isArray(lc.musicAndDance) && lc.musicAndDance.length > 0) {
      y = addKeyValue(doc, `${labels.musicAndDance || "Music & Dance"}:`, lc.musicAndDance.join("  •  "), y, font);
    }
    if (Array.isArray(lc.artAndHandicrafts) && lc.artAndHandicrafts.length > 0) {
      y = addKeyValue(doc, `${labels.artsAndCrafts || "Art & Handicrafts"}:`, lc.artAndHandicrafts.join("  •  "), y, font);
    }
    if (Array.isArray(lc.clothingAndAttire) && lc.clothingAndAttire.length > 0) {
      y = addKeyValue(doc, `${labels.clothing || "Traditional Attire"}:`, lc.clothingAndAttire.join("  •  "), y, font);
    }
    y += 4;
  }

  // ── 8. Culinary Heritage (Table) ──────────────────────────────────────────
  if (Array.isArray(culturalData.culinaryHeritage) && culturalData.culinaryHeritage.length > 0) {
    y = addSectionHeader(doc, labels.culinaryHeritage, y, font, 50);

    const dishRows = culturalData.culinaryHeritage.map((d) => [
      d.name,
      d.description ? d.description.slice(0, 90) : "",
      d.culturalOrigin || "―",
      d.isMustTry ? "[★]" : "",
    ]);

    autoTable(doc, {
      startY: y,
      head: [[labels.dish || "Dish", labels.description || labels.notes || "Description", labels.origin || "Origin", labels.mustTry || "Must Try"]],
      body: dishRows,
      theme: "striped",
      headStyles: {
        fillColor: FOREST,
        textColor: WHITE,
        font,
        fontSize: 8,
        cellPadding: 2.6,
      },
      styles: {
        font,
        fontSize: 8,
        cellPadding: 2.8,
        textColor: CHARCOAL,
        overflow: "linebreak",
      },
      alternateRowStyles: { fillColor: SOFT_BG },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 90 },
        2: { cellWidth: 34 },
        3: { cellWidth: 16 },
      },
      margin: { left: MARGIN_LEFT, right: MARGIN_LEFT },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── 9. Cultural Festivals (Table) ─────────────────────────────────────────
  if (Array.isArray(culturalData.festivals) && culturalData.festivals.length > 0) {
    y = addSectionHeader(doc, labels.festivals, y, font, 50);

    const festRows = culturalData.festivals.map((f) => [
      f.name,
      f.timing || "―",
      f.celebrationStyle ? f.celebrationStyle.slice(0, 95) : "",
    ]);

    autoTable(doc, {
      startY: y,
      head: [[labels.festivals, labels.timing || labels.time || "Timing", labels.celebration || "Celebration Style"]],
      body: festRows,
      theme: "striped",
      headStyles: {
        fillColor: FOREST,
        textColor: WHITE,
        font,
        fontSize: 8,
        cellPadding: 2.6,
      },
      styles: {
        font,
        fontSize: 8,
        cellPadding: 2.8,
        textColor: CHARCOAL,
        overflow: "linebreak",
      },
      alternateRowStyles: { fillColor: SOFT_BG },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 35 },
        2: { cellWidth: 102 },
      },
      margin: { left: MARGIN_LEFT, right: MARGIN_LEFT },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── 10. Local Phrases (Table) ─────────────────────────────────────────────
  if (Array.isArray(culturalData.localPhrases) && culturalData.localPhrases.length > 0) {
    y = addSectionHeader(doc, labels.localPhrases, y, font, 50);

    const phraseRows = culturalData.localPhrases.map((p) => [
      p.phrase,
      p.englishMeaning,
      p.pronunciation || "―",
      p.context || "―",
    ]);

    autoTable(doc, {
      startY: y,
      head: [[labels.phrase, labels.meaning, labels.pronunciation, labels.context]],
      body: phraseRows,
      theme: "striped",
      headStyles: {
        fillColor: FOREST,
        textColor: WHITE,
        font,
        fontSize: 8,
        cellPadding: 2.6,
      },
      styles: {
        font,
        fontSize: 8,
        cellPadding: 2.8,
        textColor: CHARCOAL,
        overflow: "linebreak",
      },
      alternateRowStyles: { fillColor: SOFT_BG },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 48 },
        2: { cellWidth: 42 },
        3: { cellWidth: 50 },
      },
      margin: { left: MARGIN_LEFT, right: MARGIN_LEFT },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── 11. Cultural Etiquette ────────────────────────────────────────────────
  if (culturalData.culturalEtiquette) {
    const et = culturalData.culturalEtiquette;
    y = addSectionHeader(doc, labels.culturalEtiquette, y, font, 45);

    if (Array.isArray(et.dos) && et.dos.length > 0) {
      doc.setFont(font, "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(22, 100, 50);
      doc.text(`[OK] ${labels.dos}:`, MARGIN_LEFT + 3, y);
      y += 5;
      y = addBulletList(doc, et.dos, y, font, 8, [22, 100, 50]);
    }

    if (Array.isArray(et.donts) && et.donts.length > 0) {
      doc.setFont(font, "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...ERROR_RED);
      doc.text(`[X] ${labels.donts}:`, MARGIN_LEFT + 3, y);
      y += 5;
      y = addBulletList(doc, et.donts, y, font, 8, ERROR_RED);
    }

    if (et.attireGuidance) {
      y = addParagraph(doc, `${labels.attire || "Attire"}: ${et.attireGuidance}`, y, font, 8.5, CHARCOAL, 3);
    }
    if (et.photographyRules) {
      y = addParagraph(doc, `${labels.photography || "Photography"}: ${et.photographyRules}`, y, font, 8.5, CHARCOAL, 3);
    }
    y += 4;
  }

  // ── 12. Hidden Cultural Gems ──────────────────────────────────────────────
  if (Array.isArray(culturalData.hiddenGems) && culturalData.hiddenGems.length > 0) {
    y = addSectionHeader(doc, labels.hiddenGems, y, font, 45);

    for (const gem of culturalData.hiddenGems) {
      if (y + 24 > CONTENT_BOTTOM) {
        doc.addPage();
        y = 22;
        drawRunningHeader(doc, title, font);
      }

      doc.setFont(font, "normal");
      doc.setFontSize(9);
      doc.setTextColor(...FOREST);
      doc.text(`• ${gem.name}`, MARGIN_LEFT + 3, y);
      y += 5;

      if (gem.distanceOrLocation) {
        doc.setFontSize(8);
        doc.setTextColor(...SLATE);
        doc.text(gem.distanceOrLocation, MARGIN_LEFT + 6, y);
        y += 4.5;
      }

      y = addParagraph(doc, gem.whyVisit, y, font, 8.5, CHARCOAL, 6);
      y += 2;
    }
  }

  // ── 13. Trip Context Itinerary (for trip-mode cultural guides) ─────────────
  if (mode === "trip" && tripData && Array.isArray(tripData.itinerary)) {
    y = addSectionHeader(doc, labels.itinerary, y, font, 55);

    for (const day of tripData.itinerary) {
      if (y + 40 > CONTENT_BOTTOM) {
        doc.addPage();
        y = 22;
        drawRunningHeader(doc, title, font);
      }

      doc.setFillColor(...EMERALD);
      doc.roundedRect(MARGIN_LEFT, y, CONTENT_WIDTH, 6.5, 1.5, 1.5, "F");

      doc.setFont(font, "normal");
      doc.setFontSize(8);
      doc.setTextColor(...WHITE);
      doc.text(`${labels.day} ${day.day}${day.date ? `  ―  ${day.date}` : ""}`, MARGIN_LEFT + 4, y + 4.6);
      y += 8.5;

      const slots = day.slots || {};
      const slotRows = [
        [labels.morning, slots.morning?.place || "―", slots.morning?.activity || "―"],
        [labels.afternoon, slots.afternoon?.place || "―", slots.afternoon?.activity || "―"],
        [labels.evening, slots.evening?.place || "―", slots.evening?.activity || "―"],
        [labels.night, slots.night?.place || "―", slots.night?.activity || "―"],
      ];

      autoTable(doc, {
        startY: y,
        head: [[labels.time, labels.location, labels.activity]],
        body: slotRows,
        theme: "striped",
        headStyles: {
          fillColor: FOREST,
          textColor: WHITE,
          font,
          fontSize: 7.5,
          cellPadding: 2.4,
        },
        styles: {
          font,
          fontSize: 7.5,
          cellPadding: 2.4,
          textColor: CHARCOAL,
          overflow: "linebreak",
        },
        alternateRowStyles: { fillColor: SOFT_BG },
        columnStyles: {
          0: { cellWidth: 26 },
          1: { cellWidth: 46 },
          2: { cellWidth: 110 },
        },
        margin: { left: MARGIN_LEFT, right: MARGIN_LEFT },
      });

      y = (doc as any).lastAutoTable.finalY + 6;
    }
  }

  // Apply running footers to all pages
  applyRunningFooters(doc, font, labels);

  const locSlug = safeName(location || title || "Cultural_Guide");
  const filename = `Wanderly_${locSlug}_CulturalGuide_${lang.toUpperCase()}.pdf`;
  doc.save(filename);
}
