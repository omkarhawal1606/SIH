"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { logout } from "@/lib/db";
import { useRouter } from "next/navigation";
import {
  Plane,
  LogOut,
  LayoutDashboard,
  MapPin,
  Coins,
  Home,
  Menu,
  X,
  User,
  ChevronDown,
  Compass,
  Sparkles,
  HelpCircle,
  Landmark,
  Bookmark,
  Hotel,
  Building,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

export default function Navbar() {
  const { t } = useTranslation();
  const { user, isProvider, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <nav
        className="sticky top-0 z-50 bg-white border-b border-[var(--light-sage)]"
        style={{ boxShadow: "0 1px 4px rgba(23,35,31,0.06)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[64px]">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-8 h-8 bg-[var(--forest)] rounded-xl flex items-center justify-center shadow-xs">
                <Plane className="w-4 h-4 text-white rotate-[-45deg]" />
              </div>
              <span
                className="text-lg font-extrabold text-[var(--charcoal)] tracking-tight"
                style={{ letterSpacing: "-0.02em" }}
              >
                Wanderly
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive("/") && pathname === "/"
                    ? "bg-[var(--sage)] text-[var(--forest)] font-extrabold"
                    : "text-[var(--slate)] hover:text-[var(--charcoal)] hover:bg-[var(--sage)]"
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                {t("nav.home")}
              </Link>

              <Link
                href="/plan"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive("/plan")
                    ? "bg-[var(--sage)] text-[var(--forest)] font-extrabold"
                    : "text-[var(--slate)] hover:text-[var(--charcoal)] hover:bg-[var(--sage)]"
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-[var(--forest)]" />
                {t("nav.planTrip")}
              </Link>

              <Link
                href="/stays"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive("/stays")
                    ? "bg-[var(--sage)] text-[var(--forest)] font-extrabold"
                    : "text-[var(--slate)] hover:text-[var(--charcoal)] hover:bg-[var(--sage)]"
                }`}
              >
                <Hotel className="w-3.5 h-3.5 text-[var(--forest)]" />
                Stays
              </Link>

              {user && (
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive("/dashboard")
                      ? "bg-[var(--sage)] text-[var(--forest)] font-extrabold"
                      : "text-[var(--slate)] hover:text-[var(--charcoal)] hover:bg-[var(--sage)]"
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  {t("nav.dashboard")}
                </Link>
              )}

              <Link
                href="/currency"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive("/currency")
                    ? "bg-[var(--sage)] text-[var(--forest)] font-extrabold"
                    : "text-[var(--slate)] hover:text-[var(--charcoal)] hover:bg-[var(--sage)]"
                }`}
              >
                <Coins className="w-3.5 h-3.5 text-[#7A5C00]" />
                {t("nav.currency")}
              </Link>

              <Link
                href="/cultural-heritage"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive("/cultural-heritage")
                    ? "bg-[var(--sage)] text-[var(--forest)] font-extrabold"
                    : "text-[var(--slate)] hover:text-[var(--charcoal)] hover:bg-[var(--sage)]"
                }`}
              >
                <Landmark className="w-3.5 h-3.5 text-[var(--forest)]" />
                {t("nav.heritage")}
              </Link>

              <Link
                href="/#features"
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--slate)] hover:text-[var(--charcoal)] hover:bg-[var(--sage)] transition-all"
              >
                {t("nav.features")}
              </Link>

              <Link
                href="/#how-it-works"
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--slate)] hover:text-[var(--charcoal)] hover:bg-[var(--sage)] transition-all"
              >
                {t("nav.howItWorks")}
              </Link>
            </div>

            {/* Right Side User Profile / Auth Actions / Language Selector */}
            <div className="flex items-center gap-2">
              <LanguageSelector />

              {user ? (
                <>
                  <Link
                    href="/plan"
                    className="hidden sm:inline-flex btn-primary text-xs py-2 px-3.5 font-bold shadow-xs"
                  >
                    <Compass className="w-3.5 h-3.5" /> {t("nav.newTrip")}
                  </Link>

                  {/* User Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-[var(--light-sage)] hover:bg-[var(--sage)] transition-all shadow-xs"
                    >
                      <div className="w-6 h-6 rounded-lg bg-[var(--forest)] flex items-center justify-center text-white text-xs font-extrabold">
                        {user.email?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <span className="text-xs font-bold text-[var(--charcoal)] max-w-[110px] truncate hidden sm:inline">
                        {user.displayName || user.email?.split("@")[0]}
                      </span>
                      <ChevronDown className={`w-3 h-3 text-[var(--slate)] transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[var(--light-sage)] rounded-2xl shadow-xl overflow-hidden z-50 animate-scale-in">
                        <div className="p-3 bg-[var(--cream)] border-b border-[var(--light-sage)]">
                          <p className="text-[11px] font-bold text-[var(--slate)] uppercase tracking-wider">{t("nav.signedInAs")}</p>
                          <p className="text-xs font-extrabold text-[var(--charcoal)] truncate mt-0.5">{user.email}</p>
                        </div>
                        <div className="p-1.5 space-y-0.5">
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[var(--charcoal)] hover:bg-[var(--sage)] rounded-lg transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-[var(--forest)]" />
                            {t("nav.dashboard")}
                          </Link>
                          <Link
                            href="/plan"
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[var(--charcoal)] hover:bg-[var(--sage)] rounded-lg transition-colors"
                          >
                            <Compass className="w-4 h-4 text-[var(--forest)]" />
                            {t("nav.planTrip")}
                          </Link>
                          <Link
                            href="/stays"
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[var(--charcoal)] hover:bg-[var(--sage)] rounded-lg transition-colors"
                          >
                            <Hotel className="w-4 h-4 text-[var(--forest)]" />
                            Stays
                          </Link>
                          <Link
                            href="/cultural-heritage"
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[var(--charcoal)] hover:bg-[var(--sage)] rounded-lg transition-colors"
                          >
                            <Landmark className="w-4 h-4 text-[var(--forest)]" />
                            {t("nav.culturalStoryteller")}
                          </Link>
                          <Link
                            href="/saved-cultural-info"
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[var(--charcoal)] hover:bg-[var(--sage)] rounded-lg transition-colors"
                          >
                            <Bookmark className="w-4 h-4 text-[var(--forest)]" />
                            {t("nav.savedCulturalInfo") || "Saved Cultural Info"}
                          </Link>
                          <Link
                            href="/profile"
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[var(--charcoal)] hover:bg-[var(--sage)] rounded-lg transition-colors"
                          >
                            <User className="w-4 h-4 text-[var(--forest)]" />
                            {t("nav.profile")}
                          </Link>

                          <div className="h-px bg-[var(--light-sage)] my-1" />

                          {/* Role-specific portal links */}
                          {isAdmin && (
                            <Link
                              href="/admin/dashboard"
                              className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                            >
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              Admin Dashboard
                            </Link>
                          )}
                          {isProvider && (
                            <Link
                              href="/hotel/dashboard"
                              className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-blue-800 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <Building className="w-4 h-4 text-blue-600" />
                              Provider Dashboard
                            </Link>
                          )}
                          {!isProvider && (
                            <Link
                              href="/hotel/login"
                              className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[var(--slate)] hover:bg-[var(--sage)] rounded-lg transition-colors"
                            >
                              <Building className="w-4 h-4 text-[var(--slate)]" />
                              List Your Property
                            </Link>
                          )}

                          <div className="h-px bg-[var(--light-sage)] my-1" />
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[var(--error)] hover:bg-[var(--error-bg)] rounded-lg transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            {t("nav.signOut")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden sm:inline-flex btn-secondary text-xs py-2 px-3.5 font-bold"
                  >
                    {t("nav.signIn")}
                  </Link>
                  <Link href="/signup" className="btn-primary text-xs py-2 px-4 font-bold shadow-xs">
                    {t("nav.getStarted")}
                  </Link>
                </>
              )}

              {/* Mobile menu hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-xl text-[var(--slate)] hover:bg-[var(--sage)] transition-colors"
                aria-label="Toggle Navigation Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute top-[64px] left-0 right-0 bg-white border-b border-[var(--light-sage)] shadow-xl animate-slide-down"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1.5">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--light-sage)]/60 mb-2">
                <span className="text-xs font-bold text-[var(--slate)]">{t("nav.home")} / Language</span>
                <LanguageSelector />
              </div>

              <Link
                href="/"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[var(--charcoal)] hover:bg-[var(--sage)]"
              >
                <Home className="w-4 h-4 text-[var(--forest)]" /> {t("nav.home")}
              </Link>
              <Link
                href="/plan"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[var(--charcoal)] hover:bg-[var(--sage)]"
              >
                <Compass className="w-4 h-4 text-[var(--forest)]" /> {t("nav.planTrip")}
              </Link>
              <Link
                href="/stays"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[var(--charcoal)] hover:bg-[var(--sage)]"
              >
                <Hotel className="w-4 h-4 text-[var(--forest)]" /> Stays
              </Link>
              {user && (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[var(--charcoal)] hover:bg-[var(--sage)]"
                >
                  <LayoutDashboard className="w-4 h-4 text-[var(--forest)]" /> {t("nav.dashboard")}
                </Link>
              )}
              <Link
                href="/currency"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[var(--charcoal)] hover:bg-[var(--sage)]"
              >
                <Coins className="w-4 h-4 text-[#7A5C00]" /> {t("nav.currency")}
              </Link>
              <Link
                href="/cultural-heritage"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[var(--charcoal)] hover:bg-[var(--sage)]"
              >
                <Landmark className="w-4 h-4 text-[var(--forest)]" /> {t("nav.culturalStoryteller")}
              </Link>
              {user && (
                <Link
                  href="/saved-cultural-info"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[var(--charcoal)] hover:bg-[var(--sage)]"
                >
                  <Bookmark className="w-4 h-4 text-[var(--forest)]" /> {t("nav.savedCulturalInfo") || "Saved Cultural Info"}
                </Link>
              )}
              <Link
                href="/#features"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[var(--charcoal)] hover:bg-[var(--sage)]"
              >
                <Sparkles className="w-4 h-4 text-[var(--emerald)]" /> {t("nav.features")}
              </Link>
              <Link
                href="/#how-it-works"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[var(--charcoal)] hover:bg-[var(--sage)]"
              >
                <HelpCircle className="w-4 h-4 text-[var(--forest)]" /> {t("nav.howItWorks")}
              </Link>

              {user ? (
                <>
                  <div className="h-px bg-[var(--light-sage)] my-2" />
                  {isAdmin && (
                    <Link
                      href="/admin/dashboard"
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Admin Dashboard
                    </Link>
                  )}
                  {isProvider && (
                    <Link
                      href="/hotel/dashboard"
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-blue-800 bg-blue-50"
                    >
                      <Building className="w-4 h-4 text-blue-600" /> Provider Dashboard
                    </Link>
                  )}
                  {!isProvider && (
                    <Link
                      href="/hotel/login"
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[var(--slate)] hover:bg-[var(--sage)]"
                    >
                      <Building className="w-4 h-4 text-[var(--forest)]" /> List Your Property
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[var(--charcoal)] hover:bg-[var(--sage)]"
                  >
                    <User className="w-4 h-4 text-[var(--forest)]" />
                    {t("nav.profile")}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[var(--error)] hover:bg-[var(--error-bg)]"
                  >
                    <LogOut className="w-4 h-4" />
                    {t("nav.signOut")}
                  </button>
                </>
              ) : (
                <>
                  <div className="h-px bg-[var(--light-sage)] my-2" />
                  <Link
                    href="/hotel/login"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[var(--forest)] bg-[var(--sage)]/50"
                  >
                    <Building className="w-4 h-4 text-[var(--forest)]" /> Partner / List Property
                  </Link>
                  <Link href="/login" className="block px-3 py-2.5 text-xs font-bold text-[var(--charcoal)] hover:bg-[var(--sage)] rounded-xl">
                    {t("nav.signIn")}
                  </Link>
                  <Link href="/signup" className="block px-3 py-2.5 text-xs font-extrabold text-[var(--forest)] bg-[var(--sage)] rounded-xl">
                    {t("nav.getStarted")} →
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Outside click handler for user menu */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
      )}
    </>
  );
}
