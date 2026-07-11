# Itineraya — Sistema de diseño Bento

> Rediseño completo al estilo **Bento**: limpio, modular, minimalista y profesional.
> Reemplaza la dirección 3D/cinematográfica anterior (Three.js retirado por completo).
> Consigna: **claridad y velocidad sobre espectáculo**, elevar sin romper flujos de negocio
> (Stripe, Supabase, auth, i18n).

---

## 1. Principios

- **Grid asimétrico de tiles.** Cada superficie es un mosaico de piezas de tamaños distintos
  (2×2, 2×1, 1×2, 1×1). Nada de rejillas uniformes aburridas; nada de amontonamiento.
- **Espacios negativos amplios.** `gap-3`/`gap-4` entre tiles, `py-20 sm:py-28` entre secciones.
  Todo respira.
- **Jerarquía tipográfica de 3 tamaños.** Display (`font-display`, títulos), body, small. Sin
  escalas intermedias que ensucien.
- **Paleta limitada. PUNTO.** (ver §2).
- **Animaciones sutiles.** Fade + leve subida, stagger corto, hover delicado. Cero parallax,
  cero 3D, cero mouse-glow caótico. Todo respeta `prefers-reduced-motion`.
- **Bordes redondeados generosos:** `rounded-3xl` (24px) en tiles y cards.
- **Sombras casi nulas.** Se prefiere `ring-1 ring-slate-200/70` (claridad) sobre sombras
  pesadas (profundidad). Elevación con color, no con blur.
- **Mobile-first real.** Cada tile perfecto en 375px; verificado que **nada se corta ni
  desborda** (`scrollWidth == viewport`). El grid colapsa a 1 columna en móvil.

---

## 2. Paleta

Cuatro colores. Se usan como literales Tailwind (`bg-[#0c1a2e]`, `text-[#38bdf8]`) porque el
token `sky-400` del proyecto es un pastel OKLCH que se apaga sobre navy — el Bento necesita el
sky-400 vivo real.

| Rol | Valor | Uso |
| --- | --- | --- |
| **Navy** | `#0c1a2e` | Tiles oscuros (command center, hero, features), texto principal sobre claro |
| **Sky accent** | `#38bdf8` (hover `#5cc7f9`) | CTAs, badges, iconos, números destacados, tier popular |
| **Sky icon** | `#0ea5e9` | Iconos/acento sobre fondos claros (contraste sobre blanco) |
| **Blanco** | `#ffffff` | Tiles claros |
| **Slate** | `slate-50` / `slate-500` / `slate-200` | Fondos de sección, texto secundario, rings |

Regla de contraste: navy tile → texto blanco + `text-white/70` secundario + `#38bdf8` acento.
Tile blanco → texto `#0c1a2e` + `text-slate-500` secundario + `#0ea5e9`/`#38bdf8` acento.

Colores semánticos que se conservan por significado (no decorativos): `amber` (trial/estrellas),
`emerald` (plan actual/upcoming). Todo lo demás es navy/sky/white/slate.

---

## 3. Patrones de tiles por pantalla

### Dashboard — "command center"
`src/routes/_authenticated/dashboard.tsx`
- Banda oscura de 3 tiles navy asimétricos en `lg:grid-cols-4`:
  - **Bienvenida** `lg:col-span-2` (saludo + CTA sky).
  - **Globo** `lg:col-span-2 lg:row-span-2` (medio, alto) — destinos reales del usuario.
  - **Próximo viaje** `lg:col-span-2` (countdown + clima) o prompt si no hay ninguno.
- Fila de **stats destacadas** (`StatTile`): Viajes · Países · Días planeados · Guardados,
  derivadas de datos reales.

### Landing hero
`src/components/landing/HeroSection.tsx`
- Hero navy full-width, 2 columnas: texto claro + **mockup del producto real** (tarjeta de
  itinerario). Sin Three.js. Entrada = fade + subida escalonada.

### Landing — destinos (mosaico asimétrico)
`src/components/landing/PopularDestinationsSection.tsx`
- `grid grid-cols-2 lg:grid-cols-4 auto-rows-[…] grid-flow-dense` con `BENTO_SPANS`:
  Bali `col-span-2 row-span-2` (feature), NY/Islandia `col-span-2` (ancho), Tailandia
  `row-span-2` (alto), resto `1×1`.

### Landing — cómo funciona
`src/components/landing/HowItWorksSection.tsx`
- Paso 1 = tile navy grande `lg:col-span-2 lg:row-span-2`; pasos 2-3 = tiles claros.

### Landing — showcase
`src/components/landing/ProductShowcaseSection.tsx`
- Ladrillo asimétrico `lg:grid-cols-3 items-start`: Map & Feed `col-span-2` (anchos),
  Schedule & Postcard `1 col`.

### Landing — testimonios
`src/components/landing/TestimonialsSection.tsx`
- Quote destacada navy `lg:row-span-2` (alta) + dos cards anchas claras `lg:col-span-2`.

### Feed — Masonry Bento
`src/routes/explore.index.tsx`
- Columnas CSS `columns-1 sm:columns-2 lg:columns-3` + `break-inside-avoid`. Alturas naturales
  → efecto masonry. Cards `featured` (retrato `aspect-[3/4]`) para mezcla de tamaños.

### Precios — grid limpio
`src/routes/pricing.tsx` + `src/components/ui/pricing-glass.tsx`
- Página navy, `md:grid-cols-3` equitativo (sin amontonamiento). Glassmorphism (ruido +
  mouse-glow) **retirado** por claridad. Tier popular resaltado con `ring-[#38bdf8]/45` y CTA
  `#38bdf8`. Lógica de Stripe intacta.

### Itinerario
`src/routes/_authenticated/my-trip.$tripId.tsx`
- Fix crítico móvil: `grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]` (la falta de columna
  base explícita hacía que la card del día se estirara al ancho de la imagen y quedara recortada
  por `overflow-x:clip`). Day cards `rounded-3xl`, densidad reducida en móvil (chip de hora más
  compacto) para que el contenido respire.

---

## 4. Variantes de componentes reutilizables

- **`DestinationCard` — prop `fill`** (`src/components/ui/destination-card.tsx`): en vez de
  bloquear `aspect-[4/5]`, la card llena la altura de su celda (`h-full`). Permite mosaicos de
  tamaños variados. Sin `fill`, mantiene el aspect fijo para otros usos.
- **`FeedCard` — prop `featured`** (`src/routes/explore.index.tsx`): imagen en retrato
  (`aspect-[3/4]`) en vez de `aspect-[4/3]`, para dar mezcla de alturas al masonry.
- **`StatTile`** (dashboard): tile blanco con icono en pastilla `#38bdf8/10`, número grande
  `tabular-nums` navy y label slate.

---

## 5. Motion

- Curva única de la casa: `EASE_OUT = [0.23, 1, 0.32, 1]` (`src/lib/motion.ts`).
- Entradas: fade + subida de ~16px, stagger de 60-140 ms. Springs suaves donde aporta
  (`stiffness ~280, damping ~26`).
- Todo desactivable con `useReducedMotion` + kill-switch global en `src/styles.css`.
- Nada que ralentice: solo `transform`/`opacity` (GPU). Sin parallax de scroll ni de ratón.

---

## 6. Rendimiento

- **Three.js eliminado** por completo (deps `three`/`@react-three/*` desinstaladas, chunk de
  ~867KB fuera del bundle). La velocidad ganó sobre el espectáculo.
- Masonry con CSS puro (`columns`), sin librerías.
- Lazy-loading conservado donde ya existía (globo cobe, calendario, pricing-glass, mapa).

---

## 7. Verificación

Cada pantalla se validó en navegador (dev server) midiendo el DOM, no "a ojo":
- **Overflow:** `document.documentElement.scrollWidth == viewport` a 320/375/1280px.
- **Grids:** `gridTemplateColumns`/`gridAutoRows` resueltos y tamaños de tiles reales
  (p. ej. destinos tiló exacto `593×416` / `593×200` / `288×416` / `288×200`; feed masonry
  254px de varianza de altura).
- **Colores:** `getComputedStyle` confirmó navy `rgb(12,26,46)` y accent `rgb(56,189,248)`.
- Vistas tras auth/datos (dashboard, feed) se verificaron con rutas de prueba temporales que
  renderizaban los componentes reales con mock data, y luego se eliminaron.
- Calidad: `tsc --noEmit` **0 errores**, `eslint` limpio, Prettier aplicado, **build de
  producción exit 0** en cada paso.

> Nota: el subsistema de screenshots del preview estuvo caído durante la sesión, así que la
> verificación fue **estructural** (medición del DOM) en lugar de capturas de pantalla.

---

## 8. Estado

Rediseño Bento **completo** en toda la app, en este orden: Itinerario → Dashboard → Landing
(hero + 4 secciones) → Feed → Precios. Un único sistema de diseño coherente, sin Three.js.
