"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/components/AuthProvider";
import {
  MapPin,
  Calendar,
  PieChart,
  Download,
  Globe,
  ArrowRight,
  Shield,
  Plane,
  Compass,
  CheckCircle2,
  Clock,
  Coins,
  Share2,
  ChevronRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: Compass,
    title: "Curated Daily Itineraries",
    desc: "Hour-by-hour schedules covering top cultural sights, dining, and scenic routes suited to your travel pace.",
    tag: "Day-by-Day",
  },
  {
    icon: PieChart,
    title: "Smart Budget Tracking",
    desc: "Allocate stay, food, transport, and activity spending with live expense logging and currency conversions.",
    tag: "Finance",
  },
  {
    icon: MapPin,
    title: "Interactive Geo-Mapping",
    desc: "Every hotel and planned attraction is pinned directly to an interactive map with direct navigation links.",
    tag: "Navigation",
  },
  {
    icon: Calendar,
    title: "Calendar Sync (.ics)",
    desc: "One-click export of your full itinerary directly into Google Calendar, Apple Calendar, or Outlook.",
    tag: "Productivity",
  },
  {
    icon: Download,
    title: "Printable PDF Blueprints",
    desc: "Generate clean, high-resolution PDF itinerary summaries ready for offline access or printing.",
    tag: "Offline",
  },
  {
    icon: Shield,
    title: "Safety & Emergency Intel",
    desc: "Real-time safety clearances, local emergency hotlines, and seasonal clothing recommendations for every city.",
    tag: "Safety",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Enter Destination & Dates",
    desc: "Pick your dream destination, travel window, party size, and planned budget.",
  },
  {
    step: "02",
    title: "Customize Travel Style",
    desc: "Select your interests — adventure, heritage, culinary, beaches, or relaxation.",
  },
  {
    step: "03",
    title: "Receive Your Travel Blueprint",
    desc: "Get an instant day-wise schedule, verified hotels, live map, and budget breakdown.",
  },
  {
    step: "04",
    title: "Manage, Track & Share",
    desc: "Log daily expenses on the go, export to calendar, or share via QR code with co-travelers.",
  },
];

const BENEFITS = [
  "No crowded spreadsheets or scattered browser tabs",
  "Realistic day schedules with travel time estimations",
  "Accommodations categorized across Luxury and Budget",
  "Full offline access via downloadable PDF & ICS exports",
  "Expense tracking with multi-currency support",
  "Direct QR code sharing for friends & family",
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--cream)] text-[var(--charcoal)] selection:bg-[var(--sage)]">
      <Navbar />

      {/* ── HERO SECTION ────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Copy & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-[var(--sage)] border border-[var(--light-sage)] px-3.5 py-1.5 rounded-full text-xs font-bold text-[var(--forest)] tracking-wide uppercase">
              <Compass className="w-3.5 h-3.5 text-[var(--forest)]" />
              Modern Travel Planning Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--charcoal)] leading-[1.12]">
              Craft thoughtful travel itineraries{" "}
              <span className="text-[var(--forest)] underline decoration-[var(--sand)] decoration-4 underline-offset-8">
                in minutes.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[var(--slate)] max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Experience effortless trip planning. Generate complete day-by-day itineraries, track your multi-currency budget, scout verified stays, and view everything on an interactive map.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start pt-2">
              <Link
                href={user ? "/plan" : "/signup"}
                className="btn-primary py-3.5 px-7 text-base font-semibold shadow-md justify-center"
              >
                <Compass className="w-5 h-5" />
                {user ? "Plan a New Trip" : "Start Planning Free"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              <Link
                href={user ? "/dashboard" : "/login"}
                className="btn-secondary py-3.5 px-6 text-base font-semibold justify-center"
              >
                {user ? "My Saved Trips" : "Sign In to Account"}
              </Link>
            </div>

            {/* Quick trust checklist */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 pt-4 text-xs font-medium text-[var(--slate)]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--success)]" /> Free travel planner
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--success)]" /> Multi-currency support
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--success)]" /> PDF & Calendar export
              </span>
            </div>
          </div>

          {/* Right Column: Visual Product Preview */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 shadow-xl relative overflow-hidden">
              {/* Header preview */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--light-sage)]">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--forest)]">Sample Blueprint</div>
                  <div className="text-lg font-extrabold text-[var(--charcoal)]">Kyoto & Tokyo, Japan</div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-[var(--sage)] text-[var(--forest)] rounded-full border border-[var(--light-sage)]">
                  7 Days • 2 Travellers
                </span>
              </div>

              {/* Mini visual itinerary timeline */}
              <div className="space-y-3 mb-5">
                <div className="p-3 bg-[var(--cream)] rounded-xl border border-[var(--light-sage)] flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[var(--forest)] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs flex-1">
                    <div className="font-bold text-[var(--charcoal)]">Day 1: Arrival & Historic Asakusa</div>
                    <div className="text-[var(--slate)] text-[11px] mt-0.5">Senso-ji Temple • Nakamise Street • Sumida River Cruise</div>
                  </div>
                  <span className="text-[10px] font-bold text-[var(--forest)] bg-[var(--sage)] px-2 py-0.5 rounded">
                    09:00 AM
                  </span>
                </div>

                <div className="p-3 bg-[var(--cream)] rounded-xl border border-[var(--light-sage)] flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[var(--forest)] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs flex-1">
                    <div className="font-bold text-[var(--charcoal)]">Day 2: Gion District & Fushimi Inari</div>
                    <div className="text-[var(--slate)] text-[11px] mt-0.5">10,000 Torii Gates • Traditional Tea Ceremony</div>
                  </div>
                  <span className="text-[10px] font-bold text-[var(--forest)] bg-[var(--sage)] px-2 py-0.5 rounded">
                    10:30 AM
                  </span>
                </div>
              </div>

              {/* Budget pill footer */}
              <div className="pt-3 border-t border-[var(--light-sage)] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[var(--slate)]">
                  <PieChart className="w-4 h-4 text-[var(--forest)]" />
                  <span>Budget: <strong className="text-[var(--charcoal)]">USD $2,400</strong></span>
                </div>
                <span className="text-[11px] font-bold text-[var(--forest)] bg-[var(--sage)] px-2.5 py-1 rounded-full">
                  Interactive Map Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ───────────────────────────────────── */}
      <section id="features" className="py-20 bg-white border-y border-[var(--light-sage)] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--forest)] bg-[var(--sage)] px-3 py-1 rounded-full border border-[var(--light-sage)]">
              Comprehensive Toolkit
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--charcoal)] tracking-tight">
              Engineered for seamless travel execution
            </h2>
            <p className="text-base text-[var(--slate)]">
              Everything required to plan, budget, navigate, and experience your trips without friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="bg-[var(--cream)] border border-[var(--light-sage)] rounded-2xl p-6 hover:border-[var(--emerald)] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[var(--light-sage)] flex items-center justify-center text-[var(--forest)] shadow-sm">
                      <f.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--sage)] text-[var(--forest)] border border-[var(--light-sage)]">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[var(--charcoal)] mb-2">
                    {f.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--slate)] leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS SECTION ───────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--forest)] bg-[var(--sage)] px-3 py-1 rounded-full border border-[var(--light-sage)]">
            Step-By-Step Process
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--charcoal)] tracking-tight">
            How Wanderly works
          </h2>
          <p className="text-base text-[var(--slate)]">
            From initial destination inspiration to active on-trip expense tracking in four steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map((item) => (
            <div
              key={item.step}
              className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 flex flex-col relative shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--forest)] text-white flex items-center justify-center font-extrabold text-sm mb-4 shadow-sm">
                {item.step}
              </div>
              <h3 className="text-base font-bold text-[var(--charcoal)] mb-2">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--slate)] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BENEFITS GRID ──────────────────────────────────────── */}
      <section className="py-20 bg-[var(--sage)] border-y border-[var(--light-sage)] px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--forest)]">
                Why Choose Wanderly
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--charcoal)] tracking-tight">
                Designed for modern explorers who value structure
              </h2>
              <p className="text-sm text-[var(--slate)] leading-relaxed">
                Say goodbye to fragmented travel notes, messy screenshots, and lost addresses. Wanderly bundles every destination detail into a cohesive, actionable itinerary.
              </p>
              <div className="pt-2">
                <Link
                  href={user ? "/plan" : "/signup"}
                  className="btn-primary py-3 px-6 text-sm font-bold inline-flex items-center gap-2"
                >
                  <Compass className="w-4 h-4" />
                  Try Wanderly Now
                </Link>
              </div>
            </div>

            <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-3.5">
              {BENEFITS.map((benefit, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[var(--success-bg)] border border-[var(--success)]/30 flex items-center justify-center text-[var(--success)] shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-[var(--charcoal)] leading-snug">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION BANNER ──────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full text-center">
        <div className="bg-[var(--forest)] text-white rounded-3xl p-10 sm:p-14 shadow-xl space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to plan your next journey?
          </h2>
          <p className="text-sm sm:text-base text-[var(--sage)] max-w-xl mx-auto leading-relaxed">
            Create your custom travel blueprint in seconds. Verified hotels, daily timeline, maps, and budget tracking included.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3.5 justify-center">
            <Link
              href={user ? "/plan" : "/signup"}
              className="bg-white text-[var(--forest)] hover:bg-[var(--cream)] px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all shadow-md inline-flex items-center justify-center gap-2"
            >
              <Compass className="w-5 h-5" />
              {user ? "Create a Trip" : "Get Started for Free"}
            </Link>
            <Link
              href="/currency"
              className="bg-[var(--forest-light)] text-white hover:bg-[var(--forest-dark)] border border-white/20 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all inline-flex items-center justify-center gap-2"
            >
              <Coins className="w-4 h-4" />
              Currency Converter
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--light-sage)] py-12 px-4 sm:px-6 lg:px-8 bg-white mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[var(--forest)] rounded-lg flex items-center justify-center">
              <Plane className="w-4 h-4 text-white rotate-[-45deg]" />
            </div>
            <span className="font-bold text-[var(--charcoal)] text-base">Wanderly</span>
            <span className="text-xs text-[var(--slate)] ml-2">| Smart Travel Management</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-[var(--slate)]">
            <Link href="/" className="hover:text-[var(--forest)] transition-colors">Home</Link>
            <Link href="/plan" className="hover:text-[var(--forest)] transition-colors">Plan Trip</Link>
            <Link href="/dashboard" className="hover:text-[var(--forest)] transition-colors">Dashboard</Link>
            <Link href="/currency" className="hover:text-[var(--forest)] transition-colors">Currency Converter</Link>
            <Link href="/profile" className="hover:text-[var(--forest)] transition-colors">Profile</Link>
          </div>

          <p className="text-xs text-[var(--slate)] text-center md:text-right">
            © {new Date().getFullYear()} Wanderly. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
