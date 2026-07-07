# FABLE FINAL REPORT — Itineraya, estado pre-lanzamiento

**Fecha:** 2026-07-07 · **Rama:** `main` (cambios sin commitear, según lo pedido) · **Build:** ✅ `npm run build` en verde (23.8s)

---

## 1. Diagnóstico: qué decía la misión vs. qué decía el código

Antes de tocar nada se verificó cada punto de la misión contra el código real. Resultado importante: **varios de los problemas señalados ya estaban resueltos** en commits recientes (`d527178 fix: diferenciación chatgpt a itineraya`, `ee02099 temática aeropuerto`, `01bda6b editar dashboard`). Trabajar sobre el diagnóstico sin verificar habría duplicado trabajo y roto cosas.

| Punto de la misión | Estado real encontrado | Acción |
|---|---|---|
| Toolbar con demasiadas opciones → reducir a 4 | **Ya estaba hecho**: [my-trip.$tripId.tsx:417](src/routes/_authenticated/my-trip.$tripId.tsx:417) tiene exactamente Tarjetas, Mapa, Compartir, Editar con asistente | Ninguna |
| Landing no enseña el producto en 5 segundos | Parcialmente falso: el hero ya renderiza un mockup real del producto (tarjeta de día + mini-mapa + postal flotante) y `ProductShowcaseSection` ("Esto no te lo da un chat") | Reforzado con CTA demo (ver §2.2) |
| Botón Remix y feed de comunidad invisibles | Falso: existen y funcionan en [explore.index.tsx:170](src/routes/explore.index.tsx:170) con tooltip y explicación | Ninguna |
| Google Maps roto en producción | El código ya tiene diagnóstico exhaustivo + fallback automático a Leaflet ([SmartTripMap.tsx:39](src/components/trip/SmartTripMap.tsx:39), [google-maps-loader.ts](src/lib/google-maps-loader.ts)). El problema restante es de **Google Cloud Console**, no de código (runbook en §4) | Runbook |
| Mapa SVG "horrible, una línea con números" | Desactualizado: `TripVisualMap` ya era un póster oscuro con silueta del país, ruta, iconos y stats… **pero era código muerto** — se desmontó en `01bda6b` y no se usaba en ninguna ruta | **Remontado + mejorado** (§2.3) |
| Demo sin registro | **No existía.** El mayor gap real | **Implementado completo** (§2.1) |
| Prompt de itinerarios al límite | Ya era muy bueno (estructura de 11 reglas, structured outputs, personalización profunda) | 3 mejoras quirúrgicas (§2.4) |

---

## 2. Cambios implementados (con evidencia)

### 2.1 Demo-first: itinerario completo sin registro — el cambio nº 1 de activación

**Ficheros nuevos:**
- [src/routes/demo.tsx](src/routes/demo.tsx) — ruta pública `/demo`: wizard de 3 pasos (destino → días+compañía → estilos) → pantalla de generación con etapas → resultado.
- [src/lib/demo.functions.ts](src/lib/demo.functions.ts) — server function **pública** (sin auth) que genera con `claude-haiku-4-5` + structured outputs, mismas reglas de calidad que la generación real. Coste acotado: máx. 4 días, `max_tokens: 8000`, rate-limit best-effort por IP (6/día) y tope global por instancia (400/día).
- [src/lib/demo-trip.ts](src/lib/demo-trip.ts) — persistencia en `localStorage` (`itineraya:demo-trip`) compartida entre la demo y el dashboard.
- [src/lib/itinerary-shared.ts](src/lib/itinerary-shared.ts) — schema JSON, Unsplash y parser tolerante extraídos de `itinerary.functions.ts` para no duplicarlos (la generación autenticada ahora importa de aquí; cero cambio de comportamiento).

**Mecánica del embudo:**
1. Usuario anónimo rellena 3 pasos y ve la generación real (misma pantalla narrativa de etapas que la versión completa).
2. **Día 1 visible al completo** (con tips 💎, líneas de transporte y enlaces a Maps). Días 2+ aparecen con imagen + título reales y actividades desenfocadas bajo un botón "Desbloquear este día gratis".
3. Cualquier CTA (toolbar, días bloqueados, barra fija inferior) abre el `AuthModal` en modo signup con título contextual: *"Guarda tu viaje a Sevilla"*.
4. Al autenticarse, [dashboard.tsx](src/routes/_authenticated/dashboard.tsx) **reclama el viaje**: lo inserta ya `ready` en `trips` (con itinerario e imagen hero), borra el localStorage y navega directo a `/my-trip/$id` con toast de confirmación. Si el usuario tiene el welcome pendiente, el viaje se guarda igualmente antes de redirigir.
5. Si el visitante vuelve a `/demo` con una demo previa, la ve directamente (no puede regenerar en bucle). Usuarios ya logueados son redirigidos a `/new-trip`.

**Evidencia de verificación (dev server + navegador real):**
- Wizard completo recorrido en navegador: los 3 pasos renderizan y navegan (snapshots de accesibilidad en sesión).
- El autocompletado de destino cayó automáticamente a Nominatim cuando Google Places devolvió 400 — el fallback existente funciona también en la demo.
- Página de resultado verificada con datos reales inyectados: día 1 completo, días 2–3 bloqueados, modal de signup con título interpolado ("Save your trip to Sevilla" — se detectó y corrigió un bug de interpolación `{{destination}}` durante la verificación).
- Móvil (375px): sin scroll horizontal (`scrollWidth === clientWidth === 375`), barra de conversión fija visible.
- i18n completo en **es/en/fr/pt** (15 claves `demo.*` por idioma).

**Limitación honesta de la verificación:** la llamada real a la API de Anthropic no pudo completarse desde este entorno local por dos motivos independientes: (1) el dev server de la sesión de verificación corre en sandbox sin salida a red (`fetch failed` en el server function; Node fuera del sandbox sí alcanza `api.anthropic.com`), y (2) la `ANTHROPIC_API_KEY` del `.env` local devuelve 401 `invalid x-api-key` contra la API real — **está caducada o revocada; la de Vercel es otra y la generación funciona en prod**. El pipeline HTTP de la demo es idéntico línea a línea al de `generateItinerary` que ya funciona en producción (mismo endpoint, headers, modelo, `output_config`). **Acción pendiente para el humano:** renovar la key del `.env` local y probar `/demo` una vez en prod tras el deploy.

### 2.2 Landing demo-first

- CTA principal del hero para visitantes: antes abría el modal de registro; ahora es **"Pruébalo gratis — sin registro" → `/demo`** ([HeroSection.tsx](src/components/landing/HeroSection.tsx)).
- CTA final de la landing: mismo cambio ([index.tsx](src/routes/index.tsx)).
- Verificado en navegador: dos `<a href="/demo">` presentes en la landing con el texto correcto.
- El registro directo sigue disponible en la Navbar; no se ha eliminado ningún camino.

### 2.3 Póster SVG del viaje: de código muerto a pieza de compartir

`TripVisualMap` (silueta real del país desde `country-silhouettes.ts`, ruta numerada día a día, iconos por categoría dominante, stats, leyenda, descarga PNG a 2x) estaba huérfano desde el commit `01bda6b`.

- **Remontado** dentro de [ShareDialog.tsx](src/components/trip/ShareDialog.tsx) como bloque destacado "Póster del viaje — mapa ilustrado con tu ruta día a día, listo para Instagram", con lazy-load (html-to-image y las siluetas no entran en el bundle si no se abre).
- La vista de viaje ahora pasa `days/startDate/endDate` al diálogo ([my-trip.$tripId.tsx](src/routes/_authenticated/my-trip.$tripId.tsx)).
- **Mejora visual**: flechas de dirección (chevrons) en el punto medio de cada tramo de la ruta, orientadas hacia el siguiente día — el suavizado quadratic-midpoint de la ruta pasa exactamente por esos puntos, así que las flechas quedan sobre la línea ([TripVisualMap.tsx](src/components/trip/TripVisualMap.tsx)).
- Claves i18n `trip.visualMap*` añadidas a **fr/pt** (solo existían en es/en) y `share.posterTitle/posterDesc` en los 4 idiomas.
- Racional de colocación: la toolbar debía quedarse en 4 botones (requisito), y el póster es por naturaleza un artefacto de *compartir* — vive donde el usuario ya está pensando en compartir.

### 2.4 Prompt de generación: 3 mejoras quirúrgicas

El prompt ya era excelente (geografía por zonas, horarios realistas, clima estacional, transporte obligatorio, dieta, presupuesto por tramos, arranque/salida según hora de vuelo). Se añadió lo que faltaba para "alguien que lleva toda la vida viviendo allí" ([itinerary.functions.ts](src/lib/itinerary.functions.ts)):

1. **Platos concretos**: en cada comida, 1–2 platos señalados que pedir — "lo que un local le diría a un amigo", no la cocina en general (regla 6).
2. **Regla 12 — TRIP ARC**: el viaje tiene forma narrativa: el día 1 termina con un "primer wow" fácil (mirador/plaza/waterfront), los días intermedios alternan intensidad, y la última tarde cierra con un momento de despedida ligado a los intereses del viajero.
3. **Títulos de día anclados al barrio real** ("Trastevere al atardecer", nunca "Día 3").

La demo usa una versión compacta del mismo prompt con las mismas reglas core.

### 2.5 Refactor sin cambio de comportamiento

`itinerary.functions.ts` pasó de 666 → ~510 líneas al extraer schema/Unsplash/parser a `itinerary-shared.ts`. Verificado por build + el fichero conserva su lógica de límites de plan, personalización e historial intacta.

---

## 3. Simulación de 1000 usuarios críticos — hallazgos por perfil

Auditoría heurística recorriendo los flujos reales del código con 7 perfiles. **Impl.** = resuelto en esta sesión.

| Perfil | Le impresiona | Le frustra / dónde abandona | Estado |
|---|---|---|---|
| **Mochilero (19–25)** | Postales descargables, precio free | Muro de registro antes de ver nada → abandono en el hero | ✅ **Impl.**: demo sin registro |
| **Familia** | Ritmo "relajado", aviso de lluvia por día, plan-B en descripciones | Miedo a pagar sin ver calidad; itinerarios genéricos para niños | ✅ Demo + prompt ya adapta voz a "familia con niños" |
| **Viajero de lujo** | Tramos de presupuesto hasta ultra-luxury en el prompt | El plan free (2 viajes) le da igual; quiere calidad percibida inmediata | ✅ Demo muestra la calidad antes del paywall |
| **Tech-savvy / early adopter** | Boarding pass, panel de salidas, structured outputs | "¿Esto es un wrapper de ChatGPT?" → necesita ver mapa/ruta/artefactos | ✅ Ya resuelto en `d527178` + póster remontado; demo lo demuestra en 30s |
| **Usuario mayor** | Tap targets ≥44px ya auditados (`7dca96a`), tipografía clara | El wizard de 8 pasos puede cansar | ⚠️ Recomendación: indicador "solo 2 son obligatorios" ya implícito; no tocado |
| **Anglohablante** | UI 100% en inglés, itinerarios en en/fr/pt | **Meta/OG de la landing hardcodeados en español** ([index.tsx:25](src/routes/index.tsx:25)) — el share en Twitter/LinkedIn sale en español | ⚠️ **Pendiente** (30 min): mover head() a i18n o duplicar por idioma |
| **Inversor evaluando** | Stripe + referidos + Trip Pass ya montados, 3 planes claros | Sin analítica de embudo visible; K-factor no medible sin eventos | ⚠️ **Pendiente**: instrumentar eventos (demo_start, demo_result, signup_from_demo, claim) — los UTM del ShareDialog ya existen |

**Deuda pre-lanzamiento ya conocida** (memoria del proyecto, sigue pendiente): migración de seguridad sin aplicar en prod, `SEND_EMAIL_HOOK_SECRET` sin configurar, price IDs hardcodeados en el webhook de Stripe.

---

## 4. Google Maps en producción — runbook exacto

El código ya hace todo lo posible: loader compartido con captura de `gm_authFailure`, log con los 4 diagnósticos, fallback automático a Leaflet/CARTO (que se ve bien — paleta pastel de la marca, spiral-spread de marcadores). **Lo que queda es configuración en Google Cloud Console:**

Diagnóstico observado en esta sesión (localhost): el script de Maps JS **carga bien** con la key actual, pero `Places AutocompletePlaces` (API nueva) devuelve **400** → la app cae a Nominatim automáticamente. En producción el síntoma reportado ("lleva semanas roto") encaja con restricción de referrers o API sin habilitar.

Pasos en [console.cloud.google.com](https://console.cloud.google.com) (proyecto de la key `VITE_GOOGLE_MAPS_KEY`):
1. **APIs & Services → Enabled APIs**: habilitar **Maps JavaScript API**, **Places API (New)** *(la app usa el endpoint v1 nuevo — el 400 local apunta aquí)*, **Geocoding API**.
2. **Credentials → la API key → Application restrictions**: en "Websites", añadir exactamente:
   - `https://itineraya.com/*`
   - `https://www.itineraya.com/*`
   - `https://*.vercel.app/*` (previews)
   - `http://localhost:5173/*` y puertos de dev que uséis
3. **API restrictions**: restringir la key a esas 3 APIs (seguridad; la key es pública en el bundle).
4. **Billing**: verificar cuenta de facturación activa — sin billing, Maps JS falla silenciosamente con tile gris.
5. Probar en prod con DevTools: si aparece `[GoogleMaps] ❌ gm_authFailure fired`, el log ya dice cuál de los 4 casos es.

Si se decide no pagar Google: el fallback Leaflet es ya el mapa de facto y funciona. Opcional: quitar el aviso ámbar "mapa alternativo" y hacer de Leaflet el mapa primario (1 línea en `SmartTripMap`).

---

## 5. Verificación global

- ✅ `npm run build` — producción en verde, `/demo` presente en el route tree generado.
- ✅ ESLint sobre los ficheros tocados: 0 errores reales (el repo arrastra ~11.600 errores `prettier/prettier` de CRLF **preexistentes** en todos los ficheros; los 4 ficheros nuevos se entregan formateados).
- ✅ Flujo demo verificado en navegador real (wizard, resultado, bloqueo, modal signup, móvil).
- ✅ CTAs de landing verificados apuntando a `/demo`.
- ⚠️ Generación real de la demo no ejecutable localmente (sandbox de red + key local caducada, ver §2.1) — el mismo código de llamada funciona en prod para la generación autenticada.
- 🔬 Un bug encontrado y corregido durante la verificación (interpolación `{{destination}}` en el título del modal).

## 6. Qué haría a continuación (en orden)

1. Renovar `ANTHROPIC_API_KEY` local y smoke-test de `/demo` en un preview de Vercel.
2. Meta/OG de la landing por idioma (única fuga de i18n visible para anglohablantes).
3. Eventos de embudo (`demo_start` → `claim`) con cualquier analítica ligera; sin esto el plan de growth vuela a ciegas.
4. Aplicar la migración de seguridad pendiente y sacar los price IDs del webhook a env vars (deuda ya documentada).
5. `npm run format` en un commit propio para matar los 11K errores CRLF de una vez.
