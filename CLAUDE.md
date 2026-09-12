# Wanderly Developer Guide

## 🛠 Project Standards
- **Framework**: Next.js 16 (App Router with Turbopack)
- **Styling**: Tailwind CSS 4 + CSS Design System in `src/app/globals.css`
- **Generative AI**: Google GenAI SDK (`@google/genai`) with resilient multi-model fallback (`gemini-3.6-flash`, `gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-2.0-flash`)
- **Database & Auth**: Supabase PostgreSQL & Auth (`src/lib/supabase.ts`, `src/lib/db.ts`)
- **Maps**: React-Leaflet & OpenStreetMap (`src/components/TripMap.tsx`)
- **Icons**: Lucide React
- **Types**: Strict TypeScript; interfaces defined in `src/lib/types.ts`

## 🚀 Key Commands
- `npm run dev` (or `npm.cmd run dev` on Windows): Start Turbopack development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint checks

## 📂 Architecture Patterns
- **API Routes (`src/app/api/`)**: Handle AI prompt execution, weather enrichment, and sensitive API key access on the server.
- **Client Components**: Use `"use client"` for UI components handling local state, Leaflet maps, Chart.js graphs, QR codes, or Supabase client calls.
- **Data Access Layer (`src/lib/db.ts`)**: Encapsulates all Supabase database queries (`saveTrip`, `updateTrip`, `getUserTrips`, `deleteTrip`, `getPublicTrip`, `loginWithEmail`, `signupWithEmail`, `logout`).
- **Currency Utilities (`src/lib/currency.ts`)**: Universal currency conversion and formatting helpers supporting INR, USD, EUR, GBP, AED, and JPY.
- **Export Utilities**: Client-side PDF generation (`src/components/ExportPDF.tsx`) using `jspdf` / `jspdf-autotable` and iCalendar export (`src/components/AdvancedItinerary.tsx`) using `ics`.

## 🧪 AI Prompting & Schema
Prompts are defined in `src/app/api/generate/route.ts`. When modifying:
- Ensure the JSON schema is strictly maintained with exact $N$-day elements.
- Ensure all 4 daily slots (`morning`, `afternoon`, `evening`, `night`) include `activity`, `place`, `transport`, `lat`, and `lng`.
- Verify 3-tier hotel recommendations (`Budget`, `Mid-Range`, `Luxury`) and safety levels (`safe`, `caution`, `unsafe`).
- Maintain model fallback cascading in case of quota or rate limit exceptions.

## 🎨 Design System
- **Colors**: Use CSS custom variables from `globals.css` (`var(--forest)`, `var(--sage)`, `var(--cream)`, `var(--charcoal)`, `var(--sand)`, etc.).
- **Typography & Glassmorphism**: Clean font hierarchy, subtle borders (`var(--light-sage)`), and backdrop blurs.
- **Responsiveness**: Mobile-first layout structure using standard Tailwind breakpoints.

