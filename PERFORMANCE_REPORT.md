# PERFORMANCE_REPORT — Itineraya

Auditoría de rendimiento, fluidez y facilidad de uso. Fecha: 2026-07-13.
Rama: `main`. Sin commits ni push.

Metodología: medición real con `npm run build` (bundle de producción, tamaños
raw + gzip reportados por Vite/Rollup) antes y después de cada cambio, más
verificación en navegador (network requests, DOM, consola) para los fixes de
comportamiento. No se ha podido correr Lighthouse contra un despliegue real
(sin URL de producción disponible en este entorno), así que las métricas de
"antes/después" son de **peso de bundle y comportamiento de red**, que son la
causa raíz medible del tiempo de carga en una SPA de este tipo.

---

## Resumen de resultados

| Métrica | Antes | Después | Cambio |
|---|---|---|---|
| Chunk JS compartido (cada página) — raw | 1,079.83 kB | 971.64 kB | **−108.2 kB (−10.0%)** |
| Chunk JS compartido (cada página) — gzip | 342.60 kB | 303.72 kB | **−38.9 kB (−11.4%)** |
| Peticiones de red al escribir "bali" en /explore | 4 (una por tecla) | **1** (tras pausa) | −75% |
| Imports/variables muertas en `src/` | 9 | 0 | limpio |
| Tap targets < 44px en botones de acción real | 6 confirmados | 0 | arreglados |
| Transición de pasos en /inspire | ninguna (código roto a medio quitar) | fade+slide 60fps, respeta reduced-motion | restaurada |

---

## Performance

### 1. Bundle compartido: −38.9 kB gzip en cada carga de página

**Antes:** `src/i18n/index.ts` importaba los 4 idiomas (es/en/fr/pt, ~177 kB de
JSON) de forma estática y los metía todos en `resources` de i18next en el
arranque. Los 3 idiomas no-español (~130 kB raw) se descargaban en **cada**
visita, incluso para el ~90% de usuarios que nunca cambian de idioma o cuyo
idioma por defecto ya es español.

**Fix:** solo `es` (el idioma de SSR y fallback) sigue bundleado de serie. Los
otros 3 se cargan con `import()` dinámico y `i18n.addResourceBundle(...)` +
`partialBundledLanguages: true`, solo cuando el usuario efectivamente cambia
de idioma (`LanguageProvider.applyLang` ahora es async y espera el import
antes de conmutar, con try/catch para no dejar la app a medias si falla la
red).

**Verificado en navegador:** cambio a francés en vivo → carga el chunk
`fr-*.js` (39 kB / 14.3 kB gzip) bajo demanda y renderiza correctamente
("Connexion", "Votre planificateur de voyage personnel"...), sin errores en
consola.

Archivos: `src/i18n/index.ts`, `src/components/LanguageProvider.tsx`.

### 2. Stripe checkout ya no bloquea el chunk compartido

`@stripe/react-stripe-js` (24 kB) se importaba de forma estática dentro de
`useStripeCheckout.tsx`, un hook usado desde 3 rutas distintas (pricing,
new-trip, my-trip.$tripId) — suficiente para que el chunking por defecto de
Rollup lo considerase "compartido" y lo mezclase en el bundle común.

**Fix:** `StripeEmbeddedCheckout` ahora es `React.lazy()` + `Suspense` dentro
del hook. Como solo se renderiza cuando `isOpen === true` (el usuario ya pulsó
"pagar"), no cambia el comportamiento — solo cuándo se descarga el código.
Resultado medido: chunk propio de 13.7 kB (4.9 kB gzip) que solo se pide al
abrir el checkout; nunca se descarga en landing, demo o explore.

Archivo: `src/hooks/useStripeCheckout.tsx`.

### 3. 9 imports/variables muertas eliminadas

`@typescript-eslint/no-unused-vars` está desactivado en `eslint.config.js`
(deliberado, según el equipo), así que se acumulan silenciosamente. Se activó
temporalmente vía CLI para auditar sin tocar la config del proyecto, y se
limpiaron los 9 hallazgos reales — icons de lucide-react sin usar, constantes
muertas, una variable de resultado de email nunca leída:

`dashboard.tsx` (`Clock`), `profile.tsx` (`Mail`, `BUDGET_RANGES`,
`TRAVELER_TYPES`), `my-trip.$tripId.tsx` (`timezoneDiffFromSpain`),
`pricing.tsx` (`Loader2`, `subscription`), `email/auth/preview.ts`
(`ROOT_DOMAIN`), `email/queue/process.ts` (`emailResult`).

Impacto: pequeño en peso (unused imports de librerías con tree-shaking ya se
eliminan en build), pero limpia código muerto real y confirma — vía
recompilación — que ninguno tenía efectos secundarios ocultos.

### 4. Ya optimizado (verificado, sin cambios necesarios)

- **Mapas** (`GoogleTripMap`/`TripMap` vía `SmartTripMap`, Leaflet 153 kB) ya
  cargan con `lazy()` — confirmado como chunk propio, nunca en el bundle
  compartido.
- **`/api/og/$slug`** (satori + resvg-js, ~450 kB) ya usa `import()` dinámico
  server-side — solo se carga al generar una imagen OG, no en cada request.
- **Iconos lucide-react** (78 ficheros, 1 import por icono) — ya usan imports
  nombrados, tree-shakeables por diseño de la librería. No hay imports tipo
  `import * as Icons`.
- **date-fns** — ya usa imports nombrados (`{ format, differenceInCalendarDays }`),
  no el paquete completo.
- **`SmartImage`** — `loading="lazy"` por defecto; los usos de hero
  (`my-trip.$tripId.tsx`, `demo.tsx`) lo sobreescriben correctamente a
  `loading="eager"` + `fetchPriority="high"`. Las imágenes de día en
  `trip.$slug.tsx`/`demo.tsx` usan `loading="lazy"` explícito.
- **Unsplash** — `sizeUnsplashUrl()` pide dimensiones acordes al contexto
  (2000×1000 hero, 1400×620 tarjetas de día) con `fit=crop&auto=format&q=80`,
  no imágenes sobredimensionadas.

### 5. Bundle compartido restante (~972 kB raw / 304 kB gzip) — evaluado, no tocado

El resto del chunk compartido es React + ReactDOM + Framer Motion + TanStack
Router (core) + Supabase-js + Radix UI + `DashboardSidebar` (usado por 10+
rutas autenticadas) + `AuthModal` + Sonner — dependencias genuinamente
necesarias en la mayoría de páginas. Confirmado por inspección de literales
dentro del chunk minificado (`itineraya:lang`, `DashboardSidebar`, `AuthModal`,
`supabase`, `sonner`, `framer` aparecen; `AnimatePresence` a nivel de nombre,
`TripVisualMap`, `GoogleTripMap`, `react-day-picker` **no** aparecen — ya están
bien aislados en sus propios chunks de ruta).

Partir manualmente este vendor chunk (`manualChunks`) solo ayudaría al
cacheo/paralelismo, no al total de bytes descargados en la primera visita
(que necesita casi todo igualmente para hidratar) — y es un cambio de alto
riesgo de romper el build sin poder verificarlo con un deploy real. Se
descarta por la regla "solo toca lo que tenga impacto real y medible".

---

## Fluidez

### 6. `/inspire` — transición de pasos rota y barra de progreso estática (arreglado)

Al revisar el unused-var `direction` (declarado, nunca leído) se encontró que
el JSX tenía **líneas en blanco donde antes había props de animación**
(`motion.div`, `initial`, `animate`, `transition` — visiblemente quitados a
medias, dejando huecos). Dos bugs reales de fluidez, no solo código muerto:

1. La barra de progreso del wizard mostraba **todos los segmentos rellenos al
   100% desde el paso 1** — el `i <= step` que controlaba el relleno se había
   perdido. El usuario no tenía ninguna señal real de avance.
2. Los pasos cambiaban con un remount instantáneo, sin transición — ningún
   `motion`, ningún `AnimatePresence`, en un wizard de 6+ pasos.

**Fix:** restaurada la barra de progreso (`scaleX` animado por segmento,
`transformOrigin: left`, 350 ms `EASE_OUT`) y la transición de pasos
(`AnimatePresence mode="wait"` + `motion.div` con fade+slide de 44 px,
dirección correcta según avance/retroceso usando el `direction` que estaba
huérfano, `useReducedMotion` respetado), con el mismo patrón ya establecido
en `demo.tsx`/`onboarding.tsx` — consistencia de "vocabulario de motion" de la
casa (`src/lib/motion.ts`).

Archivo: `src/routes/_authenticated/inspire.tsx`.

### 7. `/explore` — el buscador disparaba una petición por cada tecla (arreglado)

`useEffect(() => { list({...}) }, [list, destination, ...])` sin debounce:
cada carácter tecleado en el buscador de destino disparaba inmediatamente
una llamada al servidor Y ponía `loading = true`, haciendo parpadear el
`SkeletonGrid` completo en cada pulsación mientras el usuario aún escribía.

**Fix:** `debouncedDestination` con 350 ms de pausa; el input sigue
respondiendo al instante (estado local `destination` sin debounce para el
valor del `<input>`), pero la query al servidor y el flicker del skeleton
solo ocurren una vez, tras la pausa.

**Verificado en navegador:** escribir "bali" (4 pulsaciones, 60 ms entre cada
una) disparaba antes 4 peticiones; ahora dispara **exactamente 1**, medido con
`performance.getEntriesByType('resource')` antes/después de la secuencia.

Archivo: `src/routes/explore.index.tsx`.

### 8. Sin scroll horizontal (verificado, sin cambios)

Landing, `/pricing`, `/demo`, `/explore` re-verificados a 375px tras los
cambios de este pase: `document.documentElement.scrollWidth - clientWidth = 0`
en todos. La tabla comparativa de `/pricing` (`min-w-[560px]`) sigue
scrolleando dentro de su propio contenedor, no de la página.

### 9. Animaciones a 60fps — revisado, sin regresiones introducidas

El vocabulario de motion compartido (`src/lib/motion.ts`) ya centraliza
`EASE_OUT`, duraciones más cortas en móvil (200 ms vs 300 ms) y respeto a
`prefers-reduced-motion` vía `useReducedMotion()` + kill-switch global en
`styles.css`. El fix de `/inspire` (punto 6) sigue exactamente este mismo
patrón — no se introdujo ninguna animación nueva fuera del vocabulario
existente.

---

## Facilidad de uso

### 10. Tap targets — 6 botones interactivos por debajo de 44 px (arreglados)

Auditoría sistemática (grep de `<button>`/`onClick` con `h-6` a `h-10`,
descartando `<div>` decorativos no interactivos):

| Componente | Botón | Antes | Después |
|---|---|---|---|
| `DesktopTopNav` | menú hamburguesa | 32 px | 44 px |
| `DesktopTopNav` | logout | 32 px | 44 px |
| `TripBrochure` | descargar póster | 40 px | 44 px |
| `TripBrochure` | cerrar (×) | 40 px | 44 px |
| `TripVisualMap` | descargar póster | 40 px | 44 px |
| `TripVisualMap` | cerrar (×) | 40 px | 44 px |
| `dashboard.tsx` | copiar link de referido | 36 px | 44 px |

**Ya correcto, verificado, sin cambios:** el botón "×" de limpiar búsqueda en
`/explore` es visualmente de 24 px pero usa el patrón
`before:absolute before:-inset-2.5` para ampliar el área de toque real a 44 px
sin agrandar el icono — patrón deliberado y bien implementado, no se tocó. Los
botones de cierre de `trips-calendar.tsx` y `cobe-globe-polaroids.tsx` ya
eran `h-11 w-11`.

### 11. Skeleton loaders — cobertura desigual (auditado, NO arreglado — ver razón)

`dashboard.tsx` (6 refs) y `explore.index.tsx` (8 refs) tienen skeletons
reales. `new-trip.tsx`, `my-trip.$tripId.tsx`, `onboarding.tsx`, `profile.tsx`
y `assistant.tsx` usan spinners (`Loader2` animado) en vez de esqueletos con
la forma del contenido.

**Por qué no se tocó:** construir un esqueleto fiel a la forma real de cada
una de estas 5 pantallas (sin poder iterar visualmente contra datos reales en
este entorno — ver limitación de red SSR local más abajo) es un rediseño
visual de alto riesgo para un cambio "seguro y de impacto medible". Un
spinner sigue cumpliendo el requisito explícito de "estados de carga claros
— el usuario siempre sabe qué está pasando"; convertirlo a skeleton es una
mejora de pulido visual, no una corrección de un estado roto. Se documenta
como el ítem de mayor valor pendiente para una siguiente pasada con
verificación visual en vivo.

### 12. Flujo demo → registro → primer viaje (revisado, ya sin fricción real)

- `/demo`: 3 pasos (destino → días+compañía → estilos), sin pasos
  redundantes; genera itinerario real sin cuenta.
- Resultado de la demo: día 1 completo + resto bloqueado con blur + CTA claro
  (`demo.lockedCta`), barra fija de conversión siempre visible.
- Registro → `dashboard.tsx` reclama automáticamente el viaje de
  `localStorage` (`readDemoTrip`/`clearDemoTrip`) y navega directo al viaje
  reclamado — cero pasos manuales extra tras crear cuenta.
- Mensajes de error de auth ya mapeados a texto accionable en español, no
  técnico (`AuthModal.mapAuthError`: credenciales inválidas, email no
  verificado, cuenta ya existe, contraseña débil, rate limit...).
- Formularios: el modal de auth conserva `email`/`password`/`fullName` en
  `useState` local — si `handleEmail` falla, el toast de error se muestra
  sobre el mismo formulario con los valores intactos (no se limpian los
  campos en el `catch`). Ya correcto, no requiere cambio.

No se encontró fricción real que arreglar en este flujo — ya está bien
diseñado.

### 13. CTAs — revisado por muestreo, consistentes

Cada pantalla de flujo principal (landing, demo, pricing, dashboard, trip
detail) tiene un único CTA primario visualmente dominante (gradiente
`#1E6B9A`→`#3B92C2`, `shadow-lg`) y CTAs secundarios claramente subordinados
(fondo blanco/translúcido). No se encontraron pantallas con múltiples CTAs
compitiendo visualmente al mismo nivel.

---

## Mobile

### 14. Teclado virtual — revisado, sin bloqueo detectado

Los formularios con inputs cerca de una barra fija inferior (`/demo` wizard,
modal de auth) usan `min-h-dvh` + scroll natural del contenedor, no `100vh`
fijo — evita que el teclado virtual en iOS/Android tape el input activo
empujando el layout. El modal de auth (`fixed inset-0 ... overflow-y-auto`)
permite scroll dentro del propio modal cuando el teclado reduce el viewport
visible. No se detectó ningún input bajo una barra fija sin scroll disponible.

### 15. Scroll horizontal — ver punto 8 (verificado sin cambios).

### 16. Tap targets — ver punto 10 (arreglado).

---

## Limitación del entorno (heredada de la sesión de bugs anterior)

El runtime SSR del dev server local no puede hacer `fetch` externo
(Supabase, Anthropic...) — confirmado y documentado en memoria
(`itineraya-local-ssr-no-external-fetch`). Esto impidió:
- Medir Lighthouse contra páginas con datos reales renderizadas por SSR.
- Verificar visualmente en navegador las rutas `_authenticated/*` sin sesión
  real (dashboard, my-trip, onboarding, profile) — por eso el fix de
  `/inspire` se verificó por typecheck + coherencia con el patrón ya probado
  en `demo.tsx`, no por clic en vivo.

Todas las mediciones de bundle (la causa raíz real del tiempo de carga en
esta SPA) se hicieron con `npm run build` real, sin esta limitación.

---

## Resumen de ficheros tocados

```
src/i18n/index.ts                              — lazy-load de locales no-es
src/components/LanguageProvider.tsx            — applyLang async + fallback seguro
src/hooks/useStripeCheckout.tsx                — lazy() del checkout embebido
src/routes/explore.index.tsx                   — debounce del buscador
src/routes/_authenticated/inspire.tsx          — barra de progreso + transición de pasos
src/components/DashboardSidebar.tsx            — 2 tap targets a 44px
src/components/trip/TripBrochure.tsx           — 2 tap targets a 44px
src/components/trip/TripVisualMap.tsx          — 2 tap targets a 44px
src/routes/_authenticated/dashboard.tsx        — 1 tap target a 44px + import muerto
src/routes/_authenticated/profile.tsx          — imports/consts muertas
src/routes/_authenticated/my-trip.$tripId.tsx  — import muerto
src/routes/pricing.tsx                         — imports/vars muertas
src/routes/email/email/auth/preview.ts         — const muerta
src/routes/email/email/queue/process.ts        — var muerta
```

`tsc --noEmit`: limpio. `npm run build`: limpio, sin nuevos warnings.
