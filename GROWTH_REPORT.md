# GROWTH_REPORT.md — Estrategia de crecimiento de Itineraya

**Fecha:** 2026-07-04. Basado en la lectura del código real: funnel (`onboarding.tsx` 7 pasos → `generateItinerary` → `my-trip`), loops de compartir (`ShareDialog`, `PublishToggle`, `postcard.ts`), feed público (`explore.*`), invitaciones (`tripmates.functions.ts`), emails (infra pgmq + Resend), planes (free 2 viajes / Viajero 7,99 € / Explorador 15,99 €), 4 idiomas (es/en/fr/pt), SEO actual (sitemap estático de 6 URLs).

> **Estado de implementación (2026-07-04, misma sesión, sin commit):**
> - **§2 SEO** ✅ Landings `/viajes/{paris,tokio,nueva-york,barcelona,bali}` + hub `/viajes` implementadas ([viajes.$destino.tsx](src/routes/viajes.$destino.tsx), datos en [seo-destinations.ts](src/lib/seo-destinations.ts)) con JSON-LD FAQPage + TouristTrip, canonical y OG. Sitemap dinámico ✅ ([sitemap[.]xml.ts](src/routes/sitemap[.]xml.ts)) — incluye estáticas + destinos + todos los viajes públicos; el estático `public/sitemap.xml` se eliminó.
> - **§6 Emails** ✅ Los 8 emails implementados en es+en ([lifecycle-emails.ts](src/lib/lifecycle-emails.ts)) con scheduler idempotente ([email/lifecycle/run.ts](src/routes/email/email/lifecycle/run.ts)) sobre la cola pgmq existente + migración `20260704110000_lifecycle_emails.sql` (tabla `lifecycle_email_log`). **Paso manual:** programar el cron diario (instrucciones en la migración).
> - **§5 Onboarding** ✅ parcial: pasos 7→4 (destino / fechas / perfil / opcionales), welcome saltable y fuera del camino crítico, trial de 7 días activado al crear la cuenta (default en BD), checkout reanudado tras signup (`/pricing?plan=`), y el `return_to` del login conserva el `?prefill=` de las landings. ⚠️ Pendiente el cambio nº1 (generar sin cuenta / demo-first): requiere decisión de producto y mover el onboarding fuera de `_authenticated`.
> - Verificado en navegador: las 5 landings renderizan (200), 404 correcto para destinos desconocidos, sitemap con 12 URLs base, funnel landing→CTA→auth modal con prefill conservado, endpoint de lifecycle protegido (401/403).

---

## 1. Loops virales existentes: qué hay, qué está roto, y el cambio x10

### Inventario real (del código)

| Loop | Implementación | Estado |
|---|---|---|
| Compartir enlace | `ShareDialog` → `/trip/$slug` (WhatsApp, "Instagram", nativo) | Funciona, pero la página destino está degradada |
| Publicar al feed | `PublishToggle` → `/explore/$slug` | **URL distinta al share** — dos loops que no se suman |
| Postales por día | `postcard.ts` genera PNG descargable/compartible | Buen artefacto, infrautilizado |
| Invitar tripmates | Email Resend + `/invite/$token` | Email solo en inglés, sin recordatorio, sin incentivo |
| Remix | "Crear mi versión" desde página pública y feed | Recién arreglado: los intereses ya se precargan |
| Ratings + view_count | `rateTrip`, `increment_trip_view_count` | Ratings no se mostraban (bug corregido); sin prueba social visible |

### Qué está roto (por orden de daño)

1. **La página compartida es el peor momento del producto.** `trip.$slug.tsx` tira a la basura emojis, lugares, categorías y fotos de cada día, y etiqueta "Day N:" en inglés. El invitado ve una lista plana; el dueño vio tarjetas con fotos. **El loop viral muere en el eslabón que más tráfico recibe.**
2. **Dos URLs de compartir** (`/trip/` y `/explore/`) dividen el page-rank, las métricas y confunden ("lo publiqué, ¿por qué mi amigo ve otra página?").
3. **Compartir es reactivo**: nadie lo pide en el momento de máxima dopamina (itinerario recién generado). El botón está en la toolbar, sin prompt.
4. **Sin atribución**: los enlaces compartidos no llevan UTM ni ref → imposible medir K-factor, imposible recompensar.
5. **Sin incentivo de referido**: no existe programa (el plan free da 2 viajes — materia prima perfecta para "+1 viaje por amigo registrado").
6. **La postal no vende**: se comparte una imagen sin URL corta visible que lleve de vuelta (verificar footer en `postcard.ts`; añadir `itineraya.com/trip/<slug>` bien legible).

### El cambio que multiplica el sharing x10

**Convertir el "itinerario recién generado" en el evento de compartir**, con una página pública a la altura:

1. **Página pública = producto completo** (fotos por día, actividades con emoji y lugar, mapa) con el gate actual de "regístrate para ver los días restantes" (ya existe, `PaywallGate`) — el gate funciona mejor cuanto mejor es lo visible.
2. **Momento de compartir automático**: al terminar la generación, modal "🎉 Tu viaje a Roma está listo — compártelo con tus compañeros de viaje" con botón WhatsApp preseleccionado (mercado ES = WhatsApp). Compartir un plan de viaje es *naturalmente multi-persona*: cada viaje tiene 1-5 destinatarios obligados.
3. **Incentivo doble cara**: "Invita a un amigo: los dos ganáis +1 viaje gratis". Se implementa con una columna `bonus_trips` en profiles + `?ref=<user_id>` en el enlace.
4. **UTM + slug por canal** (`?utm_source=whatsapp`) para medir K-factor por canal desde el día 1.

Con ~1,3 shares/viaje y una página destino que convierte 15-20 % (vs el actual estimado <5 %), el K-factor pasa de residual a 0,3-0,5 — cada cohorte de pago trae media cohorte gratis.

---

## 2. Estrategia SEO

### Situación actual
Sitemap estático con 6 URLs, sin páginas de destino, `<html lang="es">` fijo, sin hreflang pese a 4 idiomas, robots correcto. El feed `/explore` y los `/trip/$slug` públicos son contenido indexable que no está en el sitemap. **Oportunidad enorme: SEO programático de destinos.**

### Arquitectura propuesta

```
/viajes/[destino]                      ← landing SEO por destino (ES)
/viajes/[destino]/[n]-dias             ← variante long-tail ("itinerario paris 4 dias")
/en/travel/[destination]               ← versión EN + hreflang
/explore                               ← feed (ya existe; añadir al sitemap dinámico)
/trip/[slug]                           ← itinerarios reales de usuarios (UGC indexable)
```

Sitemap **dinámico** (server route que lista destinos + trips públicos con `share_slug`), JSON-LD `TouristTrip` + `FAQPage`, e interlinking: cada landing enlaza a 6-8 itinerarios reales del feed de ese destino (cuando existan).

### 50 keywords con intención (español)

| # | Keyword | Intención | # | Keyword | Intención |
|---|---|---|---|---|---|
| 1 | itinerario parís 4 días | Transaccional | 26 | qué ver en lisboa en 3 días | Informacional |
| 2 | itinerario tokio 7 días | Transaccional | 27 | itinerario tailandia 15 días | Transaccional |
| 3 | itinerario nueva york 5 días | Transaccional | 28 | planificar viaje a japón | Transaccional |
| 4 | itinerario barcelona 3 días | Transaccional | 29 | ruta por andalucía 7 días | Transaccional |
| 5 | itinerario bali 10 días | Transaccional | 30 | qué hacer en ámsterdam 2 días | Informacional |
| 6 | planificador de viajes con ia | Transaccional-marca | 31 | itinerario nueva york navidad | Estacional |
| 7 | crear itinerario de viaje gratis | Transaccional | 32 | viaje a marruecos 5 días ruta | Transaccional |
| 8 | app para planificar viajes | Transaccional | 33 | itinerario vietnam 12 días | Transaccional |
| 9 | ia para planificar viajes | Transaccional | 34 | escapada fin de semana desde madrid | Inspiracional |
| 10 | itinerario roma 3 días | Transaccional | 35 | dónde viajar en octubre | Inspiracional |
| 11 | itinerario londres 4 días | Transaccional | 36 | dónde viajar barato en europa | Inspiracional |
| 12 | qué ver en parís en 3 días | Informacional | 37 | viaje organizado vs por libre | Comparativa |
| 13 | qué ver en tokio en una semana | Informacional | 38 | mejor época para viajar a bali | Informacional |
| 14 | itinerario japón 14 días | Transaccional | 39 | itinerario costa amalfitana 4 días | Transaccional |
| 15 | itinerario portugal 7 días | Transaccional | 40 | ruta por la toscana en coche | Transaccional |
| 16 | itinerario méxico 10 días | Transaccional | 41 | qué ver en estambul 3 días | Informacional |
| 17 | viaje a nueva york por libre | Transaccional | 42 | itinerario islandia 7 días | Transaccional |
| 18 | luna de miel bali itinerario | Transaccional-nicho | 43 | viajar sola por europa destinos | Nicho |
| 19 | itinerario disneyland paris 2 días | Nicho | 44 | itinerario grecia islas 10 días | Transaccional |
| 20 | presupuesto viaje a japón | Informacional | 45 | app itinerario de viaje gratis | Transaccional |
| 21 | itinerario budapest 3 días | Transaccional | 46 | organizar viaje en grupo app | Transaccional |
| 22 | itinerario praga 3 días | Transaccional | 47 | chatgpt para planificar viajes | Comparativa |
| 23 | qué ver en barcelona 2 días | Informacional | 48 | alternativas a wanderlog en español | Comparativa |
| 24 | itinerario egipto 8 días | Transaccional | 49 | plantilla itinerario de viaje | Transaccional |
| 25 | itinerario croacia 7 días | Transaccional | 50 | viaje a parís barato consejos | Informacional |

Priorizar 1-11 y 45-48 (intención de herramienta, competencia = blogs sin producto).

### Estructura de cada landing de destino

1. **H1**: "Itinerario de viaje a {Destino}: {N} días perfectos" + CTA "Genera tu itinerario personalizado gratis" (pre-rellena el onboarding con `?prefill=` — ya soportado en el código).
2. Itinerario ejemplo día a día (generado con la propia IA, curado a mano) — el contenido que posiciona.
3. Bloque "Personalízalo": chips presupuesto/compañía/estilo que también van al prefill.
4. Datos prácticos: mejor época, presupuesto orientativo, cómo moverse.
5. Itinerarios reales de la comunidad para ese destino (del feed).
6. FAQ con schema (4-6 preguntas long-tail).
7. Enlaces a destinos relacionados.

### Contenido de las primeras 5 páginas

*(Copy listo para maquetar; los itinerarios ejemplo se generan con la propia IA y se revisan.)*

#### 2.1 — /viajes/paris

- **Title**: Itinerario París 4 días: qué ver día a día (2026) | Itineraya
- **Meta**: Itinerario de París en 4 días hecho por IA y revisado por viajeros: Louvre, Montmartre, Torre Eiffel y barrios secretos, con tiempos reales y transporte. Personalízalo gratis en 1 minuto.
- **H1**: Itinerario de París en 4 días: la ruta perfecta día a día
- **Intro**: París castiga la improvisación: colas de 2 horas en el Louvre, museos cerrados los lunes/martes y barrios que merecen medio día están a 40 minutos de metro entre sí. Este itinerario de 4 días agrupa la ciudad por zonas —como haría un local— para que camines más y viajes menos. Y si tus fechas, presupuesto o ritmo son otros, genera tu versión personalizada gratis en un minuto.
- **Día 1 — Corazón clásico (Isla de la Cité y el Louvre)**: 9:00 Notre-Dame y Sainte-Chapelle (entra antes de las 10) · 11:30 paseo por el Sena hasta el Louvre · 12:30 comida en el Marais (Rue des Rosiers) · 14:30 Louvre con entrada reservada (ala Denon: Mona Lisa, Victoria de Samotracia) · 18:00 Jardín de las Tullerías · 20:30 cena en Le Petit Bouillon Pharamond.
- **Día 2 — Montmartre y Ópera**: Sacré-Cœur al amanecer (evitas grupos) · Place du Tertre y Rue de l'Abreuvoir · comida en La Boîte aux Lettres · Galerías Lafayette (azotea gratis) · Ópera Garnier · cena y cabaret opcional.
- **Día 3 — Torre Eiffel y orilla izquierda**: Trocadéro a las 8:30 para la foto · subida con reserva · Les Invalides o Museo Rodin · comida en Rue Cler · Saint-Germain-des-Prés, Jardín de Luxemburgo · atardecer en el Sena (crucero 1 h).
- **Día 4 — Versalles o barrios con alma**: opción A Versalles (tren RER C, palacio + jardines, día completo) · opción B Canal Saint-Martin, Le Marais a fondo y Père-Lachaise.
- **Datos prácticos**: mejor época abril-junio y septiembre-octubre · presupuesto medio 120-180 €/día por persona · Navigo Découverte si estás ≥4 días · los museos nacionales cierran lunes o martes — *nuestro generador lo comprueba con tus fechas exactas*.
- **FAQ (schema FAQPage)**: ¿Cuántos días necesito para París? (3-5; con 4 cubres lo esencial sin correr) · ¿París es caro? (60-90 €/día mochilero, 150 € medio) · ¿Merece la pena el Paris Museum Pass? (sí desde 3 museos en 2 días) · ¿Dónde alojarse la primera vez? (Marais, Saint-Germain, Ópera) · ¿Es seguro? (sí; atención a carteristas en Montmartre y metro línea 1).
- **CTA final**: "Este plan es un punto de partida. Dinos fechas, presupuesto y con quién viajas — la IA de Itineraya te monta el tuyo en 40 segundos, gratis."

#### 2.2 — /viajes/tokio

- **Title**: Itinerario Tokio 7 días: ruta día a día sin agobios (2026) | Itineraya
- **Meta**: Una semana en Tokio organizada por barrios: Shibuya, Asakusa, Shinjuku, Akihabara y una excursión a Nikko o Kamakura. Con JR Pass, presupuesto y consejos. Personalízalo gratis.
- **H1**: Itinerario de Tokio en 7 días: la ciudad infinita, ordenada
- **Intro**: Tokio no se "visita": se navega. Son 23 barrios-ciudad y el error clásico es cruzarla dos veces al día. Esta ruta agrupa por zonas conectadas por la línea Yamanote y deja un día para una escapada. Cada bloque respeta horarios reales (los templos abren a las 6, los izakayas no arrancan hasta las 18).
- **Días**: 1 Asakusa + Ueno (Sensō-ji al amanecer, Nakamise, parque y museo de Ueno, Ameyoko) · 2 Shibuya + Harajuku (cruce, Meiji Jingū, Takeshita, Omotesandō, Shibuya Sky al atardecer) · 3 Shinjuku (Gyoen, Metropolitan Building gratis, Omoide Yokocho, Golden Gai) · 4 Akihabara + Ginza (electrónica y anime, teamLab con reserva, sushi en Tsukiji exterior) · 5 excursión: Nikko o Kamakura + Enoshima · 6 Odaiba o Kichijōji + Ghibli (reserva meses antes) · 7 compras finales y Tokyo Station.
- **Prácticos**: Suica/Pasmo digital en el móvil · JR Pass solo si sigues a Kioto · presupuesto 90-140 €/día · efectivo aún necesario en izakayas pequeños · mejor época: finales de marzo (sakura, reserva con 4 meses) y noviembre (momiji).
- **FAQ**: ¿7 días es mucho para Tokio? · ¿Necesito JR Pass solo para Tokio? (no) · ¿Tokio o Kioto primero? · ¿Presupuesto de una semana? (900-1.400 € sin vuelos) · ¿Se puede con inglés/español? (sí, con Google Maps y traductor).

#### 2.3 — /viajes/nueva-york

- **Title**: Itinerario Nueva York 5 días: la ruta definitiva (2026) | Itineraya
- **Meta**: 5 días en Nueva York organizados de sur a norte: Lower Manhattan, Midtown, Central Park, Brooklyn y un mirador cada noche. Presupuesto realista y consejos de metro. Genera tu versión gratis.
- **H1**: Itinerario de Nueva York en 5 días (sin perder medio día en el metro)
- **Intro**: NYC se recorre de sur a norte o pierdes horas bajo tierra. Cinco días bien ordenados: cada jornada es una franja de Manhattan o un borough, y cada noche un plan de skyline distinto — porque la primera vez, la ciudad se mira desde arriba.
- **Días**: 1 Lower Manhattan (Ferry a Staten Island gratis al amanecer para ver la Estatua, Wall Street, 9/11 Memorial, Oculus, atardecer en Brooklyn Bridge) · 2 Midtown (Grand Central, Biblioteca, Bryant Park, MoMA, Times Square de noche, Summit One) · 3 Central Park + museos (alquiler de bici, The Met, Upper West Side, Lincoln Center) · 4 Brooklyn (Dumbo, Williamsburg, Smorgasburg si es finde, atardecer en Westlight) · 5 High Line + Chelsea Market + Hudson Yards + Little Island; despedida en Top of the Rock.
- **Prácticos**: metro con tarjeta contactless directa (OMNY, tope semanal 34 $) · presupuesto 200-300 $/día con hotel · ESTA con 3 semanas de margen · propinas 18-20 % · CityPASS si harás ≥3 miradores/museos de pago.
- **FAQ**: ¿5 días alcanzan? · ¿Manhattan o Brooklyn para dormir? · ¿Cuánto cuesta una semana? · ¿Mejor mirador? (Summit amanecer, Top of the Rock atardecer) · ¿NY en diciembre merece la pena? (mágico y helado: guantes y plan B indoor — nuestra IA ajusta por clima).

#### 2.4 — /viajes/barcelona

- **Title**: Itinerario Barcelona 3 días: Gaudí, Gótico y mar (2026) | Itineraya
- **Meta**: Tres días perfectos en Barcelona: Sagrada Familia y Park Güell con reservas, Barrio Gótico a pie, Barceloneta y Montjuïc. Con horarios reales y transporte. Personalízalo gratis.
- **H1**: Itinerario de Barcelona en 3 días: lo esencial sin colas
- **Intro**: Barcelona en 3 días es factible con una condición: reservar Sagrada Familia y Park Güell **antes de llegar**. El resto es caminar la ciudad correcta en el orden correcto — el Gótico por la mañana antes que los grupos, la Barceloneta cuando cae el sol, y Montjuïc para despedirte desde arriba.
- **Días**: 1 Ciutat Vella (Catedral y Gótico a las 9, Santa Maria del Mar, El Born y Picasso, tapas en La Xampanyeria, atardecer en la Barceloneta) · 2 Ruta Gaudí (Sagrada Familia 1er turno, Hospital Sant Pau, Passeig de Gràcia: Pedrera y Batlló, Park Güell 17:00, cena en Gràcia) · 3 Montjuïc + Boqueria (mercado temprano, teleférico, Fundació Miró, Poble Espanyol o MNAC, Font Màgica si opera).
- **Prácticos**: T-casual 10 viajes · cuidado carteristas en Ramblas/metro · comer: menú del día 14-18 € · mejor época mayo-junio y septiembre · domingos: muchos museos gratis por la tarde.
- **FAQ**: ¿3 días son suficientes? · ¿Sagrada Familia sin reserva? (casi imposible en temporada) · ¿Dónde alojarse? (Eixample, Gràcia, Gótico si toleras ruido) · ¿Playa en Barcelona ciudad? (sí, y mejor aún Ocata en tren) · ¿Excursión de un día? (Montserrat).

#### 2.5 — /viajes/bali

- **Title**: Itinerario Bali 10 días: templos, arrozales e islas (2026) | Itineraya
- **Meta**: 10 días en Bali por zonas: Ubud, Uluwatu, Munduk y las Gili o Nusa Penida. Ruta anti-atascos con presupuesto real y mejor época. Genera tu itinerario personalizado gratis.
- **H1**: Itinerario de Bali en 10 días: la isla por zonas (y sin 3 horas de scooter al día)
- **Intro**: El error nº1 en Bali es dormir en un sitio y "hacer excursiones": las distancias son cortas pero el tráfico es brutal. Este itinerario **cambia de base 3 veces** — sur, Ubud, norte/islas — para que cada mañana empiece donde está lo que quieres ver.
- **Bloques**: Días 1-3 Sur (Uluwatu: templo y kecak al atardecer, playas Bingin/Padang Padang, Canggu si quieres ambiente) · Días 4-6 Ubud (Tegalalang al amanecer, Monkey Forest, Tirta Empul, cascadas Tibumana/Kanto Lampo, clase de cocina) · Días 7-8 Munduk/Norte (Ulun Danu Beratan, cascadas gemelas, plantaciones de café) · Días 9-10 Nusa Penida (Kelingking, Angel's Billabong) o Gili (snorkel con tortugas).
- **Prácticos**: conductor privado 40-55 €/día (compartido sale mejor que 3 excursiones) · presupuesto 50-90 €/día en pareja estilo medio · mejor época mayo-octubre (seca) · visado a la llegada 35 US$ · templos: sarong y hombros cubiertos.
- **FAQ**: ¿10 días alcanzan para Bali + islas? · ¿Época de lluvias es mala? (llueve fuerte y corto; se viaja igual con plan flexible — la IA reordena por clima) · ¿Es barato? · ¿Luna de miel: qué zona? (Ubud + Nusa Lembongan) · ¿Se necesita carnet internacional para scooter? (sí, y casco siempre).

---

## 3. TikTok e Instagram: 30 ideas priorizadas + 5 guiones

**Formato ganador para esta categoría**: screen-recording del producto + resultado aspiracional en <35 s. El producto ES el contenido (la generación en vivo es hipnótica).

### 30 ideas (ordenadas por potencial viral)

| # | Idea | Formato | Potencial |
|---|---|---|---|
| 1 | "Le pedí a una IA que planificara mis vacaciones y esto pasó" — generación en vivo + resultado | Screen + b-roll | 🔥🔥🔥 |
| 2 | "París en 4 días si solo tienes 600 €" — serie *presupuesto imposible* | Screen + precios | 🔥🔥🔥 |
| 3 | ChatGPT vs Itineraya planificando el mismo viaje, lado a lado | Split screen | 🔥🔥🔥 |
| 4 | "Dime tu presupuesto y te digo tu destino" — respuesta a comentarios con la app | Reply-video | 🔥🔥🔥 |
| 5 | "Cosas que NO haría en {destino} después de que la IA me avisara" | Talking head | 🔥🔥🔥 |
| 6 | El itinerario del finde sorpresa: "no sabía dónde íbamos hasta el aeropuerto" | Vlog + app | 🔥🔥🔥 |
| 7 | "3 días en Roma: lo que la IA planificó vs lo que hicimos" (con notas y checks de la app) | Vlog | 🔥🔥 |
| 8 | POV: tu amiga la organizada ya no existe, existe esta app | Sketch | 🔥🔥 |
| 9 | Serie "Un país, 60 segundos": el itinerario de X en 1 min con las fotos de los días | Slideshow | 🔥🔥 |
| 10 | "Planificamos el viaje de novios de mis suscriptores en directo" | Live/corte | 🔥🔥 |
| 11 | Errores de novato en Tokio que el itinerario evita (museo cerrado en lunes, etc.) | Lista | 🔥🔥 |
| 12 | "La app me dijo que mi plan era imposible" — geografía real (cruzar la ciudad 3 veces) | Screen + mapa | 🔥🔥 |
| 13 | Duelo de parejas: cada uno genera el viaje ideal, gana el mejor (votación en comentarios) | Duet | 🔥🔥 |
| 14 | "Viajar sola por primera vez: mi itinerario día a día" (nicho solo female travel) | Vlog | 🔥🔥 |
| 15 | Antes/después: mi Excel de viaje de 12 pestañas vs 40 segundos de app | Meme | 🔥🔥 |
| 16 | "El itinerario de Bali que me copió medio TikTok" — remix del enlace público | Screen | 🔥🔥 |
| 17 | Postales de la app como formato: 1 día = 1 postal, carrusel IG | Carrusel | 🔥🔥 |
| 18 | "Le di mi sueldo a la IA y me dijo a dónde puedo viajar este año" | Talking head | 🔥🔥 |
| 19 | Asistente en vivo: "cámbiame el día 3, odio los museos" y se regenera | Screen | 🔥🔥 |
| 20 | "Qué evitar en {destino}" usando el campo *evitar* del onboarding | Lista | 🔥 |
| 21 | Trend de audio del momento + textos de itinerario absurdo→perfecto | Trend | 🔥 |
| 22 | "Planifica conmigo" ASMR: el onboarding entero con voz suave | ASMR | 🔥 |
| 23 | Familia caótica: 2 niños, 5 días, Disneyland — la IA lo cuadra | Vlog | 🔥 |
| 24 | Comparación de precios: agencia (1.900 €) vs por libre con la app (1.100 €) | Split | 🔥 |
| 25 | "El mapa de todos mis viajes" — el globo 3D del dashboard girando | Screen | 🔥 |
| 26 | Reto: 24 h en Madrid siguiendo TODO lo que diga la app | Vlog | 🔥 |
| 27 | Copiloto en tiempo real: "está lloviendo en Roma, ¿ahora qué?" | Screen en calle | 🔥 |
| 28 | "Los 5 destinos que la IA recomienda para octubre" (inspire) | Slideshow | 🔥 |
| 29 | Behind the scenes: "cómo una IA sabe que el Louvre cierra los martes" | Educativo | 🔥 |
| 30 | UGC: repostear itinerarios públicos de usuarios con su permiso ("el viaje de María a Vietnam") | Repost | 🔥 |

### Guiones completos de los 5 mejores

**#1 — "Le pedí a una IA que planificara mis vacaciones" (30 s)**
- 0-2 s (hook, texto en pantalla): "Mi agencia de viajes ahora es una IA y cobra 0 €"
- 2-8 s: pantalla del onboarding, rellenando rápido: "Roma · 4 días · pareja · 800 €" (con sonido de teclas)
- 8-14 s: pantalla de generación con la barra + corte a "40 segundos después…"
- 14-24 s: scroll rápido por las tarjetas: fotos de cada día, horarios, "🚶 8 min a pie", el mapa. Voz: "Me ha puesto hasta cuánto se tarda andando entre sitios. Y sabe que el Vaticano cierra los domingos."
- 24-30 s (CTA): "Es gratis, se llama Itineraya, enlace en la bio. Comenta tu destino y os enseño el itinerario en el próximo vídeo." ← *el CTA de comentarios alimenta la idea #4 en bucle.*

**#2 — "París con 600 €" (35 s)**
- 0-3 s: "¿París con 600 € TODO incluido? La IA dice que sí. Vamos a verlo."
- 3-10 s: slider de presupuesto de la app en 600, se genera. "Fíjate: me cambia los restaurantes a bouillons y crêperies, y mete los museos gratis del primer domingo."
- 10-25 s: desglose visual por encima del itinerario: vuelo 90 € (skyscanner b-roll), hostal 4 noches 160 €, comida 120 €, transporte 30 €, actividades 80 €. "Total: 480. Sobran 120 para caprichos."
- 25-32 s: "El truco no es gastar menos, es no pagar por planificar mal."
- 32-35 s: "Itineraya, gratis, en la bio. ¿Siguiente ciudad con presupuesto imposible? Comenta." → serie infinita.

**#3 — "ChatGPT vs Itineraya" (40 s)**
- 0-3 s: pantalla dividida. "Mismo viaje. Dos IAs. Solo una sabe viajar."
- 3-12 s: izquierda, ChatGPT escupe texto plano. "Bonito… pero es un ensayo. Ni fotos, ni mapa, ni sabe si el museo abre."
- 12-26 s: derecha, Itineraya: tarjetas con foto por día, mapa con la ruta, botón de reservar, "cámbiame el día 2" y se regenera. "Esto se guarda, se comparte con tu grupo y se edita hablando."
- 26-34 s: zoom al detalle asesino: "🚇 Metro L4 dirección Porte de Clignancourt, 12 min" — "ChatGPT no te dice ni el andén."
- 34-40 s: "Los dos son IA. Solo uno es un planificador. Bio." *(Comentarios garantizados de defensores de ChatGPT = alcance.)*

**#4 — "Dime tu presupuesto y te digo tu destino" (respuesta a comentario, 25 s)**
- 0-2 s: captura del comentario fijada: "800 € en noviembre desde Madrid, ¿dónde?"
- 2-10 s: modo Inspire de la app en pantalla: vibes "playa + relax", origen Madrid, presupuesto medio. Aparecen 3 destinos con score: "Essaouira 94, Malta 91, Tenerife 89."
- 10-20 s: se genera el itinerario del nº1 en vivo, scroll de 5 segundos por los días.
- 20-25 s: "Essaouira, 5 días, te sobran 150 €. Siguiente comentario, siguiente destino. Sígueme y deja el tuyo." *(Formato serializable a diario con coste de producción ~10 min.)*

**#5 — "Cosas que NO haría en Tokio" (30 s)**
- 0-3 s: "5 errores en Tokio que te destrozan el viaje — y cómo los evita mi itinerario."
- 3-25 s, ritmo metralleta con b-roll: 1) "Ir al mercado de Tsukiji por la tarde: muerto. La app lo pone a las 8 AM." 2) "Ghibli sin reserva: imposible. Te avisa con antelación." 3) "Cruzar la ciudad 3 veces el mismo día: la app agrupa por barrios." 4) "JR Pass solo para Tokio: tira el dinero." 5) "Izakaya a las 17:00: cerrado. Te cuadra la cena a horario local."
- 25-30 s: "Cada ciudad tiene sus trampas. La IA se las sabe. Itineraya, gratis, bio."

**Cadencia recomendada**: 1 vídeo/día TikTok (formatos #4 y #9 son casi gratis de producir), 4/semana Reels, carruseles de postales 2/semana en IG. Cuenta en español primero (mercado con menos competencia directa que EN).

---

## 4. Lanzamiento en Product Hunt

- **Nombre**: Itineraya
- **Tagline (60 chars)**: "AI trip planner that builds your day-by-day itinerary in 40s"
- **Alternativa**: "Stop planning trips in spreadsheets. Describe it, get it."
- **Descripción**:
  > Itineraya turns "Paris, 4 days, €800, with my partner" into a complete day-by-day itinerary in ~40 seconds: real venues, opening days checked against your dates, transit directions between stops, photos, an interactive map, and hotel-anchored routing if you've already booked. Edit it by chatting ("swap museums for food markets on day 2"), invite tripmates, share a public link, or remix anyone's trip from the community feed. Free plan includes 2 full trips — no card required. Built for the way people actually plan: in WhatsApp groups, at the last minute, on a budget.
- **First comment (del maker)**: historia personal (el Excel de 12 pestañas del último viaje), 3 features favoritas con GIFs (generación en vivo, edición por chat, postales), pregunta abierta ("¿qué es lo que más odias de planificar un viaje?") y oferta PH: 3 meses de Viajero gratis con código PRODUCTHUNT.
- **Assets**: vídeo de 40 s (la generación completa en tiempo real, sin cortes — la honestidad del "no está acelerado" vende), 5 capturas (resultado, mapa, edición chat, feed, postal), logo animado.
- **Mejor día**: **martes o miércoles** (máximo tráfico; lunes se acumulan lanzamientos del finde, jueves-domingo menos tráfico editorial). Lanzar 00:01 PT. Evitar semanas de keynotes (Apple/Google/OpenAI).
- **Estrategia de upvotes (sin comprar votos — penaliza)**:
  1. 2 semanas antes: activar "notify me" con teaser; avisar 1-a-1 (DM, no broadcast) a 50-100 contactos pidiendo *feedback el día D*, no votos.
  2. Comunidad propia primero: banner in-app 48 h antes ("nos lanzamos en PH, ¿nos acompañas?") + email a la base de usuarios a las 9:00 CET (medianoche PT ya pasada).
  3. Día D: responder TODOS los comentarios en <15 min durante las primeras 6 h (el engagement pesa en el ranking); publicar el hilo de X/LinkedIn con la historia; TikTok #1 versión "nos lanzamos hoy".
  4. Hunter: no es imprescindible en 2026; si acaso, un hunter de la categoría travel con followers reales.
  5. Post-launch: badge en la landing, respuesta a cada review, artículo "what we learned".
- **Objetivo realista**: Top 5 del día → 800-1.500 registros con el codigo PH → material de prueba social para SEO y ads.

---

## 5. Optimización del onboarding: los 3 cambios de mayor impacto en activación

*(Activación = usuario ve SU itinerario generado. Hoy: landing → modal signup → email confirm → welcome 2 pasos → dashboard → new-trip → onboarding 7 pasos → generación ≈ **12+ interacciones y una confirmación de email antes del valor**.)*

1. **Generar antes de registrar (demo-first).** Permitir completar el onboarding y ver la generación SIN cuenta; pedir registro para *guardar/ver el itinerario completo* (mismo patrón del PaywallGate público que ya existe: enseña 50 %, pide cuenta para el resto). El pico de motivación es "quiero verlo", no "quiero una cuenta". Implementación: onboarding fuera de `_authenticated/`, trip en localStorage/anon hasta el `AuthModal`, asociar al registrarse. **Es el cambio nº1 con diferencia** — cada paso previo al valor pierde 20-40 % de usuarios.
2. **Onboarding de 7 pasos → 4.** Fusionar: (1) destino, (2) fechas + horas llegada/salida (ya juntos), (3) compañía + presupuesto + estilo en una sola pantalla de chips con defaults marcados, (4) alojamiento + evitar como "ajustes opcionales" colapsados con botón "Generar ya" siempre visible desde el paso 3. Los datos de los pasos 3-7 tienen defaults razonables (`solo`, `800-2000`) — que editar sea opcional, no obligatorio pasar por ellos.
3. **Welcome fuera del camino crítico.** Hoy `/welcome` (edad + idioma) se interpone entre el registro y el dashboard y **activa el trial de 7 días silenciosamente** ([welcome.tsx:48]). El idioma ya se conoce (UI), la edad no bloquea nada: pedirlos después del primer itinerario (modal en dashboard) y mover el trial al momento del registro con banner explícito "Tienes 7 días de Viajero gratis" — hoy el usuario ni se entera de que tiene trial hasta el banner del dashboard.

**Bonus medible ya**: arreglar la reanudación del checkout (`?plan=`, BUG-12 del audit) — es activación de pago perdida con fix de 30 min.

---

## 6. Secuencia de 8 emails de retención

*(Infra ya existente: cola pgmq + Resend + plantillas react-email. Enviar en el idioma del perfil. Remitente: "Iván de Itineraya <ivan@itineraya.com>" para los de texto; los transaccionales, noreply. Cada email un solo CTA.)*

**E1 — Bienvenida (inmediato tras confirmar email)**
- **Asunto:** Tu próximo viaje empieza aquí ✈️
- Hola {nombre}: Soy Iván, de Itineraya. Ya tienes cuenta — y 7 días del plan Viajero gratis, sin tarjeta, para que lo pruebes todo: asistente IA, edición por chat y compañeros de viaje. La forma más rápida de ver la magia: dime un destino, unas fechas y un presupuesto, y en 40 segundos tienes tu itinerario día a día con mapa, horarios reales y transporte entre paradas. **[Crear mi primer itinerario →]** Un consejo: cuanto más concreto el presupuesto, mejor clava los restaurantes. Buen viaje, Iván. P. D.: ¿Respondes a este email con tu próximo destino? Leo todos.

**E2 — Activación (24 h después, SOLO si no ha generado ningún viaje)**
- **Asunto:** 40 segundos. Eso es lo que te falta para ver tu viaje.
- {Nombre}, te registraste ayer y tu primer itinerario sigue esperando. Lo entiendo: otra app más, otra promesa más. Así que te propongo un trato: piensa en el viaje que llevas meses posponiendo. Escribe el destino. Elige fechas aproximadas — se pueden cambiar. Pulsa generar. Si en un minuto no tienes delante un plan día a día con sitios reales, horarios y mapa que te dé ganas de reservar el vuelo, borra la cuenta y no te escribo más. **[Probar con mi viaje pendiente →]** — Iván

**E3 — Día 3 (si generó: profundizar; el gancho es la edición)**
- **Asunto:** Tu itinerario de {destino} no está terminado (y eso es lo bueno)
- El plan que generaste para {destino} es la versión 1. Lo mejor de Itineraya es la versión 2: abre tu viaje y dile al asistente cosas como "el día 2 sin museos, más comida callejera", "añade una tarde de compras" o "hazlo más barato". Se reescribe en segundos manteniendo lo que ya te gustaba. **[Editar mi viaje a {destino} →]** ¿Viajas acompañado? Invita a tu gente al itinerario y que opinen ahí, no en un grupo de WhatsApp con 200 mensajes. — Iván

**E4 — Día 7 (fin del trial; conversión)**
- **Asunto:** Tu prueba de Viajero acaba hoy — esto es lo que pasa ahora
- {Nombre}, hoy termina tu semana de plan Viajero. Sin dramas: tu cuenta sigue gratis para siempre, con tus 2 itinerarios completos y tus viajes guardados. Lo que se pausa: el asistente para editar por chat, los compañeros de viaje y los itinerarios ilimitados. Si Itineraya te ha ahorrado aunque sea una tarde de Google, Viajero cuesta 5,99 €/mes (anual) — menos que un menú del día, para todos los viajes del año. **[Seguir con Viajero →]** Y si no, gracias por probarlo: el plan gratis es tuyo para siempre. — Iván

**E5 — Día 30 (hábito / segunda oportunidad)**
- **Asunto:** ¿Puente a la vista? Tenemos ideas.
- Un mes con nosotros, {nombre}. Los usuarios que más partido le sacan a Itineraya no la usan solo para EL viaje del año — la usan para decidir: "¿me da el presupuesto para X?", "¿qué hago 3 días en Y?". Prueba el modo Inspire: dile tu presupuesto, el mes y qué te apetece (playa, comida, fiesta…) y te propone 3 destinos con puntuación de compatibilidad. **[Sorpréndeme →]** Este mes en el feed: {3 viajes públicos destacados con foto}. — Iván

**E6 — Reactivación 60 días (inactivos)**
- **Asunto:** {Nombre}, tu viaje a {último destino} sigue aquí
- Hace dos meses planeaste {destino} y luego… la vida, ya sabemos. Dos noticias desde entonces: ahora los itinerarios salen también en francés y portugués, y la comunidad ha publicado {N} viajes nuevos que puedes copiar y adaptar en un clic. Tu itinerario de {destino} sigue guardado, listo para retomar o para convertirse en otro destino. **[Ver mi viaje →]** ¿No planeas viajar? Dímelo respondiendo a este correo y bajo el ritmo de emails. — Iván

**E7 — Viaje próximo (7 días antes de start_date; transaccional, oro puro)**
- **Asunto:** 7 días para {destino} 🎒 — tu checklist inteligente
- ¡Ya casi, {nombre}! El {fecha} empieza tu viaje a {destino}. Repaso rápido: ☐ Tu itinerario está al día — ¿algún cambio de última hora? El asistente lo ajusta en segundos. ☐ Descarga las postales de cada día para llevarlas offline. ☐ Comparte el enlace con quienes viajan contigo ({link}). ☐ El tiempo previsto para tus fechas: {clima} — si cambia, el copiloto te replantea el día sobre la marcha. **[Repasar mi itinerario →]** Buen viaje. De verdad. — Iván

**E8 — Post-viaje (2 días después de end_date)**
- **Asunto:** ¿Qué tal {destino}? Una cosa más…
- Bienvenido de vuelta, {nombre}. Esperamos que {destino} haya estado a la altura. Dos favores de 30 segundos: (1) marca en tu itinerario lo que hiciste de verdad — así tus próximos planes aprenden de tus gustos; (2) **publica tu viaje en el feed**: alguien está ahora mismo dudando si ir a {destino}, y tu itinerario real vale más que 10 blogs. Cada persona que lo copie lo verás en tu contador de vistas. **[Publicar mi viaje →]** ¿Y el próximo destino? Tenemos ideas para {mes+2}… — Iván

*(E7 y E8 requieren un cron que consulte `start_date`/`end_date` — la infra pg_cron ya existe para la cola de emails.)*

---

## 7. Veinte comunidades donde están los usuarios

**Regla de oro en todas**: primero aportar (responder 3-5 hilos con itinerarios útiles SIN enlace), después mencionar la herramienta solo donde las normas lo permitan o en respuesta directa a "¿qué app usáis?". El mensaje de presentación se adapta, nunca se pega en masa.

**Reddit (EN — volumen):**
1. **r/travel (9M+)** — prohibido self-promo directo; participar en Weekly Destination Threads.
   *Mensaje (respuesta a petición de itinerario):* "Here's a day-by-day for Lisbon that groups neighborhoods so you're not zigzagging — Alfama + Graça day 1, Belém day 2… (full detail). I built the skeleton with an AI planner I use (Itineraya) and adjusted from experience; happy to share the editable version if useful."
2. **r/solotravel (3M+)** — hilos "first solo trip".
   *Mensaje:* "Did my first solo trip last year and over-planning saved me. What worked: one neighborhood per day, dinner spots picked in advance so I wasn't wandering at night. I now use an AI planner (Itineraya) for the skeleton and tweak it — here's exactly what my Porto week looked like: …"
3. **r/Shoestring** — presupuesto.
   *Mensaje:* "Paris on €600 all-in, actual numbers: flight 90, hostel 160, food 120 (bouillons are the cheat code), transit 30, sights 80. Full day-by-day here — I generated it with a budget-aware AI planner and it swapped every pricey stop for a free-first-Sunday museum: …"
4. **r/JapanTravel** — normas estrictas, solo valor: itinerary reviews.
   *Mensaje (review de itinerario ajeno):* "Your day 3 crosses Tokyo twice — Asakusa morning, Shibuya noon, back to Ueno at 5pm is ~90 min of trains you don't need. Swap Ueno into the morning block. Also Ghibli needs booking months out. (I sanity-check my routes with an AI tool that flags exactly this, DM if you want the link — sub rules.)"
5. **r/travelhacks** — hacks concretos.
   *Mensaje:* "Hack that saved my Rome trip: check every museum's weekly closing day against your actual dates before booking anything else. Most itinerary blogs ignore it. I use a planner (Itineraya) that does it automatically — day 2 landed on a Monday and it quietly kept me out of every closed museum."
6. **r/ArtificialIntelligence / r/ChatGPT** — demo honesta.
   *Mensaje:* "I compared a raw ChatGPT prompt vs a purpose-built AI trip planner on the same input (Rome, 4 days, €800, couple). ChatGPT wrote a nice essay; the planner returned structured days with transit times and caught that the Vatican Museums close Sundays. Write-up with both outputs inside — curious where you think the line is between prompting and product."
7. **r/Europetravel** — itinerarios multi-ciudad.
   *Mensaje:* "For a first 12-day Europe trip: 3 cities max, 4-3-4 nights, night trains over 6am flights. Here's a Paris–Amsterdam–Berlin skeleton with day-by-day blocks (generated with Itineraya, edited by hand) — steal whatever's useful: …"

**Reddit (ES):**
8. **r/askspain / r/espanol (hilos de viajes)**.
   *Mensaje:* "Para 3 días en Sevilla: día 1 Santa Cruz + Alcázar (reserva sí o sí), día 2 Triana + atardecer en Las Setas, día 3 Cartuja o excursión a Córdoba. Te paso el plan completo con horarios y cómo moverte — lo monté con una app española de itinerarios con IA y lo retoqué: {enlace público del viaje}."
9. **r/argentina + r/mexico (hilos de viajes)**.
   *Mensaje:* "Hice Europa con presupuesto ajustado el año pasado: la clave fue decidir el itinerario ANTES de reservar vuelos internos. Les dejo mi ruta de 15 días con costos reales en USD, día por día: {enlace}. La armé con Itineraya (gratis) y la fui editando — si quieren les genero una versión con sus fechas."
10. **r/uruguay, r/chile (megahilos de viajes)**.
    *Mensaje:* "Para el que preguntaba por 7 días en España: Madrid 3 + Sevilla 2 + Granada 2, tren mejor que auto. Itinerario completo día a día acá: {enlace}. Lo generé con una app de IA y le corregí dos cosas — el resto lo clavó, hasta el horario de la Alhambra."

**Facebook (ES — donde vive el viajero español 30-55):**
11. **"Mochileros por el Mundo" (500k+)** *(pedir permiso a admins antes)*.
    *Mensaje:* "Hola grupo 👋 Soy Iván, desarrollador y mochilero. Harto de planificar en Excel monté una herramienta que arma el itinerario día a día con IA (gratis para 2 viajes). La comparto por si a alguien le sirve para su próxima ruta — y me encantaría feedback de mochileros de verdad, que la IA aún se cree que todos dormimos en hoteles 😅 {link}"
12. **"Viajar por Europa Low Cost"**.
    *Mensaje:* "Reto que me puse: París 4 días con 600 € TODO incluido. Os dejo el desglose real (vuelo 90, hostal 160, comida 120…) y el itinerario día a día con capturas 👇 Lo generé con Itineraya poniendo el presupuesto y me cambió solo los restaurantes a bouillons. ¿Siguiente ciudad low cost que queráis que pruebe?"
13. **"Viajeros por el Mundo (España)"**.
    *Mensaje (respuesta a petición):* "¡Yo estuve en Roma en abril! Te paso mi itinerario completo con horarios, transporte entre paradas y mapa — lo puedes copiar y adaptar a tus fechas en un clic: {enlace /trip/slug}. Cualquier duda del día 2 (Vaticano) pregúntame."
14. **"Viajando solas" (mujeres viajeras, ES)**.
    *Mensaje:* "Para las que planean su primer viaje sola: lo que más tranquilidad me dio fue llevar el plan día a día decidido y compartido con mi familia — saben dónde estoy cada día sin que yo reporte. Uso Itineraya: generas el itinerario, lo editas y compartes el enlace con quien quieras. Os dejo mi ruta de Lisboa por si sirve: {enlace}."
15. **Grupos de destino: "Viajar a Japón — consejos"**.
    *Mensaje (respuesta):* "Ojo con tu día 3: Tsukiji por la tarde está muerto, ve a las 8:00. Y Ghibli se reserva con meses. Te paso una ruta de 7 días agrupada por barrios de la Yamanote para que no cruces Tokio dos veces al día: {enlace}."

**Foros y otros:**
16. **Foro Los Viajeros (losviajeros.com)** — EL foro español de viajes; las normas permiten firma.
    *Mensaje (hilo de presentación + subforo de destino):* "Buenas a todos. Llevo años leyendo este foro para planificar y ahora vengo a devolver: os dejo mi itinerario de {destino} día a día con transporte y horarios, en formato editable/copiable: {enlace}. Soy el desarrollador de la herramienta con la que lo hice (Itineraya, gratis) — se admite todo tipo de caña, que para eso estamos."
17. **Foros de TripAdvisor en español** *(sin enlace directo; web en el perfil)*.
    *Mensaje:* "Para 5 días en NY: ve de sur a norte y no cruces Manhattan dos veces el mismo día. Día 1 Lower (ferry de Staten Island gratis al amanecer para ver la Estatua)… [itinerario completo en texto]. Si quieres la versión con mapa y horarios, en mi perfil tienes la web donde la publiqué."
18. **Indie Hackers + Product Hunt discussions** — build in public.
    *Mensaje:* "Building Itineraya, an AI trip planner for the Spanish-speaking market. This month: fixed our viral loop (the shared page was worse than the product — classic), shipped programmatic SEO for destinations. MRR and lessons inside. AMA about competing with 'just use ChatGPT'."
19. **Discord/Slack de nómadas: Nomad List (#spain, #travel-planning)**.
    *Mensaje:* "Made a thing for the 'I land in a new city Friday and have zero plan' problem — describe the trip, get a day-by-day with transit times; there's a real-time copilot mode for when it rains and your plan dies. Free tier: itineraya.com. Feedback from people who move every month is exactly what it needs."
20. **Canales Telegram/WhatsApp de chollos (Viajeros Piratas, Chollometro viajes)** — colaboración con admins más que posteo.
    *Mensaje (a los admins):* "Hola, soy Iván, fundador de Itineraya (itinerarios de viaje con IA, en español). Propuesta para vuestro canal: cada chollo de vuelo que publiquéis, os generamos el itinerario del destino listo para copiar — 'vuelo a Nápoles por 30 €' + 'plan de 4 días hecho'. Contenido extra para vosotros, tráfico cualificado para nosotros. ¿Probamos con un chollo esta semana?"

---

## 8. Análisis competitivo

| | **Itineraya** | **TripIt** | **Wanderlog** | **Lambus** | **ChatGPT directo** |
|---|---|---|---|---|---|
| Propuesta | Genera el plan con IA desde 5 datos | Organiza reservas reenviando emails | Planner colaborativo con mapa | Organizador de grupo europeo | Chat generalista |
| Generación IA día a día | ✅ nativa, 40 s, coherencia geográfica y horarios | ❌ | Parcial (asistente IA limitado) | Parcial | ✅ pero texto plano |
| Mapa + fotos + estructura | ✅ | ❌ (agenda) | ✅ fuerte | ✅ | ❌ |
| Edición conversacional | ✅ | ❌ | ❌ | ❌ | ✅ (pero sin persistencia estructurada) |
| Colaboración | ✅ tripmates | Pro | ✅ fuerte | ✅ fuerte | ❌ |
| Comunidad/remix | ✅ feed + remix | ❌ | Guías de usuarios | ❌ | ❌ |
| Español nativo | ✅ (es/fr/pt/en) | ❌ EN-first | ❌ EN-first | Parcial | ✅ |
| Precio | 0 / 7,99 / 15,99 € | 0 / 49 $/año | 0 / 39,99 $/año | 0 / premium | 0 / 20 $ |
| Talón de Aquiles | Marca nueva, sin reservas integradas | No planifica nada, solo ordena | La IA es un añadido, UX densa | Poca tracción, lento | Alucina sitios, no verifica días de cierre, se pierde el resultado |

**Posicionamiento recomendado:** *"El planificador IA en español"*. Ni TripIt (post-reserva), ni Wanderlog (herramienta manual con IA pegada): Itineraya empieza donde el usuario está de verdad — "quiero ir a París y no sé por dónde empezar". Contra ChatGPT (el competidor real): atacar con la comparación honesta (idea #3): estructura persistente, mapa, fotos, horarios verificados contra tus fechas, compartible. Contra Wanderlog: idioma + simplicidad + generación primero. **Foso a construir:** el feed de itinerarios reales en español (UGC indexable que ningún competidor tiene) + personalización por historial de viajes (ya en el prompt).

---

## 9. Los 10 KPIs y dónde implementarlos

*(Recomendación: PostHog — EU cloud por GDPR, autocapture off, eventos explícitos. SDK en `__root.tsx`, eventos de servidor vía `posthog-node` en las server functions.)*

| # | KPI | Definición | Dónde instrumentarlo |
|---|---|---|---|
| 1 | **Activación** | % registros que ven su 1er itinerario en 24 h | Evento `itinerary_generated` al final de [generateItinerary](src/lib/itinerary.functions.ts:541) + `signup` en `AuthModal` |
| 2 | **Time-to-value** | Minutos registro → 1er itinerario | Mismos eventos, propiedad timestamp |
| 3 | **Share rate** | % viajes generados que se comparten/publican | Eventos en [ShareDialog.tsx:26](src/components/trip/ShareDialog.tsx:26) (`share_enabled`, canal en cada botón) y [PublishToggle.tsx:40](src/components/trip/PublishToggle.tsx:40) |
| 4 | **K-factor** | Registros con `?ref`/UTM de share ÷ usuarios que compartieron | UTM en las URLs de share + captura de `ref` en el signup; view_count ya existe en BD |
| 5 | **Conversión free→paid** | % free que pagan en 30 días | Ya llega por webhook: evento `subscription_created` en [webhook.ts](src/routes/api/public/payments/webhook.ts) tras el upsert |
| 6 | **Retención D7/D30** | % usuarios activos a 7/30 días de registro | `$identify` + evento `session_start` (PostHog lo deriva) |
| 7 | **Churn mensual** | Bajas ÷ suscriptores activos | Evento en webhook con `customer.subscription.deleted` + dashboard Stripe |
| 8 | **Funnel del onboarding** | Drop-off por paso (0-6) | Evento `onboarding_step` con `step` en [onboarding.tsx:179-187](src/routes/_authenticated/onboarding.tsx:179) (next/prev) |
| 9 | **Coste IA por itinerario** | € Anthropic ÷ itinerarios generados | Log de `usage.input_tokens/output_tokens` de la respuesta en generateItinerary (ya se loguea duración, línea 480) → tabla `generation_costs` |
| 10 | **Visitante público → registro** | % visitas a `/trip/$slug`·`/explore/$slug` que se registran | Evento `public_trip_viewed` en el componente + `signup` con `referrer_slug` (el `PaywallGate` es el punto de conversión) |

**North Star sugerida:** *itinerarios generados por semana* — correlaciona con valor, sharing y revenue.

---

## 10. Cinco quick wins esta semana (<2 h cada uno)

1. **UTM + ref en todos los enlaces de compartir (~1 h).** En [ShareDialog.tsx:33](src/components/trip/ShareDialog.tsx:33) y [PublishToggle.tsx:56](src/components/trip/PublishToggle.tsx:56): `?utm_source={canal}&ref={userId}`. Sin esto, todo el §1 es a ciegas. *(El fix de ratings del feed ya se aplicó en esta sesión.)*
2. **Sitemap dinámico (~2 h).** Server route `/sitemap.xml` que emite las 6 estáticas + todos los `share_slug` públicos (`is_public=true`) con `lastmod=published_at`. Convierte cada viaje compartido en una página indexada — SEO programático gratis con contenido que ya existe.
3. **Prompt de compartir tras generar (~1,5 h).** En [my-trip.$tripId.tsx:258-267](src/routes/_authenticated/my-trip.$tripId.tsx:258), cuando `generate()` resuelve, abrir `ShareDialog` con copy "Tu viaje a {destino} está listo 🎉 Compártelo con tus compañeros de viaje". Ataca el momento de máxima motivación (§1.2).
4. **Email de invitación en español/i18n (~1 h).** [tripmates.functions.ts:49-55](src/lib/tripmates.functions.ts:49) está hardcodeado en inglés para una base hispanohablante: pasar idioma del invitador y dos plantillas es/en. El invite es un canal de adquisición — cada email es un pitch.
5. **Reanudar checkout tras registro (~1,5 h).** [pricing.tsx](src/routes/pricing.tsx:71) guarda `?plan=` en el returnTo pero nadie lo lee: añadir `validateSearch` + `useEffect` que llame a `handleSelect(plan)` cuando hay sesión y `?plan`. Recupera conversión de pago que hoy se pierde en silencio.

**Bonus (30 min):** publicar 3-5 viajes propios de calidad (París, Tokio, Bali…) en el feed para que `/explore` no esté vacío el día que llegue el primer pico de tráfico — el feed vacío mata la prueba social de todo lo anterior.
