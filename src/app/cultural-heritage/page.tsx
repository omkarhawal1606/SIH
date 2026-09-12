"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/components/AuthProvider";
import { getUserTrips, type TripData } from "@/lib/db";
import {
  type CulturalHeritageData,
  type HeritagePlace,
  type CulturalChatMessage,
} from "@/lib/cultural";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import AudioPlayer from "@/components/AudioPlayer";
import SaveCulturalInfo from "@/components/SaveCulturalInfo";
import CulturalPDFExport from "@/components/CulturalPDFExport";
import {
  Landmark,
  Compass,
  Bookmark,
  MapPin,
  Calendar,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  Scroll,
  Crown,
  Utensils,
  Languages,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Send,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  Flame,
  Award,
  Users,
} from "lucide-react";

const SUGGESTED_PLACES = [
  "Panhala Fort",
  "Ajanta Caves",
  "Jaipur",
  "Hampi",
  "Varanasi",
  "Mysore Palace",
  "Konark Sun Temple",
  "Khajuraho",
];

const QUICK_QUESTIONS = [
  "Why is this fort important?",
  "Tell me the story of this temple.",
  "What food should I try?",
  "What festival is celebrated here?",
  "Why is this tradition important?",
  "What should I know before visiting?",
  "Tell me an interesting historical fact.",
];

function CulturalHeritageContent() {
  const searchParams = useSearchParams();
  const tripIdParam = searchParams.get("tripId");
  const { user, loading: authLoading } = useAuth();
  const { language, meta, t, speak, stopSpeech } = useTranslation();

  // Mode: "trip" | "place"
  const [activeMode, setActiveMode] = useState<"trip" | "place">("trip");

  // Trips data
  const [savedTrips, setSavedTrips] = useState<TripData[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripData | null>(null);

  // Place input
  const [placeQuery, setPlaceQuery] = useState("");

  // AI Generation State
  const [generating, setGenerating] = useState(false);
  const [loadingExtended, setLoadingExtended] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [culturalData, setCulturalData] = useState<CulturalHeritageData | null>(null);
  const [monumentAudio, setMonumentAudio] = useState<{ text: string; title: string } | null>(null);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState<CulturalChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatAbortRef = useRef<AbortController | null>(null);

  // Expanded Heritage Stories
  const [expandedStoryIndex, setExpandedStoryIndex] = useState<number | null>(0);

  // 1. Fetch saved trips if user is logged in
  useEffect(() => {
    if (!user) return;
    setLoadingTrips(true);
    getUserTrips(user.uid)
      .then((trips) => {
        setSavedTrips(trips);
        if (tripIdParam) {
          const match = trips.find((t) => t.id === tripIdParam);
          if (match) {
            setSelectedTrip(match);
            setActiveMode("trip");
            generateTripCulture(match);
          }
        }
      })
      .catch((err) => console.error("Error loading trips:", err))
      .finally(() => setLoadingTrips(false));
  }, [user, tripIdParam]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  // Generate for Saved Trip with active language and progressive loading
  const generateTripCulture = async (tripToProcess: TripData) => {
    if (generating) return;
    setError(null);
    setCulturalData(null);
    setChatMessages([]);
    setGenerating(true);
    setLoadingMessage(t("culturalHeritage.readingJourney"));

    try {
      // Phase 1: Fetch Core Dossier for immediate rendering
      const res = await fetch("/api/cultural-heritage/trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip: tripToProcess, language, section: "core" }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || t("common.error"));
      }

      setCulturalData(json.data);
      setGenerating(false);

      // Phase 2: Fetch Extended Section in background
      setLoadingExtended(true);
      fetch("/api/cultural-heritage/trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip: tripToProcess, language, section: "extended" }),
      })
        .then((r) => r.json())
        .then((extJson) => {
          if (extJson.success && extJson.data) {
            setCulturalData((prev) => (prev ? { ...prev, ...extJson.data } : prev));
          }
        })
        .catch((e) => console.warn("Extended trip culture fetch warning:", e))
        .finally(() => setLoadingExtended(false));
    } catch (err: any) {
      console.error(err);
      setError(err.message || t("common.error"));
      setGenerating(false);
    }
  };

  // Generate for Place with active language and progressive loading
  const generatePlaceCulture = async (placeName: string) => {
    if (!placeName || placeName.trim().length === 0 || generating) return;
    setError(null);
    setCulturalData(null);
    setChatMessages([]);
    setGenerating(true);
    setLoadingMessage(t("culturalHeritage.discoveringHistory"));

    try {
      // Phase 1: Fetch Core Dossier for immediate rendering
      const res = await fetch("/api/cultural-heritage/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place: placeName.trim(), language, section: "core" }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || t("common.error"));
      }

      setCulturalData(json.data);
      setGenerating(false);

      // Phase 2: Fetch Extended Section in background
      setLoadingExtended(true);
      fetch("/api/cultural-heritage/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place: placeName.trim(), language, section: "extended" }),
      })
        .then((r) => r.json())
        .then((extJson) => {
          if (extJson.success && extJson.data) {
            setCulturalData((prev) => (prev ? { ...prev, ...extJson.data } : prev));
          }
        })
        .catch((e) => console.warn("Extended place culture fetch warning:", e))
        .finally(() => setLoadingExtended(false));
    } catch (err: any) {
      console.error(err);
      setError(err.message || t("common.error"));
      setGenerating(false);
    }
  };

  // Ask Cultural Guide Chat with active language
  const handleSendChat = async (questionText?: string) => {
    const text = questionText || chatInput;
    if (!text || text.trim().length === 0 || chatLoading) return;

    if (chatAbortRef.current) {
      chatAbortRef.current.abort();
    }
    const controller = new AbortController();
    chatAbortRef.current = controller;

    const userMsg: CulturalChatMessage = { role: "user", content: text.trim() };
    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages([...updatedHistory, { role: "model", content: "" }]);
    setChatInput("");
    setChatLoading(true);

    let streamText = "";

    try {
      const res = await fetch("/api/cultural-heritage/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          mode: activeMode,
          context: {
            title: culturalData?.overview?.title,
            location: culturalData?.overview?.location,
            historicalBackground: culturalData?.overview?.historicalBackground,
            culturalIdentity: culturalData?.overview?.culturalIdentity,
            places: culturalData?.heritagePlaces?.map((p) => p.name) || [],
            figures: culturalData?.historicalFigures?.map((f) => f.name) || [],
          },
          messages: updatedHistory,
          question: text.trim(),
          language,
          stream: true,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Cultural guide is unavailable.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        streamText += decoder.decode(value, { stream: true });
        setChatMessages([...updatedHistory, { role: "model", content: streamText }]);
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;

      // If we already received partial content before the connection dropped,
      // preserve it — the user sees what was received rather than losing everything.
      if (streamText.trim().length > 0) {
        setChatMessages([...updatedHistory, { role: "model", content: streamText }]);
      } else {
        setChatMessages([
          ...updatedHistory,
          {
            role: "model",
            content:
              "I apologize, I could not retrieve this cultural insight right now. Please ask again or select another question.",
          },
        ]);
      }
    } finally {
      setChatLoading(false);
      chatAbortRef.current = null;
    }
  };

  const primaryStory = culturalData?.tripStory || culturalData?.placeStory || "";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--cream)]">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 sm:px-6">
        {/* Top Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--sage)] border border-[var(--light-sage)] text-[var(--forest)] text-xs font-bold uppercase tracking-wider">
              <Landmark className="w-4 h-4 text-[var(--forest)]" />
              {t("culturalHeritage.badge")}
            </div>
            <Link
              href="/saved-cultural-info"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[var(--light-sage)] text-[var(--forest)] text-xs font-bold hover:bg-[var(--sage)] hover:border-[var(--forest)] transition-all shadow-xs"
            >
              <Bookmark className="w-3.5 h-3.5 text-[var(--forest)]" />
              <span>Saved Cultural Guides</span>
            </Link>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--charcoal)] tracking-tight">
            {t("culturalHeritage.title")}
          </h1>
          <p className="text-base sm:text-lg text-[var(--slate)] mt-3">
            &ldquo;{t("culturalHeritage.subtitle")}&rdquo;
          </p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Card 1: Explore My Saved Trip */}
          <div
            onClick={() => {
              setActiveMode("trip");
              setError(null);
            }}
            className={`cursor-pointer rounded-2xl p-6 border-2 transition-all flex flex-col justify-between ${
              activeMode === "trip"
                ? "bg-white border-[var(--forest)] shadow-lg ring-2 ring-[var(--forest)]/10"
                : "bg-white/80 border-[var(--light-sage)] hover:border-[var(--sage-dark)] hover:shadow-md"
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[var(--sage)] flex items-center justify-center text-2xl mb-4">
                🧳
              </div>
              <h2 className="text-xl font-bold text-[var(--charcoal)] flex items-center gap-2">
                {t("culturalHeritage.exploreSavedTrip")}
                {activeMode === "trip" && (
                  <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-[var(--forest)] text-white">
                    {t("common.active")}
                  </span>
                )}
              </h2>
              <p className="text-sm text-[var(--slate)] mt-2 leading-relaxed">
                {t("culturalHeritage.savedTripDesc")}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--light-sage)]/60 flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--forest)]">
                {user ? `${savedTrips.length} ${t("dashboard.totalTrips")}` : "Requires Sign In"}
              </span>
              <span className="text-sm font-extrabold text-[var(--forest)] flex items-center gap-1 group">
                {t("culturalHeritage.exploreSavedTripBtn")} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>

          {/* Card 2: Explore a Place */}
          <div
            onClick={() => {
              setActiveMode("place");
              setError(null);
            }}
            className={`cursor-pointer rounded-2xl p-6 border-2 transition-all flex flex-col justify-between ${
              activeMode === "place"
                ? "bg-white border-[var(--forest)] shadow-lg ring-2 ring-[var(--forest)]/10"
                : "bg-white/80 border-[var(--light-sage)] hover:border-[var(--sage-dark)] hover:shadow-md"
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[var(--warning-bg)] border border-[var(--sand)] flex items-center justify-center text-2xl mb-4">
                📍
              </div>
              <h2 className="text-xl font-bold text-[var(--charcoal)] flex items-center gap-2">
                {t("culturalHeritage.explorePlace")}
                {activeMode === "place" && (
                  <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-[var(--forest)] text-white">
                    {t("common.active")}
                  </span>
                )}
              </h2>
              <p className="text-sm text-[var(--slate)] mt-2 leading-relaxed">
                {t("culturalHeritage.explorePlaceDesc")}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--light-sage)]/60 flex items-center justify-between">
              <span className="text-xs font-bold text-[#7A5C00]">
                {t("culturalHeritage.explorePlaceBtn")}
              </span>
              <span className="text-sm font-extrabold text-[var(--forest)] flex items-center gap-1 group">
                {t("culturalHeritage.explorePlaceBtn")} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Controls based on selected mode */}
        {activeMode === "trip" ? (
          <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 mb-10 shadow-xs">
            <h2 className="text-lg font-bold text-[var(--charcoal)] mb-2 flex items-center gap-2">
              <span>🧳</span> {t("culturalHeritage.selectSavedTrip")}
            </h2>
            <p className="text-xs text-[var(--slate)] mb-4">
              {t("culturalHeritage.selectSavedTripDesc")}
            </p>

            {authLoading || loadingTrips ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--forest)]" />
              </div>
            ) : !user ? (
              <div className="bg-[var(--cream)] rounded-xl p-6 text-center border border-[var(--light-sage)]">
                <p className="text-sm text-[var(--charcoal)] font-medium mb-3">
                  Please sign in to access your saved journeys and their cultural stories.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link href="/login" className="btn-primary text-xs py-2 px-4">
                    Sign In
                  </Link>
                  <button
                    onClick={() => setActiveMode("place")}
                    className="text-xs font-bold text-[var(--forest)] hover:underline"
                  >
                    Or Explore Any Place Instead →
                  </button>
                </div>
              </div>
            ) : savedTrips.length === 0 ? (
              <div className="bg-[var(--cream)] rounded-xl p-6 text-center border border-[var(--light-sage)]">
                <p className="text-sm text-[var(--charcoal)] font-medium mb-2">
                  You don&apos;t have any saved trips yet.
                </p>
                <p className="text-xs text-[var(--slate)] mb-4">
                  Create your first trip or try exploring any place directly.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link href="/plan" className="btn-primary text-xs py-2 px-4">
                    <Compass className="w-3.5 h-3.5" /> Plan a Trip
                  </Link>
                  <button
                    onClick={() => setActiveMode("place")}
                    className="text-xs font-bold text-[var(--forest)] hover:underline"
                  >
                    Explore a Place →
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedTrips.map((trip) => {
                  const isSelected = selectedTrip?.id === trip.id;
                  return (
                    <div
                      key={trip.id}
                      onClick={() => {
                        setSelectedTrip(trip);
                        generateTripCulture(trip);
                      }}
                      className={`cursor-pointer rounded-xl p-4 border transition-all ${
                        isSelected
                          ? "bg-[var(--sage)] border-[var(--forest)] ring-1 ring-[var(--forest)]"
                          : "bg-white border-[var(--light-sage)] hover:border-[var(--sage-dark)] hover:bg-[var(--cream)]/60"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-sm text-[var(--charcoal)] truncate">
                          {trip.destination}
                        </h3>
                        <span className="text-[11px] font-bold bg-white text-[var(--forest)] border border-[var(--light-sage)] px-2 py-0.5 rounded-full">
                          {trip.days}d
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-[var(--slate)]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[var(--slate)]" />
                          {trip.startDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-[var(--slate)]" />
                          {trip.people} {trip.people === 1 ? "Traveler" : "Travelers"}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[11px] text-[var(--forest)] font-bold">
                          {isSelected ? "Selected ✓" : "Click to Explore →"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 mb-10 shadow-xs">
            <h2 className="text-lg font-bold text-[var(--charcoal)] mb-2 flex items-center gap-2">
              <span>📍</span> {t("culturalHeritage.searchPlacePrompt")}
            </h2>
            <p className="text-xs text-[var(--slate)] mb-4">
              {t("culturalHeritage.explorePlaceDesc")}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                generatePlaceCulture(placeQuery);
              }}
              className="flex flex-col sm:flex-row gap-2.5 max-w-2xl"
            >
              <div className="relative flex-1">
                <MapPin className="w-4 h-4 text-[var(--slate)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={placeQuery}
                  onChange={(e) => setPlaceQuery(e.target.value)}
                  placeholder={t("culturalHeritage.searchPlaceholder")}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--light-sage)] focus:border-[var(--forest)] focus:outline-none text-sm text-[var(--charcoal)] bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={generating || !placeQuery.trim()}
                className="btn-primary py-2.5 px-6 text-sm shrink-0 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-[var(--sand)]" />
                )}
                {t("culturalHeritage.exploreBtn")}
              </button>
            </form>

            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[var(--slate)] font-semibold">{t("culturalHeritage.suggestions")}</span>
              {SUGGESTED_PLACES.map((place) => (
                <button
                  key={place}
                  type="button"
                  onClick={() => {
                    setPlaceQuery(place);
                    generatePlaceCulture(place);
                  }}
                  className="text-xs bg-[var(--cream)] border border-[var(--light-sage)] hover:border-[var(--forest)] text-[var(--charcoal)] px-3 py-1 rounded-full font-medium transition-all"
                >
                  {place}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {generating && (
          <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-12 text-center my-8 animate-fade-in shadow-xs">
            <div className="w-16 h-16 bg-[var(--sage)] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Landmark className="w-8 h-8 text-[var(--forest)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--charcoal)]">{loadingMessage}</h3>
            <p className="text-xs text-[var(--slate)] mt-2">
              Gemini Cultural AI is cross-referencing verified history, oral folklore, and heritage archives...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !generating && (
          <div className="bg-[var(--error-bg)] border border-[var(--error)]/30 rounded-2xl p-6 my-8 text-center">
            <AlertTriangle className="w-8 h-8 text-[var(--error)] mx-auto mb-2" />
            <p className="text-sm font-bold text-[var(--error)]">{error}</p>
            <button
              onClick={() => {
                if (activeMode === "trip" && selectedTrip) {
                  generateTripCulture(selectedTrip);
                } else if (placeQuery) {
                  generatePlaceCulture(placeQuery);
                }
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-white text-xs font-bold text-[var(--error)] border border-[var(--error)]/40 rounded-xl hover:bg-white/80"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Try Again
            </button>
          </div>
        )}

        {/* CULTURAL RESULTS DOSSIER */}
        {culturalData && !generating && (
          <div className="space-y-8 animate-fade-in">
            {/* Overview Banner */}
            <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-[var(--sage)]/40 rounded-full blur-3xl -z-0 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-extrabold uppercase tracking-wider bg-[var(--forest)] text-white px-3 py-1 rounded-full">
                      {culturalData.overview.historicalPeriod || "Historical Era"}
                    </span>
                    <span className="text-xs font-bold text-[var(--forest)] bg-[var(--sage)] border border-[var(--light-sage)] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                      <Volume2 className="w-3.5 h-3.5" /> 12-Language Voice Available
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <SaveCulturalInfo
                      culturalData={culturalData}
                      mode={activeMode}
                      language={language}
                      place={
                        activeMode === "trip"
                          ? selectedTrip?.destination || culturalData.overview?.location || "Trip"
                          : placeQuery || culturalData.overview?.location || "Place"
                      }
                      tripId={activeMode === "trip" ? selectedTrip?.id : undefined}
                    />
                    <CulturalPDFExport
                      culturalData={culturalData}
                      mode={activeMode}
                      language={activeMode === "trip" && selectedTrip ? (selectedTrip.planningLanguage || selectedTrip.language || language) : language}
                      globalLanguage={language}
                      tripData={activeMode === "trip" ? selectedTrip : undefined}
                    />
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--charcoal)] tracking-tight">
                  {culturalData.overview.title}
                </h2>
                <p className="text-xs font-semibold text-[var(--forest)] mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {culturalData.overview.location}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--slate)] mb-1.5">
                      Historical Background
                    </h3>
                    <p className="text-sm text-[var(--charcoal)] leading-relaxed">
                      {culturalData.overview.historicalBackground}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--slate)] mb-1.5">
                      Cultural Significance & Identity
                    </h3>
                    <p className="text-sm text-[var(--charcoal)] leading-relaxed">
                      {culturalData.overview.culturalIdentity} {culturalData.overview.culturalSignificance}
                    </p>
                  </div>
                </div>

                {culturalData.overview.majorTraditions?.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-[var(--light-sage)]/60 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-[var(--slate)] font-bold">Key Traditions:</span>
                    {culturalData.overview.majorTraditions.map((trad, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-[var(--cream)] border border-[var(--light-sage)] text-[var(--charcoal)] px-2.5 py-1 rounded-lg font-medium"
                      >
                        {trad}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Continuous Story Section: "Tell Me the Story of My Trip" / "The Story" */}
            {primaryStory && (
              <div className="bg-gradient-to-br from-[#164E3D]/5 via-[#2F8F6B]/5 to-[#E8C98A]/15 border-2 border-[var(--forest)]/20 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[var(--forest)] text-white flex items-center justify-center shadow-xs">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-[var(--charcoal)]">
                      {activeMode === "trip"
                        ? "🎧 Tell Me the Story of My Trip"
                        : "🏰 The Story of this Heritage"}
                    </h3>
                    <p className="text-xs text-[var(--slate)]">
                      {activeMode === "trip"
                        ? "A continuous narrative woven through your scheduled journey"
                        : "An immersive narrative of the souls and events that shaped this place"}
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm border border-[var(--light-sage)]/80 rounded-xl p-5 sm:p-6 text-sm sm:text-base leading-relaxed text-[var(--charcoal)] whitespace-pre-line font-serif">
                  {primaryStory}
                </div>

                {/* Multilingual Audio Player */}
                <AudioPlayer text={primaryStory} title={culturalData.overview.title} />
              </div>
            )}

            {/* Heritage Places From Your Trip / Precincts */}
            {culturalData.heritagePlaces?.length > 0 && (
              <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-[var(--charcoal)] flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-[var(--forest)]" />
                      {activeMode === "trip"
                        ? "Heritage Places From Your Trip"
                        : "Key Monuments & Heritage Sites"}
                    </h3>
                    <p className="text-xs text-[var(--slate)] mt-1">
                      {activeMode === "trip"
                        ? "Key cultural spots matched directly from your itinerary"
                        : "Prominent landmarks and monuments explored in detail"}
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-[var(--forest)] bg-[var(--sage)] px-3 py-1 rounded-full border border-[var(--light-sage)]">
                    {culturalData.heritagePlaces.length} Place(s)
                  </span>
                </div>

                <div className="space-y-4">
                  {culturalData.heritagePlaces.map((place: HeritagePlace, idx: number) => {
                    const isExpanded = expandedStoryIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="border border-[var(--light-sage)] rounded-xl overflow-hidden transition-all hover:border-[var(--sage-dark)]"
                      >
                        <div
                          onClick={() => setExpandedStoryIndex(isExpanded ? null : idx)}
                          className="p-4 bg-[var(--cream)]/40 hover:bg-[var(--cream)] cursor-pointer flex items-center justify-between gap-4 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-[var(--sage)] flex items-center justify-center text-xs font-bold text-[var(--forest)] shrink-0">
                              {idx + 1}
                            </div>
                            <div className="truncate">
                              <h4 className="font-bold text-sm text-[var(--charcoal)] truncate">
                                {place.name}
                              </h4>
                              <p className="text-xs text-[var(--slate)]">
                                {place.dayReference && (
                                  <span className="font-semibold text-[var(--forest)] mr-2">
                                    📅 {place.dayReference}
                                  </span>
                                )}
                                {place.historicalPeriod && `Era: ${place.historicalPeriod}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMonumentAudio({
                                  text: place.historicalStory || place.historicalBackground,
                                  title: place.name,
                                });
                                setExpandedStoryIndex(idx);
                              }}
                              className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                                monumentAudio?.title === place.name
                                  ? "bg-[var(--forest)] text-white border-[var(--forest)]"
                                  : "bg-white border-[var(--light-sage)] text-[var(--forest)] hover:bg-[var(--sage)]"
                              }`}
                              title="Listen to story"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Listen</span>
                            </button>

                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                `${place.name} ${culturalData.overview.location}`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-lg bg-white border border-[var(--light-sage)] text-[var(--slate)] hover:text-[var(--charcoal)] hover:bg-[var(--sage)] text-xs flex items-center gap-1"
                              title="View on Google Maps"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Map</span>
                            </a>

                            <div className="text-[var(--slate)]">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-5 bg-white border-t border-[var(--light-sage)] space-y-4 animate-fade-in text-xs sm:text-sm">
                            {/* Monument Voice Narration */}
                            {monumentAudio?.title === place.name && (
                              <AudioPlayer
                                text={monumentAudio.text}
                                title={monumentAudio.title}
                                className="mb-2"
                              />
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h5 className="font-bold text-[var(--slate)] uppercase text-[11px] mb-1">
                                  Historical Background
                                </h5>
                                <p className="text-[var(--charcoal)] leading-relaxed">
                                  {place.historicalBackground}
                                </p>
                              </div>
                              <div>
                                <h5 className="font-bold text-[var(--slate)] uppercase text-[11px] mb-1">
                                  Cultural Significance
                                </h5>
                                <p className="text-[var(--charcoal)] leading-relaxed">
                                  {place.culturalSignificance}
                                </p>
                              </div>
                            </div>

                            {place.historicalStory && (
                              <div className="p-4 bg-[var(--cream)] rounded-xl border border-[var(--light-sage)]">
                                <h5 className="font-bold text-[var(--forest)] flex items-center gap-1.5 text-xs mb-1.5">
                                  <BookOpen className="w-3.5 h-3.5" /> The Story of {place.name}
                                </h5>
                                <p className="text-[var(--charcoal)] italic font-serif leading-relaxed">
                                  &ldquo;{place.historicalStory}&rdquo;
                                </p>
                              </div>
                            )}

                            {place.interestingFacts?.length > 0 && (
                              <div>
                                <h5 className="font-bold text-[var(--slate)] uppercase text-[11px] mb-1.5">
                                  Interesting Facts
                                </h5>
                                <ul className="list-disc list-inside space-y-1 text-[var(--charcoal)]">
                                  {place.interestingFacts.map((fact, fIdx) => (
                                    <li key={fIdx}>{fact}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Factual Accuracy: Verified History vs Legends & Folklore */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 📜 Verified History */}
              <div className="bg-white border border-[var(--forest)]/30 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--sage)] flex items-center justify-center text-[var(--forest)]">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[var(--charcoal)]">
                        📜 Verified History
                      </h3>
                      <p className="text-[11px] text-[var(--forest)] font-semibold">
                        Historical consensus & archaeological records
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    {culturalData.historicalFacts?.map((factItem, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[var(--cream)]/60 border border-[var(--light-sage)] text-xs"
                      >
                        <p className="text-[var(--charcoal)] leading-relaxed font-medium">
                          {factItem.fact}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-[var(--light-sage)]/50 text-[10px] text-[var(--slate)]">
                          <span>Era: {factItem.periodOrEra || "Ancient/Medieval"}</span>
                          {factItem.sourceOrAuthority && (
                            <span className="font-semibold text-[var(--forest)]">
                              🏛️ {factItem.sourceOrAuthority}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ✨ Legends & Folklore */}
              <div className="bg-white border border-[var(--sand)] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--warning-bg)] border border-[var(--sand)] flex items-center justify-center text-[#7A5C00]">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[var(--charcoal)]">
                        ✨ Legends & Folklore
                      </h3>
                      <p className="text-[11px] text-[#7A5C00] font-semibold">
                        Local mythology & oral tradition
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    {culturalData.legends?.map((leg, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#FFFDF5] border border-[var(--sand)]/40 text-xs"
                      >
                        <h4 className="font-bold text-[var(--charcoal)] flex items-center gap-1.5 mb-1">
                          <Flame className="w-3.5 h-3.5 text-[#D4A84B]" /> {leg.title}
                        </h4>
                        <p className="text-[var(--charcoal)] italic font-serif leading-relaxed mb-2">
                          &ldquo;{leg.story}&rdquo;
                        </p>
                        <p className="text-[11px] text-[var(--slate)]">
                          <strong className="text-[var(--charcoal)]">Meaning:</strong> {leg.culturalMeaning}
                        </p>
                        {leg.warningNote && (
                          <div className="mt-2 text-[10px] text-[#7A5C00] bg-[var(--warning-bg)] px-2 py-1 rounded font-medium">
                            ⚠️ {leg.warningNote}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Historical Figures */}
            {culturalData.historicalFigures?.length > 0 && (
              <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 sm:p-8 shadow-xs">
                <h3 className="text-xl font-bold text-[var(--charcoal)] flex items-center gap-2 mb-4">
                  <Crown className="w-5 h-5 text-[#C49A2A]" /> Prominent Historical Figures
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {culturalData.historicalFigures.map((fig, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[var(--cream)]/50 border border-[var(--light-sage)] text-xs"
                    >
                      <h4 className="font-bold text-sm text-[var(--charcoal)]">{fig.name}</h4>
                      <p className="text-[var(--forest)] font-semibold text-[11px] mt-0.5">{fig.role}</p>
                      <p className="text-[var(--slate)] text-[10px] mt-0.5">Era: {fig.era}</p>
                      <p className="text-[var(--charcoal)] mt-2 leading-relaxed">{fig.significance}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progressive Loading Indicator for Extended Sections */}
            {loadingExtended && (
              <div className="bg-white/80 border border-dashed border-[var(--light-sage)] rounded-2xl p-6 sm:p-8 animate-pulse space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-[var(--forest)] animate-spin" />
                    <span className="text-xs font-bold text-[var(--forest)]">
                      Exploring local delicacies, festivals, customs & etiquette...
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full bg-[var(--sage)] text-[var(--forest)]">
                    Progressive AI Loading
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="h-28 bg-[var(--cream)] rounded-xl" />
                  <div className="h-28 bg-[var(--cream)] rounded-xl" />
                </div>
              </div>
            )}

            {/* Culinary Heritage & Festivals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Culinary Heritage */}
              <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 shadow-xs">
                <h3 className="text-lg font-bold text-[var(--charcoal)] flex items-center gap-2 mb-4">
                  <Utensils className="w-5 h-5 text-[var(--forest)]" /> 🍛 Culinary Heritage
                </h3>
                <div className="space-y-3">
                  {culturalData.culinaryHeritage?.map((dish, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-[var(--light-sage)] bg-[var(--cream)]/40 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-sm text-[var(--charcoal)]">{dish.name}</h4>
                        {dish.isMustTry && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[var(--forest)] text-white">
                            Must Try
                          </span>
                        )}
                      </div>
                      <p className="text-[var(--charcoal)] leading-relaxed">{dish.description}</p>
                      <p className="text-[11px] text-[var(--slate)] mt-1.5 font-medium">
                        <span className="text-[var(--forest)] font-bold">Cultural Origin:</span>{" "}
                        {dish.culturalOrigin}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Festivals */}
              <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 shadow-xs">
                <h3 className="text-lg font-bold text-[var(--charcoal)] flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-[#C49A2A]" /> 🎉 Cultural Festivals
                </h3>
                <div className="space-y-3">
                  {culturalData.festivals?.map((fest, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-[var(--light-sage)] bg-[var(--cream)]/40 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-sm text-[var(--charcoal)]">{fest.name}</h4>
                        <span className="text-[10px] font-bold text-[var(--slate)] bg-white px-2 py-0.5 rounded-md border border-[var(--light-sage)]">
                          {fest.timing}
                        </span>
                      </div>
                      <p className="text-[var(--charcoal)] leading-relaxed">
                        {fest.celebrationStyle}
                      </p>
                      <p className="text-[11px] text-[var(--slate)] mt-1.5">
                        <span className="text-[var(--forest)] font-bold">Significance:</span>{" "}
                        {fest.culturalSignificance}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Local Language Phrases */}
            {culturalData.localPhrases?.length > 0 && (
              <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 sm:p-8 shadow-xs">
                <h3 className="text-xl font-bold text-[var(--charcoal)] flex items-center gap-2 mb-4">
                  <Languages className="w-5 h-5 text-[var(--forest)]" /> 🗣️ Local Language & Greetings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {culturalData.localPhrases.map((phraseItem, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[var(--cream)]/60 border border-[var(--light-sage)] text-xs flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[10px] text-[var(--slate)] font-bold uppercase tracking-wider">
                          {phraseItem.context}
                        </span>
                        <p className="text-base font-extrabold text-[var(--charcoal)] mt-1">
                          {phraseItem.phrase}
                        </p>
                        <p className="text-xs text-[var(--forest)] font-medium italic mt-0.5">
                          &ldquo;{phraseItem.pronunciation}&rdquo;
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-[var(--slate)] mt-2 pt-2 border-t border-[var(--light-sage)]/60">
                        = {phraseItem.englishMeaning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cultural Etiquette: Dos and Don'ts */}
            <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 sm:p-8 shadow-xs">
              <h3 className="text-xl font-bold text-[var(--charcoal)] flex items-center gap-2 mb-4">
                <HelpCircle className="w-5 h-5 text-[var(--forest)]" /> 🙏 Cultural Etiquette & Respectful Conduct
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dos */}
                <div className="p-4 rounded-xl bg-[var(--success-bg)] border border-[var(--success)]/20 text-xs">
                  <h4 className="font-bold text-sm text-[var(--success)] flex items-center gap-1.5 mb-3">
                    <CheckCircle2 className="w-4 h-4" /> Respectful Practices (Dos)
                  </h4>
                  <ul className="space-y-2 text-[var(--charcoal)]">
                    {culturalData.culturalEtiquette?.dos?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[var(--success)] font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Don'ts */}
                <div className="p-4 rounded-xl bg-[var(--error-bg)] border border-[var(--error)]/20 text-xs">
                  <h4 className="font-bold text-sm text-[var(--error)] flex items-center gap-1.5 mb-3">
                    <AlertTriangle className="w-4 h-4" /> Mindful Precautions (Don&apos;ts)
                  </h4>
                  <ul className="space-y-2 text-[var(--charcoal)]">
                    {culturalData.culturalEtiquette?.donts?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[var(--error)] font-bold">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {(culturalData.culturalEtiquette?.attireGuidance ||
                culturalData.culturalEtiquette?.photographyRules) && (
                <div className="mt-4 pt-4 border-t border-[var(--light-sage)]/60 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {culturalData.culturalEtiquette.attireGuidance && (
                    <p className="text-[var(--slate)]">
                      <strong className="text-[var(--charcoal)]">👗 Attire Guidance:</strong>{" "}
                      {culturalData.culturalEtiquette.attireGuidance}
                    </p>
                  )}
                  {culturalData.culturalEtiquette.photographyRules && (
                    <p className="text-[var(--slate)]">
                      <strong className="text-[var(--charcoal)]">📸 Photography Rules:</strong>{" "}
                      {culturalData.culturalEtiquette.photographyRules}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Hidden Gems */}
            {culturalData.hiddenGems?.length > 0 && (
              <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 sm:p-8 shadow-xs">
                <h3 className="text-xl font-bold text-[var(--charcoal)] flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-[#C49A2A]" /> 🌟 Hidden Cultural Gems Nearby
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {culturalData.hiddenGems.map((gem, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[var(--cream)]/50 border border-[var(--light-sage)] text-xs"
                    >
                      <h4 className="font-bold text-sm text-[var(--charcoal)]">{gem.name}</h4>
                      <p className="text-[10px] text-[var(--forest)] font-bold mt-0.5">
                        📍 {gem.distanceOrLocation}
                      </p>
                      <p className="text-[var(--charcoal)] mt-2 leading-relaxed">{gem.whyVisit}</p>
                      <p className="text-[11px] text-[var(--slate)] mt-1.5 font-medium">
                        <span className="text-[var(--forest)] font-semibold">Value:</span>{" "}
                        {gem.culturalValue}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🤖 ASK YOUR CULTURAL GUIDE (AI CHAT) */}
            <div className="bg-white border-2 border-[var(--forest)]/30 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--forest)] text-white flex items-center justify-center shadow-xs">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[var(--charcoal)]">
                    🤖 Ask Your Cultural Guide
                  </h3>
                  <p className="text-xs text-[var(--slate)]">
                    Ask questions grounded specifically in your {activeMode === "trip" ? "selected trip & itinerary" : "selected place"}.
                  </p>
                </div>
              </div>

              {/* Quick suggestion pills */}
              <div className="flex items-center gap-2 flex-wrap mb-4">
                {QUICK_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendChat(q)}
                    disabled={chatLoading}
                    className="text-xs bg-[var(--cream)] border border-[var(--light-sage)] hover:border-[var(--forest)] text-[var(--charcoal)] px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Chat messages viewport */}
              <div className="min-h-[140px] max-h-[360px] overflow-y-auto bg-[var(--cream)]/40 rounded-xl p-4 border border-[var(--light-sage)] mb-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <p className="text-xs text-[var(--slate)] text-center py-6 italic">
                    Ask any question about history, traditions, temples, food, or customs!
                  </p>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-[var(--forest)] text-white rounded-br-none"
                            : "bg-white text-[var(--charcoal)] border border-[var(--light-sage)] rounded-bl-none shadow-xs"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-[var(--light-sage)] rounded-2xl rounded-bl-none px-4 py-2.5 text-xs text-[var(--slate)] flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--forest)]" />
                      🤖 Your cultural guide is thinking...
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="e.g. Why is this fort architecturally unique? What sweets are famous here?"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--light-sage)] focus:border-[var(--forest)] focus:outline-none text-xs sm:text-sm text-[var(--charcoal)] bg-white"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="btn-primary py-2.5 px-5 text-xs sm:text-sm flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> Ask
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CulturalHeritagePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--cream)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--forest)]" />
        </div>
      }
    >
      <CulturalHeritageContent />
    </Suspense>
  );
}
