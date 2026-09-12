"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/components/AuthProvider";
import {
  getUserCulturalInfo,
  deleteCulturalInfo,
  type SavedCulturalInfo,
} from "@/lib/db";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/config";
import CulturalPDFExport from "@/components/CulturalPDFExport";
import AudioPlayer from "@/components/AudioPlayer";
import {
  Landmark,
  Compass,
  MapPin,
  Calendar,
  Trash2,
  ExternalLink,
  BookOpen,
  Search,
  Filter,
  Loader2,
  Sparkles,
  ChevronRight,
  X,
  Volume2,
  ShieldCheck,
  Award,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export default function SavedCulturalInfoPage() {
  const { user, loading: authLoading } = useAuth();
  const { language, t } = useTranslation();

  const [savedGuides, setSavedGuides] = useState<SavedCulturalInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "trip" | "place">("all");
  const [filterLang, setFilterLang] = useState<string>("all");

  // Active guide for full-view modal
  const [selectedGuide, setSelectedGuide] = useState<SavedCulturalInfo | null>(null);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchGuides = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserCulturalInfo(user.uid);
      setSavedGuides(data);
    } catch (err) {
      console.error("[SavedCulturalInfo] Failed to fetch guides:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGuides();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this saved cultural guide?")) {
      return;
    }
    setDeletingId(id);
    try {
      const success = await deleteCulturalInfo(id);
      if (success) {
        setSavedGuides((prev) => prev.filter((g) => g.id !== id));
        if (selectedGuide?.id === id) {
          setSelectedGuide(null);
        }
      }
    } catch (err) {
      console.error("[SavedCulturalInfo] Failed to delete:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered guides
  const filteredGuides = savedGuides.filter((guide) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.place.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.culturalData?.overview?.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMode = filterMode === "all" || guide.mode === filterMode;
    const matchesLang = filterLang === "all" || guide.language === filterLang;

    return matchesSearch && matchesMode && matchesLang;
  });

  return (
    <div className="min-h-screen bg-[var(--cream)] pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--sage)] border border-[var(--light-sage)] text-[var(--forest)] text-xs font-bold uppercase tracking-wider mb-2">
              <Landmark className="w-3.5 h-3.5 text-[var(--forest)]" />
              <span>Cultural & Heritage Archive</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--charcoal)] tracking-tight">
              Saved Cultural Information
            </h1>
            <p className="text-sm text-[var(--slate)] mt-1">
              Your preserved heritage dossiers, cultural narratives, etiquette guides, and folklore.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/cultural-heritage"
              className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore New Cultural Stories</span>
            </Link>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-4 mb-8 shadow-xs flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--slate)]" />
            <input
              type="text"
              placeholder="Search by place, monument, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[var(--light-sage)] bg-[var(--cream)]/40 focus:outline-hidden focus:border-[var(--forest)] text-[var(--charcoal)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--slate)] hover:text-[var(--charcoal)]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Mode Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                filterMode === "all"
                  ? "bg-[var(--forest)] text-white"
                  : "bg-[var(--cream)] text-[var(--slate)] hover:text-[var(--charcoal)]"
              }`}
            >
              All ({savedGuides.length})
            </button>
            <button
              onClick={() => setFilterMode("trip")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                filterMode === "trip"
                  ? "bg-[var(--forest)] text-white"
                  : "bg-[var(--cream)] text-[var(--slate)] hover:text-[var(--charcoal)]"
              }`}
            >
              🧳 Trip Guides
            </button>
            <button
              onClick={() => setFilterMode("place")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                filterMode === "place"
                  ? "bg-[var(--forest)] text-white"
                  : "bg-[var(--cream)] text-[var(--slate)] hover:text-[var(--charcoal)]"
              }`}
            >
              📍 Place Guides
            </button>
          </div>

          {/* Language Filter */}
          <div className="w-full sm:w-auto">
            <select
              value={filterLang}
              onChange={(e) => setFilterLang(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-xs font-medium rounded-xl border border-[var(--light-sage)] bg-[var(--cream)]/40 text-[var(--charcoal)] focus:outline-hidden focus:border-[var(--forest)]"
            >
              <option value="all">🌐 All Languages</option>
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.nativeName} ({l.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content States */}
        {loading || authLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-[var(--light-sage)] rounded-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--forest)] mb-3" />
            <p className="text-sm font-semibold text-[var(--charcoal)]">
              Loading your saved cultural vault...
            </p>
          </div>
        ) : !user ? (
          <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-12 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 bg-[var(--sage)] rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
              🏛️
            </div>
            <h2 className="text-xl font-bold text-[var(--charcoal)] mb-2">
              Sign in to View Your Cultural Vault
            </h2>
            <p className="text-xs text-[var(--slate)] mb-6">
              Saved cultural guides, continuous storytelling audio, and multilingual PDFs are linked to your Wanderly account.
            </p>
            <Link href="/login" className="btn-primary text-xs py-2.5 px-6 inline-flex">
              Sign In to Wanderly
            </Link>
          </div>
        ) : filteredGuides.length === 0 ? (
          <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-12 text-center max-w-xl mx-auto shadow-xs">
            <div className="w-16 h-16 bg-[var(--cream)] rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl border border-[var(--light-sage)]">
              📖
            </div>
            <h2 className="text-xl font-bold text-[var(--charcoal)] mb-2">
              {savedGuides.length === 0
                ? "No Saved Cultural Guides Yet"
                : "No Guides Match Your Filter"}
            </h2>
            <p className="text-xs text-[var(--slate)] mb-6 leading-relaxed">
              {savedGuides.length === 0
                ? "Explore your saved trips or any historic place in India to generate deep cultural stories, folklore, and etiquette tips, then save them here for offline access and PDF export."
                : "Try changing your search query or reset your mode and language filters."}
            </p>
            <div className="flex items-center justify-center gap-3">
              {savedGuides.length > 0 ? (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterMode("all");
                    setFilterLang("all");
                  }}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Reset Filters
                </button>
              ) : (
                <Link
                  href="/cultural-heritage"
                  className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start Exploring Culture</span>
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuides.map((guide) => {
              const langMeta = SUPPORTED_LANGUAGES.find((l) => l.code === guide.language);
              const data = guide.culturalData || {};
              const placeCount = data.heritagePlaces?.length || 0;
              const traditionCount = data.overview?.majorTraditions?.length || 0;
              const primaryStory = data.tripStory || data.placeStory || "";
              const formattedDate = guide.createdAt
                ? new Date(guide.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "";

              return (
                <div
                  key={guide.id}
                  className="bg-white border border-[var(--light-sage)] rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-[var(--forest)]/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          guide.mode === "trip"
                            ? "bg-[var(--sage)] text-[var(--forest)] border-[var(--light-sage)]"
                            : "bg-[#FFF9EB] text-[#8B6200] border-[#FFE299]"
                        }`}
                      >
                        {guide.mode === "trip" ? "🧳 Trip Guide" : "📍 Place Guide"}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[var(--cream)] text-[var(--slate)] border border-[var(--light-sage)] flex items-center gap-1"
                          title={`Language: ${langMeta?.name || guide.language}`}
                        >
                          <span>{langMeta?.flag || "🌐"}</span>
                          <span>{langMeta?.code.toUpperCase() || guide.language}</span>
                        </span>

                        <button
                          onClick={(e) => handleDelete(guide.id, e)}
                          disabled={deletingId === guide.id}
                          className="p-1 text-[var(--slate)] hover:text-[var(--error)] rounded-lg hover:bg-[var(--error-bg)] transition-colors"
                          title="Delete saved guide"
                        >
                          {deletingId === guide.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--error)]" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Title & Location */}
                    <h2 className="font-extrabold text-base text-[var(--charcoal)] group-hover:text-[var(--forest)] transition-colors line-clamp-1 mb-1">
                      {guide.title || guide.place}
                    </h2>
                    <p className="text-xs text-[var(--forest)] font-semibold flex items-center gap-1 mb-3 truncate">
                      <MapPin className="w-3 h-3 text-[var(--forest)] shrink-0" />
                      <span>{data.overview?.location || guide.place}</span>
                    </p>

                    {/* Historical Period */}
                    {data.overview?.historicalPeriod && (
                      <div className="mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--cream)] text-[var(--slate)] px-2 py-0.5 rounded-md border border-[var(--light-sage)]">
                          Era: {data.overview.historicalPeriod}
                        </span>
                      </div>
                    )}

                    {/* Short Overview snippet */}
                    <p className="text-xs text-[var(--slate)] line-clamp-3 leading-relaxed mb-4">
                      {data.overview?.historicalBackground ||
                        primaryStory ||
                        "Explore the cultural nuances, oral folklore, and customs preserved in this guide."}
                    </p>

                    {/* Meta Counters */}
                    <div className="flex items-center gap-3 pt-3 border-t border-[var(--light-sage)]/60 text-[11px] text-[var(--slate)] mb-4">
                      {placeCount > 0 && (
                        <span>🏛️ {placeCount} Heritage Sites</span>
                      )}
                      {traditionCount > 0 && (
                        <span>🎭 {traditionCount} Traditions</span>
                      )}
                      {formattedDate && (
                        <span className="ml-auto text-[10px]">Saved {formattedDate}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-[var(--light-sage)] flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedGuide(guide)}
                      className="text-xs font-bold text-[var(--forest)] hover:underline flex items-center gap-1"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Read Guide</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {guide.mode === "trip" && guide.tripId && (
                        <Link
                          href={`/trip/${guide.tripId}`}
                          className="text-[11px] text-[var(--slate)] hover:text-[var(--forest)] font-medium flex items-center gap-1 border border-[var(--light-sage)] px-2 py-1 rounded-lg hover:bg-[var(--cream)] transition-colors"
                          title="View Itinerary"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Trip</span>
                        </Link>
                      )}

                      <CulturalPDFExport
                        culturalData={guide.culturalData}
                        mode={guide.mode}
                        language={guide.language}
                        globalLanguage={guide.language}
                        className="scale-90 origin-right"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detailed Modal Drawer */}
        {selectedGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div
              className="fixed inset-0"
              onClick={() => setSelectedGuide(null)}
            />

            <div className="relative z-10 bg-white border border-[var(--light-sage)] rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-[var(--light-sage)] flex items-start justify-between gap-4 bg-[var(--cream)]/60">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        selectedGuide.mode === "trip"
                          ? "bg-[var(--sage)] text-[var(--forest)] border-[var(--light-sage)]"
                          : "bg-[#FFF9EB] text-[#8B6200] border-[#FFE299]"
                      }`}
                    >
                      {selectedGuide.mode === "trip" ? "🧳 Trip Cultural Guide" : "📍 Place Cultural Guide"}
                    </span>
                    <span className="text-[10px] font-semibold bg-white border border-[var(--light-sage)] text-[var(--slate)] px-2 py-0.5 rounded-full">
                      {selectedGuide.culturalData?.overview?.historicalPeriod || "Heritage Dossier"}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--charcoal)] tracking-tight">
                    {selectedGuide.title || selectedGuide.place}
                  </h2>
                  <p className="text-xs font-semibold text-[var(--forest)] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    <span>{selectedGuide.culturalData?.overview?.location || selectedGuide.place}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <CulturalPDFExport
                    culturalData={selectedGuide.culturalData}
                    mode={selectedGuide.mode}
                    language={selectedGuide.language}
                    globalLanguage={selectedGuide.language}
                  />
                  <button
                    onClick={() => setSelectedGuide(null)}
                    className="w-8 h-8 rounded-full bg-white border border-[var(--light-sage)] flex items-center justify-center text-[var(--slate)] hover:text-[var(--charcoal)] hover:bg-[var(--cream)] transition-colors shadow-2xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-sm text-[var(--charcoal)]">
                {/* Audio Narration Bar */}
                {(selectedGuide.culturalData?.tripStory || selectedGuide.culturalData?.placeStory) && (
                  <div className="bg-[var(--cream)] border border-[var(--light-sage)] rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[var(--forest)] flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4 text-[var(--forest)]" />
                        Audio Narration (Multilingual Speech)
                      </span>
                    </div>
                    <AudioPlayer
                      text={selectedGuide.culturalData?.tripStory || selectedGuide.culturalData?.placeStory || ""}
                      title={selectedGuide.title}
                      language={selectedGuide.language}
                    />
                  </div>
                )}

                {/* Historical Background & Identity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedGuide.culturalData?.overview?.historicalBackground && (
                    <div className="bg-[var(--cream)]/40 p-4 rounded-xl border border-[var(--light-sage)]">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--slate)] mb-1.5">
                        Historical Background
                      </h4>
                      <p className="text-xs text-[var(--charcoal)] leading-relaxed">
                        {selectedGuide.culturalData.overview.historicalBackground}
                      </p>
                    </div>
                  )}
                  {selectedGuide.culturalData?.overview?.culturalIdentity && (
                    <div className="bg-[var(--cream)]/40 p-4 rounded-xl border border-[var(--light-sage)]">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--slate)] mb-1.5">
                        Cultural Identity
                      </h4>
                      <p className="text-xs text-[var(--charcoal)] leading-relaxed">
                        {selectedGuide.culturalData.overview.culturalIdentity}
                      </p>
                    </div>
                  )}
                </div>

                {/* Story Narrative */}
                {(selectedGuide.culturalData?.tripStory || selectedGuide.culturalData?.placeStory) && (
                  <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-5 shadow-2xs">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--forest)] mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      The Continuous Story
                    </h4>
                    <p className="text-xs leading-relaxed text-[var(--charcoal)] whitespace-pre-line">
                      {selectedGuide.culturalData.tripStory || selectedGuide.culturalData.placeStory}
                    </p>
                  </div>
                )}

                {/* Heritage Places */}
                {selectedGuide.culturalData?.heritagePlaces?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--forest)] mb-3 flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5" />
                      Heritage Places ({selectedGuide.culturalData.heritagePlaces.length})
                    </h4>
                    <div className="space-y-3">
                      {selectedGuide.culturalData.heritagePlaces.map((place: any, i: number) => (
                        <div
                          key={i}
                          className="bg-[var(--cream)]/30 border border-[var(--light-sage)] rounded-xl p-4"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h5 className="text-xs font-bold text-[var(--charcoal)]">
                              {place.name}
                            </h5>
                            {place.historicalPeriod && (
                              <span className="text-[10px] text-[var(--slate)] font-semibold">
                                {place.historicalPeriod}
                              </span>
                            )}
                          </div>
                          {place.historicalBackground && (
                            <p className="text-xs text-[var(--charcoal)] leading-relaxed mb-1.5">
                              {place.historicalBackground}
                            </p>
                          )}
                          {place.historicalStory && (
                            <p className="text-[11px] italic text-[var(--slate)] border-l-2 border-[var(--forest)] pl-2.5 mt-2">
                              &ldquo;{place.historicalStory}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verified Facts */}
                {selectedGuide.culturalData?.historicalFacts?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--forest)] mb-2.5 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      Verified Historical Facts
                    </h4>
                    <ul className="space-y-2">
                      {selectedGuide.culturalData.historicalFacts.map((fact: any, i: number) => (
                        <li
                          key={i}
                          className="text-xs text-[var(--charcoal)] flex items-start gap-2 bg-[var(--cream)]/40 p-2.5 rounded-lg border border-[var(--light-sage)]"
                        >
                          <span className="text-[var(--forest)] font-bold">•</span>
                          <div>
                            <p>{fact.fact}</p>
                            {fact.periodOrEra && (
                              <span className="text-[10px] text-[var(--slate)]">
                                Era: {fact.periodOrEra} {fact.sourceOrAuthority ? `| Source: ${fact.sourceOrAuthority}` : ""}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cultural Etiquette */}
                {selectedGuide.culturalData?.culturalEtiquette && (
                  <div className="bg-[var(--cream)]/40 border border-[var(--light-sage)] rounded-xl p-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--forest)] mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[var(--forest)]" />
                      Cultural Etiquette & Tips
                    </h4>
                    {selectedGuide.culturalData.culturalEtiquette.dos?.length > 0 && (
                      <div className="mb-2">
                        <span className="text-[11px] font-bold text-emerald-800">✓ Do:</span>
                        <p className="text-xs text-[var(--charcoal)] mt-0.5">
                          {selectedGuide.culturalData.culturalEtiquette.dos.join(" • ")}
                        </p>
                      </div>
                    )}
                    {selectedGuide.culturalData.culturalEtiquette.donts?.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold text-red-800">✕ Avoid:</span>
                        <p className="text-xs text-[var(--charcoal)] mt-0.5">
                          {selectedGuide.culturalData.culturalEtiquette.donts.join(" • ")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-[var(--light-sage)] flex items-center justify-between bg-white text-xs">
                <span className="text-[var(--slate)] text-[11px]">
                  Saved in your Wanderly cultural vault
                </span>
                <button
                  onClick={() => setSelectedGuide(null)}
                  className="btn-secondary py-1.5 px-4 text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
