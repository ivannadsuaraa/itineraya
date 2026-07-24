# FINAL_REPORT — Auditoría de interacciones móviles pre-lanzamiento

Fecha: 2026-07-24 · Rama: `claude/itineraya-mobile-bugs-sljrkv` · Sin commits ni push (según instrucciones).

## Resultado (TLDR)

- **Bug crítico 1 (navbar móvil)**: verificado como **ya resuelto** en esta rama. `useTap` no tiene ninguna referencia restante, los tres botones usan `onClick` plano, y con emulación táctil real a 375px (`document.elementFromPoint` + taps) los tres responden: hamburguesa abre el menú, "Entrar" abre el modal de auth, y el selector de idioma abre su desplegable. Ningún overlay intercepta la navbar.
- **Bug crítico 2 (/demo, botón Siguiente)**: **reproducido y corregido**. El botón ya nunca está `disabled`; valida al pulsar con error inline y, si el estado React está vacío (fallo de `onChange` en iOS), lee el valor directamente del DOM como respaldo. Verificado con taps reales simulando el modo de fallo de iOS.
- **Bug nuevo encontrado y corregido**: `/contact`, `/privacy` y `/terms` rompían la **hidratación de React** por `<a>` anidado dentro de `<a>` (BrandLogo envuelto en otro `<Link>`) — exactamente la clase de fallo que deja páginas sin responder en móviles lentos. Corregido y verificado (0 errores de consola tras el fix).
- **Fix preventivo**: el onboarding autenticado (primer viaje tras registro) tenía el mismo patrón vulnerable de `/demo` (Siguiente `disabled` dependiente del `onChange` del autocompletado); se aplicó el mismo fix.
- Sweep final en 11 rutas públicas a 375px en español: **0 errores JS, 0 overflow horizontal, 0 texto en inglés**.

## Metodología (según lo exigido)

1. Navegador Chromium con emulación iPhone (375×667, `hasTouch`, `isMobile`, locale es-ES) contra el dev server local.
2. `document.elementFromPoint(x, y)` en el centro de cada botón roto reportado.
3. Listado de todos los elementos `position: fixed/absolute` con `z-index > 10` por página.
4. Taps táctiles reales (no clicks de ratón) para verificar cada interacción.
5. Revisión estática completa del código relevante (navbar, demo, autocompletado, overlays, CSS global).

## Bug 1 — Navbar móvil

**Evidencia recogida:**

- `grep useTap` en todo `src/`: **0 referencias**. Los tres botones usan `onClick` plano (`Navbar.tsx`, `LanguageSwitcher.tsx`).
- Overlays en la landing (`fixed/absolute`, `z>10`): solo dos — el propio `<header>` de la navbar (`z-50`) y el envoltorio del banner de cookies (`z-[2000]`, **`pointer-events-none`**, anclado abajo en y=501–667, lejos de la navbar).
- `elementFromPoint` en el centro de cada botón devuelve **el propio botón** (o su SVG interno), nunca un interceptor.
- Taps reales: hamburguesa → menú abierto ✓ · idioma → desplegable abierto ✓ · Entrar → modal de auth abierto ✓.

**Conclusión:** la causa raíz original (hook `useTap` + banner de cookies de ~248px que tapaba CTAs) fue eliminada en commits previos de esta rama (`f3fd82f`, `67d9eaf`…). En el código actual no queda ningún interceptor ni lógica táctil custom. Los defectos de CSS global que causaban el síntoma solo-en-móvil (falta de `touch-action: manipulation` y el bug WebKit de `:hover` sin `cursor: pointer` que exige doble tap) ya están cubiertos en `styles.css`.

## Bug 2 — /demo: botón "Siguiente"

**Reproducción del modo de fallo iOS** (antes del fix): fijando el `value` del input por DOM sin disparar el `onChange` de React (lo que ocurre en iOS con autofill/diccionario/QuickType), el botón quedaba `disabled` y el tap no hacía nada. Reproducido en emulación: `bars: [true,false,false]`, sin avance.

**Fix aplicado** (`src/routes/demo.tsx`):

- Eliminado `disabled={!canContinue}` — el botón siempre responde.
- Validación al pulsar: si no hay destino, muestra error inline (`role="alert"`, clave i18n `demo.destRequired` añadida en es/en/pt/fr) y no avanza.
- Respaldo DOM: si el estado React está vacío, lee `input.value` directamente del DOM y sincroniza el estado antes de avanzar.

**Verificación post-fix** (taps reales a 375px):

- `disabled` presente: **false** ✓
- Tap con destino vacío → error inline visible, no avanza ✓
- Simulación iOS (valor solo en DOM) → tap avanza al paso 2 ✓
- Flujo normal tecleado → avanza ✓
- `elementFromPoint` sobre Siguiente (banner de cookies descartado) → el propio botón ✓

**Hallazgo adicional:** en la **primera visita** (sin consentimiento de cookies guardado) y viewport de 667px, el banner de cookies (`z-[2000]`) cubre físicamente la zona del botón Siguiente — `elementFromPoint` devuelve la tarjeta del banner. Mitigado ya en esta rama (banner compacto + `pb-40` que permite hacer scroll del botón por encima + descarte con un tap). Riesgo residual: un usuario de primera visita debe descartar el banner o hacer scroll. Si se quiere eliminar del todo, habría que replantear la posición del banner en `/demo` (decisión de producto, no incluida).

## Bug encontrado durante la verificación — hidratación rota en 3 páginas

`/contact`, `/privacy` y `/terms` envolvían `<BrandLogo />` (que ya renderiza su propio `<Link>` → `<a>`) en otro `<Link>`, generando `<a>` anidado — HTML inválido. React lanzaba **"Hydration failed"** y regeneraba el árbol entero en cliente. En dispositivos lentos esto se manifiesta como página que no responde a toques hasta re-renderizar (misma familia de síntomas que los bugs reportados).

**Fix:** eliminado el `<Link>` externo; se usa `<BrandLogo linkTo="/" />`. Verificado: 0 errores de hidratación tras el fix en las tres páginas.

## Fix preventivo — onboarding autenticado

`src/routes/_authenticated/onboarding.tsx` (paso "destino" del primer viaje, parte del flujo demo → registro → primer viaje) tenía exactamente el mismo patrón que el bug 2: `disabled={!canContinue}` dependiente del `onChange` del mismo `DestinationAutocomplete`. Se aplicó el mismo fix (nunca disabled en ese paso, validación al pulsar con error inline, respaldo DOM). TypeScript y ESLint limpios.

## Verificaciones posteriores

| Verificación | Resultado |
|---|---|
| Páginas sin errores de consola | ✓ 11 rutas públicas: 0 errores JS/hidratación. (En sandbox aparecen errores de red `ERR_TUNNEL` por proxy sin acceso a Supabase/Unsplash/Google — no son bugs de la app.) |
| Flujo demo → registro → primer viaje | ✓ hasta el límite del sandbox: wizard completo por taps, "Generar" invoca la server function y falla limpiamente solo por falta de `ANTHROPIC_API_KEY` local (toast + vuelta al formulario). Modal de registro abre por tap. El registro real y la generación requieren claves de producción — **no verificable end-to-end en sandbox**. |
| Mapa centrado en el destino | ✓ por revisión de código (no ejecutable sin clave de Google Maps): usa `geo_lat/geo_lng` del viaje; si faltan, geocodifica el destino y hace `setCenter`; fallback Leaflet/OSM con el mismo contrato. Caché por `tripId`. |
| Imágenes | ✓ por revisión de código: `SmartImage` con cadena src → fallback determinista (loremflickr) → degradado de marca; sin icono de imagen rota posible. Carga real no verificable sin red. |
| Sin inglés en UI española | ✓ sweep de texto visible en 11 rutas con `lng=es`: 0 marcadores en inglés. Chequeo estático de claves i18n: todas las claves usadas existen en es/en/pt/fr (las 8 "faltantes" eran variantes plurales `_one/_other`, correctas). |
| 375px sin overflow horizontal | ✓ 0px de overflow en las 11 rutas públicas. (Rutas autenticadas no accesibles sin sesión real.) |

## Cambios en código (sin commit, en working tree de la rama)

| Fichero | Cambio |
|---|---|
| `src/routes/demo.tsx` | Bug 2: Siguiente nunca disabled, validación al pulsar, error inline, respaldo DOM |
| `src/routes/_authenticated/onboarding.tsx` | Mismo fix preventivo en el paso destino |
| `src/i18n/locales/{es,en,pt,fr}.json` | Nueva clave `demo.destRequired` |
| `src/routes/{contact,privacy,terms}.tsx` | Fix `<a>` anidado que rompía la hidratación |
| `vite.config.ts` | `optimizeDeps.exclude` para `@resvg/resvg-js` — el dev server no arrancaba (esbuild aborta con el binario `.node`); no afecta al build de producción |

## Pendientes / notas para antes del lanzamiento

1. **CookieBanner hardcodea español** (`CookieBanner.tsx`): usuarios en en/pt/fr ven el banner en español. Va contra la convención i18n del proyecto. No corregido (fuera del alcance pedido); recomendado antes del lanzamiento.
2. **Solapamiento residual del banner de cookies con el CTA de /demo en primera visita** (detallado arriba).
3. `swipe.js` en la raíz del repo no parsea como JS (error de ESLint pre-existente); parece un artefacto — revisar si debe borrarse.
4. Los errores de formato Prettier pre-existentes en `contact/privacy/terms` (82) no fueron introducidos ni corregidos aquí (`npm run lint` ya fallaba antes).
