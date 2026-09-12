// Server + Client compatible data layer — Firebase Auth + Firestore
// This replaces the former Supabase integration completely.

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteField,
} from "firebase/firestore";
import { auth, getDb, SITE_URL } from "./firebase";

/**
 * 🚀 DATABASE & AUTH SYSTEM
 * Full Firebase Integration (Firebase Auth + Cloud Firestore).
 */

/**
 * Recursively strips undefined keys and nested undefined values so Firestore doesn't reject them with:
 * "Unsupported field value: undefined"
 */
export function removeUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return obj;
  }
  if (obj instanceof Date) return obj;
  if (obj.constructor && obj.constructor.name !== "Object" && !Array.isArray(obj)) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => removeUndefined(item)) as unknown as T;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = removeUndefined(value);
    }
  }
  return clean as T;
}

// Canonical role set. "hotel_provider" is kept as a legacy alias only for
// backward-compatible Firestore reads; all NEW accounts use "stay_provider".
export type UserRole = "traveler" | "stay_provider" | "hotel_provider" | "admin";

export interface ProviderInfo {
  businessName: string;
  ownerName: string;
  phone: string;
  propertyType: AccommodationType;
  address: string;
  city: string;
  state: string;
  country: string;
  lat?: number;
  lng?: number;
  description: string;
  status: "pending" | "approved" | "suspended" | "rejected";
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  isAdmin?: boolean;
  banned?: boolean;
  providerInfo?: ProviderInfo;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface TripData {
  id?: string;
  userId: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  budget: number;
  people: number;
  interests: string[];
  status: "valid" | "invalid" | "unsafe";
  status_message?: string;
  safety_warning?: string;
  safety_level?: "safe" | "caution" | "unsafe";
  itinerary: any[];
  hotels: any[];
  cost_breakdown: any;
  events: any[];
  emergency: {
    police: string;
    ambulance: string;
    helpline: string;
  };
  season_info: string;
  clothing: string[];
  createdAt?: string;
  currency?: string;
  expenses?: any[];
  isPublic?: boolean;
  publicToken?: string;
  language?: string;
  planningLanguage?: string;
  /** Selected accommodation saved to this trip */
  selectedAccommodation?: any;
  /** Accommodation search preferences */
  accommodationPreferences?: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// Accommodation Listings — Firestore `accommodations` collection
// ─────────────────────────────────────────────────────────────────────────────

export type AccommodationType =
  | "hotel"
  | "homestay"
  | "govt_stay"
  | "hostel"
  | "resort"
  | "guest_house"
  | "eco_stay";

export type TravelGroupType = "solo" | "couple" | "family" | "group";
export type ListingStatus = "pending" | "approved" | "rejected" | "suspended";

export interface AccommodationListing {
  id?: string;
  name: string;
  type: AccommodationType;
  destination: string;
  description: string;
  photos?: string[];
  pricePerNight: number;
  rating?: number;
  lat?: number;
  lng?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  amenities?: string[];
  checkInTime?: string;
  checkOutTime?: string;
  roomTypes?: string[];
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  cancellationPolicy?: string;
  mealsIncluded?: boolean;
  parking?: boolean;
  wifi?: boolean;
  accessibility?: boolean;
  groupTypes?: TravelGroupType[];
  /** Government stay specific */
  govtProvider?: string;
  govtRules?: string;
  govtBookingNote?: string;
  bookingUrl?: string;
  /** Admin & provider review fields */
  status?: ListingStatus;
  isVerified?: boolean;
  reportCount?: number;
  rejectionReason?: string;
  capacity?: number;
  foodDetails?: string;
  houseRules?: string[];
  nearbyAttractions?: string[];
  viewCount?: number;
  inquiryCount?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

// --- Auth Functions (Firebase Auth) ---

export async function loginWithEmail(email: string, password: string) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  // Enforce email verification — sign the user out immediately if not verified
  if (!user.emailVerified) {
    await signOut(auth);
    throw new Error("email not confirmed");
  }
  return { user };
}

export async function signupWithEmail(email: string, password: string) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  // Send verification email. continueUrl takes the user to / (Landing Page) after verification.
  await sendEmailVerification(user, {
    url: `${SITE_URL}/`,
  });
  return { user };
}

export async function logout() {
  await signOut(auth);
}

/**
 * Sign in (or sign up) with Google via a popup.
 * Firebase automatically creates a new account on first sign-in
 * and links to the existing account on subsequent sign-ins.
 * Google users are always email-verified — no verification email needed.
 */
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  // Request profile and email scopes
  provider.addScope("profile");
  provider.addScope("email");
  // Always show account picker so the user can switch accounts
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(auth, provider);
  return { user: result.user };
}

// --- Data Functions (Cloud Firestore) ---
// All data is stored in camelCase directly matching the TripData interface.
// No snake_case mapping needed (unlike Supabase).

export async function saveTrip(trip: TripData): Promise<string> {
  const tripId =
    trip.id || "t_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);

  const currentUser = auth.currentUser;
  const tripToSave: TripData = {
    ...trip,
    userId: currentUser ? currentUser.uid : trip.userId,
    id: tripId,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(getDb(), "trips", tripId), removeUndefined(tripToSave));

  return tripId;
}

export async function updateTrip(
  tripId: string,
  updates: Partial<TripData>
): Promise<boolean> {
  try {
    const sanitizedUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) {
        sanitizedUpdates[key] = deleteField();
      } else {
        sanitizedUpdates[key] = value;
      }
    }
    await updateDoc(doc(getDb(), "trips", tripId), sanitizedUpdates);
    return true;
  } catch (error) {
    console.error("Firestore Update Error:", error);
    return false;
  }
}

export async function getUserTrips(userId: string): Promise<TripData[]> {
  try {
    // Query by userId (single-field query, auto-indexed by Firestore)
    const q = query(
      collection(getDb(), "trips"),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    const trips = snapshot.docs.map((d) => d.data() as TripData);

    // Sort by createdAt descending in-memory to avoid requiring a composite index
    return trips.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Firestore Fetch Error:", error);
    return [];
  }
}

export async function deleteTrip(tripId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(getDb(), "trips", tripId));
    return true;
  } catch (error) {
    console.error("Firestore Delete Error:", error);
    return false;
  }
}

/**
 * Fetch a publicly shared trip by its public token.
 * Only returns the trip if isPublic === true.
 */
export async function getPublicTrip(token: string): Promise<TripData | null> {
  try {
    // Query only by publicToken (it's unique — a UUID per trip).
    // Then verify isPublic in code to avoid requiring a composite index.
    const q = query(
      collection(getDb(), "trips"),
      where("publicToken", "==", token)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const data = snapshot.docs[0].data() as TripData;
    // Guard: only serve trips the owner has explicitly made public
    if (!data.isPublic) return null;

    return data;
  } catch (error) {
    console.error("Firestore Public Token Fetch Error:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Saved Cultural Information — culturalInfo collection with Local Vault Hybrid
// ─────────────────────────────────────────────────────────────────────────────

export interface SavedCulturalInfo {
  /** Composite document ID: {userId}_{slugifiedPlace}_{language}_{tripId|place} */
  id: string;
  userId: string;
  /** "trip" for saved-trip mode, "place" for standalone place exploration */
  mode: "trip" | "place";
  /** Display title — e.g. "Panhala Fort — Heritage & Cultural Dossier" */
  title: string;
  /** The primary place / destination */
  place: string;
  /** Trip ID if mode === "trip" */
  tripId?: string;
  /** ISO language code the content was generated in */
  language: string;
  /** Full CulturalHeritageData stored as a plain object */
  culturalData: any;
  createdAt: string;
  updatedAt: string;
}

const CULTURAL_STORAGE_PREFIX = "wanderly_saved_culture_";

function getLocalCulturalItems(userId: string): SavedCulturalInfo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${CULTURAL_STORAGE_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalCulturalItems(userId: string, items: SavedCulturalInfo[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${CULTURAL_STORAGE_PREFIX}${userId}`, JSON.stringify(items));
  } catch (err) {
    console.warn("[Cultural Vault] Could not save to localStorage:", err);
  }
}

/** Generate a stable, safe document ID from userId + place + language + tripId */
function buildCulturalDocId(
  userId: string,
  place: string,
  language: string,
  tripId?: string
): string {
  const slug = place
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 40);
  const tripPart = tripId ? `_${tripId.slice(-8)}` : "";
  const userPart = userId.slice(0, 10);
  return `${userPart}_${slug}_${language}${tripPart}`;
}

/**
 * Save (or update) a Cultural & Heritage guide.
 * Saves to Local Vault immediately (instant access & offline guarantee)
 * and syncs to Firestore culturalInfo collection.
 * Returns the document ID.
 */
export async function saveCulturalInfo(
  info: Omit<SavedCulturalInfo, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User must be signed in to save cultural info.");

  const docId = buildCulturalDocId(
    currentUser.uid,
    info.place,
    info.language,
    info.tripId
  );

  const now = new Date().toISOString();
  let createdAt = now;

  // Check local storage for existing createdAt
  const localItems = getLocalCulturalItems(currentUser.uid);
  const existingLocal = localItems.find((i) => i.id === docId);
  if (existingLocal?.createdAt) {
    createdAt = existingLocal.createdAt;
  }

  const record: SavedCulturalInfo = {
    id: docId,
    userId: currentUser.uid,
    mode: info.mode,
    title: info.title,
    place: info.place,
    tripId: info.tripId,
    language: info.language,
    culturalData: info.culturalData,
    createdAt,
    updatedAt: now,
  };

  // 1. Guaranteed Local Vault persistence
  const updatedLocal = localItems.filter((i) => i.id !== docId);
  updatedLocal.unshift(record);
  setLocalCulturalItems(currentUser.uid, updatedLocal);

  // 2. Cloud Firestore sync
  try {
    const existingRef = doc(getDb(), "culturalInfo", docId);
    try {
      const { getDoc } = await import("firebase/firestore");
      const existingSnap = await getDoc(existingRef);
      if (existingSnap.exists()) {
        const d = existingSnap.data() as SavedCulturalInfo;
        if (d.createdAt) record.createdAt = d.createdAt;
      }
    } catch {
      // Ignore read error
    }

    await setDoc(doc(getDb(), "culturalInfo", docId), removeUndefined(record));
  } catch (firestoreErr: any) {
    console.warn(
      "[Cultural Vault] Firestore sync note: saved to local vault. If you see 'Missing or insufficient permissions', deploy the updated rules from firestore.rules to your Firebase Console.",
      firestoreErr?.message || firestoreErr
    );
  }

  return docId;
}

/**
 * Fetch all saved cultural guides for the authenticated user.
 * Merges Cloud Firestore records with Local Vault records.
 * Sorted by updatedAt descending (newest first).
 */
export async function getUserCulturalInfo(userId: string): Promise<SavedCulturalInfo[]> {
  const localItems = getLocalCulturalItems(userId);
  let firestoreItems: SavedCulturalInfo[] = [];

  try {
    const q = query(
      collection(getDb(), "culturalInfo"),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    firestoreItems = snapshot.docs.map((d) => d.data() as SavedCulturalInfo);
  } catch (error: any) {
    console.warn("[Cultural Vault] Firestore fetch skipped (using local vault):", error?.message || error);
  }

  // Merge items by ID (giving precedence to Firestore if newer, or keeping local)
  const map = new Map<string, SavedCulturalInfo>();
  for (const item of localItems) {
    map.set(item.id, item);
  }
  for (const item of firestoreItems) {
    map.set(item.id, item);
  }

  return Array.from(map.values()).sort((a, b) => {
    const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return tB - tA;
  });
}

/**
 * Delete a saved cultural guide by document ID from both Local Vault and Firestore.
 */
export async function deleteCulturalInfo(docId: string): Promise<boolean> {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const localItems = getLocalCulturalItems(currentUser.uid);
    const filtered = localItems.filter((i) => i.id !== docId);
    setLocalCulturalItems(currentUser.uid, filtered);
  }

  try {
    await deleteDoc(doc(getDb(), "culturalInfo", docId));
  } catch (error) {
    console.warn("[Cultural Vault] Firestore delete skipped:", error);
  }

  return true;
}

/**
 * Check if a cultural info document already exists for this user+place+language+trip.
 * Returns the doc ID if found, null otherwise.
 */
export async function getCulturalInfoDocId(
  place: string,
  language: string,
  tripId?: string
): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  const docId = buildCulturalDocId(currentUser.uid, place, language, tripId);

  // Check local vault first (instant synchronous check)
  const localItems = getLocalCulturalItems(currentUser.uid);
  if (localItems.some((i) => i.id === docId)) {
    return docId;
  }

  try {
    const { getDoc } = await import("firebase/firestore");
    const snap = await getDoc(doc(getDb(), "culturalInfo", docId));
    return snap.exists() ? docId : null;
  } catch {
    return null;
  }
}

// =============================================================================
// Accommodation Listings — CRUD (Firestore `accommodations` collection)
// =============================================================================

/**
 * Save (create or update) an accommodation listing.
 */
export async function saveAccommodationListing(
  listing: AccommodationListing
): Promise<string> {
  const currentUser = auth.currentUser;
  const listingId =
    listing.id || "acc_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
  const now = new Date().toISOString();
  const toSave: AccommodationListing = {
    ...listing,
    id: listingId,
    createdBy: currentUser?.uid || "admin",
    createdAt: listing.createdAt || now,
    updatedAt: now,
    status: listing.status || "pending",
  };
  await setDoc(doc(getDb(), "accommodations", listingId), removeUndefined(toSave));
  return listingId;
}

/**
 * Update an existing accommodation listing.
 */
export async function updateAccommodationListing(
  listingId: string,
  updates: Partial<AccommodationListing>
): Promise<boolean> {
  try {
    await updateDoc(doc(getDb(), "accommodations", listingId), removeUndefined({
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
    return true;
  } catch (error) {
    console.error("Accommodation update error:", error);
    return false;
  }
}

/**
 * Delete an accommodation listing.
 */
export async function deleteAccommodationListing(listingId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(getDb(), "accommodations", listingId));
    return true;
  } catch (error) {
    console.error("Accommodation delete error:", error);
    return false;
  }
}

/**
 * Fetch accommodation listings with optional filters.
 * Returns only approved listings for public use (unless adminView=true).
 */
export async function getAccommodationListings(filters?: {
  destination?: string;
  type?: AccommodationType;
  adminView?: boolean;
}): Promise<AccommodationListing[]> {
  try {
    const constraints: any[] = [];
    if (!filters?.adminView) {
      constraints.push(where("status", "==", "approved"));
    }
    if (filters?.type) {
      constraints.push(where("type", "==", filters.type));
    }
    const q = query(collection(getDb(), "accommodations"), ...constraints);
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map((d) => d.data() as AccommodationListing);
    // Always sort newest-first so admin sees latest submissions at top
    results = results.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    // Client-side destination filter (case-insensitive substring match)
    if (filters?.destination) {
      const dest = filters.destination.toLowerCase().trim();
      return results.filter((r) =>
        r.destination?.toLowerCase().includes(dest) ||
        r.city?.toLowerCase().includes(dest) ||
        r.state?.toLowerCase().includes(dest)
      );
    }
    return results;
  } catch (error) {
    console.error("Accommodation fetch error:", error);
    return [];
  }
}

/**
 * Save a selected accommodation to an existing trip record.
 */
export async function saveAccommodationToTrip(
  tripId: string,
  accommodation: any
): Promise<boolean> {
  return updateTrip(tripId, { selectedAccommodation: accommodation });
}

/**
 * Remove the selected accommodation from a trip.
 */
export async function removeAccommodationFromTrip(tripId: string): Promise<boolean> {
  try {
    await updateDoc(doc(getDb(), "trips", tripId), {
      selectedAccommodation: deleteField(),
    });
    return true;
  } catch (error) {
    console.error("Remove accommodation error:", error);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 🏨 Hotel Provider & 🛡️ Admin Portal Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Fetch user profile (with role & providerInfo) from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(getDb(), "users", uid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (err) {
    console.error("Failed to get user profile:", err);
    return null;
  }
}

/**
 * Save or update user profile in Firestore
 */
export async function saveUserProfile(profile: UserProfile): Promise<boolean> {
  try {
    await setDoc(doc(getDb(), "users", profile.uid), removeUndefined({
      ...profile,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
    return true;
  } catch (err) {
    console.error("Failed to save user profile:", err);
    return false;
  }
}

export interface RegisterProviderInput {
  email: string;
  password: string;
  ownerName: string;
  businessName: string;
  phone: string;
  propertyType: AccommodationType;
  address: string;
  city: string;
  state: string;
  country: string;
  lat?: number;
  lng?: number;
  description: string;
}

/**
 * Register a new Hotel / Stay Provider:
 * 1. Creates Firebase Auth user account
 * 2. Creates Firestore `users/{uid}` with role: "hotel_provider"
 * 3. Creates the first property listing in `accommodations` with status: "pending"
 */
export async function registerHotelProvider(input: RegisterProviderInput): Promise<{ user: any; listingId: string }> {
  // 1. Create Firebase Auth user or sign in if account was already created (e.g. prior interrupted registration)
  let user: any;
  try {
    const res = await createUserWithEmailAndPassword(auth, input.email, input.password);
    user = res.user;
  } catch (authErr: any) {
    if (authErr.code === "auth/email-already-in-use") {
      try {
        // Interrupted registration or existing user converting to stay provider with same password
        const signInRes = await signInWithEmailAndPassword(auth, input.email, input.password);
        user = signInRes.user;
      } catch (signInErr: any) {
        throw new Error(
          "This email is already registered. If this is your account, please log in at /hotel/login or use a different email address."
        );
      }
    } else if (authErr.code === "auth/weak-password") {
      throw new Error("The password is too weak. Please use at least 6 characters.");
    } else if (authErr.code === "auth/invalid-email") {
      throw new Error("Please enter a valid email address.");
    } else {
      throw authErr;
    }
  }

  const now = new Date().toISOString();

  // 2. Save User Profile in Firestore
  const providerInfo: ProviderInfo = {
    businessName: input.businessName,
    ownerName: input.ownerName,
    phone: input.phone,
    propertyType: input.propertyType,
    address: input.address,
    city: input.city,
    state: input.state,
    country: input.country,
    lat: input.lat,
    lng: input.lng,
    description: input.description,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  const profile: UserProfile = {
    uid: user.uid,
    email: input.email,
    displayName: input.ownerName || input.businessName,
    // Always use the canonical stay_provider role
    role: "stay_provider",
    isAdmin: false,
    providerInfo,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(getDb(), "users", user.uid), removeUndefined(profile), { merge: true });

  // 3. Create initial accommodation listing with status = pending
  const listingId = "acc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
  const initialListing: AccommodationListing = {
    id: listingId,
    name: input.businessName,
    type: input.propertyType,
    destination: `${input.city}, ${input.state}`,
    city: input.city,
    state: input.state,
    country: input.country,
    description: input.description,
    pricePerNight: 2500, // baseline placeholder to be updated by owner in dashboard
    rating: 4.5,
    lat: input.lat,
    lng: input.lng,
    address: input.address,
    amenities: ["wifi"],
    contact: {
      phone: input.phone,
      email: input.email,
    },
    mealsIncluded: false,
    parking: true,
    wifi: true,
    accessibility: false,
    status: "pending",
    isVerified: false,
    viewCount: 0,
    inquiryCount: 0,
    createdBy: user.uid,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(getDb(), "accommodations", listingId), removeUndefined(initialListing));

  return { user, listingId };
}

/**
 * Role-verified login:
 * Logs in with email/password and checks that the user has the required role (or admin).
 */
export async function loginWithRole(
  email: string,
  password: string,
  requiredRole?: UserRole
): Promise<{ user: any; profile: UserProfile | null }> {
  let user: any;
  const cleanEmail = email.trim();
  const isAdminEmail = cleanEmail.toLowerCase() === "admin@wanderly.com";

  try {
    const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
    user = res.user;
  } catch (err: any) {
    // If it's the designated admin and doesn't exist yet, auto-create
    if (isAdminEmail && (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found")) {
      try {
        const createRes = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        user = createRes.user;
      } catch (createErr: any) {
        if (createErr.code === "auth/email-already-in-use") {
          throw new Error("Invalid password for admin@wanderly.com. Please use password: Admin@12345");
        }
        throw createErr;
      }
    } else {
      if (err.code === "auth/invalid-credential" || err.message?.includes("invalid-credential")) {
        throw new Error("Invalid email or password. Please verify your credentials.");
      }
      throw err;
    }
  }

  // Fetch Firestore profile
  let profile: UserProfile | null = null;
  try {
    profile = await getUserProfile(user.uid);
  } catch (err) {
    console.warn("Could not fetch user profile from Firestore:", err);
  }

  // If this is the admin email or admin role
  if (isAdminEmail || requiredRole === "admin") {
    if (!profile) {
      profile = {
        uid: user.uid,
        email: user.email,
        displayName: "Platform Administrator",
        role: "admin",
        isAdmin: true,
        createdAt: new Date().toISOString(),
      };
      try {
        await setDoc(doc(getDb(), "users", user.uid), removeUndefined(profile), { merge: true });
      } catch (e) {
        console.warn("Could not persist admin profile:", e);
      }
    } else {
      profile.role = "admin";
      profile.isAdmin = true;
    }
  } else if (!profile) {
    profile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split("@")[0] || null,
      role: "traveler",
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(getDb(), "users", user.uid), removeUndefined(profile), { merge: true });
    } catch (e) {
      console.warn("Could not persist profile:", e);
    }
  }

  // Check required role
  if (requiredRole) {
    if (requiredRole === "admin") {
      const isSuperAdmin = profile.role === "admin" || profile.isAdmin === true || isAdminEmail;
      if (!isSuperAdmin) {
        await signOut(auth);
        throw new Error("Unauthorized: Administrator credentials required.");
      }
    } else if (requiredRole === "stay_provider" || requiredRole === "hotel_provider") {
      // Accept both stay_provider (canonical) and hotel_provider (legacy alias)
      // Also accept accounts that have providerInfo but an older role value
      const isProvider =
        profile.role === "stay_provider" ||
        profile.role === "hotel_provider" ||
        Boolean(profile.providerInfo);
      if (!isProvider && profile.role !== "admin" && !isAdminEmail) {
        await signOut(auth);
        throw new Error(
          "This account is not registered as a Stay Provider. " +
          "Please register at /hotel/register or use a provider account."
        );
      }
      // Normalize legacy hotel_provider → stay_provider on successful login
      if (profile.role === "hotel_provider") {
        profile.role = "stay_provider";
        try {
          await updateDoc(doc(getDb(), "users", user.uid), { role: "stay_provider", updatedAt: new Date().toISOString() });
        } catch (e) {
          console.warn("Could not normalize provider role:", e);
        }
      }
    }
  }

  return { user, profile };
}

/**
 * Fetch all properties created by a specific provider
 */
export async function getProviderAccommodations(providerUid: string): Promise<AccommodationListing[]> {
  try {
    const q = query(
      collection(getDb(), "accommodations"),
      where("createdBy", "==", providerUid)
    );
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((d) => d.data() as AccommodationListing);
    // Sort newest first
    return list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  } catch (err) {
    console.error("Failed to get provider accommodations:", err);
    return [];
  }
}

/**
 * Resubmit an accommodation after making corrections (resets status to 'pending')
 */
export async function resubmitAccommodation(
  listingId: string,
  updates: Partial<AccommodationListing>
): Promise<boolean> {
  try {
    await updateDoc(doc(getDb(), "accommodations", listingId), removeUndefined({
      ...updates,
      status: "pending",
      rejectionReason: deleteField(),
      updatedAt: new Date().toISOString(),
    }));
    return true;
  } catch (err) {
    console.error("Failed to resubmit accommodation:", err);
    return false;
  }
}

/**
 * Admin: Get all registered stay & hotel providers
 */
export async function getAllProviders(): Promise<UserProfile[]> {
  try {
    const q = query(
      collection(getDb(), "users"),
      where("role", "in", ["stay_provider", "hotel_provider"])
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as UserProfile);
  } catch (err) {
    console.error("Failed to fetch providers:", err);
    return [];
  }
}

/**
 * Admin: Get all registered platform users (travelers, providers, admins)
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(getDb(), "users"));
    const users = snap.docs.map((d) => d.data() as UserProfile);
    return users.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  } catch (err) {
    console.error("Failed to fetch all users:", err);
    return [];
  }
}

/**
 * Admin: Update provider status (approve, suspend, reject)
 */
export async function updateProviderStatus(
  providerUid: string,
  status: "pending" | "approved" | "suspended" | "rejected",
  rejectionReason?: string
): Promise<boolean> {
  try {
    const updates: any = {
      "providerInfo.status": status,
      updatedAt: new Date().toISOString(),
    };
    if (rejectionReason) {
      updates["providerInfo.rejectionReason"] = rejectionReason;
    } else {
      updates["providerInfo.rejectionReason"] = deleteField();
    }
    await updateDoc(doc(getDb(), "users", providerUid), removeUndefined(updates));
    return true;
  } catch (err) {
    console.error("Failed to update provider status:", err);
    return false;
  }
}

/**
 * Admin: Review property listing (Approve or Reject with feedback)
 */
export async function reviewAccommodation(
  listingId: string,
  status: ListingStatus,
  rejectionReason?: string
): Promise<boolean> {
  try {
    const updates: any = {
      status,
      isVerified: status === "approved",
      updatedAt: new Date().toISOString(),
    };
    if (status === "rejected" && rejectionReason) {
      updates.rejectionReason = rejectionReason;
    } else if (status === "approved") {
      updates.rejectionReason = deleteField();
    }
    await updateDoc(doc(getDb(), "accommodations", listingId), removeUndefined(updates));
    return true;
  } catch (err) {
    console.error("Failed to review accommodation:", err);
    return false;
  }
}

/**
 * Admin: Ban or unban a user account (any role)
 */
export async function updateUserStatus(
  uid: string,
  banned: boolean
): Promise<boolean> {
  try {
    await updateDoc(doc(getDb(), "users", uid), {
      banned,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error("Failed to update user status:", err);
    return false;
  }
}
