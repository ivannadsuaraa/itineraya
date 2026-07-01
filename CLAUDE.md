# Itineraya — CLAUDE.md

## Proyecto

App web de planificación de viajes con IA. El usuario describe un viaje y se genera un itinerario completo con imágenes, actividades por día, y opciones de alojamiento.

**Stack:** TanStack Start + TanStack Router (file-based), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Radix UI), Supabase (auth + DB), Anthropic API directa, Unsplash API, Stripe, Resend, i18next (es/en).

**Deploy:** Vercel, región `cdg1` (París). Configurado en `vercel.json`.

## Estructura clave

```
src/
  routes/
    index.tsx                          # Landing page pública
    pricing.tsx                        # Página de precios / planes
    _authenticated/
      dashboard.tsx                    # Dashboard principal con lista de viajes
      new-trip.tsx                     # Formulario creación de viaje (multi-step)
      onboarding.tsx                   # Onboarding inicial del usuario
      trip.$tripId.tsx                 # Vista detalle de un viaje
      assistant.tsx                    # Chat IA (bloqueado en plan free)
      inspire.tsx                      # Inspiración de destinos
      copilot.tsx                      # Copiloto de viaje
      profile.tsx                      # Perfil de usuario
  lib/
    itinerary.functions.ts             # Generación de itinerario con Claude Haiku
    itinerary-edit.functions.ts        # Edición de itinerario
    payments.functions.ts              # Lógica de pagos con Stripe
    stripe.ts / stripe.server.ts       # Cliente Stripe
    inspire.functions.ts               # Lógica de inspiración
    share.functions.ts                 # Compartir viajes
    tripmates.functions.ts             # Compañeros de viaje
  components/
    DashboardSidebar.tsx               # Sidebar con nav (asistente bloqueado en free)
    DestinationAutocomplete.tsx        # Autocompletado de destinos (Google Maps)
    landing/                           # Componentes de la landing page
    trip/                              # Componentes de detalle de viaje
    ui/                                # Componentes shadcn/ui
  integrations/supabase/              # Cliente Supabase + middleware auth
  i18n/locales/es.json, en.json       # Traducciones
```

## Base de datos (Supabase)

- `profiles` — `id`, `plan` ("free" | "viajero" | "explorador"), `welcome_completed`
- `trips` — `id`, `user_id`, `destination`, `start_date`, `end_date`, `budget`, `companion`, `trip_style`, `itinerary` (JSON), `hero_image`
- `subscriptions` — estado de suscripción Stripe

## Planes de usuario

- **free** — acceso básico, sin asistente IA
- **viajero** — plan medio con asistente IA
- **explorador** — plan premium completo

El acceso al asistente está bloqueado en tres puntos para usuarios free:
1. `assistant.tsx` — renderiza `<UpgradeGate>` si `plan === "free"`
2. `DashboardSidebar.tsx` — nav item redirige a `/pricing` con icono de candado
3. `dashboard.tsx` — botón Wand2 en TripCard redirige a `/pricing`

## Modelo IA

`claude-haiku-4-5` — usado en `itinerary.functions.ts` para generar itinerarios.
`max_tokens: 10000` — necesario para viajes de hasta 14 días sin truncación.
El asistente de chat (`/api/chat`) usa `claude-haiku-4-5` también.

## Convenciones

- **Server functions:** `createServerFn()` de TanStack Start, ficheros `*.functions.ts`
- **Rutas autenticadas:** bajo `_authenticated/`, protegidas por `src/integrations/supabase/auth-middleware.ts`
- **i18n:** todas las cadenas visibles al usuario en `es.json` y `en.json`. Nunca hardcodear texto en español/inglés directamente.
- **Componentes UI:** usar shadcn/ui de `src/components/ui/` antes de crear componentes custom
- **Estilos:** Tailwind CSS v4, sin CSS modules. Paleta principal: sky-900, sky-700, sky-100, slate-*, blanco. Accent: `#1E6B9A`.
- **No usar** `any` en TypeScript salvo casteos inevitables con Supabase.

## Skills disponibles — cuándo activar cada una

### UI / Diseño
- `/impeccable` — auditoría y mejora de UI existente. Usar antes de reescribir componentes visuales.
- `/taste-skill` — rediseño de páginas completas (landing, dashboard, pricing). Anti-slop.
- `/redesign-skill` — cuando hay que subir el nivel visual de una página existente.
- `/soft-skill` — cuando el diseño se ve genérico o barato.
- `/ui-styling` — implementar componentes shadcn/ui, temas, dark mode, layouts responsivos.
- `/minimalist-skill` — interfaces limpias y editoriales.
- `/emil-design-eng` — detalles de polish, micro-interacciones, animaciones.
- `/animation-vocabulary` — cuando no sabes cómo se llama un efecto de animación.

### Código
- `/karpathy-guidelines` — antes de escribir código nuevo o hacer refactors importantes.
- `/code-auditor` — auditoría de calidad, seguridad, deuda técnica.
- `/code-refactor` — renombrados y cambios consistentes en múltiples ficheros.
- `/ensemble-solving` — cuando hay múltiples enfoques válidos y conviene explorarlos.
- `/test-fixing` — cuando hay tests fallando.
- `/feature-planning` — antes de implementar una feature grande, para planificarla.

### Documentación / Diagramas
- `/architecture-diagram-creator` — diagrama del sistema completo.
- `/flowchart-creator` — flujos de usuario (onboarding, checkout, generación de itinerario).
- `/codebase-documenter` — documentación del proyecto para onboarding.
- `/technical-doc-creator` — documentación de APIs internas.

### Git
- `/git-pushing` — commit + push con mensaje convencional.
- `/code-review` — revisar diff antes de hacer PR.

### Imagen / Assets
- `/imagegen-frontend-web` — generar referencias visuales de diseño por sección.
- `/brandkit` — assets de marca de Itineraya.

### Productividad
- `/graphify` — explorar arquitectura del proyecto, relaciones entre ficheros.
- `/output-skill` — cuando necesitas código completo sin truncar.

## Comandos de desarrollo

```bash
npm run dev      # servidor de desarrollo (Vite)
npm run build    # build de producción
npm run lint     # ESLint
npm run format   # Prettier
```
