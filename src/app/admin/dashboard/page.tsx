"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  logout,
  getAccommodationListings,
  saveAccommodationListing,
  updateAccommodationListing,
  deleteAccommodationListing,
  reviewAccommodation,
  getAllProviders,
  updateProviderStatus,
  getAllUsers,
  updateUserStatus,
  type AccommodationListing,
  type AccommodationType,
  type ListingStatus,
  type UserProfile,
  type UserRole,
} from "@/lib/db";
import {
  ShieldCheck,
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
  Loader2,
  AlertTriangle,
  Save,
  X,
  LayoutGrid,
  Filter,
  Users,
  Building,
  Check,
  Ban,
  RotateCcw,
  ExternalLink,
  MessageSquare,
  LogOut,
  MapPin,
  Eye,
  ShieldAlert,
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

const BLANK_LISTING: Omit<AccommodationListing, "id"> = {
  name: "",
  type: "hotel",
  destination: "",
  description: "",
  pricePerNight: 2000,
  rating: 4.5,
  amenities: ["wifi"],
  mealsIncluded: false,
  parking: true,
  wifi: true,
  accessibility: false,
  status: "approved",
  isVerified: true,
};

export default function AdminDashboardPage() {
  const { user, profile, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"approvals" | "providers" | "users" | "analytics">("approvals");

  // Property Listings State
  const [listings, setListings] = useState<AccommodationListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [filterStatus, setFilterStatus] = useState<ListingStatus | "all">("all");
  const [filterType, setFilterType] = useState<AccommodationType | "all">("all");

  // Provider State
  const [providers, setProviders] = useState<UserProfile[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  // Users State
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState<UserRole | "all">("all");
  const [userSearch, setUserSearch] = useState("");
  const [togglingBanUid, setTogglingBanUid] = useState<string | null>(null);

  // Property Modal (Add / Edit)
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [propertyForm, setPropertyForm] = useState<Omit<AccommodationListing, "id">>(BLANK_LISTING);
  const [savingProperty, setSavingProperty] = useState(false);

  // Rejection Reason Modal
  const [rejectingListing, setRejectingListing] = useState<AccommodationListing | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Check Admin Authorization
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/admin/login");
      } else if (!isAdmin) {
        // In local development, if user is logged in, allow temporary admin bootstrap
        // or redirect to login with error
        if (profile?.role !== "admin" && profile?.isAdmin !== true) {
          router.push("/admin/login");
        }
      }
    }
  }, [user, authLoading, isAdmin, profile, router]);

  // Load All Listings
  const loadListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const data = await getAccommodationListings({ adminView: true });
      setListings(data);
    } catch (err) {
      console.error("Failed to load listings:", err);
    } finally {
      setLoadingListings(false);
    }
  }, []);

  // Load All Providers
  const loadProviders = useCallback(async () => {
    setLoadingProviders(true);
    try {
      const data = await getAllProviders();
      setProviders(data);
    } catch (err) {
      console.error("Failed to load providers:", err);
    } finally {
      setLoadingProviders(false);
    }
  }, []);

  // Load All Users
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await getAllUsers();
      setUsersList(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  useEffect(() => {
    if (activeTab === "providers") {
      loadProviders();
    } else if (activeTab === "users" || activeTab === "analytics") {
      loadUsers();
    }
  }, [activeTab, loadProviders, loadUsers]);

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  // Property Review Actions
  const handleApproveProperty = async (listingId: string) => {
    setSubmittingReview(true);
    try {
      await reviewAccommodation(listingId, "approved");
      await loadListings();
    } catch (err) {
      console.error("Approve error:", err);
      alert("Failed to approve property.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSuspendProperty = async (listingId: string) => {
    if (!confirm("Are you sure you want to suspend this property? It will be removed from public search.")) return;
    setSubmittingReview(true);
    try {
      await reviewAccommodation(listingId, "suspended");
      await loadListings();
    } catch (err) {
      console.error("Suspend error:", err);
      alert("Failed to suspend property.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleOpenRejectModal = (listing: AccommodationListing) => {
    setRejectingListing(listing);
    setRejectionReasonInput(
      listing.rejectionReason ||
        "Please provide higher quality photos, verify accurate night pricing, and ensure a valid street address."
    );
  };

  const handleConfirmReject = async () => {
    if (!rejectingListing?.id || !rejectionReasonInput.trim()) return;

    setSubmittingReview(true);
    try {
      await reviewAccommodation(rejectingListing.id, "rejected", rejectionReasonInput.trim());
      setRejectingListing(null);
      await loadListings();
    } catch (err) {
      console.error("Reject error:", err);
      alert("Failed to reject property.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteListing = async (listingId: string, name: string) => {
    if (!confirm(`Permanently delete "${name}" from Wanderly?`)) return;
    try {
      await deleteAccommodationListing(listingId);
      await loadListings();
    } catch (err) {
      console.error("Delete listing error:", err);
    }
  };

  // Provider Status Actions
  const handleProviderStatus = async (
    providerUid: string,
    status: "approved" | "suspended" | "rejected"
  ) => {
    const actionLabel = status === "approved" ? "approve" : status === "suspended" ? "suspend" : "reject";
    if (!confirm(`Are you sure you want to ${actionLabel} this provider?`)) return;

    try {
      await updateProviderStatus(providerUid, status);
      await loadProviders();
    } catch (err) {
      console.error("Update provider error:", err);
    }
  };

  // User Ban/Unban Action
  const handleToggleBan = async (u: UserProfile) => {
    const isBanned = Boolean(u.banned);
    const verb = isBanned ? "unban" : "ban";
    if (!confirm(`Are you sure you want to ${verb} ${u.email || u.uid}?`)) return;
    setTogglingBanUid(u.uid);
    try {
      await updateUserStatus(u.uid, !isBanned);
      setUsersList((prev) =>
        prev.map((x) => (x.uid === u.uid ? { ...x, banned: !isBanned } : x))
      );
    } catch (err) {
      console.error("Toggle ban error:", err);
    } finally {
      setTogglingBanUid(null);
    }
  };

  // Save / Create Property Form
  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyForm.name || !propertyForm.destination) return;

    setSavingProperty(true);
    try {
      if (editingId) {
        await updateAccommodationListing(editingId, propertyForm);
      } else {
        await saveAccommodationListing({
          ...propertyForm,
          createdBy: user?.uid || "admin",
        });
      }
      setShowPropertyModal(false);
      await loadListings();
    } catch (err) {
      console.error("Save property error:", err);
      alert("Failed to save property.");
    } finally {
      setSavingProperty(false);
    }
  };

  // Filtered Listings
  const filteredListings = listings.filter((l) => {
    const matchesStatus = filterStatus === "all" || l.status === filterStatus;
    const matchesType = filterType === "all" || l.type === filterType;
    return matchesStatus && matchesType;
  });

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
    const q = userSearch.toLowerCase();
    const matchesSearch =
      !q ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.displayName || "").toLowerCase().includes(q) ||
      (u.uid || "").toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  // Metrics
  const totalListings = listings.length;
  const approvedListings = listings.filter((l) => l.status === "approved").length;
  const pendingListings = listings.filter((l) => l.status === "pending").length;
  const rejectedListings = listings.filter((l) => l.status === "rejected").length;
  const suspendedListings = listings.filter((l) => l.status === "suspended").length;

  // User metrics
  const totalUsers = usersList.length;
  const travelerCount = usersList.filter((u) => u.role === "traveler" || !u.role).length;
  const providerCount = usersList.filter((u) => u.role === "stay_provider" || u.role === "hotel_provider").length;
  const bannedCount = usersList.filter((u) => Boolean(u.banned)).length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--charcoal)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--cream)] pb-16">
      {/* Admin Top Navigation */}
      <header className="bg-[var(--charcoal)] text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white">Wanderly Admin</span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block -mt-1">
                  Control Center
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-white block">{user?.email}</span>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase">Super Administrator</span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/20 text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--light-sage)]">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("approvals")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "approvals"
                  ? "bg-[var(--charcoal)] text-white shadow-xs"
                  : "bg-white text-[var(--charcoal)] border border-[var(--light-sage)] hover:border-[var(--emerald)]"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Property Approvals &amp; Listings</span>
              {pendingListings > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {pendingListings}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("providers")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "providers"
                  ? "bg-[var(--charcoal)] text-white shadow-xs"
                  : "bg-white text-[var(--charcoal)] border border-[var(--light-sage)] hover:border-[var(--emerald)]"
              }`}
            >
              <Building className="w-4 h-4 text-blue-400" />
              <span>Hotel Providers</span>
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "users"
                  ? "bg-[var(--charcoal)] text-white shadow-xs"
                  : "bg-white text-[var(--charcoal)] border border-[var(--light-sage)] hover:border-[var(--emerald)]"
              }`}
            >
              <Users className="w-4 h-4 text-purple-400" />
              <span>All Users</span>
              {bannedCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {bannedCount} banned
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "analytics"
                  ? "bg-[var(--charcoal)] text-white shadow-xs"
                  : "bg-white text-[var(--charcoal)] border border-[var(--light-sage)] hover:border-[var(--emerald)]"
              }`}
            >
              <Eye className="w-4 h-4 text-[var(--teal)]" />
              <span>Platform Stays Health</span>
            </button>
          </div>

          {activeTab === "approvals" && (
            <button
              onClick={() => {
                setEditingId(null);
                setPropertyForm(BLANK_LISTING);
                setShowPropertyModal(true);
              }}
              className="btn-primary py-2 px-3.5 font-bold text-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Direct Add Listing
            </button>
          )}
        </div>

        {/* ── TAB 1: PROPERTY APPROVALS & LISTINGS ───────────────── */}
        {activeTab === "approvals" && (
          <div className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-4 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--slate)] block">
                  Total Properties
                </span>
                <span className="text-2xl font-black text-[var(--charcoal)] block mt-1">{totalListings}</span>
              </div>

              <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  🟢 Approved &amp; Live
                </span>
                <span className="text-2xl font-black text-emerald-700 block mt-1">{approvedListings}</span>
              </div>

              <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                  🟡 Pending Review
                </span>
                <span className="text-2xl font-black text-amber-700 block mt-1">{pendingListings}</span>
              </div>

              <div className="bg-white border border-red-200 rounded-2xl p-4 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">
                  🔴 Rejected / Needs Revision
                </span>
                <span className="text-2xl font-black text-red-700 block mt-1">{rejectedListings}</span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-[var(--slate)] mr-1">Status:</span>
                {(["all", "pending", "approved", "rejected"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      filterStatus === s
                        ? "bg-[var(--charcoal)] text-white shadow-2xs"
                        : "bg-white text-[var(--charcoal)] border border-[var(--light-sage)] hover:border-[var(--emerald)]"
                    }`}
                  >
                    {s === "all" ? "All Statuses" : s}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[var(--slate)]" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="bg-white border border-[var(--light-sage)] text-xs font-bold text-[var(--charcoal)] rounded-xl px-3 py-1.5 cursor-pointer outline-none"
                >
                  <option value="all">All Categories</option>
                  {(Object.keys(CATEGORY_MAP) as AccommodationType[]).map((typeKey) => (
                    <option key={typeKey} value={typeKey}>
                      {CATEGORY_MAP[typeKey].emoji} {CATEGORY_MAP[typeKey].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Listings Table / Cards */}
            {loadingListings ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-[var(--light-sage)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--charcoal)] mx-auto mb-2" />
                <p className="text-xs font-bold text-[var(--slate)]">Loading accommodation listings...</p>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-[var(--light-sage)]">
                <p className="text-sm font-bold text-[var(--charcoal)]">No listings match the selected filters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredListings.map((listing) => {
                  const cat = CATEGORY_MAP[listing.type] || CATEGORY_MAP.hotel;
                  const CatIcon = cat.icon;

                  return (
                    <div
                      key={listing.id}
                      className={`bg-white border rounded-2xl p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-all shadow-2xs hover:shadow-xs ${
                        listing.status === "pending"
                          ? "border-amber-300 bg-amber-50/20"
                          : listing.status === "rejected"
                          ? "border-red-200"
                          : "border-[var(--light-sage)]"
                      }`}
                    >
                      {/* Left: Info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base">{cat.emoji}</span>
                          <span className="font-bold text-sm text-[var(--charcoal)]">{listing.name}</span>
                          <span className="text-[10px] font-bold text-[var(--forest)] bg-[var(--sage)] px-2 py-0.5 rounded-full">
                            {cat.label}
                          </span>
                          {listing.isVerified && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <ShieldCheck className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[var(--slate)] flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[var(--teal)]" />
                            {listing.destination}
                          </span>
                          <span>·</span>
                          <span className="font-bold text-[var(--charcoal)]">
                            ₹{listing.pricePerNight?.toLocaleString()}/night
                          </span>
                          <span>·</span>
                          <span>⭐ {listing.rating || 4.5}</span>
                          {listing.contact?.phone && (
                            <>
                              <span>·</span>
                              <span>📞 {listing.contact.phone}</span>
                            </>
                          )}
                        </div>

                        <p className="text-xs text-[var(--charcoal-80)] line-clamp-1">{listing.description}</p>

                        {/* Government Stay Notes */}
                        {listing.type === "govt_stay" && (
                          <div className="text-[11px] text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg inline-block">
                            🏛️ Department: <strong>{listing.govtProvider || "Official Tourism Body"}</strong>
                            {listing.bookingUrl && (
                              <a
                                href={listing.bookingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-2 underline font-bold"
                              >
                                Official Portal
                              </a>
                            )}
                          </div>
                        )}

                        {/* Rejection notice preview */}
                        {listing.status === "rejected" && listing.rejectionReason && (
                          <p className="text-[11px] text-red-700 font-medium bg-red-50 p-2 rounded-lg border border-red-200">
                            <strong>Rejection Reason:</strong> {listing.rejectionReason}
                          </p>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 flex-wrap shrink-0 self-end lg:self-center">
                        {/* Status Chip */}
                        {listing.status === "pending" && (
                          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-amber-300 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Pending Review
                          </span>
                        )}
                        {listing.status === "approved" && (
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approved &amp; Live
                          </span>
                        )}
                        {listing.status === "rejected" && (
                          <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-red-300 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" />
                            Rejected
                          </span>
                        )}

                        {/* Review Buttons */}
                        {listing.status !== "approved" && (
                          <button
                            onClick={() => handleApproveProperty(listing.id!)}
                            disabled={submittingReview}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </button>
                        )}

                        {listing.status !== "rejected" && (
                          <button
                            onClick={() => handleOpenRejectModal(listing)}
                            disabled={submittingReview}
                            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteListing(listing.id!, listing.name)}
                          className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: HOTEL PROVIDER MANAGEMENT ─────────────────── */}
        {activeTab === "providers" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--charcoal)]">Registered Accommodation Providers</h2>
                <p className="text-xs text-[var(--slate)]">
                  Review partner hotel owners, homestay hosts, and resort managers.
                </p>
              </div>
              <button
                onClick={loadProviders}
                className="px-3 py-1.5 rounded-xl border border-[var(--light-sage)] text-xs font-bold text-[var(--slate)] hover:text-[var(--charcoal)]"
              >
                Refresh Providers
              </button>
            </div>

            {loadingProviders ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-[var(--light-sage)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--charcoal)] mx-auto mb-2" />
                <p className="text-xs font-bold text-[var(--slate)]">Loading registered providers...</p>
              </div>
            ) : providers.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-[var(--light-sage)]">
                <p className="text-sm font-bold text-[var(--charcoal)]">No registered hotel providers yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map((prov) => {
                  const info = prov.providerInfo;
                  const provStatus = info?.status || "pending";

                  return (
                    <div
                      key={prov.uid}
                      className="bg-white border border-[var(--light-sage)] rounded-2xl p-5 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-sm text-[var(--charcoal)]">
                            {info?.businessName || prov.displayName || "Accommodation Partner"}
                          </h3>
                          <p className="text-xs text-[var(--slate)]">Owner: {info?.ownerName || "Host"}</p>
                        </div>

                        {/* Status Chip */}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            provStatus === "approved"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : provStatus === "suspended"
                              ? "bg-red-100 text-red-800 border border-red-300"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}
                        >
                          {provStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-[var(--slate)] bg-[var(--cream)] p-3 rounded-xl">
                        <div>
                          <span className="block text-[10px] font-bold text-[var(--slate-light)] uppercase">Email</span>
                          <span className="font-medium text-[var(--charcoal)] truncate block">{prov.email}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-[var(--slate-light)] uppercase">Phone</span>
                          <span className="font-medium text-[var(--charcoal)]">{info?.phone || "N/A"}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-[var(--slate-light)] uppercase">Location</span>
                          <span className="font-medium text-[var(--charcoal)]">
                            {info?.city ? `${info.city}, ${info.state}` : "India"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-[var(--slate-light)] uppercase">Category</span>
                          <span className="font-medium text-[var(--charcoal)] capitalize">
                            {info?.propertyType || "hotel"}
                          </span>
                        </div>
                      </div>

                      {/* Admin Provider Action Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--light-sage)]">
                        {provStatus !== "approved" && (
                          <button
                            onClick={() => handleProviderStatus(prov.uid, "approved")}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Approve Provider
                          </button>
                        )}
                        {provStatus !== "suspended" && (
                          <button
                            onClick={() => handleProviderStatus(prov.uid, "suspended")}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Suspend Access
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: ALL USERS ──────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--charcoal)]">Platform Users</h2>
                <p className="text-xs text-[var(--slate)]">Manage traveler accounts, stay providers, and admins.</p>
              </div>
              <button
                onClick={loadUsers}
                className="px-3 py-1.5 rounded-xl border border-[var(--light-sage)] text-xs font-bold text-[var(--slate)] hover:text-[var(--charcoal)] cursor-pointer"
              >
                Refresh
              </button>
            </div>

            {/* User KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-4 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--slate)] block">Total Users</span>
                <span className="text-2xl font-black text-[var(--charcoal)] block mt-1">{totalUsers}</span>
              </div>
              <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">✈️ Travelers</span>
                <span className="text-2xl font-black text-blue-700 block mt-1">{travelerCount}</span>
              </div>
              <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">🏨 Providers</span>
                <span className="text-2xl font-black text-emerald-700 block mt-1">{providerCount}</span>
              </div>
              <div className="bg-white border border-red-200 rounded-2xl p-4 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">🚫 Banned</span>
                <span className="text-2xl font-black text-red-700 block mt-1">{bannedCount}</span>
              </div>
            </div>

            {/* Search & Role Filter */}
            <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-2xs">
              <input
                type="text"
                placeholder="Search by name, email or UID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="input-field text-xs flex-1 min-w-[200px]"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                {(["all", "traveler", "stay_provider", "admin"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setUserRoleFilter(r as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      userRoleFilter === r
                        ? "bg-[var(--charcoal)] text-white shadow-2xs"
                        : "bg-white text-[var(--charcoal)] border border-[var(--light-sage)] hover:border-[var(--emerald)]"
                    }`}
                  >
                    {r === "all" ? "All Roles" : r === "stay_provider" ? "Stay Provider" : r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table */}
            {loadingUsers ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-[var(--light-sage)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--charcoal)] mx-auto mb-2" />
                <p className="text-xs font-bold text-[var(--slate)]">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-[var(--light-sage)]">
                <p className="text-sm font-bold text-[var(--charcoal)]">No users found matching your filters.</p>
              </div>
            ) : (
              <div className="bg-white border border-[var(--light-sage)] rounded-2xl shadow-2xs overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[var(--cream)] border-b border-[var(--light-sage)]">
                      <th className="px-4 py-3 text-left font-extrabold text-[var(--slate)] uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left font-extrabold text-[var(--slate)] uppercase tracking-wider hidden sm:table-cell">Role</th>
                      <th className="px-4 py-3 text-left font-extrabold text-[var(--slate)] uppercase tracking-wider hidden md:table-cell">Joined</th>
                      <th className="px-4 py-3 text-center font-extrabold text-[var(--slate)] uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-right font-extrabold text-[var(--slate)] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--light-sage)]">
                    {filteredUsers.map((u) => {
                      const isBanned = Boolean(u.banned);
                      const isCurrentAdmin = u.uid === user?.uid;
                      const roleLabel =
                        u.role === "stay_provider" || u.role === "hotel_provider"
                          ? "🏨 Stay Provider"
                          : u.role === "admin"
                          ? "🛡️ Admin"
                          : "✈️ Traveler";
                      const joinedDate = u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : "—";

                      return (
                        <tr
                          key={u.uid}
                          className={`transition-colors hover:bg-[var(--cream)]/50 ${
                            isBanned ? "opacity-60 bg-red-50/30" : ""
                          }`}
                        >
                          {/* User info */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                                u.role === "admin" ? "bg-emerald-100 text-emerald-700" :
                                u.role === "stay_provider" || u.role === "hotel_provider" ? "bg-blue-100 text-blue-700" :
                                "bg-[var(--sage)] text-[var(--forest)]"
                              }`}>
                                {(u.displayName || u.email || "U")[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-[var(--charcoal)] block truncate max-w-[180px]">
                                  {u.displayName || u.email || u.uid}
                                </span>
                                {u.displayName && (
                                  <span className="text-[var(--slate)] truncate block max-w-[180px]">{u.email}</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="font-semibold text-[var(--charcoal)]">{roleLabel}</span>
                          </td>

                          {/* Joined */}
                          <td className="px-4 py-3 hidden md:table-cell text-[var(--slate)]">{joinedDate}</td>

                          {/* Status chip */}
                          <td className="px-4 py-3 text-center">
                            {isBanned ? (
                              <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-red-300">
                                <Ban className="w-3 h-3" /> Banned
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            {isCurrentAdmin ? (
                              <span className="text-[10px] font-bold text-[var(--slate)] italic">You</span>
                            ) : u.role === "admin" ? (
                              <span className="text-[10px] font-bold text-emerald-700">Super Admin</span>
                            ) : (
                              <button
                                onClick={() => handleToggleBan(u)}
                                disabled={togglingBanUid === u.uid}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                                  isBanned
                                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300"
                                    : "bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
                                }`}
                              >
                                {togglingBanUid === u.uid ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : isBanned ? (
                                  <><RotateCcw className="w-3 h-3" /> Unban</>
                                ) : (
                                  <><Ban className="w-3 h-3" /> Ban</>  
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="px-4 py-3 border-t border-[var(--light-sage)] bg-[var(--cream)]/50">
                  <span className="text-[10px] font-bold text-[var(--slate)] uppercase tracking-wider">
                    Showing {filteredUsers.length} of {totalUsers} users
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: PLATFORM STAYS HEALTH ─────────────────────── */}
        {activeTab === "analytics" && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[var(--charcoal)]">Platform Accommodation Health</h2>

            {/* Main KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl border border-[var(--light-sage)] bg-white shadow-2xs">
                <span className="text-xs font-bold text-[var(--slate)] uppercase tracking-wider block">Live Rate</span>
                <span className="text-3xl font-black text-emerald-700 block mt-1">
                  {totalListings > 0 ? `${Math.round((approvedListings / totalListings) * 100)}%` : "0%"}
                </span>
                <span className="text-[11px] text-[var(--slate)] mt-1 block">
                  {approvedListings} of {totalListings} approved
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-amber-200 bg-white shadow-2xs">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Pending Queue</span>
                <span className="text-3xl font-black text-amber-600 block mt-1">{pendingListings}</span>
                <span className="text-[11px] text-[var(--slate)] mt-1 block">
                  {pendingListings === 0 ? "Queue clear ✨" : "Awaiting review"}
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-red-200 bg-white shadow-2xs">
                <span className="text-xs font-bold text-red-700 uppercase tracking-wider block">Suspended</span>
                <span className="text-3xl font-black text-red-700 block mt-1">{suspendedListings}</span>
                <span className="text-[11px] text-[var(--slate)] mt-1 block">Hidden from travelers</span>
              </div>

              <div className="p-4 rounded-2xl border border-[var(--light-sage)] bg-white shadow-2xs">
                <span className="text-xs font-bold text-[var(--teal)] uppercase tracking-wider block">AI Sync</span>
                <span className="text-3xl font-black text-[var(--teal)] block mt-1">Active</span>
                <span className="text-[11px] text-[var(--slate)] mt-1 block">Verified listings boosted</span>
              </div>
            </div>

            {/* Breakdown by Category */}
            <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-5 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-[var(--charcoal)] flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-[var(--forest)]" />
                Property Breakdown by Category
              </h3>
              <div className="space-y-2">
                {(Object.keys(CATEGORY_MAP) as AccommodationType[]).map((typeKey) => {
                  const cat = CATEGORY_MAP[typeKey];
                  const count = listings.filter((l) => l.type === typeKey).length;
                  const pct = totalListings > 0 ? Math.round((count / totalListings) * 100) : 0;
                  if (count === 0) return null;
                  return (
                    <div key={typeKey} className="flex items-center gap-3">
                      <span className="text-sm w-5 text-center">{cat.emoji}</span>
                      <span className="text-xs font-bold text-[var(--charcoal)] w-28 shrink-0">{cat.label}</span>
                      <div className="flex-1 bg-[var(--cream)] rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-2.5 bg-[var(--forest)] rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[var(--slate)] w-12 text-right">{count} ({pct}%)</span>
                    </div>
                  );
                })}
                {totalListings === 0 && (
                  <p className="text-xs text-[var(--slate)] text-center py-4">No listings yet.</p>
                )}
              </div>
            </div>

            {/* User & Provider Stats */}
            <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-5 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-[var(--charcoal)] flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                Platform User Statistics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[var(--cream)] border border-[var(--light-sage)] text-center">
                  <span className="text-2xl font-black text-[var(--charcoal)] block">{totalUsers}</span>
                  <span className="text-[10px] font-bold text-[var(--slate)] uppercase tracking-wider block">Total Users</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
                  <span className="text-2xl font-black text-blue-700 block">{travelerCount}</span>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Travelers</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-2xl font-black text-emerald-700 block">{providerCount}</span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Providers</span>
                </div>
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-center">
                  <span className="text-2xl font-black text-red-700 block">{bannedCount}</span>
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Banned</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Rejection Feedback Modal */}
      {rejectingListing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[var(--light-sage)] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-bold text-base text-[var(--charcoal)]">Reject Property Listing</h3>
              </div>
              <button
                onClick={() => setRejectingListing(null)}
                className="p-1 rounded-lg text-[var(--slate)] hover:text-[var(--charcoal)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--slate)] leading-relaxed">
              Provide feedback for <strong className="text-[var(--charcoal)]">"{rejectingListing.name}"</strong>. The
              provider will see this feedback in their dashboard and can make corrections to resubmit.
            </p>

            <textarea
              rows={4}
              className="input-field text-xs leading-relaxed"
              placeholder="e.g. Please upload actual room photos and verify your nightly price..."
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              required
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingListing(null)}
                className="px-3.5 py-2 rounded-xl border border-[var(--light-sage)] text-xs font-bold text-[var(--slate)] hover:bg-[var(--cream)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={submittingReview}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {submittingReview ? "Submitting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Add Property Modal */}
      {showPropertyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[var(--light-sage)] rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--light-sage)]">
              <h3 className="font-bold text-base text-[var(--charcoal)]">Admin Direct Add Property</h3>
              <button
                onClick={() => setShowPropertyModal(false)}
                className="p-1 text-[var(--slate)] hover:text-[var(--charcoal)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProperty} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--forest)] mb-1">
                  Property Name *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Grand Heritage Palace"
                  value={propertyForm.name}
                  onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--forest)] mb-1">
                    Category *
                  </label>
                  <select
                    value={propertyForm.type}
                    onChange={(e) => setPropertyForm({ ...propertyForm, type: e.target.value as any })}
                    className="input-field text-xs font-bold cursor-pointer"
                  >
                    {(Object.keys(CATEGORY_MAP) as AccommodationType[]).map((typeKey) => (
                      <option key={typeKey} value={typeKey}>
                        {CATEGORY_MAP[typeKey].emoji} {CATEGORY_MAP[typeKey].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--forest)] mb-1">
                    Price/Night (INR) *
                  </label>
                  <input
                    type="number"
                    className="input-field font-bold"
                    value={propertyForm.pricePerNight}
                    onChange={(e) => setPropertyForm({ ...propertyForm, pricePerNight: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--forest)] mb-1">
                  Destination / City *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Udaipur, Rajasthan"
                  value={propertyForm.destination}
                  onChange={(e) => setPropertyForm({ ...propertyForm, destination: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--forest)] mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  className="input-field text-xs"
                  placeholder="Property highlights..."
                  value={propertyForm.description}
                  onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--light-sage)]">
                <button
                  type="button"
                  onClick={() => setShowPropertyModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-[var(--light-sage)] text-xs font-bold text-[var(--slate)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProperty}
                  className="btn-primary py-2 px-4 text-xs font-bold shadow-xs cursor-pointer"
                >
                  {savingProperty ? "Saving..." : "Save Listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
