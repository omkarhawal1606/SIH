"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerHotelProvider, type AccommodationType } from "@/lib/db";
import {
  Hotel,
  Home,
  Landmark,
  BedDouble,
  TreePine,
  Coffee,
  Leaf,
  Mail,
  Lock,
  User,
  Phone,
  Building,
  MapPin,
  FileText,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

const PROPERTY_TYPES: {
  id: AccommodationType;
  label: string;
  desc: string;
  icon: React.ElementType;
  emoji: string;
}[] = [
  { id: "hotel", label: "Hotel", desc: "Boutique, business, or luxury hotel", icon: Hotel, emoji: "🏨" },
  { id: "homestay", label: "Homestay", desc: "Local host residence or heritage home", icon: Home, emoji: "🏠" },
  { id: "hostel", label: "Hostel", desc: "Backpacker or youth hostel with dorms", icon: BedDouble, emoji: "🛏️" },
  { id: "govt_stay", label: "Government Stay", desc: "Tourism corp, dak bungalow, or state guest house", icon: Landmark, emoji: "🏛️" },
  { id: "resort", label: "Resort", desc: "Nature, leisure, or wellness resort", icon: TreePine, emoji: "🏕️" },
  { id: "guest_house", label: "Guest House", desc: "Bed & breakfast or private guest rooms", icon: Coffee, emoji: "🏡" },
  { id: "eco_stay", label: "Eco-Stay", desc: "Sustainable farm stay or eco-lodge", icon: Leaf, emoji: "🌿" },
];

export default function HotelRegisterPage() {
  const router = useRouter();

  // Step 1: Owner & Business, Step 2: Property & Location, Step 3: Account Security
  const [ownerName, setOwnerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyType, setPropertyType] = useState<AccommodationType>("hotel");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [lat, setLat] = useState<string>("15.2993");
  const [lng, setLng] = useState<string>("74.1240");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName || !businessName || !email || !phone || !city || !state || !password) {
      setError("Please complete all required fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);

      const registrationPayload: Parameters<typeof registerHotelProvider>[0] = {
        ownerName: ownerName.trim(),
        businessName: businessName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        propertyType,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        description: description.trim() || `${businessName} in ${city}, offering comfortable accommodations for travelers.`,
        password,
      };

      if (!isNaN(parsedLat)) {
        registrationPayload.lat = parsedLat;
      }
      if (!isNaN(parsedLng)) {
        registrationPayload.lng = parsedLng;
      }

      await registerHotelProvider(registrationPayload);

      setSuccessMessage("Property registered successfully! Redirecting to your provider dashboard...");
      setTimeout(() => {
        router.push("/hotel/dashboard");
      }, 1500);
    } catch (err: any) {
      console.error("Provider registration error:", err);
      setError(err?.message || "Failed to register property. Please check details and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--cream)] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-10 h-10 bg-[var(--forest)] rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Hotel className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-xl font-extrabold text-[var(--charcoal)] tracking-tight block">Wanderly</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--teal)] -mt-1 block">Provider Portal</span>
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--charcoal)] tracking-tight">
            Partner with Wanderly — List Your Property
          </h1>
          <p className="text-[var(--slate)] text-sm mt-1 max-w-lg mx-auto">
            Reach thousands of travelers and get recommended by our AI trip planner. Register your hotel, homestay, hostel, or resort today.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-[var(--light-sage)] rounded-2xl shadow-sm p-6 sm:p-8">
          {error && (
            <div className="bg-[var(--error-bg)] border border-[var(--error)]/30 text-[var(--error)] text-sm p-4 rounded-xl mb-6 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Registration Alert</p>
                <p className="text-xs mt-0.5">{error}</p>
                {error.includes("already registered") && (
                  <div className="mt-2">
                    <Link
                      href="/hotel/login"
                      className="inline-flex items-center gap-1 text-xs font-bold underline hover:opacity-80"
                    >
                      Go to Stay Provider Login →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm p-4 rounded-xl mb-6 flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Welcome aboard!</p>
                <p className="text-xs">{successMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Property Type Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--forest)] mb-2.5">
                1. Select Accommodation Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {PROPERTY_TYPES.map((pt) => {
                  const isSelected = propertyType === pt.id;
                  const Icon = pt.icon;
                  return (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => setPropertyType(pt.id)}
                      className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[var(--forest)] text-white border-[var(--forest)] shadow-xs"
                          : "bg-white text-[var(--charcoal)] border-[var(--light-sage)] hover:border-[var(--emerald)]"
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 text-[10px] font-black text-emerald-200">✓</span>
                      )}
                      <div className="text-lg mb-1">{pt.emoji}</div>
                      <span className="text-xs font-bold block">{pt.label}</span>
                      <span
                        className={`text-[10px] line-clamp-1 mt-0.5 ${
                          isSelected ? "text-emerald-100" : "text-[var(--slate)]"
                        }`}
                      >
                        {pt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Business & Owner Info */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--forest)] mb-2.5">
                2. Owner & Property Credentials *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-medium text-[var(--charcoal-80)] mb-1">
                    Property / Business Name *
                  </span>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--slate-light)]" />
                    <input
                      type="text"
                      className="input-field pl-10"
                      placeholder="e.g. Royal Heritage Resort"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-medium text-[var(--charcoal-80)] mb-1">
                    Owner / Authorized Manager Name *
                  </span>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--slate-light)]" />
                    <input
                      type="text"
                      className="input-field pl-10"
                      placeholder="e.g. Rajesh Kumar"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-medium text-[var(--charcoal-80)] mb-1">
                    Business Contact Email *
                  </span>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--slate-light)]" />
                    <input
                      type="email"
                      className="input-field pl-10"
                      placeholder="owner@royalresort.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-medium text-[var(--charcoal-80)] mb-1">
                    Phone / WhatsApp Number *
                  </span>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--slate-light)]" />
                    <input
                      type="tel"
                      className="input-field pl-10"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Location & Address */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--forest)] mb-2.5">
                3. Property Location & Map Coordinates *
              </label>
              <div className="space-y-3">
                <div>
                  <span className="block text-xs font-medium text-[var(--charcoal-80)] mb-1">
                    Street Address *
                  </span>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Plot No. 42, Beach Road, Calangute"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="block text-xs font-medium text-[var(--charcoal-80)] mb-1">City / Town *</span>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Goa"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-[var(--charcoal-80)] mb-1">State / Province *</span>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Goa"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-[var(--charcoal-80)] mb-1">Country *</span>
                    <input
                      type="text"
                      className="input-field"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="block text-[11px] font-medium text-[var(--slate)] mb-1">
                      Latitude (approx map coordinate)
                    </span>
                    <input
                      type="text"
                      className="input-field text-xs font-mono"
                      placeholder="15.2993"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-medium text-[var(--slate)] mb-1">
                      Longitude (approx map coordinate)
                    </span>
                    <input
                      type="text"
                      className="input-field text-xs font-mono"
                      placeholder="74.1240"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Short Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--forest)] mb-2.5">
                4. Property Highlights & Description
              </label>
              <textarea
                rows={3}
                className="input-field py-2.5 text-xs sm:text-sm leading-relaxed"
                placeholder="Describe your property, views, signature experiences, and amenities (swimming pool, complimentary breakfast, quiet garden, etc.)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* 5. Account Security Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--forest)] mb-2.5">
                5. Create Provider Password *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-medium text-[var(--charcoal-80)] mb-1">Password *</span>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--slate-light)]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="input-field pl-10 pr-10"
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--slate-light)] hover:text-[var(--charcoal)]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-medium text-[var(--charcoal-80)] mb-1">Confirm Password *</span>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--slate-light)]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="input-field pl-10"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Notice */}
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Verification Policy:</strong> Upon registration, your listing is placed in{" "}
                <span className="font-bold text-amber-800">🟡 Pending Verification</span>. Wanderly administrators
                review property details for traveler safety. Once approved (🟢), it will immediately appear on the Stays
                discovery page and in AI recommendations!
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || Boolean(successMessage)}
              className="btn-primary w-full py-4 justify-center text-sm font-bold shadow-md cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating Provider Account &amp; Listing...
                </>
              ) : (
                <>
                  Register Property &amp; Access Dashboard
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </button>
          </form>

          {/* Existing Provider link */}
          <div className="mt-6 pt-5 border-t border-[var(--light-sage)] text-center">
            <p className="text-xs text-[var(--slate)]">
              Already registered as an accommodation provider?{" "}
              <Link href="/hotel/login" className="text-[var(--forest)] font-bold hover:underline">
                Sign in to Provider Dashboard
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
