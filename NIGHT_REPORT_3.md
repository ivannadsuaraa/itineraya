# NIGHT_REPORT_3 — 2026-07-03

## Resumen ejecutivo

Sesión de trabajo autónomo completando fases 2, 4 (parcial), 5.10, 7 (parcial) y 9 (parcial) del TODO_NIGHT_2. Se corrigieron 2 bugs críticos, se añadió sistema de trial de 7 días, animaciones de entrada, PWA, FAQ con schema SEO y strip de destinos trending en el feed.

---

## ✅ Completado

### Fase 2 — Bugs críticos

#### Globe popup se cierra inmediatamente
**Archivo:** `src/components/ui/cobe-globe-polaroids.tsx`

- **Bug:** `onPointerLeave` en el canvas llamaba `setPopup(null)`, cerrando la tarjeta al mover el cursor del canvas a la tarjeta popup.
- **Fix:** Eliminado `setPopup(null)` del canvas. Movido al div contenedor (que engloba canvas + popup), por lo que el popup solo se cierra al salir de toda la zona del globo.

#### Share links devuelven 404
**Archivo:** `src/lib/share.functions.ts`

- **Bug:** `enableTripShare` creaba/leía el `share_slug` pero nunca ponía `is_public: true`. La función `getPublicTrip` filtra por `is_public=true`, así que todos los enlaces compartidos fallaban silenciosamente.
- **Fix:** Ahora el update siempre incluye `is_public: true` tanto al crear un slug nuevo como al reusar uno existente.

---

### Fase 4 — UX/UI

#### Loading screen con barra de progreso falsa
**Archivo:** `src/routes/_authenticated/my-trip.$tripId.tsx`

- `LoadingScreen` ahora muestra una barra de progreso determinista con 6 pasos temporizados (0→91% en ~16s). Al llegar el itinerario, salta al 100% visualmente por la animación de salida del componente.

#### PageTransition — animación de entrada de páginas
**Archivo:** `src/components/ui/PageTransition.tsx` (nuevo)

- Componente wrapper `motion.div` con `opacity: 0→1, y: 12→0`, duración 300ms, easing `[0.22, 1, 0.36, 1]`.
- Usado en: `my-trip.$tripId.tsx`, `dashboard.tsx`.

#### Dashboard — animaciones escalonadas de cards
**Archivo:** `src/routes/_authenticated/dashboard.tsx`

- Cada `TripCard` tiene `motion.div` con `delay: i * 0.05` para efecto escalonado suave.
- Optimizadas URLs de Unsplash fallback: `?w=400&h=400&fit=crop&auto=format&q=75`.

---

### Fase 5.10 — Trial 7 días

#### Trial activado en onboarding
**Archivo:** `src/routes/_authenticated/welcome.tsx`

- Al completar el onboarding se escribe `trial_ends_at = ahora + 7 días` en el perfil con `as never` (columna aún no en schema Supabase).

#### Banner de trial en dashboard
**Archivo:** `src/routes/_authenticated/dashboard.tsx`

- Se lee `trial_ends_at` al cargar el dashboard. Si quedan días, se muestra un banner ámbar entre el header y el contenido.
- Diseño: gradiente `from-amber-500/10 to-orange-500/10`, icono `Clock`, botón "Activar plan" con icono `Zap`.
- El banner desaparece automáticamente cuando el trial ha expirado.

---

### Fase 7 — SEO

#### FAQSection con JSON-LD
**Archivo:** `src/components/landing/FAQSection.tsx` (nuevo)

- 9 preguntas en ES, 8 en EN con accordion accesible (`aria-expanded`).
- `ChevronDown` rota 180° al abrir.
- JSON-LD `FAQPage` schema incrustado → Google puede mostrar rich snippets directamente en los resultados.

#### Meta tags adicionales en landing
**Archivo:** `src/routes/index.tsx`

- Twitter Card: `summary_large_image`, title, description, image.
- `canonical` URL: `https://itineraya.com/`.
- `FAQSection` añadida entre `TestimonialsSection` y `FooterSection`.

---

### Fase 9 — PWA

#### Manifest
**Archivo:** `public/manifest.json` (nuevo)

```json
{
  "name": "Itineraya — Itinerarios con IA",
  "short_name": "Itineraya",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0c1a2e",
  "theme_color": "#0c4a6e",
  "categories": ["travel", "productivity", "lifestyle"]
}
```

#### Meta tags PWA y 404 branded
**Archivo:** `src/routes/__root.tsx`

- `<link rel="manifest" href="/manifest.json">`.
- Apple meta tags: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title`.
- `theme-color` actualizado a `#0c4a6e`.
- 404 page rebrandeada: fondo `bg-gradient-to-b from-sky-950 to-sky-900`, logo de Itineraya, texto en español.

---

### Extra — Explore feed trending

**Archivo:** `src/routes/explore.index.tsx`

- Strip horizontal de destinos trending derivado client-side desde los ítems ya cargados (frecuencia de destino, top 6).
- Aparece solo cuando no hay filtros activos (destino vacío, estilo=all, duración=all).
- i18n keys `explore.trending` añadidas a `es.json` y `en.json`.

---

## ⚠️ Migraciones de DB necesarias (PENDIENTE)

Estas features están implementadas en el frontend pero requieren columnas nuevas en Supabase:

### 1. `profiles.trial_ends_at`
```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
```
Necesario para: banner de trial en dashboard y feature de 7-day trial.

### 2. (Opcional) `trips.rating_sum` y `trips.rating_count`
```sql
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS rating_sum integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0;
```
Necesario para: Fase 5.1 (sistema de ratings en el feed). **No implementado aún.**

---

## ❌ No completado (orden de prioridad original)

| Fase | Descripción | Estado |
|------|-------------|--------|
| 4.6 | Rediseño de calendario | No iniciado |
| 4.7 | Mejoras de activity cards (iconos, duración, precio, checkbox) | No iniciado |
| 5.1 | Sistema de ratings (DB + server fn + UI) | No iniciado (solo strip trending añadido) |
| 7 resto | WebApplication JSON-LD en landing | No iniciado |
| 9 resto | Swipe gestures en onboarding, bottom sheets (vaul) | No iniciado |
| 3 | Performance: TanStack Query staleTime/gcTime, lazy loading | No iniciado |
| 8 | i18n: FR, PT, auto-detect browser language | No iniciado |
| 10 | Tabla comparativa de precios, testimonios en pricing | No iniciado |
| 6 | Rediseño de emails transaccionales | No iniciado |
| 11 | Seguridad: rate limiting, validación Zod | No iniciado |

---

## Archivos modificados

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/components/ui/cobe-globe-polaroids.tsx` | Edit | Fix popup globe |
| `src/lib/share.functions.ts` | Edit | Fix share links is_public |
| `src/routes/_authenticated/my-trip.$tripId.tsx` | Edit | Loading screen con progress bar |
| `src/routes/_authenticated/dashboard.tsx` | Edit | PageTransition, stagger cards, trial banner |
| `src/routes/_authenticated/welcome.tsx` | Edit | trial_ends_at en onboarding |
| `src/routes/index.tsx` | Edit | FAQSection, Twitter Card, canonical |
| `src/routes/explore.index.tsx` | Edit | Strip trending |
| `src/routes/__root.tsx` | Edit | PWA meta tags, branded 404, manifest link |
| `src/i18n/locales/es.json` | Edit | explore.trending key |
| `src/i18n/locales/en.json` | Edit | explore.trending key |
| `src/components/ui/PageTransition.tsx` | New | Animación de entrada reutilizable |
| `src/components/landing/FAQSection.tsx` | New | FAQ + JSON-LD schema |
| `public/manifest.json` | New | PWA manifest |
