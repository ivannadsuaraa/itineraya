# PRODUCTHUNT_LAUNCH.md — Plan de lanzamiento de Itineraya

## 0. La única idea que importa

Product Hunt está saturado de "AI travel planners". Itineraya **no compite como chatbot**: compite como *artefacto*. Todo el lanzamiento gira sobre una demostración, no una descripción: **el visitante genera su propio itinerario en 30 segundos sin registrarse** (`itineraya.com/demo`). El upvote sale de haberlo probado, no de haberlo leído.

## 1. Posicionamiento

- **Tagline (EN, 60 chars máx.):** `Real day-by-day travel plans — not a chat, a boarding pass`
- Alternativas: `Your trip, planned like a local — map, schedule, boarding pass` · `Stop asking ChatGPT for itineraries. Get one that exists.`
- **Descripción corta:** Tell Itineraya where and when. Get a day-by-day plan with real venues, transit times between stops, weather-aware scheduling, an interactive route map, downloadable postcards and a trip poster made for Instagram. Try it free, no signup.
- **Categorías:** Travel, Artificial Intelligence, Web App.
- **Anti-posicionamiento explícito** (para el primer comentario): "We built this because ChatGPT itineraries are paragraphs. A trip is not a paragraph — it's a route, a schedule, and things you can share."

## 2. Assets (preparar T-7 días)

| Asset | Detalle |
|---|---|
| Galería 1 (la que más se ve) | GIF ≤3MB: wizard demo → generación con etapas → itinerario con mapa. 10s máx. |
| Galería 2 | Screenshot del itinerario: día con foto, horarios, transporte, tip 💎 |
| Galería 3 | **Póster del viaje** (silueta del país + ruta con flechas) — es el asset más diferencial |
| Galería 4 | Boarding pass + panel de salidas (la temática aeropuerto vende identidad) |
| Galería 5 | Mapa interactivo con pins por categoría |
| Vídeo (opcional pero sube conversión) | 45s screen-recording con música, sin voz: demo end-to-end |
| Logo | 240×240, el mark actual sobre fondo sky-950 |

**Checklist técnico previo:** OG tags por idioma (pendiente, ver informe final), `/demo` smoke-test en prod, límites de rate de la demo revisados al alza para el día D (subir `GLOBAL_DAILY` en `demo.functions.ts`), Google Cloud Console arreglado (runbook en FABLE_FINAL_REPORT §4), migración de seguridad aplicada.

## 3. Calendario

**T-14 → T-7**
- Crear página "Coming soon" en PH y empezar a acumular followers (se notifican al lanzar).
- Reclutar 15–25 personas de confianza distribuidas por husos horarios (no un grupo de WhatsApp a las 9:00 — PH penaliza picos artificiales; pedir que voten *cuando lo prueben de verdad*).
- Hunter: si se consigue uno con followers en Travel/AI, bien; si no, self-hunt — en 2026 el hunter pesa poco frente al producto.

**T-1**
- Congelar deploy. Smoke test completo: landing → demo → signup → claim → póster.
- Preparar respuestas enlatadas (§5) y el primer comentario.

**Día D — martes o miércoles, 00:01 PT (09:01 CET)**
- Lanzamiento a las 00:01 PT para tener las 24h completas.
- 00:05 PT: publicar primer comentario del maker (§4).
- Mañana europea: la ventaja de un equipo en España — cubrir la franja en la que los makers americanos duermen. Compartir en X/LinkedIn personal (nunca con enlace directo de "vote for us"; enlazar la página y contar la historia).
- Tarde CET / mañana US: segunda ola — comunidades (§6), responder TODOS los comentarios en <30 min.
- Toda la noche: turnos para responder. Un comentario sin responder a las 3h se nota.

**D+1 → D+7**
- Email a los signups del día D (Resend ya integrado): "tu itinerario te espera" si no generaron.
- Badge de PH en la landing si queda top 5 del día.
- Post-mortem con números (§7) y reciclar el pico de tráfico en retargeting de contenido.

## 4. Primer comentario del maker (borrador)

> Hi PH 👋 I'm Iván, maker of Itineraya.
>
> Every AI travel tool I tried gave me the same thing: a wall of text. But a trip isn't text — it's *"can I walk from the Alcázar to lunch, and what should I order when I get there?"*
>
> So Itineraya generates **plans, not paragraphs**: each day sticks to one neighborhood, every stop has a time and the transit to the next one, meals name the dish to order, and the whole trip becomes an interactive map, downloadable postcards and a poster of your route.
>
> **You can try it without signing up** — the demo generates a real itinerary in ~30 seconds: [itineraya.com/demo]
>
> Stack for the curious: React + TanStack Start, Supabase, Claude Haiku with structured outputs, Stripe. Ask me anything — especially if an itinerary gets something wrong about your city, I want to know 😄

Ese último gancho ("dime si se equivoca con tu ciudad") convierte a los críticos en testers y genera hilo.

## 5. Objeciones esperadas y respuestas

| Comentario | Respuesta |
|---|---|
| "It's a ChatGPT wrapper" | "Fair question — the LLM is ~30% of it. The other 70%: geographic day-clustering rules, transit-time validation, weather/season constraints, structured outputs into a map + schedule + shareable artifacts. Try asking ChatGPT for a route poster of your trip 😉" |
| "Recommendations are wrong/hallucinated" | "The prompt forbids naming venues it isn't confident exist (falls back to 'trattoria in Trastevere' style), and every stop links to Google Maps to verify. If you found a bad one, tell me the city — that's gold for us." |
| "Why pay vs free ChatGPT" | "Free plan gives you 2 full trips. You pay when you want the AI editor and unlimited plans — €4.99 one-off Trip Pass if you hate subscriptions." |
| "GDPR / mis datos" | "EU-hosted (Vercel CDG1/Paris + Supabase EU), demo runs without an account, cookie consent up front." |
| Petición de features | "Adding it to the public roadmap — upvoted." (tener un board público listo) |

## 6. Distribución del día D (sin spamear)

- **Reddit**: r/travel y r/solotravel prohíben autopromo directa → publicar *utilidad* ("I made a free tool that plans a day-by-day route, no signup — roast my Lisbon itinerary") en r/SideProject, r/InternetIsBeautiful, r/artificial. 1 post por sub, tono maker.
- **X/Twitter**: hilo del maker con el GIF de la demo + el póster. Etiquetar build-in-public.
- **LinkedIn**: post personal (historia del problema, no del producto).
- **Comunidades ES**: Indie Hackers en español, Discord/Slack de makers, ProductHackers. El producto es es/en/fr/pt — el ángulo "hecho en España, lanzado global" funciona.
- **Newsletter swaps**: 2–3 newsletters de viajes o IA pequeñas (ofrecer código Explorador 1 mes).

## 7. Objetivos y medición

| Métrica | Mínimo viable | Bueno | Excelente |
|---|---|---|---|
| Posición del día | Top 10 | Top 5 | #1–3 |
| Visitas día D | 3.000 | 8.000 | 20.000 |
| Demos generadas | 400 | 1.500 | 4.000 |
| Demo → signup | 15% | 25% | 35% |
| Signups día D | 60 | 375 | 1.400 |

Instrumentación previa obligatoria: eventos `demo_start`, `demo_result`, `signup_from_demo`, `demo_claimed` (ver informe final §6.3). Sin embudo medido, el lanzamiento no enseña nada.

## 8. Riesgos del día D

- **Coste/abuso de la demo**: subir `GLOBAL_DAILY` pero vigilar el dashboard de Anthropic; Haiku a 4 días ≈ céntimos por demo. Kill-switch: bajar el límite por env… (hoy es constante — moverla a env var antes del día D).
- **Unsplash 403 por cuota** (50 req/h en key demo): pedir producción a Unsplash antes del lanzamiento o el fallback loremflickr abaratará la percepción.
- **Pico de Supabase auth**: el plan free de Supabase aguanta; revisar rate limits de signup email.
- **Caída de Google Maps**: irrelevante — Leaflet toma el control automáticamente (ya verificado).
