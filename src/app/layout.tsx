import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wanderly — Modern Travel Planner & Itinerary Builder",
  description:
    "Plan your ideal journeys with day-by-day itineraries, smart multi-currency budget tracking, interactive maps, and verified accommodations.",
  keywords: ["travel planner", "itinerary builder", "trip planning", "travel budgeting", "holiday itinerary"],
  authors: [{ name: "Wanderly" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--cream)] text-[var(--charcoal)]">
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
