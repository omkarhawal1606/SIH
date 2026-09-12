"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/components/AuthProvider";
import { User, Shield, Key } from "lucide-react";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return <div className="min-h-screen bg-[var(--cream)]" />;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--cream)]">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--charcoal)] mb-6">
          Profile & Account Settings
        </h1>
        
        <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[var(--forest)] flex items-center justify-center text-white text-2xl font-bold shadow-sm">
              {user.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--charcoal)]">{user.displayName || "Explorer"}</h2>
              <p className="text-sm text-[var(--slate)] font-medium">{user.email}</p>
            </div>
          </div>
          
          <div className="border-t border-[var(--light-sage)] pt-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--forest)] flex items-center gap-2">
              <Shield className="w-4 h-4" /> Account Details
            </h3>
            <div className="bg-[var(--sage)] p-4 rounded-xl space-y-2 border border-[var(--light-sage)]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--slate)] font-medium">User Identifier</span>
                <span className="font-mono text-[var(--charcoal)] bg-white px-2 py-0.5 rounded border border-[var(--light-sage)]">{user.uid}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--slate)] font-medium">Authentication Source</span>
                <span className="text-[var(--forest)] font-semibold">Firebase Auth Verified</span>
              </div>
            </div>
            <p className="text-xs text-[var(--slate)] leading-relaxed">
              Your trips, expenses, and itinerary data are securely backed by your Firebase cloud account.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
