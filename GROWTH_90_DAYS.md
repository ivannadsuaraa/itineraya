# GROWTH_90_DAYS.md — De 0 a 1.000 usuarios en 90 días

## Principios (por qué este plan y no otro)

1. **El producto ya tiene 3 loops integrados** — no hay que inventar canales, hay que alimentarlos:
   - **Loop de compartir**: ShareDialog con UTM + `ref` del usuario → página pública `/trip/:slug` → Remix → signup.
   - **Loop de referidos**: 3 amigos = 1 mes gratis (ya en producto, commit `5a3fc02`).
   - **Loop SEO**: rutas programáticas `viajes.*` y `/explore` ya existen.
2. **La demo es la moneda de todos los canales**: cada pieza de contenido termina en `/demo`, no en la home.
3. **Artefactos > argumentos**: postales, póster de ruta y boarding pass son contenido nativo de Instagram/TikTok que el producto fabrica solo.
4. Presupuesto asumido: ~0€ en ads. Tiempo: 1 persona, ~2h/día de growth además de producto.

**North-star**: usuarios registrados con ≥1 itinerario generado ("activados"). Objetivo: 1.000 en D90.

---

## Fase 0 — Fundaciones (Días 1–7)

**Objetivo: poder medir y no romperse.** Sin esto, el resto es ruido.

- **D1**: Instrumentar embudo (PostHog/Plausible ligero): `landing_view → demo_start → demo_result → signup → claim → trip_generated → share`. Un dashboard, cinco números.
- **D1**: Renovar `ANTHROPIC_API_KEY` local, smoke-test `/demo` en prod.
- **D2**: Runbook de Google Cloud Console (FABLE_FINAL_REPORT §4). Migración de seguridad pendiente + price IDs a env vars.
- **D3**: OG/meta por idioma (los shares en inglés hoy salen en español). OG image dinámica del itinerario compartido si es barato; si no, estática buena.
- **D4**: Key de producción de Unsplash (50 req/h no aguanta ni el lanzamiento).
- **D5–6**: Grabar el GIF/vídeo de la demo (sirve para PH, TikTok, X, todo).
- **D7**: Revisión del embudo con 10 usuarios reales (amigos, pero con la boca cerrada mirando dónde se atascan).

**KPI de salida de fase**: embudo medible extremo a extremo; demo estable en prod.

## Fase 1 — Lanzamiento (Días 8–21)

**Objetivo: 250 activados.** El pico de PH + su resaca.

- **D9 (mar/mié)**: **Product Hunt** (plan completo en PRODUCTHUNT_LAUNCH.md).
- **D10**: Resaca de PH: responder todo, email a signups sin viaje generado ("tu itinerario te espera", Resend ya está montado).
- **D11–12**: Réplica del lanzamiento por canales de segunda ola: Hacker News (Show HN, enfoque técnico: "structured outputs + reglas geográficas, no un wrapper"), Indie Hackers, betalist/alternativeto/tools directories (20 directorios en batch — SEO de backlinks, 1 tarde).
- **D13–21, diario (30 min)**: "Roast my itinerary" — publicar 1 itinerario generado en subreddit/grupo de FB del destino (r/Sevilla, r/JapanTravel…) pidiendo a locales que lo corrijan. Funciona triple: feedback del prompt, contenido, y locales que se registran para "ganarle a la IA".
- **D14 y D21**: enviar changelog + 3 mejores viajes públicos de la semana a toda la base (arranque del hábito de newsletter).

**KPI**: 250 activados, demo→signup ≥20%, K observado del ShareDialog (>0,15 sería señal de loop real).

## Fase 2 — Loops de contenido (Días 22–50)

**Objetivo: 550 activados acumulados. Encontrar EL canal.**

Correr 3 apuestas en paralelo 4 semanas y matar 2:

**Apuesta A — TikTok/Reels/Shorts (es+en)**
- 1 vídeo/día, 3 formatos rotando: (1) "Planifiqué 3 días en X en 30 segundos" screen-recording de la demo; (2) póster de ruta animado con zoom (el asset más distintivo); (3) "IA vs guía local: ¿quién planifica mejor Madrid?" con duelo real.
- El link de la bio va a `/demo`. Medir por UTM.

**Apuesta B — SEO programático (ya medio construido)**
- Auditar `viajes.$destino` / `explore.$slug`: indexación en Search Console, interlinking desde la landing, sitemap ok (existe `sitemap.xml.ts`).
- 2 páginas/semana de intención alta: "itinerario 3 días en {destino}" con un itinerario real generado embebido + CTA "personalízalo en 30s". Los viajes públicos de usuarios (Remix feed) son contenido UGC indexable gratis.
- Horizonte: no da fruto hasta D60+; se siembra ahora.

**Apuesta C — Comunidad/afiliación micro**
- 10 micro-creadores de viajes (5–50K, es/en): mes de Explorador gratis + código para su audiencia. Sin pagar cash; medir por códigos.
- 2 newsletter swaps/semana con productos indie complementarios.

**Cada viernes**: revisar el dashboard, 30 min: CAC en tiempo por canal, demo→signup por canal. **D50: matar las 2 apuestas peores.**

En paralelo, producto al servicio del growth (1 mejora/semana):
- D25: watermark sutil "itineraya.com" en postales y póster (ya lo tiene el póster en el pie — verificar en postales).
- D32: página pública de viaje: bloque "Remix este viaje" más prominente encima del fold.
- D39: email D+3 post-signup: "tu póster del viaje está listo" (reactivación con el artefacto compartible).
- D46: onboarding de referidos visible en dashboard tras el 1er viaje generado (el momento de máximo entusiasmo).

## Fase 3 — Doblar lo que funciona (Días 51–90)

**Objetivo: 1.000 activados acumulados.**

- **D51–60**: Todo el tiempo de growth al canal ganador de la Fase 2. Si es TikTok: 2 vídeos/día + duetos con creadores de viajes. Si es SEO: 5 páginas/semana + guest posts. Si es comunidad: programa de embajadores formal.
- **D60**: Post "1.000 demos generadas: qué pide la gente" (data-driven content — destinos top, duración media, % parejas vs amigos). Este tipo de post rebota en X/LinkedIn y prensa pequeña.
- **D65**: Experimento de pricing: Trip Pass 4,99€ visible en la demo para no-registrados ("¿sin cuenta? llévate este viaje por 4,99€") — solo si demo→signup se estanca <20%.
- **D70**: Segundo lanzamiento: PH relaunch no se puede, pero sí "Itineraya 2.0" en HN/IH con la feature más pedida del roadmap.
- **D75–90**: Preparar temporada: el 90% del volumen de "itinerario + destino" se busca 4–8 semanas antes de vacaciones. Si D90 cae en septiembre-octubre: contenido de puentes y escapadas; si cae en primavera: verano.

## Presupuesto de métricas (sanity check del objetivo)

| Fuente | Activados estimados |
|---|---|
| Product Hunt + resaca (F1) | 200–350 |
| Canal ganador F2–F3 (60 días × ~8/día) | 400–500 |
| SEO programático (cola desde D60) | 50–120 |
| Referidos + Remix loop (K≈0,15 sobre el resto) | 100–150 |
| **Total** | **750–1.100** ✅ |

## Cadencia operativa

- **Diario (30–60 min)**: 1 pieza de contenido, responder todo (Reddit/X/soporte), mirar los 5 números del embudo.
- **Semanal (viernes)**: revisión de canales, decidir 1 mejora de producto-para-growth, newsletter.
- **Mensual**: post público con números (build in public compone: cada post es un mini-lanzamiento).

## Señales de alarma y respuesta

| Señal | Umbral | Acción |
|---|---|---|
| Demo→signup bajo | <12% sostenido | El bloqueo de días 2+ no motiva: probar bloquear también tarde del día 1, o regalar el póster al registrarse |
| Signup→claim roto | <80% | Bug en el claim del dashboard — revisar logs de insert |
| Demos altas, retorno nulo | D7 retention <10% | El producto es single-use: empujar copilot/asistente y emails de próximo viaje |
| Coste de demo dispara | >30€/día | Bajar `GLOBAL_DAILY` / días máx. a 3; considerar captcha ligero |
