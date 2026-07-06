# VISUAL_REPORT — Globo personalizado, mapa ilustrado, imágenes y motion design

**Fecha:** 6 de julio de 2026 · **Rama:** main (sin commits, como se pidió)
**Verificación:** `tsc --noEmit` ✓ · ESLint ✓ (1 warning preexistente de fast-refresh) · `npm run build` ✓ (20 s) · dev server sin errores de consola ni de servidor · navegación SPA verificada en el navegador.

---

## PARTE 1 — Globo 3D personalizado por usuario

### Diagnóstico (por qué no funcionaba bien)

1. **El SELECT del dashboard rompía la carga entera de viajes.** `dashboard.tsx` pedía `geo_lat, geo_lng` en la query, pero la migración que crea esas columnas (`20260704090000_security_hardening...`) **no está aplicada en producción**. PostgREST devuelve error ante columnas inexistentes → el usuario veía "No pudimos cargar tus viajes" y el globo mostraba los **6 marcadores de ejemplo** (San Francisco, Tokio, Sídney…) que nada tienen que ver con sus viajes.
2. **No se geocodificaba al crear el viaje** — solo al cargar el dashboard, y ese update fallaba silenciosamente por el mismo motivo.
3. **Las llamadas a Nominatim iban en paralelo** (`Promise.all`), violando su límite de 1 req/s → bloqueos y resultados perdidos con varios viajes.
4. **Cada geocodificación resuelta destruía y recreaba el globo WebGL entero** (deps del efecto), con parpadeo de 1,2 s por marcador.

### Implementado

- **[src/lib/geocode.ts](src/lib/geocode.ts)** (nuevo): geocodificación compartida con **cola secuencial a 1,1 s/req** (cumple la política de Nominatim), caché en memoria + `localStorage`, timeout de 6 s, y `geocodeAndPersistTrip()` que guarda `geo_lat/geo_lng` tolerando que las columnas no existan aún.
- **Al crear el viaje** ([onboarding.tsx](src/routes/_authenticated/onboarding.tsx)): la geocodificación se **pre-calienta al salir del paso de destino**; en `finish()` las coordenadas viajan en el propio INSERT (con `Promise.race` de 1,8 s para no bloquear nunca al usuario y reintento del INSERT sin columnas opcionales si la migración falta). Si Nominatim no llegó a tiempo, se persiste en segundo plano tras navegar.
- **Dashboard**: `fetchTrips()` reintenta el SELECT **sin columnas geo** si la query con ellas falla → los viajes siempre cargan. Los viajes con coordenadas pintan al instante; los que no, se geocodifican en cola y **el globo se completa marcador a marcador** (sin esperar al lote entero).
- **El globo ya solo muestra los destinos reales del usuario** (`markers={globeMarkers ?? []}`); los marcadores de muestra quedan reservados para superficies de marketing.
- **[cobe-globe-polaroids.tsx](src/components/ui/cobe-globe-polaroids.tsx)**: los marcadores se actualizan en vivo con `globe.update({ markers })` sin recrear el WebGL; el popup al hacer clic muestra foto + nombre del destino + enlace al itinerario, ahora **con i18n** ("Ver itinerario" estaba hardcodeado) y animación de aparición origin-aware.

> ⚠️ **Acción pendiente tuya:** aplicar en producción la migración `20260704090000_security_hardening_and_missing_columns.sql`. Todo el código degrada con elegancia sin ella, pero las coordenadas solo **persisten** cuando las columnas existan.

---

## PARTE 2 — Mapa visual SVG del itinerario

### Nuevo: póster ilustrado descargable

- **[src/components/trip/TripVisualMap.tsx](src/components/trip/TripVisualMap.tsx)**: SVG 900×1240 estilo póster de viaje, oscuro (`#050b16`/`#0b1a2e`) con acentos sky-400 — la misma familia visual que las postales.
  - **Silueta del país** detrás de la ruta, con glow suave y relleno translúcido.
  - **Ruta única por itinerario**: PRNG determinista sembrado con `destino + fechas + nº días` — el mismo viaje siempre genera el mismo trazado, pero cada viaje es distinto. Puntos numerados por día, primero acentuado en sky-400, unidos por **curva suave punteada** (quadratic midpoint smoothing).
  - **Icono ilustrado por día**: la categoría dominante de las actividades del día (monumento, restaurante, playa, templo, montaña, atardecer, paseo…) usando el sistema de iconos monoline de las postales, ahora exportado desde [postcard.ts](src/lib/postcard.ts).
  - **Cabecera**: marca, destino con tamaño adaptativo a la longitud del nombre, fechas localizadas.
  - **Estadísticas**: días · actividades totales · tipos de experiencias, separadas por hairlines.
  - **Leyenda** de días (1–2 columnas según duración) y pie de marca.
  - **Descarga PNG** a 2× con `html-to-image` (ya era dependencia), que además incrusta las webfonts.
  - Modal con animación de entrada por muelle, portal a `body`, cierre por overlay/botón, `aria-label` descriptivo en el SVG.
- **[src/lib/country-silhouettes.ts](src/lib/country-silhouettes.ts)**: siluetas low-poly estilizadas de los **20 países más comunes** (España, Francia, Italia, Japón, EE. UU., Reino Unido, Portugal, Grecia, Tailandia, Indonesia, México, Marruecos, Países Bajos, Alemania, Islandia, Croacia, Turquía, Egipto, Argentina, Irlanda) + **isla genérica** para el resto. Matcher por país y ciudades principales en es/en/fr/pt. Las 21 siluetas se verificaron renderizadas en el navegador.
- **Botón "Ver mapa del viaje"** (icono `Route`) añadido a la toolbar de [my-trip.$tripId.tsx](src/routes/_authenticated/my-trip.$tripId.tsx), junto al mapa interactivo. Claves i18n nuevas en es/en (`trip.visualMap*`).

---

## PARTE 3 — Imágenes de Unsplash

### Diagnóstico

- 🔴 **La key es de DEMO: `X-Ratelimit-Limit: 50`** (verificado en vivo contra la API; producción sería 5000). Cada generación de itinerario consume 1 + N llamadas (hasta 15 en un viaje de 14 días): con ~3 generaciones/hora **la cuota se agota**, Unsplash devuelve 403 y todo cae al fallback de loremflickr (fotos aleatorias de baja calidad). **Esta es la causa principal de que "las imágenes no se vean bien".**
  → **Acción pendiente tuya:** solicitar producción en [unsplash.com/oauth/applications](https://unsplash.com/oauth/applications) (gratuito, requiere cumplir las guidelines de atribución).
- El servidor guardaba `urls.regular` tal cual: 1080 px fijos, sin `h=`, sin `fit=crop` — recortes descontrolados y tamaño inadecuado para heros de ancho completo.
- Varios `<img>` (dashboard, hero del viaje, imágenes de día) no tenían `onError`: un hotlink caducado mostraba el icono de imagen rota.

### Arreglado

- **Servidor** ([itinerary.functions.ts](src/lib/itinerary.functions.ts), [inspire.functions.ts](src/lib/inspire.functions.ts)): ahora se parte de `urls.raw` y se añade **`w=&h=&fit=crop&auto=format&q=80`** — WebP/AVIF automático, encuadre correcto, tamaño por uso (hero 2000×1000, día 1400×620, inspire 1200×800). Los fallos de la API se registran en logs (`[unsplash] 403…`) para que el agotamiento de cuota sea visible en Vercel.
- **Cliente**: nuevo **[SmartImage](src/components/ui/SmartImage.tsx)** — `<img>` con cadena de fallback (URL principal → loremflickr determinista por destino → degradado de marca) y `loading="lazy"` por defecto. Aplicado en TripCard, NextTripHero e inspiraciones guardadas del dashboard, y en hero + imágenes de día del itinerario. Los heros above-the-fold usan `loading="eager"` + `fetchPriority="high"`.

---

## PARTE 4 — Motion design

Base compartida en **[src/lib/motion.ts](src/lib/motion.ts)**: una sola curva de la casa (`cubic-bezier(0.23, 1, 0.32, 1)`, ease-out-quint) y **duración por dispositivo (200 ms móvil / 300 ms desktop)** para que toda la app respire al mismo ritmo.

### Transiciones entre páginas
- **[RouteTransition](src/components/ui/RouteTransition.tsx)** en `__root.tsx`, alrededor del `<Outlet/>`: el contenido **sale hacia la izquierda y entra desde la derecha** con `AnimatePresence`, salida al 50 % de la duración de la entrada (el sistema responde rápido, la llegada se disfruta). `initial={false}` para no animar la primera carga (SSR/LCP intactos). Verificado con navegación SPA real.

### Entradas con personalidad por página
- **[PageTransition](src/components/ui/PageTransition.tsx)** ahora tiene tres personalidades en ejes que no compiten con el eje X global: `rise` (dashboard), `focus` — fade con desenfoque que enfoca (detalle del viaje), `scale` (feed editorial). El onboarding tiene la suya propia: **pasos con slide direccional** según avances o retrocedas.
- **Landing hero cinematográfico** ([HeroSection.tsx](src/components/landing/HeroSection.tsx)): badge → titular → subtítulo → CTAs → proof llegan escalonados (130 ms) con blur que se resuelve, ritmo de opening title; el mockup sube después con escala, y sus chips flotantes hacen pop al final.
- **Cascadas**: cards del dashboard con stagger y+escala (55 ms); feed de explore con `whileInView` por columna.
- **El itinerario aparece día a día** (`DayReveal` en my-trip): los tres primeros días en cascada con desenfoque que enfoca; los siguientes se revelan al alcanzarlos con el scroll. Es el momento "algo especial está pasando" tras la generación.

### Micro-interacciones (keyframes en [styles.css](src/styles.css), GPU-only)
- **Chips del onboarding** vibran sutilmente al seleccionarse (`chip-pop`: escala + rotación ±1,2°).
- **Deslizador de presupuesto**: el thumb crece con halo al arrastrarlo (`:active` scale 1.22 + ring suave).
- **Estrellas del feed**: pop en cascada (45 ms entre estrellas) hasta la puntuación elegida.
- **Bookmark de guardar inspiración**: el icono se **rellena con rebote** (`bookmark-fill`) en las dos páginas públicas.
- **Iconos de navegación** (barra móvil y nav desktop): pop elástico al activarse.
- Botones: el patrón `active:scale` + cambio de color ya era convención de la casa; se mantiene y extiende en los controles nuevos.

### Efectos visuales especiales
- **Globo con brillo al aparecer**: halo radial sky que respira una vez (escala 0.85 → 1.04 → 1) y se asienta como resplandor tenue.
- **Pantalla de carga con estrellas**: 26 partículas deterministas que titilan y ascienden (transform/opacity puros) sobre el Ken Burns existente.
- **Parallax sutil en las imágenes de día**: `useScroll` + `useTransform` (±6 %, imagen escalada al 112 %) — **desactivado en móvil y con reduced-motion**.
- **Profundidad por capas en el hero**: el mockup sigue al ratón con muelles y los chips flotantes se mueven **en dirección opuesta** (parallax diferencial). Solo puntero fino.
- **Elevación 3D en las cards del feed**: **[TiltCard](src/components/ui/TiltCard.tsx)** — inclinación máx. 4° hacia el cursor con físicas de muelle (`useMotionValue`/`useSpring`, nunca `useState`), inerte en táctil.

### Mobile y performance
- Duraciones 200 ms móvil / 300 ms desktop en toda la base compartida.
- Parallax y tilt apagados en móvil/táctil.
- **Swipe con feedback visual** en el onboarding: arrastra la tarjeta del paso (elástico) para avanzar/retroceder.
- Solo `transform`/`opacity` en todas las animaciones nuevas; `will-change` en el parallax; nada de listeners de scroll manuales.
- `prefers-reduced-motion` respetado en doble capa: `useReducedMotion` en cada componente framer-motion nuevo + el kill-switch global de CSS ya existente.

---

## Ficheros

**Nuevos:** `src/lib/geocode.ts`, `src/lib/motion.ts`, `src/lib/country-silhouettes.ts`, `src/components/trip/TripVisualMap.tsx`, `src/components/ui/SmartImage.tsx`, `src/components/ui/TiltCard.tsx`, `src/components/ui/RouteTransition.tsx`, `PRODUCT.md`.

**Modificados:** `dashboard.tsx`, `onboarding.tsx`, `my-trip.$tripId.tsx`, `explore.index.tsx`, `explore.$slug.tsx`, `trip.$slug.tsx`, `__root.tsx`, `cobe-globe-polaroids.tsx`, `PageTransition.tsx`, `HeroSection.tsx`, `DashboardSidebar.tsx`, `itinerary.functions.ts`, `inspire.functions.ts`, `postcard.ts` (exporta iconos), `styles.css`, `es.json`, `en.json`.

## Pendiente de tu lado (no automatizable desde aquí)

1. **Aplicar la migración** `20260704090000_security_hardening_and_missing_columns.sql` en producción (columnas `geo_lat`/`geo_lng`).
2. **Solicitar key de producción de Unsplash** (la actual es demo: 50 req/hora, verificado en vivo).
3. La skill `review-animations` que pedías no existe en este entorno; el trabajo de motion se guió con `emil-design-eng`, `impeccable`, `taste-skill` y `ui-ux-pro-max`.
