# GROWTH_FINAL.md — Itineraya: de 0 a 10.000 usuarios

> Documento de síntesis. No contiene análisis nuevo: recopila y organiza lo ya escrito en
> `GROWTH_REPORT.md`, `GROWTH_HACK.md`, `GROWTH_90_DAYS.md`, `SOCIAL_STRATEGY.md`,
> `BUSINESS_ANALYSIS.md` y `PRODUCTHUNT_LAUNCH.md`. Donde dos informes proponían lo mismo
> con distinta fecha, se conserva la versión más reciente y se marca la más antigua como
> superada. Fuente y fecha original entre corchetes en cada bloque.

---

## 1. Resumen ejecutivo

### 1.1 Qué es Itineraya y por qué puede ganar

*(Fuente: BUSINESS_ANALYSIS.md, 2026-07-04)*

Itineraya genera un itinerario de viaje completo (día a día, horarios reales, transporte
entre paradas, mapa, fotos) en ~60 segundos con Claude Haiku + structured outputs, y lo
convierte en un **artefacto compartible y remixable**: página pública, postales
descargables, feed de la comunidad. Frente a los cuatro competidores reales:

| | Itineraya | TripIt | Wanderlog | ChatGPT directo |
|---|---|---|---|---|
| Genera el plan con IA | ✅ nativa, coherente | ❌ | Parcial | ✅ pero texto plano, sin persistencia |
| Artefacto visual/compartible | ✅ | ❌ | Parcial | ❌ |
| Remix de itinerarios de otros | ✅ único en el mercado | ❌ | ❌ | ❌ |
| Español nativo | ✅ | ❌ EN-first | ❌ EN-first | ✅ |

**Posicionamiento que no pueden copiar:** *"El itinerario que se comparte."* ChatGPT no
tiene páginas públicas ni remix (es 1:1 por diseño). Wanderlog no quiere copiarlo: el remix
instantáneo devalúa su foso de guías UGC escritas a mano. TripIt/Lambus no tienen ni
generación IA seria ni gráfico social. El foso real no es el prompt (replicable en una
semana) — es el **loop remix→registro→remix** y el **historial de viajes como dato de
personalización** que ninguna otra app tiene.

### 1.2 La economía: por qué la distribución importa más que el producto

*(Fuente: BUSINESS_ANALYSIS.md)*

- Coste real por itinerario generado: **~0,025 €** (Claude Haiku 4.5, $1/M in, $5/M out).
  Margen de contribución por suscriptor Viajero: **~92%**.
- Break-even operativo: **7-8 suscriptores de pago**. Es casi imposible morir por caja;
  muy posible morir por silencio (falta de tráfico).
- **No se pueden comprar usuarios rentablemente**: LTV Viajero ≈ 23 € (mensual) / 55-75 €
  (anual) vs CAC pagado de Google/Meta Ads de 130-750 €. Con estos números, **cada euro en
  ads destruye valor**. El crecimiento tiene que ser orgánico/viral — de ahí que este
  documento entero sea sobre contenido, SEO y producto viral, no sobre paid.
- La palanca dominante no es más usuarios ni más precio: es **churn**. Pasar de 22% a 12%
  de churn mensual (vía plan anual por defecto) multiplica el MRR en régimen ×1,83 — más
  que cualquier otra palanca.
- El cambio de modelo de mayor impacto: **Pase de Viaje de pago único (4,99 €)** para
  capturar al 97% de usuarios que nunca se suscribirían a una recurrencia por un
  comportamiento episódico (1-3 viajes/año). *(Este Pase ya está implementado en producto —
  ver §1.3.)*

### 1.3 Estado actual del producto (qué ya está construido)

*(Fuente: IMPLEMENTATION_REPORT.md 2026-07-12, cruzado con los hallazgos de
SOCIAL_STRATEGY.md/GROWTH_REPORT.md 2026-07-04 — varios de los "bloqueadores" que esos
informes señalaban como rotos ya están arreglados en código a fecha de hoy.)*

**Loop viral — ya en producto:**
- ✅ Atribución de referidos (`?ref=` + `utm_source`) capturada y persistida (`referred_by`,
  `acquisition_source` en `profiles`). Programa "invita a 3 amigos → 1 mes Viajero gratis"
  funcionando con RPC atómica.
- ✅ Banner de referidos en el dashboard con barra de progreso 0/3 y link copiable.
- ✅ `og:image` dinámico y branded por itinerario (`/api/og/$slug`, satori + resvg): cada
  link compartido en WhatsApp/Twitter muestra foto del destino + marca + nº de días + CTA,
  no una foto anónima de Unsplash.
- ✅ Notificación por email al autor cuando su itinerario público supera 10/50/100 vistas.
- ✅ Botón Remix reforzado en la página pública (barra sticky inferior en scroll).
- ✅ Demo pública sin registro (`/demo`) — el mayor gap que señalaba GROWTH_REPORT.md
  ("generar antes de registrar") **ya existe**: onboarding de 3 pasos, generación real,
  día 1 completo visible, resto bloqueado tras `AuthModal`, claim automático al registrarse.
- ✅ Póster SVG del viaje (silueta del país + ruta) remontado en el `ShareDialog` para
  Instagram.

**SEO — ya en producto:**
- ✅ 35 landings de destino en `/viajes/*` (los 5 originales de GROWTH_REPORT.md + 30 más
  añadidas en el growth sprint del 12 de julio — ver §5) con FAQ schema, TouristTrip
  schema, sitemap dinámico.

**Monetización — ya en producto:**
- ✅ Pase de Viaje 4,99 € (pago único) implementado y visible como tarjeta destacada en el
  paywall al chocar con el límite del plan free — no como texto de error genérico.
- ✅ Email de conversión 24h antes de expirar el trial de 7 días.
- ✅ Plan anual como default visual en pricing (antes: toggle escondía el ahorro).

**Lo que sigue pendiente o solo documentado (no implementado en código):**
- ⚠️ Asset real de Stories 1080×1920 (hoy "Copiar para Stories" solo copia un link).
- ⚠️ Contador de vistas visible en la página pública para el visitante (sí se usa para
  notificar al autor, no se muestra como prueba social al lector).
- ⚠️ Instrumentación de embudo completa (PostHog/Plausible) — sin esto, casi todo el §7 de
  métricas no se puede medir todavía.
- ⚠️ Afiliación de reservas (GetYourGuide/Booking) en las actividades del itinerario.
- ⚠️ Votación de actividades en tripmates.
- ⚠️ Bug de negocio sin confirmar arreglo: límite de 15 itinerarios del plan Viajero es
  "de por vida" en vez de mensual en el código auditado el 04/07 — verificar antes de
  escalar tráfico de pago.
- ⚠️ Key de producción de Unsplash (sigue en tier demo, 50 req/hora — cuello de botella en
  cualquier pico de tráfico).
- ⚠️ Migración de seguridad de lifecycle emails aplicada en prod (`lifecycle_email_log`) —
  sin ella, toda la secuencia de 9 emails de retención falla silenciosamente.

### 1.4 El objetivo: 0 → 10.000 usuarios

*(Fuente: GROWTH_HACK.md 2026-07-12 + GROWTH_90_DAYS.md 2026-07-04, reconciliados)*

Dos horizontes conviven en los informes fuente y no se contradicen — son el mismo plan a
distinta escala de ambición/tiempo:

- **GROWTH_90_DAYS.md**: objetivo conservador y detallado, **1.000 usuarios activados en 90
  días**, con presupuesto de fuentes que suma 750-1.100.
- **GROWTH_HACK.md**: objetivo agresivo a 8 semanas con el mismo motor, **10.000 usuarios**,
  apoyado en que ahora el producto tiene más piezas construidas (demo, SEO 35 destinos,
  loop viral cerrado) de las que tenía GROWTH_90_DAYS cuando se escribió.

**North Star métrica (consenso de todos los informes): usuarios registrados con ≥1
itinerario generado ("activados").** No registros en bruto.

**Por qué el plan es este y no otro:**
1. El producto ya tiene 3 loops integrados — no hay que inventar canales, hay que
   alimentarlos: compartir (ShareDialog+UTM+ref → página pública → Remix), referidos (3
   amigos = 1 mes gratis) y SEO (35 landings de destino).
2. La demo es la moneda de todos los canales: todo contenido termina en `/demo`, no en la
   home.
3. Artefactos > argumentos: postales, póster de ruta y boarding pass son contenido nativo
   de Instagram/TikTok que el producto fabrica solo.
4. Presupuesto asumido: ~0€ en ads (ver §1.2 — pagar tráfico destruye valor con estos
   números de LTV/CAC). Crecimiento 100% orgánico/viral/SEO.

---

## 2. El plan de 90 días

*(Fuente primaria: GROWTH_90_DAYS.md 2026-07-04. Se anota entre `[→ hecho]` cada acción que
el estado actual del producto — §1.3 — ya cubre, para no repetir trabajo.)*

### Fase 0 — Fundaciones (Días 1-7)

**Objetivo: poder medir y no romperse.**

- D1: Instrumentar embudo (`landing_view → demo_start → demo_result → signup → claim →
  trip_generated → share`). **Sigue pendiente — es el bloqueador nº1 de todo el plan de
  medición (§7).**
- D1: Renovar `ANTHROPIC_API_KEY` local si hace falta, smoke-test `/demo` en prod.
  `[→ hecho: /demo ya existe y está en producción]`
- D2: Migración de seguridad pendiente + price IDs a env vars — verificar estado actual
  (auditorías de seguridad posteriores pueden haber cambiado esto).
- D3: OG/meta por idioma. `[→ hecho parcialmente: og:image dinámico ya implementado;
  verificar que varía copy por idioma]`
- D4: Key de producción de Unsplash. **Sigue pendiente.**
- D5-6: Grabar el GIF/vídeo de la demo (sirve para PH, TikTok, X, todo).
- D7: Revisión del embudo con 10 usuarios reales.

**KPI de salida de fase:** embudo medible extremo a extremo; demo estable en prod.

### Fase 1 — Lanzamiento (Días 8-21)

**Objetivo: 250 activados.**

- D9 (martes/miércoles): **Product Hunt** — plan completo en §4.
- D10: Resaca de PH — responder todo, email a signups sin viaje generado.
- D11-12: Segunda ola de canales — Hacker News (Show HN, ángulo técnico: "structured
  outputs + reglas geográficas, no un wrapper"), Indie Hackers, 20 directorios
  (betalist/alternativeto/tools) en batch.
- D13-21 (diario, 30 min): **"Roast my itinerary"** — publicar 1 itinerario generado en el
  subreddit/grupo del destino pidiendo a locales que lo corrijan. Funciona triple:
  feedback del prompt, contenido, y locales que se registran para "ganarle a la IA".
- D14 y D21: changelog + 3 mejores viajes públicos de la semana a toda la base.

**KPI:** 250 activados, demo→signup ≥20%, K observado del ShareDialog (>0,15 = loop real).

### Fase 2 — Loops de contenido (Días 22-50)

**Objetivo: 550 activados acumulados. Encontrar EL canal — 3 apuestas en paralelo, matar
2 en el día 50.**

**Apuesta A — TikTok/Reels/Shorts (es+en).** 1 vídeo/día, 3 formatos rotando: (1) demo
screen-recording ("Planifiqué 3 días en X en 30 segundos"), (2) póster de ruta animado con
zoom, (3) "IA vs guía local" con duelo real. Link de bio siempre a `/demo`. Guiones listos
en §3.

**Apuesta B — SEO programático.** Auditar indexación en Search Console de las 35 landings
`/viajes/*` (ya existen — ver §5), interlinking desde la landing, sitemap ok. 2
páginas/semana adicionales. No da fruto hasta D60+; se siembra ahora.

**Apuesta C — Comunidad/afiliación micro.** 10 micro-creadores de viajes (5-50K, es/en):
mes de Explorador gratis + código para su audiencia. 2 newsletter swaps/semana.

**Cada viernes:** revisar el dashboard — CAC en tiempo por canal, demo→signup por canal.
**D50: matar las 2 apuestas peores.**

Producto al servicio del growth (1 mejora/semana):
- D25: watermark "itineraya.com" en postales y póster.
- D32: página pública — bloque "Remix este viaje" más prominente. `[→ hecho: barra sticky
  de Remix ya implementada]`
- D39: email D+3 post-signup con el póster listo.
- D46: onboarding de referidos visible en dashboard tras el 1er viaje. `[→ hecho: banner de
  referidos con barra 0/3 ya en el dashboard]`

### Fase 3 — Doblar lo que funciona (Días 51-90)

**Objetivo: 1.000 activados acumulados** (o el equivalente escalado si se sigue el
objetivo agresivo de 10.000 de GROWTH_HACK.md — mismo mecanismo, más intensidad).

- D51-60: todo el tiempo de growth al canal ganador de la Fase 2.
- D60: post "1.000 demos generadas: qué pide la gente" (data-driven, destinos top,
  duración media, % parejas vs amigos) — rebota en X/LinkedIn y prensa pequeña.
- D65: experimento de pricing — Trip Pass 4,99€ visible en la demo para no-registrados.
  `[→ ya implementado como paywall en el límite; verificar si también se ofrece
  proactivamente en la demo antes del límite]`
- D70: segundo lanzamiento — "Itineraya 2.0" en HN/IH con la feature más pedida.
- D75-90: preparar temporada (el 90% del volumen de "itinerario + destino" se busca 4-8
  semanas antes de vacaciones) — contenido de puentes/escapadas o verano según la fecha.

### Presupuesto de métricas (sanity check del objetivo de 1.000)

| Fuente | Activados estimados |
|---|---|
| Product Hunt + resaca (Fase 1) | 200-350 |
| Canal ganador Fase 2-3 (60 días × ~8/día) | 400-500 |
| SEO programático (cola desde D60) | 50-120 |
| Referidos + Remix loop (K≈0,15 sobre el resto) | 100-150 |
| **Total** | **750-1.100** ✅ |

### Cadencia operativa

- **Diario (30-60 min):** 1 pieza de contenido, responder todo (Reddit/X/soporte), mirar
  los 5 números del embudo.
- **Semanal (viernes):** revisión de canales, 1 mejora de producto-para-growth, newsletter.
- **Mensual:** post público con números (build in public compone: cada post es un
  mini-lanzamiento).

### Señales de alarma y respuesta

| Señal | Umbral | Acción |
|---|---|---|
| Demo→signup bajo | <12% sostenido | El bloqueo de días 2+ no motiva: probar bloquear también tarde del día 1, o regalar el póster al registrarse |
| Signup→claim roto | <80% | Bug en el claim del dashboard — revisar logs de insert |
| Demos altas, retorno nulo | D7 retention <10% | Producto single-use: empujar copiloto/asistente y emails de próximo viaje |
| Coste de demo dispara | >30€/día | Bajar `GLOBAL_DAILY` / días máx. a 3; considerar captcha ligero |

---

## 3. Contenido listo para publicar

### 3.1 TikTok — 5 guiones completos, listos para grabar hoy

*(Fuente: GROWTH_HACK.md 2026-07-12 — reflejan el producto actual con `/demo` incluida.
Formato: vertical, 25-40s, screen recording + subtítulos siempre.)*

**#1 — "La IA me planeó Roma en 40 segundos"**
- Gancho (0-3s, cara a cámara): *"Le pedí a una IA que me planeara 4 días en Roma mientras
  me hacía el café. Mira esto."*
- Cuerpo (3-30s): screen recording real en `/demo` — destino, fechas, presupuesto, generar
  → time-lapse → scroll por el itinerario (horarios, transporte "🚇 Metro L4, 12 min",
  mapa, tip local).
- Remate (30-38s): zoom al mapa — *"Hasta me dice cuánto se tarda andando entre sitios. Y
  esto es la versión gratis."*
- CTA: *"Se llama Itineraya, link en la bio. La demo no pide ni registro."*
- Hashtags: `#viajar #itinerario #roma #viajarbarato #inteligenciaartificial #travelhack #viajeros`

**#2 — "Cuánto cuesta REALMENTE una semana en Bali"**
- Gancho: texto en pantalla *"POV: dices que Bali es caro sin haberlo mirado"*
- Cuerpo: generar itinerario de Bali 7 días con presupuesto medio → desglose día a día →
  pausa dramática en precios de villas.
- Remate: *"50-90 € al día EN PAREJA con villa con piscina. Más barato que tu agosto en la
  costa."*
- CTA: *"Genera el tuyo gratis con tu presupuesto real — link en bio."*
- Hashtags: `#bali #viajarbarato #presupuestoviaje #indonesia #lunademiel #viajes2026`
- Nota: réplica con cualquiera de los 35 destinos de `/viajes/*` — es una serie, no un vídeo.

**#3 — "Mi novia me dejó planear el viaje"**
- Gancho: *"Mi novia me dio UNA tarea: planear el viaje a París. Esto fue lo que hice."*
- Cuerpo: 5s fingiendo estrés con 40 pestañas → corte → la app generando → resultado con
  cara de héroe.
- Remate: *"Le dije que me llevó todo el finde. Me llevó 40 segundos. No se lo digáis."*
- CTA: *"Itineraya. Gratis. Vuestro secreto está a salvo."*
- Hashtags: `#parejas #paris #viajeenpareja #humor #planesenpareja #viajar`

**#4 — "Tu itinerario tiene un contador de vistas"**
- Gancho: *"¿Sabías que puedes publicar tu itinerario y ver cuánta gente lo copia?"*
- Cuerpo: itinerario propio publicado → contador subiendo → el email de "superó 50
  visitas" → alguien haciendo Remix.
- Remate: *"Es como Strava pero para viajes. Mi ruta de Lisboa ya la han usado 87
  personas."*
- CTA: *"Publica el tuyo y me cuentas. Link en bio."*
- Hashtags: `#viajeros #lisboa #travelcommunity #itinerario #comparte`
- Grabar cuando haya itinerarios propios con vistas reales.

**#5 — "3 errores al planear Tokio (y cómo los evita una IA)"**
- Gancho: *"Si vas a Tokio y haces esto, vas a perder medio viaje en el metro."*
- Cuerpo: error 1 (cruzar la ciudad 2 veces/día — la app agrupa por barrios), error 2
  (no reservar teamLab/Ghibli — la app lo avisa), error 3 (JR Pass solo para Tokio — tip de
  la landing).
- Remate: *"La IA agrupa por zonas conectadas por la Yamanote. Sola."*
- CTA → apunta a `itineraya.com/viajes/tokio` (mide con `utm_source=tiktok`).
- Hashtags: `#tokio #japon #jrpass #erroresdeviaje #consejoviaje #asia`

### 3.2 TikTok — 10 guiones adicionales palabra por palabra (banco ampliado)

*(Fuente: SOCIAL_STRATEGY.md 2026-07-04 — set más extenso, útil para no quedarse sin
material tras los primeros 5. Formato: español de España, corte cada 1,5-2,5s.)*

Los guiones completos, plano a plano, están en `SOCIAL_STRATEGY.md` sección 1.2 (10
guiones: *"Le pedí a una IA…Bali"*, *"Agencia 80€ vs gratis"*, *"POV la organizada del
grupo"*, *"Cronómetro Tokio"*, *"Cosas que la IA sabe de Barcelona"*, *"Robé el itinerario
de un desconocido (Remix)"*, *"Viaje sorpresa con Inspire"*, *"Fui al viaje que planificó
la IA — IRL día 1"*, *"3 errores en París"*, *"Le enseñé a mi madre"*). No se duplican aquí
por espacio — usar como banco cuando se agote el material de §3.1. Además incluye:
- **30 ideas de vídeo priorizadas** (Tier S/A/B) más allá de los 10 con guion completo.
- **Guía de trends/audios**: regla 70/20/10 (formatos propios / trends adaptados /
  experimentos), dónde detectar trends (TikTok Creative Center, filtrar España), plantillas
  trend→producto.
- **Hashtags por categoría**: viajes (`#viajes #viajerosporelmundo #itinerario`), tech-IA
  (`#ia #appsutiles #iaparaviajar`), lifestyle/estacional (`#planesconamigas
  #puente[mes]`), marca propia (`#itineraya` en todos desde el día 1).
- **Horarios**: España 13:00-15:00 y 20:00-23:00; domingo 18:00-22:00 es EL momento de
  planificación semanal. Frecuencia: 1/día semanas 1-2, 4-5/semana desde semana 3, nunca
  menos de 3/semana.

### 3.3 Instagram — 5 carruseles listos + banco de 20 reels

**5 carruseles (fuente: GROWTH_HACK.md 2026-07-12, formato 6-8 slides, copy completo):**

1. **"Roma en 4 días, día a día"** — 7 slides con el itinerario de `/viajes/roma` slide a
   slide (Coliseo día 1, Vaticano día 2, Roma barroca día 3, Trastevere día 4), slide 6
   "el error nº1: no reservar", slide final CTA a `itineraya.com/viajes/roma`.
2. **"5 destinos donde tu sueldo vale el doble"** — Bangkok, Marrakech, Budapest, Ciudad de
   México, Granada con coste real/día. CTA: "dile tu presupuesto exacto a Itineraya".
3. **"Cómo planear un viaje en 2026 (método de 4 pasos)"** — antes (6h de blogs) vs después
   (40s), los 4 pasos del producto. CTA a `/demo`.
4. **"Santorini sin arruinarte"** — el ángulo del atardecer "gratis" en Imerovigli vs el
   "famoso" en Oia, hospedaje alternativo. CTA a `/viajes/santorini`.
5. **"Tu itinerario también puede ser famoso"** — explica el loop viral (página pública,
   contador de vistas, remix, referidos) como pitch narrativo. CTA a la home.

**Banco de 20 reels + 8 carruseles adicionales (fuente: SOCIAL_STRATEGY.md 2026-07-04):**
guiones completos en la sección 2.2 (Reels 9-20: *"Guarda esto para tu viaje a Roma"*,
*"Aesthetic planificando mi viaje de otoño"*, *"Cosas que ya no hago desde que existe la
IA"*, *"Rating de viajes de la comunidad"*, *"El itinerario según tu vibe"*, *"Lo que 8€/mes
me ahorran"*, *"Antes/después del grupo de WhatsApp"*, *"Viajar sola: mi sistema"*, *"Los 5
destinos más generados este mes"*, *"De idea a viaje en 4 pasos"*, *"Reacciono al PEOR
itinerario posible"*, *"Un año de viajes por 96€"*) y 8 carruseles en la sección 2.3
(reciclando contenido SEO de destinos: París, Tokio, Bali + "7 errores universales" +
"cómo usar la IA para viajar" + "los 10 itinerarios más vistos" + "escapadas desde
Madrid/Barcelona"). Plan semana a semana del mes 1 (feed + reels + stories día por día) en
la sección 2.1 del mismo documento.

**Anatomía del carrusel que se guarda** (regla transversal, SOCIAL_STRATEGY.md 2.3): slide
1 = titular + beneficio + número, sin logo grande; slides 2-8 = 1 idea/slide, ≤30
palabras, dato concreto; penúltimo slide = "momento producto"; último = CTA doble
("guárdalo" + "mándaselo a quien viaja contigo").

### 3.4 Reddit y losviajeros.com — 10 posts listos

*(Fuente: GROWTH_HACK.md 2026-07-12. Regla de oro: ratio 10:1 aportes-genuinos por mención
del producto; nunca "mirad mi app" — el post es valor, la app se menciona solo si preguntan
o al final.)*

1. **r/travel** — *"I built a day-by-day Rome itinerary optimized to avoid queues — tear it
   apart"* → itinerario de `/viajes/roma` traducido, pide crítica.
2. **r/JapanTravel** — *"7 days in Tokyo grouped by Yamanote-line neighborhoods — did I get
   the logistics right?"* → itinerario de `/viajes/tokio` adaptado.
3. **r/solotravel** — *"Planning tools comparison: ChatGPT vs dedicated AI trip planners for
   a 10-day Bali trip"* → comparativa honesta, incluye debilidades de Itineraya.
4. **r/travelhacks** — *"The 'group trips by neighborhood' rule cut my walking time in
   half"* → método real del prompt (actividades consecutivas ≤1,2km).
5. **r/spain** — *"Hice una guía de Madrid de 3 días para amigos que me visitan"* →
   contenido de `/viajes/madrid` en tono local.
6. **losviajeros.com, foro Italia** — responder 2-3 hilos activos "Roma en 4 días" con el
   itinerario completo + *"lo generé con una IA y lo ajusté; si queréis el link os lo paso
   por MP"* (evita el filtro anti-spam).
7. **losviajeros.com, foro Japón** — mismo patrón con Tokio (destino estrella del foro).
8. **losviajeros.com, foro América del Sur** — *"Cusco y Machu Picchu: el orden correcto
   para no morir del soroche"* → contenido de `/viajes/cusco`, ángulo salud/altitud.
9. **r/PeruTravel / r/MachuPicchu** — versión EN del anterior (circuit tickets y
   aclimatación son las preguntas nº1 del sub).
10. **r/InternetIsBeautiful** — *"A trip planner where every itinerary becomes a public page
    anyone can remix"* → promo directa (el sub existe para eso). Hacerlo en semana 3-4, no
    el día 1, y solo si la demo va fina.

**Banco ampliado de comunidades y mensajes específicos** (30 comunidades con plantillas por
tipo, y 20 comunidades adicionales con mensaje ya redactado por cada una) — ver §6.

### 3.5 Outreach a microinfluencers — sistema completo

*(Fuente: GROWTH_HACK.md 2026-07-12, complementado con el marco más detallado de
SOCIAL_STRATEGY.md 2026-07-04, secciones 2.4-2.6.)*

**A quién buscar:** 10.000-80.000 seguidores (por debajo no compensa gestión, por encima
piden presupuesto y pierden engagement), engagement rate >4%, español de España o
afincados, contenido de "cómo organizar/qué ver" (planners, no posers). Señal de compra
clave: que ya respondan dudas de logística en comentarios.

**Cómo construir la lista en 2-3h** (SOCIAL_STRATEGY.md 2.4): hashtags
`#viajerosespañoles #viajarporelmundo #escapadasconencanto`, mirar a quién comentan/con
quién colaboran las cuentas grandes, buscar en TikTok "itinerario [destino]" (los que ya
hacen contenido de itinerarios son prioridad absoluta — el producto les ahorra su propio
trabajo), grupos de Facebook de viajes. Google Sheet: handle, seguidores, ER%, nicho,
email, fecha de contacto, estado.

**Escalera de oferta de 3 niveles** (SOCIAL_STRATEGY.md 2.4):
- Nivel 1 (coste 0): plan Explorador gratis 6 meses + itinerario destacado en tu cuenta +
  link con su `ref`.
- Nivel 2 (50-150€/reel): para los 5-10 mejores tras validar nivel 1, con derechos de
  repost.
- Nivel 3 (afiliación): 30% de la primera suscripción de cada usuario que traigan.

**Mensaje 1 — DM inicial** (GROWTH_HACK.md, personalizar cada envío):

> Hola [nombre] 👋 Soy Iván, fundador de Itineraya (IA que genera itinerarios día a día con
> mapa y horarios reales). Vi tu vídeo de [destino concreto] y pensé que esto te iba a
> molar: te he generado un itinerario de [ese destino] con la app → [link /trip/... ya
> generado]. Sin compromiso: si te parece útil para tu audiencia, te monto acceso
> Explorador gratis 6 meses + un código para sortear entre tus seguidores.

**Mensaje 2 — follow-up** (a los 4-5 días, solo uno, con el link público generado para SU
destino — "no le pides nada, le enseñas el producto funcionando con SU destino").

**Mensaje 3 — propuesta concreta** (si responde con interés): 1 vídeo/reel enseñando cómo
genera su próximo itinerario real, a cambio de 6 meses Explorador + código exclusivo con su
nombre + conversación de colaboración fija si funciona.

**Colaboraciones de Instagram (co-authored posts)** (SOCIAL_STRATEGY.md 2.6): usar SIEMPRE
la función "Colaboración" (no mención) para que el post distribuya a ambas audiencias sumando
likes en un contador. Cadencia: 1 colab/semana desde semana 3. Colabs no-influencer:
cuentas de turismo local/hostels ("48h en su ciudad"), apps de vuelos baratos/chollos
(audiencia 100% ICP), usuarios ganadores del reto UGC.

---

## 4. Product Hunt — plan completo de lanzamiento

*(Fuente primaria: PRODUCTHUNT_LAUNCH.md 2026-07-07, el documento dedicado más completo y
reciente. GROWTH_REPORT.md §4 y GROWTH_HACK.md §5 cubren lo mismo con menos detalle —
no se repite, solo se añaden sus aportes específicos.)*

### 4.1 La idea central

PH está saturado de "AI travel planners". Itineraya no compite como chatbot: compite como
*artefacto*. Todo el lanzamiento gira sobre una demostración, no una descripción — **el
visitante genera su propio itinerario en 30 segundos sin registrarse** (`itineraya.com/demo`,
ya en producción). El upvote sale de haberlo probado, no de haberlo leído.

### 4.2 Posicionamiento

- **Tagline (EN, ≤60 chars):** `Real day-by-day travel plans — not a chat, a boarding pass`
  — alternativas: `Your trip, planned like a local — map, schedule, boarding pass` /
  `Stop asking ChatGPT for itineraries. Get one that exists.`
- **Descripción corta:** Tell Itineraya where and when. Get a day-by-day plan with real
  venues, transit times between stops, weather-aware scheduling, an interactive route map,
  downloadable postcards and a trip poster made for Instagram. Try it free, no signup.
- **Categorías:** Travel, Artificial Intelligence, Web App.
- **Anti-posicionamiento explícito** (para el primer comentario): *"We built this because
  ChatGPT itineraries are paragraphs. A trip is not a paragraph — it's a route, a schedule,
  and things you can share."*

### 4.3 Assets a preparar (T-7 días)

| Asset | Detalle |
|---|---|
| Galería 1 | GIF ≤3MB, ≤10s: wizard demo → generación con etapas → itinerario con mapa |
| Galería 2 | Screenshot del itinerario: día con foto, horarios, transporte, tip 💎 |
| Galería 3 | **Póster del viaje** (silueta del país + ruta) — el asset más diferencial |
| Galería 4 | Boarding pass + panel de salidas (temática aeropuerto = identidad) |
| Galería 5 | Mapa interactivo con pins por categoría |
| Vídeo (opcional, sube conversión) | 45s screen-recording con música, sin voz, sin acelerar |
| Logo | 240×240, mark actual sobre fondo sky-950 |

**Checklist técnico previo:** OG tags dinámicos (✅ ya implementado, ver §1.3), `/demo`
smoke-test en prod, subir `GLOBAL_DAILY` en `demo.functions.ts` para el día D, key de
producción de Unsplash (⚠️ pendiente), Google Cloud Console / migraciones de seguridad al
día.

### 4.4 Calendario

- **T-14 → T-7:** página "Coming soon" en PH acumulando followers. Reclutar 15-25 personas
  de confianza en distintos husos horarios (nunca un pico artificial — PH lo penaliza);
  pedir que voten *cuando lo prueben de verdad*, no al DM.
- **T-1:** congelar deploy. Smoke test completo: landing → demo → signup → claim → póster.
  Preparar respuestas enlatadas (§4.6) y el primer comentario.
- **Día D — martes o miércoles, 00:01 PT (09:01 CET):** lanzar a las 00:01 PT para 24h
  completas. 00:05 PT: primer comentario del maker. Mañana europea: aprovechar que el
  equipo está despierto mientras EEUU duerme. Compartir en X/LinkedIn personal (nunca link
  directo de "vote for us"). Tarde CET/mañana US: segunda ola por comunidades (§4.5),
  responder TODO en <30 min. Turnos toda la noche.
- **D+1 → D+7:** email a signups del día D sin viaje generado. Badge de PH en la landing si
  top 5. Post-mortem con números.

### 4.5 Distribución del día D (sin spamear)

- **Reddit:** r/travel y r/solotravel prohíben autopromo directa → usar r/SideProject,
  r/InternetIsBeautiful, r/artificial con tono maker ("I made a free tool… no signup").
- **X/Twitter:** hilo del maker con GIF de la demo + póster. Etiquetar build-in-public.
- **LinkedIn:** post personal (historia del problema, no del producto).
- **Comunidades ES:** Indie Hackers en español, Discord/Slack de makers, ProductHackers. El
  ángulo "hecho en España, lanzado global" funciona.
- **Newsletter swaps:** 2-3 newsletters de viajes o IA pequeñas (código Explorador 1 mes).

### 4.6 Primer comentario del maker (listo para copiar/pegar y personalizar)

> Hi PH 👋 I'm Iván, maker of Itineraya.
>
> Every AI travel tool I tried gave me the same thing: a wall of text. But a trip isn't
> text — it's *"can I walk from the Alcázar to lunch, and what should I order when I get
> there?"*
>
> So Itineraya generates **plans, not paragraphs**: each day sticks to one neighborhood,
> every stop has a time and the transit to the next one, meals name the dish to order, and
> the whole trip becomes an interactive map, downloadable postcards and a poster of your
> route.
>
> **You can try it without signing up** — the demo generates a real itinerary in ~30
> seconds: [itineraya.com/demo]
>
> Stack for the curious: React + TanStack Start, Supabase, Claude Haiku with structured
> outputs, Stripe. Ask me anything — especially if an itinerary gets something wrong about
> your city, I want to know 😄

### 4.7 Objeciones esperadas y respuestas enlatadas

| Comentario | Respuesta |
|---|---|
| "It's a ChatGPT wrapper" | "Fair question — the LLM is ~30% of it. The other 70%: geographic day-clustering rules, transit-time validation, weather/season constraints, structured outputs into a map + schedule + shareable artifacts. Try asking ChatGPT for a route poster of your trip 😉" |
| "Recommendations are wrong/hallucinated" | "The prompt forbids naming venues it isn't confident exist, and every stop links to Google Maps to verify. If you found a bad one, tell me the city — that's gold for us." |
| "Why pay vs free ChatGPT" | "Free plan gives you 2 full trips. You pay for the AI editor and unlimited plans — €4.99 one-off Trip Pass if you hate subscriptions." |
| "GDPR / mis datos" | "EU-hosted (Vercel CDG1/Paris + Supabase EU), demo runs without an account, cookie consent up front." |
| Petición de features | "Adding it to the public roadmap — upvoted." (tener un board público listo) |

### 4.8 Estrategia de upvotes (sin comprar votos — penaliza)

1. Activarse en PH la semana antes: comentar con sustancia en 10-15 lanzamientos, seguir
   makers (cuentas nuevas que solo votan el día D pesan menos en el algoritmo).
2. Lista D-Day de 50 personas por categorías: 15 amigos/conocidos con cuenta PH previa
   (creada con antelación), 10 usuarios beta, 10 makers de comunidades indie con los que ya
   se ha interactuado, 8 contactos travel-tech en LinkedIn, 7 microinfluencers que
   respondieron al outreach (§3.5). Mensaje escalonado (10 a las 09:00, 10 a las 12:00,
   resto por la tarde) — un pico a primera hora seguido de silencio es señal de
   manipulación.
3. Hunter: no imprescindible en 2026; si acaso, uno de la categoría travel con followers
   reales.

### 4.9 Objetivos y medición

| Métrica | Mínimo viable | Bueno | Excelente |
|---|---|---|---|
| Posición del día | Top 10 | Top 5 | #1-3 |
| Visitas día D | 3.000 | 8.000 | 20.000 |
| Demos generadas | 400 | 1.500 | 4.000 |
| Demo → signup | 15% | 25% | 35% |
| Signups día D | 60 | 375 | 1.400 |

Instrumentación previa obligatoria: eventos `demo_start`, `demo_result`,
`signup_from_demo`, `demo_claimed`. **Sin embudo medido, el lanzamiento no enseña nada**
(ver §7).

### 4.10 Riesgos del día D

- **Coste/abuso de la demo:** subir `GLOBAL_DAILY` pero vigilar el dashboard de Anthropic
  (Haiku a 4 días ≈ céntimos por demo). Mover el límite a env var antes del día D.
- **Unsplash 403 por cuota** (50 req/h en key demo): pedir producción antes del
  lanzamiento — sigue pendiente (§1.3).
- **Pico de Supabase auth:** el plan free aguanta; revisar rate limits de signup email.
- **Caída de Google Maps:** irrelevante — Leaflet toma el control automáticamente
  (verificado en código).

---

## 5. SEO — keywords, landings, estrategia

*(Fuente: GROWTH_REPORT.md §2, 2026-07-04, actualizado con el estado real de
IMPLEMENTATION_REPORT.md 2026-07-12 — las 5 landings originales ya son 35.)*

### 5.1 Estado actual

**35 landings en `/viajes/*` ya en producción** (5 originales de julio + 30 añadidas en el
growth sprint del 12 de julio: Roma, Londres, Lisboa, Ámsterdam, Praga, Budapest, Viena,
Berlín, Estambul, Atenas, Santorini, Dublín, Edimburgo, Oporto, Florencia, Venecia, Madrid,
Sevilla, Granada, Valencia, Mallorca, Tenerife, Marrakech, Bangkok, Dubái,
Cancún/Riviera Maya, Ciudad de México, Buenos Aires, Cusco/Machu Picchu, Río de Janeiro —
además de París, Tokio, Nueva York, Barcelona, Bali). Cada una con FAQ schema (JSON-LD
FAQPage), TouristTrip schema, BreadcrumbList, canonical y OG tags. Sitemap dinámico
generado automáticamente incluyendo destinos + viajes públicos de usuarios.

### 5.2 Arquitectura SEO

```
/viajes/[destino]           ← landing SEO por destino (ES) — 35 activas
/explore                    ← feed UGC indexable (ya existe)
/trip/[slug]                ← itinerarios reales de usuarios (UGC indexable, en sitemap)
/en/travel/[destination]    ← versión EN + hreflang — NO implementada, pendiente de decisión de producto
```

Cada landing enlaza a 6-8 itinerarios reales del feed de ese destino cuando existan
(interlinking).

### 5.3 50 keywords con intención (español) — banco de referencia

*(Priorizar las de intención "herramienta" — competencia son blogs sin producto, no otras
apps.)*

| Prioridad | Keywords |
|---|---|
| **Alta (transaccional + marca)** | itinerario parís 4 días · itinerario tokio 7 días · itinerario nueva york 5 días · itinerario barcelona 3 días · itinerario bali 10 días · planificador de viajes con ia · crear itinerario de viaje gratis · app para planificar viajes · ia para planificar viajes · app itinerario de viaje gratis · organizar viaje en grupo app · chatgpt para planificar viajes · alternativas a wanderlog en español |
| **Media (transaccional destino)** | itinerario roma 3 días · itinerario londres 4 días · itinerario japón 14 días · itinerario portugal 7 días · itinerario méxico 10 días · itinerario budapest 3 días · itinerario praga 3 días · itinerario egipto 8 días · itinerario croacia 7 días · itinerario tailandia 15 días · ruta por andalucía 7 días · viaje a marruecos 5 días ruta · itinerario vietnam 12 días · itinerario costa amalfitana 4 días · itinerario islandia 7 días · itinerario grecia islas 10 días · plantilla itinerario de viaje |
| **Informacional (top-of-funnel, alimenta a las anteriores)** | qué ver en parís en 3 días · qué ver en tokio en una semana · qué ver en lisboa en 3 días · qué ver en ámsterdam 2 días · qué ver en barcelona 2 días · qué ver en estambul 3 días · presupuesto viaje a japón · mejor época para viajar a bali · dónde viajar en octubre · dónde viajar barato en europa |
| **Nicho/estacional** | luna de miel bali itinerario · itinerario disneyland paris 2 días · viajar sola por europa destinos · escapada fin de semana desde madrid · itinerario nueva york navidad |

Con las 35 landings ya activas, la mayoría de las keywords transaccionales de la tabla ya
tienen página de destino directa; el trabajo restante es de **contenido informacional**
(comparativas, guías "qué ver en X días") e **indexación** (Search Console, interlinking).

### 5.4 Estructura de cada landing (ya aplicada en las 35 activas)

1. H1 con destino + nº de días + CTA "Genera tu itinerario personalizado gratis" (prefill
   del onboarding vía `?prefill=`).
2. Itinerario ejemplo día a día (curado, con horarios y sitios reales).
3. Bloque "Personalízalo" con chips que también van al prefill.
4. Datos prácticos: mejor época, presupuesto orientativo, cómo moverse.
5. Itinerarios reales de la comunidad para ese destino (del feed, cuando existan).
6. FAQ con schema (4-6 preguntas long-tail).
7. Enlaces a destinos relacionados.

### 5.5 Pendiente / próximos pasos SEO

- Auditar indexación real en Search Console de las 35 landings (Fase 2 del plan de 90
  días, §2).
- 2 páginas/semana adicionales de intención alta si el análisis de keywords lo justifica.
- Versión EN con hreflang — decisión de producto pendiente, no iniciada.
- Contenido informacional tipo "qué ver en X días" (formato blog/guía, no landing de
  producto) para capturar las keywords informacionales de la tabla que hoy no tienen
  página propia.

---

## 6. Comunidades — dónde estar y qué publicar

*(Fuente primaria: SOCIAL_STRATEGY.md Parte 4, 2026-07-04 — el marco más completo y
sistemático. GROWTH_REPORT.md §7 aporta 20 comunidades con mensaje específico ya redactado,
complementario, no duplicado.)*

### 6.1 Regla de oro (todas las comunidades)

Regla 9:1 — nueve aportes de valor puro por cada mención del producto. El link, cuando se
comparte, es siempre un itinerario concreto generado *para ese caso* (`/trip/<slug>`),
nunca la home. Cuenta personal siempre (nombre y cara), nunca cuenta de marca.

### 6.2 Las 30 comunidades (fuente: SOCIAL_STRATEGY.md 4.1)

**Reddit (7):** r/viajes (referencia ES, estricto con autopromo) · r/espanol · r/askspain ·
r/Mochileros · r/argentina + r/mexico + r/Colombia (megathreads) · r/travelhacks +
r/solotravel (EN, solo con versión pulida) · r/SideProject + r/webdev (ángulo build-in-public).

**Facebook Groups (10):** "Viajeros por el mundo" · "Mochileros por el mundo/España" ·
grupos por destino ("Viajar a Japón", "Viajar a Tailandia", "Viajar a Italia" — los que más
convierten, gente en fase activa) · "Viajes y escapadas España" · "Viajar barato/chollos
viajeros" · "Familias viajeras" · "Mujeres que viajan solas" · "Viajeros españoles por
[destino]".

**Foros (5):** **losviajeros.com** — el foro español de referencia, permite firma, la
comunidad más valiosa (la gente publica su borrador de itinerario pidiendo correcciones) ·
foro TripAdvisor ES · mundonomada · CharcoTrip (foros LatAm) · Forocoches subforo de viajes
(tono muy suyo, solo si se conoce bien).

**Discord/Telegram (4):** servidores "nómadas digitales" ES · Telegram de chollos
(Viajeros Piratas y satélites) · Discord tech españolas (MoureDev, midudev, canal
#proyectos) · Telegram por destino ("Españoles en Tokio/NY").

**Otros (4):** Menéame (/m/viajes) · Product Hunt (ver §4) · Indie Hackers + #buildinpublic
en X — no trae viajeros, trae amplificadores · comentarios de YouTube en vídeos "qué ver en
X días" — tráfico gratis de intención máxima si se responde con ayuda real.

### 6.3 Plantillas de mensaje por tipo de comunidad

**A) Foros de planificación (losviajeros, TripAdvisor, grupos por destino) — nunca te
presentes, responde:**

> ¡Hola! Te dejo cómo lo organizaría yo: [respuesta real de 5-10 líneas: agrupa por zonas,
> avisa de cierres, sugiere el orden]. Por cierto, yo para el esqueleto inicial uso una app
> de IA que estoy construyendo (Itineraya) — te generé la base y la retoqué a mano: [link
> `/trip/<slug>` generado PARA su caso]. Si te sirve, la personalizas gratis con tus fechas.

**B) Grupos de Facebook generalistas — preséntate con historia, no con producto:**

> ¡Hola grupo! 👋 Llevo tiempo leyendo por aquí (los hilos de [tema reciente real del
> grupo] me han salvado un par de veces). Soy desarrollador y viajero, y de la frustración
> de planificar mi viaje a [destino] con 40 pestañas abiertas monté una herramienta que
> genera el itinerario día a día con IA en un minuto. Es gratis. La comparto por si a
> alguien le sirve — y sobre todo: si la probáis, decidme qué falla. [link]

**C) Reddit — transparencia radical o baneo:**

> **[Hago yo] Una IA que te genera el itinerario de viaje día a día — gratis, busco
> feedback brutal.** Hola r/viajes. Full disclosure: es mi proyecto. Tras [historia
> personal de 2 líneas], monté Itineraya. Lo que me interesa de verdad: que la destrocéis.
> ¿Qué le falta? Genero en los comentarios el destino que me pidáis y juzgáis el resultado.

**D) Comunidades tech/build-in-public:**

> Semana 12 construyendo Itineraya (TanStack Start + Claude + Supabase). Esta semana:
> arreglé el loop de referidos y monté OG images dinámicas con satori. Números honestos:
> [X] registros, [Y]% comparten su itinerario. AMA / feedback bienvenido.

### 6.4 20 comunidades con mensaje específico ya redactado

*(Fuente: GROWTH_REPORT.md §7 — listo para copiar/pegar y ajustar el destino/enlace.)*

Incluye mensajes concretos ya escritos para: r/travel, r/solotravel, r/Shoestring,
r/JapanTravel, r/travelhacks, r/ArtificialIntelligence/r/ChatGPT, r/Europetravel (EN);
r/askspain, r/argentina+r/mexico, r/uruguay+r/chile (ES/LatAm); "Mochileros por el Mundo",
"Viajar por Europa Low Cost", "Viajeros por el Mundo (España)", "Viajando solas", grupos de
destino tipo "Viajar a Japón — consejos" (Facebook); losviajeros.com, foros TripAdvisor ES
(foros); Indie Hackers + PH discussions, Discord Nomad List, canales Telegram de chollos
(otros). Cada uno con el ángulo y el copy exacto adaptado a esa comunidad — ver
`GROWTH_REPORT.md` sección 7 para el texto completo de los 20.

### 6.5 Calendario de comunidades — mes 1

*(Fuente: SOCIAL_STRATEGY.md 4.3. Tiempo presupuestado: 45-60 min/día.)*

- **Semana 1 — solo escuchar y aportar, CERO links:** unirse a las 10-15 comunidades
  prioritarias. Responder 3-4 hilos/día con ayuda real sin mencionar Itineraya. Objetivo:
  historial y karma.
- **Semana 2 — valor con producto implícito:** cuando un hilo pida literalmente un
  itinerario, usar plantilla A. 2-3 links así por semana, máximo. Presentación tipo D en 2
  comunidades tech.
- **Semana 3 — presentaciones:** post tipo C en r/viajes (martes/miércoles mañana). Post
  tipo B en 2-3 grupos de FB que permitan autopromo.
- **Semana 4 — interactivo:** hilo "pedidme un destino y os genero el itinerario en
  comentarios" en el grupo/foro con mejor recepción — formato franquicia, barato, útil,
  demuestra el producto en directo.

### 6.6 Las 6 reglas para no parecer spam

1. Responde la pregunta completa aunque no menciones el producto — si la respuesta solo
   tiene valor con el link, es spam con decoración.
2. El link siempre es un itinerario concreto para el caso concreto, jamás la homepage.
3. Declara siempre que es tuyo — ocultarlo y que te pillen quema la comunidad para siempre.
4. Pide feedback, no usuarios — "decidme qué falla" invita a participar; "registraos" invita
   a ignorarte.
5. Vuelve a los hilos — un hilo atendido escala posiciones, uno abandonado marca como
   drive-by spammer.
6. Acepta el no — si un mod borra el post, pregunta las normas amablemente y no reincidas.

---

## 7. Métricas — qué medir y cuándo pivotar

*(Fuente: GROWTH_REPORT.md §9 + SOCIAL_STRATEGY.md Parte 6 + GROWTH_90_DAYS.md, unificados
— los tres informes coinciden en el marco, se combina sin duplicar.)*

### 7.1 Prerrequisito: instrumentación

**Nada de esto se puede medir hoy** — la instrumentación de embudo (recomendación:
PostHog, EU cloud por GDPR, autocapture off, eventos explícitos vía SDK en `__root.tsx` +
`posthog-node` en server functions) es la acción D1 del plan de 90 días (§2) y sigue
pendiente según el estado de producto (§1.3).

### 7.2 Los 10 KPIs y dónde instrumentarlos

| # | KPI | Definición | Dónde instrumentarlo |
|---|---|---|---|
| 1 | **Activación** | % registros que ven su 1er itinerario en 24h | Evento `itinerary_generated` + `signup` en `AuthModal` |
| 2 | **Time-to-value** | Minutos registro → 1er itinerario | Mismos eventos, propiedad timestamp |
| 3 | **Share rate** | % viajes generados que se comparten/publican | Eventos en `ShareDialog` (canal por botón) y `PublishToggle` |
| 4 | **K-factor** | Registros con `?ref`/UTM de share ÷ usuarios que compartieron | UTM en URLs de share + captura de `ref` en signup (ya implementado, §1.3) |
| 5 | **Conversión free→paid** | % free que pagan en 30 días | Evento `subscription_created` en el webhook de Stripe |
| 6 | **Retención D7/D30** | % usuarios activos a 7/30 días de registro | `$identify` + evento `session_start` |
| 7 | **Churn mensual** | Bajas ÷ suscriptores activos | Evento en webhook `customer.subscription.deleted` + dashboard Stripe |
| 8 | **Funnel del onboarding** | Drop-off por paso | Evento `onboarding_step` con `step` |
| 9 | **Coste IA por itinerario** | € Anthropic ÷ itinerarios generados | Log de tokens de la respuesta → tabla `generation_costs` |
| 10 | **Visitante público → registro** | % visitas a `/trip/$slug`·`/explore/$slug` que se registran | Evento `public_trip_viewed` + `signup` con `referrer_slug` |

**North Star:** itinerarios generados por semana — correlaciona con valor, sharing y
revenue.

### 7.3 Panel semanal (30 min cada domingo)

**TikTok:** vistas totales y mediana por vídeo (la mediana da el suelo real). Retención al
50% (<35% = formato roto, >50% = doblar). Shares y saves por 1.000 vistas (≥5/1.000 = señal
fuerte). Clics al link de bio.

**Instagram:** alcance de reels y % en no-seguidores (>70% = el algoritmo distribuye, <40%
= burbuja propia). Saves en carruseles (≥10/1.000 alcance = funciona). Respuestas a
stories. Nuevos seguidores/semana y colabs publicadas.

**Comunidades:** respuestas publicadas, hilos con link contextual, upvotes/reacciones
netas, clics medidos con `utm_source=reddit|facebook|losviajeros`.

**Producto (SQL sobre Supabase):** registros/semana por `acquisition_source`. Activación
(% que genera ≥1 itinerario en 24h). Tasa de share. Vistas de páginas públicas y conversión
visita→registro. Registros con `referred_by`≠null. Upgrades y desde qué origen.

### 7.4 El embudo viral y sus números objetivo

```
Generó itinerario
  → % que comparte (objetivo mes 1: 15% · mes 3: 30%)
    → vistas por link compartido (objetivo: 5+ · WhatsApp en grupos da 3-15)
      → % visita → registro (objetivo: 8-12% con el PaywallGate actual)
        → % registro → genera (objetivo: >60%; si es menor, el problema es onboarding)
```

**K-factor = shares por usuario × vistas por share × conversión a registro.** Con los
objetivos de mes 3 (0,30 × 5 × 0,10 = **0,15**): no es crecimiento autosostenido (exigiría
>1), pero cada 100 usuarios de pago-de-contenido regalan 15 gratis, componiendo
mensualmente. Los productos de viajes rara vez superan K=0,5 (frecuencia de uso baja) — la
palanca real es K moderado + contenido fuerte + SEO.

### 7.5 Cuándo pivotar: reglas de decisión predefinidas

*(Decidir los umbrales HOY, no en el día 30, para no autoengañarse.)*

| Señal a las 4 semanas | Diagnóstico | Acción |
|---|---|---|
| Mediana TikTok <500 vistas tras 20 vídeos | Formatos o ganchos rotos | No abandonar el canal: cambiar los 2 primeros segundos de TODO. 2 semanas más y reevaluar |
| Vídeos con vistas pero <1% clic a bio | Entretiene pero no vende | Cambiar CTA de "link en bio" a "busca Itineraya" y probar URL en pantalla |
| Clics pero conversión visita→registro <4% | Landing/página pública no convierte | Trabajar `/` y el PaywallGate, pausar la mitad del esfuerzo de contenido — llenar un cubo agujereado es la muerte |
| Registro→genera <40% | Onboarding roto | Todo el esfuerzo a onboarding esa semana. Nada más importa |
| Tasa de share <8% tras los cambios de producto | El momento share no funciona | Probar incentivo directo más agresivo y entrevistar a 5 usuarios |
| Influencers: <10% respuesta a 50 DMs | Pitch o segmento equivocado | Reescribir primera línea, bajar a cuentas de 5-20k, probar email en vez de DM |
| Una comunidad trae >30% de los registros | No es problema, es EL canal | Doblar el tiempo ahí, recortar el peor canal |

**Regla general:** cambiar UNA variable por ciclo de 2 semanas (gancho, o CTA, o canal, o
landing). Cambiar tres a la vez y mejorar no dice cuál pagó.

### 7.6 Hitos de "esto va bien" (no vanity metrics)

- **Mes 1:** 300-800 registros; ≥1 vídeo >50k vistas; activación >50%; primer usuario que
  llega por `referred_by`.
- **Mes 2:** mediana TikTok >2.000 vistas; 10-20% de registros con origen `share`/`ref`; 2-3
  microinfluencers publicando por producto (no por fee); primeras 10 suscripciones de pago.
- **Mes 3:** K-factor ≥0,15 sostenido; una serie de contenido con audiencia propia
  (comentarios pidiendo el próximo episodio); `/explore` con publicaciones semanales
  orgánicas de usuarios desconocidos; CAC orgánico <2€.

**Las tres métricas que resumen todo, si solo se miran tres:**
1. Registros semanales por fuente — crece y diversifica, o no hay negocio.
2. % de itinerarios compartidos — el corazón del loop viral.
3. Activación (registro→genera en 24h) — si esto cae, todo lo demás es ruido.

---

## 8. Quick wins esta semana — las 10 acciones más urgentes

*(Fuente: GROWTH_HACK.md 2026-07-12 §6, actualizado — es el listado más reciente y ya
refleja qué está hecho en producto. Se sustituyen los quick wins de GROWTH_REPORT.md §10
que ya están implementados: UTM+ref ✅ hecho, sitemap dinámico ✅ hecho, prompt de compartir
post-generación ✅ hecho vía banner de referidos, email de invitación en i18n — verificar.)*

| # | Acción (≤1h) | Impacto | Instrucciones exactas |
|---|---|---|---|
| 1 | **Aplicar migraciones de seguridad y de vistas pendientes en prod** | 🔴 Bloqueante | Ejecutar en el SQL Editor de Supabase, en orden, las migraciones de la auditoría de seguridad y la de hitos de vistas (`increment_trip_view_count` debe devolver integer). Sin la segunda, el contador de vistas deja de funcionar tras el deploy. |
| 2 | **Google Search Console + sitemap** | 🔴 Alto | search.google.com/search-console → añadir propiedad → Sitemaps → enviar `https://itineraya.com/sitemap.xml`. Las 35 landings no existen para Google hasta este clic. Bing Webmaster Tools de paso (5 min). |
| 3 | **Key de producción de Unsplash** | 🔴 Alto | unsplash.com/oauth/applications → "Apply for production" (la demo actual: 50 req/h — ~3 generaciones/hora antes de caer a loremflickr). Producción = 5.000/h. Tarda 1-2 días en aprobarse: pedirlo hoy. |
| 4 | **Configurar `SEND_EMAIL_HOOK_SECRET`** | 🟠 Alto | Generar un secreto, ponerlo en Vercel (env) y en Supabase → Auth → Hooks → Send Email con el mismo valor. Sin esto no salen emails de auth. |
| 5 | **Programar el cron de lifecycle emails** | 🟠 Alto | En Supabase SQL Editor: `cron.schedule('lifecycle-emails', '0 9 * * *', ...)` llamando a `POST /email/email/lifecycle/run` con el service role key. Sin esto, los 9 emails de retención (incluido el de trial-24h) no se envían nunca. |
| 6 | **Validar el og:image tras el deploy** | 🟠 Medio | Publicar un viaje de prueba, pegar la URL en opengraph.xyz y en el Sharing Debugger de Facebook. Debe verse la imagen branded (foto + marca + días + CTA). |
| 7 | **Sembrar el feed con 8-10 viajes públicos propios** | 🟠 Medio | Generar y publicar itinerarios de los destinos top (Roma, Tokio, Bali, NY…) con cuenta propia. `/explore` vacío mata la conversión; lleno de viajes con vistas la dispara. Son además los links a usar en Reddit/losviajeros (§3.4, §6). |
| 8 | **Publicar el primer TikTok y el primer carrusel** | 🟡 Medio | Usar el guion #1 de §3.1 y el carrusel #1 de §3.3, ya listos. 40 min de grabación + edición. Link de bio con `?utm_source=tiktok&utm_medium=bio` para medirlo. |
| 9 | **Responder 3 hilos de losviajeros.com** | 🟡 Medio | Buscar hilos activos (<7 días) de "itinerario Roma/Tokio/Japón" y pegar el itinerario completo generado + ajustado. Sin link salvo que lo pidan. |
| 10 | **Test de compra E2E del Trip Pass** | 🟡 Medio | Con Stripe en test: forzar el límite (2 viajes con cuenta free), pulsar generar el 3º → debe salir el paywall con el Pase a 4,99€ → comprar con `4242…` → verificar que `bonus_trips` sube y se puede generar. Es el flujo de dinero nº1 y conviene probarlo entero. |

---

## Índice de fuentes

| Documento | Fecha | Aporte principal a este documento |
|---|---|---|
| `GROWTH_90_DAYS.md` | 2026-07-04 | Columna vertebral del plan de 90 días (§2) |
| `GROWTH_HACK.md` | 2026-07-12 | Estado actual del producto (§1.3), TikToks/carruseles/Reddit más recientes (§3), quick wins (§8) |
| `SOCIAL_STRATEGY.md` | 2026-07-04 | Banco extenso de contenido TikTok/IG (§3), comunidades y plantillas (§6), marco de métricas (§7) |
| `GROWTH_REPORT.md` | 2026-07-04 | Keywords y estructura SEO (§5), 20 comunidades con mensaje específico (§6.4) |
| `BUSINESS_ANALYSIS.md` | 2026-07-04 | Economía del negocio y por qué el crecimiento es orgánico (§1.2) |
| `PRODUCTHUNT_LAUNCH.md` | 2026-07-07 | Plan completo de Product Hunt (§4) |
| `IMPLEMENTATION_REPORT.md` | 2026-07-12 | Verificación cruzada de qué está realmente implementado (§1.3) |
