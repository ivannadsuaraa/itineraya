# GROWTH_HACK.md — De 0 a 10.000 usuarios activos

> Generado el 2026-07-12 tras leer el código real del proyecto. Todo lo que aquí se
> referencia (rutas, límites, precios, features) existe en el repo tal como se describe.
> Lo implementado hoy en código está detallado en `IMPLEMENTATION_REPORT.md`.

---

## 0. Diagnóstico brutal (lo que separa a Itineraya de las que mueren en silencio)

**Lo que ya tienes y la mayoría no:** demo sin registro (`/demo`), páginas públicas de
itinerario con paywall progresivo (`/trip/$slug`), sistema de referidos con recompensa real
(3 amigos → 1 mes Viajero, `attribute_acquisition`), 35 landings SEO con schema markup,
sitemap dinámico, 9 emails de lifecycle, Trip Pass de 4,99 € para monetizar sin suscripción,
y desde hoy: og:image dinámico branded y notificaciones de hitos de vistas.

**Tu problema no es producto. Es distribución.** Nadie sabe que existes. Y tu riesgo nº1 es
el clásico de las apps de viajes: **frecuencia de uso baja** (la gente planea 1-3 viajes al
año). Por eso la estrategia entera se apoya en dos pilares que NO dependen de que el usuario
vuelva:

1. **El loop viral del itinerario compartido** — cada viaje creado es un asset de marketing
   con URL pública, preview branded y botón Remix. El usuario no tiene que volver; su
   itinerario trabaja solo.
2. **SEO programático** — la gente busca "itinerario roma 4 días" 40.000 veces al mes en
   español. Ahora tienes 35 páginas apuntando exactamente a eso.

**North Star Metric:** itinerarios generados por semana (no registros — registros sin
generación son vanidad; la generación ES el momento aha).

**El K-factor objetivo:** cada itinerario compartido debe traer ≥0,15 registros. Con un 30%
de usuarios compartiendo, eso es un coeficiente viral de ~0,05 al principio — no explosivo,
pero compuesto con SEO y contenido, la curva se dobla sola.

---

## 1. El funnel y dónde está cada palanca (mapa real del código)

```
TikTok/IG/Reddit ──→ /viajes/$destino (SEO) ──→ /onboarding con prefill
       │                     │                        │
       └──→ /demo (sin registro) ──→ claim en dashboard
                                          │
                              GENERACIÓN (momento aha, ~40s)
                                          │
                    ShareDialog (utm + ref) ──→ /trip/$slug público
                                          │              │
                              og:image branded      botón Remix + barra sticky
                                          │              │
                          email hito 10/50/100 ──→ vuelve a compartir
                                          │
                    Límite free (2 viajes) ──→ Paywall con Trip Pass 4,99 €
                                          │
                    Trial 7d Viajero ──→ email 24h antes ──→ anual 5,99 €/mes
```

Cada flecha de este diagrama existe en el código a día de hoy.

---

## 2. PARTE 3 — Contenido viral listo para publicar

### 2.1 Cinco guiones de TikTok para grabar HOY

**Formato común:** vertical, 25-40 s, screen recording de la app + cara solo en el gancho.
Subtítulos SIEMPRE (el 80% ve sin sonido). Publica 1 al día a las 19:00-21:00 CET.

---

**TikTok #1 — "La IA me planeó Roma en 40 segundos" (el demo crudo)**

- **Gancho (0-3 s):** cara a cámara: *"Le pedí a una IA que me planeara 4 días en Roma
  mientras me hacía el café. Mira esto."*
- **Cuerpo (3-30 s):** screen recording real: escribes "Roma", eliges fechas y presupuesto,
  pulsas generar → time-lapse de la generación → scroll rápido por el itinerario enseñando
  horarios, transporte entre paradas ("🚇 Metro L4, 12 min"), el mapa, y un tip local.
- **Remate (30-38 s):** zoom al mapa: *"Hasta me dice cuánto se tarda andando entre sitios.
  Y esto es la versión gratis."*
- **CTA:** *"Se llama Itineraya, link en la bio. La demo no pide ni registro."*
- **Hashtags:** #viajar #itinerario #roma #viajarbarato #inteligenciaartificial #travelhack
  #viajeros
- **Por qué funciona:** el formato "le pedí a una IA X" sigue reventando en 2026, y el
  resultado es visualmente denso (mapa + horarios + fotos).

---

**TikTok #2 — "Cuánto cuesta REALMENTE una semana en Bali" (el ángulo presupuesto)**

- **Gancho:** texto grande en pantalla: *"POV: dices que Bali es caro sin haberlo mirado"*
- **Cuerpo:** generas itinerario de Bali 7 días con presupuesto medio → enseñas el desglose
  de actividades día a día → pausa dramática en los precios de las villas.
- **Remate:** *"50-90 € al día EN PAREJA con villa con piscina. Más barato que tu agosto en
  la costa."*
- **CTA:** *"Genera el tuyo gratis con tu presupuesto real — link en bio."*
- **Hashtags:** #bali #viajarbarato #presupuestoviaje #indonesia #lunademiel #viajes2026
- **Nota:** este formato se replica con CUALQUIER destino de los 35 de /viajes. Es tu serie.

---

**TikTok #3 — "Mi novia me dejó planear el viaje" (el ángulo relación/humor)**

- **Gancho:** *"Mi novia me dio UNA tarea: planear el viaje a París. Esto fue lo que hice."*
- **Cuerpo:** 5 segundos de fingir estrés con 40 pestañas de blogs abiertas → corte → la app
  generando → enseñas el resultado día a día con cara de héroe.
- **Remate:** *"Le dije que me llevó todo el finde. Me llevó 40 segundos. No se lo digáis."*
- **CTA:** *"Itineraya. Gratis. Vuestro secreto está a salvo."*
- **Hashtags:** #parejas #paris #viajeenpareja #humor #planesenpareja #viajar
- **Por qué funciona:** el conflicto/confesión supera al tutorial en shares. Es el que más
  probabilidad tiene de salir del nicho viajero.

---

**TikTok #4 — "Tu itinerario tiene un contador de vistas" (el ángulo ego/creator)**

- **Gancho:** *"¿Sabías que puedes publicar tu itinerario y ver cuánta gente lo copia?"*
- **Cuerpo:** enseñas un itinerario propio publicado → el contador de vistas subiendo → el
  email de "tu itinerario superó 50 visitas" → alguien haciendo Remix de tu viaje.
- **Remate:** *"Es como Strava pero para viajes. Mi ruta de Lisboa ya la han usado 87
  personas."*
- **CTA:** *"Publica el tuyo y me cuentas. Link en bio."*
- **Hashtags:** #viajeros #lisboa #travelcommunity #itinerario #comparte
- **Nota:** este vídeo VENDE el loop viral en sí. Grábalo cuando tengas los primeros
  itinerarios con vistas reales (semana 2-3).

---

**TikTok #5 — "3 errores al planear Tokio (y cómo los evita una IA)" (el ángulo experto)**

- **Gancho:** *"Si vas a Tokio y haces esto, vas a perder medio viaje en el metro."*
- **Cuerpo:** error 1: cruzar la ciudad 2 veces al día (enseñas cómo la app agrupa por
  barrios) → error 2: no reservar teamLab/Ghibli (la app lo avisa en el itinerario) →
  error 3: activar el JR Pass solo para Tokio (el tip aparece en la página de /viajes/tokio).
- **Remate:** *"La IA agrupa por zonas conectadas por la Yamanote. Sola."*
- **CTA:** *"Itinerario completo de Tokio gratis en el link."* → apunta a
  `itineraya.com/viajes/tokio` (¡no a la home! — mide con utm_source=tiktok).
- **Hashtags:** #tokio #japon #jrpass #erroresdeviaje #consejoviaje #asia

---

### 2.2 Cinco carruseles de Instagram (copy completo por slide)

**Formato:** 6-8 slides, 1080×1350. Diseño: fondo foto del destino + caja blanca con texto
(coherente con el estilo Bento de la marca: navy #0c1a2e, acento #38bdf8). Último slide
SIEMPRE el mismo CTA. Publica 2/semana.

---

**Carrusel #1 — "Roma en 4 días, día a día"** (réplica visual de /viajes/roma)

1. *"ROMA EN 4 DÍAS — el itinerario que no te hace perder tiempo en colas"* (foto Coliseo)
2. *"DÍA 1 — Roma antigua. Coliseo a las 8:30 con reserva. Foro y Palatino. Cena en Monti."*
3. *"DÍA 2 — Vaticano. Museos a las 8:00 (Sixtina sin gentío). San Pedro. Castel Sant'Angelo."*
4. *"DÍA 3 — Roma barroca a pie. Panteón → Navona → Trevi. Los Caravaggio GRATIS en San Luigi."*
5. *"DÍA 4 — Trastevere + el mirador del Gianicolo. La mejor vista gratuita de Roma."*
6. *"El error nº1: no reservar. Coliseo y Vaticano se agotan con DÍAS de antelación."*
7. CTA: *"¿Tus fechas son otras? Genera tu versión personalizada gratis en 1 minuto →
   itineraya.com/viajes/roma (link en bio)"*

**Caption:** "Guárdate este post para tu viaje a Roma 🏛️ Y si quieres la versión adaptada a
TUS fechas y presupuesto, la IA de Itineraya te la monta en 40 segundos (gratis, link en
bio). #roma #italia #itinerarioroma #viajararoma #europa"

---

**Carrusel #2 — "5 destinos donde tu sueldo vale el doble"**

1. *"5 DESTINOS donde tu presupuesto rinde el DOBLE (con coste real por día)"*
2. *"BANGKOK — 40-80 €/día. Templos, masaje diario y la mejor street food del mundo."*
3. *"MARRAKECH — 50-90 €/día. Riad con patio incluido. A 2h de vuelo."*
4. *"BUDAPEST — 65-100 €/día. Termas + ruin bars + el Parlamento más bonito de Europa."*
5. *"CIUDAD DE MÉXICO — 60-110 €/día. La mejor escena gastro del continente."*
6. *"GRANADA — 60-100 €/día. Y las tapas siguen saliendo gratis."*
7. CTA: *"Dile tu presupuesto exacto a Itineraya y te monta el viaje completo. Gratis →
   link en bio"*

**Caption:** "¿Cuál te llevas? 👇 Presupuestos reales por persona y día con alojamiento
incluido. #viajarbarato #presupuestoviaje #destinos2026 #mochileros"

---

**Carrusel #3 — "Cómo planear un viaje en 2026 (el método de 4 pasos)"**

1. *"Sigues planeando viajes con 40 pestañas abiertas. Hay otra manera."*
2. *"ANTES: 6 horas entre blogs de 2019, foros y mapas. DESPUÉS: 40 segundos."*
3. *"PASO 1 — Dile destino, fechas, presupuesto y con quién vas."*
4. *"PASO 2 — La IA genera el plan día a día: horarios reales, transporte entre paradas, mapa."*
5. *"PASO 3 — Edítalo por chat: 'el día 2 sin museos, más comida callejera'."*
6. *"PASO 4 — Compártelo con tu grupo. Se acabó el caos de WhatsApp."*
7. CTA: *"Pruébalo sin registrarte: itineraya.com/demo (link en bio)"*

---

**Carrusel #4 — "Santorini sin arruinarte"**

1. *"SANTORINI SIN ARRUINARTE — sí, se puede"* (foto Oia)
2. *"El atardecer 'famoso' de Oia = 2h de sitio + empujones. El MISMO sol se pone en
   Imerovigli con el 5% de gente."*
3. *"Las infinity pools de postal: 400 €/noche. Las vistas idénticas en Imerovigli: desde 120 €."*
4. *"Duerme en Perissa o Karterados, muévete en bus, sube a la caldera a pasear: gratis."*
5. *"Mayo o septiembre-octubre: mitad de precio, mismo mar."*
6. CTA: *"Itinerario completo de Santorini (4 días, con la ruta de la caldera) gratis →
   itineraya.com/viajes/santorini"*

---

**Carrusel #5 — "Tu itinerario también puede ser famoso" (el loop viral contado)**

1. *"¿Y si tu itinerario lo usaran 100 personas?"*
2. *"En Itineraya cada viaje tiene una página pública con contador de vistas."*
3. *"Compartes el link → tus amigos lo ven completo → cualquiera puede hacerle REMIX con sus
   fechas."*
4. *"Cuando pasa de 10, 50 o 100 vistas… te llega un email. Es adictivo."*
5. *"Y si 3 amigos se registran con tu link: 1 mes de plan Viajero gratis."*
6. CTA: *"Publica tu primer viaje hoy → itineraya.com"*

---

### 2.3 Diez posts para Reddit y losviajeros.com

**Reglas de oro (o te banean y quemas la marca):**
- En Reddit, ratio 10:1 — diez aportes genuinos por cada mención del producto.
- El post NUNCA es "mirad mi app". El post es un itinerario/consejo VALIOSO; la app aparece
  como herramienta que usaste, mencionada una vez, o solo si preguntan.
- En losviajeros.com, el foro vive de respuestas útiles en hilos existentes. Responde a
  hilos de "itinerario X días en Y ¿me lo revisáis?" pegando un itinerario real generado y
  ajustado a mano.

**Los 10 posts (título + esqueleto):**

1. **r/travel** — *"I built a day-by-day Rome itinerary optimized to avoid queues — tear it
   apart"* → pegas el itinerario de /viajes/roma traducido, pides crítica. Mencionas la
   herramienta solo si preguntan. (Los posts "critique my itinerary" tienen engagement altísimo.)
2. **r/JapanTravel** — *"7 days in Tokyo grouped by Yamanote-line neighborhoods — did I get
   the logistics right?"* → itinerario de /viajes/tokio adaptado. Este subreddit ADORA la
   logística fina.
3. **r/solotravel** — *"Planning tools comparison: I tested ChatGPT vs dedicated AI trip
   planners for a 10-day Bali trip"* → comparativa honesta (incluye las debilidades de
   Itineraya). Los posts comparativos honestos convierten mejor que los promos.
4. **r/travelhacks** — *"The 'group trips by neighborhood' rule cut my walking time in half —
   here's the method"* → enseñas el método (el que usa el prompt real de la app: actividades
   consecutivas a ≤1,2 km), con un ejemplo generado.
5. **r/es (o r/spain)** — *"Hice una guía de Madrid de 3 días para amigos que me visitan —
   la comparto"* → contenido de /viajes/madrid en tono local.
6. **losviajeros.com › foro Italia** — responde 2-3 hilos activos de "Roma en 4 días" con el
   itinerario completo pegado + "lo generé con una herramienta de IA y lo ajusté con lo que
   sé de Roma; si queréis el link lo paso por MP". El MP evita el filtro anti-spam.
7. **losviajeros.com › foro Japón** — mismo patrón con Tokio (es EL destino estrella del foro).
8. **losviajeros.com › foro América del Sur** — hilo nuevo: "Cusco y Machu Picchu: el orden
   correcto para no morir del soroche (itinerario 6 días)" → contenido de /viajes/cusco.
   El ángulo salud/altitud genera respuestas.
9. **r/PeruTravel / r/MachuPicchu** — versión EN del anterior. Circuit tickets y
   aclimatación son las preguntas nº1 del sub.
10. **r/InternetIsBeautiful** — *"A trip planner where every itinerary becomes a public page
    anyone can remix"* → este SÍ es promo directo: ese subreddit existe para descubrir
    herramientas. Solo funciona si la demo va fina y sin registro. Hazlo en semana 3-4, no
    el día 1.

---

### 2.4 Outreach a 20 microinfluencers de viajes en español

**A quién buscar (criterio, no nombres inventados):** cuentas de 10k-100k seguidores en
TikTok/IG, español, nicho "viajes baratos / itinerarios / parejas viajeras / mochileros",
con engagement >4% (mira comentarios reales, no likes). Búscalos por los hashtags
#viajarbarato #itinerario #mochileros #viajerosporelmundo y mira quién comenta en las
cuentas grandes (Molaviajar, viajefest, etc. — los comentaristas con cuenta propia de 20k
son tu objetivo exacto).

**Construye la lista en 1 hora:** hoja de cálculo con 20 filas: 8 España (viajes urbanos
Europa), 6 México/Colombia/Argentina (los destinos LatAm que ya tienes en /viajes), 4
parejas viajeras, 2 de "viajes con IA/tech". Para cada uno: handle, seguidores, último vídeo
viral, email si lo tiene en bio.

**Mensaje 1 — DM inicial (personalizado, corto):**

> Hola [nombre] 👋 Soy Iván, fundador de Itineraya (IA que genera itinerarios día a día con
> mapa y horarios reales). Vi tu vídeo de [destino concreto — DEMUÉSTRALO] y pensé que esto
> te iba a molar: te he generado un itinerario de [ese destino] con la app →
> [link /trip/... del itinerario YA generado]. Sin compromiso: si te parece útil para tu
> audiencia, te monto acceso Explorador gratis 6 meses + un código para sortear entre tus
> seguidores. Si no, dime qué le falta y lo mejoro — feedback de alguien que viaja de verdad
> vale oro.

**Claves:** llegas con el REGALO ya hecho (un itinerario de SU destino), no pides nada en el
primer mensaje, y ofreces valor a su audiencia (sorteo), no solo a él.

**Mensaje 2 — follow-up (a los 4-5 días, solo uno):**

> Hola [nombre], te dejo esto por si se enterró el mensaje 👆 Un dato que igual te sirve
> aunque pases de mí: [dato útil del destino de su último vídeo, sacado de tus landings].
> ¡Buen viaje a [siguiente destino que haya anunciado]!

**Mensaje 3 — la propuesta concreta (si responde):**

> Genial 🙌 Propuesta simple: 1 vídeo/reel enseñando cómo generas tu próximo itinerario real
> con la app (no guion, tu estilo). A cambio: 6 meses de Explorador, código de descuento
> exclusivo con tu nombre para tu audiencia (medimos juntos cuánta gente lo usa), y si
> funciona, hablamos de una colaboración fija por viaje. Cero exclusividad.

**Presupuesto cero:** todo esto es producto + códigos. Si un vídeo funciona, ahí sí paga
(100-300 € por vídeo en micros es tarifa real de mercado en español).

---

## 3. PARTE 5 — Lanzamiento en Product Hunt

### 3.1 Cuándo

- **Día:** martes, miércoles o jueves. El martes es el mejor equilibrio
  tráfico/competencia (el lunes se acumulan lanzamientos del finde; el viernes muere).
- **Hora:** 00:01 PT (09:01 CET) — necesitas las 24 h completas de votación.
- **Evita:** semanas de keynotes (Apple/OpenAI) y festivos US.

### 3.2 Assets (prepáralos la semana antes)

| Asset | Especificación | Contenido exacto |
|---|---|---|
| **GIF principal** | 1270×760, <3MB, 15-20 s en loop | El flujo demo completo: escribir "Kioto" → fechas → generar (acelerado 4x) → scroll por el itinerario con mapa. Grábalo sobre `/demo` con la ventana a 1270px. Herramienta: Screen Studio o Kap + gifski. |
| **Galería (5 capturas)** | 1270×760 PNG | 1) itinerario completo con mapa, 2) edición por chat ("hazlo más barato" → resultado), 3) página pública /trip con botón Remix, 4) boarding pass / tema aeropuerto (es tu diferencial visual), 5) og:image branded de un viaje (la que genera /api/og). |
| **Tagline** | <60 chars | "AI trip planner that turns itineraries into shareable pages" |
| **Descripción corta** | <260 chars | "Describe your trip — get a day-by-day itinerary with real opening hours, transit between stops and a map, in 40 seconds. Every itinerary becomes a public page anyone can remix. Free, no card." |
| **Topics** | — | Travel, Artificial Intelligence, Web App |

### 3.3 Primer comentario (del maker — publícalo en el minuto 1)

> Hey Product Hunt! 👋 I'm Iván, solo founder of Itineraya.
>
> I built this because planning a trip meant 40 open tabs, blogs from 2019 and a Google Doc
> nobody updates. Itineraya generates a **day-by-day itinerary in ~40 seconds**: real venues,
> opening hours, transit between stops ("metro L4, 12 min"), budget-aware restaurant picks,
> and a map.
>
> What I think makes it different:
> - **Every itinerary is a shareable public page** — your friends see the full plan, and
>   anyone can *remix* it with their own dates and budget.
> - **Edit by chat**: "day 2 without museums, more street food" → rewritten in seconds.
> - **Try it without signing up**: the demo generates a real itinerary, no account, no card.
>
> Stack: React 19 + TanStack Start, Claude Haiku for generation, Supabase, Stripe.
>
> I'll be here all day — brutally honest feedback especially welcome. What destination
> should I stress-test live for you? 🌍

(Responder a CADA comentario en <30 min durante las primeras 12 h importa más que
cualquier otra táctica.)

### 3.4 Estrategia de upvotes sin comprar votos (lo que funciona de verdad)

1. **La semana antes:** actívate en PH — comenta con sustancia en 10-15 lanzamientos,
   sigue a makers. Cuentas nuevas que votan tu producto el día D valen menos (el algoritmo
   pondera antigüedad y actividad); cuentas que llegan por links directos a la página del
   producto pesan menos que las que te encuentran en la home — por eso al avisar se comparte
   `producthunt.com` + "búscanos", no el link directo (y JAMÁS pidas el upvote
   explícitamente por escrito: pide "échale un vistazo y comenta qué te parece").
2. **Lista D-Day de 50 personas** (construcción, no invención): 15 amigos/conocidos CON
   cuenta PH previa (pídeles crearla YA, no el día D) · 10 usuarios beta de Itineraya (los
   que ya generaron viajes — escríbeles por email) · 10 makers hispanohablantes de
   comunidades indie (Indie Hackers en español, Product Makers, No Code Hackers en Slack /
   Discord / Telegram) con los que hayas interactuado antes · 8 contactos de LinkedIn del
   mundo travel-tech · 7 de los microinfluencers de la Parte 3 (los que respondieron).
   Mensaje escalonado: 10 personas a las 09:00, 10 a las 12:00, resto por la tarde — un
   pico artificial a primera hora seguido de silencio es señal de manipulación.
3. **El día D:** publica el TikTok #1 y stories apuntando a PH, post en LinkedIn personal
   (la historia del solo founder funciona), y comparte en 2-3 comunidades donde ya
   participes.
4. **Objetivo realista:** top 10 del día = 300-800 registros. Top 5 = 1.500+. Todo lo que
   no sea top 10 sigue valiendo: el backlink DA91 y el badge para la landing.

---

## 4. PARTE 6 — Quick wins de esta semana (orden = impacto/esfuerzo)

| # | Acción (≤1 h) | Impacto | Instrucciones exactas |
|---|---|---|---|
| 1 | **Aplicar las 2 migraciones pendientes en prod** | 🔴 Bloqueante | `supabase/migrations/20260712090000_security_audit_fixes.sql` y `20260712150000_growth_view_milestones.sql` en el SQL Editor de Supabase (en orden). Sin la segunda, el contador de vistas DEJA de funcionar (la función pasa a devolver integer) — es lo primero que hay que hacer tras el deploy. |
| 2 | **Google Search Console + sitemap** | 🔴 Alto | search.google.com/search-console → añade propiedad itineraya.com (verificación DNS) → Sitemaps → envía `https://itineraya.com/sitemap.xml`. Las 35 landings no existen para Google hasta este clic. Bing Webmaster Tools de paso (5 min, importa desde GSC). |
| 3 | **Key de producción de Unsplash** | 🔴 Alto | unsplash.com/oauth/applications → "Apply for production" (la demo actual: 50 req/h — ~3 generaciones/hora y las imágenes caen a loremflickr). Producción = 5.000/h. Tarda 1-2 días en aprobarse: pídelo HOY. |
| 4 | **Configurar `SEND_EMAIL_HOOK_SECRET`** | 🟠 Alto | Genera un secreto (`openssl rand -hex 32`), ponlo en Vercel (env) y en Supabase → Auth → Hooks → Send Email con el mismo valor. Desde la auditoría de hoy el endpoint falla cerrado: sin esto NO salen emails de auth. |
| 5 | **Programar el cron de lifecycle emails** | 🟠 Alto | En Supabase SQL Editor: `select cron.schedule('lifecycle-emails', '0 9 * * *', ...)` llamando a `POST https://itineraya.com/email/email/lifecycle/run` con el service role key como Bearer (instrucciones exactas al final de la migración `20260704110000`). Sin esto, los 9 emails (incluido el nuevo de trial-24h) no se envían nunca. |
| 6 | **Validar el og:image tras el deploy** | 🟠 Medio | Publica un viaje de prueba, pega `https://itineraya.com/trip/<slug>` en opengraph.xyz y en el Sharing Debugger de Facebook. Debes ver la imagen branded (foto + ITINERAYA + días + CTA). Si sale el fallback, mira los logs de la función en Vercel. |
| 7 | **Sembrar el feed con 8-10 viajes públicos propios** | 🟠 Medio | Genera y publica itinerarios de los destinos top (Roma, Tokio, Bali, NY…) con tu cuenta. El feed /explore vacío mata la conversión; lleno de viajes con vistas la dispara. Además son los links que usarás en Reddit/losviajeros. |
| 8 | **Publicar TikTok #1 y carrusel #1** | 🟡 Medio | Los guiones están arriba, listos. 40 min de grabación + edición con CapCut. El link de la bio con `?utm_source=tiktok&utm_medium=bio` para medirlo en `acquisition_source`. |
| 9 | **Responder 3 hilos de losviajeros.com** | 🟡 Medio | Busca hilos activos (<7 días) de "itinerario Roma/Tokio/Japón" y pega el itinerario completo generado + ajustado. No pongas link salvo que lo pidan (norma del foro). |
| 10 | **Test de compra E2E del Trip Pass** | 🟡 Medio | Con Stripe en test: fuerza el límite (crea 2 viajes con cuenta free), pulsa generar el 3º → debe salir el paywall nuevo con el Pase a 4,99 € → compra con `4242…` → verifica que `bonus_trips` sube a 1 y puedes generar. Es el flujo de dinero nº1 y nadie lo ha probado entero. |

---

## 5. Roadmap 8 semanas → 10.000 usuarios activos

| Semana | Foco | Meta acumulada (usuarios con ≥1 itinerario) |
|---|---|---|
| 1 | Quick wins 1-10 + outreach a los 20 micros | 100 (amigos, foros, primeros TikToks) |
| 2 | Ritmo de contenido: 5 TikToks, 2 carruseles, 5 respuestas foro/Reddit | 300 |
| 3 | Posts Reddit grandes (r/travel, r/JapanTravel) + primeros vídeos de micros | 700 |
| 4 | **Product Hunt** + r/InternetIsBeautiful | 2.000 |
| 5 | Doblar lo que funcionó (mira `acquisition_source` en la BD: ya se guarda) | 3.200 |
| 6 | SEO empieza a indexar: 2ª tanda de 30 landings (LatAm profundo: Medellín, Oaxaca…) | 4.800 |
| 7 | Colaboraciones pagadas con los 2-3 micros que mejor convirtieron | 7.000 |
| 8 | El loop compuesto: cada 100 usuarios → ~30 comparten → vistas → remixes | 10.000 |

**La única métrica de decisión semanal:** registros por canal (`acquisition_source`) y % que
genera ≥1 itinerario. Si un canal trae registros que no generan, muere el canal.

**Los datos ya se recogen:** `profiles.acquisition_source` + `referred_by` (write-once, RPC
`attribute_acquisition`), `trips.view_count`, y las URLs de compartir llevan
`utm_source` + `ref` desde el ShareDialog. No necesitas analytics nuevos para esto —
necesitas UNA query SQL semanal (guárdala en Supabase):

```sql
select p.acquisition_source, count(*) usuarios,
       count(*) filter (where exists (select 1 from trips t where t.user_id = p.id and t.status = 'ready')) activados
from profiles p group by 1 order by 2 desc;
```

---

## 6. Lo que NO hacer (con el mismo énfasis)

- **No pagues ads todavía.** Con LTV sin validar y frecuencia baja, Meta/Google ads en
  viajes es una trituradora de dinero. Primero exprime orgánico + viral.
- **No traduzcas las landings a inglés aún.** El SEO en inglés de "rome itinerary" es un
  océano rojo con DR90 delante. En español eres competitivo YA.
- **No añadas features.** El producto está por delante de la distribución. Cada hora de
  feature nueva es una hora robada a distribución. La única excepción: bugs del funnel.
- **No compres votos/seguidores.** PH detecta anillos de votos y te hunde; los seguidores
  falsos matan el engagement rate que los micros van a mirar antes de colaborar contigo.
