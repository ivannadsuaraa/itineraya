# USER_EXPERT_REPORT.md — 500 usuarios expertos y críticos usando Itineraya

**Fecha:** 2026-07-04 · **Método:** simulación de 10 perfiles × 50 usuarios cada uno, fundamentada en la lectura del código real completo (rutas, server functions, RLS, componentes, i18n, prompts de IA). Cada afirmación sobre el producto está anclada a un archivo y línea del repositorio.

> **Nota de estado:** todas las mejoras y quick wins de las secciones finales se implementaron en esta misma sesión (sin commit). Los hallazgos se describen tal y como estaban al empezar; cada uno lleva su estado (✅ corregido hoy / ⚠️ pendiente).

---

## ANÁLISIS POR PERFIL

### 1. Diseñadores UX senior (Airbnb, Google, Booking) — 50 usuarios

- **Les impresiona:** la coherencia del sistema visual (paleta sky/navy consistente en 40+ pantallas), el skeleton grid del feed ([explore.index.tsx:342-360](src/routes/explore.index.tsx)), el drawer de compartir con drag-handle (vaul), y el `PaywallGate` con blur progresivo + mask-image ([PaywallGate.tsx:17-29](src/components/trip/PaywallGate.tsx)) — "esto lo firmaría mi equipo".
- **Frustración en 5 min:** targets táctiles de 28 px en las acciones de TripCard (h-7 w-7) y toolbar de 32 px — por debajo del mínimo de cualquier HIG. Progreso de generación que se congelaba en 91 %.
- **Echan en falta:** microinteracciones con propósito (el globo es decorativo, no navegable a los viajes) y un sistema de espaciado documentado.
- **"No está a la altura":** al abrir un enlace compartido y ver la página pública degradada (mock component, "Your Itinerary" hardcodeado, scroll anidado).
- **"Esto es brillante":** la postal canvas con mapa esquemático del día ([postcard.ts:356-365](src/lib/postcard.ts)) — un artefacto compartible que ningún competidor tiene.
- **¿Pagarían?** No por diseño, sí por resultado; el diseño no bloquea la compra pero la página pública sí bloqueaba la recomendación.
- **A un amigo:** "La app está sorprendentemente bien acabada para ser tan nueva; el enlace que te comparten era su punto débil" (corregido hoy).

### 2. Desarrolladores que conocen TripIt, Wanderlog y Lambus — 50 usuarios

- **Impresiona:** structured outputs con JSON schema en la generación ([itinerary.functions.ts:34-84](src/lib/itinerary.functions.ts)) con `extractJson` como red de seguridad de 3 niveles — ingeniería seria; el prompt con coherencia geográfica (≤1,2 km entre paradas, días de cierre por fecha real) es mejor prompt-engineering que el "AI assistant" de Wanderlog.
- **Frustración:** abrir DevTools y ver el fetch de Nominatim por viaje desde el cliente; el JSONB completo reescrito por cada checkbox ([my-trip:198-212](src/routes/_authenticated/my-trip.$tripId.tsx)).
- **Echan en falta:** API pública/export (TripIt vive de esto), ics/calendar export, offline real.
- **"No está a la altura":** botón "Book · Booking" que abría Google Maps (etiqueta falsa por categoría, ✅ corregido).
- **"Brillante":** el pipeline de imágenes en paralelo hero+días con `Promise.all` ([itinerary.functions.ts:527-533]).
- **¿Pagarían?** 7,99 € les parece justo si la edición por chat es fiable; el free de 2 viajes es generoso para evaluar.
- **A un amigo:** "El generador es de verdad, no un wrapper de ChatGPT; le falta ecosistema (export, API)".

### 3. Viajeros frecuentes 30+ países — 50 usuarios

- **Impresiona:** que el itinerario respete horas de llegada/salida y ancle el día al hotel real con coordenadas ([itinerary.functions.ts:313-317]); las líneas de transporte con minutos ("🚇 Metro L4 dirección X, 12 min").
- **Frustración:** el campo "qué evitar" se preguntaba y se ignoraba (✅ corregido en la sesión anterior); no hay forma de reordenar actividades con drag & drop.
- **Echan en falta:** notas por día (hay por actividad), presupuestos por partida, enlaces a reservas reales hechas.
- **"No está a la altura":** cuando el asistente de chat no sabía qué había en su propio itinerario ("¿qué tengo el martes?" → respuesta genérica). ✅ Corregido: ahora recibe el esquema día a día.
- **"Brillante":** marcar actividades como completadas durante el viaje y que el plan aprenda del historial ([itinerary.functions.ts:219-236]).
- **¿Pagarían?** Los que hacen 3+ viajes/año, sí — el límite de 2 en free les expulsa hacia arriba de forma natural.
- **A un amigo:** "Es el primer planificador que no me propone cruzar la ciudad tres veces el mismo día".

### 4. Product managers de startups de viajes — 50 usuarios

- **Impresiona:** el funnel de monetización completo (free→trial→gates server-side), el feed UGC con remix — un loop que Wanderlog tiene a medias y TripIt no tiene.
- **Frustración:** cero analítica de producto instrumentada; sin UTM en shares era imposible medir K-factor (✅ corregido).
- **Echan en falta:** onboarding demo-first (generar antes de registrar) — la mayor palanca de activación sin implementar (⚠️ decisión de producto pendiente).
- **"No está a la altura":** dos URLs de compartir distintas (/trip y /explore) dividiendo métricas (✅ unificado).
- **"Brillante":** el momento post-generación pidiendo compartir (✅ implementado hoy) — "así se construye un K-factor".
- **¿Pagarían?** Evalúan el negocio: pricing correcto, trial visible desde el registro (✅), y el copiloto ahora descrito con honestidad en la tabla.
- **A un amigo:** "Producto con loop viral de verdad; le faltaba medirlo, ya lo mide".

### 5. Bloggers y creadores de contenido de viajes — 50 usuarios

- **Impresiona:** la postal descargable con branding "Creado con Itineraya · itineraya.com" ([postcard.ts:444]) — contenido listo para Stories; el enlace público con OG image del destino.
- **Frustración:** el botón "Instagram" que solo copiaba el enlace sin decirlo (✅ ahora "Copiar para Stories"); la postal salía en español aunque su audiencia sea inglesa (✅ ahora multilingüe).
- **Echan en falta:** postal vertical 9:16 para Stories (la actual es 16:9), y watermark configurable.
- **"No está a la altura":** compartir un enlace y que la preview de WhatsApp mostrara el logo cuadrado deformado como og:image en la home (✅ corregido a og-image.jpg).
- **"Brillante":** view_count en sus viajes publicados — feedback de audiencia dentro de la app (✅ ahora visible en el feed).
- **¿Pagarían?** Sí si les da material de contenido; son el perfil con mayor LTV orgánico (traen tráfico).
- **A un amigo (a su audiencia):** "Os dejo mi itinerario clicable, lo podéis copiar con un botón" — exactamente el mensaje que la app necesita que digan.

### 6. Usuarios mayores poco tecnológicos — 50 usuarios

- **Impresiona:** el onboarding por preguntas simples de una en una, con botones grandes y emojis; el resultado con horas y "8 min a pie" — "como me lo haría mi hija".
- **Frustración:** botones de 28 px imposibles con dedos poco precisos (✅ ampliados a ≥36-44 px); textos de 10-11 px en badges; el término "Remix" no significa nada para ellos.
- **Echan en falta:** botón de imprimir / PDF (está prometido solo en Explorador), tamaño de letra ajustable.
- **"No está a la altura":** pantalla de error con mensaje técnico en inglés cuando algo fallaba (✅ ahora bilingüe y amable).
- **"Brillante":** "me ha hecho el viaje entero y me dice a qué hora abre cada cosa".
- **¿Pagarían?** Sí, pero lo pagaría su familia; el plan anual con regalo ("regala Itineraya") no existe — oportunidad.
- **A un amigo:** "Pídele a tu nieto que te la instale, luego va sola".

### 7. Jóvenes mochileros presupuesto bajo — 50 usuarios

- **Impresiona:** el slider de presupuesto que cambia el tier del prompt (backpacker → hostels, street food, [itinerary.functions.ts:246-268]); 2 viajes gratis sin tarjeta.
- **Frustración:** 10 mensajes/día de chat en free se agotan en una duda larga; sin modo offline para usar el plan sin datos en ruta.
- **Echan en falta:** costes estimados por actividad y total del día; opciones de transporte nocturno/economy entre ciudades.
- **"No está a la altura":** ninguna en el core — este perfil es el mejor servido por el free actual.
- **"Brillante":** remixar el itinerario de otro mochilero desde el feed y ajustarlo a sus fechas.
- **¿Pagarían?** No al principio; convertirán vía "un viaje más" cuando el límite de 2 les frene. Correcto así.
- **A un amigo:** "Gratis y te hace la ruta con presupuesto de pobre de verdad, no de guía de lujo".

### 8. Familias con niños exigentes — 50 usuarios

- **Impresiona:** "familia" como companion en el onboarding y actividades con huecos de descanso (el prompt pide 15-30 min de slack).
- **Frustración:** no hay campo edades de los niños; un itinerario "familiar" con niños de 2 años y de 12 no se parece en nada.
- **Echan en falta:** filtros kid-friendly por actividad, tiempos máximos de caminata, plan B por siesta/lluvia visible.
- **"No está a la altura":** el chat sin contexto del itinerario no podía responder "¿el día 3 es viable con carrito?" (✅ ahora tiene el esquema del plan).
- **"Brillante":** los tripmates — el otro progenitor ve y comenta el plan sin instalarse nada.
- **¿Pagarían?** Sí: las familias son las que más valoran externalizar la logística; Viajero anual es "el precio de una pizza al mes".
- **A un amigo:** "Nos quitó las 4 tardes de discusión de cada verano".

### 9. Viajeros de lujo con concierge — 50 usuarios

- **Impresiona:** el tier ultra-luxury del presupuesto ("suites, exclusive experiences, no spending limit") y que anclen el día a SU hotel.
- **Frustración:** los enlaces de reserva son búsquedas genéricas (Booking search, GetYourGuide) — un concierge da el enlace exacto o reserva él; el diseño "app gratuita alegre" no les habla.
- **Echan en falta:** reservas gestionadas, restaurantes con disponibilidad real, soporte humano (el "Soporte prioritario" de Explorador no está definido en ningún sitio).
- **"No está a la altura":** botón "Book · Booking" que llevaba a un buscador (✅ etiquetas honestas hoy; la reserva real es roadmap).
- **"Brillante":** la edición por chat "hazlo más exclusivo" reescribiendo el día en segundos — eso sí se siente concierge.
- **¿Pagarían?** 15,99 € es irrelevante para ellos; pagarían 10× por reservas incluidas. No son el ICP actual y no pasa nada.
- **A un amigo:** "Para el viaje improvisado está genial; para el aniversario sigo con mi agencia".

### 10. Usuarios en inglés comparando con Google Trips† y ChatGPT — 50 usuarios

- **Impresiona:** estructura persistente vs el texto plano de ChatGPT: mapa, fotos, horas verificadas contra la fecha ("many museums close on Mondays" con el weekday real del viaje, [itinerary.functions.ts:444]).
- **Frustración:** mezcla de idiomas por toda la app — títulos de pestaña en español, 404 en español, email de invitación en inglés para todos (✅ todo corregido: títulos coherentes, 404/error bilingües, invitación es/en).
- **Echan en falta:** landing y SEO en inglés (todo el contenido /viajes es ES), historial del chat entre sesiones.
- **"No está a la altura":** pantalla de error del root en inglés genérico dentro de una app en español — "¿en qué idioma habla esta app?" (✅ unificado).
- **"Brillante":** "ChatGPT me escribe una redacción; esto me da un plan que puedo tocar, compartir y marcar".
- **¿Pagarían?** Compararán siempre con "ChatGPT gratis": convierten cuando editan el plan por chat y ven que persiste.
- **A un amigo:** "It's ChatGPT for trips, but the output is an actual product, not an essay."

† Google Trips fue descontinuado; estos usuarios lo citan como referencia de lo que Google no supo retener.

---

## LO QUE GENUINAMENTE IMPRESIONA

1. **El prompt de generación es el mejor activo de la empresa.** [itinerary.functions.ts:432-456] codifica reglas de coherencia geográfica (paradas ≤1,2 km, un barrio por día), horarios realistas por tipo de venue, días de cierre calculados contra el weekday real de las fechas, clima estacional, y anti-alucinación de venues ("si no estás seguro, nombra la zona"). Ningún competidor publica salidas con esta disciplina.
2. **Structured outputs + red de seguridad en 3 capas** ([itinerary.functions.ts:34-153]): schema JSON servidor + strip de fences + reparación + recuperación de truncación con balanceo de llaves. Es código de alguien que ha visto fallar LLMs en producción.
3. **La postal canvas** ([postcard.ts]): 16:9 de marca, iconos monoline por categoría con matching por keywords para itinerarios antiguos, mapa esquemático del recorrido y footer con URL. Artefacto viral único en la categoría.
4. **La infraestructura de email es de empresa seria** (pgmq + DLQ + TTL + rate-limit persistente + dedupe por índice único parcial, [process.ts] y migraciones) — muy por encima de lo esperable en una app de este tamaño.
5. **El PaywallGate** ([PaywallGate.tsx]): contenido visible y SEO-friendly bajo blur progresivo con mask-image, CTA sticky. Conversión sin frustración barata.
6. **Feed de exploración completo**: skeletons, empty state con CTA, trending derivado de los datos, rating con hover states ([explore.index.tsx]).
7. **Detalles de plataforma**: safe-area en la bottom bar (`pb-[env(safe-area-inset-bottom)]`, [DashboardSidebar.tsx:135]), `min-h-dvh` en vez de 100vh, lazy imports con Suspense para globo/calendario/mapa.

## LO QUE DECEPCIONA (por impacto en conversión y retención)

| # | Hallazgo | Archivo:línea | Estado |
|---|---|---|---|
| 1 | La página pública compartida renderizaba con un componente de calidad mock: datos por defecto inventados, "Your Itinerary"/"Day N" hardcodeados, colores fuera de marca, scroll anidado, y descartaba fotos/emoji/lugares del itinerario | src/components/trip/ItineraryView.tsx:9-42,173,194 (eliminado); [trip.$slug.tsx:191-210] versión previa | ✅ reescrita a fidelidad completa |
| 2 | Nadie pedía compartir en el momento de máxima dopamina (post-generación) | [my-trip.$tripId.tsx:258-267] | ✅ toast + ShareDialog automático |
| 3 | Enlaces de compartir sin UTM/ref → K-factor inmedible; dos URLs distintas (/trip vs /explore) | [ShareDialog.tsx:33], [PublishToggle.tsx:56] | ✅ UTM+ref y URL unificada |
| 4 | El asistente no conocía el itinerario del usuario: respondía genérico sobre el plan que el usuario tenía delante | [assistant.tsx:136-149], [chat.ts:88-95] | ✅ esquema día-a-día en el contexto |
| 5 | Botón de reserva con marca falsa ("Booking" para un enlace de Google Maps) | [my-trip.$tripId.tsx:119-134] | ✅ marca por dominio real + solo https |
| 6 | Testimonios inventados con nombres y ciudades en pricing — riesgo de confianza y legal | pricing.tsx:286-315 (versión previa) | ✅ eliminados |
| 7 | Progreso de generación congelado en 91 % sin tiempo ni expectativa | [my-trip.$tripId.tsx:857-871] versión previa | ✅ asintótico + segundos + hint |
| 8 | Targets táctiles de 28-32 px en acciones principales | [dashboard.tsx:706-737], [my-trip:317-393] | ✅ ≥36-44 px |
| 9 | Idioma incoherente: títulos de pestaña en inglés/español mezclados, 404 español + error inglés, email de invitación solo inglés, postal solo español | [__root.tsx:22-77], [tripmates.functions.ts:49-55], [postcard.ts:344] | ✅ todo unificado/i18n |
| 10 | Tabla comparativa/FAQ/garantía de pricing solo en español; fila del copiloto prometía algo distinto a lo que el código hace | pricing.tsx:233-399 versión previa | ✅ i18n 4 idiomas + fila honesta |
| 11 | Chat vacío sin sugerencias: lienzo en blanco a estrenar | [assistant.tsx:247-265] | ✅ 4 chips de arranque |
| 12 | Sin límite de invitaciones (spam) y email de invitación sin idioma | [tripmates.functions.ts:10-63] | ✅ 20/día + es/en |
| 13 | Clima con 2 fetch en cascada por render, sin caché | [dashboard-helpers.ts:48-64] | ✅ sessionStorage por hora |
| 14 | Ratings del feed sin prueba social visible (views ocultas); labels de orden sin i18n; estrellas sin aria útil | [explore.index.tsx:265,400-428] | ✅ views + i18n + aria + hit-area |
| 15 | Reintentos ciegos de slug ante cualquier error de BD | [share.functions.ts:61-69], [explore.functions.ts:64-75] | ✅ solo colisión 23505 |
| 16 | Historial del chat no persiste entre sesiones | [assistant.tsx:181-186] | ⚠️ pendiente (tabla de conversaciones) |
| 17 | Onboarding requiere cuenta antes de mostrar valor (demo-first) | [_authenticated/route.tsx:17-30] | ⚠️ pendiente (decisión de producto) |
| 18 | Sin export PDF/ics pese a venderse en Explorador | [pricing.tsx] fila pdf | ⚠️ pendiente |

## COMPARATIVA CON COMPETIDORES

**Dónde gana Itineraya:**
- **vs ChatGPT:** salida estructurada persistente (mapa, fotos, horas verificadas contra la fecha real, transporte entre paradas), editable por chat sin perder el resto, compartible como página. ChatGPT no tiene ninguna de las cinco.
- **vs TripIt:** TripIt ordena reservas ya hechas; no planifica nada. Itineraya empieza donde está el usuario de verdad ("quiero ir a X y no sé por dónde empezar").
- **vs Wanderlog:** la IA de Wanderlog es un añadido sobre un planner manual denso; la de Itineraya es el núcleo, con disciplina geográfica y temporal superior. Español nativo (es/fr/pt) donde Wanderlog es EN-first.
- **vs Lambus:** feed comunitario con remix y postales — Lambus no tiene loop viral ninguno.

**Dónde pierde:**
- **vs TripIt:** integración con reservas reales (email parsing, alertas de vuelo) — el post-booking es suyo.
- **vs Wanderlog:** colaboración en tiempo real, listas de lugares guardados, export, apps nativas con offline.
- **vs ChatGPT:** gratuidad ilimitada y conversación sin límites; la conversación de ChatGPT "recuerda" toda la sesión, el chat de Itineraya no persiste entre visitas (⚠️ #16).
- **vs todos:** marca desconocida y cero prueba social real (los testimonios falsos eran peor que nada; eliminados).

**Qué hace mejor que todos:** el ciclo generar → editar por chat → compartir como página bonita → remix por otro usuario. Es el único producto de la categoría donde el output de un usuario es el input de adquisición del siguiente.

## LAS 15 MEJORAS QUE LO CAMBIARÍAN TODO (todas implementadas hoy)

1. ✅ **Página pública al nivel del producto** — reescrito [trip.$slug.tsx](src/routes/trip.$slug.tsx) con fotos por día, emoji, lugar, fecha real localizada y PaywallGate; eliminados ItineraryView/TripCard/useMicroAnimation (mock-quality, huérfanos).
2. ✅ **Compartir en el momento wow** — toast + ShareDialog automático al terminar la generación ([my-trip.$tripId.tsx]).
3. ✅ **Atribución + URL única de compartir** — UTM por canal + `ref` del usuario en ShareDialog; PublishToggle apunta a /trip/$slug.
4. ✅ **Asistente con contexto real** — esquema compacto del itinerario (día → hora+lugar) enviado a [chat.ts](src/routes/api/chat.ts) y referenciado en el system prompt.
5. ✅ **Chips de arranque del chat** — 4 sugerencias tocables con el destino interpolado ([assistant.tsx]).
6. ✅ **Generación honesta** — progreso asintótico que nunca se congela + segundos transcurridos + "suele tardar menos de un minuto".
7. ✅ **Reservas veraces** — `brandFromUrl` etiqueta por dominio real, descarta Maps duplicado, exige https ([my-trip.$tripId.tsx]).
8. ✅ **Pricing honesto e internacional** — testimonios ficticios fuera; tabla/garantía/FAQ con claves i18n en es/en/fr/pt; fila del copiloto = realidad del código (10 msg/día en free).
9. ✅ **Accesibilidad táctil** — acciones de TripCard 36 px, toolbar 40 px, estrellas con padding, toggles ampliados.
10. ✅ **Shell idiomáticamente coherente** — 404/error bilingües vía i18n.t (funcionan fuera de providers), títulos de pestaña unificados en 6 rutas, og:image correcto.
11. ✅ **Invitaciones bilingües y protegidas** — plantilla es/en según el idioma del invitador + tope de 20/día ([tripmates.functions.ts]).
12. ✅ **Postal multilingüe** — "Día/Day/Jour/Dia X en…" y rótulo del mapa según el idioma del UI ([postcard.ts]).
13. ✅ **Rendimiento percibido** — clima cacheado por destino+hora en sessionStorage ([dashboard-helpers.ts]); hero público con fetchPriority, day-images lazy.
14. ✅ **Prueba social en el feed** — view_count visible en tarjetas + orden/aria/trending localizados ([explore.index.tsx], [explore.functions.ts]).
15. ✅ **Robustez del share** — reintento de slug solo ante colisión real 23505 ([share.functions.ts], [explore.functions.ts]).

## QUICK WINS (10 × <30 min, todos implementados hoy)

1. ✅ og:image de la home → `/og-image.jpg` (1200×630 real) — [__root.tsx].
2. ✅ Selector de viaje del asistente sin truncar (160/240 px + tooltip) — [assistant.tsx].
3. ✅ Botón "Instagram" honesto → "Copiar para Stories" con icono de cámara — [ShareDialog.tsx].
4. ✅ Saludo del dashboard con el prefijo del email antes que "viajero" genérico — [dashboard.tsx].
5. ✅ aria-labels localizados y con plural en las estrellas de rating — [explore.index.tsx].
6. ✅ Títulos `head` coherentes en dashboard/my-trip/assistant/copilot/invite/welcome.
7. ✅ 6 ficheros muertos eliminados (index.js, onboarding.tsx raíz, Button.js roto, ItineraryView, TripCard, useMicroAnimation).
8. ✅ BreadcrumbList JSON-LD en las landings /viajes — [viajes.$destino.tsx].
9. ✅ "Mejor valorados / Más recientes" y "Destinos trending" del feed con claves i18n en 4 idiomas.
10. ✅ Botón de limpiar búsqueda del feed: más grande y con aria localizado — [explore.index.tsx].

---

**Veredicto agregado de los 500:** el motor (generación + edición) ya está al nivel de "imprescindible"; lo que lo tenía en "interesante" era la corteza — el enlace compartido pobre, los textos incoherentes y los pequeños engaños (marcas falsas en botones, testimonios inventados, progreso congelado). Tras esta pasada, la brecha restante para el 10/10 es: chat persistente, demo-first sin registro, export PDF/ics y reservas reales.
