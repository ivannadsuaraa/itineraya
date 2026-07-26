# VALIDATION_REPORT.md

Auditoría de validación de entradas de usuario en todos los formularios y
endpoints del proyecto (2026-07-26). **Cambios ya aplicados** en 8 ficheros +
1 fichero nuevo — no es un borrador. Prioridad pedida: onboarding, demo,
new-trip, profile, auth.

## Resumen

- **20 endpoints server-side inventariados** (todo `createServerFn` en
  `src/lib/*.functions.ts` + las 3 rutas API).
- **8 ya validaban con Zod** correctamente (auditorías previas de esta
  sesión). No se tocan.
- **12 tenían un hueco real** — desde "ninguna validación en absoluto"
  (un `.inputValidator` que solo hace de *type cast*, sin comprobación en
  tiempo de ejecución) hasta "valida a mano, pero no con Zod". Todos
  corregidos.
- **2 formularios de prioridad #1 (onboarding, profile) no pasaban por
  ningún server function** — escribían directamente a Supabase desde el
  cliente. Se creó un `createServerFn` con Zod para cada uno y se migró el
  formulario a usarlo.
- **7 casos revisados y excluidos**, con justificación (Supabase Auth ya
  valida en su propio servidor, páginas sin formulario, webhook firmado,
  etc.).
- Verificado: `tsc --noEmit`, ESLint y Prettier limpios en los 9 ficheros
  tocados; una suite de 33 comprobaciones ejecuta cada esquema Zod nuevo
  contra payloads válidos e inválidos (inyección, enums fuera de rango,
  textos gigantescos, tipos confundidos) — 33/33 pasan; smoke test en
  navegador real de `/onboarding`, `/profile` y `/new-trip` confirma que no
  se ha introducido ningún error de runtime nuevo.

## Metodología

Localicé todo `.inputValidator(...)` de `createServerFn` y clasifiqué cada
uno en tres grupos: **Zod real** (`(d: unknown) => Schema.parse(d)`),
**passthrough sin validar** (`(data: { campo: tipo }) => data` — una
anotación de TypeScript que desaparece en tiempo de compilación y no
comprueba nada en tiempo de ejecución; cualquier JSON con esa forma
aparente, con los tipos que sean, pasa tal cual), y **validación manual**
(comprobaciones a mano con `if`/regex que sí protegen, pero no usan Zod).
Después revisé cada ruta de las 5 áreas prioritarias (`onboarding.tsx`,
`demo.tsx`, `new-trip.tsx`, `profile.tsx`, componentes de auth) para ver si
sus envíos pasan por alguno de esos server functions o si escriben
directamente a Supabase desde el cliente — en ese segundo caso no hay
ningún `createServerFn` al que añadirle Zod, así que la comprobación real es
si debía crearse uno.

---

## Hallazgo prioritario 1 — `onboarding.tsx` escribía a Supabase sin ninguna validación de servidor

`onboarding.tsx` (prioridad #1) hacía `supabase.from("trips").insert(...)`
**directamente desde el cliente**, sin pasar por ningún server function.
Cero límites de longitud, cero comprobación de enums: `companion`, `pace`,
`dietary`, `tripTypes` podían llegar con cualquier valor, `avoid` /
`hotel_name` / `hotel_address` / `trip_style` sin tope de caracteres. Estos
mismos campos se leen después en `generateItinerary` y se interpolan tal
cual en el prompt enviado a Anthropic (`travelerBlock`, `logisticsBlock`,
`accommodationBlock`) — un valor de `pace` fuera de `"relaxed"|"balanced"|
"intense"` no tiene entrada en `paceMap` y su línea del prompt queda vacía o
rara; un `avoid` de varios cientos de KB se paga en tokens de cada
generación.

### Fix — nuevo `createTrip` en `itinerary.functions.ts`

```ts
const CreateTripInput = z
  .object({
    destination: z.string().trim().min(2).max(120),
    startDate: z.string().regex(DATE_RE).nullable(),
    endDate: z.string().regex(DATE_RE).nullable(),
    arrivalTime: z.string().regex(TIME_RE).nullable(),
    departureTime: z.string().regex(TIME_RE).nullable(),
    companion: z.enum(["solo", "pareja", "amigos", "familia"]),
    budgetRange: z
      .tuple([z.number().int().min(0).max(200000), z.number().int().min(0).max(200000)])
      .refine(([lo, hi]) => lo <= hi, "budgetRange must be [low, high] with low <= high"),
    tripStyle: z.string().trim().max(400).nullable(),
    avoid: z.string().trim().max(500).nullable(),
    tripTypes: z.array(z.enum([...11 valores exactos del selector...])).max(15),
    hasAccommodation: z.boolean(),
    hotelName: z.string().trim().max(200).nullable(),
    hotelAddress: z.string().trim().max(300).nullable(),
    hotelLat: z.number().min(-90).max(90).nullable(),
    hotelLng: z.number().min(-180).max(180).nullable(),
    pace: z.enum(["relaxed", "balanced", "intense"]),
    firstVisit: z.boolean(),
    dietary: z.array(z.enum(["vegetarian","vegan","glutenFree","halal","allergies"])).max(5),
    geoLat: z.number().min(-90).max(90).nullable().optional(),
    geoLng: z.number().min(-180).max(180).nullable().optional(),
  })
  .refine((d) => !d.startDate || !d.endDate || d.startDate <= d.endDate, {
    message: "endDate must not be before startDate", path: ["endDate"],
  });

export const createTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateTripInput.parse(d))
  .handler(async ({ data, context }) => {
    // user_id sale de context.userId (el token verificado), nunca del payload.
    // Mismo INSERT + mismo fallback de columnas opcionales que tenía
    // onboarding.tsx, movido aquí.
  });
```

Los enums (`companion`, `pace`, `dietary`, `tripTypes`) se sacaron
literalmente de los `<select>`/chips de `onboarding.tsx` para no inventar
valores que luego no encajen con la UI. `onboarding.tsx` se modificó para
llamar a `createTrip` vía `useServerFn` en vez del INSERT directo — mismo
comportamiento observable (misma pantalla de despegue, mismo fallback de
geocodificación en segundo plano), pero ahora con un límite real de
servidor.

---

## Hallazgo prioritario 2 — `profile.tsx` (`handleSavePrefs`), mismo patrón

`UPDATE` directo a `profiles` desde el cliente. Los 4 campos de preferencias
son `<select>` con opciones fijas en el HTML — pero nada impedía un POST
directo con un valor fuera de esas opciones, y `preferredDestinations` (un
`<input>` de texto libre separado por comas) no tenía tope de entradas ni de
longitud por entrada. Estos campos también los lee `generateItinerary`
(`preferred_destinations`, `travel_style`, `budget_range`, `traveler_type` →
`travelerProfileLine`).

### Fix — nuevo fichero `src/lib/profile.functions.ts`

```ts
const Input = z.object({
  travelStyle: z.enum(["adventure","relax","cultural","romantic","family","party","nature"]).nullable(),
  budgetRange: z.enum(["low", "medium", "high", "luxury"]).nullable(),
  travelerType: z.enum(["solo", "couple", "family", "friends", "business"]).nullable(),
  preferredDestinations: z.array(z.string().trim().min(1).max(80)).max(20),
});

export const updateProfilePrefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").update({
      travel_style: data.travelStyle, budget_range: data.budgetRange,
      preferred_destinations: data.preferredDestinations, traveler_type: data.travelerType,
    } as never).eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
```

`profile.tsx` ahora llama a `updateProfilePrefs` en vez del `UPDATE` directo.

---

## Los 10 restantes: de "sin validar" o "validación manual" a Zod

En todos estos el `.inputValidator` era exactamente esta forma —
una anotación de tipo sin ningún `.parse()`, `.safeParse()` ni chequeo:
`.inputValidator((data: { tripId: string }) => data)`. TypeScript no existe
en tiempo de ejecución: un POST con `{"tripId": 12345}` o
`{"tripId": ["a","b"]}` llegaba tal cual al handler.

| Fichero | Función | Antes | Ahora |
|---|---|---|---|
| `explore.functions.ts` | `setTripPublic` | passthrough sin validar | `z.object({ tripId: z.string().uuid(), isPublic: z.boolean() })` |
| `explore.functions.ts` | `listPublicTrips` | passthrough sin validar | `destination/style` acotados, `durationBucket` enum, `limit` 1-100 |
| `explore.functions.ts` | `rateTrip` | passthrough + `if (rating<1\|\|>5)` a mano | `SlugInput.extend({ rating: z.number().int().min(1).max(5) })` |
| `explore.functions.ts` | `getDiscoverableTrip` | passthrough sin validar | `SlugInput` (regex `^[a-z0-9-]+$`, igual que produce `slugify()`) |
| `share.functions.ts` | `enableTripShare` | passthrough sin validar | `z.object({ tripId: z.string().uuid() })` |
| `share.functions.ts` | `getPublicTrip` | passthrough sin validar | `SlugInput` |
| `referral.functions.ts` | `attributeAcquisition` | passthrough sin validar | `referredBy` como UUID, `utmSource` acotado a 100 chars (ambos vienen de query params de la URL, atacante-controlados por diseño) |
| `payments.functions.ts` | `createCheckoutSession` | regex/enum a mano | Zod equivalente: `priceId` regex, `environment`/`mode` enum, `returnUrl` como URL válida |
| `payments.functions.ts` | `createPortalSession` | enum a mano | Zod equivalente |
| `api/chat.ts` | handler POST | `as ChatRequestBody` (cast puro, cero comprobación) | Zod para `mode`, `clientNow` y cada campo de `tripContext` (interpolados tal cual en el prompt); `messages` se mantiene como array acotado (ver nota) |

**Nota sobre `messages` en `api/chat.ts`:** no se validó en profundidad
contra el esquema `UIMessage` del AI SDK (estructura anidada de `parts` que
varía por proveedor/versión) — acoplarse a esa forma exacta con Zod sería
frágil ante actualizaciones de la librería y podría rechazar mensajes
legítimos si el esquema no coincide al dedillo. Se mantiene la comprobación
ligera ya existente (`Array.isArray` + tope de 60) y se deja que
`convertToModelMessages` rechace cualquier mensaje mal formado — es la
frontera correcta para esa validación estructural, Zod añade valor en los
campos de texto libre propios de la app (`tripContext.*`), no en replicar el
tipo de una librería externa.

**Nota sobre `SlugInput`:** todos los `share_slug` los genera el propio
servidor (`slugify(destino) + "-Ndias" + "-" + sufijo aleatorio base36`,
`enableTripShare`/`setTripPublic`) — nunca mayúsculas ni caracteres fuera de
`[a-z0-9-]`. El regex de validación refleja exactamente esa forma, así que
cualquier slug con forma distinta (intento de inyección, tipo confundido)
se rechaza en el borde antes de tocar la base de datos.

## Formularios/endpoints revisados sin cambios (con justificación)

| Área | Motivo |
|---|---|
| `AuthModal.tsx` (signup, login, forgot, resend, Google OAuth) | Llama a `supabase.auth.*` directamente — la API de Auth de Supabase (GoTrue) es el servidor que valida formato de email y política de contraseña en su propia infraestructura. No existe una frontera `createServerFn` propia de la app a la que añadir Zod sin construir un backend de auth completo (fuera de alcance) |
| `reset-password.tsx` | `supabase.auth.updateUser({ password })` — mismo caso |
| `contact.tsx` | Página estática con un enlace `mailto:`, no envía ningún formulario al servidor |
| `new-trip.tsx` | Pantalla de enrutamiento/gate de plan (navega a `/onboarding` o `/pricing`) — no envía datos propios |
| `api/og/$slug.ts` | El `slug` de la ruta se usa en una consulta parametrizada seguro (no SQL crudo); el handler entero está diseñado para degradar con gracia ante cualquier fallo (nunca da error a un scraper, siempre cae a una imagen estática) — Zod no añade protección real sobre un diseño que ya no puede fallar de forma insegura |
| `api/public/payments/webhook.ts` | La verificación de firma de Stripe (`stripe.webhooks.constructEvent`) es la validación/autenticación real; el payload lo tipa el SDK de Stripe, no es entrada de usuario |
| `geocode.ts :: geocodeAndPersistTrip` | Escribe `geo_lat`/`geo_lng` numéricos derivados de una respuesta de la API de Nominatim (no texto libre tecleado por el usuario) sobre su propia fila; el tipo de columna (`DOUBLE PRECISION`) y RLS ya acotan esto |
| `tripmates.functions.ts` (`inviteTripmate`, `listTripmates`, `acceptInvite`) | Ya validaban con Zod correctamente (auditoría previa) — no se tocan |
| `demo.functions.ts`, `inspire.functions.ts`, `itinerary-edit.functions.ts`, `news.functions.ts` | Ya validaban con Zod correctamente — no se tocan |
| `itinerary.functions.ts :: generateItinerary` | Ya validaba `tripId`/`language` con Zod — no se tocó (el hallazgo aquí fue el hueco de `createTrip`, no de esta función) |

## Verificación

1. **`npx tsc --noEmit`** — limpio en todo el proyecto tras los 9 ficheros.
2. **ESLint** y **Prettier** — limpios en los 9 ficheros tocados (formato
   autocorregido donde hacía falta).
3. **Suite de 33 comprobaciones runtime** contra cada esquema Zod nuevo
   (payloads válidos aceptados; enums inventados, fechas/horas mal
   formadas, rangos invertidos, textos de 10.000 caracteres, arrays de 500
   elementos, tipos confundidos, y formas de inyección SQL en campos de
   texto — todos rechazados). 33/33 pasan.
4. **Smoke test en navegador real** (Chromium/Playwright) de `/onboarding`,
   `/profile` y `/new-trip`: las tres cargan (200), redirigen correctamente
   al guard de autenticación sin sesión, y no introducen ningún error de
   runtime nuevo — confirmado comparando explícitamente contra el código
   sin modificar (mismo aviso de hidratación preexistente en ambos casos,
   no relacionado con estos cambios).

## Ficheros modificados

```
src/lib/itinerary.functions.ts    — + createTrip (Zod completo), generateItinerary sin cambios
src/lib/profile.functions.ts      — nuevo: updateProfilePrefs (Zod)
src/lib/explore.functions.ts      — setTripPublic, listPublicTrips, rateTrip, getDiscoverableTrip → Zod
src/lib/share.functions.ts        — enableTripShare, getPublicTrip → Zod
src/lib/referral.functions.ts     — attributeAcquisition → Zod (UUID + longitud)
src/lib/payments.functions.ts     — createCheckoutSession, createPortalSession → Zod
src/routes/api/chat.ts            — body validado con Zod (mode, clientNow, tripContext.*)
src/routes/_authenticated/onboarding.tsx — usa createTrip en vez de INSERT directo
src/routes/_authenticated/profile.tsx    — usa updateProfilePrefs en vez de UPDATE directo
```
