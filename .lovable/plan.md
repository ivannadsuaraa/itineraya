# Plan: Travel Inspiration Flow + Session Persistence

## Part 1: Trip Creation Mode Selector

### New screen before onboarding
Add a route `src/routes/_authenticated/new-trip.tsx` shown when user clicks "Crear viaje". Shows two big cards:
- ✅ **"Ya sé dónde quiero ir"** → navigates to `/onboarding` (current flow)
- 🌍 **"Ayúdame a elegir destino"** → navigates to `/inspire`

Update all "Crear viaje" buttons in `dashboard.tsx` and landing CTAs to point to `/new-trip` instead of `/onboarding`.

## Part 2: Inspire Flow (`/_authenticated/inspire.tsx`)

Multi-step wizard, same pastel-blue aesthetic as onboarding (reuse card/animation patterns). State machine driven by a **config array** so adding new questions later is trivial:

```ts
// src/lib/inspire/questions.ts
export const INSPIRE_QUESTIONS = [
  { id: 'tripType', type: 'visual-multi', options: [
      { id: 'newyear', label: 'Nochevieja', emoji: '🎆' },
      { id: 'beach', label: 'Playa', emoji: '🏖️' },
      ...10 options
  ]},
  { id: 'region', type: 'single', options: ['spain','europe','anywhere'] },
  { id: 'budget', type: 'single', options: ['low','mid','high'] },
  { id: 'origin', type: 'text' },
  { id: 'duration', type: 'single', options: ['weekend','3-5','week','more'] },
];
```

Renderer maps `type` → component. New question types/criteria add by extending the array + i18n keys.

### After last step
Calls new server fn `suggestDestinations` → returns 3 destinations sorted by score.

## Part 3: AI Destination Suggester

New file `src/lib/inspire.functions.ts`:
```ts
suggestDestinations({ tripType, region, budget, origin, duration })
  → Promise<{ destinations: Array<{ name, country, score, reason, photoQuery }> }>
```
- Uses Lovable AI Gateway (`google/gemini-3-flash-preview`) with structured output (Zod schema, 3 items, score 0-100).
- System prompt enforces: realistic + personalized, avoid overused tourist defaults, factor origin distance vs duration, climate seasonality (current month), budget realism.
- Photos: `https://source.unsplash.com/800x600/?<city>,travel` (free, no key). photoQuery returned by model.

### Results screen
3 cards ranked 🥇🥈🥉, each: image, name, score badge, reason paragraph, button **"Crear itinerario aquí"** → navigates to `/onboarding?prefill=<base64 json>` with `{ destination, budget, duration, tripType }`.

## Part 4: Onboarding Prefill

Modify `src/routes/_authenticated/onboarding.tsx`:
- Read `prefill` search param via `validateSearch`.
- If present, hydrate initial state and **skip** the destination, budget, duration, and trip-style steps. Only ask: exact dates, companions, things to avoid.
- Implement as a `skipSteps: Set<string>` driven by which prefill fields exist — keeps it extensible.

## Part 5: Session Persistence on Landing

Issue: Landing (`/`) doesn't reflect auth state; user appears logged out.

Fix `src/components/landing/Navbar.tsx` and Hero CTAs:
- Already subscribes to `onAuthStateChange`. Verify it also runs `supabase.auth.getSession()` on mount (not just `getUser()`) so SSR→client hydration keeps state.
- When `isLoggedIn`: hide "Iniciar sesión" and "Empezar gratis"; show **"Mis viajes"** → links to `/dashboard`.
- Same change in `HeroSection.tsx` primary CTA: if logged in, label "Ir a mis viajes" → `/dashboard`; else "Empezar gratis" → `/auth?mode=signup`.

Root cause check: confirm `src/integrations/supabase/client.ts` has `persistSession: true` & `autoRefreshToken: true` (it's auto-generated, should be fine — if session loss is real it's just the landing UI not reading session).

## Part 6: i18n

Add ES + EN strings under `inspire.*` and `newTrip.*` namespaces for all new UI.

## Technical Details

**Files created:**
- `src/routes/_authenticated/new-trip.tsx`
- `src/routes/_authenticated/inspire.tsx`
- `src/lib/inspire/questions.ts` (config)
- `src/lib/inspire/types.ts`
- `src/lib/inspire.functions.ts` (server fn, uses Lovable AI Gateway)

**Files edited:**
- `src/routes/_authenticated/onboarding.tsx` (prefill + skip steps)
- `src/routes/_authenticated/dashboard.tsx` (CTA → /new-trip)
- `src/components/landing/Navbar.tsx` (auth-aware CTAs)
- `src/components/landing/HeroSection.tsx` (auth-aware CTA)
- `src/i18n/locales/{es,en}.json`

**AI call:** Lovable AI Gateway via `createLovableAiGatewayProvider`, `generateText` with `Output.object({ schema })`, model `google/gemini-3-flash-preview`. No new secrets needed (`LOVABLE_API_KEY` already provisioned).

**Reusability:** New inspiration types = add object to `INSPIRE_QUESTIONS`. New scoring criteria = extend Zod schema + prompt section. Prefill = add field to map; onboarding auto-skips.

Confirm before I implement?