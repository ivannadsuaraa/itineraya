# DIFFERENTIATION_REPORT — "ChatGPT pero bonito" → planificador de viajes

Fecha: 2026-07-06. Sin commits ni push (según lo pedido).

## PARTE 1 — Diagnóstico: por qué la app se percibía como un chatbot

Tras leer el código real de la landing, onboarding, generación, vista del itinerario y feed:

1. **El copy vendía la IA, no el viaje.** La landing lideraba con "Impulsado por Inteligencia Artificial", "deja que la IA haga el resto", "Generado por IA en 12 segundos", "IA de última generación". El título de la página era "Viajes personalizados con IA". Cuando toda tu historia es "la IA lo hace", el usuario te archiva mentalmente junto a ChatGPT — la comparación la invitaba el propio copy.

2. **Cero producto visible antes del registro.** El único vistazo al producto era una tarjeta estática pequeña **oculta en móvil** (`hidden lg:block`). Los diferenciadores reales que ChatGPT no puede dar — mapa del recorrido, agenda con horarios, postales descargables, feed de la comunidad — no aparecían en ninguna parte de la landing. Un visitante móvil veía: titular, párrafo, botones y tres grids de iconos. Exactamente el aspecto de una landing genérica de IA.

3. **Secciones de icono + título + párrafo.** `FeaturesSection` y `HowItWorksSection` eran el patrón visual más asociado a productos-envoltorio-de-GPT: describir en texto lo que la app hace en vez de enseñarlo.

4. **El onboarding era un formulario.** Tarjeta blanca + barra de progreso + "Paso X de 8". Tras escribir el destino, nada visual cambiaba: ninguna foto, ninguna sensación de viaje tomando forma.

5. **La vista del itinerario es fuerte… en desktop.** Mapa persistente, fotos por día, agenda con horas. Pero en móvil (la mayoría del tráfico) el mapa quedaba escondido tras un botón pequeño del toolbar: el diferenciador nº 1 era invisible en el primer scroll.

6. **El Remix era un botón de 11px con un icono de "sparkles"** (más lenguaje-IA) sin explicación de qué hace. El feed tiene buena base social (fotos, valoraciones, vistas) pero su mecánica distintiva no se entendía.

7. **Las postales solo se descubrían después de generar** un itinerario completo.

## PARTE 2 y 3 — Cambios implementados

### Landing ([index.tsx](src/routes/index.tsx), [HeroSection.tsx](src/components/landing/HeroSection.tsx))

- **Reposicionamiento en los primeros 5 segundos**: badge "Impulsado por IA" → **"Tu planificador de viajes personal"** (icono de mapa, no sparkles); H1 "creado en segundos" → **"Tu viaje perfecto, día a día"**; subtítulo nuevo que enumera lo tangible: *"mapa del recorrido, horarios reales, restaurantes que existen y postales para compartir. No un texto — un plan."*
- **Mockup de producto real en el hero, visible también en móvil**: tarjeta de un día de itinerario (foto de Bali, chip "Día 3 · Uluwatu", 4 paradas con chips de hora y líneas de transporte 🚶/🚕) + **mini-mapa flotante** con ruta y paradas numeradas + **chip de postal descargable**. Antes: tarjeta genérica oculta bajo 1024px.
- **Fila de pruebas bajo el CTA**: "Mapa interactivo · Horarios reales · Postales descargables" (sustituye a los avatares falsos A/M/J/L con texto de "generados en segundos").
- **Meta título/descripción** ya no lideran con IA: "Itineraya – Planificador de viajes: itinerario día a día con mapa y horarios".

### Nueva sección [ProductShowcaseSection.tsx](src/components/landing/ProductShowcaseSection.tsx) — "Esto no te lo da un chat"

Sustituye al grid genérico de iconos (`FeaturesSection`, retirada de la landing) y va **justo después del hero**. Cuatro bloques, cada uno con un mockup construido en CSS/SVG del producto real:

1. **Mapa del recorrido** — plano con calles, ruta discontinua, 4 paradas numeradas y una etiqueta de parada real ("Trattoria da Enzo · 🚶 8 min").
2. **Agenda con horarios** — día de Roma con chips de hora, emojis y transporte entre paradas; se lee como agenda de viaje, no como texto.
3. **Postales descargables** — dos postales apiladas (París, Venecia) con botón PNG. Resuelve "que se vean antes de generar".
4. **Feed + Remix** — dos tarjetas de viajes con estrellas y vistas, más una franja "¿Te gusta uno? Remix y hazlo tuyo → Explorar viajes" que enlaza a `/explore`.

El titular de la sección hace la diferenciación explícita: **"Esto no te lo da un chat"**.

### Onboarding ([onboarding.tsx](src/routes/_authenticated/onboarding.tsx))

- **"Tarjeta de embarque" viva**: desde el paso 2 aparece una franja con la **foto del destino**, su nombre, y que va acumulando fechas (con nº de días) y compañía a medida que respondes. El formulario pasa a sentirse como un viaje tomando forma delante de ti.

### Vista del itinerario ([my-trip.$tripId.tsx](src/routes/_authenticated/my-trip.$tripId.tsx))

- **Mapa prominente en móvil**: tarjeta-mapa al inicio del contenido (solo `lg:hidden`) con ruta estilizada, paradas numeradas y CTA "Ver mapa" que abre el modal de mapa completo existente. El diferenciador principal ahora es lo primero que se ve tras el hero en móvil.
- (De la iteración anterior ya venían: fotos grandes por día, acentos de color por día, chips de hora, tips 💎, postales por día y compartir al terminar — esta iteración los hace visibles *antes* de registrarse vía la landing.)

### Feed ([explore.index.tsx](src/routes/explore.index.tsx))

- **Remix protagonista**: botón principal de la tarjeta (ancho completo, gradiente de marca, `title` con tooltip explicativo) en vez de un botón de 11px.
- **Explicación de la mecánica** bajo el buscador del feed: *"Cada viaje del feed es remixable: tócalo y lo convertimos en la plantilla del tuyo."*

### i18n

Todas las claves nuevas y reescritas en los **4 idiomas** (es/en/fr/pt): `hero.*` (reescrito), `showcase.*` (nuevo, 16 claves), `onboarding.tripStripLabel`, `trip.mapPreview*`, `explore.remixTooltip` y `explore.remixExplainer`.

## Ficheros tocados

| Fichero | Cambio |
|---|---|
| `src/components/landing/HeroSection.tsx` | Reescrito: copy reposicionado + mockup de producto visible en móvil |
| `src/components/landing/ProductShowcaseSection.tsx` | **Nuevo** — 4 mockups del producto |
| `src/routes/index.tsx` | Showcase tras el hero (sustituye FeaturesSection), meta títulos nuevos |
| `src/routes/_authenticated/onboarding.tsx` | Tarjeta de embarque con foto del destino |
| `src/routes/_authenticated/my-trip.$tripId.tsx` | Tarjeta-mapa prominente en móvil |
| `src/routes/explore.index.tsx` | Remix protagonista + explicación de la mecánica |
| `src/i18n/locales/{es,en,fr,pt}.json` | Claves nuevas/reescritas en los 4 idiomas |

`FeaturesSection.tsx` queda sin usar (no borrado por si se quiere recuperar); sus claves `features.*` siguen en i18n.

## Verificación

- `npx tsc --noEmit` ✅ · JSON de los 4 locales parsea ✅ · ESLint limpio en ficheros tocados ✅ · `npm run build` ✅
- En navegador (rutas públicas): hero con copy nuevo y mockup con horarios/transporte visible en viewport estrecho, sección "A chat can't give you this" con mapa y agenda renderizando, explicación del Remix visible en `/explore`. Sin errores de consola.
- No verificable en local: el botón Remix rediseñado (el feed de dev está vacío — sin viajes públicos) y las pantallas autenticadas (onboarding, itinerario) por falta de credenciales. Verificado por tipos y lint; probar con el primer viaje real.

## Ideas descartadas conscientemente

- **Quitar toda mención a la IA** — es parte del valor; la regla aplicada es que la IA sea el *cómo*, nunca el *qué*. El qué es la guía de viaje.
- **Screenshots reales de la app en la landing** — no hay pipeline de capturas; los mockups CSS son nítidos en cualquier densidad de pantalla, pesan cero y no se desactualizan con cada cambio de UI. Candidato futuro: capturas reales autogeneradas.
- **Renderizar el mapa real (Google/Leaflet) embebido en móvil arriba del itinerario** — el componente asume ~70vh de alto y cargarlo dos veces penaliza el móvil; la tarjeta-preview que abre el modal da la misma prominencia sin el coste.
