# GENERATION_REPORT — Experiencia de creación de viaje

Fecha: 2026-07-06. Sin commits ni push (según lo pedido).

## Resumen

Rediseño completo del pipeline destino → preguntas → generación → espera → itinerario, con un objetivo: que cada respuesta del usuario tenga un efecto directo y visible en el itinerario, y que la espera y el primer vistazo se sientan como un momento, no como un formulario.

---

## PARTE 1 — Onboarding ([onboarding.tsx](src/routes/_authenticated/onboarding.tsx))

### Análisis previo

Todas las preguntas existentes **sí se usaban** en el prompt (destino, fechas, horas de llegada/salida, compañía, presupuesto, gustos, alojamiento, evitar), así que no se eliminó ninguna. Lo que faltaba eran las tres señales de mayor impacto en la personalización que ningún dato existente cubría:

| Pregunta nueva | Campo BD | Efecto directo en el itinerario |
|---|---|---|
| **Ritmo de viaje** (relajado / equilibrado / intenso) | `trips.pace` | Nº de actividades/día (4-5 / 5-6 / 6-7), hora de inicio del día, pausas de café |
| **¿Primera vez en el destino?** | `trips.first_visit` | Primera vez → imprescindibles bien ordenados; repite → se saltan los clichés top-3 y se prioriza vida local |
| **Restricciones dietéticas** (vegetariano, vegano, sin gluten, halal, alergias) | `trips.dietary` | Todos los restaurantes deben encajar; si el modelo duda de un local, elige otro que claramente cumpla |

- Nuevo **paso 4 "Ritmo"**: ritmo + primera visita en una sola pantalla (dos taps, <15 s).
- Los chips de dieta viven en el paso final de restricciones, junto al textarea de "evitar" (mismo concepto mental).
- Flujo final: 8 pasos, todos con valor por defecto salvo destino y fechas — sigue completándose en ~2-3 minutos.
- **Datos que ya existían y ahora se usan de verdad** (estaban en BD pero no llegaban al prompt): `profiles.age`, `profiles.traveler_type`, y el texto libre `trip_style` del usuario ahora se cita literalmente ("In their own words: …").

### Robustez pre-migración

El INSERT intenta guardar `pace`/`first_visit`/`dietary` y, si las columnas no existen aún en prod (migración sin aplicar), **reintenta automáticamente sin ellas** — la creación de viajes nunca se bloquea. El prompt tiene defaults para los tres campos.

**⚠️ Acción pendiente:** aplicar [supabase/migrations/20260705100000_trip_personalization.sql](supabase/migrations/20260705100000_trip_personalization.sql) en prod (3 columnas nullable, `IF NOT EXISTS`, sin riesgo).

---

## PARTE 2 — Prompt de generación ([itinerary.functions.ts](src/lib/itinerary.functions.ts))

Reescritura completa manteniendo lo que ya funcionaba bien (coherencia geográfica, transporte entre paradas, regla de playa/interior, structured outputs). Estructura nueva:

- **THE TRAVELER** — bloque de perfil unificado: edad, tipo de viajero autodeclarado, compañía, primera visita, ritmo (con instrucciones operativas: nº de actividades, hora de arranque), intereses + texto libre citado, dieta, cosas a evitar, historial de viajes previos.
- **TRIP LOGISTICS** — destino, fechas con día de la semana, llegada/salida, alojamiento ancla, presupuesto por niveles con €/día.
- **VOICE & TONE** *(nuevo)* — el tono se adapta al perfil: grupo de amigos joven ≠ familia con niños ≠ pareja ≠ viajero solo experimentado. Prohibido el relleno genérico ("disfruta del ambiente"); descripciones concretas ("pide el lampredotto", "ve al atardecer cuando se ilumina la fachada").
- **RULES** — las 9 reglas anteriores revisadas y 2 nuevas:
  - **SEASON** (mejorada): clima del mes, horas de luz (qué significa "paseo al atardecer" en invierno), temporada alta/baja con avisos de reserva, cierres y especialidades estacionales.
  - **HIDDEN GEMS** *(nueva)*: mínimo 2-3 experiencias no obvias por viaje — reales y alineadas con los intereses del viajero.
  - **TIPS** *(nueva)*: campo `tip` opcional en 1-2 actividades/día — consejo accionable (hora sin colas, qué pedir, qué entrada usar). Nunca genérico.
  - **SCHEDULE**: ahora la densidad y hora de inicio siguen el ritmo del viajero.
  - **REAL PLACES**: los restaurantes deben encajar con presupuesto **y** dieta; ante la duda, no inventar (regla anti-alucinación conservada).
- **FIELD GUIDE** — el `summary` ahora son 2 frases en segunda persona, evocadoras y específicas del viaje (es lo primero que se lee al aparecer el itinerario); los títulos de día son evocadores, no "Día 3".

### Cambio de esquema (structured outputs)

Campo opcional `tip` añadido al JSON schema de actividades. Compatible hacia atrás: itinerarios antiguos sin `tip` renderizan igual. El asistente de edición ([itinerary-edit.functions.ts](src/lib/itinerary-edit.functions.ts)) se actualizó para **conservar los tips** al modificar itinerarios.

---

## PARTE 3 — Pantalla de carga ([my-trip.$tripId.tsx](src/routes/_authenticated/my-trip.$tripId.tsx))

Antes: fondo degradado genérico + 4 mensajes rotando cada 1,8 s sin relación con el progreso.

Ahora:

- **Foto del destino a pantalla completa** con overlay oscuro y efecto Ken Burns lento (24 s). La imagen llega de loremflickr (misma fuente sin clave que usa el servidor como fallback) en cuanto se conoce el destino — que ahora se carga *antes* de lanzar la generación.
- **Nombre del destino en grande** como titular de la pantalla.
- **5 etapas narrativas ligadas al progreso real** (no a un timer independiente): "Estudiando los barrios de {destino}…" → "Buscando restaurantes para tu presupuesto…" → "Calculando las rutas más eficientes…" → "Añadiendo joyas ocultas…" → "Dando los últimos retoques…". Las etapas cuentan literalmente lo que el prompt pide al modelo.
- **Checklist visible**: etapas completadas con check verde, la actual con spinner, las pendientes atenuadas — transmite construcción, no espera.
- **Barra de progreso creíble en ~20 s**: curva asintótica hacia 97 % con τ=9 s (≈87 % a los 20 s, nunca se congela), con contador real de segundos.

---

## PARTE 4 — Vista del itinerario ([my-trip.$tripId.tsx](src/routes/_authenticated/my-trip.$tripId.tsx))

La vista ya era sólida (hero con imagen, tarjetas por día con foto, mapa lateral persistente, compartir al terminar la generación con toast + apertura automática del ShareDialog). Mejoras quirúrgicas:

- **Hero**: chip de fechas del viaje junto a la duración (`12 mar – 18 mar`), y el `summary` que llega del nuevo prompt es ahora emocional y en segunda persona.
- **Identidad visual por día**: acento de color rotatorio (5 gradientes de la paleta) en el chip de número de día y en la etiqueta "Día N" sobre la foto — los días se distinguen de un vistazo al hacer scroll.
- **💎 Consejo local**: las actividades con `tip` muestran un bloque ámbar diferenciado con el consejo del insider. También en la **página pública compartida** ([trip.$slug.tsx](src/routes/trip.$slug.tsx)) — los tips venden el producto a quien recibe el enlace.
- El momento de compartir tras generar ya existía y se conservó tal cual.

---

## Ficheros tocados

| Fichero | Cambio |
|---|---|
| `supabase/migrations/20260705100000_trip_personalization.sql` | **Nuevo** — columnas `pace`, `first_visit`, `dietary` en `trips` |
| `src/routes/_authenticated/onboarding.tsx` | Paso de ritmo + primera visita, chips de dieta, INSERT con fallback |
| `src/lib/itinerary.functions.ts` | Prompt reescrito, campo `tip` en el schema |
| `src/lib/itinerary-edit.functions.ts` | Conserva `tip` al editar |
| `src/routes/_authenticated/my-trip.$tripId.tsx` | Pantalla de carga nueva, tips, fechas en hero, acentos por día |
| `src/routes/trip.$slug.tsx` + `src/lib/share.functions.ts` | Tips en la página pública |
| `src/integrations/supabase/types.ts` | Tipos de las 3 columnas nuevas |
| `src/i18n/locales/{es,en,fr,pt}.json` | Claves nuevas en los 4 idiomas; retiradas `loading1-4` y `loadingSubtitle` (ya sin uso) |

## Verificación

- `npx tsc --noEmit` ✅
- `npm run build` (producción) ✅ (16,7 s)
- ESLint limpio en todos los ficheros tocados (los ~10 k errores CRLF del repo son preexistentes y globales)
- Dev server arranca sin errores de consola; las pantallas autenticadas (onboarding, carga, itinerario) no se pueden ejercitar en preview sin credenciales de Supabase — probar en el próximo viaje real

## Ideas descartadas conscientemente

- **Pregunta de edad en el onboarding de viaje** — ya se recoge en el welcome de perfil; duplicarla alarga el flujo.
- **Rediseño total de la vista del itinerario** — la estructura actual (tarjetas + mapa sticky + 3 vistas) funciona; se prefirió pulir sobre reescribir.
- **Streaming de la generación** — mejoraría la percepción de la espera aún más, pero cambia el contrato server function → cliente; candidato natural para una siguiente iteración.
