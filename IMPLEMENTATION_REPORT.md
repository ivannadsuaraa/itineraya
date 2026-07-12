# IMPLEMENTATION_REPORT.md — Growth sprint del 2026-07-12

> Qué se implementó en código, qué se verificó y cómo, y qué queda como acción manual.
> La estrategia y el contenido listo para publicar están en `GROWTH_HACK.md`.
> **Sin commits ni push**: todo está en el working tree.

---

## 1. PARTE 1 — Loop viral

### 1.1 og:image dinámico branded ✅ IMPLEMENTADO

- **Nuevo endpoint** [`src/routes/api/og/$slug.ts`](src/routes/api/og/$slug.ts):
  genera un PNG 1200×630 por cada itinerario público — foto del destino + chip "ITINERAYA"
  + nombre del destino en grande + "Itinerario de N días, hora a hora, con mapa" + CTA
  "Copia y personaliza este viaje gratis" + itineraya.com.
- **Stack:** `satori` (árbol → SVG) + `@resvg/resvg-js` (SVG → PNG), sin Chromium. Dos
  dependencias nuevas en `package.json`. La fuente (Inter 400/700) se resuelve en el
  arranque de la instancia vía Google Fonts con UA legacy (sirve WOFF, que satori acepta)
  y se cachea en memoria.
- **Nunca rompe a un scraper:** cualquier fallo (BD, fuente, imagen) degrada a un 302 a la
  foto hero del viaje o a `/og-image.jpg`. Cache CDN: `s-maxage=86400`.
- **Conectado en** [`src/routes/trip.$slug.tsx`](src/routes/trip.$slug.tsx): `og:image` y
  el nuevo `twitter:image` + `twitter:card summary_large_image` (antes faltaba) apuntan a
  `/api/og/$slug`.
- **`vite.config.ts`:** `ssr.external: ["@resvg/resvg-js"]` (módulo nativo, no debe pasar
  por Rollup).
- **Verificación:** el pipeline completo (fetch de fuentes → satori → resvg → PNG de 1MB)
  se ejecutó en local con datos reales de un viaje público (`tenerife-8-dias-x2d4m`) y la
  imagen resultante es correcta (comprobada visualmente). El endpoint en dev devuelve el
  fallback 302 porque el dev server local no carga `process.env.SUPABASE_*` (limitación
  local *preexistente* que afecta igual a `getPublicTrip` y al sitemap; en Vercel esas
  vars existen). **Acción tras deploy:** validar con opengraph.xyz (quick win #6).

### 1.2 Botón Remix imposible de ignorar ✅ IMPLEMENTADO

- [`src/routes/trip.$slug.tsx`](src/routes/trip.$slug.tsx): **barra sticky inferior** que
  aparece tras 480 px de scroll (cuando el CTA del hero ya no se ve y el lector está
  interesado): destino + "¿Te gusta este plan? Hazlo tuyo en 1 minuto" + botón Remix.
  Siempre a un pulgar de distancia en móvil. El Remix del hero se mantiene.
- i18n: nueva clave `publicTrip.stickyHint` en es/en/fr/pt.

### 1.3 Notificación al autor a 10/50/100 vistas ✅ IMPLEMENTADO

- **Migración nueva** [`supabase/migrations/20260712150000_growth_view_milestones.sql`](supabase/migrations/20260712150000_growth_view_milestones.sql):
  `increment_trip_view_count` pasa de `void` a devolver el nuevo total (DROP + CREATE,
  mismos GRANTs). ⚠️ **Hasta aplicarla en prod, el código nuevo trata el retorno como
  null y simplemente no notifica — no rompe nada.**
- [`src/lib/share.functions.ts`](src/lib/share.functions.ts): `getPublicTrip` ahora
  espera el RPC (un roundtrip, ~decenas de ms) y si el contador cruza exactamente 10, 50 o
  100 llama a `maybeNotifyViewMilestone`, que:
  - usa `lifecycle_email_log` (unique `user_id+email_key`) como candado idempotente —
    clave `viewmilestone_<tripId>_<n>`, así que ni requests concurrentes duplican el email;
  - respeta `suppressed_emails`;
  - encola por `enqueue_email` (misma cola `transactional_emails` que el resto).
- **Template nuevo** `renderViewMilestoneEmail` en
  [`src/lib/lifecycle-emails.ts`](src/lib/lifecycle-emails.ts) (es/en): "🔥 Tu itinerario
  de X ya tiene N visitas", con CTA de volver a compartir (el email con mejor open rate
  posible: le dices al autor que su contenido gusta).

### 1.4 Banner de referidos con barra 0/3 y link copiable — YA EXISTÍA ✅

Verificado en [`dashboard.tsx:509`](src/routes/_authenticated/dashboard.tsx:509): banner con
icono Gift, barra de progreso `referralCount/3`, contador y botón que copia
`?ref=<userId>` en un clic. Se muestra a usuarios free con <3 referidos. La recompensa
(3 → 1 mes Viajero) vive en la RPC `attribute_acquisition` con write-once y anti
auto-referido. No se tocó: ya cumple exactamente lo pedido.

### 1.5 ShareDialog — YA ERA FUERTE, sin cambios

Ya tenía: póster SVG para Instagram (TripVisualMap, descargable), atajos
WhatsApp/Stories/nativo, y `utm_source` + `ref` por canal en cada link (atribución del
K-factor). Con el og:image dinámico de 1.1, el eslabón que faltaba (la preview branded al
pegar el link) queda cerrado.

---

## 2. PARTE 2 — SEO programático ✅ IMPLEMENTADO

- **30 destinos nuevos** (los 5 existentes eran París, Tokio, NY, Barcelona, Bali):
  - [`src/lib/seo-destinations-europa.ts`](src/lib/seo-destinations-europa.ts) (20): Roma,
    Londres, Lisboa, Ámsterdam, Praga, Budapest, Viena, Berlín, Estambul, Atenas,
    Santorini, Dublín, Edimburgo, Oporto, Florencia, Venecia, Madrid, Sevilla, Granada,
    Valencia.
  - [`src/lib/seo-destinations-mundo.ts`](src/lib/seo-destinations-mundo.ts) (10):
    Mallorca, Tenerife, Marrakech, Bangkok, Dubái, Cancún/Riviera Maya, Ciudad de México,
    Buenos Aires, Cusco/Machu Picchu, Río de Janeiro.
  - Cada una: title + metaDescription con año y CTA, H1, intro con ángulo editorial,
    itinerario día a día con sitios y horarios reales, datos prácticos (presupuesto/día,
    transporte, temporada), 4-5 FAQ, y 3 destinos relacionados (interlinking).
- **Todo lo demás era automático** al añadir los datos (verificado, no reimplementado):
  FAQPage + TouristTrip + BreadcrumbList schema, meta/OG tags y canonical
  (`viajes.$destino.tsx`), hub `/viajes`, chips del notFound, y el **sitemap dinámico**.
- **Robustez de imágenes:** `onError` en los `<img>` de hero y relacionados
  ([`viajes.$destino.tsx`](src/routes/viajes.$destino.tsx)) degrada a
  `loremflickr.com/<destino>,travel` si Unsplash retirara un ID.
- **Verificación:**
  - `GET /sitemap.xml` local → 42 URLs (7 estáticas + 35 destinos) ✅
  - `/viajes/roma` renderizado en el navegador: title correcto, H1, 3 schemas JSON-LD
    (FAQPage, TouristTrip, BreadcrumbList), 4 FAQ, 4 tarjetas de día, hero cargada ✅
  - **Las 30 URLs de Unsplash comprobadas una a una con HEAD → todas 200** ✅ (las 5 de
    loremflickr responden 302→imagen, su comportamiento normal).

---

## 3. PARTE 4 — Monetización ✅ IMPLEMENTADO

### 3.1 Trip Pass irresistible al llegar al límite

- **El momento de máxima motivación era un error genérico.** Cuando `generateItinerary`
  devuelve `LIMIT_REACHED` (free = 2 viajes de por vida, viajero = 5/mes), el usuario veía
  una pantalla roja de "algo salió mal" con el texto crudo del error.
- Ahora [`my-trip.$tripId.tsx`](src/routes/_authenticated/my-trip.$tripId.tsx) detecta
  `LIMIT_REACHED` y renderiza **`LimitPaywall`**: tarjeta héroe del Pase de Viaje (icono
  ticket, "Pago único · desbloquea este itinerario ahora", precio 4,99 € en píldora) que
  abre el checkout embebido de Stripe ahí mismo, + alternativa de plan (Viajero para free,
  Explorador para viajero) + "Ya lo he comprado, reintentar" que relanza la generación.
- El diálogo de límite de [`new-trip.tsx`](src/routes/_authenticated/new-trip.tsx) se
  reordenó igual: el Pase primero como tarjeta destacada con precio, la suscripción
  después (antes el Pase era un botón secundario sin precio visible).
- i18n: 9 claves nuevas `trip.limit*` + 2 `newTrip.pass*` en es/en/fr/pt.

### 3.2 Email de conversión 24 h antes de expirar el trial

- **Nuevo email `trial_expiring`** en [`lifecycle-emails.ts`](src/lib/lifecycle-emails.ts)
  (es/en): "Mañana pierdes el asistente IA — 30 segundos para decidir". Ancla el precio
  anual (5,99 €/mes) y ofrece el Pase de Viaje como alternativa sin suscripción.
- [`run.ts`](src/routes/email/email/lifecycle/run.ts): el antiguo E4 (ventana ±1 día) se
  divide en **E4a `trial_expiring`** (ventana `(now, now+1d]` — llega cuando el usuario
  AÚN tiene lo que va a perder) y **E4b `trial_end`** (`(now-1d, now]`), sin solape.
  Idempotencia intacta vía `lifecycle_email_log`.

### 3.3 Plan anual como default visual en pricing

- [`pricing-glass.tsx`](src/components/ui/pricing-glass.tsx): `isAnnual` arranca en `true`.
  La página abre anclando 5,99 €/13,99 € (verificado en navegador: los precios renderizados
  al cargar son los anuales). El badge "-20%" ya existía.

---

## 4. PARTES 3, 5 y 6 — Documentadas en GROWTH_HACK.md

Contenido no-código entregado completo en [`GROWTH_HACK.md`](GROWTH_HACK.md):
- **P3:** 5 guiones TikTok (gancho/cuerpo/CTA/hashtags), 5 carruseles IG con copy por
  slide, 10 posts Reddit/losviajeros con título y esqueleto, y el sistema de outreach a 20
  micros (criterio de selección honesto + 3 mensajes completos). No se inventaron handles
  ni nombres de personas: se da el método exacto de construcción de la lista en 1 hora.
- **P5:** día/hora, tabla de assets con especificaciones, tagline y descripción, primer
  comentario del maker completo, estrategia de upvotes legítima y lista D-Day de 50 por
  categorías.
- **P6:** 10 quick wins ordenados por impacto/esfuerzo con instrucciones exactas.

---

## 5. Verificación global

| Check | Resultado |
|---|---|
| `tsc --noEmit` (proyecto entero) | ✅ 0 errores |
| `eslint` sobre los 13 ficheros tocados | ✅ 0 errores (tras `--fix` de formato) |
| Dev server (Vite) arranca y sirve | ✅ |
| `/viajes/roma` en navegador (title, H1, schemas, FAQ, hero) | ✅ medición DOM |
| `/sitemap.xml` → 42 URLs | ✅ |
| `/pricing` abre en anual (5,99/13,99) | ✅ medición DOM |
| Pipeline og:image (fuentes+satori+resvg→PNG con datos reales) | ✅ standalone, imagen inspeccionada |
| 30 heroImages Unsplash | ✅ todas HTTP 200 |
| i18n es/en/fr/pt | ✅ mismas claves en los 4 |

**No verificado (requiere entorno que no existe en local):** el endpoint `/api/og/$slug`
end-to-end contra la BD (el dev server local no recibe `process.env.SUPabase_*` — limitación
preexistente que afecta igual a la página pública y al sitemap; en Vercel funciona ese mismo
patrón hoy) · el flujo de compra del Trip Pass (Stripe) · los emails (Resend/cola). Los tres
están en los quick wins #6, #10 y #4-5 de GROWTH_HACK.md.

---

## 6. Acciones manuales pendientes (sin ellas, parte de lo anterior no se activa)

1. **Aplicar `20260712150000_growth_view_milestones.sql` en prod** (junto con la de
   seguridad `20260712090000` que sigue pendiente de la auditoría de esta mañana).
   Hasta entonces: el RPC sigue devolviendo `void`, el código lo tolera y simplemente no
   hay emails de hitos.
2. **`npm install` ya ejecutado en local** (satori + @resvg/resvg-js están en
   `package.json`/`package-lock.json`); Vercel los instalará en el próximo deploy.
3. **Deploy a Vercel preview** y validar: og:image (opengraph.xyz), CSP de la auditoría, y
   que `@resvg/resvg-js` cargue en la función (si diera problemas de binario, el endpoint
   degrada a 302 al hero — el share no se rompe, pero avisa en logs).
4. Los quick wins operativos de GROWTH_HACK.md §4 (Search Console, Unsplash prod,
   SEND_EMAIL_HOOK_SECRET, cron de lifecycle…).

## 7. Deudas conocidas que dejé a propósito

- **Los datos SEO viajan en el bundle cliente** (~35 destinos, ~40 KB gzip extra) porque el
  loader de TanStack es isomórfico. Aceptable hoy; si la 2ª tanda de 30 destinos se hace,
  mover a server function con `loader` solo-servidor.
- **5 heroes con loremflickr** (Granada, Valencia, Mallorca, Tenerife, Buenos Aires): foto
  aleatoria por keyword, calidad variable. Sustituir por Unsplash curado cuando haya 10
  minutos (quick win natural).
- **`inputValidator` deprecado** en varios `*.functions.ts` (warning de build,
  preexistente): migrar a `.validator()` en un PR de mantenimiento.
