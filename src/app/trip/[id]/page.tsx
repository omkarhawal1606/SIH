"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import AdvancedItinerary from "@/components/AdvancedItinerary";
import AccommodationGrid from "@/components/AccommodationGrid";
import QuickInfoSection from "@/components/QuickInfoSection";
import ShareTrip from "@/components/ShareTrip";
import ExpenseTracker from "@/components/ExpenseTracker";
import SecurityAdvisoryModal from "@/components/SecurityAdvisoryModal";
import { useAuth } from "@/components/AuthProvider";
import { type TripData, saveAccommodationToTrip } from "@/lib/db";
import { getDb } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { formatCurrency } from "@/lib/currency";

// Performance Optimization: Lazy load heavy components
const BudgetChart = dynamic(() => import("@/components/BudgetChart"), { ssr: false });
const ExportPDF = dynamic(() => import("@/components/ExportPDF"), { ssr: false });
const TripMap = dynamic(() => import("@/components/TripMap"), { ssr: false });

import {
  ArrowLeft,
  Calendar,
  Users,
  AlertCircle,
  Wallet,
  MapPin,
  Hotel,
  Compass,
  CreditCard,
  ShieldAlert,
  ShieldCheck,
  Landmark,
  CheckCircle2,
} from "lucide-react";

export default function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<string>("section-overview");
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [savingStay, setSavingStay] = useState(false);
  const [staySuccess, setStaySuccess] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time updates for this specific trip via Firestore onSnapshot
    const tripRef = doc(getDb(), "trips", resolvedParams.id);
    const unsubscribe = onSnapshot(
      tripRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const tripData = docSnap.data() as TripData;
          // Security check: only show trips owned by this user
          if (tripData.userId === user.uid) {
            setTrip(tripData);
            setError("");
          } else {
            setError("Trip not found");
          }
        } else {
          setError("Trip not found");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firestore onSnapshot error:", err);
        setError("Failed to load trip");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, resolvedParams.id]);

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const handleAddStayToTrip = async (hotel: any) => {
    if (!trip?.id) return;
    setSavingStay(true);
    try {
      await saveAccommodationToTrip(trip.id, hotel);
      setStaySuccess(`"${hotel.name}" saved to this trip!`);
      setTimeout(() => setStaySuccess(""), 4000);
    } catch (err) {
      console.error("Save stay error:", err);
    } finally {
      setSavingStay(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream)]">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--cream)]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center bg-white border border-[var(--light-sage)] rounded-2xl p-8 max-w-md w-full shadow-sm">
            <AlertCircle className="w-10 h-10 text-[var(--error)] mx-auto mb-3" />
            <p className="text-[var(--charcoal)] font-semibold mb-4">{error || "Trip not found"}</p>
            <Link href="/dashboard" className="btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--cream)] pb-24">
      <Navbar />

      {/* Security Advisory Modal */}
      <SecurityAdvisoryModal
        destination={trip.destination}
        safetyLevel={trip.safety_level}
        safetyWarning={trip.safety_warning}
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--slate)] hover:text-[var(--forest)] transition-colors mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        {/* Security Advisory Active Banner */}
        {trip.safety_warning && (
          <div
            className={`flex items-start justify-between gap-4 p-4 sm:p-5 border rounded-2xl mb-6 shadow-xs ${
              trip.safety_level === "unsafe"
                ? "bg-[var(--error-bg)] border-[var(--error)]/40 text-[var(--charcoal)] ring-2 ring-[var(--error)]/20"
                : trip.safety_level === "caution"
                ? "bg-[var(--warning-bg)] border-[var(--sand)] text-[var(--charcoal)]"
                : "bg-[var(--success-bg)] border-[var(--success)]/25 text-[var(--charcoal)]"
            }`}
          >
            <div className="flex items-start gap-3">
              {trip.safety_level === "unsafe" ? (
                <ShieldAlert className="w-6 h-6 text-[var(--error)] shrink-0 mt-0.5" />
              ) : trip.safety_level === "caution" ? (
                <AlertCircle className="w-6 h-6 text-[var(--warning)] shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-[var(--success)] shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      trip.safety_level === "unsafe"
                        ? "bg-[var(--error)] text-white"
                        : trip.safety_level === "caution"
                        ? "bg-[#7A5C00] text-white"
                        : "bg-[var(--success)] text-white"
                    }`}
                  >
                    {trip.safety_level === "unsafe"
                      ? "Critical Security Warning"
                      : trip.safety_level === "caution"
                      ? "Travel Caution Advisory"
                      : "Security Clearance: Safe"}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-[var(--charcoal-80)] leading-relaxed">
                  {trip.safety_warning}
                </p>
              </div>
            </div>

            {(trip.safety_level === "unsafe" || trip.safety_level === "caution") && (
              <button
                onClick={() => setShowSecurityModal(true)}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-lg shrink-0 transition-colors ${
                  trip.safety_level === "unsafe"
                    ? "bg-[var(--error)] text-white hover:bg-red-700"
                    : "bg-[var(--sage)] text-[var(--forest)] hover:bg-[var(--light-sage)]"
                }`}
              >
                View Advisory
              </button>
            )}
          </div>
        )}

        {/* 1. Trip Overview Card */}
        <section id="section-overview" className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 sm:p-8 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--forest)] mb-1">
                <Compass className="w-4 h-4" /> Travel Blueprint
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--charcoal)] mb-3 tracking-tight">
                {trip.destination}
              </h1>
              <div className="flex flex-wrap gap-2.5">
                <span className="badge-premium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--forest)]" />
                  {trip.days} Days {trip.startDate && `(${trip.startDate} → ${trip.endDate})`}
                </span>
                <span className="badge-premium flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[var(--forest)]" />
                  {trip.people || 1} {trip.people === 1 ? "Person" : "People"}
                </span>
                <span
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                  style={{
                    background: "rgba(232,201,138,0.25)",
                    color: "#7A5C00",
                    border: "1px solid rgba(232,201,138,0.55)",
                  }}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  Budget: {formatCurrency(trip.budget || 0, trip.currency || "INR")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <ShareTrip trip={trip} />
              <ExportPDF trip={trip} />
            </div>
          </div>
          <div className="flex gap-2 mt-5 flex-wrap">
            {trip.interests?.map((i) => (
              <span
                key={i}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--sage)] border border-[var(--light-sage)] text-[var(--forest)]"
              >
                #{i}
              </span>
            )) || <span className="text-xs text-[var(--slate)] italic">No interests specified</span>}
          </div>
        </section>

        {/* Cultural & Heritage Storyteller Callout */}
        <Link
          href={`/cultural-heritage?tripId=${resolvedParams.id}`}
          className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[var(--sage)] via-white to-[var(--cream)] border border-[var(--forest)]/20 hover:border-[var(--forest)]/50 transition-all shadow-xs group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[var(--forest)] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[var(--forest)] text-white px-2 py-0.5 rounded-full">
                  AI Storyteller
                </span>
                <h4 className="text-sm sm:text-base font-bold text-[var(--charcoal)]">
                  🏛️ Cultural & Heritage Storyteller
                </h4>
              </div>
              <p className="text-xs text-[var(--slate)] mt-0.5">
                Explore the deep history, legends, food traditions, and continuous narrative of your journey in {trip.destination}.
              </p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-[var(--forest)] flex items-center gap-1 shrink-0 group-hover:translate-x-1 transition-transform">
            Explore Cultural Story →
          </span>
        </Link>

        {/* Section Quick Navigation Bar */}
        <div className="sticky top-[64px] z-30 bg-white/95 backdrop-blur-md border border-[var(--light-sage)] rounded-xl p-1.5 mb-8 shadow-sm flex items-center gap-1 overflow-x-auto">
          {[
            { id: "section-budget", label: "Budget", icon: Wallet },
            { id: "section-map", label: "Map", icon: MapPin },
            { id: "section-itinerary", label: "Itinerary", icon: Calendar },
            { id: "section-hotels", label: "Stays", icon: Hotel },
            { id: "section-info", label: "Guide & Safety", icon: Compass },
            { id: "section-expenses", label: "Expenses", icon: CreditCard },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === item.id
                  ? "bg-[var(--forest)] text-white shadow-sm"
                  : "text-[var(--slate)] hover:text-[var(--charcoal)] hover:bg-[var(--sage)]"
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Structured Sections in Professional Order */}
        <div className="space-y-10">
          {/* 2. Budget Breakdown Section */}
          <section id="section-budget" className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 sm:p-8 shadow-sm scroll-mt-28">
            <h3 className="text-lg font-bold text-[var(--charcoal)] mb-6 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[var(--forest)]" />
              Budget Breakdown & Allocation
            </h3>
            {trip.cost_breakdown ? (
              <BudgetChart breakdown={trip.cost_breakdown} totalBudget={trip.budget} currency={trip.currency} />
            ) : (
              <p className="text-[var(--slate)] text-sm italic">
                Standard breakdown not available for this trip record.
              </p>
            )}
          </section>

          {/* 3. Interactive Map Section */}
          <section id="section-map" className="scroll-mt-28">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-[var(--charcoal)] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[var(--forest)]" />
                Interactive Map & Locations
              </h3>
            </div>
            <TripMap trip={trip} />
          </section>

          {/* 4. Daily Itinerary Section */}
          <section id="section-itinerary" className="scroll-mt-28">
            <AdvancedItinerary
              itinerary={trip.itinerary || []}
              destination={trip.destination}
              currency={trip.currency}
              tripId={trip.id}
              tripStartDate={trip.startDate}
              tripSafetyLevel={trip.safety_level}
            />
          </section>

          {/* 5. Accommodation Section */}
          {trip.hotels && trip.hotels.length > 0 && (
            <section id="section-hotels" className="scroll-mt-28">
              {staySuccess && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-[var(--success-bg)] border border-[var(--success)]/20 rounded-xl text-[var(--success)] text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  {staySuccess}
                </div>
              )}
              <AccommodationGrid
                hotels={trip.hotels}
                destination={trip.destination}
                currency={trip.currency}
                tripId={trip.id}
                onAddToTrip={handleAddStayToTrip}
                selectedAccommodation={(trip as any).selectedAccommodation}
                recommendations={(trip as any).recommendations}
              />
            </section>
          )}

          {/* 6. Local Guide & Safety Info Section */}
          {(trip.events || trip.emergency || trip.season_info) && (
            <section id="section-info" className="scroll-mt-28">
              <QuickInfoSection
                emergency={trip.emergency}
                clothing={trip.clothing || []}
                events={trip.events || []}
                season_info={trip.season_info || ""}
              />
            </section>
          )}

          {/* 7. Expense Tracker Section */}
          <section id="section-expenses" className="scroll-mt-28">
            <ExpenseTracker trip={trip} />
          </section>
        </div>
      </main>
    </div>
  );
}
