# Itineraya — PRODUCT.md

## What it is
Web app for AI-powered trip planning. A traveler describes a trip (destination, dates, pace, budget, tastes) and gets a complete day-by-day itinerary with real venues, schedules, transport lines, maps, images and shareable postcards.

## Register
`product` — app UI. Design serves the product. The public landing (`/`) and `/explore` are the only brand/marketing surfaces.

## Users
Spanish-first travelers (i18n es/en/fr/pt) planning city trips. Plans: free (2 itineraries), viajero (5/month + AI assistant), explorador (unlimited).

## Core flows
1. Onboarding wizard (8 steps) → trip created → itinerary generated with Claude Haiku → `/my-trip/$tripId`.
2. Dashboard: trip list, 3D globe with the user's destinations, calendar, seasonal inspiration.
3. Explore feed: public itineraries, ratings, remix.
4. Share: public trip pages, day postcards (PNG), tripmates invites.

## Visual identity
See DESIGN.md. White/slate-50 canvas, dark sky-950→sky-900 gradient headers, single brand voltage #1E6B9A, Outfit display over Inter body, photography-led, one shadow tier, rounded-2xl surfaces. Dark artifacts (postcards, visual maps) use dark navy `#050b16`/`#0b1a2e` with sky-400 `#38bdf8` accents.

## Constraints
- TanStack Start + React 19 + Tailwind v4 + shadcn/ui + framer-motion.
- All user-facing strings via i18next (`es.json`, `en.json`).
- Anonymous Supabase client on the client; server functions in `*.functions.ts`.
- Production DB may lag migrations — client code must degrade gracefully when optional columns are missing.
