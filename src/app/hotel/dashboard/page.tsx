"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  logout,
  getProviderAccommodations,
  saveAccommodationListing,
  updateAccommodationListing,
  deleteAccommodationListing,
  resubmitAccommodation,
  type AccommodationListing,
  type AccommodationType,
  type ListingStatus,
} from "@/lib/db";
import {
  Hotel,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Home,
  Landmark,
  BedDouble,
  TreePine,
  Coffee,
  Leaf,
  LogOut,
  MapPin,
  Eye,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  Loader2,
  X,
  Save,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  Wifi,
  Car,
  Utensils,
  Accessibility,
} from "lucide-react";

const CATEGORY_MAP: Record<AccommodationType, { label: string; icon: React.ElementType; emoji: string }> = {
  hotel: { label: "Hotel", icon: Hotel, emoji: "🏨" },
  homestay: { label: "Homestay", icon: Home, emoji: "🏠" },
  hostel: { label: "Hostel", icon: BedDouble, emoji: "🛏️" },
  govt_stay: { label: "Government Stay", icon: Landmark, emoji: "🏛️" },
  resort: { label: "Resort", icon: TreePine, emoji: "🏕️" },
  guest_house: { label: "Guest House", icon: Coffee, emoji: "🏡" },
  eco_stay: { label: "Eco-Stay", icon: Leaf, emoji: "🌿" },
};

const BLANK_PROPERTY: Omit<AccommodationListing, "id"> = {
  name: "",
  type: "hotel",
  destination: "",
  city: "",
  state: "",
  country: "India",
  description: "",
  pricePerNight: 2500,
  rating: 4.5,
  photos: [],
  amenities: ["wifi"],
  roomTypes: ["Standard Double Room"],
  contact: {
    phone: "",
    email: "",
    website: "",
  },
  mealsIncluded: false,
  parking: true,
  wifi: true,
  accessibility: false,
  cancellationPolicy: "Free cancellation up to 48 hours before check-in",
  capacity: 2,
  status: "pending",
  viewCount: 0,
  inquiryCount: 0,
};

export default function HotelDashboardPage() {
  const { user, profile, loading: authLoading, isProvider, isAdmin, isBanned } = useAuth();
  const router = useRouter();

  const [properties, setProperties] = useState<AccommodationListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ListingStatus | "all">("all");

  // Property Modal (Add / Edit / Resubmit)
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [formData, setFormData] = useState<Omit<AccommodationListing, "id">>(BLANK_PROPERTY);
  const [saving, setSaving] = useState(false);
  const [photoInput, setPhotoInput] = useState("");
  const [roomTypeInput, setRoomTypeInput] = useState("");

  // Auth Protection
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/hotel/login");
      } else if (isBanned) {
        router.push("/hotel/login?error=Your+account+has+been+suspended");
      } else if (!isProvider && !isAdmin) {
        // Logged in user is not a provider
        router.push("/dashboard");
      }
    }
  }, [user, authLoading, isProvider, isAdmin, isBanned, router]);

  // Load provider listings
  const loadProperties = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const list = await getProviderAccommodations(user.uid);
      setProperties(list);
    } catch (err) {
      console.error("Failed to load listings:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.uid) {
      loadProperties();
    }
  }, [user, loadProperties]);

  const handleLogout = async () => {
    await logout();
    router.push("/hotel/login");
  };

  // Metrics
  const totalCount = properties.length;
  const approvedCount = properties.filter((p) => p.status === "approved").length;
  const pendingCount = properties.filter((p) => p.status === "pending").length;
  const rejectedCount = properties.filter((p) => p.status === "rejected").length;
  const totalViews = properties.reduce((acc, p) => acc + (p.viewCount || 0), 0);
  const totalInquiries = properties.reduce((acc, p) => acc + (p.inquiryCount || 0), 0);

  const filteredProperties = properties.filter((p) => {
    if (statusFilter === "all") return true;
    return p.status === statusFilter;
  });

  // Open Add modal
  const openAddModal = () => {
    setEditingId(null);
    setIsResubmitting(false);
    setFormData({
      ...BLANK_PROPERTY,
      contact: {
        phone: profile?.providerInfo?.phone || "",
        email: user?.email || "",
      },
      destination: profile?.providerInfo?.city ? `${profile.providerInfo.city}, ${profile.providerInfo.state}` : "",
      city: profile?.providerInfo?.city || "",
      state: profile?.providerInfo?.state || "",
    });
    setPhotoInput("");
    setRoomTypeInput("");
    setShowModal(true);
  };

  // Open Edit modal
  const openEditModal = (listing: AccommodationListing, resubmitMode = false) => {
    setEditingId(listing.id || null);
    setIsResubmitting(resubmitMode);
    setFormData({
      name: listing.name,
      type: listing.type,
      destination: listing.destination,
      city: listing.city || "",
      state: listing.state || "",
      country: listing.country || "India",
      description: listing.description,
      photos: listing.photos || [],
      pricePerNight: listing.pricePerNight,
      rating: listing.rating || 4.5,
      lat: listing.lat,
      lng: listing.lng,
      address: listing.address,
      amenities: listing.amenities || [],
      checkInTime: listing.checkInTime || "14:00",
      checkOutTime: listing.checkOutTime || "11:00",
      roomTypes: listing.roomTypes || ["Standard Room"],
      contact: listing.contact || {},
      cancellationPolicy: listing.cancellationPolicy || "",
      mealsIncluded: Boolean(listing.mealsIncluded),
      parking: Boolean(listing.parking),
      wifi: Boolean(listing.wifi),
      accessibility: Boolean(listing.accessibility),
      capacity: listing.capacity || 2,
      govtProvider: listing.govtProvider || "",
      govtRules: listing.govtRules || "",
      govtBookingNote: listing.govtBookingNote || "",
      bookingUrl: listing.bookingUrl || "",
      status: listing.status || "pending",
      rejectionReason: listing.rejectionReason,
    });
    setPhotoInput("");
    setRoomTypeInput("");
    setShowModal(true);
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.destination || !formData.pricePerNight) return;

    setSaving(true);
    try {
      if (editingId) {
        if (isResubmitting || formData.status === "rejected") {
          // Provider resubmits after revision: sets status back to 'pending'
          await resubmitAccommodation(editingId, {
            ...formData,
            createdBy: user?.uid,
          });
        } else {
          // Standard update: requires review if critical fields changed
          await updateAccommodationListing(editingId, {
            ...formData,
            status: "pending", // edits trigger re-verification for safety
          });
        }
      } else {
        // Create new property
        await saveAccommodationListing({
          ...formData,
          status: "pending",
          createdBy: user?.uid,
        });
      }
      setShowModal(false);
      await loadProperties();
    } catch (err) {
      console.error("Failed to save property:", err);
      alert("Failed to save property. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    try {
      await deleteAccommodationListing(id);
      await loadProperties();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const addPhoto = () => {
    if (!photoInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      photos: [...(prev.photos || []), photoInput.trim()],
    }));
    setPhotoInput("");
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i) => i !== index),
    }));
  };

  const addRoomType = () => {
    if (!roomTypeInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      roomTypes: [...(prev.roomTypes || []), roomTypeInput.trim()],
    }));
    setRoomTypeInput("");
  };

  const removeRoomType = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      roomTypes: (prev.roomTypes || []).filter((_, i) => i !== index),
    }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--forest)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--cream)] pb-16">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-[var(--light-sage)] sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="w-9 h-9 bg-[var(--forest)] rounded-xl flex items-center justify-center text-white shadow-xs">
                <Hotel className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-black text-[var(--charcoal)] tracking-tight">Wanderly</span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider bg-[var(--sage)] text-[var(--forest)] px-2 py-0.5 rounded-full">
                  Provider Dashboard
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-[var(--charcoal)] block truncate max-w-[200px]">
                {profile?.providerInfo?.businessName || profile?.displayName || user?.email}
              </span>
              <span className="text-[10px] text-[var(--slate)] block">
                {profile?.providerInfo?.city || "Registered Provider"}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--light-sage)] text-xs font-bold text-[var(--slate)] hover:text-[var(--error)] hover:border-[var(--error)]/40 hover:bg-[var(--error-bg)] transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--charcoal)] tracking-tight">
              Property Management Center
            </h1>
            <p className="text-xs sm:text-sm text-[var(--slate)] mt-0.5">
              Manage your listings, review verification statuses, and keep rates updated for travelers.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="btn-primary py-2.5 px-4 font-bold text-xs sm:text-sm shadow-sm flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add New Property
          </button>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total */}
          <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-4 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--slate)] block">
              Total Properties
            </span>
            <span className="text-2xl font-black text-[var(--charcoal)] block mt-1">{totalCount}</span>
          </div>

          {/* Approved */}
          <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider block">Live on Wanderly</span>
            </div>
            <span className="text-2xl font-black text-emerald-700 block mt-1">{approvedCount}</span>
          </div>

          {/* Pending */}
          <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center gap-1 text-amber-700">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider block">Under Review</span>
            </div>
            <span className="text-2xl font-black text-amber-700 block mt-1">{pendingCount}</span>
          </div>

          {/* Rejected */}
          <div className="bg-white border border-red-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center gap-1 text-red-700">
              <XCircle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider block">Action Required</span>
            </div>
            <span className="text-2xl font-black text-red-700 block mt-1">{rejectedCount}</span>
          </div>

          {/* Total Views */}
          <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center gap-1 text-[var(--teal)]">
              <Eye className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider block">Traveler Views</span>
            </div>
            <span className="text-2xl font-black text-[var(--teal)] block mt-1">{totalViews}</span>
          </div>

          {/* Inquiries */}
          <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center gap-1 text-[var(--forest)]">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider block">Guest Inquiries</span>
            </div>
            <span className="text-2xl font-black text-[var(--forest)] block mt-1">{totalInquiries}</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-[var(--slate)] mr-1">Filter:</span>
          {(["all", "approved", "pending", "rejected"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize ${
                statusFilter === st
                  ? "bg-[var(--forest)] text-white shadow-xs"
                  : "bg-white text-[var(--charcoal)] border border-[var(--light-sage)] hover:border-[var(--emerald)]"
              }`}
            >
              {st === "all" ? "All Properties" : st}
            </button>
          ))}
        </div>

        {/* Listings Section */}
        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-[var(--light-sage)]">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--forest)] mx-auto mb-3" />
            <p className="text-xs font-bold text-[var(--slate)]">Loading your properties...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-[var(--light-sage)] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--sage)] text-[var(--forest)] flex items-center justify-center mx-auto">
              <Hotel className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[var(--charcoal)]">No properties found</h3>
            <p className="text-xs text-[var(--slate)] max-w-sm mx-auto">
              {statusFilter === "all"
                ? "You haven't listed any properties yet. Click below to add your first hotel, homestay, or resort!"
                : `No properties currently match the "${statusFilter}" status filter.`}
            </p>
            <button
              onClick={openAddModal}
              className="btn-primary py-2.5 px-4 font-bold text-xs shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Your Property
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProperties.map((prop) => {
              const cat = CATEGORY_MAP[prop.type] || CATEGORY_MAP.hotel;
              const CatIcon = cat.icon;

              return (
                <div
                  key={prop.id}
                  className="bg-white border border-[var(--light-sage)] rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Property Card Header / Image */}
                  <div className="relative h-44 bg-[var(--sage)] overflow-hidden">
                    {prop.photos && prop.photos.length > 0 ? (
                      <img
                        src={prop.photos[0]}
                        alt={prop.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder if broken image
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[var(--forest)] bg-gradient-to-br from-emerald-50 to-[var(--sage)]">
                        <CatIcon className="w-12 h-12 opacity-40 mb-1" />
                        <span className="text-xs font-semibold text-[var(--slate)]">Photo slot available</span>
                      </div>
                    )}

                    {/* Category Chip */}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-extrabold text-[var(--charcoal)] flex items-center gap-1 shadow-xs">
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      {prop.status === "approved" && (
                        <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Live
                        </span>
                      )}
                      {prop.status === "pending" && (
                        <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Under Review
                        </span>
                      )}
                      {prop.status === "rejected" && (
                        <span className="bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Revision Needed
                        </span>
                      )}
                    </div>

                    {/* Price Tag */}
                    <div className="absolute bottom-3 right-3 bg-[var(--charcoal)]/90 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-xs font-black shadow-xs">
                      ₹{prop.pricePerNight?.toLocaleString()}{" "}
                      <span className="text-[10px] font-normal opacity-80">/night</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-[var(--charcoal)] truncate">{prop.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-[var(--slate)] mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[var(--teal)] shrink-0" />
                        <span className="truncate">{prop.destination}</span>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--charcoal-80)] line-clamp-2 leading-relaxed">
                      {prop.description}
                    </p>

                    {/* Rejection Alert Banner with Resubmit Action */}
                    {prop.status === "rejected" && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-2">
                        <div className="flex items-start gap-1.5 font-bold text-red-800">
                          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>Admin Feedback / Reason:</span>
                        </div>
                        <p className="text-[11px] text-red-700 bg-white/70 p-2 rounded-lg border border-red-200">
                          {prop.rejectionReason || "Please review property details and update valid pricing and address."}
                        </p>
                        <button
                          onClick={() => openEditModal(prop, true)}
                          className="w-full py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Revise &amp; Resubmit Listing
                        </button>
                      </div>
                    )}

                    {/* Pending Advice Banner */}
                    {prop.status === "pending" && (
                      <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <span>Our team is verifying this listing. Verification usually completes within 24 hours.</span>
                      </div>
                    )}

                    {/* Amenities Mini-Row */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {prop.wifi && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--forest)] bg-[var(--sage)] px-2 py-0.5 rounded-md">
                          <Wifi className="w-3 h-3" /> WiFi
                        </span>
                      )}
                      {prop.parking && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--forest)] bg-[var(--sage)] px-2 py-0.5 rounded-md">
                          <Car className="w-3 h-3" /> Parking
                        </span>
                      )}
                      {prop.mealsIncluded && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--forest)] bg-[var(--sage)] px-2 py-0.5 rounded-md">
                          <Utensils className="w-3 h-3" /> Meals
                        </span>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-[var(--light-sage)] flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(prop, false)}
                          className="p-2 rounded-lg border border-[var(--light-sage)] text-[var(--charcoal)] hover:bg-[var(--cream)] hover:border-[var(--emerald)] transition-colors cursor-pointer"
                          title="Edit Property"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(prop.id!, prop.name)}
                          className="p-2 rounded-lg border border-[var(--light-sage)] text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer"
                          title="Delete Property"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {prop.status === "approved" && (
                        <Link
                          href={`/stays?destination=${encodeURIComponent(prop.city || prop.destination)}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[var(--teal)] hover:underline"
                        >
                          <span>View on Wanderly</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Property Modal (Add / Edit / Resubmit) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[var(--light-sage)] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--light-sage)]">
              <div>
                <h2 className="text-xl font-black text-[var(--charcoal)]">
                  {editingId
                    ? isResubmitting
                      ? "Revise & Resubmit Property"
                      : "Edit Property Details"
                    : "Add New Property Listing"}
                </h2>
                <p className="text-xs text-[var(--slate)]">
                  {isResubmitting
                    ? "Update the necessary fields per admin feedback and submit for re-verification."
                    : "Fill in property details, facilities, and pricing."}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg text-[var(--slate)] hover:text-[var(--charcoal)] hover:bg-[var(--cream)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProperty} className="space-y-5">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--forest)] mb-1.5">
                  Accommodation Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(CATEGORY_MAP) as AccommodationType[]).map((typeKey) => {
                    const c = CATEGORY_MAP[typeKey];
                    const isSel = formData.type === typeKey;
                    return (
                      <button
                        key={typeKey}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: typeKey })}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                          isSel
                            ? "bg-[var(--forest)] text-white border-[var(--forest)] shadow-2xs"
                            : "bg-white text-[var(--charcoal)] border-[var(--light-sage)] hover:border-[var(--emerald)]"
                        }`}
                      >
                        <span>{c.emoji}</span>
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Property Name & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--forest)] mb-1.5">
                    Property Name *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Whispering Pines Homestay"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--forest)] mb-1.5">
                    Price per Night (INR) *
                  </label>
                  <input
                    type="number"
                    min={200}
                    max={500000}
                    className="input-field font-bold"
                    placeholder="2500"
                    value={formData.pricePerNight}
                    onChange={(e) => setFormData({ ...formData, pricePerNight: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              {/* Destination & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--forest)] mb-1.5">
                    Destination / City *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Manali, Himachal Pradesh"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--forest)] mb-1.5">
                    Guest Capacity
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    className="input-field font-bold"
                    value={formData.capacity || 2}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--forest)] mb-1.5">
                  Detailed Address
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Near Mall Road, Club House Road"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--forest)] mb-1.5">
                  Description &amp; Highlights *
                </label>
                <textarea
                  rows={3}
                  className="input-field py-2 text-xs leading-relaxed"
                  placeholder="Describe your property, mountain or beach views, home-cooked food, and atmosphere..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              {/* Photos List */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--forest)] mb-1.5">
                  Property Photos (Image URLs)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    className="input-field text-xs flex-1"
                    placeholder="https://example.com/photo.jpg"
                    value={photoInput}
                    onChange={(e) => setPhotoInput(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={addPhoto}
                    className="px-3 py-2 bg-[var(--forest)] text-white text-xs font-bold rounded-xl hover:bg-[var(--forest-dark)]"
                  >
                    Add URL
                  </button>
                </div>
                {formData.photos && formData.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {formData.photos.map((url, i) => (
                      <div
                        key={i}
                        className="relative w-20 h-16 rounded-lg overflow-hidden border border-[var(--light-sage)] group"
                      >
                        <img src={url} alt="property" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Amenities Toggles */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--forest)] mb-2">
                  Available Facilities &amp; Amenities
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: "wifi", label: "Free Wi-Fi", icon: Wifi },
                    { key: "parking", label: "Free Parking", icon: Car },
                    { key: "mealsIncluded", label: "Meals Included", icon: Utensils },
                    { key: "accessibility", label: "Accessible", icon: Accessibility },
                  ].map((am) => {
                    const Icon = am.icon;
                    const val = Boolean((formData as any)[am.key]);
                    return (
                      <button
                        key={am.key}
                        type="button"
                        onClick={() => setFormData({ ...formData, [am.key]: !val })}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                          val
                            ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                            : "bg-white border-[var(--light-sage)] text-[var(--slate)] hover:border-[var(--emerald)]"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{am.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Government Stay Specific Fields (conditional) */}
              {formData.type === "govt_stay" && (
                <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <Landmark className="w-4 h-4 text-blue-700" />
                    <span>Government Stay / Official Tourism Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[11px] font-medium text-blue-900 mb-1">
                        Govt Department / Tourism Board
                      </span>
                      <input
                        type="text"
                        className="input-field text-xs bg-white"
                        placeholder="e.g. KTDC, RTDC, HPTDC, Youth Hostel Assoc"
                        value={formData.govtProvider || ""}
                        onChange={(e) => setFormData({ ...formData, govtProvider: e.target.value })}
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] font-medium text-blue-900 mb-1">
                        Official Booking URL
                      </span>
                      <input
                        type="url"
                        className="input-field text-xs bg-white"
                        placeholder="https://online.ktdc.com"
                        value={formData.bookingUrl || ""}
                        onChange={(e) => setFormData({ ...formData, bookingUrl: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-[var(--light-sage)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[var(--light-sage)] text-xs font-bold text-[var(--slate)] hover:bg-[var(--cream)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary py-2.5 px-5 font-bold text-xs shadow-md cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {isResubmitting ? "Submit for Re-Verification" : "Save Listing"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
