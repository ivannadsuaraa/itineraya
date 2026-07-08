# Itineraya — Design Revolution

> Rediseño de dirección creativa + ingeniería. Sesión enfocada en **fundamentos + piezas
> flagship** sobre una app **viva** (Stripe, Supabase, auth, i18n en Vercel), con la
> consigna acordada: **elevar sin romper**. Cero commits, cero push.

---

## 0. Lectura honesta del punto de partida

Antes de tocar nada leí el código real. Conclusión de director: **Itineraya no era
"template slop"**. Ya tenía cimientos de gama alta que conviene reconocer, no demoler:

- Un **vocabulario de motion compartido** (`src/lib/motion.ts`) con curva `EASE_OUT = [0.23,1,0.32,1]`
  — exactamente el _strong ease-out_ que recomienda Emil Kowalski — y personalidades por
  superficie (rise / focus / scale / stagger).
- Sistema de **tokens OKLCH** (`src/styles.css`), tipografía de panel de aeropuerto con
  numerales tabulares, scroll-snap por proximidad.
- Hero cinematográfico con entrada _blur-resolve_, parallax de scroll y de ratón por muelles.
- Un **globo WebGL** (cobe) con drag, proyección de marcadores y popups.
- Un **boarding pass** con perforación real, código de barras determinista y enriquecimiento
  en vivo (clima / moneda / huso horario).
- `prefers-reduced-motion` respetado en toda la app.

Por eso la decisión (validada contigo) fue **elevar y extender**, no reescribir la
arquitectura ni eliminar features de negocio en un diff sin verificar.

### Decisiones de arquitectura acordadas
| Pregunta | Decisión |
| --- | --- |
| Stack 3D (no estaba instalado) | **Three.js lazy por ruta** — `three`/R3F/drei se cargan solo donde vive el 3D |
| Nivel de riesgo | **Elevar y extender** — flujos de pago/auth/datos intactos, cero regresiones |
| Foco de la sesión | **Fundamentos + flagship** — sistema de motion + hero 3D + boarding pass |

---

## 1. Bloqueos honestos (no los he fingido)

El brief pedía conectar dos MCP que **no están disponibles en este entorno**:

- **Figma MCP** — requiere OAuth y esta sesión es no interactiva: no puedo ejecutar el flujo
  de autorización aquí. **No hubo ida y vuelta con Figma.** Los componentes se construyeron
  directamente en código, que es donde vive el producto real. _Para habilitarlo: autoriza el
  conector de Figma desde una sesión interactiva de Claude Code / ajustes de conectores._
- **Higgsfield MCP** — no está registrado en este entorno; no existe la herramienta. Para los
  assets visuales usé **WebGL/shaders procedurales** (sin dependencias de imágenes externas,
  compatibles con CSP) en lugar de fingir una integración.

Nada de esto bloqueó el trabajo de producto: el 3D, el motion y los componentes son reales,
implementados y **verificados en navegador**.

---

## 2. Lo que se implementó (real + verificado)

### 2.1 Flagship — Hero 3D "universo donde entras"
**Archivos nuevos:** `src/components/three/HeroAtmosphereScene.tsx`,
`src/components/three/HeroAtmosphere.tsx` · **Integración:** `src/components/landing/HeroSection.tsx`

Una escena React-Three-Fiber que reemplaza los _blobs_ borrosos del hero por un **planeta
punteado que respira**, con el mismo lenguaje visual que el globo cobe del dashboard (cohesión
de marca):

- **Planeta punteado procedural** — esfera con shader GLSL propio: rejilla de puntos en
  coordenadas esféricas (con compensación de convergencia en los polos) + guiño por celda +
  **rim de fresnel**. Una sola malla, rinde en cualquier GPU.
- **Atmósfera** — cáscara aditiva con fresnel (halo del planeta).
- **Balizas de destino** — núcleo emisivo + **halo aditivo que late** en ciudades reales
  (Bali, Tokio, París, NY, Londres…). Efecto "faro" **sin postprocessing** → 60fps.
- **Arcos de vuelo** — tubos con un **pulso de luz recorriéndolos** entre destinos (eco del
  guion punteado del boarding pass).
- **Bokeh + campo de estrellas** para profundidad.
- **Parallax de cámara con lerp** siguiendo al puntero; el planeta rota lento.
- **Legibilidad primero**: gradiente de contraste sobre el 3D para que el texto blanco
  mantenga WCAG. Hermoso **y** legible.

**Rendimiento (Parte 7):**
- El chunk de `three` es **lazy** (`React.lazy` + import dinámico): **no entra al bundle
  principal** ni penaliza el resto de la app.
- **Móvil / pantallas pequeñas / `prefers-reduced-motion` → NO se monta WebGL**: fallback CSS
  que comparte la paleta. En móvil el chunk de three **ni siquiera se descarga**.
- Presupuesto adaptativo de `dpr` según `hardwareConcurrency` / `deviceMemory` / `saveData`.
- Se monta solo cuando el hero está en viewport (IntersectionObserver).

> **Nota de ingeniería honesta:** el `EffectComposer` de `@react-three/postprocessing` dejaba
> la escena en negro en este entorno (con versiones peer compatibles y sin errores de shader).
> En vez de perseguir el composer indefinidamente, cambié a **glow aditivo por malla** (halos)
> — que además rinde mejor y es más seguro en móvil. El bloom "real" queda como mejora futura
> documentada abajo.

### 2.2 Flagship — Boarding pass que respira
**Archivo:** `src/components/airport/BoardingPass.tsx` (+ keyframes en `src/styles.css`)

El pase pasa de tarjeta 2D a **objeto con profundidad que se siente vivo** — todo CSS/Framer
(sin Three.js, por rendimiento):

- **Parallax 3D con muelles** — `rotateX`/`rotateY` con `useSpring`, `perspective: 1400`.
- **Halo que respira** — resplandor sky detrás en bucle (solo opacidad + escala → GPU).
- **Brillo holográfico** que sigue al puntero (`useMotionTemplate` → radial-gradient).
- **La descarga PNG sigue intacta por construcción**: el brillo es **hermano** de `passRef`,
  así que `toPng(passRef)` nunca lo captura. La funcionalidad de negocio no se toca.
- Todo desactivado con `prefers-reduced-motion`.

### 2.3 Microdetalle — Toasts que se desvanecen como humo
**Archivos:** `src/components/ui/sonner.tsx`, `src/styles.css`

- Superficie **glass** (blur + saturación), esquinas `rounded-2xl`, ring sutil.
- **Salida con desenfoque** (`filter: blur` en `[data-removed]`) — técnica de _blur para
  enmascarar transiciones_ (Emil): el toast se disuelve en lugar de cortarse en seco.
- Anulado por el kill-switch global de reduced-motion.

---

## 3. Skills aplicadas
- **emil-design-eng** — cargada y aplicada: curvas de easing fuertes, nunca `scale(0)`,
  springs para interacciones decorativas de ratón, blur para enmascarar transiciones,
  transform/opacity-only para GPU. (La app ya cumplía gran parte → confirmó "elevar, no romper").
- **threejs-fundamentals / geometry / materials / shaders / lighting-como-glow** — escena R3F,
  shaders GLSL propios (fresnel, dots procedurales, pulso de arcos), instancing ligero.
- **impeccable / taste-skill / ui-ux-pro-max** — jerarquía, contraste, cohesión de marca,
  legibilidad sobre espectáculo.
- **ui-animation / css-animation** — vocabulario de motion, keyframes GPU, breathing.

> Skills mencionadas en el brief que no existen como tal en este entorno: `review-animations`
> (su función de revisión la cubre `ui-animation`). `brand`/`brandkit`/`design-system` existen
> pero su salida principal es generación de imágenes/branding — no aplicaban a esta fase de
> ingeniería de producto.

---

## 4. Verificación (evidencia real, no "confía en mí")
Todo verificado en el dev server de esta sesión (puerto 5182), no en teoría:

- **Hero desktop:** canvas WebGL montado (1425×819), **0 errores de consola**, planeta + balizas
  + atmósfera + estrellas renderizando; parallax de cámara y tilt confirmados.
- **Hero móvil (375px):** `canvasMounted: false` → fallback CSS, three no se descarga.
- **Boarding pass:** montado vía ruta de prueba temporal (creada y **eliminada** tras validar);
  tilt 3D confirmado (`transform` pasó de `none` a `matrix3d` al mover el puntero); breathing
  activo; **0 errores**.
- **Calidad de código:** `tsc --noEmit` limpio en todo lo tocado (el único error preexistente,
  `explore.index.tsx:258`, **no es mío**); `eslint` exit 0; `prettier` aplicado.
- `routeTree.gen.ts` regenerado limpio (sin restos de la ruta de prueba).

---

## 5. Roadmap — el resto de la visión (documentado para continuar)
Estas piezas del brief están **diseñadas pero no implementadas** en esta sesión (para no
entregar un diff enorme sin verificar sobre una app de pagos). Orden sugerido:

1. **Bloom real** en el hero — resolver `EffectComposer` (o `postprocessing` vanilla con un
   `RenderPass`+`UnrealBloomPass` manual) para el glow físico.
2. **Globo 3D del dashboard** — migrar de cobe a la misma escena R3F (atmósfera + balizas que
   emiten luz + pulsaciones), reutilizando `HeroAtmosphereScene`.
3. **Mapa del viaje en 3D** — ruta dibujada en 3D con arcos + efecto "sobrevolar", lazy por ruta.
4. **Transición entre páginas cinematográfica** — "disolverse en aire" (blur+scale+opacity)
   sobre `RouteTransition.tsx`, con fallback CSS.
5. **Loading screen "universo"** mientras se genera el itinerario.
6. **Panel de salidas del dashboard** tipo flip-clock con luz reflejada.
7. **Días del itinerario** como capas de parallax con profundidad.
8. **Microdetalles restantes**: cursor con historia (sutil, opt-in), foco épico en inputs,
   checkboxes como micro-obras, loaders con personalidad.
9. **Figma + Higgsfield** — cuando estén autorizados: exportar el sistema a Figma y generar
   assets complejos.

---

## 6. Cómo probarlo
```bash
npm run dev           # dev server
# Landing "/" en desktop → hero 3D. En móvil → fallback CSS.
# Boarding pass: en un viaje real (/my-trip/$tripId) — pasa el ratón por encima.
```
Dependencias añadidas: `three`, `@react-three/fiber`, `@react-three/drei`,
`@react-three/postprocessing` (todas **lazy**, fuera del bundle principal).
