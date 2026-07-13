# BUG_REPORT — Itineraya

Auditoría completa de bugs de producción. Fecha: 2026-07-13.
Rama: `main`. Sin commits ni push (según lo pedido).

---

## Resumen ejecutivo

Se revisaron todas las rutas, componentes, server functions, hooks y ficheros de
lógica del proyecto. Se encontraron y **arreglaron 4 bugs reales** (3 de i18n con
impacto directo en la UI visible al usuario + 1 de consistencia de reglas de
negocio). Se documentan además varias observaciones menores y las **limitaciones
del entorno local** que impidieron reproducir en navegador los flujos que
dependen de fetch server-side.

Todos los cambios pasan `tsc --noEmit` sin errores y mantienen los 4 idiomas en
paridad exacta de claves (892 claves comunes).

---

## Limitación del entorno (importante)

El runtime **SSR del servidor de desarrollo local no puede hacer `fetch` a
servicios externos** en este entorno (Supabase, Anthropic, Unsplash, etc.):

```
[getPublicTrip] queryError = TypeError: fetch failed
```

- El cliente de navegador **sí** alcanza Supabase (auth funciona).
- Node con `--env-file=.env` **sí** alcanza Supabase.
- Solo el runtime SSR (Vite/Nitro) falla el fetch de red saliente.

Consecuencia: `/explore` sale vacío y `/trip/$slug` muestra "Itinerario no
disponible" **en local**, pero esto **NO es un bug de producción** — es una
restricción de red del sandbox (verificado instrumentando `getPublicTrip`: las
env vars están presentes y el handler se ejecuta; solo falla la conexión de red).
Igual que la nota en memoria sobre la `ANTHROPIC_API_KEY` local caducada.

Por esto, los flujos server-side (generación de itinerario, demo, checkout
Stripe, webhooks, referidos, emails) se auditaron por **análisis estático del
código** en vez de reproducción en navegador. Los flujos client-side sí se
verificaron en el navegador.

---

## Bugs encontrados y ARREGLADOS

### BUG-1 — Dashboard en francés/portugués cae a español (i18n) ✅ FIXED

**Severidad:** media · **Impacto:** todos los usuarios con idioma `fr` o `pt`.

`fr.json` y `pt.json` **no tenían 9 claves del dashboard** que sí existen en
`es`/`en`. Como `fallbackLng: "es"`, un usuario francés o portugués veía esos
textos **en español** en la sección "Tu mundo" del dashboard:

`dashboard.yourWorld`, `statTrips`, `statCountries`, `statDays`, `statSaved`,
`planNextLabel`, `planNextTitle`, `globeViewItinerary`, `globeClose`.

Usadas en `dashboard.tsx`, `cobe-globe-polaroids.tsx`, `TripBrochure.tsx`,
`TripVisualMap.tsx`, `trips-calendar.tsx`.

**Fix:** añadidas las 9 claves con traducción correcta en `fr.json` y `pt.json`.
**Verificación:** paridad de claves (0 faltantes) + resolución `t()` confirmada
en Node (devuelve francés/portugués, no el fallback español).

---

### BUG-2 — Modal de login/registro en inglés para es/fr/pt (i18n) ✅ FIXED

**Severidad:** alta · **Impacto:** embudo de conversión principal en todos los
idiomas ≠ inglés (el mercado principal es español).

El componente `AuthModal.tsx` (el modal global de auth que usa `AuthModalProvider`
en Navbar, `/demo`, `/explore`, `/trip/$slug`, `/invite/$token`, …) llamaba a
**12 claves `authModal.*` que no existían en ningún idioma**, siempre con un
`defaultValue` en inglés. Resultado: un usuario en español/francés/portugués veía
estas etiquetas **en inglés** dentro del modal de registro/login:

- Título "Sign up to save your trip" / "Welcome back"
- "Continue with Google", "or"
- Placeholders "Email", "Password"
- Botón "Create account" / "Log in"
- "Already have an account? Log in" / "Don't have an account? Sign up"

(mezcladas con las cadenas `auth.*` que sí estaban traducidas → modal medio
inglés / medio español).

**Fix:** añadida la sección `authModal` con las 12 claves traducidas en los 4
idiomas (`es`, `en`, `fr`, `pt`).
**Verificación en navegador:** con idioma forzado a `es`, abierto el modal de
registro → ahora renderiza **100% en español**:
`"Regístrate para guardar tu viaje" · "Continuar con Google" · "o" ·
placeholders "Correo electrónico"/"Contraseña" · "Crear cuenta" ·
"¿Ya tienes cuenta? Inicia sesión"`.

---

### BUG-3 — Leyenda e InfoWindow del mapa en inglés/slugs crudos (i18n) ✅ FIXED

**Severidad:** baja-media · **Impacto:** vista de mapa del viaje para es/fr/pt.

En `GoogleTripMap.tsx`:
- `trip.directions` ("Get directions") y `trip.categories` ("Categories") no
  existían → mostrados en inglés vía `defaultValue`.
- `t(\`trip.category.${c}\`, { defaultValue: c })` → la leyenda de categorías
  mostraba el **slug crudo** ("restaurant", "sight", "nightlife"…) porque no
  existía ninguna clave `trip.category.*`.

**Fix:** añadidas `trip.directions`, `trip.categories` y el objeto
`trip.category.{hotel,restaurant,sight,activity,nightlife,transport,shopping,other}`
en los 4 idiomas.

---

### BUG-4 — Descuadre cliente/servidor en el límite del plan Viajero ✅ FIXED

**Severidad:** baja · **Impacto:** usuarios Viajero cerca del cambio de mes.

El gate cliente (`new-trip.tsx`) calculaba el inicio de mes en **hora local**
(`new Date(now.getFullYear(), now.getMonth(), 1)`), mientras el gate servidor
autoritativo (`itinerary.functions.ts`) lo calcula en **UTC**
(`Date.UTC(...)`). En una zona horaria ≠ UTC, en las horas alrededor del día 1
el conteo de itinerarios del mes podía diferir (el banner "X/5" y el gate
client-side quedaban ligeramente desalineados con lo que el servidor permite).

**Fix:** el cliente ahora calcula el inicio de mes en UTC, igual que el servidor.

---

## Verificación de no-regresión (navegador, client-side)

- **Landing (`/`)** — móvil 375px: sin overflow horizontal (`overflowX = 0`).
- **`/pricing`** — móvil: sin overflow de página; la tabla comparativa
  (`min-w-[560px]`) scrollea dentro de su contenedor `overflow-x-auto` (patrón
  correcto, no desborda la página).
- **`/demo`** — móvil: wizard renderiza sin overflow; navegación de pasos OK.
- **Navbar móvil** — botón "Entrar" visible junto a la hamburguesa; el toggle
  abre/cierra el menú (código correcto en `Navbar.tsx`).
- **Modal de auth** — verificado en español tras BUG-2 (ver arriba).
- **Consistencia de placeholders `{{var}}`** entre los 4 idiomas: 0 discrepancias.
- **Claves `t()` estáticas faltantes en el código:** 0 (tras los fixes).
- **`tsc --noEmit`:** sin errores.

---

## Observaciones menores (revisadas, NO arregladas)

Ninguna es un bug de rotura; se dejan documentadas por transparencia.

1. **Race en la cuota de chat gratis** (`api/chat.ts`): el conteo diario se lee
   y se hace `upsert(used+1)` sin atomicidad. Dos peticiones simultáneas podrían
   subcontar en 1 mensaje. Impacto trivial (a favor del usuario). Arreglarlo
   requeriría un RPC atómico en DB — fuera del alcance de "bug de rotura".

2. **`/invite/$token` con email distinto**: si un usuario logueado con un email
   que no coincide abre la invitación, `acceptInvite` lanza el error correcto
   (bien, es la protección de seguridad esperada), pero la pantalla queda sin
   CTA visible tras el toast de error (callejón sin salida de UX). No es rotura;
   mejora de UX posible (mostrar mensaje "inicia sesión con la cuenta correcta").

3. **Idioma por defecto en SSR**: el HTML SSR se renderiza siempre en `es`
   (`lng: "es"`) y el cliente conmuta a `navigator.language` en hidratación. Hay
   `suppressHydrationWarning`, así que no rompe; es un flash breve de idioma en
   la primera carga. Comportamiento intencionado para un mercado principal ES.

4. **Warnings de build (no bloqueantes):** `createServerFn().inputValidator()`
   está deprecado a favor de `.validator()` (en `share.functions.ts` y
   `explore.functions.ts`). Solo warnings; funcionan igual.

---

## Alcance revisado

Rutas (todas): landing, pricing, demo, explore(index/$slug), trip.$slug,
invite.$token, auth, reset-password, checkout.return, email-confirmed, y todas
las `_authenticated/*` (dashboard, new-trip, onboarding, welcome, my-trip,
assistant, copilot, inspire, profile, saved). APIs: chat, og/$slug,
payments/webhook, email/lifecycle/run.

Lógica: itinerary/demo/edit functions, payments, stripe, referral(+emails),
tripmates, share, explore, lifecycle-emails, trip-pass, geocode, google-maps-loader,
flight, country, weather, i18n, y componentes clave (Navbar, AuthModal,
SmartTripMap, GoogleTripMap, BoardingPass, DashboardSidebar, mapas y demo).

Verificado que la lógica de webhooks Stripe (idempotencia del Trip Pass vía
unique index, sync de `profiles.plan`), atribución de referidos (SECURITY
DEFINER, self-referral, recompensa a 3), scheduler de emails de lifecycle
(9 plantillas, ventanas trial 24h/fin, idempotencia por `lifecycle_email_log`),
y el flujo demo→claim son **consistentes en el código**; no se pudieron ejecutar
end-to-end por la limitación de red del SSR local descrita arriba.
