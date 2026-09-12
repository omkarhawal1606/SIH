"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile, type User, type UserProfile } from "@/lib/db";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isProvider: boolean;
  isBanned: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isProvider: false,
  isBanned: false,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const p = await getUserProfile(uid);
      setProfile(p);
      return p;
    } catch {
      setProfile(null);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.uid) {
      await fetchProfile(user.uid);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isOAuthUser = firebaseUser.providerData.some(
          (p) => p.providerId !== "password"
        );
        // If email verified, OAuth, or has a profile in Firestore
        const baseUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || null,
          displayName:
            firebaseUser.displayName ||
            firebaseUser.email?.split("@")[0] ||
            null,
        };

        setUser(baseUser);
        await fetchProfile(firebaseUser.uid);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  const isAdmin = Boolean(
    profile?.role === "admin" ||
    profile?.isAdmin === true ||
    user?.email?.toLowerCase().trim() === "admin@wanderly.com"
  );

  // isProvider: canonical role is "stay_provider"; "hotel_provider" kept for legacy accounts
  const isProvider = Boolean(
    profile?.role === "stay_provider" ||
    profile?.role === "hotel_provider" ||
    profile?.providerInfo
  );

  const isBanned = Boolean(profile?.banned);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isProvider, isBanned, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

