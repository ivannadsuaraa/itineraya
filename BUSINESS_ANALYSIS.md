# BUSINESS_ANALYSIS.md — Itineraya

> Análisis de viabilidad, competencia, estrategia y riesgos. Generado el 2026-07-04
> leyendo el código real del repositorio. Todos los números de coste salen de
> `itinerary.functions.ts`, `api/chat.ts`, `inspire.functions.ts`,
> `itinerary-edit.functions.ts` y `pricing.tsx`. Precios de la API de Anthropic
> verificados a fecha de hoy: **Claude Haiku 4.5 = $1/M tokens de entrada, $5/M de salida.**

---

# PARTE 1 — Viabilidad del modelo de negocio

## 1.1 Coste real por itinerario generado

**Qué hace el código** (`src/lib/itinerary.functions.ts`):
- 1 llamada a `claude-haiku-4-5` con `max_tokens: 16000` y structured outputs.
- Prompt de ~4.000 caracteres (~1.100 tokens) + system (~50) + schema JSON (~350) ≈ **~1.500 tokens de entrada**.
- Salida: 5–7 actividades/día con línea de transporte y descripción ≈ **~700 tokens/día**.
- Después, 1 llamada Unsplash para el hero + 1 por día (coste $0, pero cuenta contra rate limit).

| Duración del viaje | Tokens salida | Coste entrada | Coste salida | **Total** |
|---|---|---|---|---|
| 3 días | ~2.100 | $0,0015 | $0,0105 | **~$0,012 (0,011 €)** |
| 7 días (media) | ~4.900 | $0,0015 | $0,0245 | **~$0,026 (0,024 €)** |
| 14 días (máximo real) | ~9.800 | $0,0015 | $0,049 | **~$0,051 (0,047 €)** |

**Coste medio por itinerario: ~0,025 €.** Redondeando con reintentos (el código reintenta hasta 3 veces en 429) y regeneraciones: presupuesta **0,03 €**.

Costes de los demás consumidores de IA:

| Función | Fichero | max_tokens | Coste por uso | ¿Tiene límite de plan? |
|---|---|---|---|---|
| Generar itinerario | `itinerary.functions.ts:484` | 16.000 | ~0,025 € | ✅ 2 / 15 / ∞ |
| Editar itinerario | `itinerary-edit.functions.ts:155` | 8.192 | ~0,03 € (reenvía el itinerario completo) | ❌ ninguno visible |
| Chat / copiloto | `api/chat.ts:142` | **sin límite** (default SDK) | 0,005–0,02 € por mensaje | Free: 10/día. **Pago: ilimitado** |
| Inspire (3 destinos) | `inspire.functions.ts:114` | 2.048 | ~0,003 € | ❌ **ninguno** |

⚠️ **Tres fugas de coste detectadas en el código:**

1. **El chat reenvía hasta 60 mensajes de historial** (`api/chat.ts:53`) sin prompt caching. El coste de una conversación crece cuadráticamente: una conversación completa de 60 mensajes cuesta ~0,50 €. Un suscriptor Viajero (7,99 €) que chatee 30 conversaciones largas al mes te cuesta ~15 € — **margen negativo**. Hoy es improbable, pero es el único vector donde un usuario de pago puede costarte más de lo que paga. Fix barato: `cache_control` en el system + historial, y un "fair use" de ~500 mensajes/mes.
2. **Inspire no tiene gate de plan.** Coste minúsculo (0,003 €), pero es la única función IA totalmente abierta. No urgente; documentado.
3. **Unsplash en tier demo = 50 peticiones/hora.** Un itinerario de 7 días consume 8 peticiones → **máximo ~6 itinerarios/hora** antes de caer al fallback de loremflickr (imágenes peores en el momento del pico emocional). Solicitar el tier de producción (5.000/h, gratis) es el fix de infraestructura más rentable que existe: 10 minutos de formulario.

**Coste de infraestructura por itinerario:** Supabase y Vercel son coste fijo, no marginal (una generación = 1 invocación serverless de 15–60 s + unas filas en Postgres). Marginal real ≈ 0 €.

## 1.2 Unit economics completo

**Estructura de precios real** (`pricing.tsx`): Viajero 7,99 €/mes ó 5,99 €/mes anual; Explorador 15,99 €/mes ó 13,99 €/mes anual. El checkout usa `managed_payments: {enabled: true}` (`payments.functions.ts:78`) — Stripe como merchant of record gestiona el IVA, con comisión más alta (~4–5% + IVA deducido del precio).

**Ingreso neto por suscriptor Viajero mensual:**
- 7,99 € IVA incluido → base ~6,60 € → tras comisión Stripe ~**6,20 €/mes netos**.

**Coste variable por suscriptor Viajero activo** (uso realista: 1 itinerario/mes + 2 ediciones + 40 mensajes de chat):
- 0,025 + 0,06 + 0,40 ≈ **~0,50 €/mes** → **margen de contribución ~92%** (5,70 €/mes).

**Costes fijos mensuales:**

| Concepto | Coste |
|---|---|
| Vercel Pro (necesario: las generaciones tardan >10 s, el Hobby corta) | ~18 € |
| Supabase Pro (auth + DB + backups) | ~23 € |
| Dominio, Resend free tier, Google Maps (dentro del crédito gratuito) | ~3 € |
| **Total** | **~45 €/mes** |

**LTV.** El viaje es episódico: la gente se suscribe para planificar UN viaje y cancela. Benchmark de apps de viaje consumer: churn mensual 20–30%. Con churn 25%:

| Plan | Contribución/mes | LTV |
|---|---|---|
| Viajero mensual | 5,70 € | **~23 €** (4 meses de vida media) |
| Viajero anual (5,99×12 = 71,88 € por adelantado) | ~55 € netos año 1 | **~55–75 €** |
| Explorador mensual | ~11,90 € | **~48 €** |

**El plan anual vale 2,4× más que el mensual y elimina el churn estacional.** Es tu producto más importante y hoy está enterrado en un toggle.

**CAC estimado por canal:**

| Canal | CAC por registro | Conv. registro→pago | CAC por cliente | Payback vs LTV Viajero (23 €) |
|---|---|---|---|---|
| TikTok/Reels orgánico | ~0 € (tiempo) | 2–3% | **~0 €** | Inmediato ✅ |
| SEO programático (`/viajes/*`, hoy solo 5 destinos) | ~0,1 € | 2–3% | ~4 € | <1 mes ✅ |
| Referidos/remix (⚠️ atribución rota, ver SOCIAL_STRATEGY.md) | ~0 € | 3–5% | ~0 € | Inmediato ✅ |
| Google Ads ("planificador viajes IA", CPC 0,5–1,5 €) | 5–15 € | 2% | **250–750 €** | **Nunca** ❌ |
| Meta Ads | 2–6 € | 1,5% | 130–400 € | **Nunca** ❌ |

**Conclusión sin anestesia: no puedes comprar usuarios. Con LTV de 23 € y CAC pagado de 130 €+, cada euro en ads destruye valor. El negocio solo funciona con crecimiento orgánico/viral — y el loop viral está construido pero roto (el `?ref=` no se captura). Arreglar la atribución de referidos vale más que cualquier feature.**

## 1.3 Cuántos usuarios de pago necesitas

Costes fijos 45 €/mes ÷ contribución media ~6,5 €/sub (mix 85% Viajero / 15% Explorador):

> **Break-even operativo: 7–8 suscriptores de pago.**

Para un sueldo de 2.000 €/mes brutos: ~350 suscriptores. Para 5.000 €/mes: ~850.

## 1.4 Break-even: 3 escenarios

Supuestos comunes: conv. visita→registro 8%, mix 85/15, churn mensual 22% (mensuales) / mejor con anuales.

| | **Pesimista** | **Realista** | **Optimista** |
|---|---|---|---|
| Registros/mes (mes 6) | 150 | 1.200 | 8.000 |
| Conv. registro→pago | 1,5% | 2,5% | 3,5% |
| Nuevos subs/mes (mes 6) | 2 | 30 | 280 |
| Subs en régimen (nuevos/churn) | ~10 | ~135 | ~1.500 |
| MRR en régimen | ~85 € | ~1.150 € | ~13.000 € |
| Break-even operativo | Mes 8–10 | **Mes 3** | Mes 1 |
| ¿Es un negocio? | No — hobby | Side-business sólido | Empresa |

El escenario pesimista **también cubre costes** — esa es la buena noticia estructural: con costes fijos de 45 € es casi imposible morir por caja. Se muere por abandono, no por quema.

## 1.5 Qué palanca tiene más impacto

Simulación sobre el escenario realista (135 subs, ~1.150 € MRR):

| Palanca | Cambio | MRR resultante | Impacto |
|---|---|---|---|
| **Menor churn** (22%→12%, vía anuales) | ×1,83 en base de subs | ~2.100 € | **+83%** 🥇 |
| Más usuarios (+50% registros) | +50% entradas | ~1.700 € | +50% 🥈 |
| Mayor precio (7,99→9,99) | +25% ARPU, −10% conv. | ~1.290 € | +12% 🥉 |

**El churn manda.** En un producto episódico, cada punto de churn que quitas es multiplicativo y permanente. La subida de precio es la palanca más débil: no estás limitado por precio, estás limitado por retención y volumen.

## 1.6 Proyección mes a mes, 12 meses (escenario realista, precios actuales)

Supuestos: TikTok despega gradualmente (mes 3), atribución de referidos arreglada mes 1, 25% de nuevos subs eligen anual desde mes 4, churn mensual 22% → 16% al final gracias al mix anual.

| Mes | Registros | Subs nuevos | Subs activos | MRR | Costes fijos+IA | **Neto** |
|---|---|---|---|---|---|---|
| 1 | 200 | 4 | 4 | 34 € | 50 € | −16 € |
| 2 | 350 | 8 | 11 | 94 € | 52 € | +42 € |
| 3 | 600 | 15 | 23 | 195 € | 55 € | +140 € |
| 4 | 850 | 21 | 39 | 330 € | 58 € | +272 € |
| 5 | 1.000 | 25 | 56 | 475 € | 62 € | +413 € |
| 6 | 1.200 | 30 | 74 | 630 € | 66 € | +564 € |
| 7 | 1.300 | 33 | 92 | 780 € | 70 € | +710 € |
| 8 | 1.400 | 35 | 108 | 920 € | 74 € | +846 € |
| 9 | 1.500 | 38 | 123 | 1.045 € | 78 € | +967 € |
| 10 | 1.600 | 40 | 136 | 1.155 € | 81 € | +1.074 € |
| 11 | 1.700 | 43 | 148 | 1.260 € | 84 € | +1.176 € |
| 12 | 1.800 | 45 | 158 | **1.345 €** | 88 € | **+1.257 €** |

ARR al cierre del año 1: ~16.000 €. Es un side-business rentable desde el mes 2, no una startup venture-scale. Para cambiar de liga hace falta el cambio de modelo del punto 1.7.

## 1.7 El cambio de modelo que multiplica ingresos ×3 sin tocar el producto

**Problema estructural:** vendes una suscripción mensual a un comportamiento episódico. El español medio hace 1–3 viajes/año. El 97% de tus usuarios registrados jamás pagará 7,99 €/mes por algo que usa 2 veces al año. Tu monetización actual solo captura al viajero frecuente.

**El cambio: añadir un "Pase de Viaje" de pago único (4,99–5,99 €)** — desbloquea un viaje completo: itinerario ilimitado en días, ediciones, chat durante las fechas del viaje, PDF. Sin suscripción.

Por qué multiplica ×3:
1. **Monetiza a los que nunca se suscribirían.** Si solo el 6% de los registros que hoy no convierten compra un pase (vs 2,5% que se suscribe), con 1.500 registros/mes: 90 pases × ~4 € netos = +360 €/mes adicionales que hoy son 0.
2. **Es el mejor embudo hacia el anual:** "¿Tercer pase este año? El plan anual te sale más barato" — upgrade natural con datos reales del usuario.
3. **No requiere producto nuevo.** El gate ya existe (`planLimit` en `itinerary.functions.ts:176`); es una fila más en la lógica de planes + un Price de Stripe en modo `payment` en vez de `subscription`.

Combinado: suscripciones (1.345 €) + pases (~1.400 €/mes con ese volumen) + afiliación de reservas (Parte 3) ≈ **×2,5–3 el MRR del mes 12 sin cambiar una sola pantalla del producto.**

⚠️ **Bug de modelo de negocio encontrado en el código:** el límite de 15 itinerarios del plan Viajero es **de por vida, no mensual** (`itinerary.functions.ts:180-186` cuenta *todos* los trips `ready` históricos). Un suscriptor que pague 7,99 €/mes durante un año y haga 15 viajes queda bloqueado **mientras sigue pagando**. Es una bomba de churn y potencialmente un problema de consumo: o el contador se resetea por ciclo de facturación, o el copy debe decir "15 itinerarios en total". Arreglar antes de escalar.

---

# PARTE 2 — Análisis competitivo

## 2.1 Desmontando a los cuatro

### TripIt (Concur/SAP)
- **Qué hace bien:** parsing automático de emails de reserva → itinerario maestro sin esfuerzo. Imbatible en el viajero de negocios. Pro (49 $/año) con alertas de vuelos. Marca de 15+ años.
- **Qué hace mal:** **no planifica nada.** Organiza lo ya reservado. Cero inspiración, cero recomendaciones, UI de 2015. Su dueño (SAP Concur) lo trata como feature corporativa, no invierte en consumer.
- **Por qué tiene usuarios:** automatización pasiva + años de lock-in de datos de viaje. No compite contigo en el momento "quiero planear un viaje"; compite en "ya lo reservé todo".

### Wanderlog
- **Tu competidor real.** Qué hace bien: planner colaborativo completo (mapa, presupuesto, votación, offline, importación de reservas), Pro ~40 $/año, y un **foso de contenido brutal**: miles de guías UGC + SEO que les da tráfico orgánico masivo. Ya añadieron asistente IA.
- **Qué hace mal:** sobrecargado — la curva de "primera vez → itinerario" es lenta y manual; su IA es un bolt-on lateral, no el corazón del flujo. En español su experiencia es floja.
- **Por qué tiene usuarios:** SEO ("things to do in X" → guía Wanderlog → app) + colaboración de grupo que crea invitaciones.

### Lambus
- **Qué hace bien:** viajes de grupo europeos — waypoints, documentos compartidos, gastos divididos. Buen producto alemán, cumple GDPR, marca simpática.
- **Qué hace mal:** ni inspiración ni IA seria, crecimiento estancado, poca presencia hispanohablante, monetización débil.
- **Por qué tiene usuarios:** nicho grupo+roadtrip en DACH. Es el competidor que menos te importa.

### ChatGPT (y Gemini)
- **El competidor de verdad.** Qué hace bien: gratis, cero fricción, itinerarios sorprendentemente buenos, ya está instalado en la cabeza del usuario. "Pídeselo a ChatGPT" es tu primera objeción de venta.
- **Qué hace mal:** el resultado es **texto que muere en el chat** — sin mapa, sin fotos, sin horarios estructurados, sin persistencia, sin compartir bonito, sin remix, se pierde al cerrar. Alucina sitios. No sabe tu historial de viajes.
- **Por qué tiene usuarios:** es el default de "pregúntale a la IA cualquier cosa".

**La síntesis:** TripIt organiza lo reservado, Wanderlog planifica con esfuerzo, ChatGPT genera texto desechable. **Itineraya es el único cuyo output es un artefacto: visual, estructurado, persistente, compartible y remixable, generado en 60 segundos.** Ese artefacto es el producto Y el canal de distribución (página pública + remix). Todo lo demás del análisis cuelga de esta frase.

## 2.2 Matriz de 20 features (1–10)

| # | Feature | **Itineraya** | TripIt | Wanderlog | Lambus | ChatGPT |
|---|---|---|---|---|---|---|
| 1 | Generación IA de itinerario completo | **9** | 1 | 5 | 2 | 7 |
| 2 | Velocidad idea→itinerario | **9** | 2 | 4 | 4 | 8 |
| 3 | Estructura día a día con horarios reales | **8** | 6 | 7 | 6 | 4 |
| 4 | Coherencia geográfica (zonas, transporte) | **8** | 3 | 6 | 5 | 4 |
| 5 | Imágenes / atractivo visual | **8** | 2 | 6 | 5 | 1 |
| 6 | Mapa interactivo | 6 | 3 | **9** | 7 | 1 |
| 7 | Personalización (presupuesto, estilo, historial) | **8** | 2 | 4 | 3 | 6 |
| 8 | Edición del itinerario | 6 | 4 | **9** | 7 | 5 |
| 9 | Colaboración / grupo | 4 | 3 | **9** | **8** | 1 |
| 10 | Compartir público + OG/preview | **8** | 2 | 7 | 4 | 2 |
| 11 | Remix de itinerarios de otros | **9** | 1 | 5 | 1 | 1 |
| 12 | Asistente de chat contextual al viaje | **8** | 1 | 6 | 2 | 9 |
| 13 | Copiloto en destino (tiempo real) | 6 | 4 | 5 | 5 | 7 |
| 14 | Import de reservas (email/PDF) | **1** | **10** | 7 | 6 | 1 |
| 15 | Offline | **1** | 7 | **9** | 7 | 3 |
| 16 | Reservas/booking integrado | **1** | 5 | 6 | 5 | 3 |
| 17 | Gestión de gastos de grupo | 1 | 2 | 7 | **8** | 1 |
| 18 | Contenido/SEO/guías (foso de distribución) | 2 | 3 | **10** | 3 | n/a |
| 19 | App móvil nativa | 3 (web mobile) | **9** | **9** | 8 | 9 |
| 20 | Experiencia en español | **9** | 4 | 5 | 5 | 8 |
| | **Media** | **5,8** | 3,7 | 6,8 | 5,1 | 4,1 |

Lectura honesta: **Wanderlog te gana en media** porque lleva 6 años construyendo amplitud. Tú ganas 9 de 20 filas, y las que ganas son las del **momento de creación y de compartir** (1, 2, 5, 7, 10, 11, 12, 20). Tus tres unos (import, offline, booking) son exactamente lo que importa *durante* el viaje. Eres una app de planificación excelente y una app de viaje inexistente.

## 2.3 Dónde ganas y dónde pierdes en el funnel, contra cada uno

| Etapa del funnel | vs TripIt | vs Wanderlog | vs Lambus | vs ChatGPT |
|---|---|---|---|---|
| Inspiración ("¿a dónde voy?") | ✅ ganas (Inspire) | ✅ ganas (su UGC inspira pero no personaliza) | ✅ ganas | ➖ empate |
| Primer itinerario (activación) | ✅ ganas por KO | ✅ **ganas — tu momento decisivo**: 60 s vs 30 min manuales | ✅ ganas | ✅ ganas (artefacto vs texto) |
| Refinamiento / edición | ➖ | ❌ pierdes (su editor manual es mejor) | ➖ | ❌ pierdes (conversar es más flexible) |
| Coordinación de grupo | ✅ | ❌ pierdes claramente | ❌ pierdes | ✅ |
| Reserva (vuelo/hotel/actividad) | ❌ | ❌ pierdes | ❌ | ➖ |
| Durante el viaje | ❌ pierdes (alertas, docs) | ❌ pierdes (offline, mapa) | ❌ pierdes | ➖ empate (copiloto vs app ChatGPT) |
| Post-viaje / compartir | ✅ **ganas — remix + página pública, nadie más lo tiene** | ➖ | ✅ | ✅ |

**Tu ventana de victoria es estrecha y valiosísima: del impulso inicial al itinerario compartible.** El plan correcto no es cerrar todas las derrotas, es hacer que tu ventana sea tan buena que el usuario vuelva a entrar por ella en cada viaje — y monetizar la salida hacia la reserva (afiliación) en vez de construir booking propio.

## 2.4 Cómo te copiaría cada uno si supiera que existes

| Competidor | Su movimiento | Tiempo | ¿Te mata? |
|---|---|---|---|
| **Wanderlog** | "Generate full trip with AI" como primer botón del onboarding — ya tienen la IA, el mapa y el contenido | **2–3 sprints** | Es la amenaza nº1. Tu única defensa: velocidad, español, y el loop de remix que a ellos les canibaliza el UGC |
| **ChatGPT/OpenAI** | Salida estructurada de viajes con mapa y guardado (ya hay GPTs de viaje; una feature nativa es plausible) | Cualquier trimestre | Te obliga a que tu valor sea el **loop social + persistencia + nicho**, no la generación |
| **TripIt** | Nada. SAP no mueve consumer | ∞ | No |
| **Lambus** | Añadir generación IA básica | 6 meses | No — sin distribución da igual |

## 2.5 Barreras de entrada: reales vs falsas

**Falsas (no te engañes):**
- ❌ "Nuestro prompt es mejor" — tu prompt de `itinerary.functions.ts` es bueno de verdad (coherencia geográfica, horarios, clima, día de cierre de museos), pero es replicable en una semana por cualquiera con acceso al output.
- ❌ El stack técnico — TanStack + Supabase + Haiku lo monta cualquier equipo en un mes.
- ❌ Structured outputs / calidad JSON — es una feature de la API de Anthropic, disponible para todos.

**Reales (las que hay que regar):**
- ✅ **El loop remix→registro→remix** (`trip.$slug.tsx`, `handleRemix`). Cada itinerario compartido es una landing page con CTA. Nadie más tiene "Remix este viaje". Es un efecto de red incipiente: más viajes públicos → más entradas → más viajes.
- ✅ **Historial de viajes como dato de personalización** (`itinerary.functions.ts:221-228` ya inyecta los últimos 5 viajes en el prompt). El itinerario nº5 de un usuario es mejor que el nº1, y eso no se lo lleva a otra app.
- ✅ **El mercado hispanohablante** — Wanderlog y TripIt son anglocéntricos; tu prompt distingue "comida" de "almuerzo" peninsular (`languageBlocks`, línea 412). 500M de hablantes desatendidos.
- ✅ **Velocidad de un solo founder** vs el roadmap corporativo de Wanderlog/SAP.

## 2.6 El posicionamiento que no pueden copiar

Nadie es imposible de copiar. Pero hay una posición donde copiar te sale carísimo a ti y barato a Itineraya:

> **"El itinerario que se comparte." Itineraya no es una herramienta de planificar: es la red donde los viajes de otros se convierten en el tuyo con un clic — en español, desde TikTok, en 60 segundos.**

- ChatGPT no puede copiarlo: no tiene páginas públicas, ni perfiles, ni remix — es 1:1 por diseño.
- Wanderlog no quiere copiarlo: el remix instantáneo con IA devalúa sus guías UGC escritas a mano, su foso principal. Copiarte les obliga a canibalizarse.
- TripIt/Lambus no pueden: no tienen ni generación ni gráfico social.

Cada feature nueva debería pasar el filtro: *¿hace que más itinerarios se compartan o que más compartidos se conviertan en cuentas?* Si no, es secundaria.

---

# PARTE 3 — Estrategia de producto

## 3.1 Las 5 features que más suben la conversión a pago

Ordenadas por (impacto en conversión × esfuerzo inverso), derivadas de la matriz competitiva:

1. **Pase de Viaje único (4,99 €)** — fila nueva en `planLimit` + Stripe Price en modo `payment`. Captura al 97% que nunca se suscribe. *Esfuerzo: días. Impacto: el mayor de la lista.*
2. **Enlaces de reserva con afiliación** (GetYourGuide/Civitatis/Booking) en cada actividad — el campo `url` ya existe en el schema del itinerario; cambiar el link de Google Maps por deep-link afiliado en categorías `activity`/`hotel` monetiza a TODOS los usuarios, incluidos los free, con comisiones del 6–10%. Convierte tu peor fila de la matriz (booking: 1/10) en una línea de ingresos sin construir booking. *Esfuerzo: 1–2 semanas.*
3. **Paywall en el pico emocional**: el `PaywallGate` con blur ya existe para páginas compartidas — aplicarlo al tercer itinerario propio del usuario free (mostrar días 1–2, difuminar el resto, CTA al pase/plan). Hoy el límite free es un error de texto (`LIMIT_REACHED`), que es el peor vendedor posible. *Esfuerzo: días.*
4. **Colaboración con votación de actividades** — tripmates ya existe (`tripmates.functions.ts`); añadir voto por actividad y gatearlo en Viajero. Es la feature donde Wanderlog te gana y la única que trae usuarios nuevos por invitación (cada viaje de grupo = 2–5 invitados). *Esfuerzo: 2–3 semanas.*
5. **PDF bonito + "añadir al calendario"** — ya está gateado en Explorador (`pricing.cmp.pdf`); hacerlo visible como teaser (botón con candado) en todos los itinerarios. Los teaser visibles convierten; las features invisibles no. *Esfuerzo: días (el botón; el PDF ya está en el plan).*

## 3.2 Cambio de precio/modelo que maximiza ingresos

**Modelo recomendado: freemium + pase único + empuje agresivo al anual.**

- Mantener free (2 itinerarios) como motor del loop viral.
- **Añadir Pase de Viaje 4,99 €** (punto 1.7). Es el cambio de mayor impacto.
- **Hacer del anual el default visual** en pricing (hoy el toggle esconde que 5,99×12 = 71,88 € ≈ "2 meses gratis"). Reencuadrar: *"Menos que una noche de hostal al año"*. Cada conversión anual baja el churn efectivo del sistema.
- **No** usage-based puro (fricción cognitiva en consumer), **no** teams todavía (no hay demanda demostrada).
- Arreglar el límite de por vida del Viajero → 15/mes o "ilimitado razonable".

## 3.3 Segmento de mayor LTV y cómo atacarlo

**El organizador de viajes de grupo, mujer/hombre 24–38, hispanohablante, planifica 2–4 viajes/año para su grupo de amigos o pareja.**

Por qué es el de mayor LTV:
- Viaja más veces/año que la media → más ciclos de uso → menos churn.
- **Trae usuarios**: cada viaje suyo invita 2–5 tripmates (CAC 0).
- Es quien comparte el itinerario en el grupo de WhatsApp → alimenta el loop público.
- Ya pagan por organizar (Splitwise Pro, apps de grupo) — sensibilidad al precio baja cuando organiza para otros.

Cómo atacarlo primero:
1. Contenido TikTok orientado a "organicé el viaje de mi grupo en 60 segundos" (la SOCIAL_STRATEGY.md ya apunta ahí).
2. Feature de votación (3.1.4) como gancho: "deja de discutir en el grupo, que voten aquí".
3. El flujo de invitación de tripmates debe pedir cuenta al invitado (hoy hay que verificar si lo hace) — cada invitado es un registro gratis.

## 3.4 Hoja de ruta de 6 meses a rentabilidad

La rentabilidad operativa (~8 subs) llega en el mes 2–3 casi sola; esta hoja de ruta apunta a **1.500 €+/mes netos en el mes 6**:

| Mes | Producto | Crecimiento | Objetivo de salida |
|---|---|---|---|
| **M1** | Arreglar: atribución `?ref=` (fix nº1 de SOCIAL_STRATEGY), límite de por vida del Viajero, selector 20 días vs tope real de 14 días (`Math.min(d, 14)` en `itinerary.functions.ts:245` — el usuario elige 20 y recibe 14: incidencia de soporte garantizada), Unsplash tier producción | Publicar los 3 primeros TikToks Tier S | Loop de referidos medible |
| **M2** | Pase de Viaje 4,99 € + paywall con blur en el 3er itinerario free | Cadencia TikTok 3/semana; 20 destinos SEO más en `/viajes/*` | Primeros ingresos de pase |
| **M3** | Afiliación GetYourGuide/Booking en actividades | UTM + dashboard simple de conversión por canal | Ingresos por afiliación >0; break-even holgado |
| **M4** | Votación de actividades en tripmates (gate Viajero); teaser PDF con candado | Campaña "viaje de grupo" en TikTok | Invitados/viaje ≥ 1,5 |
| **M5** | og:image con branding + imagen 1080×1920 para Stories (los dos huecos virales de SOCIAL_STRATEGY) | SEO: 50 destinos, interlinking | K-factor medible >0,15 |
| **M6** | Prompt caching en chat + fair use; pulir copiloto en destino con hora local | Doblar lo que funcione según datos de M1–M5 | **≥1.500 €/mes netos, churn <18%** |

---

# PARTE 4 — Los riesgos reales

## 4.1 Qué puede matar a Itineraya en 12 meses (por probabilidad × severidad)

1. **Nadie llega a la puerta (distribución).** El riesgo nº1 no es competencia ni tecnología: es que el TikTok no despegue y los registros se queden en decenas/mes. El producto ya es bueno; el negocio muere en silencio por falta de tráfico. *Probabilidad: alta. Severidad: letal.*
2. **Wanderlog pone la IA en su onboarding.** Te deja como "Wanderlog con menos features". *Probabilidad: media-alta. Severidad: alta.*
3. **ChatGPT/Gemini lanzan viajes estructurados nativos.** La generación se comoditiza del todo. *Probabilidad: media. Severidad: alta si tu valor sigue siendo "genera itinerarios" y no "red de itinerarios".*
4. **Churn estacional te vacía la base cada otoño.** Suscripciones de junio canceladas en septiembre. *Probabilidad: alta. Severidad: media.*
5. **Incidente de seguridad/datos.** Según la auditoría del 2026-07-04 hay una migración de seguridad **sin aplicar en producción** y `SEND_EMAIL_HOOK_SECRET` sin configurar. Un leak de datos de viajes (fechas en las que una casa está vacía…) es letal para la confianza. *Probabilidad: baja-media. Severidad: letal.*
6. **Fabricación de sitios por la IA.** El prompt ya mitiga (regla 6: "never fabricate a venue name"), pero un vídeo viral de "la IA me mandó a un restaurante que no existe" mata la credibilidad. *Probabilidad: media. Severidad: media.*

## 4.2 Mitigaciones concretas

| Riesgo | Acción concreta | Cuándo |
|---|---|---|
| Distribución | Ejecutar SOCIAL_STRATEGY con disciplina de 90 días ANTES de escribir más features; arreglar `?ref=` para saber qué funciona | Ya |
| Wanderlog copia | Correr en la dirección que no pueden seguir: remix, español, TikTok. No competir en amplitud de features | Continuo |
| ChatGPT nativo | Trasladar el valor del "qué genera" al "qué pasa después": red pública, historial, personalización acumulada, grupo | M4–M6 |
| Churn estacional | Anual como default + Pase de Viaje (el pase convierte la estacionalidad en ingresos en vez de en cancelaciones) | M2 |
| Seguridad | Aplicar la migración pendiente en prod, configurar el hook secret, mover los price IDs hardcodeados del webhook a env vars — las tres cosas están identificadas desde la auditoría | **Esta semana** |
| Alucinaciones | Botón "reportar sitio inexistente" en cada actividad + verificación por Google Places de los top venues en itinerarios muy compartidos | M3–M4 |

## 4.3 Dependencias técnicas peligrosas

| Dependencia | Riesgo real | Gravedad | Mitigación |
|---|---|---|---|
| **Anthropic API** | Único proveedor de la funcionalidad core, sin fallback: si la API cae, no se genera nada (el retry de `itinerary.functions.ts:470` solo cubre 429, no caídas). Subida de precios de Haiku impactaría poco (margen 92%) | Media | Fallback a un segundo modelo tras 3 fallos; el prompt es portable. No urgente pero barato |
| **Supabase** | Auth + DB + RLS en un solo proveedor. El riesgo no es la caída sino una **RLS mal configurada** (la migración de seguridad pendiente sugiere que ya se encontró algo). Lock-in medio (Postgres estándar, exportable) | **Alta hoy** por la migración sin aplicar | Aplicar migración; test automatizado de RLS (intentar leer trips de otro user) en CI |
| **Vercel** | Generaciones de 15–60 s en serverless: vigilar `maxDuration`; con tráfico viral los costes de función escalan de golpe (un pico de TikTok = miles de invocaciones largas el mismo día) | Media | Alertas de gasto; considerar cola/streaming para generación si los picos llegan |
| **Stripe** | Price IDs hardcodeados en `pricing.tsx:24` **y en el webhook** (auditoría): cambiar un precio exige deploy y es propenso a desincronizar sandbox/live | Media | Mover a env vars/tabla; ya identificado en la auditoría |
| **Unsplash** | Tier demo = 50 req/h → degradación silenciosa a loremflickr justo en picos de tráfico (cuando más importa la primera impresión) | Media-alta en el momento exacto del crecimiento | Solicitar producción (gratis) + cachear URLs por destino en DB |
| **Google Maps (autocomplete)** | Dentro del crédito gratuito hoy; con volumen viral el autocomplete por sesión tiene coste real | Baja | Monitorizar; debounce + session tokens si no están |

---

# Resumen ejecutivo (las 7 frases que importan)

1. Generar un itinerario cuesta **~0,025 €** y lo vendes dentro de un plan de 7,99 €: el margen (~92%) no es el problema; **la distribución sí**.
2. Break-even operativo con **8 suscriptores**; es casi imposible morir por caja, pero muy posible morir por silencio.
3. **No puedes comprar usuarios** (CAC pagado 130–750 € vs LTV 23 €): todo el crecimiento es orgánico, y tu loop viral está construido pero **roto** (atribución `?ref=` sin capturar).
4. La palanca dominante es **churn**, y en un producto episódico se ataca con **plan anual por defecto + Pase de Viaje único de 4,99 €** — ese pase es el cambio que multiplica ingresos ×3 sin tocar producto.
5. Tu ventaja competitiva no es la IA (replicable en semanas): es el **artefacto compartible + remix** — la única posición que a Wanderlog le duele copiar y que ChatGPT no puede ocupar.
6. Hay **tres bugs de negocio en el código**: límite Viajero de por vida (bomba de churn), selector de 20 días con tope real de 14, y chat sin límite de tokens ni caching (único vector de margen negativo).
7. Antes de cualquier feature nueva: **migración de seguridad en prod, atribución de referidos y Unsplash de producción** — tres arreglos de días que valen más que un trimestre de roadmap.
