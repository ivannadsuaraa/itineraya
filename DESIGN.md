---
version: alpha
name: Itineraya-design-system
description: A warm, photography-led travel marketplace anchored on white/slate-50 canvases and a single brand voltage — sky-900/#1E6B9A — carrying every primary CTA, active nav state, and price/tag chip. Structurally inspired by Airbnb's restraint (one shadow tier, soft rounded shapes, modest type weights, photography over typographic muscle) adapted to Itineraya's own sky-blue identity — never Airbnb's Rausch red. Dark sky-950→sky-900 gradient headers open every major screen; content below sits on a flat slate-50/white floor. Type runs Outfit (display) over Inter (body) at modest weights — headlines trust hero photography and generous whitespace, not heavy font weight, to carry hierarchy.

colors:
  primary: "#1E6B9A"
  primary-hover: "#15577E"
  sky-50: "oklch(0.972 0.009 232.363)"
  sky-100: "oklch(0.951 0.014 247.972)"
  sky-200: "oklch(0.901 0.03 232)"
  sky-600: "oklch(0.575 0.051 235.178)"
  sky-700: "oklch(0.502 0.08 233.657)"
  sky-800: "oklch(0.346 0.074 256.04)"
  sky-900: "oklch(0.255 0.062 255.532)"
  sky-950: "oklch(0.19 0.05 255)"
  canvas: "#ffffff"
  surface-soft: "#f8fafc"
  ink: "#0c4a6e"
  body: "#334155"
  muted: "#64748b"
  hairline: "#e2e8f0"
  on-primary: "#ffffff"
  success: "#059669"
  warning: "#d97706"
  error: "#dc2626"
  scrim: "#000000"

typography:
  display-hero:
    fontFamily: "'Outfit', ui-sans-serif, system-ui, sans-serif"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  display-lg:
    fontFamily: "'Outfit', ui-sans-serif, system-ui, sans-serif"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.01em
  display-md:
    fontFamily: "'Outfit', ui-sans-serif, system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.2
  title-md:
    fontFamily: "'Outfit', ui-sans-serif, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.25
  body-md:
    fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
  caption:
    fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.3
  uppercase-tag:
    fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif"
    fontSize: 10px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.08em
    textTransform: uppercase
  button-md:
    fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.25

rounded:
  none: 0px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  full: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 64px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: 12px 24px
    height: 44px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: 12px 24px
    height: 44px
    border: "1px solid {colors.sky-200}"
  search-bar-pill:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.full}"
    height: 56px
    padding: 16px 24px
    border: "1px solid {colors.sky-200}"
  destination-card:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.md}"
    aspectRatio: "4:5"
  destination-card-tag:
    backgroundColor: "rgba(255,255,255,0.9)"
    textColor: "{colors.ink}"
    typography: "{typography.uppercase-tag}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  trip-card:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.md}"
    aspectRatio: "4:3"
  save-heart-button:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.full}"
    height: 32px
  day-card:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.md}"
    padding: 16px
  activity-row:
    backgroundColor: transparent
    typography: "{typography.body-sm}"
    padding: 12px 0
  budget-slider-track:
    backgroundColor: "{colors.sky-200}"
    rounded: "{rounded.full}"
    height: 6px
  budget-slider-thumb:
    backgroundColor: "{colors.canvas}"
    border: "2.5px solid {colors.primary}"
    rounded: "{rounded.full}"
  bottom-nav:
    backgroundColor: "rgba(255,255,255,0.98)"
    height: 64px
  dark-header:
    backgroundColor: "linear-gradient(to bottom, {colors.sky-950}, {colors.sky-900})"
---

## Overview

Itineraya is a photography-led AI travel-itinerary product. The floor is **white / slate-50** (`{colors.canvas}` / `{colors.surface-soft}`) for content bodies, with a signature **dark sky-950→sky-900 gradient header** (`{component.dark-header}`) opening every major screen (landing hero, dashboard, profile, pricing, saved). A single brand voltage — **sky-900 / #1E6B9A** — carries every primary CTA, active nav underline, price chip, and progress indicator. There is no secondary brand color: budget tiers, category chips, and status badges reuse the same sky ramp at different steps, never an unrelated hue.

Type runs **Outfit** for display (headlines, card titles, section heads) over **Inter** for body/UI text — the same contrast-pair logic as most premium consumer apps (geometric display + humanist body). Display weights stay in the 700 range but sizes stay modest (20–36px) versus SaaS-scale 48px+ heroes: the product trusts destination photography (hero images, itinerary day photos, explore-feed cards) to carry visual weight, the way Airbnb trusts its property photography over typographic muscle.

The shape language is **soft and photography-first**, directly adapted from Airbnb's card grammar: destination and trip cards clip images at `{rounded.md}` (16px), buttons and search bars are fully rounded pills (`{rounded.full}`), and there is effectively **one shadow tier** — a soft `shadow-sm`/`shadow-xl` pair used on hover-float, never a deep multi-layer stack. Depth comes from the dark-header/light-body contrast and photography, not from layered elevation.

**Key characteristics:**
- Single accent color: `{colors.primary}` (#1E6B9A) — every primary CTA, active states, and the map/pin/marker system. Used deliberately, not saturating every surface.
- Dark gradient header (`{component.dark-header}`) as the consistent "screen opener" pattern across authenticated and public pages — landing hero, dashboard, profile, pricing, onboarding steps, saved.
- Photo-first cards everywhere content is browsable: destination cards on the landing page, trip cards on the dashboard, listing cards in the explore feed. All share the same grammar — `{rounded.md}` image clip, gradient-scrim bottom third, uppercase tag chip top-left, meta stack (title + subtitle) bottom-left over the scrim.
- Pill-shaped primary actions (`{rounded.full}`) everywhere a CTA appears — "Start free", "Search", nav active state underline is the one hard-edged exception, matching Airbnb's product-tab underline.
- One elevation tier: flat by default, `shadow-sm` → `shadow-xl` on hover for interactive cards. No deep drop shadows, no glow.
- Generous section rhythm (`{spacing.section}` = 64px between major page bands) but tight card gutters (`{spacing.base}` = 16px) — same "open hero, dense grid below" contrast Airbnb uses for its city-link grid.

## Colors

### Brand
- **Primary** (`{colors.primary}` — #1E6B9A): Every primary CTA, active nav indicator, budget-slider fill, map markers, price/day chips.
- **Primary Hover** (`{colors.primary-hover}` — #15577E): Press/hover state — one step darker, no other transform.

### Surface
- **Canvas** (`{colors.canvas}` — #ffffff): Cards, modals, the default content floor.
- **Surface Soft** (`{colors.surface-soft}` — slate-50): Page background behind cards (dashboard, saved, profile).
- **Dark header** (`{component.dark-header}`): sky-950 → sky-900 gradient, used as the top band on every major screen — the one place the system goes dark.

### Text
- **Ink** (`{colors.ink}` — sky-900): Headlines, card titles, primary body text on light surfaces.
- **Body** (`{colors.body}` — slate-700): Secondary running text, descriptions.
- **Muted** (`{colors.muted}` — slate-500): Captions, timestamps, helper text, disabled states.

### Semantic
- **Success** (`{colors.success}`): Confirmation toasts, "accepted" tripmate status, saved states.
- **Warning** (`{colors.warning}`): Fallback-map notice, plan-limit banners.
- **Error** (`{colors.error}`): Form validation, failed generation states.

## Typography

| Token | Size | Weight | Use |
|---|---|---|---|
| `{typography.display-hero}` | 36px | 700 | Landing hero h1 |
| `{typography.display-lg}` | 28px | 700 | Page headers (dashboard, profile, pricing) |
| `{typography.display-md}` | 20px | 700 | Section heads, card group titles |
| `{typography.title-md}` | 16px | 700 | Card titles (destination name, trip name) |
| `{typography.body-md}` | 16px | 400 | Default running text |
| `{typography.body-sm}` | 14px | 400 | Card meta, dates, activity descriptions |
| `{typography.caption}` | 12px | 600 | Labels, stat captions |
| `{typography.uppercase-tag}` | 10px | 700 | Card tag chips ("PARAÍSO TROPICAL") |
| `{typography.button-md}` | 14px | 600 | Button labels |

Display sizes stay modest (20–36px) versus typical SaaS marketing scale — hero photography and the destination-card grid carry visual weight instead. Card titles (`{typography.title-md}`) are the loudest text inside any card; everything else in a card is body-sm or caption.

## Layout

- **Base spacing unit:** 4px, scale at `{spacing.xxs}` 2px · `{spacing.xs}` 4px · `{spacing.sm}` 8px · `{spacing.md}` 12px · `{spacing.base}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 64px.
- **Section rhythm:** `{spacing.section}` (64px) between major page bands on the landing page and dashboard; card grids compress to `{spacing.base}` (16px) gutters.
- **Max content width:** ~1280px on marketing/feed pages (`max-w-6xl`/`max-w-7xl`), narrower `max-w-2xl` on single-column flows (profile, saved empty state, onboarding steps).
- **Card grids:** `sm:grid-cols-2 lg:grid-cols-3` or `lg:grid-cols-4` depending on card aspect ratio — destination cards (4:5) run 4-up desktop, trip/saved cards (4:3) run 3-up desktop.

## Elevation

Effectively **one shadow tier**, matching Airbnb's discipline:
- **Flat (no shadow):** page floors, dark headers, form fields at rest.
- **Interactive float:** `shadow-sm` at rest → `shadow-xl`/`shadow-lg` on hover for destination/trip cards, plus a subtle `-translate-y-0.5`. This is the single interactive-elevation definition used everywhere a card is clickable.
- **Modal scrim:** `{colors.scrim}` at ~40-60% opacity with backdrop-blur, used on auth modal, share dialog, tripmates modal.

No progressive elevation ladder beyond this. Depth reads from the dark-header/light-body contrast and photography, not from stacked shadows.

## Components

### Buttons
**`button-primary`** — sky-900/#1E6B9A fill, white text, fully rounded (`{rounded.full}`), 44px height. The universal CTA: "Start free", "Save", "Reserve"-equivalent actions across the app.
**`button-secondary`** — white fill, sky-900 text, 1px sky-200 border, fully rounded. Used for secondary actions beside a primary CTA.

### Cards (destination / trip / explore)
Photo-first, directly adapted from Airbnb's `property-card`: image clipped at `{rounded.md}` (16px), bottom-to-top black gradient scrim, uppercase tag chip top-left (`{component.destination-card-tag}`), title + meta stacked bottom-left in white over the scrim, optional save/heart icon top-right (`{component.save-heart-button}`). Hover: `scale-110` on the image, `shadow-xl` on the card.

### Search
**`search-bar-pill`** — white, fully rounded, 56px height, 1px sky-200 border, focus ring in sky-100. Used by `DestinationAutocomplete` and the explore-feed destination search.

### Itinerary
**`day-card`** — white card, `{rounded.md}`, 16px padding, holding a day header (title + subtitle) and a stack of `{component.activity-row}` entries (time chip + emoji + title + description, transport line prefixing non-first activities).
**`budget-slider-track`/`budget-slider-thumb`** — dual-thumb range, sky-200 track with sky-900 fill between thumbs, white thumb with 2.5px sky-900 border.

### Navigation
**`dark-header`** — the consistent screen-opener across the whole app.
**`bottom-nav`** — white/98% opacity, blurred, fixed bottom on mobile; sky-900 active-icon + label with a small pill indicator above the active item (Airbnb's underline-tab pattern, adapted to a bottom bar).

## Responsive Behavior

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 640px | Bottom tab bar (6 items) replaces desktop top nav; card grids collapse to 1-column; dark header padding compresses. |
| Tablet | 640–1024px | Card grids 2-up; desktop top nav appears at `md:`. |
| Desktop | 1024–1280px | Card grids 3–4 up depending on aspect ratio; max content width caps at 1280px. |
| Wide | > 1280px | Content width holds at 1280px; gutters absorb remaining space. |

### Touch Targets
- Primary CTAs minimum 44×44px.
- Bottom-nav tap targets ≥48px tall (py-3 on a 10px icon + label stack).
- Save/heart buttons on cards: 32×32px, matching Airbnb's density trade-off.

## Known Gaps

- **Dark mode:** not implemented anywhere in the app; this system assumes light-canvas only, same as Airbnb's public web.
- **Skeleton/loading states:** inconsistent across pages — some routes (saved, dashboard) have skeletons, others show a spinner only.
- **Map component theming:** `SmartTripMap`/`GoogleTripMap`/`TripMap` use their own marker/pin palette (category-coded, not tied to this token set) — not unified with the card system.
