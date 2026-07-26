# RATE_LIMIT_REPORT.md

Auditoría de rate limiting en todos los endpoints públicos y autenticados del
proyecto (2026-07-26). **Los cambios YA están aplicados** en el código (no es
un borrador): 8 ficheros modificados, `tsc --noEmit` y ESLint limpios en
todos ellos.

## Resumen

- **20 endpoints inventariados** (17 `createServerFn` en `src/lib/*.functions.ts` +
  3 rutas API en `src/routes/api/`).
- **3 ya tenían rate limiting** vía `check_and_increment_rate_limit` (auditoría
  previa del 2026-07-12): `generateDemoItinerary`, `suggestDestinations`,
  `editItineraryWithAssistant`. No se tocan.
- **1 ya tenía rate limiting con un mecanismo distinto** (`inviteTripmate`,
  contador rolling de 24h contra `trip_invites`) — funcional, se documenta
  pero no se migra (ver sección "No modificado").
- **11 endpoints sin ningún límite → corregidos** en este informe, todos
  usando la RPC `check_and_increment_rate_limit` sobre `rate_limit_counters`
  (mismo patrón ya establecido en la auditoría de seguridad del 2026-07-12).
- **5 endpoints revisados y excluidos deliberadamente**, con justificación
  (lecturas públicas puras, webhook firmado, código muerto).

## Metodología

Se leyó el cuerpo completo de los 20 endpoints y se clasificó cada uno según
la prioridad pedida: llama a Anthropic, llama a Unsplash/otra API externa de
pago, o modifica datos. Para cada uno sin protección se añadió la misma
llamada RPC ya usada en el resto del proyecto:

```ts
const { data: allowed, error: rlErr } = await supabaseAdmin.rpc(
  "check_and_increment_rate_limit" as never,
  { p_scope: "<scope>", p_key: "<userId o hash de IP>", p_limit: N } as never,
);
if (rlErr) { /* fail closed: bloquear */ }
if (!allowed) { /* límite alcanzado */ }
```

`check_and_increment_rate_limit(p_scope, p_key, p_limit)` (definida en
`supabase/migrations/20260712090000_security_audit_fixes.sql`) hace un UPSERT
atómico sobre `rate_limit_counters(scope, key, day, count)` — un contador real
por (scope, key, día), a prueba de condición de carrera entre instancias
lambda concurrentes, a diferencia de un `Map` en memoria de proceso.

---

## Hallazgo prioritario — `generateItinerary` (Anthropic + Unsplash + escribe `trips`)

**El endpoint más importante de todo el proyecto no tenía ningún límite real.**

`src/lib/itinerary.functions.ts` solo comprobaba un límite de plan basado en
viajes ya `status = "ready"`:
- Plan `explorador`: `planLimit = null` → **sin límite alguno**.
- El conteo excluye expresamente el `tripId` actual (`.neq("id", data.tripId)`),
  así que **reintentar la generación sobre el mismo viaje no listo** (una
  llamada a Claude que falla, un timeout, un bucle scripteado) nunca
  incrementa ese contador — cada reintento dispara una llamada real y
  facturable a `api.anthropic.com` (hasta `max_tokens: 16000`) más varias
  llamadas a Unsplash, sin límite.

### Fix aplicado

```ts
// src/lib/itinerary.functions.ts
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Safety net independiente del límite de plan (que solo cuenta viajes ya
// "ready"). Cubre: reintentos sobre el mismo tripId no listo, y el plan
// explorador (que no tiene tope de plan en absoluto).
const DAILY_GENERATE_LIMIT = 20;

// ...dentro del handler, justo después del early-return de caché
// (trip.status === "ready") y ANTES de tocar la API key / hacer la llamada:
const { data: allowed, error: rlErr } = await supabaseAdmin.rpc(
  "check_and_increment_rate_limit" as never,
  { p_scope: "itinerary_generate_user", p_key: userId, p_limit: DAILY_GENERATE_LIMIT } as never,
);
if (rlErr) {
  console.error("[itinerary] rate limit check failed", rlErr);
  throw new Error("No se pudo procesar la solicitud. Inténtalo de nuevo.");
}
if (!allowed) {
  throw new Error(
    `LIMIT_REACHED: Has alcanzado el límite de ${DAILY_GENERATE_LIMIT} generaciones diarias. Inténtalo mañana.`,
  );
}
```

Colocado **después** del `if (trip.status === "ready") return ...` para no
gastar cupo en resultados servidos desde caché, y **antes** de la llamada a
Anthropic, para que cubra exactamente los reintentos que sí cuestan dinero.
Falla en modo cerrado (bloquea) si la RPC falla — coherente con el resto de
endpoints de IA ya protegidos.

---

## Otros endpoints corregidos

### 2–3. `share.functions.ts` — `getPublicTrip` y `enableTripShare`

`getPublicTrip` es **público, sin autenticación**, y escribe
`trips.view_count` en cada llamada vía `increment_trip_view_count`. Sin
límite, cualquiera puede inflar por script el contador de vistas de
**cualquier** viaje público — la señal de popularidad que ve todo el mundo en
`/explore`. Al no requerir sesión, el límite es por IP (mismo patrón hash+IP
ya usado en `demo.functions.ts`), y **falla abierto**: si la RPC de límite
falla, la página se sigue sirviendo (no se penaliza a scrapers de redes
sociales ni a visitantes reales por un fallo del limitador) — solo se omite
el incremento del contador cuando el límite se alcanza o la comprobación
falla.

```ts
// src/lib/share.functions.ts — nuevo, arriba del fichero
import { getRequest } from "@tanstack/react-start/server";
import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const VIEW_PER_IP_DAILY_LIMIT = 300; // generoso: nunca lo alcanza navegación real

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}
function resolveClientIp(request: Request | null): string {
  const xri = request?.headers.get("x-real-ip");
  if (xri) return xri.trim();
  const xff = request?.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return "unknown";
}

// dentro de getPublicTrip, antes de cualquier otra cosa:
const ip = resolveClientIp(getRequest() ?? null);
const { data: viewAllowed, error: rlErr } = await supabaseAdmin.rpc(
  "check_and_increment_rate_limit" as never,
  { p_scope: "trip_view_ip", p_key: hashIp(ip), p_limit: VIEW_PER_IP_DAILY_LIMIT } as never,
);
const countView = !rlErr && !!viewAllowed; // fail-open: solo se omite el incremento

// ...más abajo, el incremento real queda condicionado:
if (countView) {
  const { data: newCount } = await client.rpc("increment_trip_view_count" as never, {
    trip_slug: data.slug,
  } as never);
  // ...notificación de hito sin cambios
}
```

`enableTripShare` (autenticado, escribe `share_slug`/`is_public` del propio
viaje) recibe un límite por usuario, igual que su gemelo funcional
`setTripPublic` en `explore.functions.ts`:

```ts
const SHARE_TOGGLE_DAILY_LIMIT = 30;
const { data: allowed, error: rlErr } = await supabaseAdmin.rpc(
  "check_and_increment_rate_limit" as never,
  { p_scope: "trip_share_user", p_key: userId, p_limit: SHARE_TOGGLE_DAILY_LIMIT } as never,
);
if (rlErr) throw new Error("No se pudo procesar la solicitud. Inténtalo de nuevo.");
if (!allowed) throw new Error(`Has alcanzado el límite de ${SHARE_TOGGLE_DAILY_LIMIT} cambios diarios de este tipo. Inténtalo mañana.`);
```

### 4–5. `explore.functions.ts` — `setTripPublic` y `rateTrip`

`setTripPublic` es funcionalmente un duplicado de `enableTripShare` (dos
componentes de UI distintos, `PublishToggle.tsx` y `ShareDialog.tsx`, cada uno
con su propia función) — mismo límite, mismo scope de cara al usuario
(`trip_publish_user`, separado de `trip_share_user` porque son endpoints
distintos aunque hagan algo parecido).

`rateTrip` modifica `trips.rating_sum/rating_count` (vía la RPC
`increment_trip_rating`, ya con un registro por usuario en `trip_ratings`
desde la auditoría anterior) — pero nada impedía que un usuario cambiara su
voto en bucle (1→5→1→5...) generando escrituras reales sobre la fila del
viaje en cada llamada. Límite añadido:

```ts
const PUBLISH_TOGGLE_DAILY_LIMIT = 30;
const RATE_TRIP_DAILY_LIMIT = 20;

// setTripPublic:
{ p_scope: "trip_publish_user", p_key: userId, p_limit: PUBLISH_TOGGLE_DAILY_LIMIT }

// rateTrip:
{ p_scope: "trip_rate_user", p_key: userId, p_limit: RATE_TRIP_DAILY_LIMIT }
```

`listPublicTrips` y `getDiscoverableTrip` (mismo fichero) son **lectura pura,
pública, sin escritura** — se revisan y se excluyen deliberadamente (ver
sección final).

### 6. `news.functions.ts` — `getDestinationNews`

Llama a NewsAPI (API externa de pago) y escribe en la caché
`destination_news_cache`. La caché de 24h hace gratis repetir el mismo
destino, pero un script que pruebe muchos destinos distintos fuerza una
llamada real a NewsAPI en cada uno (siempre cache-miss). Límite por usuario:

```ts
const DAILY_LIMIT = 60;
const { data: allowed, error: rlErr } = await supabaseAdmin.rpc(
  "check_and_increment_rate_limit" as never,
  { p_scope: "news_user", p_key: context.userId, p_limit: DAILY_LIMIT } as never,
);
if (rlErr) return []; // coherente con la filosofía ya existente del fichero:
if (!allowed) return []; // "devuelve [] ante cualquier fallo"
```

### 7–8. `payments.functions.ts` — `createCheckoutSession` y `createPortalSession`

Ambos llaman a la API de Stripe (`customers.search/list/create`,
`checkout.sessions.create`, `billingPortal.sessions.create`) sin ningún
límite. Riesgo real: `customers.search` usa la API de búsqueda de Stripe, que
tiene límites de tasa propios más estrictos — machacarla desde una cuenta
comprometida puede acabar limitando o bloqueando la clave de API **para
todos los usuarios reales**, no solo para el atacante.

```ts
const PAYMENTS_DAILY_LIMIT = 20;
// en cada handler, antes de tocar Stripe:
const { data: allowed, error: rlErr } = await supabaseAdmin.rpc(
  "check_and_increment_rate_limit" as never,
  { p_scope: "checkout_user" /* o "portal_user" */, p_key: userId, p_limit: PAYMENTS_DAILY_LIMIT } as never,
);
if (rlErr) return { error: "No se pudo procesar la solicitud. Inténtalo de nuevo." };
if (!allowed) return { error: `Has alcanzado el límite de ${PAYMENTS_DAILY_LIMIT} solicitudes diarias. Inténtalo mañana.` };
```

### 9. `referral.functions.ts` — `attributeAcquisition`

Modifica `profiles` vía la RPC `attribute_acquisition` y puede encolar un
email al referidor. Encontrado durante la revisión: la RPC devuelve
`referrer_id` no-nulo **incluso cuando la atribución ya estaba fijada de
antes** (el `UPDATE` interno es write-once, pero el valor de retorno no lo
es), así que `notifyReferrer` se dispara en **cada** llamada al endpoint —
y `captureReferralFromLocation()` corre en cada montaje de la raíz de la
app. Sin límite, esto es un vector real de spam de emails al referidor.

```ts
const DAILY_LIMIT = 10; // legítimo: una atribución real en toda la vida del usuario
const { data: allowed, error: rlErr } = await supabaseAdmin.rpc(
  "check_and_increment_rate_limit" as never,
  { p_scope: "referral_attribute_user", p_key: userId, p_limit: DAILY_LIMIT } as never,
);
if (rlErr) throw new Error("No se pudo procesar la solicitud. Inténtalo de nuevo.");
if (!allowed) throw new Error("Has alcanzado el límite de solicitudes diarias. Inténtalo mañana.");
```

### 10. `tripmates.functions.ts` — `acceptInvite`

Modifica `trip_members`/`trip_invites` (vía `supabaseAdmin`, ya usado en este
handler para leer el invite por token). El token tiene 256 bits de entropía
(dos UUIDv4 concatenados sin guiones) — fuerza bruta del token es inviable —
pero cada intento con un token erróneo sigue costando una consulta real, y es
un endpoint que escribe datos. Se añade un límite ligero por defensa en
profundidad:

```ts
const ACCEPT_INVITE_DAILY_LIMIT = 20;
const { data: allowed, error: rlErr } = await supabaseAdmin.rpc(
  "check_and_increment_rate_limit" as never,
  { p_scope: "accept_invite_user", p_key: userId, p_limit: ACCEPT_INVITE_DAILY_LIMIT } as never,
);
if (rlErr) throw new Error("No se pudo procesar la solicitud. Inténtalo de nuevo.");
if (!allowed) throw new Error(`Has alcanzado el límite de ${ACCEPT_INVITE_DAILY_LIMIT} solicitudes diarias. Inténtalo mañana.`);
```

### 11. `src/routes/api/chat.ts` — planes de pago sin tope

El chat con IA (Anthropic, streaming) ya limitaba el plan `free` a 10
mensajes/día vía la tabla `chat_usage` — pero **Viajero y Explorador no
tenían ningún límite**: "mensajes ilimitados" es la promesa comercial, pero
eso no debería significar "gasto ilimitado en Anthropic si una cuenta de pago
se ve comprometida o scripteada". Se añade una red de seguridad muy generosa
que ningún uso conversacional real roza:

```ts
} else {
  const PAID_DAILY_SAFETY_LIMIT = 300;
  const { data: allowed, error: rlErr } = await supabaseAdmin.rpc(
    "check_and_increment_rate_limit" as never,
    { p_scope: "chat_message_user", p_key: userId, p_limit: PAID_DAILY_SAFETY_LIMIT } as never,
  );
  if (rlErr) {
    return new Response("No se pudo procesar la solicitud. Inténtalo de nuevo.", { status: 500 });
  }
  if (!allowed) {
    return new Response(
      `LIMIT_REACHED: Has alcanzado el límite de ${PAID_DAILY_SAFETY_LIMIT} mensajes diarios. Inténtalo mañana.`,
      { status: 429 },
    );
  }
}
```

(El límite del plan free vía `chat_usage` no se toca — sigue funcionando
igual; nota aparte: ese contador usa un patrón leer-luego-escribir no atómico,
así que dos pestañas simultáneas podrían colarse 1 mensaje de más en el
límite gratuito bajo una condición de carrera — mencionado por completitud,
no corregido aquí porque el endpoint YA tenía protección y el encargo era
cubrir los que no la tenían.)

---

## No modificado (con justificación)

| Endpoint | Motivo |
|---|---|
| `demo.functions.ts :: generateDemoItinerary` | Ya protegido (IP + tope global diario vía `check_and_increment_rate_limit`, auditoría 2026-07-12) |
| `inspire.functions.ts :: suggestDestinations` | Ya protegido (por usuario, misma RPC) |
| `itinerary-edit.functions.ts :: editItineraryWithAssistant` | Ya protegido (por usuario, misma RPC) |
| `tripmates.functions.ts :: inviteTripmate` | Ya tiene límite (20/día), pero con un `COUNT` sobre una ventana rolling de 24h contra `trip_invites` en vez de la RPC compartida. Funciona (evita el spam de email vía Resend), aunque el patrón leer-luego-comparar tiene una ventana de carrera teórica que la RPC atómica no tiene. Se documenta como mejora futura opcional, no se toca porque el encargo era añadir límite donde falta, no unificar el mecanismo donde ya existe uno funcional |
| `explore.functions.ts :: listPublicTrips` | GET público, solo lectura, sin llamada a IA/Unsplash/Stripe. Es la página de exploración — limitar esto perjudica la experiencia de navegación legítima sin ganancia real de seguridad |
| `explore.functions.ts :: getDiscoverableTrip` | Igual que el anterior: lectura pública pura |
| `api/og/$slug.ts` | Lee `trips` (solo lectura) y compone una imagen (satori + resvg) — coste de CPU, no de una API de pago por llamada. Es consumido por bots de redes sociales (Facebook/Twitter/WhatsApp) que refrescan la preview desde IPs muy variadas cada vez que se comparte un enlace; un límite por IP rompería esas previews. Se revisó y se decide no aplicar límite — el endpoint ya degrada con gracia (nunca devuelve error a un scraper, cae a una imagen estática) |
| `api/public/payments/webhook.ts` | La firma de Stripe (`stripe.webhooks.constructEvent`) **es** el control de acceso — solo Stripe puede producir una firma válida con el secreto compartido. Añadir un límite por IP/usuario no aporta seguridad (Stripe llama desde IPs variables) y sí arriesga descartar reintentos legítimos de entrega de eventos |
| `lib/api/example.functions.ts :: getGreeting` | Código de ejemplo del boilerplate, no usado por ninguna ruta ni componente (verificado por grep) — no es un endpoint real en producción |

## Verificación

- `npx tsc --noEmit` — sin errores en todo el proyecto tras los 8 ficheros modificados.
- `npx eslint` sobre los 8 ficheros — sin errores ni warnings.
- `npx prettier --check` — formato corregido automáticamente donde hacía falta; limpio tras el `--write`.
- No se ejecutó contra una base de datos real (la RPC `check_and_increment_rate_limit` ya existe en producción desde la migración `20260712090000_security_audit_fixes.sql`, verificado en el código SQL, no se necesita una migración nueva).

## Ficheros modificados

```
src/lib/itinerary.functions.ts   — generateItinerary (Anthropic + Unsplash) — PRIORITARIO
src/lib/share.functions.ts       — getPublicTrip (IP), enableTripShare (usuario)
src/lib/explore.functions.ts     — setTripPublic, rateTrip (usuario)
src/lib/news.functions.ts        — getDestinationNews (usuario)
src/lib/payments.functions.ts    — createCheckoutSession, createPortalSession (usuario)
src/lib/referral.functions.ts    — attributeAcquisition (usuario)
src/lib/tripmates.functions.ts   — acceptInvite (usuario)
src/routes/api/chat.ts           — chat, red de seguridad para planes de pago (usuario)
```
