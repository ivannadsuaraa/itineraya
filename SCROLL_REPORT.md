# SCROLL_REPORT.md — Animaciones de scroll + temática de aeropuerto

Fecha: 2026-07-07 · Sin commits ni push (working tree con todos los cambios).

## Estado de verificación

- `npx tsc --noEmit` → sin errores.
- `npm run build` → build de producción correcta (17 s).
- `npx eslint --fix` sobre todos los ficheros tocados → 0 errores (solo 3 warnings pre-existentes de fast-refresh por exportar helpers junto a componentes).
- Verificado en navegador (dev server): landing (navbar transparente→sólida, ticker, stats con count-up, reveals por sección, CTA "Embarcar") y feed (chips "All gates / Adventure Terminal / Relax Lounge…", slide-in, skeletons). Las rutas autenticadas (dashboard, itinerario, onboarding, perfil) compilan y pasan tipos pero no se pudieron navegar en el preview por requerir sesión.

---

## Infraestructura nueva (compartida)

| Fichero | Qué aporta |
|---|---|
| [ScrollReveal.tsx](src/components/ui/ScrollReveal.tsx) | Reveals por viewport (`whileInView`, IntersectionObserver interno de framer) con 5 direcciones: `up`, `left`, `right`, `scale`, `blur`. + `RevealGroup`/`RevealItem` para cascadas con stagger configurable. Reduced-motion → render estático. |
| [CountUp.tsx](src/components/ui/CountUp.tsx) | Contador 0→N al entrar en viewport. Escribe en el DOM vía ref (cero re-renders por frame), formato por locale, reserva ancho (sin CLS). |
| [BackToTop.tsx](src/components/ui/BackToTop.tsx) | Botón flotante "volver arriba". `useScroll` + `useMotionValueEvent` (setState solo al cruzar el umbral, nunca listener por frame). |
| [ReadingProgress.tsx](src/components/ui/ReadingProgress.tsx) | Barra de progreso de lectura (scaleX + spring, motion value directo). |
| [flight.ts](src/lib/flight.ts) | Vocabulario aeroportuario determinista: nº de vuelo IT-XXXX, gate, asiento, clase por plan, código IATA ficticio, haversine/millas, coordenadas GPS formateadas, estado del viaje, ciudad base por idioma. |
| [FlipText.tsx](src/components/airport/FlipText.tsx) | Efecto split-flap (Fliboard): letras que ciclan y se asientan de izquierda a derecha. **Gate de gama baja**: `navigator.deviceMemory ≤ 4 GB` o ≤ 2 núcleos → texto estático. También estático en SSR y con reduced-motion. |

## PARTE 1 — Landing

- **Parallax del hero al hacer scroll** ([HeroSection.tsx](src/components/landing/HeroSection.tsx)): tres capas a velocidades distintas (fondo decorativo 26 %, mockup 14 %, texto 7 %) vía `useScroll` + `useTransform`. **Solo desktop** y sin reduced-motion. Se mantiene el parallax de ratón que ya existía.
- **Una animación distinta por sección**: ProductShowcase → cabecera `up` + bloques alternando `left`/`right`; PopularDestinations → cabecera desde la izquierda; HowItWorks → cabecera con **blur que se resuelve**; Testimonials → **scale**; FAQ → blur; CTA final → up.
- **Stats con count-up** ([StatsSection.tsx](src/components/landing/StatsSection.tsx), nueva): banda navy con 12.400+ itinerarios / 1.900+ destinos / 4,8/5 contando desde 0 al entrar en viewport. Nota: cifras de marketing — ajustadlas a datos reales cuando los tengáis.
- **Destinos populares en cascada**: stagger de **80 ms** (`RevealGroup stagger={0.08}`).
- **"Cómo funciona" en secuencia**: stagger largo (180 ms) + línea de pista punteada conectando los pasos en desktop.
- **CTA final vibra sutilmente**: wiggle de rotación ±1,4° cada ~4,5 s solo mientras está a la vista (framer lo pausa fuera del viewport); desactivado con reduced-motion.

## PARTE 2 — Itinerario ([my-trip.$tripId.tsx](src/routes/_authenticated/my-trip.$tripId.tsx))

- **Cards de día fade-up**: ya existía (`DayReveal` con blur+y); se conserva.
- **Línea del timeline progresiva**: ya existía en [timeline.tsx](src/components/ui/timeline.tsx) (vista "Línea de tiempo"); se conserva.
- **Actividades en cascada con stagger de 40 ms**: `RevealGroup stagger={0.04}` dentro de cada DayCard.
- **Parallax sutil de las imágenes de día**: ya existía (±6 % con `useScroll` por card, solo desktop); se conserva.
- **Indicador de día activo**: nuevo `DayScrollNav` sticky bajo el toolbar — chips "Día N" cuyo activo sigue el scroll (IntersectionObserver con franja central del viewport) y cuyo pill se desliza con `layoutId` + spring. Click → scroll suave a la sección.
- **Mapa que se "despliega"**: panel de mapa desktop y preview móvil se revelan con `clip-path: inset()` de arriba abajo.

## PARTE 3 — Feed ([explore.index.tsx](src/routes/explore.index.tsx))

- Cards con `whileInView` (ya existía, ahora con reduced-motion correcto).
- **Stagger distinto móvil/desktop**: desktop 90 ms siguiendo las 3 columnas; móvil 40 ms.
- **Zoom sutil de imágenes al entrar**: wrapper `scale 1.12→1` (el zoom de hover queda en el `<img>` interior para no pelear con framer).
- **Imágenes oscuras → iluminadas** (PARTE 5): `brightness(0.55) → 1` en el mismo wrapper.
- **Botón flotante "Volver arriba"** tras 640 px de scroll.
- **Chips de filtro con slide desde la izquierda** en cascada (45 ms/chip), continuada por los chips de duración.

## PARTE 4 — Efectos globales

- **Navbar transparente → sólida** ([Navbar.tsx](src/components/landing/Navbar.tsx)): a partir de 80 px pasa de píldora translúcida (texto blanco, logo invertido a blanco) a blanca con blur y sombra. Transición de 300 ms solo en background/sombra/filter.
- **Progress bar de lectura** en el itinerario (top, gradiente de marca, spring).
- **Scroll snapping suave en la landing**: `scroll-snap-type: y proximity` sobre `<html>` solo mientras la landing está montada, **solo ≥1024 px** y solo sin reduced-motion (clase `landing-snap` en [styles.css](src/styles.css)). `proximity`, no `mandatory`: sugiere, no secuestra.

## PARTE 5 — Microinteracciones de scroll

- **Dashboard: inclinación según dirección del scroll** ([dashboard.tsx](src/routes/_authenticated/dashboard.tsx)): `useVelocity(scrollY)` → spring → `rotateX` ±3° con perspectiva en las cards de viaje. Al parar el scroll vuelve a 0. Solo desktop + sin reduced-motion.
- **Imágenes del feed que se iluminan**: ver PARTE 3.

## PARTE 6 — Postales y folleto

- **Postal por día** ([postcard.ts](src/lib/postcard.ts), rediseñada): overlay en 4 capas (scrim base + gradiente lateral para la columna de texto + gradiente inferior + viñeta), logo pequeño arriba-izquierda, eyebrow mono `DÍA N · DESTINO` con tracking ancho, título display 76 px **"Día X — [Tema del día]"** con sombra suave, lista de actividades con placas de icono blanco translúcido + hora en mono + descripción, **mini-mapa esquemático con horarios junto a cada punto numerado** en panel de vidrio, indicador `+N` si no caben todas, footer con hairline "Creado con Itineraya · itineraya.com". Icono nuevo de **nightlife** (cóctel + luna) y keywords para detectarlo.
- **Folleto A4 vertical** ([TripBrochure.tsx](src/components/trip/TripBrochure.tsx), nuevo): header con **skyline SVG determinista del destino** (edificios, antenas y ventanas iluminadas sembrados por el nombre), luna y estrellas; título display + fechas + duración; **ruta esquemática con flechas** (`marker-mid/end`) y marcadores numerados; **resumen de cada día en una línea con su icono SVG**; estadísticas (días/actividades/experiencias); footer con branding. Botón "Folleto" en el toolbar del itinerario; descarga PNG a 2×.

## PARTE 7 — Temática de aeropuerto

- **Boarding pass** ([BoardingPass.tsx](src/components/airport/BoardingPass.tsx)) al inicio del itinerario: ORIGEN "TU CIUDAD" → código IATA ficticio del destino en grande, vuelo `IT-XXXX` y gate deterministas del id, fecha/duración/pasajeros (compañía) /asiento, nombre del pasajero (metadata del usuario), **clase por plan** (free→ECONOMY, viajero→BUSINESS, explorador→FIRST CLASS), **perforación dentada real** (muescas del color del fondo + línea discontinua), **código de barras SVG determinista**, coordenadas GPS del destino (geocode cacheado) y **descarga como PNG**.
- **Panel de salidas** ([DepartureBoard.tsx](src/components/airport/DepartureBoard.tsx)) en el dashboard: fondo `#050b16`, texto blanco/ámbar, reloj en vivo, columnas VUELO/DESTINO/FECHA/ESTADO, **flip de letras al cargar** (fila a fila), estados PRÓXIMO/EN CURSO/COMPLETADO/PLANIFICANDO por color, cada fila navega a su itinerario. Toggle **Panel/Tarjetas** junto al título (las cards con acciones de compartir/borrar siguen disponibles).
- **Onboarding**: paso de destino con mostrador **CHECK-IN** (marco punteado + mono), fechas **DEPARTURE / RETURN**, compañía con códigos **1 PAX / 2 PAX / 3+ PAX / FAMILY**, y al generar → **animación de despegue** ([TakeoffOverlay.tsx](src/components/airport/TakeoffOverlay.tsx)): luces de pista que aceleran, avión que rota y despega, texto de torre con flip; ~1,6 s y navega (inmediato con reduced-motion).
- **Landing**: **ticker de destinos** con flip en la base del hero (PARIS → TOKYO → BALI…, rotando cada 2,8 s) que sustituye a la onda blanca; CTA principal **"Embarcar"** (en: "Check-in", fr: "Embarquer", pt: "Embarcar"); "Cómo funciona" = **Check-in / Gate / Boarding** con códigos mono.
- **Feed**: chips **All gates / Adventure Terminal / Relax Lounge / Culture Lounge / Sunset Gate / Family Boarding / Night Flight / Nature Terminal** (iconos SVG lucide, no emoji); contador de vistas → **"X pasajeros han volado a este destino"**.
- **Perfil**: panel de vuelo con **Destinos visitados**, **Millas viajadas** (haversine ida+vuelta desde ciudad base por idioma — etiquetadas "estimadas") y **Clase de viajero**; **pasaporte digital** ([PassportStamps.tsx](src/components/airport/PassportStamps.tsx)) con un sello circular por viaje (nombre en el aro vía textPath, fecha, rotación y tinta deterministas).
- **Tipografía**: `--font-flight` (stack mono del sistema, sin fuente extra) + clase `.font-flight` con `tabular-nums`; códigos, gates y horas siempre en MAYÚSCULAS; líneas de pista punteadas (`repeating-linear-gradient`) como detalle en hero-ticker, boarding pass, stats, perfil y panel.
- **i18n**: 65 claves nuevas/actualizadas × 4 locales (es/en/fr/pt), parcheadas programáticamente para garantizar JSON válido.

## Performance y accesibilidad

- Todas las animaciones de viewport usan `whileInView`/`useInView` de framer (IntersectionObserver) — cero `window.addEventListener("scroll")`.
- Solo `transform` / `opacity` / `filter` / `clip-path`; framer gestiona `will-change` durante la animación y lo limpia al terminar.
- `prefers-reduced-motion`: doble red — `useReducedMotion()` en cada componente nuevo + kill-switch CSS global ya existente. Con RM: reveals estáticos, sin parallax, sin flip, sin tilt, despegue omitido, snap desactivado.
- Parallax (hero y tilt del dashboard) **solo desktop** (`useIsMobile`).
- Fliboard con gate de dispositivo: `deviceMemory ≤ 4` o `hardwareConcurrency ≤ 2` → estático.
- Sin layout thrashing: CountUp escribe `textContent` vía ref; navbar y BackToTop hacen setState solo al cruzar umbral; ReadingProgress/tilt son motion values puros; el ticker es un intervalo de 2,8 s.

## Notas / decisiones

1. La onda SVG del pie del hero se sustituyó por el ticker de salidas (era el borde inferior natural del hero; ambas cosas no cabían).
2. El panel de salidas es la vista por defecto de los viajes del dashboard con toggle a tarjetas, para no perder las acciones (compartir/eliminar) ni las fotos.
3. Las millas del perfil son estimadas (ida+vuelta desde Madrid/Londres/París/Lisboa según idioma) porque no se conoce la ciudad real del usuario; el hint "estimadas" lo deja claro.
4. El título de la postal usa el formato pedido "Día X — Tema"; el em-dash está horneado en la imagen, no en la UI.
5. `es.json`/`en.json`/`fr.json`/`pt.json` reformateados a 2 espacios por el parcheo JSON (mismo contenido + claves nuevas).
