"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/components/AuthProvider";
import { getUserTrips, deleteTrip, type TripData } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import {
  Plus,
  MapPin,
  Calendar,
  Trash2,
  Eye,
  Plane,
  Loader2,
  LayoutGrid,
  AlertCircle,
  Users,
  Wallet,
  ShieldAlert,
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchTrips = async () => {
    if (!user) return;
    try {
      const userTrips = await getUserTrips(user.uid);
      setTrips(userTrips);
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoadingTrips(false);
    }
  };

  useEffect(() => {
    if (user) fetchTrips();
  }, [user]);

  const handleDelete = async (tripId: string) => {
    if (confirmDeleteId !== tripId) {
      setConfirmDeleteId(tripId);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    setDeletingId(tripId);
    setConfirmDeleteId(null);
    const prevTrips = [...trips];
    setTrips(trips.filter((t) => t.id !== tripId));
    try {
      await deleteTrip(tripId);
    } catch {
      alert("Removal failed. Trip restored.");
      setTrips(prevTrips);
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream)]">
        <div className="spinner" />
      </div>
    );
  if (!user) return null;

  const stats = [
    {
      icon: LayoutGrid,
      label: t("dashboard.totalTrips"),
      value: trips.length,
      color: "var(--forest)",
      bg: "var(--sage)",
    },
    {
      icon: MapPin,
      label: t("dashboard.destinations"),
      value: new Set(trips.map((t) => t.destination)).size,
      color: "var(--emerald)",
      bg: "#EDF7F2",
    },
    {
      icon: Calendar,
      label: t("dashboard.daysPlanned"),
      value: trips.reduce((s, t) => s + t.days, 0),
      color: "#C49A2A",
      bg: "rgba(232, 201, 138, 0.15)",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--cream)]">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--charcoal)]">
              {t("dashboard.welcomeBack")}, {user.displayName || user.email?.split("@")[0]}
            </h1>
            <p className="text-sm text-[var(--slate)] mt-0.5">
              {t("dashboard.allSavedPlans")}
            </p>
          </div>
          <Link href="/plan" className="btn-primary shrink-0">
            <Plus className="w-4 h-4" /> {t("nav.newTrip")}
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-[var(--light-sage)] rounded-xl p-5 flex items-center gap-4"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: stat.bg, color: stat.color }}
              >
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--charcoal)]">{stat.value}</p>
                <p className="text-xs text-[var(--slate)] font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Trip Grid */}
        {loadingTrips ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" />
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white border border-dashed border-[var(--light-sage)] rounded-xl p-16 text-center">
            <div className="w-14 h-14 bg-[var(--sage)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Plane className="w-6 h-6 text-[var(--slate)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--charcoal)] mb-2">{t("dashboard.noTripsYet")}</h3>
            <p className="text-sm text-[var(--slate)] mb-6">
              {t("dashboard.planFirstTripDesc")}
            </p>
            <Link href="/plan" className="btn-primary inline-flex">
              <Plus className="w-4 h-4" /> {t("dashboard.planTripBtn")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white border border-[var(--light-sage)] rounded-xl p-5 flex flex-col hover:shadow-md hover:border-[var(--sage-dark)] transition-all"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-[var(--charcoal)] truncate">
                      {trip.destination}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-[var(--slate)] mt-0.5">
                      <Calendar className="w-3 h-3 shrink-0" />
                      {trip.startDate && new Date(trip.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <span className="ml-2 shrink-0 text-xs font-semibold bg-[var(--sage)] text-[var(--forest)] border border-[var(--light-sage)] px-2.5 py-1 rounded-full">
                    {trip.days}{t("common.days").charAt(0).toLowerCase()}
                  </span>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {/* Security Advisory Badge */}
                  {trip.safety_level === "unsafe" ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--error)] bg-[var(--error-bg)] border border-[var(--error)]/30 px-2.5 py-1 rounded-full">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      {t("common.advisory")}
                    </div>
                  ) : trip.safety_level === "caution" ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#7A5C00] bg-[var(--warning-bg)] border border-[var(--sand)] px-2.5 py-1 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {t("common.caution")}
                    </div>
                  ) : null}

                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#7A5C00] bg-[rgba(232,201,138,0.2)] border border-[rgba(232,201,138,0.5)] px-2.5 py-1 rounded-full">
                    <Wallet className="w-3 h-3" />
                    {formatCurrency(trip.budget || 0, trip.currency || "INR")}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--charcoal-80)] bg-[var(--sage)] border border-[var(--light-sage)] px-2.5 py-1 rounded-full">
                    <Users className="w-3 h-3" />
                    {trip.people} {trip.people === 1 ? t("common.traveler") : t("common.travelers")}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-4 border-t border-[var(--light-sage)]">
                  <Link
                    href={`/trip/${trip.id}`}
                    className="flex-1 btn-secondary text-sm py-2 justify-center"
                  >
                    <Eye className="w-3.5 h-3.5" /> {t("dashboard.viewTrip")}
                  </Link>
                  <button
                    onClick={() => handleDelete(trip.id!)}
                    disabled={deletingId === trip.id}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                      confirmDeleteId === trip.id
                        ? "bg-[var(--error)] text-white"
                        : "bg-[var(--error-bg)] text-[var(--error)] hover:bg-[var(--error)] hover:text-white border border-[var(--error)]/20"
                    }`}
                    title={confirmDeleteId === trip.id ? "Click again to confirm" : t("dashboard.deleteTrip")}
                  >
                    {deletingId === trip.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : confirmDeleteId === trip.id ? (
                      <><AlertCircle className="w-3.5 h-3.5" /> Sure?</>
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
