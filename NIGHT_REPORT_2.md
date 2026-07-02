# NIGHT_REPORT_2 — Itineraya

**Fecha:** 2026-07-03  
**Modelo análisis:** claude-fable-5  
**Modelo implementación:** claude-sonnet-4-6  
**Skills:** karpathy-guidelines

---

## FASE 1 — Simulación 500 usuarios (Fable 5)

Fable 5 recorrió el flujo completo —landing → auth → onboarding 7 pasos → generación → dashboard → monetización— simulando 10 perfiles distintos: mochileros, familias, parejas, viajeros de lujo, millennials tech-savvy, usuarios mayores, mobile, desktop, anglófonos y power users.

### Top 10 puntos débiles identificados (con verificación en código)

| # | Severidad | Problema | Archivo | Impacto |
|---|-----------|----------|---------|---------|
| 1 | 🔴 Crítico | Usuario Free puede quemar su único viaje sin retry ni delete | `new-trip.tsx:31`, `my-trip.$tripId.tsx:227` | Abandono permanente ~15-20 usuarios/500 |
| 2 | 🔴 Crítico | No existe borrar viajes en ninguna parte de la app | Todo `src/` | Frustración 100% power users |
| 3 | 🔴 Crítico | Límite Free descubierto solo tras el click (paywall sorpresa) | `new-trip.tsx:44-48` | Resentimiento vs conversión, afecta ~30% base activa |
| 4 | 🟡 Alto | Trust signals hardcodeados en español en la página de pago | `pricing.tsx:173-175` | No-conversión 12% usuarios EN en el momento de pagar |
| 5 | 🟡 Alto | Onboarding 7 pasos sin indicación de "opcional" | `onboarding.tsx:171-177` | 30-40% abandono mayores en pasos 3-5; defaults silenciosos dan itinerarios equivocados |
| 6 | 🔴 Crítico | Error de generación = dead end sin retry | `my-trip.$tripId.tsx:227-243` | Abandono en momento de máxima intención |
| 7 | 🟡 Alto | Social proof fabricado (+2.000) — riesgo de credibilidad y legal | `es.json:35` | Pérdida de credibilidad con perfil más viral |
| 8 | 🟡 Alto | Mobile bottom bar con 6 items comprimidos (grid-cols-6) | `DashboardSidebar.tsx:89` | Errores de tap en iPhone SE, percepción de app cutre |
| 9 | 🟡 Alto | Globo muestra fotos de destinos incorrectos + Google geocoding expuesto en bundle | `dashboard.tsx:61-95` | Desconfianza + coste operativo + key expuesta |
| 10 | 🟢 Medio | Widget de clima con skeleton infinito en fallo | `dashboard.tsx:716-725` | Percepción de app rota |

### Top 5 puntos fuertes

1. **Manejo de errores de auth** — mapeo Supabase → mensajes humanos, reenvío con cooldown
2. **Onboarding con Enter-to-advance** — flujo sin ratón para desktop/power users
3. **Loading screen con mensajes rotativos** — convierte 30-60s en anticipación
4. **Tres vistas de itinerario** (cards/text/timeline) + mapa — respeta todos los perfiles
5. **Capa emocional del dashboard** — globo, countdown, clima, inspiraciones estacionales

### Bugs reales encontrados en el código

| # | Archivo | Bug |
|---|---------|-----|
| 1 | `assistant.tsx:325` | `Dot` tiene prop `delay` pero no la usa — puntos estáticos |
| 2 | `my-trip.$tripId.tsx:620` | Botón descargar usa `t("trip.postcardDownloaded")` = "Postal descargada ✨" como label |
| 3 | `my-trip.$tripId.tsx:269` | `"Timeline"` hardcodeado fuera de i18n |
| 4 | `pricing.tsx:173-175` | Trust signals hardcodeados en español |
| 5 | `dashboard.tsx:716-725` | Skeleton de clima infinito (null = loading Y = fallo) |
| 6 | `new-trip.tsx:31` | Contador cuenta trips `pending`/fallidos, no solo `ready` |
| 7 | `my-trip.$tripId.tsx:227` | Error de generación sin acción de retry |
| 8 | Todo `src/` | No existe `from("trips").delete()` — imposible borrar viajes |
| 9 | `dashboard.tsx:72-95` | Google Maps Geocoding con key `VITE_` expuesta en bundle |
| 10 | `dashboard.tsx:61-67` | Fallback polaroids con imágenes de destinos incorrectos |

---

## FASE 2 — Fix del globo (claude-sonnet-4-6)

**Archivo:** `src/components/ui/cobe-globe-polaroids.tsx`

### Qué se hizo
- **Eliminadas** todas las polaroids flotantes (divs posicionados con imágenes y texto rotado)
- **Eliminada** la función `updatePolaroids` y el ref array `polaroidRefs`
- **Mantenida** la math de proyección `projectMarker` (necesaria para el popup)
- **Añadido** sistema de detección de click: distingue click (< 5px de movimiento) de drag
- **Añadido** popup limpio al hacer click en un punto: imagen hero, nombre del destino, link "Ver itinerario →"
- **Añadido** cierre automático del popup al iniciar drag (girar el globo)
- **Añadido** cierre con botón X en el popup
- **Mejorado** tamaño de los dots de `0.04` a `0.06` para mayor visibilidad y hit area
- **Añadida** lógica `popupTransform()` para mantener el popup dentro de los bordes del contenedor

### API pública sin cambios
`PolaroidMarker` y `GlobePolaroids` exportados igual — `dashboard.tsx` no necesitó cambios en la integración.

---

## FASE 3 — Implementación completa (claude-sonnet-4-6 + karpathy-guidelines)

Cambios aplicados en orden de impacto. Sin commits ni push.

### P1 — Bugs críticos del funnel Free

**`src/routes/_authenticated/new-trip.tsx`**
- Fix: `.eq("status", "ready")` al count de trips — un viaje fallido ya no consume el cupo
- Añadido: banner visible con `AlertCircle`/`Lock` mostrando `X de Y viajes usados` + link a pricing cuando está al límite. El usuario ahora ve el paywall *antes* del click, no después.

**`src/routes/_authenticated/my-trip.$tripId.tsx`**
- Añadido: `retryKey` state + incluido en deps del effect de carga
- Añadido: botón "Reintentar" en la pantalla de error que resetea el estado y relanza la generación
- Fix: botón de descarga de postal cambiado de `t("trip.postcardDownloaded")` → `t("trip.downloadPostcard")`
- Fix: icono de timeline `AlignLeft` → `GanttChartSquare`, label hardcoded `"Timeline"` → `t("trip.viewTimeline")`

### P2 — Bug visual del asistente

**`src/routes/_authenticated/assistant.tsx`**
- Fix: `Dot` component ahora usa `animate-bounce` y `style={{ animationDelay }}` — los tres puntos animan en cascada correctamente

### P3 — i18n y confianza

**`src/routes/pricing.tsx`**
- Fix: trust signals ahora usan `t("pricing.trust1/2/3")` — la página de pago ya no rompe la experiencia en inglés

**`src/components/landing/HeroSection.tsx`**
- Fix: social proof `"+2.000 viajeros ya usan Itineraya"` → `"Itinerarios personalizados generados en segundos"` — texto verificable y honesto

### P4 — Calidad del dashboard

**`src/routes/_authenticated/dashboard.tsx`**
- Fix: geocoding Globe reemplazado de `maps.googleapis.com` (clave `VITE_` expuesta en bundle) → `geocoding-api.open-meteo.com` (sin API key, CORS-enabled, mismo endpoint ya usado en `dashboard-helpers.ts`)
- Fix: estado del clima cambiado a 3-estados: `undefined` (cargando) → skeleton, objeto (éxito) → temperatura, `null` (fallo) → "—". Elimina el skeleton infinito.
- Añadido: función `deleteTrip` con optimistic update + rollback en error
- Añadido: `userId` state para filtro RLS seguro en delete
- Añadido: botón `Trash2` en `TripCard` con confirm inline (pattern "¿Eliminar? Sí / ✕") — no abre Dialog, es inline en el footer de la card
- Fix: textos del tab Calendario hardcodeados en español → `t("dashboard.calendarTitle/Sub/Empty")`

### P5 — Traducciones

**`src/i18n/locales/es.json`** y **`src/i18n/locales/en.json`** — claves añadidas:

| Clave | ES | EN |
|-------|----|----|
| `trip.viewTimeline` | Línea de tiempo | Timeline |
| `trip.errorRetry` | Reintentar | Try again |
| `pricing.trust1` | Sin permanencia | No commitment |
| `pricing.trust2` | Cancela cuando quieras | Cancel anytime |
| `pricing.trust3` | Pago seguro con Stripe | Secure payment with Stripe |
| `dashboard.calendarTitle` | Calendario de viajes | Trip calendar |
| `dashboard.calendarSub` | Todos tus viajes planificados de un vistazo | All your planned trips at a glance |
| `dashboard.calendarEmpty` | Aún no tienes viajes planificados con fechas | No trips with dates planned yet |
| `dashboard.deleteTrip` | Eliminar viaje | Delete trip |
| `dashboard.deleteTripConfirm` | ¿Eliminar? | Delete? |
| `dashboard.deleteTripYes` | Sí | Yes |
| `dashboard.deleteFail` | No se pudo eliminar el viaje | Could not delete the trip |
| `newTrip.limitBanner` | {{count}} de {{limit}} viaje usado · | {{count}} of {{limit}} trip used · |
| `hero.socialProof` | Itinerarios personalizados generados en segundos | Personalized itineraries generated in seconds |

---

## Archivos modificados

```
src/components/ui/cobe-globe-polaroids.tsx     — Globo reescrito (polaroids → dots + popup)
src/routes/_authenticated/new-trip.tsx         — Count fix + limit banner
src/routes/_authenticated/my-trip.$tripId.tsx  — Retry + download label + timeline icon/label
src/routes/_authenticated/assistant.tsx        — Dot animation fix
src/routes/_authenticated/dashboard.tsx        — Weather + geocoding + delete trips + i18n
src/routes/pricing.tsx                         — Trust signals i18n
src/components/landing/HeroSection.tsx         — Social proof copy
src/i18n/locales/es.json                       — 14 claves nuevas
src/i18n/locales/en.json                       — 14 claves nuevas
```

## Pendiente (fuera de scope esta sesión)

- **Reducir bottom bar a 5 items** — `DashboardSidebar.tsx` `grid-cols-6` → `grid-cols-5`, mover "Guardados" dentro de Perfil
- **Indicar pasos opcionales en onboarding** — badge "Opcional" en pasos 2-6 o botón "Saltar"
- **Prefill de fechas desde nDays** — `onboarding.tsx:159` `dateRange: undefined` debería calcular fechas desde `nDays` del prefill
- **Eliminación de trips desde my-trip** — botón delete también en la vista detalle del itinerario
- **Confirmar email expirado** — flujo de reenvío desde página de error de auth cuando el link ha expirado (24h)
