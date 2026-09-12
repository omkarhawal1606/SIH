# 🌍 Wanderly — AI Travel Planner & Itinerary Builder

A modern, advisor-grade AI travel planning engine built with **Next.js 16**, **Tailwind CSS 4**, **Supabase**, and **Google Gemini AI**.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Gemini](https://img.shields.io/badge/Google_Gemini-AI-blue?logo=google)
![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

---

## ✨ Features

### 🤖 1. AI Trip Architect & Fallback Engine
- **Multi-Day Schedules**: Generates granular, day-by-day itineraries tailored to destination, dates, budget, group size, and personal interests.
- **4-Slot Daily Breakdown**: Organizes every single day into **Morning**, **Afternoon**, **Evening**, and **Night** slots with recommended places, activities, and transport suggestions.
- **Model Fallback Pipeline**: Resilient architecture cascading across Gemini models (`gemini-3.6-flash`, `gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-2.0-flash`) for high availability.

### 🗺️ 2. Interactive Geo-Mapping (Leaflet)
- **Visual Travel Route**: Interactive map powered by Leaflet & OpenStreetMap displaying exact pinned coordinates for hotels and planned activities.
- **Color-Coded Markers**: Gold markers for accommodations and forest green markers for activities with detailed popups.
- **Direct Navigation**: One-click Google Maps links for turn-by-turn navigation.

### ✏️ 3. Inline Itinerary Customizer
- **Interactive Editing**: Add, update, or remove activities directly inside any daily time slot with instant database synchronization.
- **Custom Notes & Transport**: Modify travel modes (walking, metro, taxi) and locations on the fly.

### 📅 4. Calendar Sync (.ics Export)
- **One-Click Calendar Integration**: Export your full schedule to standard `.ics` format, compatible with **Google Calendar**, **Apple Calendar**, and **Microsoft Outlook**.

### 💰 5. Multi-Currency Engine & Dedicated Converter
- **Global Currency Support**: Native support for **INR (₹)**, **USD ($)**, **EUR (€)**, **GBP (£)**, **AED (د.إ)**, and **JPY (¥)**.
- **Standalone Converter Tool**: Dedicated `/currency` page for real-time exchange calculations and currency swapping.

### 📊 6. Live Expense Tracker & Budget Health
- **Categorized Expense Logging**: Log actual spending against planned budget across Hotel, Food, Transport, Activity, Shopping, and Other.
- **Real-Time Visuals**: Interactive doughnut cost breakdown charts via Chart.js and progress bars with over-budget alerts.

### 🔗 7. Public Trip Sharing & QR Codes
- **Shareable Web Links**: Generate secure public URLs (`/shared-trip/[token]`) for friends, family, or travel companions without requiring login.
- **Instant QR Code Generation**: Dynamically rendered QR codes for quick mobile scanning.
- **Access Control**: Instant toggle between public and private visibility, plus token regeneration.

### 🏨 8. 3-Tier Hotel Scout
- **Curated Accommodations**: Recommends 3 distinct tiers (**Budget**, **Mid-Range**, and **Luxury**) complete with ratings, descriptions, coordinates, and nightly pricing.

### 🛡️ 9. Security Advisory & Emergency Intel
- **Safety Rating System**: Destination security level detection (**Safe**, **Caution**, **Unsafe**) with interactive advisory modals.
- **Emergency Directory**: Instant access to local Police, Ambulance, and Tourist Helpline hotlines.
- **Seasonal & Packing Intel**: Climate breakdown and recommended packing checklists tailored to travel dates.

### 🌦️ 10. Real-Time Weather Integration
- **Live Weather Data**: Enriched with OpenWeatherMap API for geocoding and daily temperature forecasts.

### 📄 11. Pro PDF Export
- **Printable Travel Blueprint**: Export full itineraries, hotel details, emergency info, and packing lists to clean, formatted PDF documents via `jspdf` and `jspdf-autotable`.

### 🔐 12. Supabase Cloud Authentication & Storage
- **User Accounts**: Cloud authentication with email confirmation, password resets, and session management.
- **PostgreSQL Database**: Cloud persistence for saved trips, expenses, and share tokens.

---

## 🏗️ Architecture & Data Flow

```
User Preferences (Destination, Dates, Budget, Currency, Interests)
                           ↓
               Next.js Route (/api/generate)
                           ↓
  Google GenAI (Gemini Flash Pipeline) + OpenWeatherMap API
                           ↓
             Structured Itinerary JSON Payload
                           ↓
            Supabase Cloud Database (PostgreSQL)
                           ↓
    Interactive Client Components (Leaflet, Chart.js, PDF, ICS)
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── generate/route.ts       # Gemini AI Generation & Weather Enrichment
│   ├── auth/
│   │   └── callback/page.tsx       # Supabase Auth Redirect Handler
│   ├── currency/page.tsx           # Multi-Currency Converter Tool
│   ├── dashboard/page.tsx          # Saved Trips Dashboard
│   ├── login/page.tsx              # Supabase User Login
│   ├── page.tsx                    # Landing Page & Feature Showcase
│   ├── plan/page.tsx               # AI Trip Planning & Generator
│   ├── profile/page.tsx            # User Profile & Security Settings
│   ├── share/[id]/page.tsx         # Trip Sharing Gateway
│   ├── shared-trip/[token]/page.tsx# Public Read-Only Trip View
│   ├── signup/page.tsx             # User Signup & Verification
│   ├── trip/[id]/page.tsx          # Full Trip Management Workspace
│   ├── globals.css                 # Design System & CSS Variables
│   └── layout.tsx                  # Root Layout & Auth Provider
├── components/
│   ├── AdvancedItinerary.tsx       # 4-Slot Schedule & Inline Editor
│   ├── AuthProvider.tsx            # Supabase Auth Context
│   ├── BudgetChart.tsx             # Doughnut Chart Visualization
│   ├── EmailConfirmModal.tsx       # Signup Email Verification Notice
│   ├── ExpenseTracker.tsx          # Live Expense Logging & Category Tracking
│   ├── ExportPDF.tsx               # Client-Side PDF Generation
│   ├── HotelGrid.tsx               # 3-Tier Accommodation Cards
│   ├── Navbar.tsx                  # Global Navigation Bar
│   ├── QuickInfoSection.tsx        # Emergency & Packing Summary
│   ├── SecurityAdvisoryModal.tsx   # Destination Safety Alert Modal
│   ├── ShareTrip.tsx               # Public Sharing & QR Code Modal
│   ├── TripForm.tsx                # Trip Creation Form with Validation
│   └── TripMap.tsx                 # Leaflet Geo-Map Component
└── lib/
    ├── currency.ts                 # Multi-Currency Helpers & Exchange Rates
    ├── db.ts                       # Supabase Data Access Layer & CRUD
    ├── supabase.ts                 # Supabase Client Initialization
    ├── types.ts                    # TypeScript Interfaces & Enums
    └── weather.ts                  # OpenWeatherMap Integration
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18.0 or higher
- **npm** or **yarn** / **pnpm**

### 2. Environment Variables
Create a `.env.local` file in the project root:

```env
# Google Gemini API Key (https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# OpenWeatherMap API Key (https://openweathermap.org/api)
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Supabase Configuration (https://supabase.com/)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Install Dependencies & Run
```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Tech Stack

| Domain | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| **Generative AI** | [Google GenAI SDK](https://www.npmjs.com/package/@google/genai) (Gemini Flash Models) |
| **Database & Auth** | [Supabase](https://supabase.com/) (`@supabase/supabase-js`) |
| **Interactive Maps** | [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) + Custom CSS Design System |
| **Data Visualization** | [Chart.js](https://www.chartjs.org/) & [react-chartjs-2](https://react-chartjs-2.js.org/) |
| **Calendar Sync** | [ics](https://www.npmjs.com/package/ics) |
| **PDF Generation** | [jspdf](https://www.npmjs.com/package/jspdf) & [jspdf-autotable](https://www.npmjs.com/package/jspdf-autotable) |
| **QR Code Engine** | [qrcode.react](https://www.npmjs.com/package/qrcode.react) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Date Utilities** | [date-fns](https://date-fns.org/) |

---

## 🌐 Deployment

The application is optimized for deployment on **Vercel**:
1. Push your repository to GitHub.
2. Import the project into Vercel.
3. Configure the environment variables in **Settings > Environment Variables**:
   - `GEMINI_API_KEY`
   - `OPENWEATHER_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`
4. Deploy!

