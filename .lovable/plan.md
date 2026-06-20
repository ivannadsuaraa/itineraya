## 1. Migrar IA a Anthropic Claude Haiku 4.5

Reemplazar el gateway de Lovable AI (Gemini) por llamadas directas a la API de Anthropic usando `ANTHROPIC_API_KEY` (ya en secrets) y el modelo `claude-haiku-4-5`.

Archivos:
- `src/lib/itinerary.functions.ts` — la llamada AI principal de generación.
- `src/lib/inspire.functions.ts` (línea 109, `google/gemini-2.5-flash`).
- `src/lib/itinerary-edit.functions.ts` (línea 108).
- `src/routes/api/chat.ts` (líneas 49–92, usa `GEMINI_API_KEY` + gateway).

Enfoque: usar el SDK `@anthropic-ai/sdk` (instalar) y crear un pequeño helper `src/lib/anthropic.server.ts` que exponga:
- `generateJSON({ system, prompt, schema })` para los flujos de generación/edición/inspire (one-shot, JSON).
- Streaming para `routes/api/chat.ts` con `client.messages.stream(...)` devolviendo un `Response` SSE compatible con el cliente actual de chat (revisar formato esperado por `useChat`/transport antes de implementar; si el cliente usa AI SDK UI, mantenerlo con el provider OpenAI-compatible pero apuntar a un wrapper Anthropic — alternativa: usar `@ai-sdk/anthropic`). Decisión: instalar `@ai-sdk/anthropic` para mantener compatibilidad con `streamText` / `generateText` ya usados y solo cambiar el `model` y la key.

Resultado: borrar dependencia de `LOVABLE_API_KEY`/`GEMINI_API_KEY` en estos 4 archivos; mantener system prompts y validadores intactos.

## 2. Bug crítico de privacidad en "Mis viajes"

Causa raíz probable: la consulta del dashboard (`src/routes/_authenticated/dashboard.tsx` línea 86–89) hace `from("trips").select(...)` **sin filtrar por `user_id`**, confiando solo en RLS — y la política de RLS sobre `trips` debe estar permitiendo lectura pública (añadida cuando se implementó `/explore`).

Arreglo en dos capas:
1. **Cliente**: añadir `.eq("user_id", u.user.id)` a la query del dashboard.
2. **RLS**: revisar las policies de `trips`. Mantener:
   - SELECT propio: `auth.uid() = user_id`.
   - SELECT público SOLO si `is_public = true` (para `/explore`, usado desde server functions sin user scope).
   Eliminar/corregir cualquier policy que permita SELECT amplio a `authenticated`.

Verificar también `saved_inspirations` y otras queries en dashboard/profile que puedan tener el mismo patrón.

## 3. Mostrar barra inferior móvil en todas las pantallas autenticadas excepto las indicadas

La `MobileBottomBar` se renderiza hoy en `src/routes/_authenticated/route.tsx`. Añadir lógica para ocultarla en rutas:
- `/onboarding`
- `/auth` (no es autenticada, ya excluida)
- pantalla de carga de itinerario: la ruta `trip.$tripId` cuando `status !== "ready"` (estado generando). Detectarlo con un flag en contexto o más simple: ocultar siempre que la ruta sea `trip.$tripId` y leer el estado vía hook ligero; alternativa pragmática: ocultar en `/onboarding` y dejar la barra en trip; añadir condición específica del loader si confirmas. Decisión propuesta: ocultar en `/onboarding`, `/welcome` y rutas que matchen `trip.$tripId` mientras `status === "generating"`.

Implementación: usar `useRouterState({ select: s => s.location.pathname })` + un pequeño hook que consulte `trips.status` cuando aplique.

## 4. Logo clicable a la home en todas las pantallas

- Dashboard sidebar/header (`DashboardSidebar.tsx`): el logo ya apunta a `/` (cambio reciente). Verificar.
- Pantallas autenticadas en móvil: añadir un **header superior fijo** con el logo (link a `/`) en `_authenticated/route.tsx`, visible en todas las rutas autenticadas. Reusar `BrandLogo`.
- Pantallas públicas (`auth`, `pricing`, `explore`, `trip.$slug`): asegurar que el `Navbar` (o un mini-header) incluye logo→`/`.

## 5. Flecha de retroceso global

Añadir en el header superior fijo (paso 4) un botón `ArrowLeft` que haga `router.history.back()`. Ocultarlo en la home (`/`) y en `/dashboard` (raíz autenticada). Mismo componente para móvil y desktop.

## 6. Verificar botón "Empieza gratis"

En `HeroSection.tsx` línea 109–116: si no hay sesión, lleva a `/auth?mode=signup`. Verificar:
- que `/auth` lee `search.mode === "signup"` y muestra el formulario de registro.
- que el botón del `Navbar` (línea 84, 148) hace lo mismo.
- E2E rápido con Playwright para confirmar el flujo.

---

## Orden de implementación

1. Bug de privacidad (#2) — crítico, primero.
2. Migración a Anthropic (#1).
3. Header superior + logo + back (#4, #5) en `_authenticated/route.tsx`.
4. Visibilidad de la bottom bar (#3).
5. Verificación del botón (#6).

## Detalles técnicos

- Instalar: `@ai-sdk/anthropic` (mantiene `streamText`/`generateText` actuales).
- Cambiar provider en cada archivo: `import { anthropic } from "@ai-sdk/anthropic"` y `model: anthropic("claude-haiku-4-5")`. La SDK lee `ANTHROPIC_API_KEY` automáticamente.
- Migración SQL para corregir policies de `trips` (DROP la policy permisiva, recrear con `auth.uid() = user_id` para SELECT privado + `is_public = true` para SELECT público anon).
- `MobileBottomBar` y header: usar `useRouterState` para path; nada de estado global.
