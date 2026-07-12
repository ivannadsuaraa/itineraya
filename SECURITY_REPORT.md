# Itineraya — Auditoría de seguridad (2026-07-12)

> Auditoría exhaustiva del código real (no solo de la documentación). Cero commits, cero
> push — todo vive en el working tree. Resumen ejecutivo al final. Los hallazgos están
> ordenados por severidad dentro de cada categoría, con evidencia de verificación, no solo
> afirmaciones.

---

## 0. Cómo se verificó (para que esto no sea "confía en mí")

- **RLS y estado real de la base de datos**: no me limité a leer las migraciones — verifiqué
  el **esquema vivo de producción** contra ellas, en modo solo-lectura, vía introspección
  OpenAPI de PostgREST con la `service_role` key (único endpoint que la requiere) y pruebas
  de acceso con la `anon` key. Esto reveló una tabla huérfana (`trip_invitations`) que no
  aparece en ningún archivo del repo.
- **Código**: lectura completa de las 32 migraciones SQL, los 11 archivos `*.functions.ts`,
  todas las rutas bajo `src/routes/api/` y `src/routes/email/`, el middleware de auth, y grep
  sistemático de patrones de riesgo (SQL crudo, `dangerouslySetInnerHTML`, `.innerHTML =`,
  secretos en `import.meta.env`, escritura de `profiles.plan`).
- **Calidad del fix**: `tsc --noEmit` (0 errores), `eslint` (limpio salvo 4 `any`
  pre-existentes sin relación con seguridad), `prettier`, `npm audit` (0 vulnerabilidades),
  y un build de producción (`vite build`) completo dos veces seguidas: **el bundle de
  cliente y el de SSR compilaron ambos al 100% sin ningún error** (`Generated public
  .output/public`) en las dos ejecuciones; solo el empaquetado final de Nitro (que solo
  recorre warnings inofensivos y preexistentes de `node_modules`, sin relación con el código
  tocado en esta auditoría) se cortó por un timeout local del entorno de esta sesión, no por
  un fallo de compilación.
- **Sin acceso directo a Postgres**: no tengo contraseña de base de datos ni token de login
  del CLI de Supabase en este entorno, así que **no pude aplicar la migración nueva ni
  confirmar al 100% el estado de algunos grants a nivel de columna**. Esto se documenta
  explícitamente en cada hallazgo donde aplica, en vez de darlo por hecho.

---

## 1. Autenticación y autorización

### 1.1 🔴 CRÍTICO (arreglado) — Un usuario podía unirse a viajes ajenos vía invitación

**`src/lib/tripmates.functions.ts` → `acceptInvite`**

El código tenía una comprobación de email **muerta**:
```ts
if (email && invite.email.toLowerCase() !== email) {
  // Allow accepting from any signed-in account but keep email record
}
```
No hacía nada. Combinado con que `/invite/$token` (`src/routes/invite.$token.tsx`) **auto-acepta
la invitación en cuanto detecta sesión activa, sin confirmación ni mostrar a qué viaje se
une**, cualquier usuario ya logueado que abriera un enlace de invitación (reenviado, en el
historial del navegador, cacheado por un escáner de enlaces corporativo) quedaba añadido como
colaborador del viaje de otra persona, ganando acceso de lectura a su itinerario completo.

El token en sí **no era falsificable** (`crypto.randomUUID()` × 2 = 256 bits) — el problema
era de autorización del destinatario, no de fuerza bruta.

**Arreglado**: la comprobación ahora rechaza con un error claro si el email de la cuenta
logueada no coincide con el de la invitación.

**Verificado**: `tsc`/`eslint` limpios; lógica revisada línea a línea contra el resto del
flujo (reutilización de token e idempotencia de re-aceptación por el mismo usuario ya estaban
bien implementadas y no se tocaron).

### 1.2 🔴 CRÍTICO (arreglado) — Webhook de email de auth: relé de phishing abierto si falta el secreto

**`src/routes/email/email/auth/webhook.ts`**

El propio comentario del código ya lo advertía: *"Without verification this endpoint is an
open phishing relay: anyone could make Itineraya send an official-looking email with an
attacker-controlled URL to any address."* Pero el código **fallaba abierto**: si
`SEND_EMAIL_HOOK_SECRET` no estaba configurado, solo logueaba un warning y dejaba pasar la
petición sin autenticar.

**Confirmado que la variable NO está configurada** en este entorno (`.env` local no la
tiene, y la auditoría previa del 2026-07-04 ya lo había señalado como pendiente).

**Arreglado**: ahora falla **cerrado** — si el secreto no está configurado, devuelve 500 y
rechaza toda petición, en vez de operar sin autenticación. Esto rompe el envío de emails de
auth (confirmación, recuperación de contraseña, magic link) **hasta que configures el
secreto** — es la contrapartida correcta: mejor que el flujo se rompa de forma ruidosa a que
siga siendo un relé de phishing silencioso.

**⚠️ Acción tuya obligatoria**: genera un secreto fuerte (`openssl rand -hex 32`), configúralo
como `SEND_EMAIL_HOOK_SECRET` en Vercel, y como el mismo valor en el "Send Email Hook" de
Supabase Auth (Authentication → Hooks). Confirmé por comparación de código que
`/email/email/lifecycle/run` y `/email/email/queue/process` **ya exigían correctamente** la
`SUPABASE_SERVICE_ROLE_KEY` exacta sin excepción — este era el único endpoint con el patrón
fallar-abierto.

### 1.3 🟠 ALTO (arreglado) — Cualquier usuario podía manipular la puntuación de cualquier viaje público

**Migración nueva, tabla `trip_ratings` + reescritura de `increment_trip_rating`**

`rateTrip` (auth requerida) llamaba a una RPC que solo hacía
`rating_sum += p_rating; rating_count += 1`, sin registrar quién había votado. Un usuario
autenticado podía llamarla en bucle para inflar o hundir arbitrariamente la puntuación de
**cualquier** viaje público (el suyo o el de otro), sin límite.

**Arreglado**: nueva tabla `trip_ratings (trip_id, user_id)` con clave primaria compuesta —
un voto por usuario y viaje, gestionado dentro de la misma RPC (`increment_trip_rating`,
misma firma que antes, así que no hubo que tocar el código TypeScript que la llama). Cambiar
de opinión actualiza el voto existente en vez de sumar uno nuevo.

### 1.4 🟡 MEDIO (documentado, blindado defensivamente) — Tabla huérfana `trip_invitations`

Descubierta por introspección directa del esquema vivo — **no aparece en ninguna migración
del repo ni en el código de la app**. Mismo shape que `trip_invites` (trip_id, email, token,
invited_by, status): casi con certeza un resto de antes de que el proyecto migrara a un
sistema de migraciones versionado.

- El acceso anónimo ya devolvía 401 (sin GRANT a `anon`).
- No pude confirmar con certeza absoluta la postura de `authenticated` sin acceso directo a
  `information_schema` (no expuesto vía PostgREST).

**Arreglado defensivamente**: la migración nueva habilita RLS con una política deny-all
explícita (`USING (false)`), sin borrar la tabla ni sus datos — no me correspondía decidir
eliminarlos sin que tú lo confirmes.

### 1.5 ✅ Verificado seguro — Escalada de plan sin pagar

Grep exhaustivo de **todo** el código: `.update({ plan: ... })` sobre `profiles` aparece en
**un único sitio de todo el repo** — el webhook de Stripe (§5), con firma verificada
criptográficamente. Todo lo demás solo *lee* `plan`. Además, la migración
`20260704090000_security_hardening_and_missing_columns.sql` ya revoca el `GRANT UPDATE`
column-level de `authenticated` sobre `plan` a nivel de base de datos — **confirmé que esta
migración SÍ está aplicada en producción** (verifiqué que las columnas y la función RPC que
crea, al final del mismo archivo/transacción, existen en el esquema vivo). Doble capa de
protección: código + base de datos.

### 1.6 ✅ Verificado seguro — RLS del resto de tablas

Las 14 tablas de la base de datos tienen RLS habilitado. Revisé política por política:
`profiles`/`trips`/`trip_members`/`subscriptions`/`saved_inspirations`/`chat_usage`/
`trip_pass_purchases` están correctamente acotadas por `auth.uid()`; las tablas de
infraestructura de email (`email_send_log`, `suppressed_emails`, etc.) y `destination_news_cache`
son `service_role`-only; el histórico de migraciones muestra que una fuga de privacidad
anterior ("cualquiera podía leer cualquier viaje con `share_slug`") ya fue detectada y
corregida por el equipo en `20260620090729`, y la política actual (`is_public = true AND
share_slug IS NOT NULL`) es correcta.

### 1.7 ✅ Verificado seguro — Intentos de login fallidos

El login pasa **enteramente** por el SDK de Supabase Auth (`signInWithPassword`/
`signInWithOAuth` en `AuthModal.tsx`) — no existe ningún endpoint propio que reimplemente la
comprobación de contraseña y pueda saltarse el rate limiting nativo de la plataforma de
Supabase Auth.

---

## 2. Variables de entorno y secrets

### 2.1 ✅ Ninguna key de servidor llega al bundle del cliente

Grep exhaustivo de `import.meta.env`/`VITE_*` en todo `src/`: los únicos valores expuestos al
cliente son la Supabase **anon key** (confirmé decodificando el JWT que su claim `role` es
literalmente `anon`, no `service_role`), la Stripe **publishable key** (`pk_live_`/`pk_test_`,
diseñada para ser pública), y las keys de Google Maps/OpenWeather/RestCountries (ya auditadas
en sesiones previas, pensadas para uso desde el navegador). `ANTHROPIC_API_KEY`,
`RESEND_API_KEY`, `NEWSAPI_KEY`, `UNSPLASH_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y los secretos de
Stripe **solo** se referencian vía `process.env` dentro de server functions/rutas API — cero
apariciones en componentes cliente.

### 2.2 🟡 `.env` estuvo commiteado en el pasado — alcance real verificado

`.env` **no está trackeado ahora** (correctamente en `.gitignore`), pero **sí estuvo en el
historial de git**, y ese historial **está pusheado a GitHub**
(`github.com/ivannadsuaraa/itineraya`, rama `main`). Antes de asumir lo peor, verifiqué el
contenido exacto de **cada** commit que alguna vez incluyó `.env`: las únicas claves que
aparecieron fueron `SUPABASE_PROJECT_ID`, `SUPABASE_PUBLISHABLE_KEY`/`VITE_...` (la anon key,
pública por diseño), `SUPABASE_URL` y la Google Maps browser key. **`SUPABASE_SERVICE_ROLE_KEY`,
`ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `NEWSAPI_KEY` y `UNSPLASH_KEY` nunca aparecieron en
ningún commit alcanzable desde `origin/main`.** No hubo fuga de secretos reales — el commit
`6b9e46a` (2026-06-29) ya limpió el tracking de `.env*`. No se requiere rotar claves por este
motivo.

### 2.3 ✅ `.env` está en `.gitignore`

Confirmado: `.env` y `.env.*` (con excepción explícita de `!.env.example`, aunque ese fichero
de ejemplo no existe todavía — recomendación menor, no un riesgo).

---

## 3. Inputs, validación y XSS

### 3.1 ✅ Zod cubre las server functions que reciben input externo

Los 4 archivos sin `import { z } from "zod"` (`explore.functions.ts`, `payments.functions.ts`,
`referral.functions.ts`, `share.functions.ts`) tienen validación manual equivalente para su
superficie de input (regex sobre `priceId`/`userId`, enums de `environment`, UUIDs usados
solo como filtros parametrizados de Supabase — nunca concatenados en SQL). No existe
concatenación de SQL crudo en ningún punto del código: todo pasa por el query builder de
Supabase, que parametriza vía PostgREST.

### 3.2 🟡 BAJO (arreglado) — Un campo sin escapar en el popup del mapa

**`src/components/trip/GoogleTripMap.tsx`**

El popup de Google Maps escapaba correctamente 5 de 6 campos generados por la IA
(`escapeHtml()` en título, lugar, hora, descripción, título del día) pero **no** el emoji:
```diff
- ${p.activity.emoji ?? "📍"} ${escapeHtml(p.activity.title)}
+ ${escapeHtml(p.activity.emoji ?? "📍")} ${escapeHtml(p.activity.title)}
```
El JSON schema que restringe la salida de Claude debería impedir que `emoji` contenga HTML,
pero no hay que confiar en la adherencia al schema de un LLM como única barrera de
seguridad — es una defensa en profundidad barata y sin riesgo.

### 3.3 ✅ El resto de `dangerouslySetInnerHTML` es seguro

Los otros 3 usos en todo el repo son: JSON-LD de FAQs **hardcodeadas** en el propio archivo
(cero input dinámico), una tabla cerrada de paths SVG de iconos indexada por un enum
TypeScript (`IconId`, nunca por texto libre), y el patrón estándar de theming de
`shadcn/ui`'s `chart.tsx`. Ninguno recibe contenido generado por IA o por usuarios.

### 3.4 ✅ Contenido de la IA en React: seguro por defecto

Los itinerarios generados por Claude se renderizan en toda la app vía interpolación JSX
normal (`{activity.title}`, etc.), que React escapa automáticamente. El único punto donde el
contenido de la IA se inyectaba como string HTML crudo era el popup del mapa (§3.2, ya
arreglado) y el email de invitación (`tripmates.functions.ts`), que ya usaba `escapeHtml()`
correctamente antes de esta auditoría.

---

## 4. Rate limiting

### 4.1 🟠 ALTO (arreglado) — El límite de la demo pública era trivialmente eludible

**`src/lib/demo.functions.ts`**

El rate limit vivía en un `Map` en memoria del proceso. En Vercel, cada instancia lambda
concurrente tiene su propia memoria — bajo auto-scaling, el límite real de "6/día por IP" era
en realidad "6/día por IP **por instancia**", multiplicado por cuantas instancias paralelas
levante Vercel. Este endpoint no requiere autenticación y llama a Claude + Unsplash por
petición: coste real explotable.

**Arreglado**: nuevo rate limiter atómico y persistido en Supabase
(`check_and_increment_rate_limit`, migración nueva), que sobrevive entre instancias
serverless. Un solo `UPSERT ... count = count + 1` bajo el lock de fila de Postgres evita
además la carrera lectura-luego-escritura que tenía el límite anterior.

También arreglé la **resolución de IP**: el código usaba la primera entrada de
`X-Forwarded-For`, que un cliente puede falsificar libremente (`X-Forwarded-For: 1.2.3.4` en
cada petición = un rate limit nuevo cada vez). Ahora se prefiere `x-real-ip` (que Vercel
establece de forma fiable) y, si falta, la **última** entrada de `X-Forwarded-For` (la que
añade el propio borde de Vercel, no la que puede inyectar el cliente). Las IPs se **hashean**
(SHA-256 truncado) antes de guardarse — nunca se persiste la IP en crudo.

### 4.2 🟠 ALTO (arreglado) — `suggestDestinations` (Inspírame) no tenía ningún límite

**`src/lib/inspire.functions.ts`**

Requería autenticación pero podía llamarse sin límite alguno — cada llamada cuesta una
petición a Claude más otra a Unsplash. Añadido: 30/día por usuario, vía el mismo mecanismo
persistente.

### 4.3 🟠 ALTO (arreglado) — `editItineraryWithAssistant` (asistente IA) tampoco tenía límite

**`src/lib/itinerary-edit.functions.ts`**

El gate de plan (Viajero/Explorador únicamente) desincentiva el abuso casual pero no protege
frente a una cuenta de pago comprometida o un script automatizado. Añadido: 40/día por
usuario.

### 4.4 ✅ Ya estaban bien protegidos (verificado, sin cambios)

- **Generación de itinerarios** (`itinerary.functions.ts`): límite por plan persistido en la
  tabla `trips` (free = 2 de por vida, Viajero = 5/mes, Explorador = ilimitado + bonus_trips).
- **Chat del asistente** (`api/chat.ts`): límite diario (10 msj/día en plan free) contra la
  tabla `chat_usage`, persistido en base de datos.
- **Invitaciones** (`tripmates.functions.ts`): 20/día por usuario contra `trip_invites`,
  anti-spam de Resend.
- **Intentos de login**: gestionado por Supabase Auth (§1.7).

### 4.5 🔵 Teórico/de bajo impacto (documentado, no arreglado)

Los contadores de `chat_usage` y del límite de itinerarios por plan usan lectura-luego-escritura
(no atómico como el nuevo `check_and_increment_rate_limit`), lo que en teoría permite una
pequeña carrera bajo peticiones perfectamente simultáneas (ganancia máxima: 1-2 mensajes/
itinerarios extra, no un bypass ilimitado). No lo he tocado: son límites de negocio ya
generosos y funcionando, y el riesgo/beneficio de reescribirlos no lo justifica frente al
resto de hallazgos reales de esta auditoría.

---

## 5. Webhook de Stripe

### ✅ Verificado seguro — sin cambios necesarios

`src/routes/api/public/payments/webhook.ts`, revisado línea por línea:

- **Firma verificada** con `stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)`
  sobre el **body crudo** (no re-serializado, lo que rompería la verificación) — rechaza con
  401 si la firma no coincide. Sin el secreto real de Stripe, es criptográficamente imposible
  simular un evento válido.
- **Idempotencia real, no un parche**: `trip_pass_purchases` tiene un `UNIQUE
  (stripe_checkout_session_id, environment)` — un webhook reentregado choca con la
  constraint (código `23505`) y se ignora explícitamente antes de conceder el bonus. La
  sincronización de `profiles.plan` es un *set* determinista basado en el estado actual de la
  suscripción (no un incremento), así que reprocesar el mismo evento converge al mismo
  resultado sin duplicar nada.
- El Pase de Viaje exige `session.payment_status === "paid"`, no solo que el evento se haya
  disparado.

Hallazgo **no relacionado con seguridad** ya documentado en la memoria del proyecto (auditoría
del 2026-07-04): los price IDs de Stripe están hardcodeados en `PLAN_BY_PRICE_ID` — si cambias
los precios en el dashboard de Stripe sin actualizar el código, la sincronización de plan se
rompe (no es una vulnerabilidad, es deuda de mantenimiento).

---

## 6. Headers de seguridad

**`vercel.json`** antes solo tenía `regions`. Añadido:

- `Content-Security-Policy` — construido a partir de un inventario real de cada origen externo
  que la app usa de verdad (Stripe.js, Google Maps, Supabase, tiles de Leaflet en CartoDB,
  Unsplash/loremflickr, Open-Meteo, OpenWeatherMap, RestCountries, Nominatim, fuentes de
  Google). `script-src` **sin** `'unsafe-inline'` (defensa real contra XSS de scripts);
  `style-src` sí lo incluye porque la app usa `<style>{...}</style>` inline en varios
  componentes (globo, animaciones) y retirarlo requeriría una arquitectura de nonces que está
  fuera del alcance de "configurar headers en vercel.json".
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Strict-Transport-Security` (2 años, incluye subdominios, preload)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restrictiva (cámara/micrófono desactivados; geolocalización y pagos
  solo para el propio origen + Stripe)

**⚠️ Honestidad sobre la verificación**: `vercel.json` solo aplica en el despliegue real de
Vercel — no en `npm run dev` ni en un build local, así que **no pude probar el CSP contra el
tráfico real de la app** en este entorno (no tengo login del CLI de Vercel para `vercel dev`).
Construí el CSP con un inventario exhaustivo de cada dominio externo referenciado en el código
(verificado con grep, no de memoria), pero es el cambio con más riesgo de romper algo visible
(checkout de Stripe, mapas) si me dejé algo. **Recomendación**: despliega a un preview de
Vercel primero y revisa la consola del navegador en busca de mensajes `Refused to ...` antes
de promocionar a producción. Si algo se rompe, es un ajuste de una línea en el CSP, no un
rollback de código.

---

## 7. Dependencias

`npm audit`: **0 vulnerabilidades** (info/low/moderate/high/critical) en 641 dependencias
(419 prod + 154 dev + 96 optional). Nada que actualizar.

---

## 8. Resumen ejecutivo

| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| 1.1 | Invitaciones: comprobación de email muerta | 🔴 Crítico | **Arreglado** |
| 1.2 | Webhook de email de auth: fail-open sin secreto | 🔴 Crítico | **Arreglado** (requiere que configures `SEND_EMAIL_HOOK_SECRET`) |
| 1.3 | Manipulación ilimitada de puntuaciones de viajes | 🟠 Alto | **Arreglado** (requiere aplicar migración) |
| 1.4 | Tabla huérfana `trip_invitations` sin RLS rastreable | 🟡 Medio | **Blindada** (requiere aplicar migración) |
| 4.1 | Rate limit de demo pública eludible + IP falsificable | 🟠 Alto | **Arreglado** (requiere aplicar migración) |
| 4.2 | Sin límite en "Inspírame" | 🟠 Alto | **Arreglado** (requiere aplicar migración) |
| 4.3 | Sin límite en edición con IA | 🟠 Alto | **Arreglado** (requiere aplicar migración) |
| 3.2 | Emoji sin escapar en popup del mapa | 🟡 Bajo | **Arreglado** |
| 6 | Sin headers de seguridad | 🟡 Medio | **Arreglado** (verificar tras deploy) |
| 2.2 | `.env` en historial de git antiguo | 🔵 Informativo | Verificado sin fuga real |
| — | Escalada de plan / RLS / webhook Stripe / login / secretos en bundle | — | **Ya seguros**, verificados |

### Acciones pendientes que solo tú puedes hacer

1. **Aplicar la migración `supabase/migrations/20260712090000_security_audit_fixes.sql`** en
   la base de datos de producción — no tengo credenciales de conexión a Postgres ni login del
   CLI de Supabase en este entorno para hacerlo yo. Sin esto, los fixes de §1.3, §1.4, §4.1,
   §4.2 y §4.3 existen en el código pero **no están activos en producción**.
2. **Configurar `SEND_EMAIL_HOOK_SECRET`** en Vercel y en el Auth Hook de Supabase (§1.2) —
   mismo valor en ambos sitios, o los emails de auth dejarán de enviarse (a propósito, hasta
   que lo configures).
3. **Desplegar a un preview de Vercel y revisar la consola del navegador** antes de
   promocionar el nuevo `vercel.json` a producción (§6).
4. Opcional: revisar manualmente si `trip_invitations` tiene datos reales que quieras migrar
   o si es seguro eliminarla — no la borré por no ser una decisión mía.
