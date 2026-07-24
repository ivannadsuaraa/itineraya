# FINAL REPORT — Auditoría de interacciones pre-lanzamiento

**Resultado:** el Bug 1 (navbar móvil) **no se reproduce en el código actual** — todos los botones responden al tap y no hay ningún elemento interceptando toques (evidencia abajo). El Bug 2 (botón "Siguiente" bloqueado) **sí se reprodujo y está arreglado**: el botón ya nunca se deshabilita por validación, lee el valor del input directamente del DOM como fallback (el fallo de iOS) y muestra un error inline al pulsar. Durante la verificación obligatoria aparecieron y se arreglaron **4 bugs adicionales reales**: inglés en la UI española (modal de auth, mapa, tripmates), error de hidratación por `<a>` anidado en 3 páginas, crash de realtime en `/profile`, y spinner infinito del mapa cuando Google Maps no carga. Sin commits ni push, como se pidió.

---

## Metodología

Todo se verificó en Chromium (Playwright) con emulación móvil real: viewport **375×812**, `hasTouch: true`, `isMobile: true`, user-agent de iPhone Safari, locale `es-ES`, y **taps táctiles reales** (no clicks). El backend de Supabase se mockeó a nivel de red (no hay credenciales reales en este entorno). Servidor: `vite dev` local.

---

## CRITICAL BUG 1 — Navbar móvil

### Diagnóstico (metodología obligatoria ejecutada)

1. **`useTap`:** `grep -r useTap` sobre todo el repo → **0 referencias**. Confirmado eliminado.
2. **Elementos `fixed`/`absolute` con `z-index > 10` en la landing** (enumerados en runtime): exactamente **dos** —
   - el propio `<header>` del navbar (`fixed, z-50, y=0–76`)
   - el CookieBanner (`fixed, z-2000`, anclado abajo, `y=548–812`) — **no toca el navbar**.
3. **`document.elementFromPoint()`** en el centro de cada control del navbar:
   - logo → recibe su propio `<img>` ✅
   - selector de idioma → recibe su propio `<button>` ✅
   - hamburguesa → recibe el `<path>` del icono (hijo del botón) ✅
   - `hitIsSelfOrChild: true` en los tres — **nada intercepta**.
4. **Taps reales a 375px** (todos verificados con resultado observable):
   - hamburguesa → el menú móvil se abre (aparecen los links y "Iniciar sesión"/"Empieza gratis")
   - "Iniciar sesión" → abre el modal de login
   - "Empieza gratis" → abre el modal de signup
   - selector de idioma → abre dropdown; tap en "English" → el H1 cambia a "Your perfect trip, made in seconds"
   - `pageerror`s: **ninguno**.

### Conclusión

El navbar actual usa `onClick` planos en `<button>`/`<Link>` estándar y funciona con touch. La causa del bug de producción era con toda probabilidad el `useTap`/framer-motion ya eliminado (quedan restos de esa limpieza: props vacías en JSX, `swipe.js` e `index.js` muertos en la raíz del repo). **No se necesitó ningún cambio en el Navbar** — inventar un fix sin defecto reproducible habría sido tratar el síntoma.

### Fix relacionado que sí era real

El contenedor del CookieBanner (`fixed inset-x-0 bottom-0 z-[2000]`, ancho completo) **tragaba toques** en sus zonas de padding fuera de la tarjeta blanca, y Playwright confirmó que interceptaba pointer events sobre el botón "Siguiente" del onboarding en la primera visita. Fix mínimo en `CookieBanner.tsx`: `pointer-events-none` en el contenedor + `pointer-events-auto` en la tarjeta. Verificado después: primera visita → banner visible → tap "Aceptar todas" → banner desaparece → "Siguiente" funciona.

---

## CRITICAL BUG 2 — Botón "Siguiente" no responde en móvil

**Nota:** no existe ninguna ruta `/demo` en el código. El flujo descrito (botón "Siguiente" + `DestinationAutocomplete` + gating por `canContinue`) vive en **`/onboarding`** (`src/routes/_authenticated/onboarding.tsx`), y ahí se aplicó el fix.

### Reproducción del fallo (antes del fix)

Simulado el modo de fallo de iOS — valor presente en el DOM del input pero estado React vacío (onChange nunca disparado):

```
NEXT (DOM value "Roma", estado vacío): {"disabled": true}
H1 tras el tap: "¿A dónde quieres ir?"   ← no avanza, sin feedback, usuario atascado
```

### Fix aplicado (los tres requisitos de la misión)

1. **Fallback del DOM:** `resolveDestination()` lee `input.value` del DOM cuando el estado React está vacío, y lo sincroniza al estado. Se usa tanto en `next()` como en `finish()` (el INSERT usa el valor resuelto).
2. **El botón nunca se deshabilita por validación:** `disabled={loading}` únicamente (solo durante el submit, para evitar dobles INSERT).
3. **Validación al pulsar con error inline:** `validateStep()` en `next()`/`finish()`; si falta destino o fechas se pinta un `<p role="alert">` dentro de la tarjeta con texto i18n (`onboarding.errorDestination` / `errorDates`, añadidos a `es.json` y `en.json`). El error se limpia al escribir/cambiar fechas/retroceder. Los handlers de Enter también pasan por la validación.

### Verificación (taps reales, 375px)

| Escenario | Resultado |
|---|---|
| A: tap "Siguiente" con destino vacío | Botón habilitado; aparece error inline "Escribe un destino para continuar." ✅ |
| B: valor solo en DOM, estado React vacío (fallo iOS) | **Avanza a "¿Cuándo viajas?"** ✅ |
| C: flujo completo de 7 pasos con taps (destino → fechas en calendario → … → "Generar") | INSERT en `trips` con payload correcto (`destination: "Barcelona"`, fechas, `status` pending) y navegación a `/trip/:id` ✅ |
| C-bis: tap "Siguiente" sin fechas en paso 2 | Error inline "Selecciona las fechas de tu viaje para continuar." ✅ |

`pageerror`s en todos los escenarios: ninguno.

---

## Bugs adicionales encontrados y arreglados (checklist post-fix)

### 1. Inglés visible en la UI española
- **AuthModal**: el namespace `authModal.*` no existía en ningún locale — "Welcome back", "Continue with Google", "Log in", "Create account", etc. se mostraban en inglés a usuarios en español (verificado en runtime). → 12 claves añadidas a `es.json`/`en.json`.
- **TripmatesModal** (`tripmates.*`) y **GoogleTripMap** (`trip.directions`, `trip.categories`, `trip.category.*`): mismos namespaces ausentes → añadidos.
- **`trip.$tripId.tsx`**: "Invite tripmates" hardcodeado → sustituido por `t("tripmates.invite")`.
- Verificación posterior: barrido de 15 páginas en español buscando 17 cadenas inglesas → **0 coincidencias**.

### 2. Error de hidratación en `/contact`, `/privacy`, `/terms`
`BrandLogo` renderiza su propio `<Link>`, y estas tres páginas lo envolvían en otro `<Link to="/">` → `<a>` dentro de `<a>` → HTML inválido → "Hydration failed… tree regenerated on client" (error real también en producción). → Eliminado el wrapper exterior usando la prop `linkTo` que `BrandLogo` ya soportaba. Verificado: errores de consola desaparecidos en las tres páginas.

### 3. Crash realtime en `/profile`
`useSubscription` creaba el canal con nombre fijo `subs-${userId}`; `supabase.channel()` devuelve la misma instancia para un nombre repetido, y llamar `.on()` sobre un canal ya suscrito lanza `"cannot add postgres_changes callbacks … after subscribe()"` (pageerror reproducido en `/profile`; ocurre con dobles montajes y re-suscripciones por refresh de token). → Nombre de canal único por montaje. Verificado: pageerror desaparecido.

### 4. Mapa del viaje: rechazo no manejado + spinner infinito
En `GoogleTripMap`, el efecto de geocoding hacía `await loadGoogleMaps()` sin try/catch: si Maps no carga (clave ausente, adblocker, red), había un `pageerror` no manejado y el spinner "cargando mapa" giraba para siempre. → try/catch + estado `mapFailed` + mensaje de fallback i18n (`trip.mapUnavailable`). Verificado: sin pageerror y con fallback visible.

---

## Resultados del checklist

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Páginas cargan sin errores de consola | ✅ 15 rutas (`/`, `/pricing`, `/explore`, `/contact`, `/privacy`, `/terms`, `/cookies`, `/dashboard`, `/new-trip`, `/onboarding`, `/inspire`, `/profile`, `/copilot`, `/assistant`, `/trip/:id`) | Barrido final: 0 errores de app. Los únicos restantes son WebSocket contra el backend Supabase dummy local (artefacto del mock; el endpoint realtime existe en producción) |
| Demo → signup → primer viaje | ✅ hasta donde permiten los mocks | Signup por tap: modal → formulario → "Crear cuenta" → POST `/auth/v1/signup` con payload correcto → panel "Revisa tu email" en español. Onboarding completo → INSERT de trip → `/trip/:id` renderiza itinerario `ready` mockeado |
| Mapa centrado en el destino | ⚠️ verificado a nivel de código, no visual | La lógica es correcta: `geocode(destination)` → `setCenter()` y luego `fitBounds()` sobre los pines de actividades. Sin clave de Google Maps en este entorno no se puede renderizar el mapa real |
| Imágenes cargan | ✅ locales / ⚠️ Unsplash no verificable aquí | Todas las imágenes locales OK (naturalWidth > 0). `images.unsplash.com` está bloqueado por la política de red de este entorno (CONNECT 403 del proxy) — no es un bug de la app; las URLs son estándar del CDN de Unsplash |
| Sin inglés en UI española | ✅ | Tras los fixes de i18n: 0 coincidencias de 17 términos ingleses en las 15 páginas |
| 375px sin overflow horizontal | ✅ | `scrollWidth − clientWidth = 0` en las 15 páginas |

## Qué NO se pudo verificar en este entorno (explícito)

- **Dispositivos reales** (iPhone Safari / Android Chrome físicos): la verificación usó Chromium con emulación táctil fiel, pero no hardware real.
- **Generación real del itinerario** (`generateItinerary` → Anthropic API): no hay `ANTHROPIC_API_KEY` ni Supabase real aquí.
- **Render visual del mapa de Google** y las imágenes de Unsplash: clave/host no disponibles en este entorno (detallado arriba).
- **Emails reales de confirmación de signup** (Supabase/Resend).

## Ficheros modificados (sin commits, sin push)

```
src/components/CookieBanner.tsx            | contenedor pointer-events (fix interceptor táctil)
src/components/trip/GoogleTripMap.tsx      | fallo de Maps manejado + fallback
src/hooks/useSubscription.ts               | nombre de canal realtime único
src/i18n/locales/es.json                   | authModal, tripmates, trip.*, onboarding.error*
src/i18n/locales/en.json                   | idem (paridad)
src/routes/_authenticated/onboarding.tsx   | BUG 2: fallback DOM, sin disabled, error inline
src/routes/_authenticated/trip.$tripId.tsx | "Invite tripmates" → i18n
src/routes/contact.tsx                     | <a> anidado (hidratación)
src/routes/privacy.tsx                     | <a> anidado (hidratación)
src/routes/terms.tsx                       | <a> anidado (hidratación)
```

10 ficheros, +161/−28. `npx tsc --noEmit` pasa. ESLint: los cambios no añaden errores netos (el repo tiene ~700 violaciones `prettier/prettier` preexistentes; los ficheros no estaban formateados antes de tocarlos).

Notas de limpieza: el `.env` dummy creado para el dev server local fue eliminado; `routeTree.gen.ts` (regenerado automáticamente por Vite) fue revertido para no meter ruido en el diff.

## Sugerencias fuera de alcance (no aplicadas)

- Borrar los ficheros muertos `swipe.js`, `index.js` y `onboarding.tsx` de la raíz del repo (restos de la limpieza de framer-motion).
- El CookieBanner sigue **cubriendo visualmente** el botón "Siguiente" del onboarding en la primera visita a 375px (el usuario debe descartarlo primero — comportamiento estándar, pero en pantallas pequeñas tapa el CTA primario).
- Migrar `createServerFn().inputValidator()` → `.validator()` (deprecation warnings en el build).
- El `accommodationBlock` de `itinerary.functions.ts` se construye pero nunca se inyecta en el prompt (detectado en sesión anterior; sin tocar por estar fuera del alcance de esta misión).
