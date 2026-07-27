# DESIGN_REPORT.md

Rediseño visual de Itineraya (2026-07-27). **Solo diseño — ninguna funcionalidad,
handler, query, ruta ni lógica de negocio se ha tocado.** Sin commits ni push,
por instrucción explícita.

## Metodología

1. Lectura completa del código antes de tocar nada: `styles.css`, `button.tsx`,
   `card.tsx`, todas las secciones de landing, `DashboardSidebar.tsx`,
   `dashboard.tsx`, `my-trip.$tripId.tsx` (completo, 1678 líneas),
   `explore.index.tsx`, `explore.$slug.tsx`, `pricing.tsx` + `pricing-glass.tsx`,
   `demo.tsx`, `onboarding.tsx`.
2. Cambios aplicados pantalla por pantalla, en el orden pedido: Landing →
   Dashboard → Itinerario → Feed/Explore → Precios → Demo/Onboarding.
3. Verificación a 375px con Playwright tras cada bloque de cambios (capturas en
   el directorio de scratchpad de la sesión, no en el repo): landing, pricing,
   demo (pasos 1-3), explore — **cero overflow horizontal** en los cuatro.
   Dashboard/onboarding no se pudieron capturar en vivo (rutas autenticadas,
   sin credenciales de prueba en esta sesión) — verificados por revisión de
   código y por `tsc --noEmit` + `npm run lint`, ambos limpios en todos los
   ficheros tocados.
4. `tsc --noEmit`: sin errores. `npm run lint`: los únicos errores presentes
   son prettier, preexistentes, en ficheros que este rediseño no ha tocado
   (`privacy.tsx`, `reset-password.tsx`, `terms.tsx`, `swipe.js`,
   `explore.$slug.tsx`) — confirmado comparando la lista de ficheros con
   errores contra la lista de ficheros modificados.

## Primitivas compartidas

- **`components/ui/button.tsx`** — `rounded-md` → `rounded-full` (pill) en la
  base de todos los variants. Tamaños intactos (`h-11`, 44px mínimo).
- **`components/ui/card.tsx`** — `rounded-xl border shadow` → `rounded-2xl
  shadow-sm ring-1 ring-gray-100`. (Este componente no se usa en ningún sitio
  del código actual — cambio de bajo riesgo, deja la primitiva lista si se
  adopta más adelante.)

## Landing

- **`HeroSection.tsx`** — reescrito: fondo navy sólido + mockup de app falso →
  foto full-bleed real (Bali, destino más popular del feed) con overlay
  oscuro degradado, título bold blanco sin acento de color, CTA principal en
  pill negro ("Pruébalo gratis" / "Mis viajes"), CTA secundario en pill
  translúcido sobre la foto. Se eliminaron las dos tarjetas flotantes de
  mockup (mini-mapa, postal) — eran UI falsa, no foto real, y no encajaban con
  el nuevo enfoque "producto real sobre foto".
- **`DestinationTicker.tsx`** — el ticker de aeropuerto al pie del hero tenía
  `bg-sky-950/60 backdrop-blur-sm` (glassmorphism) y un acento ámbar además
  del sky → fondo sólido `bg-slate-950`, un único acento (sky).
- **`destination-card.tsx`** (usado por "Destinos populares") — el overlay de
  cada tarjeta tenía un tinte de color distinto por destino
  (`hsl(var(--theme-color)…)`, 8 hues diferentes) → overlay neutro
  `from-black/85`. El pill "Explorar" que aparecía al hover era cristal
  (`bg-white/15 backdrop-blur-md`) → pill sólido negro. Se quitó la prop
  `themeColor` (ya sin uso) del componente y de `PopularDestinationsSection.tsx`.
- **`StatsSection.tsx`** — banda `bg-[#050b16]` (navy, ancho completo) → banda
  blanca con borde superior/inferior sutil; números en `#0c1a2e`, etiqueta en
  el único acento sky.
- **`HowItWorksSection.tsx`** / **`TestimonialsSection.tsx`** — el tile
  "feature" del Bento (paso 1 / testimonio destacado) usaba
  `bg-[#0c1a2e]` (navy) → `bg-slate-950` (negro neutro). Se mantiene como
  único tile oscuro dentro de una sección mayormente blanca — es un elemento
  puntual dentro del grid, no el fondo de la pantalla, así que respeta la
  regla "nunca navy como fondo principal" mientras conserva la jerarquía
  visual del Bento.
- **`Navbar.tsx`**, **`FAQSection.tsx`**, **`FooterSection.tsx`**,
  **`ProductShowcaseSection.tsx`** — revisados, ya cumplían el espec
  (fondo blanco, único acento sky/`#1E6B9A`, sin cristal salvo el blur
  funcional del nav al hacer scroll — ver "Decisiones y límites"). Sin cambios.
- **`FeaturesSection.tsx`** — confirmado código muerto (no se importa desde
  ningún sitio). Sin tocar.

## Dashboard

- **Bento command center** (`dashboard.tsx`) — las 3 tiles superiores eran
  navy (`bg-[#0c1a2e]`): bienvenida, globo y próximo viaje/CTA vacío.
  - Bienvenida → fondo blanco, `ring-1 ring-slate-100`, CTA pill negro.
  - Globo → se mantiene como único tile oscuro (`bg-slate-950`, ya no navy
    literal), elemento puntual: la visualización de globo 3D se lee mejor
    sobre negro, y es un solo tile dentro de un grid mayormente blanco.
  - Prompt "próximo viaje" (estado vacío) → fondo blanco con ring sutil.
- **`NextTripHero`** — antes era una tile dividida en dos: foto a la
  izquierda + panel navy con countdown/clima a la derecha. El espec pide
  "próximo viaje (grande, foto full-bleed)", así que se reescribió como una
  única foto full-bleed con countdown (pill blanco) y clima (pill oscuro
  translúcido sobre la foto) superpuestos — sin panel de color aparte.
- **`StatTile`** — fondo `bg-white` → `bg-slate-50` (el espec pide
  explícitamente "stats en tiles compactos, fondo gris claro").
- **`DashboardSidebar.tsx`** — `MOBILE_NAV_ITEMS` tenía 6 entradas (Home,
  Explore, Crear, Viajes, Guardado, Perfil); el espec pide exactamente 4
  (Home, Explore, Viajes, Perfil). Se investigó el alcance de cada ruta antes
  de quitarla:
  - `/new-trip` ya tiene 5+ enlaces dentro de `dashboard.tsx` — seguro quitarlo
    del nav sin perder descubribilidad.
  - `/saved` no tenía ningún otro punto de entrada en toda la app — se añadió
    un enlace "Guardado" dentro de **`profile.tsx`** para que la función siga
    siendo alcanzable desde la UI.
  - Resultado: nav a 4 iconos, `MobileBottomBar` de `grid-cols-6` a
    `grid-cols-4`, `DesktopTopNav` hereda el mismo array.
- Trial banner (ámbar) y Referral banner (sky) — se dejaron igual: son washes
  de un solo hue de dos paradas, no "gradientes complejos", y son bandas
  promocionales funcionales, no cards.

## Itinerario (`my-trip.$tripId.tsx`)

- **`DAY_ACCENTS`** — rotaba por 5 gradientes de color distintos
  (sky/violeta/ámbar/esmeralda/rosa) en los chips de número de día. Con 5+
  días visibles a la vez, una sola pantalla mostraba 5 acentos simultáneos —
  violación directa de "nunca más de 2 colores de acento en la misma
  pantalla". Colapsado a un único acento sky en todos los días.
- **`getCategoryColor`** — igual: 7 hues distintas por categoría de actividad
  (hotel morado, restaurante naranja, actividad esmeralda, transporte azul,
  lugar ámbar, vida nocturna rosa, compras rosa-rojo) → un único tratamiento
  neutro (`bg-slate-100 text-slate-600`) para todas; el icono ya distingue la
  categoría, no hace falta un color distinto por cada una.
- **`ActivityRow`** — cada actividad era una caja individual con borde y
  fondo tintado (`rounded-2xl border bg-slate-50/50`). El espec pide
  "actividades como lista limpia con línea separadora" → contenedor pasa a
  `divide-y divide-slate-100`, cada fila a `py-4` plano sin caja ni tinte de
  fondo propio.
- `DayCard` (foto full-bleed + overlay + título) ya cumplía el espec casi tal
  cual — sin cambios.
- No tocado (fuera del alcance de las 6 pantallas nombradas, ver
  "Pendientes"): `LoadingScreen` y `LimitPaywall`, ambos con fondo
  `bg-sky-950` y gradientes — son estados transitorios (carga / paywall), no
  la pantalla "Itinerario" en sí.

## Feed / Explore (`explore.index.tsx`)

- Cabecera navy de ancho completo (`bg-[#0c1a2e]`) → fondo blanco, título en
  `#0c1a2e`, buscador con ring sutil en vez de `ring-white/10` sobre foto de
  fondo.
- Chips de filtro usaban 3 acentos distintos a la vez (sky-900 para estilo,
  `#1E6B9A` para duración, ámbar para "mejor valorados") → unificados al
  mismo acento sky en los tres grupos.
- `FeedCard` (masonry, 2 columnas en móvil, full-bleed + overlay + nombre
  bold) ya cumplía el espec — sin cambios estructurales.
- No tocado: `explore.$slug.tsx` (vista de un itinerario público individual)
  — no es la pantalla "Feed/Explore" nombrada explícitamente (esa es el
  listado), y tiene un rediseño propio considerable pendiente (gradiente
  diagonal de fondo + glassmorphism extenso en casi cada tarjeta). Señalado
  en pendientes.

## Precios (`pricing.tsx` + `pricing-glass.tsx`)

Era la pantalla con más incumplimientos: fondo navy de página completa,
glassmorphism en cada superficie (`bg-white/[0.03]`, `bg-white/5`,
`backdrop-blur`), 3 acentos simultáneos (sky, esmeralda, morado) y badge
"Popular" en pill sky en vez de negro.

- Fondo de página → blanco; se quitó el resplandor decorativo de fondo
  (radios blur sky sobre navy, ya no aplica).
- **`PricingCard`** (dentro de `pricing-glass.tsx`) — reescrita: cards
  translúcidas sobre navy → cards blancas sólidas (`shadow-sm ring-1
  ring-gray-100`, la popular con `shadow-lg` y traslado hacia arriba). Badge
  "Popular" → pill negro sólido (antes sky). Badge "Current" se mantiene en
  esmeralda como único indicador de estado semántico (no decorativo). CTA
  principal → negro sólido; CTA del plan actual → esmeralda suave
  (indicador de estado, no acento de marca).
- Toggle mensual/anual, nav, tarjeta del Pase de Viaje, tabla comparativa,
  bloque de garantía y FAQ de precios — todos convertidos de superficies
  translúcidas sobre navy a superficies blancas sólidas con `ring-gray-100`.
- El scrim del modal de checkout embebido (`bg-sky-950/70 backdrop-blur-sm`)
  se dejó igual — es un overlay funcional para enfocar el modal, no una
  superficie de tarjeta.

## Demo / Onboarding

- **`demo.tsx`** y **`onboarding.tsx`** — fondo degradado diagonal
  (`from-[#D6EAF8] via-white to-[#B8D4E8]`) + blobs decorativos blur → fondo
  blanco liso, sin gradiente ni decoración.
- Tarjeta del paso (`bg-white/85 backdrop-blur-xl ring-white/60`, cristal) →
  `bg-white shadow-sm ring-1 ring-gray-100`, sólida.
- Indicador de progreso: antes una fila de segmentos de barra rellenos
  (`h-2 flex-1 rounded-full`). El espec pide explícitamente "steps con número
  en círculo negro" → nuevo componente compartido **`components/ui/StepCircles.tsx`**
  (círculo negro con el número, conectado por una línea que se rellena de
  negro a medida que se avanza) usado en ambos flujos (3 pasos en demo, 8 en
  onboarding).
- CTA "Siguiente"/"Generar"/"Continuar" — pill degradado sky
  (`bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2]`) → pill negro sólido,
  **deshabilitado en gris** (`disabled:bg-slate-200 disabled:text-slate-400`)
  en vez de solo opacidad reducida sobre el mismo azul — coincide con el
  espec "deshabilitado en gris hasta escribir".
  Botón "Atrás" → pill gris sólido (antes `bg-white/70` translúcido).
  Recuadro de "check-in" (destino) y opciones de la lista (chips de
  compañía/ritmo/estilo/dietética) → fondo blanco sólido en vez de
  `bg-white/70` translúcido.
- No tocadas (transitorias, fuera de la lista de las 6 pantallas): las
  pantallas de carga (`DemoLoadingScreen`, `LoadingScreen` de itinerario) y el
  resultado de la demo (`DemoResult`, `DemoLockedDay`) — su fondo/badges no
  forman parte del flujo de formulario que el espec describe.

## Reglas absolutas — cumplimiento

| Regla | Estado |
| --- | --- |
| Nunca navy como fondo principal | Cumplido en las 6 pantallas nombradas. Quedan excepciones puntuales deliberadas: el tile del globo y el tile "feature" del Bento (un solo tile oscuro dentro de un grid mayormente blanco), y el panel "tablón de salidas" del dashboard (`DepartureBoard.tsx`, ver Pendientes) |
| Nunca glassmorphism | Cumplido en Precios, Demo/Onboarding, Hero, destination-card. Excepción mantenida: blur funcional en barras de navegación fijas al hacer scroll (`Navbar.tsx`, filtros de `explore.index.tsx`) — es una señal de estado de scroll, no una superficie decorativa de "cristal"; ver Decisiones y límites |
| Máx. 2 acentos por pantalla | Cumplido: Itinerario (sky únicamente), Explore (sky únicamente), Precios (sky + negro), Demo/Onboarding (sky + negro) |
| Bottom nav siempre visible en móvil | Sin cambios de lógica — ya se muestra condicionalmente cuando el usuario está autenticado; ahora con 4 iconos en vez de 6 |
| Fotos con `object-cover` y aspect ratio fijo | Ya era la convención existente en toda la app; no se ha alterado ningún `<img>`/`SmartImage` en ese sentido |
| Tap targets ≥ 44px | Se preservó `h-11` en todos los botones tocados; los nuevos botones (StepCircles no es interactivo, CTAs negros) se crearon con `h-11` |
| Sin overflow horizontal a 375px | Verificado con Playwright en landing, pricing, demo (3 pasos) y explore — 0 overflow en los cuatro |

## Decisiones y límites (para que el usuario decida si seguir)

1. **Blur de scroll en navbars/toolbars fijas** (`Navbar.tsx`, cabecera de
   filtros de `explore.index.tsx`, toolbar de `my-trip.$tripId.tsx`) se dejó
   sin tocar: es un `backdrop-blur` ligero usado como señal de que la barra
   ya no está sobre el hero/contenido y ahora tiene fondo sólido — un patrón
   funcional muy extendido, no un panel "de cristal" decorativo. Eliminarlo
   por completo de cada barra fija de la app es un cambio bastante más
   grande que lo que las 6 pantallas nombradas pedían; lo dejo señalado por
   si se quiere una pasada aparte.
2. **`DepartureBoard.tsx`** (vista "tablón" de viajes en el Dashboard,
   activada por defecto) y el panel de estadísticas de vuelo en
   **`profile.tsx`** — ambos con fondo casi negro (`#050b16`) y varios colores
   de estado (ámbar/esmeralda/sky) a la vez. Son la pieza central de la
   identidad "aeropuerto" de Itineraya (tablón de salidas real, letras
   split-flap) y un tablón de salidas en blanco no se leería como tal — los
   dejé como excepción deliberada de marca, con los colores de estado
   (upcoming/ongoing/done) tratados como semánticos, no decorativos. Si se
   prefiere aplicar la regla "máx. 2 acentos" también aquí, es una pieza
   aislada y localizada de rediseñar.
3. **`explore.$slug.tsx`** (vista pública de un itinerario individual desde
   el feed) no estaba en la lista de las 6 pantallas y tiene su propio
   rediseño pendiente considerable (gradiente diagonal + glass en casi cada
   tarjeta) — no tocado en esta pasada.
4. **`profile.tsx`** — solo se tocó lo estrictamente necesario (añadir el
   enlace "Guardado" que compensa el recorte del bottom nav). Su cabecera
   sigue en gradiente navy (`from-sky-950 to-sky-900`); no es una de las 6
   pantallas nombradas.
5. Trial banner y Referral banner del Dashboard mantienen sus washes de dos
   paradas del mismo hue — se interpretaron como "no complejos" (un solo
   color, sin efecto de cristal), no como el tipo de gradiente que la regla
   busca prohibir.

## Ficheros modificados

```
src/components/DashboardSidebar.tsx
src/components/airport/DestinationTicker.tsx
src/components/landing/HeroSection.tsx
src/components/landing/HowItWorksSection.tsx
src/components/landing/PopularDestinationsSection.tsx
src/components/landing/StatsSection.tsx
src/components/landing/TestimonialsSection.tsx
src/components/ui/button.tsx
src/components/ui/card.tsx
src/components/ui/destination-card.tsx
src/components/ui/pricing-glass.tsx
src/components/ui/StepCircles.tsx        (nuevo)
src/routes/_authenticated/dashboard.tsx
src/routes/_authenticated/my-trip.$tripId.tsx
src/routes/_authenticated/onboarding.tsx
src/routes/_authenticated/profile.tsx     (solo enlace "Guardado")
src/routes/demo.tsx
src/routes/explore.index.tsx
src/routes/pricing.tsx
```

`tsc --noEmit` limpio. `npm run lint` sin errores nuevos (los preexistentes
están en ficheros no tocados). Sin commits ni push, como se pidió.
