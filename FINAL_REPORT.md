# FINAL REPORT — Mobile interaction bugs (pre-launch)

**Fecha:** 2026-07-24 · **Rama:** `claude/itineraya-mobile-bugs-1cnneq` · **Estado: cambios en working tree, sin commit ni push (según instrucciones).**

## Resumen ejecutivo

- **Bug 1 (navbar móvil): ya no existe en el código actual.** Verificado con emulación táctil real a 375px: los tres controles (hamburguesa, "Entrar", selector de idioma) reciben el toque y funcionan. No hay ningún elemento interceptando. No se necesitó ningún cambio.
- **Bug 2 (/demo "Siguiente"): causa raíz encontrada, medida y corregida.** Eran dos causas superpuestas: (a) el **banner de cookies** (fixed, `z-[2000]`) cubría por completo el botón en pantallas de 667px — el tap aterrizaba en el banner; (b) el botón quedaba `disabled` (con color, `opacity-50`) si el estado `destination` no se actualizaba — exactamente "tiene color pero no responde". Corregido: botón nunca disabled + validación al pulsar con error inline + lectura del valor del input desde el DOM como fallback + holgura inferior suficiente para que el botón siempre pueda superar al banner.
- **Extra encontrado y corregido:** `/privacy`, `/terms` y `/contact` fallaban la hidratación en **cada carga** (`<a>` anidado dentro de `<a>`: `BrandLogo` ya renderiza su propio `<Link>` y estaba envuelto en otro). También: el banner de cookies estaba **hardcodeado en español** en todos los idiomas — ahora usa i18n (es/en/fr/pt).

## Bug 1 — Navbar móvil (verificación, sin cambios)

Metodología exigida, ejecutada en Chromium con emulación iPhone (375×667, `hasTouch`, taps reales):

1. **`useTap`**: cero referencias en todo el repo (grep completo); tampoco quedan handlers `onTouchStart/onTouchEnd` custom (el único `touchstart` es el listener pasivo de cierre del dropdown de idioma, correcto). Los tres botones usan `onClick` plano.
2. **`document.elementFromPoint()`** en el centro de cada botón devuelve **el propio botón** (o su SVG hijo): hamburguesa `<button z-50>`, "Entrar" `<button>`, idioma `<button aria-label="Language">`. Nada intercepta.
3. **Inventario de elementos fixed/absolute con z-index > 10 en la landing:** solo 2 — el propio `<header>` de la navbar (z-50, 84px de alto) y el banner de cookies (z-2000, **abajo**, con envoltorio `pointer-events-none`). Ningún overlay sobre la navbar. Ningún `backdrop-filter` bloqueante (el blur de la nav es sobre sí misma).
4. **Taps reales verificados:** hamburguesa abre menú (`aria-expanded=true`, 4 links), selector de idioma abre (4 opciones) y cambia idioma efectivamente (ES↔EN comprobado en vivo), "Entrar" abre el modal de auth con formulario de email.

Los mecanismos que solo aparecen en dispositivo real (delay de doble tap, bug WebKit de `:hover` sin `cursor:pointer`, offset fantasma de la animación de entrada) ya estaban corregidos en commits previos (`styles.css` con `touch-action: manipulation` + `cursor: pointer` globales; `RouteTransition` con `initial={false}` pre-mount). Todo sigue en su sitio.

## Bug 2 — /demo "Siguiente" (corregido)

### Diagnóstico medido (elementFromPoint, 375×667, primera visita)

| Elemento | Rect |
|---|---|
| Botón "Siguiente" | y 609–653 |
| Tarjeta banner cookies (`z-[2000]`) | y 501–655 → **cubre el botón al 100%** |

`elementFromPoint()` en el centro del botón devolvía la fila de botones del banner de cookies. En 390×844 no hay solape — por eso el bug era intermitente entre dispositivos. Además el banner cubría la mitad inferior del propio input de destino.

Segunda causa: `disabled={!canContinue}` — con `opacity-50` el botón "tiene color"; si el `onChange` de iOS no dispara (autofill/dictado), `destination` queda vacío y el botón muerto sin feedback.

### Cambios (`src/routes/demo.tsx`)

1. **Nunca `disabled`**: la validación vive en `runNext()`; si el destino está vacío se muestra un error inline (`role="alert"`, i18n `demo.destRequired` en es/en/fr/pt) bajo el input, que se limpia al teclear.
2. **Fallback DOM**: si el estado está vacío al pulsar, se lee `input.value` directamente del DOM (vía ref del contenedor) y se adopta como destino.
3. **Holgura**: `pb-40 → pb-56` en móvil (224px > ~178px de franja del banner), garantizando que la fila de acciones siempre puede scrollear por encima del banner. (Se probó una fila sticky por encima del banner; se descartó porque a scroll 0 flotaba sobre el input — peor remedio que la enfermedad.)

### Verificación (taps reales, 375×667, ES)

- Con scroll a tope: botón a y379, banner a y501 → **122px de holgura**, `elementFromPoint` = botón, `disabled=false`.
- Tap con input vacío → error inline "Escribe un destino para continuar.", no avanza.
- Teclear → error se limpia → avanza a "¿Cuántos días?".
- **Simulación del fallo de iOS**: valor puesto nativamente en el input **sin** disparar el onChange de React → el botón avanza igualmente (fallback DOM funciona).
- Wizard completo por taps hasta "Generar itinerario" (nunca disabled); la generación llama al server fn y, sin `ANTHROPIC_API_KEY` local, falla **con toast y vuelta al formulario** (sin dead-end).

## Fix extra — hidratación rota en /privacy, /terms, /contact

`BrandLogo` renderiza su propio `<Link>`; esas tres páginas lo envolvían en otro `<Link to="/">` → `<a>` anidado (HTML inválido) → **"Hydration failed" en cada carga** (regeneración client-side completa). Eliminado el `Link` envolvente en las tres. Verificado: consola limpia en las 9 páginas públicas tras el fix.

## Checklist post-fixes (375px, emulación táctil, ES forzado)

| Comprobación | Resultado |
|---|---|
| Consola limpia en `/`, `/demo`, `/pricing`, `/explore`, `/viajes`, `/cookies`, `/privacy`, `/terms`, `/contact` | ✅ (tras el fix de hidratación; se excluye ruido del sandbox: proxy bloquea Unsplash/fonts/Maps) |
| Overflow horizontal a 375px | ✅ 0px en las 9 páginas |
| Inglés visible en UI española | ✅ ninguno (scan automático de palabras EN) |
| Flujo demo → signup | ✅ hasta donde el sandbox permite: wizard completo por taps, generación falla con gracia sin API key, modal de signup abre con formulario; el reclamo del viaje demo al crear cuenta está cableado en `dashboard.tsx` (readDemoTrip → insert → toast) — **el E2E completo requiere claves reales (Anthropic + Supabase); no verificable aquí** |
| Mapa centra el destino correcto | ✅ por revisión de código (no ejecutable sin Google Maps key): `GoogleTripMap` geocodifica el destino y hace `setCenter` + `fitBounds` sobre pins; actividades geocodificadas con sufijo `", destino"`; usa `geo_lat/geo_lng` guardados si existen; fallback Leaflet/Nominatim replica la lógica |
| Imágenes | ✅ `SmartImage` con red de 3 niveles (src → fallback determinista → degradado de marca); con todas las imágenes externas bloqueadas en el sandbox, las páginas renderizan limpias con degradados (observado) |

## Ficheros modificados

| Fichero | Cambio |
|---|---|
| `src/routes/demo.tsx` | Botón nunca disabled, validación en `runNext` con error inline, fallback DOM del destino, `pb-56` |
| `src/components/CookieBanner.tsx` | Textos a i18n (`cookies.*`) — antes hardcodeados en español |
| `src/i18n/locales/{es,en,fr,pt}.json` | Claves `cookies.*` y `demo.destRequired` |
| `src/routes/privacy.tsx`, `terms.tsx`, `contact.tsx` | Eliminado `<Link>` anidado sobre `BrandLogo` (fix de hidratación) |
| `vite.config.ts` | `optimizeDeps.exclude: ["@resvg/resvg-js"]` (cliente y SSR) — sin esto `vite dev` ni arranca en local (crash del optimizador con el binario nativo `.node`); no afecta al build de producción |

Solo local (no versionado): `.env.local` con stubs de Supabase (gitignored) para poder arrancar la app en el sandbox — **no** válido para desarrollo real.

## Calidad

- `tsc --noEmit`: ✅ sin errores.
- Prettier: ✅ en todos los ficheros tocados.
- ESLint: los ficheros modificados no añaden ningún error; los ~1374 errores prettier del repo son **preexistentes** (verificado contra HEAD en worktree limpio: mismos errores, mismas líneas — texto legal largo de terms/privacy, sin relación con estos cambios).
