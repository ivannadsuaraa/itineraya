# SOCIAL_STRATEGY.md — Estrategia de crecimiento y viralidad de Itineraya

> Documento generado el 2026-07-04 tras auditar el código real del repositorio.
> Todo lo que sigue está anclado a lo que existe HOY en el producto, con rutas de fichero concretas.

---

## 0. Diagnóstico: qué tienes ya construido (y qué está roto)

Antes de gastar un euro o un minuto en contenido, esto es lo que el código dice de tu producto:

### Activos virales que YA existen

| Activo | Dónde está en el código | Estado |
|---|---|---|
| Página pública de itinerario con OG tags | `src/routes/trip.$slug.tsx` | ✅ Funciona. og:image = hero del viaje |
| Gate de registro a mitad de itinerario | `src/components/trip/PaywallGate.tsx` (blur + CTA), split en `trip.$slug.tsx:104` | ✅ Funciona — muestra ~50% de días |
| Botón "Remix este viaje" que precarga el onboarding | `trip.$slug.tsx:139` (`handleRemix` → `/onboarding?prefill=`) | ✅ Funciona. Es tu arma secreta |
| ShareDialog con WhatsApp / Stories / native share | `src/components/trip/ShareDialog.tsx` | ✅ Funciona, pero "Stories" solo copia un link |
| UTM por canal + ref del usuario en cada link | `ShareDialog.tsx:42-47` (`utm_source`, `utm_medium=share`, `ref=userId`) | ⚠️ Se emite pero **nadie lo captura** |
| Contador de vistas por itinerario | `share.functions.ts:127` (RPC `increment_trip_view_count`) | ✅ Se incrementa, ❌ no se muestra a nadie |
| Feed comunitario /explore con ratings | `src/routes/explore.index.tsx`, `explore.functions.ts` (`listPublicTrips`, `rateTrip`) | ✅ Existe — es tu repositorio de UGC |
| SEO programático /viajes/* | `src/lib/seo-destinations.ts` (París, Tokio, Nueva York, Barcelona, Bali) | ✅ 5 destinos, en español |
| Invitación de compañeros de viaje por email | `src/lib/tripmates.functions.ts`, `src/routes/invite.$token.tsx` | ✅ Funciona |
| Emails de lifecycle | `src/lib/lifecycle-emails.ts` | ✅ Existe |
| Guardar inspiración desde página pública | `trip.$slug.tsx:153` (`saved_inspirations`) | ✅ Funciona |

### Lo que está roto o falta (bloqueadores del loop viral)

1. **Atribución de referidos rota.** `ShareDialog` añade `?ref=<userId>` a cada link compartido, pero no hay ni una línea de código que lea ese parámetro en `trip.$slug.tsx` ni en `AuthModalProvider.tsx`, ni columna `referred_by` en `profiles`. Hoy es imposible saber quién trae usuarios ni recompensarlo. **Es el fix nº 1 de todo este documento.**
2. **"Copiar para Stories" no genera ningún asset.** Copia un link a portapapeles. Nadie pega un link crudo en una Story. Necesitas generar una imagen 1080×1920.
3. **og:image sin branding.** Es la foto de Unsplash tal cual. Cuando alguien pega el link en WhatsApp/Twitter, la preview no dice "5 días en Bali · itinerario completo · hecho en 60 segundos".
4. **El contador de vistas es invisible.** Tienes el dato y no lo usas ni para social proof ("👀 1.2k personas han visto este viaje") ni para notificar al autor ("tu itinerario de París lo han visto 50 personas hoy" → email que trae de vuelta al usuario).
5. **No hay momento de compartir post-generación.** El usuario genera el itinerario (el pico emocional máximo) y no se le pide compartir justo ahí.

### El mensaje de producto (para TODO el contenido)

Del código sale la propuesta de valor exacta que hay que martillear en cada vídeo:

> **"Describe tu viaje. En 60 segundos tienes el itinerario completo: día a día, con horarios, sitios reales, mapa y fotos. Gratis, sin tarjeta."**

Diferenciadores demostrables en pantalla: generación en <1 min (Claude Haiku + structured outputs, `itinerary.functions.ts`), hasta 20 días, imágenes por día, categorías (comida, cultura, fiesta...), botón Remix sobre itinerarios de otros, gratis sin tarjeta (`paywall.footer: "Sin tarjeta · En 10 segundos"`).

---

# PARTE 1 — TIKTOK: ESTRATEGIA COMPLETA

## 1.1 Las 30 ideas de vídeo, ordenadas por potencial viral

Formato de cada entrada: **Gancho (primeros 1-2 s) · Estructura · Duración · CTA**.
Las 10 primeras tienen script palabra por palabra en la sección 1.2.

### Tier S — potencial viral máximo (haz estos primero)

**1. "Le pedí a una IA que me planificara 5 días en Bali y esto es lo que salió"**
- Gancho: pantalla del formulario + voz "esto lo hizo una IA en 60 segundos"
- Estructura: screen-recording del onboarding real → corte al itinerario generado → scroll rápido por los días con zoom en actividades concretas → reacción
- Duración: 25-35 s
- CTA: "Link en la bio. Es gratis, pruébalo con tu próximo viaje"

**2. "Agencia de viajes: 80€ por el itinerario. Yo: "** (comparativa precio)
- Gancho: texto en pantalla "Me querían cobrar 80€ por planificarme el viaje"
- Estructura: split screen presupuesto de agencia vs. generación en Itineraya con cronómetro visible → resultado lado a lado
- Duración: 20-30 s
- CTA: "0€. Sesenta segundos. Link en bio"

**3. "POV: tu amiga la organizada del grupo descubre esta app"**
- Gancho: POV + situación reconocible (la que siempre organiza los viajes del grupo)
- Estructura: sketch de 3 escenas: caos del grupo en WhatsApp → ella abre Itineraya → manda el link del itinerario al grupo y todos flipan (usa la función real de compartir por WhatsApp del `ShareDialog`)
- Duración: 20-30 s
- CTA: "Etiqueta a la organizadora de tu grupo"  ← CTA de etiquetado = comentarios = alcance

**4. "Tu itinerario de [destino trending] en 60 segundos — con cronómetro"**
- Gancho: cronómetro gigante en pantalla arrancando
- Estructura: reto en tiempo real, sin cortes: formulario → generación → itinerario completo antes de que suene la alarma. La ansiedad del cronómetro retiene
- Duración: 60 s exactos (el formato ES el contenido)
- CTA: "¿Qué destino hago mañana? Comenta" ← serie infinita
- **Nota: este es tu formato SERIE. Un destino al día. El destino lo eligen los comentarios.**

**5. "Cosas que la IA sabe de [ciudad] que ni los locales te dicen"**
- Gancho: "Vivo en Barcelona y esta app me ha recomendado un sitio que no conocía"
- Estructura: 3 actividades no-obvias sacadas de un itinerario real generado (el prompt de `itinerary.functions.ts` genera sitios reales con nombre), verificadas en pantalla con Google Maps
- Duración: 30-40 s
- CTA: "Genera el tuyo gratis — link en bio"

**6. "Robé el itinerario de viaje de un desconocido (legal)"** — el vídeo del REMIX
- Gancho: "¿Sabías que puedes robar itinerarios de otros viajeros?"
- Estructura: entrar en `/explore` → elegir un viaje de la comunidad → botón "Remix este viaje" → la IA lo adapta a tus fechas/estilo → resultado
- Duración: 25-35 s
- CTA: "Busca 'Itineraya' y remixea el que quieras"
- **Este vídeo vende la feature más diferencial que tienes y nadie más tiene.**

**7. "Viaje sorpresa: dejé que una IA eligiera TODO"**
- Gancho: "No sé a dónde voy este finde. Lo decide una IA"
- Estructura: usar `/inspire` (existe en el código: `inspire.functions.ts`) → destino revelado → generación del itinerario → "¿voy o no voy?" 
- Duración: 30-45 s
- CTA: "Parte 2 si llegamos a X likes" (y HAZ la parte 2 yendo de verdad — eso es el vídeo 8)

**8. "Fui al viaje que me planificó una IA — sin cambiar nada" (serie IRL)**
- Gancho: "Una IA me planificó este viaje. Lo estoy siguiendo al pie de la letra"
- Estructura: vlog real siguiendo el itinerario, mostrando el móvil con la app en cada parada, honesto con aciertos y fallos (la honestidad con un fallo da credibilidad y comentarios)
- Duración: 45-60 s por capítulo, un capítulo por día del viaje
- CTA: "Sígueme para el día 2"
- **El contenido con mayor conversión posible: demuestra el producto en el mundo real.**

**9. "3 errores que TODOS cometen planificando un viaje a [destino]"**
- Gancho: "Si vas a ir a París, no cometas el error nº 2"
- Estructura: 3 errores (museos cerrados en lunes, no agrupar por zonas, colas sin reserva — sacados literalmente del contenido SEO de `seo-destinations.ts:47`) → "por eso yo uso esto" → demo de 5 s
- Duración: 30-40 s
- CTA: "El itinerario completo de París gratis en el link"
- **Reutiliza el contenido que YA escribiste para /viajes/paris. Cero coste de guion.**

**10. "Le enseñé a mi madre a planificar su viaje con IA"**
- Gancho: persona mayor real + "mi madre no sabe usar ni el WhatsApp"
- Estructura: la madre dicta el viaje que quiere, tú tecleas, ella reacciona al itinerario. La reacción genuina de una persona mayor es oro
- Duración: 30-45 s
- CTA: "Mándaselo a tu madre"

### Tier A — alto potencial

**11. "Cuánto cuesta REALMENTE un finde en [ciudad]"** — usar el itinerario generado con presupuesto (`budget` es campo del trip en la DB) para desglosar coste actividad a actividad. 30 s. CTA: comenta tu ciudad.

**12. "ChatGPT vs Itineraya planificando el mismo viaje"** — comparativa honesta lado a lado: al de ChatGPT le faltan horarios/mapa/imágenes/no se puede compartir; el tuyo sale como página navegable. 40 s. CTA: link en bio. (No tengas miedo a nombrar a ChatGPT: el 90% de tu audiencia ya lo intentó ahí y quedó meh — ese es tu mercado.)

**13. "El truco del itinerario para el grupo de WhatsApp"** — mostrar compartir por WhatsApp desde el `ShareDialog` y cómo el grupo ve la página pública sin instalarse nada. 20 s. CTA: etiqueta a tu grupo de viaje.

**14. "Rating de itinerarios de la comunidad: ¿me iría a este viaje?"** — reaccionar a viajes reales de `/explore` puntuándolos. Serie. 30-45 s. CTA: "publica el tuyo y lo reacciono".

**15. "Destinos que puedes hacer en 2 días desde Madrid/Barcelona"** — 3 escapadas con mini-itinerario generado de cada una. 35 s. CTA: comenta tu ciudad de origen.

**16. "La app que necesitas si viajas con niños"** — generar viaje con `companion` = familia y enseñar cómo cambian las actividades. 30 s. CTA: guarda este vídeo para el verano.

**17. "Presupuesto mochilero vs presupuesto premium: mismo destino"** — dos generaciones con el slider de presupuesto (`BudgetRangeSlider.tsx` existe) en extremos opuestos. 35 s. CTA: ¿team mochila o team resort?

**18. "Qué hacer en [ciudad] si solo tienes 24 horas (escala de vuelo)"** — itinerario de 1 día para escalas. 25 s. Nicho pero búsqueda constante.

**19. "Le pedí un viaje ROMÁNTICO y mirad qué planeó para la noche"** — trip_style romántico, enseñar las actividades de noche. Ligero clickbait sano. 25 s.

**20. "Cosas gratis que hacer en [ciudad cara]"** — filtrar actividades de coste cero de un itinerario generado. 30 s. Formato de guardado masivo (saves = señal fuerte del algoritmo).

### Tier B — sostenimiento y nicho

**21. "Un día conmigo construyendo una app de viajes"** — build in public en español: enseña el dashboard de métricas, decisiones, el fix del día. Audiencia tech/emprendedora. 45 s.

**22. "Reaccionando a los destinos MÁS pedidos esta semana"** — datos agregados de tu DB (qué destinos genera la gente). 30 s.

**23. "El itinerario de [película/serie del momento]"** — ej. viaje a los escenarios de la serie trending. Newsjacking. 35 s.

**24. "Viajar sola: cómo planifico para sentirme segura"** — colaboración con creadora; itinerario con zonas y horarios pensados. 40 s.

**25. "Mi itinerario real de [destino] — róbamelo"** — publicas TU viaje real con el link público en la bio; la gente lo remixea. Convierte porque el link ES el producto. 30 s.

**26. "Puente de [festivo]: 3 planes generados en 3 minutos"** — contenido calendario: cada puente/festivo español es un pico de búsqueda. 35 s.

**27. "Lo que NO te cuentan de Bali/Tokio/NY"** — mitos vs. lo que pone el itinerario (usar las FAQ de `seo-destinations.ts` que ya escribiste). 30 s.

**28. "Así se ve un itinerario de 20 días por el sudeste asiático"** — flexionar el límite de 20 días (commit `2aff236`): scroll infinito por el itinerario más largo posible. Satisfying content. 20 s.

**29. "Duetea esto: ¿mejora la IA tu itinerario?"** — invitar a duetos con itinerarios hechos a mano vs. el generado. El formato dueto multiplica alcance. 20 s.

**30. "Errores de la IA planificando viajes (y cómo los arreglamos)"** — transparencia: enseñar un error real del generador y el fix. Humaniza y trae comentarios de calidad. 40 s.

## 1.2 Scripts palabra por palabra — los 10 mejores

> Formato: [PLANO] indicación visual · **texto en pantalla** · "voz en off/hablado".
> Todos en español de España, tono cercano, ritmo rápido (corte cada 1,5-2,5 s).

---

### Script 1 — "Le pedí a una IA que me planificara 5 días en Bali"

[PLANO 1 — 0-2 s: cara a cámara, medio sorprendido, móvil en mano]
**"Una IA me ha planificado 5 días en Bali"**
"Vale, esto me ha volado la cabeza."

[PLANO 2 — 2-6 s: screen-recording del onboarding de Itineraya]
"Le he dicho: Bali, 5 días, presupuesto medio, que me gusta la playa y la comida local."

[PLANO 3 — 6-9 s: pantalla de generación con loader]
**"60 segundos después…"**
"Y en lo que tardas en pedir un café…"

[PLANO 4 — 9-20 s: scroll por el itinerario, zoom en 2-3 actividades con nombre real]
"Día uno: llegada, templo de Tanah Lot al atardecer y cena en un warung de verdad, no de guiri. Día tres mirad esto: me ha metido las cascadas de Sekumpul ANTES de las diez para evitar los tours. Eso lo sabe la gente que ya ha ido."

[PLANO 5 — 20-25 s: zoom out del itinerario completo con mapa]
"Horarios, sitios reales, mapa, fotos. Todo."

[PLANO 6 — 25-30 s: cara a cámara]
**"GRATIS · sin tarjeta"**
"Es gratis y no te pide tarjeta. Se llama Itineraya, os dejo el link en la bio. Probadlo con vuestro próximo viaje y me contáis."

---

### Script 2 — "Agencia: 80€. Yo: gratis"

[PLANO 1 — 0-2 s: captura (real o recreada) de un presupuesto]
**"80€ por planificarme el viaje 🙃"**
"Una agencia me pidió ochenta euros por hacerme el itinerario de Roma."

[PLANO 2 — 2-4 s: cara a cámara]
"Ochenta. Euros. Por un PDF."

[PLANO 3 — 4-10 s: screen-recording, cronómetro en esquina]
"Mirad lo que hice en su lugar. Roma, 4 días, viajo en pareja, me gusta la historia y comer bien. Generar."

[PLANO 4 — 10-18 s: itinerario generado, scroll]
**"0€ · 58 segundos"**
"Cincuenta y ocho segundos. Cuatro días completos: Coliseo con truco para la cola, Trastevere de noche, hasta en qué orden hacer los museos vaticanos para no morir."

[PLANO 5 — 18-24 s: cara a cámara, encogiéndose de hombros]
"¿Es tan bueno como un agente humano con veinte años de experiencia? Mira, no lo sé. Pero es gratis y tarda un minuto, así que el riesgo es cero."

[PLANO 6 — 24-28 s]
**"Itineraya — link en bio"**
"Itineraya. Link en la bio. Y los ochenta euros os los gastáis en la cena."

---

### Script 3 — "POV: la organizada del grupo descubre esta app"

[PLANO 1 — 0-2 s: texto grande sobre captura de un grupo de WhatsApp caótico]
**"POV: eres la que SIEMPRE organiza los viajes del grupo"**
(audio trending de fondo, sin voz)

[PLANO 2 — 2-6 s: actriz/tú con cara de agotamiento mirando el móvil]
**"'¿Y si vamos a Lisboa?' — 47 mensajes — cero planes"**

[PLANO 3 — 6-12 s: cambia la cara, abre Itineraya, teclea rápido]
**"yo, cansada de vosotros:"**
(escribiendo: Lisboa, 3 días, grupo de amigas, fiesta + brunch)

[PLANO 4 — 12-16 s: pantalla del itinerario generado]
**"3 días planificados en 1 minuto"**

[PLANO 5 — 16-20 s: pulsa Compartir → WhatsApp (el flujo real del ShareDialog), se ve el link enviándose al grupo]
**"y se lo mando al grupo como una diosa"**

[PLANO 6 — 20-24 s: capturas de respuestas del grupo: "ERES LA MEJOR" "reina 👑"]
**"Etiqueta a la organizadora de tu grupo 👇"**

> Nota de producción: este vídeo NO lleva voz. Audio trending + textos. Es el más barato de producir y el de mayor techo viral por el CTA de etiquetado.

---

### Script 4 — "Tu itinerario en 60 segundos" (formato serie con cronómetro)

[PLANO 1 — 0-3 s: cara a cámara + cronómetro gigante en 00:00]
"Me habéis pedido Tokio en los comentarios. Reto: itinerario completo de Tokio en menos de sesenta segundos. Tiempo."

[PLANO 2 — 3-15 s: screen-recording SIN CORTES, cronómetro corriendo]
"Tokio… siete días… viajo solo… presupuesto medio… me interesa la cultura, la comida y algo de frikismo… Generar."

[PLANO 3 — 15-45 s: la generación en tiempo real; mientras carga, hablas]
"Mientras piensa: esto usa IA para crear el viaje entero, día a día, con horarios y sitios reales. Y luego lo puedes editar, compartir con tu grupo o…"

[PLANO 4 — 45-55 s: aparece el itinerario, scroll rápido]
"¡Ahí está! Cuarenta y ocho segundos. Siete días: Shibuya, Akihabara, día de excursión a Nikko, y me ha metido el mercado de Tsukiji a las ocho de la mañana, que es cuando hay que ir."

[PLANO 5 — 55-60 s: cronómetro parado en pantalla]
**"¿Qué destino hago mañana? 👇"**
"¿Mañana cuál? Comentad y el más pedido gana."

---

### Script 5 — "Cosas que la IA sabe de Barcelona que ni los locales"

[PLANO 1 — 0-2 s: cara a cámara, tono de confesión]
"Vivo en Barcelona y una IA me acaba de recomendar un sitio de mi propia ciudad que no conocía."

[PLANO 2 — 2-8 s: pantalla del itinerario, zoom en la actividad]
"Le pedí un itinerario de Barcelona 'sin turistadas' y en el día dos me suelta esto: [nombre del sitio real del itinerario generado]. Lo busqué en Maps pensando que se lo había inventado…"

[PLANO 3 — 8-12 s: captura de Google Maps con el sitio y sus reseñas]
"Existe. Cuatro coma siete estrellas. Y yo sin saberlo."

[PLANO 4 — 12-22 s: dos recomendaciones más, mismo formato rápido]
"Dos más: [sitio 2], que solo abre por las mañanas y por eso te lo pone a las diez. Y [sitio 3] para el atardecer, sin las colas del Park Güell."

[PLANO 5 — 22-28 s: cara a cámara]
**"Itineraya · gratis · link en bio"**
"Si esto lo hace con MI ciudad, imagínate con tu próximo viaje. Link en la bio, es gratis."

> Producción: genera el itinerario de verdad y verifica los 3 sitios en Maps antes de grabar. Si uno es flojo, regenera. La credibilidad de este formato es todo.

---

### Script 6 — "Robé el itinerario de un desconocido (legal)"

[PLANO 1 — 0-2 s: cara a cámara, mirada de pillo]
"¿Sabías que puedes robarle el itinerario de viaje a un desconocido? Legalmente."

[PLANO 2 — 2-8 s: screen-recording de /explore, scroll por viajes de la comunidad]
"Esto es Itineraya. Aquí la gente publica sus viajes reales: este de Bali de una semana, este de Roma en pareja… Y ahora viene lo bueno."

[PLANO 3 — 8-14 s: abrir un viaje, pulsar "Remix este viaje"]
**"REMIX ✨"**
"Le das a Remix… y la IA coge SU viaje y lo rehace para MÍ: mis fechas, mi presupuesto, mi rollo."

[PLANO 4 — 14-22 s: comparación rápida original vs. remix]
"El suyo era de mochilero en agosto. El mío: mismo destino, pero en noviembre, más tranquilo y con mejores restaurantes. Mismo esqueleto, mi viaje."

[PLANO 5 — 22-27 s: cara a cámara]
**"Itineraya → Explorar → Remix"**
"Es como el fork de los programadores pero para viajes. Link en bio: entra en Explorar y remixea el que más te guste."

---

### Script 7 — "Dejé que una IA eligiera mi viaje sorpresa"

[PLANO 1 — 0-3 s: cara a cámara con mochila a medio hacer]
"No tengo plan para el puente. Así que va a decidir una IA. Todo. Y yo voy a ir."

[PLANO 2 — 3-9 s: screen-recording de /inspire respondiendo el cuestionario]
"Le digo cómo me siento: quiero desconectar, naturaleza, no gastarme mucho… y que me sorprenda."

[PLANO 3 — 9-13 s: redoble; se tapa los ojos; revelación del destino]
**"…¿¡[DESTINO]!?"**
"No. NO. ¿En serio?"

[PLANO 4 — 13-22 s: generación del itinerario del destino sorpresa, scroll]
"Vale vale vale. Tres días: [actividad 1], [actividad 2]… vale, esto pinta mejor de lo que esperaba."

[PLANO 5 — 22-28 s: cara a cámara con la mochila cerrada]
**"¿Voy? 👇"**
"Tengo el itinerario, tengo el finde libre. Si este vídeo llega a [X] likes, voy y os lo enseño todo. Parte dos en mi perfil."

> Compromiso real: ve. La parte 2 (script 8) es el vídeo que convierte.

---

### Script 8 — "Fui al viaje que planificó la IA — día 1"

[PLANO 1 — 0-3 s: en la estación/aeropuerto, cara a cámara]
"Una IA planificó este viaje entero y yo solo obedezco. Día uno. No he cambiado nada."

[PLANO 2 — 3-8 s: móvil en mano mostrando el itinerario del día, se lee la primera actividad]
"Primera orden: nueve y media, desayuno en [sitio]. Vamos allá."

[PLANO 3 — 8-25 s: 3-4 clips rápidos siguiendo actividades reales, cada uno abre con el móvil mostrando la actividad y cierra con la realidad]
"Dice que a esta hora no hay cola… no hay cola. Punto para la máquina."
"Esto no me lo esperaba: [momento bueno espontáneo]."
"Vale, aquí ha fallado: el sitio de la comida cerraba los viernes. Máquina, revisa eso." ← el fallo honesto ES el gancho de comentarios

[PLANO 4 — 25-32 s: atardecer, balance del día]
"Balance del día uno: cuatro aciertos, un fallo, cero decisiones tomadas por mí. Mi cerebro, de vacaciones también."

[PLANO 5 — 32-36 s]
**"Día 2 mañana · itinerario completo en mi bio"**
"Mañana, día dos. Y si queréis este itinerario exacto, os lo dejo en la bio." ← aquí pones el LINK PÚBLICO real de tu viaje (`/trip/<slug>`), que es la página con el gate de registro. El tráfico de este vídeo cae directo en tu funnel.

---

### Script 9 — "3 errores que todos cometen en París"

[PLANO 1 — 0-2 s: cara a cámara, tono urgente]
"Si vas a ir a París este año, no cometas el error número dos, porque te arruina un día entero."

[PLANO 2 — 2-9 s: error 1, con b-roll o imágenes de archivo]
**"ERROR 1: ir al Louvre sin reserva"**
"Uno: presentarte en el Louvre sin entrada reservada. Dos horas de cola. Con reserva: quince minutos."

[PLANO 3 — 9-16 s: error 2]
**"ERROR 2: no mirar qué día cierran los museos"**
"Dos: los museos de París cierran lunes O martes según cuál. Si te organizas mal, te comes un día de museos… con todo cerrado."

[PLANO 4 — 16-23 s: error 3]
**"ERROR 3: cruzar la ciudad 4 veces al día"**
"Tres: hacer Torre Eiffel, luego Montmartre, luego volver al Marais. Cuarenta minutos de metro entre cada uno. París se hace POR BARRIOS."

[PLANO 5 — 23-30 s: transición al producto]
"¿Lo mejor? Todo esto ya lo tiene en cuenta esta app cuando te genera el itinerario: agrupa por zonas y sabe qué cierra cada día."

[PLANO 6 — 30-34 s]
**"Itinerario de París GRATIS → bio"**
"El itinerario de París de cuatro días lo tenéis gratis en el link de la bio."
← el link es `https://itineraya.com/viajes/paris` — la página SEO que YA existe, con el CTA de personalización integrado.

---

### Script 10 — "Le enseñé a mi madre a usarlo"

[PLANO 1 — 0-3 s: tu madre en el sofá, tú con el móvil]
"Mi madre lleva veinte años diciendo que quiere volver a Roma. Hoy la IA le planifica el viaje. Mamá, dime qué quieres."

[PLANO 2 — 3-10 s: ella dicta, tú tecleas; subtítulos de lo que dice]
"—Pues… Roma, una semana. Sin madrugones. Y que haya tiempo para sentarse a tomar café, no como tu padre que lo quiere ver todo corriendo."

[PLANO 3 — 10-14 s: pantalla generando; ella escéptica]
"—¿Y esto lo hace un ordenador? —Espera y verás."

[PLANO 4 — 14-25 s: reacción de ella leyendo el itinerario — LA JOYA DEL VÍDEO]
"—Anda… mira, la Fontana. ¿Y esto qué es, un mercado? Ay, pues a esto sí que iría… ¿Y me lo puedes imprimir?"
(risas) "Sí, mamá, se puede imprimir."

[PLANO 5 — 25-30 s: cara a cámara]
**"Mándaselo a tu madre ❤️"**
"Cero configuración, cero registro con tarjeta, letra grande. Mandádselo a vuestras madres, en serio. Link en bio."

---

## 1.3 Trends y audios virales: cómo surfearlos sin parecer forzado

**Regla de oro:** el trend es el ENVOLTORIO, tu demo de producto es el RELLENO. Nunca al revés.

1. **Dónde detectar trends cada mañana (10 min/día):**
   - TikTok Creative Center (ads.tiktok.com/business/creativecenter) → pestaña "Tendencias" → filtrar por España → mira "Canciones en tendencia" y "Hashtags".
   - Tu propio feed de la cuenta: TikTok te sirve lo que está subiendo en tu nicho si interactúas solo con contenido de viajes/apps 15 min al día.
   - Guarda 3-5 audios trending por semana en favoritos ANTES de necesitarlos (los audios mueren en 5-10 días).

2. **Plantillas de adaptación (trend → Itineraya):**
   - *Audio de revelación/glow-up* (cualquier audio con "beat drop") → antes: grupo de WhatsApp caótico / después: itinerario generado. El formato del Script 3.
   - *Trend "cosas que me hacen sentir rica/o"* → "tener el viaje entero planificado sin haber hecho nada".
   - *Trend de "aesthetic vlog"* → tu Script 8 (seguir el itinerario IRL) con el audio del momento.
   - *Trends de texto conversacional ("nadie: / yo:")* → "Nadie: / Yo a las 3 AM generando itinerarios de viajes que no voy a hacer" ← este es MUY tu audiencia; genera identificación y comentarios "yo 😂".
   - *POV format* → "POV: es 2019 y planificar un viaje te llevaba 3 fines de semana" (nostalgia + contraste).

3. **Regla del 70/20/10:**
   - 70% formatos propios probados (cronómetro, remix, errores por destino)
   - 20% trends adaptados
   - 10% experimentos raros (de aquí saldrá tu próximo formato propio)

4. **Timing:** un trend en fase de subida (lo ves en Creative Center creciendo, <20k vídeos) vale oro; un trend con >200k vídeos ya está muerto para alcance. Si llegas tarde, no lo hagas.

5. **Audio original > audio trending para vídeos de demo:** los vídeos con tu voz explicando (Scripts 1, 2, 5, 6) retienen mejor con voz limpia + música de fondo al 10%. Reserva los audios trending para los sketches sin voz (Script 3).

## 1.4 Estrategia de hashtags por categoría

**Estructura por vídeo: 3-5 hashtags, nunca más.** Mezcla siempre: 1 grande (>1B vistas) + 2 medios (10-100M) + 1-2 de nicho/propios.

**Viajes (núcleo):**
- Grandes: `#viajes` `#viajar` `#travel`
- Medios: `#viajerosporelmundo` `#mochileros` `#escapadas` `#viajesbaratos` `#traveltok`
- Nicho: `#itinerario` `#itinerariodeviaje` `#planificarviaje` `#quever[destino]` (ej. `#queverenparis` — estos son los que convierten, la gente que los busca está PLANIFICANDO)

**Tech/IA (para los vídeos de demo):**
- Grandes: `#ia` `#inteligenciaartificial`
- Medios: `#appsutiles` `#apps` `#trucosdigitales` `#tecnologia`
- Nicho: `#iaparaviajar` `#appdeviajes`

**Lifestyle (para sketches y POV):**
- Medios: `#planesconamigas` `#viajeenpareja` `#viajeconamigos` `#pov`
- Estacionales: `#verano2026` `#semanasanta` `#puente[mes]` `#vacaciones2026` ← rota según calendario; los estacionales tienen CPM de descubrimiento altísimo 4-6 semanas antes de cada periodo vacacional.

**Propio:** `#itineraya` en TODOS los vídeos desde el día 1. No da alcance ahora; construye el archivo UGC que necesitarás en el mes 2-3.

**Asignación por tipo de vídeo:**
- Demos (Scripts 1,2,4,5,6): `#viajes #ia #appsutiles #itinerario #itineraya`
- Sketches (Script 3, 10): `#viajes #pov #planesconamigas #itineraya`
- Por destino (Scripts 4, 9): `#viajes #quever[destino] #[destino] #itinerariodeviaje #itineraya`
- IRL (Scripts 7, 8): `#traveltok #viajerosporelmundo #[destino] #itineraya`

## 1.5 Horarios y frecuencia de publicación

**Mercado España (tu deploy está en cdg1/París y tu SEO es en español — el público objetivo es claramente ES + LatAm secundario):**

- **Franjas óptimas España:** 13:00-15:00 (pausa comida, pico de scroll) y 20:00-23:00 (prime time absoluto). Domingo por la tarde-noche (18:00-22:00) es EL momento de planificación de viajes de la semana.
- **Si apuntas también a LatAm:** publica la franja de noche española (22:00-23:00 CET = tarde en México/Colombia/Argentina). Los vídeos de destinos americanos (NY, México) van mejor aquí.
- **Frecuencia realista y sostenible:**
  - Semanas 1-2: **1 vídeo/día**. Sí, siete a la semana. Las cuentas nuevas necesitan volumen para que el algoritmo las clasifique y para que TÚ aprendas qué funciona. Los formatos baratos (Script 3 y 4) hacen posible este ritmo.
  - Semana 3+: baja a **4-5/semana**, doblando en los formatos que muestren mejor retención.
  - Nunca menos de 3/semana: la cuenta se "enfría".
- **Regla del mismo pilar:** no publiques dos vídeos del mismo formato en días consecutivos; alterna demo → sketch → destino → IRL.
- **Hora fija para las series:** el vídeo del cronómetro (Script 4) siempre a la misma hora (ej. 13:30). Las series con cita fija generan hábito y seguidores, no solo vistas.

## 1.6 UGC: cómo hacer que los usuarios creen contenido sobre Itineraya

El UGC no aparece por deseo: se **diseña dentro del producto** y se **premia fuera**. Tienes ya la mitad de las piezas en el código.

**Palancas dentro del producto (ver PARTE 3 para la implementación técnica):**
1. **El link público ES el UGC mínimo.** Cada `/trip/<slug>` compartido en un grupo de WhatsApp es una pieza de UGC con tu marca (el footer de la página pública ya lleva logo + itineraya.com, `trip.$slug.tsx:330`). Optimiza esa página y multiplicas el UGC sin pedirle nada a nadie.
2. **Asset de Stories generado** (el fix del `ShareDialog`): cuando compartir en Stories produzca una imagen bonita 1080×1920 con la marca, cada Story de usuario será un anuncio. Hoy solo copia un link → cero UGC visual.
3. **Notificación de vistas**: "🎉 Tu itinerario de Bali lo han visto 100 personas" (el dato ya existe: `increment_trip_view_count`). El usuario que recibe esto lo pantallazea y lo presume. Es UGC de segundo orden.

**Palancas fuera del producto:**
4. **Reto mensual con hashtag:** "#MiViajeConIA — genera tu itinerario, grábate reaccionando, los 3 mejores se llevan 3 meses de plan Explorador (valor 48€)". Coste real para ti: ~0€ (es tu propio producto). Anúncialo en un vídeo fijado.
5. **Responde con vídeo a comentarios.** Cada comentario "¿funciona con [destino]?" → respuesta en vídeo generando ese destino (formato Script 4). TikTok premia las respuestas en vídeo y el comentarista lo comparte SIEMPRE.
6. **Duetos sembrados:** publica el Script 29 ("duetea esto") y pídeselo directamente a 10 microcreadores (ver plantilla de DM en la parte de Instagram; la misma sirve).
7. **Programa de creadores früh:** a los primeros 20 usuarios que publiquen un vídeo con la app, plan Viajero gratis 6 meses. Se gestiona a mano por DM; no construyas nada todavía.
8. **Reposts con permiso:** cada vídeo de usuario decente → pide permiso por DM y repostéalo en tu cuenta. Rellena tu calendario gratis y el creador se siente visto (y hace otro).

**El multiplicador definitivo del UGC es el incentivo de referidos** (invita 3 amigos → 1 mes de Viajero gratis), que hoy es imposible porque la atribución `ref=` está rota. Ver PARTE 3, cambio nº 1.

---

# PARTE 2 — INSTAGRAM: ESTRATEGIA COMPLETA

## 2.1 Plan de contenido semana a semana — Mes 1

**Arquitectura de la cuenta:**
- Bio: "Tu viaje planificado por IA en 60 segundos ✈️ Gratis, sin tarjeta 👇" + link (usa un link directo a itineraya.com con `?utm_source=instagram&utm_medium=bio` — nada de linktree, cada salto pierde 20-30% de clics).
- Highlights desde el día 1: "Cómo funciona" · "Destinos" · "Vuestros viajes" (UGC) · "Remix".
- Feed = escaparate (llegan de un reel y deciden en 5 s si sigues); Reels = adquisición; Stories = conversión y comunidad; Carruseles = saves (señal de calidad + audiencia planificadora).

### Semana 1 — Fundación (objetivo: cuenta creíble + primeros datos)

| Día | Feed/Reel | Stories |
|---|---|---|
| L | Reel 1: demo 60 segundos (adapta Script 1 TikTok) | Presentación: quién hay detrás, por qué existe Itineraya (3 stories) |
| M | Carrusel 1: "7 errores al planificar un viaje a París" (del contenido de `seo-destinations.ts`) | Encuesta: "¿Cuánto tardas en planificar un viaje? <1h / un finde / semanas" |
| X | Reel 2: POV organizada del grupo (Script 3) | Repost del reel + sticker de pregunta "¿a dónde vais este año?" |
| J | Carrusel 2: "Bali en 5 días: el itinerario exacto día a día" | Responde en stories a las respuestas de ayer generando 2-3 itinerarios en vivo |
| V | Reel 3: remix de un desconocido (Script 6) | Behind the scenes: "así se ve el feed de Explorar hoy" |
| S | Foto/diseño: quote card "Las vacaciones empiezan cuando dejas de planificarlas" | Quiz: "¿Museo del Louvre: qué día cierra?" (educativo + engagement) |
| D | Reel 4: cronómetro con el destino más pedido de la semana (Script 4) | **Domingo noche = prime de planificación:** stories "genera el tuyo ahora" con link |

### Semana 2 — Prueba social (objetivo: primeros compartidos y saves)

| Día | Feed/Reel | Stories |
|---|---|---|
| L | Reel 5: comparativa ChatGPT vs Itineraya (idea 12) | Resultados de la semana 1 en números (transparencia build-in-public) |
| M | Carrusel 3: "Tokio: 7 días, presupuesto real desglosado" | Encuesta presupuesto: "¿cuánto te gastas en un viaje de 1 semana?" |
| X | Reel 6: "cosas que la IA sabe de tu ciudad" (Script 5) | Pregunta: "¿de qué ciudad eres? La IA te dice un sitio que no conoces" → responde a 5 |
| J | Carrusel 4: "Cómo viajar barato en 2026: 9 trucos que usa nuestra IA" | Detrás de cámaras del carrusel |
| V | Reel 7: madre/padre reacciona (Script 10) | Repost + caja de preguntas abierta |
| S | UGC o repost del mejor comentario de la semana convertido en diseño | Sábado libre o repost |
| D | Reel 8: "3 escapadas de finde desde Madrid" (idea 15) | Domingo noche: link + "el lunes se planifica el próximo viaje" |

### Semana 3 — Doblar en lo que funciona

- Lunes: revisa métricas (ver PARTE 6). El reel con mejor **tasa de compartidos** define el formato del 50% de los reels de esta semana.
- Publica: 4 reels (2 del formato ganador, 1 destino estacional, 1 experimento), 2 carruseles (1 destino + 1 educativo), stories diarias.
- Introduce la **colaboración semanal** (ver 2.6): 1 reel en colab con un microinfluencer.
- Jueves: primer "Remix Challenge" en stories: publicas TU itinerario público y retas a remixearlo; los que lo hagan y te etiqueten, repost.

### Semana 4 — Conversión

- Mantén el ritmo de la semana 3.
- Añade 2 stories de conversión pura por semana: demo de 3 pantallas → "link en bio" → recordatorio con cuenta atrás para algo (ej. "genera tu viaje de Semana Santa antes de que se llenen los vuelos").
- Carrusel de cierre de mes: "Los 10 itinerarios más vistos de Itineraya este mes" (dato real de `increment_trip_view_count`) — cada slide con el destino y el link público en el caption. Es contenido, prueba social y SEO social a la vez.
- Último domingo: reel recopilatorio "1 mes generando vuestros viajes: los datos" (nº itinerarios, destino top, viaje más largo — sacas todo de tu DB).

## 2.2 Veinte ideas de reels con script completo

> Los reels 1-8 son las adaptaciones directas de los scripts TikTok 1, 3, 4, 5, 6, 9, 10 y 12 — regrábalos en 4:5/9:16 nativo, no republiques con marca de agua de TikTok (Instagram lo penaliza explícitamente). Aquí van los 12 ADICIONALES pensados para el lenguaje de Instagram (más aspiracional, más guardable, más "quiero esa vida").

**Reel 9 — "Guarda esto para tu viaje a Roma"**
[0-2 s] Texto: **"GUARDA esto si vas a ir a Roma"** sobre b-roll bonito de Roma.
[2-20 s] Voz + texto: "Día 1: Coliseo a primera hora con entrada reservada, Foro Romano, atardecer en el Aventino. Día 2: Vaticano un martes, NUNCA en lunes…" (día a día del itinerario generado, 3-4 s por día, cada día con su clip).
[20-25 s] "El itinerario completo con horarios y mapa, gratis en el link de mi bio. Lo generó una IA en un minuto."
CTA en caption: "🔖 Guárdalo y etiqueta a tu compañero/a de viaje". *Formato optimizado para saves — el save es la moneda del algoritmo de reels.*

**Reel 10 — "Aesthetic: planificando mi viaje de otoño"**
[0-25 s] Sin hablar. Estética: café, libreta, portátil abierto con Itineraya, teclear el destino, la generación, scroll por el itinerario con las fotos de Unsplash, apuntar en la libreta "día 1…". Música lo-fi trending.
Texto overlay mínimo: "planificar viajes en 2026 >>>".
CTA caption: "El plan entero salió de aquí → link en bio". *Este formato humaniza y va directo a la audiencia "romantizar tu vida".*

**Reel 11 — "Cosas que ya no hago desde que existe la IA"**
[0-2 s] "Cosas que ya NO hago para planificar un viaje:"
[2-18 s] Lista rápida con cortes: "❌ 40 pestañas de blogs abiertas ❌ Excel con horarios ❌ Discutir en el grupo 3 semanas ❌ Pagarle a nadie 80€ ❌ Pinterest boards que nunca miro"
[18-25 s] "✅ Escribo a dónde voy y qué me gusta. 60 segundos. Hecho." + demo flash de 4 s.
CTA: "¿Cuál de estas eras tú? 👇"

**Reel 12 — "Rating de viajes de la comunidad" (serie)**
[0-3 s] "Puntuando VUESTROS itinerarios, episodio 1."
[3-25 s] 3 viajes reales de `/explore` en pantalla: "Bali 7 días: metió Nusa Penida entre semana para evitar multitudes — 9/10. Roma 3 días: cuatro museos en un día, te vas a morir — 6/10, remixéalo con más calma…"
[25-30 s] "¿Quieres que puntúe el tuyo? Publícalo en Explorar y comenta 'hecho'."
*Loop: para participar tienen que crear cuenta + generar + publicar. El contenido genera usuarios directamente.*

**Reel 13 — "El itinerario según tu signo/vibe"** (formato identidad)
[0-25 s] "Tu viaje ideal según tu rollo: Si eres de museos y cafés → Viena 4 días [flash del itinerario]. Si eres de fiesta hasta las 6 → Berlín [flash]. Si eres de no hacer NADA → Menorca [flash]…"
CTA: "¿Cuál eres tú? Yo genero el itinerario del más votado esta semana."

**Reel 14 — "Lo que 8€ al mes me ahorran"** (para empujar plan Viajero)
[0-3 s] "Me preguntáis si vale la pena el plan de pago. Mirad."
[3-22 s] Demo del asistente IA (bloqueado en free — `assistant.tsx`): "Estoy EN París, ha empezado a llover y tengo la tarde libre. Le pregunto al asistente… y me reorganiza la tarde con planes de interior cerca de donde estoy."
[22-28 s] "7,99 al mes. Una caña y media en Malasaña. Vosotros veréis."
*Único reel de venta directa del mes. No más de 1 de cada 10.*

**Reel 15 — "Antes/Después del grupo de WhatsApp"**
[0-12 s] ANTES: capturas del caos (47 mensajes, "¿reservamos algo?", "yo me apunto a todo", cero decisiones).
[12-25 s] DESPUÉS: link de Itineraya en el grupo → todos ven la misma página → "¿votamos día 3 opción A o B?" → viaje cerrado.
CTA: "Manda este reel al grupo. Sí, a ESE grupo."

**Reel 16 — "Viajar sola: mi sistema"** (colaboración o propio si encaja)
[0-25 s] "Cuando viajo sola necesito tener el día estructurado sin parecer un tour del Imserso. Le pido a la IA: barrios seguros, actividades de día, cafés donde estar bien sola por la noche… y me da esto." + demo.
CTA: "Guárdalo para tu primer viaje sola. Y si ya lo has hecho, cuéntame abajo a dónde fuiste."

**Reel 17 — "Los 5 destinos más generados en Itineraya este mes"** (dato propio = contenido que nadie puede copiar)
[0-25 s] Countdown 5→1 con foto + un highlight del itinerario tipo de cada uno. "Número 1: y con diferencia… [destino]."
CTA: "¿Está el tuyo? El link para generar el tuyo, en la bio."

**Reel 18 — "Cómo se hace: de idea a viaje en 4 pasos"** (educativo puro para nuevos seguidores)
[0-28 s] Paso 1 destino y fechas → Paso 2 estilo y presupuesto → Paso 3 la IA genera → Paso 4 editas, compartes con el grupo, y al avión. Cada paso 5-6 s de pantalla real.
*Fíjalo en el perfil. Es el reel que responde "¿y esto qué es?" para siempre.*

**Reel 19 — "Reacciono al PEOR itinerario posible"**
[0-25 s] Genera a propósito algo absurdo ("24 horas en Tokio viendo TODO") y reacciona a cómo la IA intenta resolverlo con dignidad. Humor + demuestra los límites con gracia.
CTA: "¿Qué imposible le pido ahora?"

**Reel 20 — "Un año de viajes por 96€"** (aspiracional/matemático)
[0-25 s] "Plan Viajero: 7,99×12 = 96€ al año. Esto es lo que planifiqué con él: [flash de 6-8 itinerarios]. La agencia me cobraba 80€ por UNO."
CTA: "Empieza gratis — el plan free no caduca."

## 2.3 Carruseles educativos que generan saves y shares

**Por qué carruseles:** la audiencia que GUARDA carruseles de viajes es exactamente tu ICP (está planificando). El save le dice al algoritmo "esto es valioso" y te mete en Explorar.

**Anatomía del carrusel que se guarda (aplícala a todos):**
- Slide 1 = portada tipo titular con beneficio + número: "Roma en 4 días: el itinerario que me salvó el puente" — tipografía grande, foto potente, SIN logo grande (el logo mata el alcance en portada; ponlo pequeño en esquina).
- Slides 2-8 = 1 idea por slide, texto ≤30 palabras/slide, siempre con dato concreto (hora, precio, nombre del sitio).
- Penúltimo slide = el "momento producto": "todo esto lo generó la IA de Itineraya en 60 s — y lo puedes personalizar gratis".
- Último slide = CTA doble: "🔖 Guárdalo para tu viaje" + "📩 Mándaselo a quien viaja contigo". Pide el save Y el share explícitamente.

**Los 8 carruseles del mes 1 (con fuente de contenido real):**
1. "París en 4 días, día a día" — copia adaptada de `seo-destinations.ts` (¡ya está escrito!)
2. "Tokio: 7 días y cuánto cuesta de verdad" — genera el itinerario y desglosa
3. "7 errores al planificar cualquier viaje" — errores del intro de cada destino SEO
4. "Bali: qué hacer y qué evitar" — FAQ de seo-destinations
5. "Cómo usar la IA para viajar (guía 2026)" — funnel educativo genérico, el de mayor alcance potencial
6. "Nueva York con presupuesto: la ruta de 5 días" 
7. "Los 10 itinerarios más vistos de la comunidad" — dato de view_count, cierre de mes
8. "Escapadas de 2 días desde Madrid/Barcelona" — el más compartible en grupos de WhatsApp locales

**Producción eficiente:** plantilla única en Canva/Figma con tu paleta (sky-900 `#0c4a6e`, accent `#1E6B9A`, blanco — la de la app, coherencia total), 45 min por carrusel una vez tienes la plantilla. Las fotos, de Unsplash — como en la propia app.

## 2.4 Microinfluencers de viajes en España: identificación y contacto

**A quién buscas (el sweet spot):**
- 10.000-80.000 seguidores. Por debajo de 10k el alcance no paga el esfuerzo de gestión; por encima de 100k piden presupuesto serio y pierden engagement.
- Engagement rate >4% (likes+comentarios/seguidores en los últimos 10 posts — cuéntalo a mano en 2 min o con Modash/HypeAuditor free tier).
- **Español de España o afincados en España**, contenido de "cómo organizar/qué ver" (planners), no solo "mírame en la playa" (posers). Los planners tienen la audiencia que planifica = tu usuario.
- Señal de compra clave: que ya respondan preguntas de logística en comentarios ("¿qué zona recomiendas para dormir?"). Esa audiencia NECESITA tu producto.

**Cómo encontrarlos (método concreto, 2-3 h para una lista de 50):**
1. Busca en Instagram los hashtags `#viajerosespañoles`, `#viajarporelmundo`, `#escapadasconencanto`, `#quever` + ciudad española, y filtra por reels con 20k-200k vistas de cuentas pequeñas (eso es señal de contenido que funciona por encima de su tamaño).
2. Abre 3-4 cuentas grandes de viajes en español y mira **a quién comentan y con quién colaboran** — la capa de microcreadores orbita alrededor de las grandes.
3. En TikTok, busca "itinerario [destino]" y "que ver en [destino]" en español — los creadores que ya hacen CONTENIDO DE ITINERARIOS son tu prioridad absoluta: tu producto les ahorra su propio trabajo de producción.
4. Mira quién publica en los grupos de Facebook de viajes (PARTE 4) con buena recepción: muchos son microcreadores buscando audiencia.
5. Monta un Google Sheet: handle, seguidores, ER%, nicho (solo/pareja/familia/mochilero/lujo), email si está en bio, fecha de contacto, respuesta, estado.

**Qué ofrecer (escalera de 3 niveles):**
- Nivel 1 (coste 0): plan Explorador gratis 6 meses (valor ~96€) + su itinerario destacado en tu cuenta + link con su `ref` para que pueda enseñar cuánta gente usa su itinerario. *Con 10-80k seguidores, la mayoría acepta producto + visibilidad si el producto es bueno.*
- Nivel 2 (50-150€/reel): para los 5-10 mejores tras validar el nivel 1. Pide siempre: 1 reel en **colaboración** (ver 2.6) + link en bio 72 h + derechos de repost.
- Nivel 3 (afiliación): cuando el sistema de referidos esté arreglado (PARTE 3), 30% de la primera suscripción de cada usuario que traigan. Los conviertes de coste en canal.

## 2.5 Plantilla de DM para microinfluencers

**Regla:** DM corto para abrir, email para cerrar. Personaliza SIEMPRE la primera línea con contenido real suyo (los influencers detectan el copy-paste en 0,2 s).

**DM inicial (el que mandas 50 veces, personalizando [    ]):**

> Hola [nombre] 👋 Soy Iván, estoy construyendo Itineraya, una app española que genera itinerarios de viaje completos con IA en un minuto.
>
> Vi tu [reel/guía] sobre [destino concreto — di algo específico: "el truco del bus nocturno en Roma me pareció muy top"] y pensé que esto te puede molar de verdad: metes destino, días y tu estilo, y te saca el viaje día a día con horarios, sitios reales y mapa. Y puedes publicarlo para que tu audiencia lo "remixee" y lo adapte a sus fechas.
>
> ¿Te apetece probarla? Te activo el plan premium 6 meses sin compromiso ninguno — solo me interesa tu opinión de viajera pro. Si te gusta, hablamos de hacer algo juntos; si no, me dices qué mejorarías y tan amigos 🙂

**Por qué funciona:** personalización verificable + regalo sin contrapartida explícita + la palabra "remix" despierta curiosidad + salida fácil ("tan amigos") que baja la presión y SUBE la tasa de respuesta.

**Follow-up (a los 4-5 días, solo uno):**

> ¡Hola de nuevo! Sé que os llegan mil DMs — te dejo por aquí un itinerario de [destino sobre el que ella crea contenido] generado con la app por si te pica la curiosidad: [link público /trip/<slug>]. Si lo abres ya me cuentas 😄

*El follow-up con el link público es letal: no le pides nada, le enseñas el producto funcionando con SU destino. Y tú ves en el view counter si lo abrió.*

**Cierre (cuando responde con interés):** pasa a email/llamada con propuesta concreta de 3 líneas: qué publica (1 reel colab + 3 stories con link), cuándo (fecha), qué recibe (plan + fee si nivel 2 + repost). Todo por escrito aunque sea informal.

## 2.6 Colaboraciones de Instagram (co-authored posts) para duplicar alcance

La función "Colaboración" (invitar colaborador en un reel/post) hace que la MISMA pieza aparezca en ambos perfiles y se distribuya a ambas audiencias, sumando likes en un solo contador. Es la herramienta más infrautilizada del growth en IG.

**Cómo explotarla sistemáticamente:**
1. **Toda colaboración con influencer se publica como colab, no como mención.** El post sale del perfil DEL CREADOR (su audiencia confía en él) contigo como colaborador: tú heredas la distribución Y el post queda en tu grid como prueba social.
2. **Cadencia: 1 colab/semana desde la semana 3.** Con 4-6 colabs al mes de cuentas de 20-50k, expones la marca a 100-200k personas de nicho exacto por coste casi cero.
3. **Colabs no-influencer que nadie hace:**
   - Con **cuentas de destinos** (turismo local, hoteles boutique, hostels): reel "48 h en [su ciudad]" con el itinerario generado; ellos quieren contenido, tú quieres audiencia viajera.
   - Con **otras herramientas no competidoras** (apps de vuelos baratos, cuentas de "chollos viajeros" tipo alertas de vuelos): "encontré vuelo a Nápoles por 30€ [ellos] → itinerario de 3 días listo [tú]". Sus audiencias son 100% tu ICP.
   - Con **tus propios usuarios** creadores del reto UGC: el ganador del mes publica su viaje como colab contigo.
4. **Regla de oro del colab:** el contenido debe servir a la audiencia DEL OTRO, no a la tuya. El reel colab perfecto es 80% valor de viaje, 20% producto.

---

# PARTE 3 — VIRALIDAD INTEGRADA EN EL PRODUCTO

Esta es la parte más importante del documento. El contenido trae la primera ola; **el producto es el que convierte cada usuario en canal de adquisición**. Análisis basado en el código real, con los cambios ordenados por impacto/esfuerzo.

## 3.1 El loop viral: estado actual vs. estado objetivo

**El loop que quieres:**
```
Usuario genera itinerario → lo comparte (WhatsApp/Stories/link)
  → un no-usuario lo ve en /trip/$slug
    → ve la mitad del itinerario + PaywallGate
      → se registra para ver el resto / darle a Remix
        → genera SU itinerario (pico emocional)
          → lo comparte → …
```

**Qué eslabón funciona hoy y cuál no (auditado en código):**

| Eslabón | Estado | Evidencia |
|---|---|---|
| Generar → momento "wow" | ✅ Fuerte | Itinerario con fotos, estructura, <1 min (`itinerary.functions.ts`) |
| Wow → compartir | ⚠️ Débil | El ShareDialog existe pero hay que buscarlo; nada lo dispara en el pico emocional post-generación |
| Compartir → link atractivo | ⚠️ Medio | og:image sin branding (`trip.$slug.tsx:43`); "Stories" solo copia texto (`ShareDialog.tsx:122`) |
| Link → visita convencida | ✅ Fuerte | La página pública es full-fidelity a propósito (comentario en `trip.$slug.tsx:295`: "sells the product") |
| Visita → registro | ✅ Bueno | PaywallGate con blur a mitad de itinerario + Remix requiere auth (`handleRemix` → `requireAuth`) |
| Registro → atribución | ❌ ROTO | `ref=` se emite y nadie lo lee. Cero atribución, cero recompensas posibles |
| Nuevo usuario → genera → comparte | ⚠️ Débil | Mismo problema del eslabón 2, y sin incentivo |

**El K-factor se calcula como: (invitaciones enviadas por usuario) × (conversión de invitación a registro).** Hoy no puedes medir ninguno de los dos factores. Por eso el cambio nº 1 es de datos, no de features.

## 3.2 Cambios concretos, ordenados (con ficheros)

### Cambio 1 — Arreglar la atribución de referidos ⚡ (1-2 h de trabajo, desbloquea todo lo demás)

**Problema:** `ShareDialog.tsx:42-47` construye `?utm_source=X&utm_medium=share&ref=<userId>`, pero ni `trip.$slug.tsx` ni `AuthModalProvider.tsx` leen esos parámetros.

**Implementación:**
1. En `src/routes/trip.$slug.tsx`: en el `loader` o en un `useEffect` del componente, leer `ref` y `utm_source` de `window.location.search` y persistirlos en `localStorage` (`itineraya_ref`, `itineraya_utm_source`, con timestamp; ventana de atribución de 30 días).
2. En `src/components/auth/AuthModalProvider.tsx`: al hacer `signUp`, adjuntar `{ referred_by, utm_source }` en `options.data` (user metadata de Supabase).
3. Migración SQL: columna `referred_by uuid` y `acquisition_source text` en `profiles`, pobladas por el trigger de creación de perfil desde `raw_user_meta_data`.
4. Vista/consulta de dashboard: registros por `utm_source` y ranking de usuarios por referidos traídos.

**Qué desbloquea:** medir K-factor por canal (WhatsApp vs Instagram vs native — los `utm_source` ya distinguen los tres), recompensar referidores, pagar afiliación a influencers.

### Cambio 2 — Momento de compartir post-generación ⚡ (2-3 h)

**Problema:** el pico emocional es el segundo en que aparece el itinerario generado, y ahí no pasa nada social. El ShareDialog solo se abre desde el botón de compartir en `my-trip.$tripId.tsx`.

**Implementación:** en `src/routes/_authenticated/my-trip.$tripId.tsx`, cuando el itinerario acaba de generarse (primera carga con itinerario recién creado): micro-celebración (confetti ligero, 1 s) → banner/toast persistente: **"Tu viaje a {destino} está listo ✈️ Mándaselo a tus compañeros de viaje"** con botón que abre el ShareDialog ya existente. No abras el drawer automáticamente (interrumpir el "saboreo" del itinerario molesta); el banner que espera al scroll funciona mejor.

**Benchmark:** pedir el share en el "peak moment" multiplica por 3-5 la tasa de shares frente al botón pasivo de la esquina.

### Cambio 3 — og:image dinámico con branding (medio día)

**Problema:** `trip.$slug.tsx:43` usa la foto Unsplash cruda como og:image. En WhatsApp (tu canal nº 1 en España) la preview es una foto anónima: no dice qué es, cuántos días, ni que es gratis hacerse uno.

**Implementación:** ruta server `/api/og/$slug` con `@vercel/og` (satori, corre en Vercel Edge, tu deploy ya es Vercel): hero del viaje de fondo + overlay degradado (el mismo `from-black/70` de la página) + "**{destino}** · {n} días · itinerario día a día" + wordmark de Itineraya + "creado con IA en 60 segundos". Cambiar la meta `og:image` para apuntar ahí. **Cada link pegado en cualquier chat o red pasa a ser un anuncio con mensaje.**

### Cambio 4 — Asset real para Stories (1-2 días, el de mayor impacto en UGC)

**Problema:** el botón "Copiar para Stories" (`ShareDialog.tsx:122-131`) copia un link y muestra un toast diciendo que lo pegues en tu historia. Fricción máxima, resultado feo, nadie lo hace.

**Implementación:** al pulsarlo, generar en cliente una imagen 1080×1920 (canvas o `html-to-image` sobre un componente oculto): hero del viaje + "{destino} · {n} días" + 3 actividades destacadas del día 1 con sus emojis (ya vienen en el JSON del itinerario) + logo + la URL corta legible. En móvil, entregarla vía `navigator.share({ files })` — abre directamente la share sheet con Instagram Stories como destino. Fallback: descargar la imagen + copiar link.

**Por qué es el cambio más rentable en UGC:** cada Story es efímera pero llega al círculo de máxima confianza del usuario, y las historias de "mira mi próximo viaje" son de las más publicadas del mundo. Les estás dando el asset que YA quieren publicar.

### Cambio 5 — Social proof con datos que ya tienes (2-3 h)

- Exponer el contador de vistas en la página pública: "👀 {n} viajeros han visto este itinerario" (el RPC `increment_trip_view_count` ya escribe; añade lectura en `getPublicTrip`, `share.functions.ts:101`).
- Contador de remixes: incrementa un `remix_count` cuando `handleRemix` completa el onboarding, y muéstralo: "🔀 remixeado {n} veces".
- **Email al autor** (con `lifecycle-emails.ts`, que ya existe): "Tu itinerario de {destino} ha superado las {50/100/500} vistas 🎉 — compártelo también en Instagram". Trae de vuelta al usuario Y le pide otro share. Retención + viralidad en un solo email.

### Cambio 6 — Incentivo de referidos (1 día, requiere Cambio 1)

"**Invita a 3 amigos → 1 mes de plan Viajero gratis**" (COGS ≈ céntimos: tokens de Haiku + Unsplash). Banner en `dashboard.tsx` con la barra de progreso 0/3 y su link personal (el mismo formato `?ref=` del ShareDialog). Al tercer registro atribuido, activar el plan un mes (columna `plan` en `profiles` + fecha de expiración). El plan Viajero de regalo además le enseña el asistente IA → mejora la conversión a pago cuando caduque.

### Cambio 7 — Compartir la invitación de tripmates por link (2 h)

`tripmates.functions.ts` solo invita por email (fricción: pedir el email de tus amigos). Añade "copiar link de invitación" reutilizando el token de `invite.$token.tsx` → se comparte por WhatsApp como todo en España. Cada viaje en grupo se convierte en 2-5 registros casi garantizados, porque los invitados tienen una razón egoísta para registrarse (ver SU viaje).

### Cambio 8 — Remix visible en la página pública para no-logueados (1 h)

Hoy `handleRemix` funciona pero el valor no se comunica antes del auth-gate. Añade bajo el botón: "La IA adaptará este viaje a tus fechas y estilo — gratis". El remix es tu mejor razón-para-registrarse; véndela en el punto de decisión.

## 3.3 Qué elementos visuales del itinerario son más compartibles (y cómo potenciarlos)

Analizando el render de `PublicDayCard` (`trip.$slug.tsx:339-411`) y `my-trip.$tripId.tsx`:

1. **La cabecera de día con foto** (`aspect-[16/7]`, título sobre degradado) es tu unidad más pantallazeable: foto bonita + "Día 3 · Cascadas y templos del norte". **Potenciar:** añade el wordmark pequeño y semi-transparente en la esquina de la imagen del día → cada pantallazo que circula por WhatsApp lleva marca (marca de agua elegante, no invasiva; los usuarios pantallazean días sueltos constantemente para mandarlos al grupo).
2. **La tarjeta de actividad con hora + emoji** (bloque `h-12 w-14` con la hora en `bg-sky-900`) es icónica y legible en miniatura. **Potenciar:** es el elemento a reutilizar en el asset de Stories (Cambio 4) — 3 tarjetas de actividad apiladas se leen perfectamente en un móvil.
3. **El resumen del viaje** (bloque `trip.summary`) es la pieza citable — dos frases evocadoras generadas por la IA. **Potenciar:** pide en el prompt de `itinerary.functions.ts` que el summary sea "compartible: evocador, concreto y en segunda persona" — es texto que la gente copia en el caption de su post.
4. **El mapa** (`SmartTripMap`) es visualmente único frente a un PDF/ChatGPT pero no aparece en la página pública. **Potenciar:** añade el mapa a `/trip/$slug` (aunque sea estático) — en las comparativas de TikTok ("ChatGPT vs Itineraya") el mapa es el momento "esto es otra cosa".
5. **El número gordo** — "7 días · 23 actividades · 4 barrios": añade esta línea de stats bajo el hero público. Los números concretos son lo primero que la gente lee en un pantallazo.

## 3.4 Diseño de los momentos de sharing (resumen de dónde pedir el share)

| Momento | Emoción | Qué pedir | Estado |
|---|---|---|---|
| Itinerario recién generado | Pico de logro | "Mándaselo a tus compañeros" (WhatsApp) | ❌ Construir (Cambio 2) |
| Añadir tripmates | Anticipación social | Link de invitación | ⚠️ Solo email (Cambio 7) |
| X vistas alcanzadas (email) | Orgullo/validación | "Compártelo también en Stories" | ❌ Construir (Cambio 5) |
| Antes del viaje (D-7, lifecycle email) | Excitación máxima | Story "¡me voy a {destino}!" con asset | ❌ Construir (emails ya existen) |
| Después del viaje (D+2) | Nostalgia feliz | "Publica tu viaje en Explorar para otros viajeros" | ❌ Construir |
| Visitante en página pública | Curiosidad/FOMO | Registro (PaywallGate) o Remix | ✅ Ya existe |

La regla: **nunca pidas el share en un valle emocional** (mitad del onboarding, pantalla de pago, error). Siempre en picos.

---

# PARTE 4 — COMUNIDADES

## 4.1 Las 30 comunidades de viajeros en español

> ⚠️ Los nombres de grupos de Facebook/Discord cambian y nacen/mueren; verifica cada uno antes de entrar (búsqueda literal en cada plataforma). Los subreddits y foros listados son estables. Miembros = orden de magnitud al cierre de conocimiento.

**Reddit (7):**
1. r/viajes — el subreddit de viajes en español de referencia. Estricto con la autopromoción: solo valor.
2. r/espanol — general, hilos de viajes frecuentes.
3. r/askspain — muchos hilos "visiting Spain, what to do in X" (puedes responder con itinerarios).
4. r/Mochileros — mochileo en español, presupuesto bajo.
5. r/argentina, r/mexico, r/Colombia (megathreads de viajes) — LatAm viaja a Europa y busca itinerarios en español.
6. r/travelhacks y r/solotravel — en inglés, pero admiten herramientas si aportas; úsalo solo cuando tengas versión EN pulida.
7. r/SideProject + r/webdev — para el ángulo build-in-public (no viajeros, pero traen early adopters que toleran bugs).

**Facebook Groups (10) — busca estos nombres/variantes; los grupos de viajes en español son ENORMES aquí:**
8. "Viajeros por el mundo" (varias variantes, 100k-500k miembros)
9. "Mochileros por el mundo" / "Mochileros España"
10. "Viajar a Japón" (los grupos por destino son los que convierten: gente en fase activa de planificación)
11. "Viajar a Tailandia / Sudeste Asiático"
12. "Viajar a Italia — consejos y dudas"
13. "Viajes y escapadas España" / "Escapadas con encanto"
14. "Viajar barato / chollos viajeros" (audiencia de las cuentas de alertas de vuelos)
15. "Familias viajeras" (viajar con niños — tu campo `companion` encaja perfecto)
16. "Mujeres que viajan solas" (comunidad grande y muy activa en español; entra con respeto y solo si aportas, mejor aún: que entre una colaboradora)
17. "Viajeros españoles por [destino]" — hay uno por casi cada destino grande

**Foros (5):**
18. **losviajeros.com** — EL foro de viajes en español. Subforos por destino con hilos de "ayuda con mi itinerario" TODOS los días. Tu comunidad más valiosa: la gente publica literalmente su borrador de itinerario pidiendo correcciones.
19. Foro de TripAdvisor en español — hilos por destino.
20. mundonomada / foros de mochileros (verificar actividad).
21. Foro CharcoTrip y foros LatAm de viajes a Europa.
22. Forocoches — subforo de viajes. Tono muy suyo; si no lo conoces, no entres. Si lo conoces, un hilo bien hecho ("he montado una IA que te planifica el viaje, destrozadla") puede traer miles de visitas.

**Discord/Telegram (4):**
23. Servidores de Discord de "digital nomads en español" (buscar "nómadas digitales").
24. Grupos de Telegram de chollos de viajes (Viajeros Piratas y similares tienen comunidades satélite).
25. Discord de comunidades tech españolas (MoureDev, midudev — canal #proyectos: build-in-public, feedback técnico y primeros usuarios).
26. Grupos de Telegram por destino ("Españoles en Tokio", "Españoles en NY") — los residentes responden dudas de viajeros; tu herramienta les ahorra repetirse.

**Otros (4):**
27. Menéame — /m/viajes; un "he hecho esto" honesto puede portar bien.
28. Product Hunt — lanzamiento formal (en inglés) cuando el loop viral esté arreglado; los hunters españoles te darán push.
29. Indie Hackers + Build in Public en X/Twitter en español (hashtag #buildinpublic, comunidad española activa) — no trae viajeros, trae amplificadores.
30. Comentarios de YouTube de vídeos "qué ver en X días en [destino]" en español — no es una comunidad formal, pero responder dudas de planificación en comentarios recientes con ayuda real (y tu link SOLO si preguntan) es tráfico gratis de intención máxima.

## 4.2 Mensajes de presentación por tipo de comunidad

**No existe un mensaje para 30 comunidades: existe un mensaje por CULTURA de comunidad.** Cuatro plantillas:

**A) Foros de planificación (losviajeros, TripAdvisor, grupos por destino) — NUNCA te presentes; responde.**
Plantilla de respuesta a un hilo "ayúdame con mi itinerario de 5 días en Roma":
> ¡Hola! Te dejo cómo lo organizaría yo: [respuesta REAL y útil de 5-10 líneas: agrupa por zonas, avisa del cierre del lunes, sugiere el orden]. 
> Por cierto, yo para el esqueleto inicial uso una app de IA que estoy construyendo (Itineraya) — te generé la base y la retoqué a mano: [link /trip/<slug> del itinerario generado PARA SU CASO]. Si te sirve, la personalizas gratis con tus fechas.
*La clave: el link es un itinerario hecho para ELLOS, no tu homepage. Es un regalo, no un anuncio. El slug además le enseña la página con el CTA.*

**B) Grupos de Facebook generalistas — preséntate con historia, no con producto:**
> ¡Hola grupo! 👋 Llevo tiempo leyendo por aquí (los hilos de [tema reciente real del grupo] me han salvado un par de veces). Soy desarrollador y viajero, y de la frustración de planificar mi viaje a [destino] con 40 pestañas abiertas monté una herramienta que genera el itinerario día a día con IA en un minuto. Es gratis. La comparto por si a alguien le sirve para el borrador inicial — y sobre todo: si la probáis, decidme qué falla, que la estoy mejorando cada semana. [link]
*Publica esto SOLO donde las normas permitan autopromoción (léelas; muchos tienen "día de autopromo" los viernes). Donde no, aplica la plantilla A.*

**C) Reddit — transparencia radical o baneo:**
> **[Hago yo] Una IA que te genera el itinerario de viaje día a día — gratis, busco feedback brutal**
> Hola r/viajes. Full disclosure: es mi proyecto. Tras [historia personal de 2 líneas], monté Itineraya: describes el viaje y te genera el plan completo con horarios, sitios y mapa. Gratis sin tarjeta. Lo que me interesa de verdad: que la destrocéis. ¿Qué le falta? ¿Qué destino le pongo difícil? Genero en los comentarios el que me pidáis y juzgáis el resultado.
*El truco de "pedidme un destino y lo genero en comentarios" convierte el post en un show interactivo — cada respuesta tuya con un itinerario re-engancha el hilo y lo sube.*

**D) Comunidades tech/build-in-public:**
> Semana 12 construyendo Itineraya (itinerarios de viaje con IA, TanStack Start + Claude + Supabase). Esta semana: arreglé el loop de referidos que emitía ?ref= sin capturarlo nunca 🤦 y monté OG images dinámicas con satori. Números honestos: [X] registros, [Y]% comparten su itinerario. AMA / feedback bienvenido.
*A esta gente le vende la tripa del producto, no el producto.*

## 4.3 Calendario de comunidades — Mes 1

**Regla 9:1 — nueve aportes de valor puro por cada mención del producto.** Y cuenta personal SIEMPRE (tu nombre y cara), no cuenta de marca: las comunidades toleran a personas, no a logos.

- **Semana 1 (solo escuchar y aportar, CERO links):** únete a las 10-15 comunidades prioritarias (losviajeros + 5 grupos FB de destinos top + r/viajes + 2 Telegram + Discord tech). Responde 3-4 hilos/día con ayuda real sin mencionar Itineraya. Objetivo: historial y karma.
- **Semana 2 (valor con producto implícito):** sigue respondiendo; cuando un hilo pida literalmente un itinerario, usa la plantilla A (link a /trip/<slug> generado para su caso). 2-3 links así por semana, máximo. Presentación tipo D en 2 comunidades tech.
- **Semana 3 (presentaciones):** post tipo C en r/viajes un martes o miércoles por la mañana. Post tipo B en 2-3 grupos de FB que permitan autopromo. Sigue el ritmo de respuestas de valor (esto no para nunca).
- **Semana 4 (interactivo):** hilo "pedidme un destino y os genero el itinerario en comentarios" en el grupo/foro donde mejor recepción tuviste. Es tu formato franquicia de comunidades: barato, útil, demuestra el producto en directo.

**Tiempo presupuestado: 45-60 min/día.** Más es insostenible; menos no construye reputación.

## 4.4 Cómo aportar valor sin parecer spam — las 6 reglas

1. **Responde la pregunta completa aunque no menciones tu producto.** Si tu respuesta solo tiene valor con el link, es spam con decoración.
2. **El link siempre es un itinerario concreto para el caso concreto** (/trip/<slug>), jamás la homepage. Regalo > anuncio.
3. **Declara siempre que es tuyo.** "Una app que estoy construyendo" desarma el 90% de la hostilidad; que te pillen ocultándolo te quema la comunidad para siempre.
4. **Pide feedback, no usuarios.** "Decidme qué falla" invita a participar; "registraos" invita a ignorarte.
5. **Vuelve a los hilos.** Responde a cada respuesta. Un hilo atendido escala posiciones; un hilo abandonado muere y te marca como drive-by spammer.
6. **Acepta el no.** Si un mod borra tu post, pregúntale amablemente las normas y no reincidas. Los mods de losviajeros y r/viajes tienen memoria de elefante.

---

# PARTE 5 — PLAN DE ACCIÓN DÍA A DÍA: 30 DÍAS

> Presupuesto de tiempo asumido: 3-4 h/día. Si tienes menos, mantén intactos: los fixes de producto (días 1-3), el vídeo diario de TikTok y los 45 min de comunidades; recorta lo demás.

## Días 1-7: cimientos + primeras publicaciones

**Día 1 (producto):**
- Implementa el **Cambio 1** (captura de `ref` + `utm_source` → metadata de signup → columna `referred_by`). Sin esto, el resto del mes vuela a ciegas.
- Implementa el **Cambio 2** (banner de compartir post-generación).
- Crea las cuentas: TikTok @itineraya, Instagram @itineraya (o variante disponible), con la misma foto, bio y link con UTM.

**Día 2 (producto + preparación):**
- Implementa el **Cambio 3** (og:image dinámico). Pruébalo pegando un link en WhatsApp y en el debugger de metatags.
- Monta el Google Sheet de microinfluencers y llénalo con los primeros 15 (método de 2.4).
- Graba en bruto el material de 3 vídeos (Scripts 1, 3 y 4) — grabar en lotes ahorra la mitad del tiempo.

**Día 3 (contenido):**
- Publica **TikTok #1** (Script 1, demo Bali) a las 13:30 y **Reel 1** (mismo material re-editado nativo) a las 20:00.
- Únete a las primeras 8 comunidades. Solo lee y responde 3 hilos con valor puro.
- Edita el vídeo del cronómetro (Script 4).

**Día 4:**
- TikTok #2 (Script 4, cronómetro con Tokio) 13:30. Stories IG: presentación + encuesta.
- Comunidades: 45 min de respuestas (sin links).
- Manda los **primeros 10 DMs** a microinfluencers (plantilla 2.5).
- Implementa el **Cambio 5a** (mostrar view count en página pública) — 2 h.

**Día 5:**
- TikTok #3 (Script 3, POV organizada — sin voz, audio trending que hayas guardado). Reel 2 = el cronómetro.
- Carrusel 1 (París, reciclando `seo-destinations.ts`).
- 10 DMs más. Comunidades 45 min.

**Día 6:**
- TikTok #4 (Script 9, errores de París — mismo research del carrusel de ayer, doble uso).
- Graba el lote 2 (Scripts 5, 6 y 2).
- Comunidades: primer link contextual tipo plantilla A si surge un hilo que lo pida.

**Día 7 (domingo — día fuerte de viajes):**
- TikTok #5 (Script 6, Remix) 13:30 + Reel 3 (POV) 19:00.
- Stories de domingo noche (20-22h): "es domingo, se planifica el próximo viaje" + demo 3 pantallas + link.
- **Revisión semanal nº 1** (30 min): apunta en una hoja las métricas de la PARTE 6. Qué vídeo tuvo mejor retención y más compartidos. Formatos ganadores → semana 2.

## Días 8-14: escalar lo que funcionó, matar lo que no

**Día 8:**
- Decisión de datos: de los 5 TikToks, ¿cuál tiene mejor retención al 50% y más shares? Esta semana haces 3 vídeos de ese formato con destinos/ángulos distintos, 2 de formatos aún no probados y ninguno del peor.
- 10 DMs más (vas 30/50). Responde a los que contestaron; a los interesados, propuesta concreta.
- Implementa el **Cambio 4** (asset de Stories 1080×1920) — empieza hoy, es el más gordo (1-2 días).

**Día 9:**
- TikTok #6 (formato ganador, variante). Carrusel 2 (Tokio con presupuesto).
- Comunidades: post build-in-public (plantilla D) en 2 comunidades tech.

**Día 10:**
- TikTok #7 (Script 5, "cosas de mi ciudad" — verifica los sitios en Maps antes).
- Reel 4 + Stories con caja de preguntas "¿de dónde eres? te digo un sitio que no conoces" → responde generando en vivo.
- Termina y despliega el Cambio 4. Pruébalo tú mismo publicando TU Story.

**Día 11:**
- TikTok #8 (Script 2, comparativa 80€).
- 10 DMs (40/50). Primer acuerdo de colaboración cerrado idealmente esta semana → agenda el reel colab para la semana 3.
- Comunidades 45 min. Si r/viajes tiene buen ambiente, prepara el post tipo C para mañana.

**Día 12:**
- **Post en r/viajes** (plantilla C, martes/miércoles por la mañana). Bloquea 2 h para responder comentarios generando itinerarios a demanda — el hilo vive de tu presencia.
- TikTok #9 (respuesta en vídeo al mejor comentario de la semana).

**Día 13:**
- TikTok #10 (Script 7, viaje sorpresa con /inspire — siembra la serie IRL).
- Carrusel 3 (7 errores universales). Últimos 10 DMs (50/50).
- Implementa el **Cambio 7** (link de invitación de tripmates).

**Día 14 (domingo):**
- TikTok #11 + Reel 5. Stories de domingo noche (ritual fijo ya).
- **Revisión semanal nº 2:** además de contenido, primer vistazo a datos de producto: ¿cuántos registros con `utm_source`? ¿qué canal de share convierte más? ¿el banner post-generación sube la tasa de shares? Documenta en la hoja.

## Días 15-30: consolidar audiencia y convertir en usuarios

**Ritmo de crucero (días 15-30):** 4-5 TikToks/semana (60% formato ganador, resto experimentos), 3-4 reels/semana, 2 carruseles/semana, stories diarias, comunidades 45 min/día, 1 colab/semana. Sobre ese ritmo, los hitos:

**Día 15:** lanza el **reto UGC #MiViajeConIA** (vídeo fijado en TikTok + reel + stories): reacciona a tu itinerario generado, los 3 mejores ganan 3 meses de Explorador. Fecha de cierre: día 28.

**Día 16-17:** si cumpliste el Script 7 (likes objetivo), **haz el viaje sorpresa del finde** y graba la serie IRL (Script 8). Es contenido para 3-5 vídeos de la semana siguiente y el de mayor conversión del mes. El link de tu itinerario público en la bio durante toda la serie.

**Día 18:** primer **reel en colaboración** con el microinfluencer cerrado. Publica desde SU cuenta contigo de colaborador.

**Día 19-20:** implementa el **Cambio 6** (banner "invita a 3 amigos → 1 mes Viajero") — ya tienes atribución del día 1 y dos semanas de datos de que funciona.

**Día 21 (domingo):** revisión semanal nº 3. Primera medición de K-factor con datos reales (fórmula en PARTE 6). Publica los vídeos IRL del viaje.

**Día 22-24:** segundo post interactivo en comunidades ("pedidme destino, genero en comentarios") en el foro con mejor recepción. Segunda colab. Email de "tu itinerario superó X vistas" activado (Cambio 5c) si hay volumen.

**Día 25-27:** carrusel "los 10 itinerarios más vistos del mes" (dato real). Tercer colab o repost de UGC del reto. TikTok con datos propios ("los 5 destinos más generados" — idea 22).

**Día 28:** cierre del reto UGC: anuncia ganadores en vídeo, repostea los 3 mejores (con permiso), actívales el premio a mano.

**Día 29:** ordena la casa: responde todos los DMs/comentarios pendientes, actualiza el sheet de influencers (quién publicó, quién no, resultados), deja grabado material para la semana siguiente.

**Día 30 — LA REVISIÓN DEL MES (2 h, con la hoja delante):**
1. ¿Qué formato de vídeo tiene mejor ratio visitas→clics a bio? (no vistas: CLICS)
2. ¿Qué canal (`utm_source`) trae más registros y cuál convierte mejor a "generó itinerario"?
3. ¿Cuál es el K-factor y la tasa de share post-generación?
4. Decide el mix del mes 2: dobla los 2 formatos y el canal ganadores; mata lo que esté por debajo de la mediana; el presupuesto de influencers (si lo hay) va solo al nivel 2 de los que ya publicaron con resultados.

---

# PARTE 6 — MÉTRICAS DE ÉXITO

## 6.1 Qué medir cada semana, por canal

**Panel semanal (una fila por semana en una hoja de cálculo; 30 min cada domingo):**

**TikTok:**
- Vistas totales y mediana de vistas por vídeo (la mediana te dice tu suelo real; la media la distorsiona un viral).
- **Retención al 50%** por vídeo (Analytics → vídeo): es LA métrica de formato. <35% = formato roto; >50% = dobla ese formato.
- **Shares y saves por 1.000 vistas** (≥5/1.000 es señal fuerte).
- Clics al link de bio (visitas al perfil × CTR estimado; TikTok lo da si tienes cuenta business).

**Instagram:**
- Alcance de reels y % de alcance en no-seguidores (>70% = el algoritmo te distribuye; <40% = contenido solo para tu burbuja).
- **Saves en carruseles** (≥10 saves/1.000 alcance = el carrusel funciona).
- Respuestas a stories y clics en link (stories = tu termómetro de comunidad).
- Nuevos seguidores/semana y colabs publicadas.

**Comunidades:**
- Respuestas publicadas, hilos con link contextual, upvotes/reacciones netas, clics (mide con el UTM `utm_source=reddit|facebook|losviajeros` en cada link — extiende el patrón que ya usa el ShareDialog).

**Producto (SQL sobre tu Supabase — todo existe tras el Cambio 1):**
- Registros/semana, segmentados por `acquisition_source`.
- **Activación:** % de registros que generan ≥1 itinerario en 24 h (tu métrica estrella de onboarding).
- **Tasa de share:** % de itinerarios generados que activan `share_slug` (`enableTripShare`).
- Vistas de páginas públicas (suma de `view_count`) y **conversión visita pública → registro**.
- Registros con `referred_by` ≠ null (= registros virales).
- Upgrades a Viajero/Explorador (Stripe) y desde qué origen.

## 6.2 El embudo viral y sus números objetivo

```
Generó itinerario
  → % que comparte (objetivo mes 1: 15% · mes 3: 30% con Cambios 2+4+6)
    → vistas por link compartido (objetivo: 5+ · WhatsApp en grupos da 3-15)
      → % visita → registro (objetivo: 8-12% con el PaywallGate actual)
        → % registro → genera (objetivo: >60%; si es menor, el problema es onboarding, no marketing)
```

**K-factor = shares por usuario × vistas por share × conversión a registro.**
Ejemplo con los objetivos del mes 3: 0,30 × 5 × 0,10 = **0,15**. No es crecimiento autosostenido (eso exige >1), pero significa que cada 100 usuarios de pago-de-contenido te regalan 15 gratis, y componiendo mensualmente abarata tu adquisición un 15% perpetuo. Los productos de viajes rara vez superan K=0,5 (frecuencia de uso baja); tu palanca real es K moderado + contenido fuerte + SEO.

## 6.3 Cuándo pivotar: reglas de decisión predefinidas

Decide los umbrales HOY para no autoengañarte en el día 30:

| Señal a las 4 semanas | Diagnóstico | Acción |
|---|---|---|
| Mediana TikTok <500 vistas tras 20 vídeos | Formatos o ganchos rotos | No abandones el canal: cambia los 2 primeros segundos de TODO (el gancho explica el 80% del problema). 2 semanas más y reevalúa |
| Vídeos con vistas pero <1% clic a bio | El contenido entretiene pero no vende | El CTA es el problema: pasa de "link en bio" a "busca Itineraya" (más fricción aparente, más intención real) y prueba vídeos con la URL en pantalla |
| Clics pero conversión visita→registro <4% | Landing/página pública no convierte | Trabaja `/` y el PaywallGate (copy, prueba social, velocidad), pausa la mitad del esfuerzo de contenido hasta arreglarlo — llenar un cubo agujereado es la muerte |
| Registro→genera <40% | Onboarding roto | Todo el esfuerzo a `new-trip.tsx`/onboarding esa semana. Nada más importa |
| Tasa de share <8% tras Cambios 2+4 | El momento share no funciona | Prueba incentivo directo (Cambio 6 más agresivo: 1 amigo = 1 semana premium) y entrevista a 5 usuarios |
| Influencers: <10% de respuesta a 50 DMs | Pitch o segmento equivocado | Reescribe la primera línea (más personal), baja a cuentas de 5-20k, y prueba email en vez de DM |
| Una comunidad te trae >30% de los registros | 🎉 No es problema: es tu canal | Reasigna: dobla el tiempo ahí, recorta el peor canal |

**Regla general de pivote:** cambia UNA variable por ciclo de 2 semanas (gancho, o CTA, o canal, o landing). Si cambias tres cosas a la vez y mejora, no sabrás cuál pagar más.

## 6.4 Qué números indican que la estrategia FUNCIONA

**Hitos de "esto va bien" (no vanity):**
- ✅ Mes 1: 300-800 registros; ≥1 vídeo >50k vistas; tasa de activación >50%; primer usuario que llega por `referred_by`.
- ✅ Mes 2: mediana TikTok >2.000 vistas; 10-20% de registros con origen `share`/`ref` (el producto empieza a autovenderse); 2-3 microinfluencers publicando por producto (no por fee); primeras 10 suscripciones de pago.
- ✅ Mes 3: K-factor ≥0,15 sostenido; una serie de contenido con audiencia propia (comentarios pidiendo el próximo episodio); /explore con publicaciones semanales orgánicas de usuarios que no conoces; CAC orgánico <2€ (horas invertidas ÷ registros, valorando tu hora honestamente).

**Las tres métricas que resumen todo (si solo miras tres):**
1. **Registros semanales por fuente** — crece y diversifica, o no hay negocio.
2. **% de itinerarios compartidos** — el corazón del loop viral.
3. **Activación (registro→genera en 24 h)** — si esto cae, todo lo demás es ruido.

---

## Apéndice — Resumen ejecutivo de una página

1. **Arregla la atribución `ref=` HOY** (`trip.$slug.tsx` + `AuthModalProvider.tsx` + columna `referred_by`). Emites datos de oro y los tiras al suelo.
2. **Pide el share en el pico emocional** (post-generación) y dale a Stories una imagen de verdad, no un link.
3. **TikTok con volumen y formatos seriados** (cronómetro diario, remix, IRL siguiendo a la IA); Instagram para saves y colaboraciones; comunidades con la regla 9:1 y links que son regalos (/trip/<slug> hecho para el hilo).
4. **50 DMs a microinfluencers planners de 10-80k** con producto gratis primero, fee después, afiliación al final.
5. **Mide el embudo con los UTM que ya emites** y decide con los umbrales de 6.3, no con sensaciones.

El producto ya tiene el motor viral a medio construir — remix, página pública que vende, gate bien puesto, contador de vistas. Lo que falta son 4-5 días de código y 30 días de disciplina de contenido.


