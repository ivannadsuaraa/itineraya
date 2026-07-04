# AUDIT_REPORT.md — Auditoría técnica completa de Itineraya

**Fecha:** 2026-07-04 · **Alcance:** todo `src/`, `supabase/migrations/`, `public/`, configuración.
**Metodología:** revisión manual de código (skills: code-auditor, karpathy-guidelines, ui-ux-pro-max), verificación cruzada entre código cliente, server functions y políticas RLS.

**Leyenda de estado:** ✅ CORREGIDO en esta sesión (sin commit) · ⚠️ PENDIENTE · 🔍 VERIFICAR en producción.

---

## Resumen ejecutivo

| Categoría | Críticos | Altos | Medios | Bajos |
|---|---|---|---|---|
| Seguridad | 4 | 2 | 5 | 3 |
| Bugs | 2 | 4 | 8 | 6 |
| UI/UX | — | 4 | 8 | 6 |
| Performance | — | 2 | 5 | 3 |

**Los 3 problemas más graves encontrados (los 3 corregidos):**
1. **Cualquier usuario podía darse el plan Explorador gratis** vía la API REST de Supabase (RLS sin restricción de columnas en `profiles`).
2. **Pagar no desbloqueaba nada**: ningún código actualizaba `profiles.plan` tras un pago de Stripe; todos los gates de servidor seguían tratando al usuario como `free`.
3. **El webhook de emails de auth no tenía autenticación**: cualquiera podía usar Itineraya como relay de phishing con remitente oficial `noreply@itineraya.com`.

**Acción inmediata requerida (fuera del código):**
- Aplicar la migración nueva `supabase/migrations/20260704090000_security_hardening_and_missing_columns.sql` en producción.
- Definir `SEND_EMAIL_HOOK_SECRET` en Vercel **y** en la configuración del auth hook de Supabase (hasta entonces el endpoint sigue abierto, solo loguea un warning).
- 🔍 Verificar si `profiles.trial_ends_at`, `trips.geo_lat/geo_lng`, `trips.rating_sum/rating_count` existían ya en la BD de producción (creadas a mano). Si no existían, **el dashboard y el welcome estaban rotos para todos los usuarios** (ver BUG-01).

---

## 1. SEGURIDAD

### 🔴 Críticos

**SEC-01 — Escalada de plan self-service** ✅
[20260609133222…sql](supabase/migrations/20260609133222_24d83aca-cce4-4db1-840f-8876ba6360b8.sql) — `GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated` + policy `Users can update own profile` sin restricción de columnas.
Cualquier usuario autenticado podía ejecutar `PATCH /rest/v1/profiles?id=eq.<su-id> {"plan":"explorador"}` con la publishable key y obtener el plan premium gratis (itinerarios ilimitados, asistente, edición IA).
**Fix aplicado:** grant de UPDATE por columnas excluyendo `plan` en la migración nueva (sección 2). Solo `service_role` (webhook Stripe) puede cambiarlo.

**SEC-02 — El pago nunca actualizaba el plan** ✅
[webhook.ts:45-97](src/routes/api/public/payments/webhook.ts:45) solo hacía upsert en `subscriptions`. Pero **todos** los gates de servidor leen `profiles.plan`: [itinerary.functions.ts:170](src/lib/itinerary.functions.ts:170), [chat.ts:49](src/routes/api/chat.ts:49), [itinerary-edit.functions.ts:37](src/lib/itinerary-edit.functions.ts:37), y toda la UI ([assistant.tsx:39](src/routes/_authenticated/assistant.tsx:39), [my-trip.$tripId.tsx:220](src/routes/_authenticated/my-trip.$tripId.tsx:220), [dashboard.tsx:144](src/routes/_authenticated/dashboard.tsx:144)…). Ni trigger en BD, ni código: `grep` de todo el repo confirma que **nada escribía `profiles.plan` jamás**. Un cliente que pagaba seguía siendo `free` a todos los efectos (y con SEC-01, uno que no pagaba podía ser `explorador`).
**Fix aplicado:** mapa `PLAN_BY_PRICE_ID` + sync de `profiles.plan` en `upsertSubscriptionRow` (activo/trialing/past_due → plan del precio; cancelado vencido → `free`).
⚠️ Nota pendiente: el sync también aplica a eventos `sandbox`; conviene decidir si sandbox debe tocar el plan real en producción.

**SEC-03 — Webhook de emails de auth sin autenticación** ✅ (requiere configurar secreto)
[email/auth/webhook.ts:47-64](src/routes/email/email/auth/webhook.ts:47) aceptaba cualquier POST. Payload `{data:{action_type:"recovery", email:"victima@x.com", url:"https://evil.com/phish"}}` → Itineraya renderiza la plantilla oficial de "Restablece tu contraseña" con el enlace del atacante y la envía por Resend desde `noreply@itineraya.com`. Es un relay de phishing perfecto + gasto ilimitado de cuota Resend.
**Fix aplicado:** verificación `Authorization: Bearer ${SEND_EMAIL_HOOK_SECRET}` si la variable existe; warning en logs si no. **Hay que definir la variable** en Vercel y en el hook de Supabase.

**SEC-04 — Auto-membresía en cualquier viaje (RLS trip_members)** ✅
[20260628222827…sql:19-21](supabase/migrations/20260628222827_bd36c56f-0510-4d81-b9e8-1b8f21ca9a41.sql) — la policy de INSERT permitía `user_id = auth.uid()` **para cualquier `trip_id`**. Cualquier usuario podía insertarse como "collaborator" de cualquier viaje ajeno y leerlo entero (incl. hotel, fechas, notas) gracias a la policy `members can view trip`.
**Fix aplicado:** INSERT restringido al dueño del viaje; `acceptInvite` no se ve afectado porque usa `service_role`.

### 🟠 Altos

**SEC-05 — Fuga de columnas privadas en viajes públicos** ✅
[20260618194129…sql:11-15](supabase/migrations/20260618194129_9876965a-6a51-42d4-9ccd-af3b33f0c97a.sql) — `Public can view published trips` (anon + authenticated) daba SELECT de **todas** las columnas: `user_id`, `hotel_name`, `hotel_address`, `hotel_lat/lng`, `arrival_time`, `departure_time`, `avoid`, `companion`, `budget`. Con la publishable key (pública por diseño, [client.ts:8-9](src/integrations/supabase/client.ts:8)) cualquiera podía obtener **dónde se aloja una persona y en qué fechas exactas** de cualquier viaje compartido. Riesgo físico real (robos en domicilio/hotel).
**Fix aplicado:** policy solo `anon` + `GRANT SELECT` por columnas (solo las que usan `/trip/$slug` y `/explore`). Los lectores públicos van todos por server functions con anon key ([share.functions.ts:104](src/lib/share.functions.ts:104), [explore.functions.ts:29-36](src/lib/explore.functions.ts:29)), verificado.

**SEC-06 — Token de invitación multiuso** ✅
[tripmates.functions.ts:100-104](src/lib/tripmates.functions.ts:100) — un invite `accepted` seguía dando membresía a cualquier cuenta nueva que presentase el token (el propio comentario lo admitía). Un token filtrado en un chat grupal = N desconocidos dentro del viaje.
**Fix aplicado:** el token queda ligado a `accepted_user_id`; reutilización desde otra cuenta → error. ⚠️ Pendiente: expiración temporal (p. ej. 14 días) y no coincidencia de email sigue permitida (decisión de producto documentada).

### 🟡 Medios

**SEC-07 — Sin rate limiting en `inviteTripmate`** ⚠️
[tripmates.functions.ts:10-63](src/lib/tripmates.functions.ts:10) — cualquier usuario autenticado puede disparar emails ilimitados vía Resend a cualquier dirección (spam con marca Itineraya, quema de cuota, daño de reputación del dominio). Recomendado: máx. 10 invitaciones/viaje y 20/día/usuario (contar en `trip_invites` antes de insertar).

**SEC-08 — `/api/chat` cobraba cuota antes de validar y sin tope** ✅ parcial
[chat.ts:58-78](src/routes/api/chat.ts:58) incrementaba `chat_usage` antes de parsear el body (peticiones malformadas quemaban mensajes del plan free) y aceptaba arrays de mensajes ilimitados (coste Anthropic arbitrario por request en planes de pago).
**Fix aplicado:** validación del body antes de tocar cuota + tope de 60 mensajes. ⚠️ Pendiente: el read-then-upsert de `chat_usage` sigue teniendo race condition (dos requests paralelos cuentan 1) — ideal un RPC `increment_chat_usage` atómico. Tampoco hay tope de longitud por mensaje.

**SEC-09 — Ratings y view counts inflables** ⚠️
`increment_trip_view_count` es invocable por `anon` sin límite ([20260702060000…sql:16](supabase/migrations/20260702060000_add_trip_view_count.sql:16)) y `rateTrip` no registra quién votó ([explore.functions.ts:210-228](src/lib/explore.functions.ts:210)): un usuario puede votar 5⭐ infinitas veces a su propio viaje. Recomendado: tabla `trip_ratings (trip_id, user_id UNIQUE)` y upsert.

**SEC-10 — `environment` de Stripe elegido por el cliente** ⚠️
[payments.functions.ts:51-58](src/lib/payments.functions.ts:51) acepta `sandbox|live` del navegador y [webhook.ts:5-8](src/routes/api/public/payments/webhook.ts:5) elige el secreto por query param. Las firmas se verifican correctamente, pero un usuario podría abrir un checkout sandbox en producción. Recomendado: derivar el env de una variable de servidor, no del input.

**SEC-11 — Prompt injection vía campos de usuario** ⚠️
`tripContext` ([chat.ts:88-95](src/routes/api/chat.ts:88)), `instruction` ([itinerary-edit.functions.ts:95](src/lib/itinerary-edit.functions.ts:95)), `trip_style`/`avoid` van al prompt sin delimitar. Riesgo bajo (el output solo vuelve al mismo usuario), pero las `url` generadas por el modelo se renderizan como `<a href>` en [my-trip.$tripId.tsx:829-837](src/routes/_authenticated/my-trip.$tripId.tsx:829) — conviene validar `https?://` antes de renderizar.

### 🔵 Bajos

- **SEC-12** — Comparación no constant-time del service role key en [process.ts:87](src/routes/email/email/queue/process.ts:87). Usar `crypto.timingSafeEqual`.
- **SEC-13** — [checkout.return.tsx](src/routes/checkout.return.tsx) muestra "pago completado" sin verificar `session_id` con Stripe.
- **SEC-14** — La Google Maps key va al bundle por diseño ([google-maps-loader.ts:94](src/lib/google-maps-loader.ts:94)); imprescindible restricción por referrer + cuota en Google Cloud (el propio código lo advierte). La clave se loguea parcialmente en consola (línea 81) — quitar en prod.

---

## 2. BUGS

### 🔴 Críticos

**BUG-01 — Código que usa columnas que no existían en ninguna migración** ✅ (migración creada) 🔍
- `profiles.trial_ends_at`: leída en [dashboard.tsx:144](src/routes/_authenticated/dashboard.tsx:144), escrita en [welcome.tsx:51](src/routes/_authenticated/welcome.tsx:51).
- `trips.geo_lat/geo_lng`: [dashboard.tsx:164](src/routes/_authenticated/dashboard.tsx:164) y [dashboard.tsx:106](src/routes/_authenticated/dashboard.tsx:106).
- `trips.rating_sum/rating_count` + RPC `increment_trip_rating`: documentadas como "ejecutar a mano en el SQL editor" en [explore.functions.ts:187-209](src/lib/explore.functions.ts:187).

Si la BD de producción no las tiene (no hay migración), PostgREST devuelve error en **toda** la query: el dashboard no carga viajes ("loadFail" para todos), la redirección a `/welcome` nunca ocurre (`prof` es null) y `welcome.finish()` lanza error → **el onboarding entero queda bloqueado**. La migración nueva las crea idempotentemente (`IF NOT EXISTS`). Verificar en prod si ya existían.

**BUG-02 — Límites de plan incoherentes cliente/servidor/pricing** ✅
Servidor: free=1, viajero=10, contando **todos** los status ([itinerary.functions.ts:175-183](src/lib/itinerary.functions.ts:175)). Cliente: free=2, viajero=15, contando solo `ready` ([new-trip.tsx:40,31](src/routes/_authenticated/new-trip.tsx:40)). Pricing público: "2 / 15 / Ilimitados" ([pricing.tsx:238](src/routes/pricing.tsx:238)). Resultado: el usuario free pasaba el gate del cliente con 1 viaje y reventaba con `LIMIT_REACHED` en plena pantalla de generación — y el mensaje contradecía lo que compró.
**Fix aplicado:** servidor unificado a 2/15/∞ contando `status='ready'`, igual que el cliente.

### 🟠 Altos

**BUG-03 — El campo "qué evitar" se ignoraba** ✅
El paso 7 del onboarding recoge `avoid` ([onboarding.tsx:439-456](src/routes/_authenticated/onboarding.tsx:439)), se guarda en BD… y el prompt de generación no lo incluía (el bloque `tripData` de [itinerary.functions.ts:419-430](src/lib/itinerary.functions.ts:419) no lo mencionaba). Preguntar y desobedecer es peor que no preguntar. **Fix aplicado:** línea AVOID en el prompt (truncada a 500 chars).

**BUG-04 — Itinerarios solo en es/en; usuarios FR/PT recibían español** ✅
La app tiene 4 idiomas ([i18n/index.ts:8](src/i18n/index.ts:8)) pero [itinerary.functions.ts:208-216] forzaba `es|en`. **Fix aplicado:** soporte fr/pt en `languageBlock` y ejemplos de transporte.

**BUG-05 — Off-by-one en fechas del viaje** ✅
[onboarding.tsx:143-146] usaba `toISOString().slice(0,10)`: un usuario en España (UTC+1/+2) que elige "15 de julio" (medianoche local) guardaba "14 de julio". Afectaba a duración, día de la semana del prompt (regla de museos cerrados en lunes) y countdown. **Fix aplicado:** formateo en hora local.

**BUG-06 — Página pública compartida degradada** ⚠️ (parcial)
[trip.$slug.tsx:191-210](src/routes/trip.$slug.tsx:191) descarta emoji, `place`, categoría e imágenes de cada día al transformar para `ItineraryView`; etiqueta hardcodeada `"Day N:"` en inglés (línea 199) y fecha inventada `2024-01-XX` si no hay start_date (línea 196). Además había restos de refactor (atributos vacíos, código comentado, líneas 236-257, 352-362). El artefacto que ve un invitado es mucho peor que el producto real — crítico para el loop viral (ver GROWTH_REPORT §1). ✅ Corregidos el typo `sm:grid-grid-cols-3` (línea 303) y el `placeholder-hero.jpg` inexistente (línea 240 → `/images/hero-bg.jpg`). ⚠️ Pendiente el rediseño del render.

### 🟡 Medios

**BUG-07** ✅ — `listPublicTrips` leía `rating_sum/rating_count` sin incluirlos en el `select` → ratings siempre vacíos en el feed ([explore.functions.ts:119 vs 152-153](src/lib/explore.functions.ts:119)).
**BUG-08** ✅ — El prefill de "remix" enviaba `tripTypes`/`nDays` ([trip.$slug.tsx:144-148](src/routes/trip.$slug.tsx:144), [explore.index.tsx:143-153](src/routes/explore.index.tsx:143), [dashboard.tsx:182-186](src/routes/_authenticated/dashboard.tsx:182)) pero `PrefillData` solo leía `destination` — los intereses se perdían. Corregido para `tripTypes`; `nDays` sigue sin uso (no hay fechas que precargar).
**BUG-09** ✅ — `updateActivity` guardaba fire-and-forget ([my-trip.$tripId.tsx:209]): para un tripmate invitado, RLS rechaza el UPDATE en silencio y sus checks/notas "guardados" desaparecen al recargar. Ahora muestra error.
**BUG-10** ✅ parcial — La edición con asistente no comprobaba truncación (`stop_reason`) ni validaba `days` antes de sobrescribir el itinerario ([itinerary-edit.functions.ts:167-177]). Corregido. ⚠️ Sigue sin structured outputs (inconsistente con la generación principal — migrarlo a `output_config.format`).
**BUG-11** ⚠️ — **Dos sistemas de compartir divergentes**: `ShareDialog` → `enableTripShare` → URL `/trip/$slug` ([share.functions.ts:28](src/lib/share.functions.ts:28)); `PublishToggle` → `setTripPublic` → URL `/explore/$slug` ([PublishToggle.tsx:56](src/components/trip/PublishToggle.tsx:56)). Abrir el ShareDialog **publica el viaje sin acción explícita** ([ShareDialog.tsx:23-30](src/components/trip/ShareDialog.tsx:23)) y el toggle puede mostrar "privado" mientras el diálogo ya lo publicó. Unificar en una sola ruta y hacer la publicación explícita.
**BUG-12** ⚠️ — Tras registrarse desde pricing con `returnTo=/pricing?plan=X` ([pricing.tsx:71]) nadie lee `?plan` → el checkout no se reanuda; el usuario tiene que volver a pulsar. Fuga directa de conversión.
**BUG-13** ⚠️ — Copilot sin gate de plan ([copilot.tsx](src/routes/_authenticated/copilot.tsx)) aunque pricing lo vende como exclusivo de Explorador ([pricing.tsx:242]). Decisión de producto: o se gatea, o se corrige la tabla.
**BUG-14** ⚠️ — `enableTripShare`/`setTripPublic` reintentan ante **cualquier** error de UPDATE asumiendo colisión de slug ([share.functions.ts:61-69]); un error de permisos produce 5 reintentos y un mensaje confuso. Comprobar código de error `23505`.

### 🔵 Bajos

- **BUG-15** — Generación concurrente: `status` no pasa a "generating", dos pestañas = dos llamadas a Anthropic pagadas ([itinerary.functions.ts:194]).
- **BUG-16** — Comparaciones de fecha parseando `YYYY-MM-DD` como UTC en dashboard ([dashboard.tsx:218,619-620]) — badges Próximo/Pasado pueden fallar según timezone.
- **BUG-17** — `invite.$token`: `doAccept` puede dispararse dos veces (deps incompletas del `useEffect`, [invite.$token.tsx:43-46]); inocuo por idempotencia, pero frágil.
- **BUG-18** — `bookingForCategory` etiqueta el enlace de la IA como "Booking/TheFork" aunque sea un enlace de Google Maps ([my-trip.$tripId.tsx:119-134]) — botón engañoso.
- **BUG-19** — Ficheros muertos/rotos en el repo: [index.js](index.js) (React suelto), [onboarding.tsx](onboarding.tsx) vacío en la raíz, [Button.js](src/components/Button.js) (sintaxis inválida: `default export {}`, variable `user` inexistente). Borrarlos.
- **BUG-20** — CLAUDE.md dice "Deploy: Vercel, configurado en `vercel.json`" pero no existe `vercel.json`; hay [netlify.toml](netlify.toml) y `public/_redirects`. Alinear documentación y config real.

---

## 3. UI/UX

### 🟠 Altos

**UX-01 — i18n roto en superficies clave** ✅ parcial
Con el idioma en en/fr/pt el usuario veía español hardcodeado en: tab "Calendario" ([dashboard.tsx:363]), banner de trial completo ([dashboard.tsx:337-350]), "X días" en guardados ([dashboard.tsx:484]), "día/días" del hero ([my-trip:424]), tooltips y notas de actividad ([my-trip:779,807,845]), botón "Invite" en inglés para hispanohablantes ([my-trip:366]). ✅ Todo lo anterior corregido con claves en los 4 locales. ⚠️ Pendiente (mucho volumen): **pricing.tsx entero** (tabla comparativa 233-245, testimonios 286-315, garantía 201-204, FAQ 354-371), páginas 404/error ([__root.tsx:22-77] mezcla español/inglés), pantallas de fallback de [trip.$slug.tsx:53-99], `<html lang="es">` fijo ([__root.tsx:130]), títulos `head` mezclados ("My trips" [dashboard.tsx:46], "Crear viaje" [new-trip.tsx:10], "Cuéntanos sobre tu viaje" [onboarding.tsx:19]), email de invitación solo en inglés ([tripmates.functions.ts:49-55]), `reason` de inspire siempre en español ([inspire.functions.ts:99]).

**UX-02 — Testimonios inventados en pricing** ⚠️
[pricing.tsx:286-315] — 4 testimonios con nombres y ciudades ficticios y "Miles de aventuras planificadas". Riesgo legal (publicidad engañosa, Ley 3/1991 de competencia desleal) y de confianza si se descubre. Sustituir por testimonios reales o eliminar la sección.

**UX-03 — La página compartida no vende** ⚠️
Ver BUG-06: sin fotos por día, sin emojis, sin lugares, "Day N" en inglés. Es la primera impresión del 100 % de los invitados. Prioridad máxima (detalle y propuesta en GROWTH_REPORT §1).

**UX-04 — Targets táctiles < 44 px** ⚠️
Botones de acción de TripCard de 28 px (`h-7 w-7`, [dashboard.tsx:706-737]), toolbar de itinerario 32 px (`h-8`, [my-trip:317-393]), botones de vista 28 px ([my-trip:335-347]). En móvil (el grueso del tráfico de viajes) provocan errores de pulsación. Mínimo Apple/Android: 44/48 px — ampliar el área táctil con padding aunque el icono siga pequeño.

### 🟡 Medios

- **UX-05** — Onboarding de 7 pasos para llegar al "wow": pasos 3 (compañía), 4 (presupuesto) y 6 (alojamiento) podrían colapsarse u ofrecer "Saltar" visible; no hay indicación de que los pasos ≥3 son opcionales (todos tienen `canContinue=true` pero el usuario no lo sabe) — [onboarding.tsx:171-177].
- **UX-06** — Pantalla de generación: progreso simulado que se congela en 91 % ([my-trip:857-871]); sin timeout visible ni botón cancelar. Si la generación tarda >30 s el usuario está ante una barra parada.
- **UX-07** — El error `LIMIT_REACHED: …` se muestra en crudo, prefijo incluido, en la pantalla de error genérica ([my-trip:283-309]); merece una pantalla propia con CTA a /pricing.
- **UX-08** — Selector de viaje del asistente truncado a 120 px ([assistant.tsx:235]) — "Ciudad de Méx…". El chat no persiste historial entre sesiones (cada visita empieza de cero) y no se indica.
- **UX-09** — ShareDialog: el botón "Instagram" solo copia el enlace y muestra un toast ([ShareDialog.tsx:105-114]) — expectativa rota; y publicar el viaje al abrir el diálogo sin confirmación es sorpresa de privacidad (BUG-11).
- **UX-10** — Explore: filtros de duración se aplican **después** del `limit(60)` ([explore.functions.ts:169-176]) → "Largos" puede mostrar 3 resultados aunque haya 40 en BD; sin paginación ni orden "mejor valorados" servidor.
- **UX-11** — Estados vacíos buenos en dashboard, pero `/saved` y `/explore` sin resultados de búsqueda no explican cómo llenarlos (revisar `saved.tsx:174`, explore feed).
- **UX-12** — Focus management: los modales custom (mapa fullscreen [my-trip:506-534], checkout [pricing.tsx:212-226]) no atrapan el foco ni cierran con Escape (los de Radix/vaul sí). Accesibilidad teclado incompleta.

### 🔵 Bajos

- Emojis como iconos estructurales en ShareDialog (💬📸) y OptionGrid — inconsistente con Lucide en el resto.
- `aria-label` faltante en botones de rating con estrellas del feed.
- El toggle de PublishToggle usa spinner superpuesto al thumb — estado confuso durante loading.
- `og:image` del landing apunta al logo cuadrado declarando 1200×630 ([__root.tsx:103-105]) — se verá recortado en shares; existe `og-image.jpg` correcto que solo usa Twitter ([index.tsx:41]).
- Título de rating/reviews de pricing sin datos reales tras el fix de ratings — coordinar.

---

## 4. PERFORMANCE

### 🟠 Altos

**PERF-01 — Geocoding Nominatim desde el navegador, por viaje** ⚠️
[dashboard.tsx:88-115] llama a `nominatim.openstreetmap.org` una vez por viaje sin coordenadas, desde el cliente, sin User-Agent identificado (viola la usage policy de Nominatim; pueden banear por IP/dominio). Con la migración aplicada, `geo_lat/lng` se persisten y esto se amortiza, pero lo correcto es geocodificar **una vez en el servidor** al crear el viaje (o durante la generación, que ya conoce el destino).

**PERF-02 — Escritura del JSONB completo por interacción** ⚠️
Cada checkbox o nota reescribe el itinerario entero (decenas de KB) ([my-trip:198-212]) — sin debounce, un usuario marcando 10 actividades = 10 UPDATEs de fila completa. Debounce de 1-2 s o guardar por actividad.

### 🟡 Medios

- **PERF-03** — `fetchWeather` hace 2 fetch en cascada por render del hero sin caché ([dashboard-helpers.ts:48-64]); cachear por destino en sessionStorage.
- **PERF-04** — Sin índices para el feed público: `ORDER BY published_at` + `ilike '%…%'` sobre `destination` ([explore.functions.ts:116-127]). Añadir `CREATE INDEX trips_public_feed_idx ON trips (published_at DESC) WHERE is_public = true;` y pg_trgm para búsqueda.
- **PERF-05** — Imágenes: las day-images de Unsplash usan `urls.regular` (~1080 px) sin `srcset` ni `width/height` (CLS); el hero de my-trip carga sin `fetchpriority="high"`. El postcard fuerza `crossOrigin="anonymous"` en todas las imágenes de día ([my-trip:642]) — rompe caché de imagen normal.
- **PERF-06** — `queries` del dashboard sin `limit` ([dashboard.tsx:161-171]); trivial hoy, problema con usuarios de 100+ viajes (globo geocodifica todos).
- **PERF-07** — Retry con `setTimeout` de 5-10 s dentro de la server function ante 429 ([itinerary.functions.ts:459-483]) — mantiene la lambda viva pagando; mejor devolver retry al cliente.

### 🔵 Bajos

- Canal Realtime de suscripciones siempre abierto aunque no haya pagos en curso ([useSubscription.ts:73-80]).
- `motion.div` por tarjeta con delay escalonado — bien, pero `initial={{opacity:0}}` en listas largas retrasa LCP del dashboard.
- Fuentes Google sin `font-display: swap` explícito en el enlace CSS2 (lo incluye por defecto `display=swap` — verificar; [__root.tsx:118]).

---

## 5. Calidad / deuda técnica

- **Lint roto en todo el repo**: 1288 errores prettier `Delete ␍` (CRLF) — preexistente, afecta también a ficheros no tocados. Normalizar con `.gitattributes` (`* text=auto eol=lf`) + `npm run format` en un commit aparte.
- `es.json/en.json/fr.json/pt.json` divergen ~2 claves entre sí (685-687 líneas); falta un check de paridad de claves en CI.
- Duplicación: `slugify/randomSuffix/daysBetween` copiados en [share.functions.ts](src/lib/share.functions.ts:6) y [explore.functions.ts](src/lib/explore.functions.ts:7); `unsplashImage/fallbackImage` duplicados en [itinerary.functions.ts:10-30] e [inspire.functions.ts:22-42]; lista `inlandSet` duplicada en [itinerary.functions.ts:319-392] e [itinerary-edit.functions.ts:60-74] (y con semántica invertida). Extraer a `src/lib/shared/`.
- **Cero tests** en el repo (ni unit ni e2e). Mínimo viable: tests de `extractJson`, `daysBetween`, gates de plan, y un e2e de humo del funnel crear→generar→compartir.
- Restos de Lovable: `.lovable/`, `lovable-error-reporting`, comentarios "Connect Supabase in Lovable Cloud" — inofensivos pero ruido.
- `graphify-out/`, `NIGHT_REPORT*.md`, `TODO_NIGHT_2.md` committeados — mover a artefactos o ignorar.

---

## 6. Cambios aplicados en esta sesión (sin commit)

| Fichero | Cambio |
|---|---|
| `supabase/migrations/20260704090000_security_hardening_and_missing_columns.sql` | **NUEVO** — columnas faltantes, RPC de rating, bloqueo de escalada de plan, fix policy trip_members, restricción de columnas para anon en trips |
| [webhook.ts](src/routes/api/public/payments/webhook.ts) | Sync de `profiles.plan` desde eventos de Stripe (`PLAN_BY_PRICE_ID`) |
| [email/auth/webhook.ts](src/routes/email/email/auth/webhook.ts) | Autenticación por `SEND_EMAIL_HOOK_SECRET` |
| [tripmates.functions.ts](src/lib/tripmates.functions.ts) | Tokens de invitación single-use |
| [chat.ts](src/routes/api/chat.ts) | Validación de body antes de cuota + tope 60 mensajes |
| [itinerary.functions.ts](src/lib/itinerary.functions.ts) | Límites 2/15/∞ unificados; campo `avoid` en el prompt; itinerarios en fr/pt |
| [itinerary-edit.functions.ts](src/lib/itinerary-edit.functions.ts) | Check de truncación + validación de `days` |
| [explore.functions.ts](src/lib/explore.functions.ts) | `rating_sum/rating_count` en el select del feed |
| [trip.$slug.tsx](src/routes/trip.$slug.tsx) | Typo `sm:grid-cols-3`; imagen placeholder existente |
| [onboarding.tsx](src/routes/_authenticated/onboarding.tsx) | Fechas en hora local; prefill de `tripTypes` |
| [my-trip.$tripId.tsx](src/routes/_authenticated/my-trip.$tripId.tsx) | Error visible si falla el guardado; i18n de strings hardcodeadas |
| [dashboard.tsx](src/routes/_authenticated/dashboard.tsx) | i18n del banner de trial, tab calendario y "X días" |
| `src/i18n/locales/{es,en,fr,pt}.json` | 16 claves nuevas por idioma |
| [types.ts](src/integrations/supabase/types.ts) | Tipos de las columnas nuevas |
| [robots.txt](public/robots.txt) | `/checkout/return` (ruta real), `/saved`, `/my-trip/` |

**Verificación:** `npx tsc --noEmit` limpio. ESLint falla por CRLF preexistente en todo el repo (también en ficheros no tocados).

## 7. Plan de acción priorizado (pendientes)

**Esta semana**
1. Aplicar la migración en producción + configurar `SEND_EMAIL_HOOK_SECRET` (SEC-03).
2. Rate limit de invitaciones (SEC-07) y RPC atómico de chat_usage (SEC-08).
3. Reanudar checkout tras signup (`?plan=`) (BUG-12).
4. Unificar los dos sistemas de compartir (BUG-11).

**Próximas 2 semanas**
5. Rediseñar `/trip/$slug` con el itinerario completo (BUG-06/UX-03 — ver GROWTH_REPORT).
6. i18n de pricing + 404/error + email de invitación (UX-01), testimonios reales (UX-02).
7. Tabla `trip_ratings` con unicidad (SEC-09); índices del feed (PERF-04).
8. Targets táctiles ≥44 px (UX-04); geocoding server-side (PERF-01).

**Mes**
9. Structured outputs en edición e inspire; extraer helpers duplicados; suite mínima de tests; normalizar EOL y arreglar lint; borrar ficheros muertos.
