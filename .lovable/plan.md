## Plan

Tres mejoras nuevas sin tocar IA, planes, auth, pagos ni dashboard.

### 1. Compartir itinerarios (público, sin login)

- Migración: añadir a `public.trips` la columna `share_slug TEXT UNIQUE` y política RLS de SELECT pública restringida a filas con `share_slug IS NOT NULL`, exponiendo solo columnas no sensibles vía un server function público.
- Server function `getPublicTrip` (sin auth) que usa cliente publishable y devuelve `destination, hero_image_url, itinerary, start_date, end_date, share_slug`.
- Server function autenticada `enableTripShare({ tripId })` que genera slug amigable `kebab(destination)-N-dias-XXXX` y lo guarda si no existe.
- Nueva ruta pública `src/routes/trip.$slug.tsx` (fuera de `_authenticated`) con loader que llama a `getPublicTrip`, hero, resumen, días con actividades, y CTA final "Crea tu propio itinerario gratis" → `/auth`.
- Botón "Compartir" en `trip.$tripId.tsx`: abre diálogo que llama a `enableTripShare`, muestra URL `https://itineraya.com/trip/<slug>` y botones Copiar / Web Share API / WhatsApp / Twitter.
- `head()` con OG meta dinámicos (título "{destino} · {N} días · Itineraya", hero como og:image).

### 2. Selector de fechas estilo Airbnb

- Reemplazar las dos `DateField` separadas en `onboarding.tsx` por un único `DateRangeField` (Popover + `<Calendar mode="range" />` ya disponible en `react-day-picker`).
- Estado pasa a `data.dates: { from?: Date; to?: Date }`; mapear a `startDate`/`endDate` solo en el save para no tocar la lógica downstream.
- Resumen visible debajo: "20 jul → 30 jul · 10 noches" (i18n ES/EN).
- En móvil: un mes; en escritorio: dos meses (`numberOfMonths`).
- Validación: `canAdvance("dates")` requiere `from && to`.

### 3. Mapa interactivo

- Añadir dependencias: `leaflet` + `react-leaflet` (sin API key, OpenStreetMap).
- Nueva pestaña "Mapa" junto a Tarjetas/Texto en `trip.$tripId.tsx` (tres opciones).
- Geocoding lazy con Nominatim (cliente, cacheado en memoria por sesión + en `localStorage` por `tripId`): para cada actividad consulta `"{place || title}, {destination}"` y guarda lat/lng.
- Marcadores por día con color distinto (paleta azul pastel: 8 tonos), `divIcon` con número del día.
- Popup: nombre, descripción, hora, categoría (emoji) y enlace externo (Google Maps + booking link existente).
- Mapa centrado automáticamente con `fitBounds` sobre todos los marcadores.
- CSS de Leaflet importado en el componente del mapa.

### Detalles técnicos

- Mapa solo se monta cuando la pestaña está activa (evita SSR issues con Leaflet — usar dynamic import o `useEffect` mount).
- Slug único: `slugify(destination) + '-' + dias + '-dias' + '-' + nanoid(5)`.
- Sin cambios en `itinerary.functions.ts`, `payments.functions.ts`, ni nada de auth.
- i18n: añadir claves para "Compartir", "Mapa", resumen de rango, CTA pública.

### Archivos

- Crear: `src/routes/trip.$slug.tsx`, `src/lib/share.functions.ts`, `src/components/trip/TripMap.tsx`, `src/components/trip/ShareDialog.tsx`, `src/components/DateRangeField.tsx`.
- Editar: `src/routes/_authenticated/trip.$tripId.tsx`, `src/routes/_authenticated/onboarding.tsx`, `src/i18n/locales/{es,en}.json`.
- Migración Supabase para `share_slug` + política pública.

¿Procedo?