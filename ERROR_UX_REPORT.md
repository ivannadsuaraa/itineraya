# ERROR_UX_REPORT.md

Error boundaries, skeleton loading states y página 404 (2026-07-27). Los 3
puntos se verificaron en el navegador (Playwright, Chromium) antes de pasar
al siguiente, según lo pedido. Ningún commit ni push.

## 1. Error Boundaries

**`src/components/ErrorBoundary.tsx`** (nuevo) — class component (los error
boundaries de React solo pueden implementarse así, no hay equivalente con
hooks). Expone dos piezas:

- `<ErrorBoundary fallback={...}>` — captura errores de render de sus hijos
  (`getDerivedStateFromError` + `componentDidCatch`, que además hace
  `console.error` con el stack). Sin `fallback`, renderiza la pantalla
  completa por defecto: icono de aviso, **"Algo ha ido mal"**, texto
  explicativo, botón pill negro **"Recargar página"** (`window.location.reload()`)
  y botón pill gris **"Volver al inicio"** (`<a href="/">`, navegación dura
  a propósito — no depende de que el router siga sano).
- `<InlineErrorFallback message={...} />` — fallback compacto para widgets
  embebidos (mapa, globo): no tapa toda la pantalla, solo ocupa el hueco del
  propio componente, para que el resto de la pantalla siga siendo usable.

Todos los textos vía `i18n.t(...)` directo (no el hook `useTranslation`,
porque una clase no puede llamar hooks) — nuevas claves en `errors.*` de
`es.json`/`en.json`: `boundaryTitle`, `boundaryBody`, `reloadPage`,
`mapUnavailable`, `widgetUnavailable`.

**Dónde se envolvió:**

| Sitio | Fichero | Qué cubre |
| --- | --- | --- |
| `<Outlet />` de la ruta raíz | `src/routes/__root.tsx` | Red de seguridad de última instancia — cualquier ruta de la app, pública o autenticada |
| `<Outlet />` del layout autenticado | `src/routes/_authenticated/route.tsx` | Dashboard, itinerario, new-trip, onboarding, perfil, saved, welcome, assistant, copilot, inspire — todas a la vez, con la barra de navegación intacta si una de ellas revienta |
| `<TripMap>` (mapa fullscreen y de columna) | `my-trip.$tripId.tsx` (2 sitios) | Fallback inline — un fallo del mapa no tira el resto del itinerario |
| `<TripMap>` (vista mapa) | `explore.$slug.tsx` | Igual, en la página pública de un viaje |
| `<GlobePolaroids>` | `dashboard.tsx` | Fallback inline — un fallo del globo 3D no tira el resto del dashboard |

**Por qué dos niveles (root + layout autenticado):** si una página
autenticada revienta, el boundary del layout la atrapa primero y el usuario
sigue viendo la barra de navegación para poder salir de ahí — degradación
más suave que caer directo a la pantalla completa del boundary raíz.

**Verificación:** se creó una ruta temporal (`/dev-eb-test`, borrada al
terminar) con un componente que lanza un error al pulsar un botón, envuelto
en `<ErrorBoundary>`. Confirmado en Chromium:
- Estado inicial: renderiza normal.
- Tras el error: aparece la pantalla de fallback (no pantalla en blanco).
- Con `locale: "es-ES"`: título/botones en español ("Recargar página",
  "Volver al inicio"); con locale por defecto del navegador (inglés en este
  entorno): "Reload page" / "Back to home" — el componente sigue la misma
  convención bilingüe que el resto de la app, no hay texto hardcodeado.
- Clic en "Volver al inicio" navega correctamente a `/`.
- Sanity check en `/`, `/explore`, `/pricing`, `/demo`: el boundary no se
  dispara en el flujo normal (no hay falsos positivos).

## 2. Loading states y Skeleton Screens

Todos con `animate-pulse` de Tailwind, con la misma forma que el contenido
real (nunca un spinner genérico donde antes no lo había).

| Pantalla | Qué se añadió | Estado previo |
| --- | --- | --- |
| **Dashboard** — tiles superiores | `StatTileSkeleton` (icono + número + etiqueta) ×4, y un bloque pulse para la tile de "próximo viaje", mientras `trips === null` | Antes mostraban `0` y el prompt "planea tu próximo viaje" de golpe, luego saltaban al valor real — flash de contenido incorrecto |
| **Dashboard** — lista de viajes | *(sin cambios)* | Ya tenía un skeleton de 6 cards con la forma de `TripCard` |
| **Itinerario** — cards de días y actividades | `ItineraryPageSkeleton` (toolbar, hero, 2 day-cards con filas de actividad) | Antes, tanto la lectura rápida de un itinerario ya generado como la generación con IA (lenta) compartían el mismo estado `loading` y mostraban siempre la pantalla de carga elaborada (kenburns + etapas). Ahora un estado `generating` distingue ambos casos: generación real → sigue la pantalla elaborada (se deja intacta, es una experiencia ya cuidada); solo-lectura → skeleton ligero |
| **Feed/Explore** | *(sin cambios)* | Ya tenía `SkeletonGrid`, mismo `columns-*` masonry y proporciones que las cards reales |
| **Perfil** | `ProfileSkeleton` (cabecera con avatar, panel de stats, panel de plan, preferencias, lista de enlaces) + estado `loaded` nuevo | Antes no había ningún estado de carga: los campos arrancaban vacíos/en blanco y se rellenaban según llegaban los datos, sin ningún indicador |
| **Página pública del viaje** (`explore.$slug`) | `pendingComponent: PublicTripSkeleton` en la config de la ruta (cabecera, hero, botones de acción, day-cards) | No existía `pendingComponent` en ninguna ruta de la app — en una navegación cliente a esta página, el usuario no tenía ninguna señal mientras el loader resolvía |

**Verificación:**
- Feed/Explore: confirmado en vivo estrangulando la red (CDP
  `Network.emulateNetworkConditions`, latencia 800 ms) — las cards pulse
  aparecen antes de los datos reales.
- Dashboard, Itinerario, Perfil y página pública del viaje: estas 4
  requieren sesión autenticada (Dashboard/Itinerario/Perfil) o datos
  reales publicados (página pública), y esta sesión no tiene credenciales
  de prueba ni una cuenta confirmada — la misma limitación ya señalada en
  `DESIGN_REPORT.md`. Se verificaron exportando temporalmente cada
  componente de skeleton, montándolo en una ruta pública temporal
  (`/dev-skel-test`, borrada al terminar) y confirmando en el navegador que
  renderiza sin errores y con la forma correcta (capturas revisadas una a
  una). No es lo mismo que ver la pantalla real cargando en producción,
  pero confirma que el JSX/Tailwind es correcto y coincide con la forma del
  contenido real.

## 3. Página 404 personalizada

**`src/routes/__root.tsx`** — `NotFoundComponent` rediseñado (antes tenía
fondo `bg-gradient-to-b from-sky-950 to-sky-900`, estilo previo al
rediseño visual de la app):

- Fondo blanco, emoji de avión grande (✈️) + "404" en bold.
- Título **"Página no encontrada"** (reutiliza `errors.notFoundTitle`, ya
  existía tal cual).
- Subtítulo explicativo (reutiliza `errors.notFoundBody`).
- Botón pill negro **"Volver al inicio"** (reutiliza `errors.backHome`).
- Nuevo: línea "Mientras tanto, aquí tienes un par de sitios a los que ir"
  (`errors.notFoundSubtitleExtra`, nueva clave) con enlaces a **Explorar**
  (reutiliza `nav.explore`) y **Precios** (reutiliza `nav.pricing`) — mismas
  cadenas que ya usa el resto de la navegación, sin duplicar traducciones.

**Verificación:** navegación a una ruta inexistente en Chromium a 390px y
1280px. Confirmado: emoji, título, subtítulo y botón correctos; clic en
"Descubre" navega a `/explore` con éxito.

## Ficheros modificados

```
src/components/ErrorBoundary.tsx          (nuevo)
src/i18n/locales/es.json                  (+8 claves en errors.*)
src/i18n/locales/en.json                  (+8 claves en errors.*)
src/routes/__root.tsx                     (ErrorBoundary global + 404 rediseñada)
src/routes/_authenticated/route.tsx       (ErrorBoundary del layout autenticado)
src/routes/_authenticated/dashboard.tsx   (ErrorBoundary globo + skeletons tiles/stats)
src/routes/_authenticated/my-trip.$tripId.tsx  (ErrorBoundary mapa + skeleton itinerario)
src/routes/_authenticated/profile.tsx     (skeleton de perfil + estado `loaded`)
src/routes/explore.$slug.tsx              (ErrorBoundary mapa + pendingComponent skeleton)
```

`tsc --noEmit`: limpio. `npm run lint` en los ficheros tocados: 0 errores
(los ~1354 errores que reporta `npm run lint` en todo el repo son
formato-prettier preexistente en ficheros no relacionados con esta tarea,
confirmado comparando la lista de ficheros afectados contra los ficheros
que toqué). Ninguna ruta o componente de verificación temporal
(`/dev-eb-test`, `/dev-skel-test`, los `export` temporales en las funciones
de skeleton) quedó en el árbol de trabajo — todo se creó, se usó para
verificar en el navegador, y se revirtió/borró antes de terminar. Sin
cambios de funcionalidad, estado de negocio o estructura de datos en
ningún fichero existente — solo se añadieron estados de carga/error y sus
fallbacks visuales.
