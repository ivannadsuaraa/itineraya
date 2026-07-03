# 🌙 TODO_NIGHT_2 — Itineraya Autonomous Session 2
# Lee este archivo completo antes de empezar.
# FASE 1: Usa claude-fable-5 para el análisis de 500 usuarios y diagnóstico
# FASE 2 en adelante: Usa claude-sonnet-5 para implementar
# Usa skills: ui-ux-pro-max, taste-skill, karpathy-guidelines, code-auditor, impeccable, emil-design-eng, review-animations
# NO hagas commits ni push. Al terminar crea NIGHT_REPORT_2.md

---

## CONTEXTO DEL PROYECTO

Itineraya es una app web de generación de itinerarios de viaje con IA. Stack: React + TanStack Router + TanStack Start + Supabase + Vercel + Tailwind CSS v4 + framer-motion. IA usa Claude Haiku 4.5. Pagos con Stripe. Imágenes con Unsplash. Mapas con Google Maps + fallback Leaflet. Emails con Resend. Dominio: itineraya.com. Sistema de colores: sky-950/sky-900 gradientes oscuros.

---

## FASE 1 — SIMULACIÓN DE 500 USUARIOS CRÍTICOS (usa claude-fable-5)

Simula 500 usuarios diferentes usando Itineraya con estos perfiles:
- Mochileros 20-25 años, mobile, presupuesto bajo
- Familias con niños, desktop, presupuesto medio
- Parejas en viaje romántico, mobile, presupuesto alto
- Viajeros de lujo 40-60 años, desktop, presupuesto sin límite
- Millennials tech-savvy que comparan con competidores
- Usuarios mayores 55+ poco tecnológicos
- Grupos de amigos 6-10 personas
- Viajeros de negocios que añaden días de turismo
- Usuarios hispanohablantes de Latinoamérica
- Usuarios en inglés de UK y EEUU

Para cada perfil analiza REVISANDO EL CÓDIGO REAL de cada pantalla:
- ¿Dónde se confunden o abandonan?
- ¿Qué les frustra en el onboarding?
- ¿Qué les encanta y les haría volver?
- ¿Qué les haría pagar el plan Viajero o Explorador?
- ¿Qué les haría recomendar la app?
- ¿En qué momento exacto del flujo abandonarían?

Genera informe con:
1. Top 10 puntos débiles críticos ordenados por impacto en conversión
2. Top 5 puntos fuertes a potenciar
3. Bugs reales encontrados revisando el código
4. Quick wins — mejoras de menos de 1 hora con gran impacto
5. Oportunidades de monetización no aprovechadas

Guarda el informe en USER_RESEARCH.md antes de continuar.

---

## FASE 2 — BUGS CRÍTICOS (usa claude-sonnet-5 a partir de aquí)

### 2.1 Globo 3D del dashboard
- Simplificar completamente: eliminar las polaroids, dejar SOLO puntos brillantes en cada destino
- Al hacer clic en un punto: popup limpio con nombre del destino, imagen hero del viaje y botón "Ver itinerario"
- Geocodificar correctamente TODOS los destinos del usuario usando la Google Geocoding API o Nominatim para obtener lat/lng reales
- Si un viaje no tiene coordenadas, geocodificar por el nombre del destino
- Que aparezcan TODOS los viajes del usuario, no solo algunos
- El globo debe girar suavemente, parar al hacer hover, ser interactivo
- Optimizar rendimiento — que no consuma demasiada CPU

### 2.2 Google Maps en el itinerario
- Diagnosticar por qué Google Maps sigue sin cargar en producción (itineraya.com)
- Verificar que la API key tiene itineraya.com Y www.itineraya.com en las restricciones HTTP referrer en Google Cloud Console
- Verificar que Maps JavaScript API Y Places API están habilitadas
- Si Google Maps sigue fallando, hacer que el fallback Leaflet sea tan bueno que no se note la diferencia
- El mapa debe mostrar: marcadores numerados por actividad, línea de ruta entre puntos, popup con nombre al clicar

### 2.3 Timeline del itinerario
- La línea vertical no se rellena al hacer scroll — revisar que useScroll de framer-motion apunta al contenedor correcto
- El ref del containerRef debe apuntar al elemento correcto, no a un wrapper con overflow hidden que bloquea el scroll tracking
- Verificar en producción que framer-motion está funcionando en el contexto SSR de TanStack Start

### 2.4 Compartir itinerario
- Revisar el flujo completo de compartir — a veces da error al acceder al link público
- Asegurarse de que trip.$slug.tsx carga correctamente sin sesión de usuario
- El modal de login al intentar interactuar debe funcionar siempre

### 2.5 Presupuesto conectado a la IA
- Verificar que el rango del deslizador (min-max euros) llega correctamente al prompt de generación
- El itinerario generado debe adaptar hoteles, restaurantes y actividades al presupuesto indicado

---

## FASE 3 — PERFORMANCE

### 3.1 Lazy loading de componentes pesados
- GlobePolaroids — cargar con React.lazy() solo cuando el dashboard monta
- SmartTripMap / GoogleTripMap — cargar con React.lazy() solo cuando el usuario abre la vista de mapa
- PricingGlass — lazy load en /pricing
- Stripe EmbeddedCheckout — lazy load solo cuando el usuario hace clic en "Elegir plan"

### 3.2 Imágenes de Unsplash optimizadas
- Revisar todas las llamadas a Unsplash y añadir parámetros ?w=800&q=80 para pedir el tamaño exacto
- En mobile pedir ?w=400&q=75
- Usar el parámetro &auto=format para WebP automático

### 3.3 Cache de consultas con TanStack Query
- En todos los useQuery, añadir staleTime: 5 * 60 * 1000 para datos que no cambian frecuentemente (perfil, planes, viajes)
- gcTime: 10 * 60 * 1000 para mantener en cache más tiempo

### 3.4 Bundle size
- Revisar imports de lucide-react — importar solo los iconos usados, no el paquete entero
- Revisar imports de date-fns — importar solo las funciones usadas
- Analizar con vite-bundle-analyzer si hay librerías muy pesadas que se puedan optimizar

---

## FASE 4 — UX/UI POLISH

### 4.1 Pantalla de carga del itinerario
- Usar TextShimmerWave con "Creando tu itinerario perfecto..."
- Añadir subtexto que cambia cada 5 segundos: "Consultando al guía local...", "Planificando las rutas...", "Eligiendo los mejores restaurantes...", "Añadiendo los secretos del destino..."
- Mostrar imagen del destino de fondo con overlay oscuro mientras carga
- Barra de progreso falsa que avanza gradualmente (0% → 90% en 20s, luego 100% al recibir la respuesta)

### 4.2 Empty states en TODAS las pantallas
- Dashboard sin viajes: ilustración SVG de maleta + "Tu próxima aventura empieza aquí" + botón "Crear mi primer viaje"
- Feed vacío (no hay itinerarios públicos): "Sé el primero en compartir tu aventura" + botón
- Guardados vacíos: "Aún no has guardado ninguna inspiración" + botón "Explorar destinos"
- Perfil sin completar: indicador de progreso del perfil con los campos que faltan
- Calendario sin viajes: "Planifica tu próxima aventura" + botón

### 4.3 Error states
- Página 404 bonita con ilustración y botón "Volver al inicio"
- Página de error genérica cuando algo falla en el servidor
- Error inline en formularios con mensaje claro y en rojo
- Toast de error cuando falla una acción (guardar, compartir, etc.)

### 4.4 Animaciones de entrada por página
- Cada página debe tener una animación de entrada suave (fade + slide desde abajo, 300ms)
- Implementar con framer-motion AnimatePresence en el router
- Las cards del feed y dashboard deben aparecer en cascada (stagger de 50ms entre cada una)

### 4.5 Micro-interacciones
- Todos los botones: active:scale-95, hover con ligero cambio de color
- Cards: hover:shadow-lg hover:-translate-y-1 transition-all
- Inputs: focus con ring sky-500, border sky-400
- Checkboxes y toggles con animación suave
- El botón de guardar inspiración: animación de bookmark que se rellena al guardar
- Los marcadores del mapa: bounce al aparecer

### 4.6 Rediseño del calendario de viajes
- Hacerlo más grande y visual — que ocupe más espacio
- En los días con viaje, mostrar una miniatura de la imagen del destino como fondo del día
- Header del calendario con el mes en grande y tipografía display
- Al hacer clic en un día con viaje, expandir un panel lateral con los detalles del viaje
- Colores: días normales en slate-800, días con viaje en sky-600/sky-700 con la imagen de fondo
- Añadir vista semanal además de la mensual

### 4.7 Cards de actividades en el itinerario
- Cada actividad debe tener un icono SVG según su categoría (museo, restaurante, playa, montaña, etc.)
- Añadir duración estimada de la actividad
- Añadir precio estimado de la actividad según el presupuesto del usuario
- Botón "Añadir nota" en cada actividad
- Checkbox "Completado" para marcar actividades hechas durante el viaje
- Horario sugerido para cada actividad (9:00 - 11:00, etc.)

---

## FASE 5 — FEATURES NUEVAS

### 5.1 Sistema de valoraciones en el feed
- Añadir campo rating (1-5) a la tabla trips
- En cada card del feed: estrellas de valoración con la media
- Los usuarios autenticados pueden puntuar itinerarios de otros
- Ordenar el feed por: más recientes, mejor valorados, más vistos
- Migración SQL: ALTER TABLE trips ADD COLUMN rating_sum integer DEFAULT 0, ADD COLUMN rating_count integer DEFAULT 0

### 5.2 Búsqueda y filtros en el feed
- Barra de búsqueda por destino en la parte superior del feed
- Filtros: duración (1-3 días, 4-7 días, 8-14 días, 15+ días), tipo de viaje (aventura, cultural, playa, etc.), presupuesto (económico, medio, premium)
- Los filtros se aplican en tiempo real sin recargar la página
- URL params para que los filtros sean compartibles

### 5.3 Notificaciones de viaje
- Tabla notifications en Supabase
- Email recordatorio 7 días antes del inicio del viaje: "Tu viaje a [destino] es en 7 días 🎒"
- Email recordatorio 1 día antes: "Mañana empieza tu aventura en [destino] ✈️"
- Email post-viaje 2 días después del fin: "¿Cómo fue tu viaje a [destino]? Cuéntanos 🌟"
- Crear un cron job o función edge de Supabase para enviar estos emails automáticamente

### 5.4 Notas personales en actividades
- Campo notes: text en la tabla de actividades (dentro del JSON itinerary)
- Botón "Añadir nota" en cada actividad del itinerario
- Textarea que aparece inline al hacer clic
- Las notas se guardan automáticamente en Supabase
- Solo el propietario y colaboradores pueden ver/editar notas

### 5.5 Marcar actividades como completadas
- Campo completed: boolean en cada actividad del JSON
- Checkbox en cada actividad — al marcar, la actividad se tacha visualmente con animación
- Barra de progreso del viaje: "Has completado X de Y actividades"
- Las actividades completadas van al final del día con opacidad reducida
- Guardar el estado en Supabase en tiempo real

### 5.6 Exportar itinerario a PDF
- Usar la librería @react-pdf/renderer o html2canvas + jsPDF
- El PDF debe incluir: portada con imagen del destino, resumen del viaje, itinerario día a día, mapa de ruta
- Botón "Descargar PDF" en la toolbar del itinerario
- Solo disponible para usuarios con plan Viajero o Explorador (upsell para free)

### 5.7 Recomendaciones personalizadas
- En el dashboard, sección "Basado en tus viajes anteriores te recomendamos..."
- Analizar los destinos y estilos de los viajes anteriores del usuario
- Mostrar 3 sugerencias de destinos con imagen y botón "Planificar este viaje"
- Implementar con una llamada a Haiku que analice el historial y sugiera destinos

### 5.8 Sección "Tendencias" en el feed
- Nueva sección al inicio del feed: "Destinos trending esta semana 🔥"
- Los 5 destinos más planificados en los últimos 7 días
- Calculado con una query de Supabase agrupando por destino
- Cards horizontales con scroll en mobile

### 5.9 Sistema de afiliados
- Tabla referrals en Supabase: referrer_id, referred_id, code, commission_paid
- Cada usuario tiene un código de referido único (ej: IVAN20)
- Link de referido: itineraya.com?ref=IVAN20
- Al registrarse con un código: 1 mes gratis para el referido, 20% de comisión del primer pago para el referente
- Panel en el perfil: "Tu código de referido", "Usuarios invitados", "Comisiones ganadas"

### 5.10 Trial de 7 días
- Al registrarse, todos los usuarios tienen 7 días de Plan Viajero gratis (sin tarjeta)
- Banner en el dashboard durante el trial: "Te quedan X días de prueba gratuita"
- Email a los 5 días: "Tu prueba acaba en 2 días — no pierdas el acceso"
- Email al terminar: "Tu prueba ha terminado — continúa por 7.99€/mes"
- Implementar con campo trial_ends_at en la tabla profiles

---

## FASE 6 — EMAILS REDISEÑADOS

Usando Resend y React Email, rediseñar todos los emails:

### 6.1 Email de bienvenida
- Asunto: "Bienvenido a Itineraya, [nombre] 🌍"
- Header: imagen de un destino icónico con overlay del logo
- Cuerpo: "Tu próxima aventura está a un clic" + 3 pasos para empezar
- CTA grande: "Planifica tu primer viaje"
- Footer: redes sociales, unsubscribe

### 6.2 Email de confirmación de cuenta
- Asunto: "Confirma tu cuenta en Itineraya"
- Diseño limpio con el botón de confirmación grande y prominente
- Texto de apoyo: "Al confirmar, accedes a itinerarios ilimitados generados con IA"

### 6.3 Email recordatorio pre-viaje (7 días)
- Asunto: "Tu viaje a [destino] es en 7 días ✈️"
- Imagen del destino como hero
- Resumen del itinerario (primeros 2 días)
- Checklist de preparación del viaje
- CTA: "Ver mi itinerario completo"

### 6.4 Email post-viaje (2 días después)
- Asunto: "¿Cómo fue [destino]? 🌟"
- Imagen del destino
- Invitación a valorar el itinerario
- Sugerencia de siguiente destino
- CTA: "Planifica tu próximo viaje"

### 6.5 Email de trial expirando (5 días después del registro)
- Asunto: "Tu prueba gratuita acaba en 2 días ⏰"
- Recordatorio de las features que perderán
- Oferta especial: primer mes con 20% de descuento
- CTA urgente: "Mantener acceso premium"

---

## FASE 7 — SEO Y DESCUBRIMIENTO

### 7.1 Meta tags dinámicos
- En cada página de itinerario compartido: title="Itinerario de X días en [Destino] — Itineraya", description con el resumen del viaje
- Open Graph: og:image con la imagen hero del destino
- Twitter Card: summary_large_image
- Canonical URLs en todas las páginas

### 7.2 Landing pages por destino
- Crear rutas dinámicas /destinos/[ciudad] con contenido específico por destino
- "Los mejores itinerarios para [Ciudad] generados con IA"
- Mostrar los itinerarios públicos de ese destino del feed
- Estadísticas: "X itinerarios creados para [Ciudad]"
- CTA: "Crea tu itinerario para [Ciudad]"
- Generar las 20 ciudades más buscadas: París, Tokyo, Nueva York, Barcelona, Roma, Londres, Amsterdam, Bali, Tailandia, Marruecos, etc.

### 7.3 Schema markup
- Añadir JSON-LD schema de tipo TouristAttraction en las páginas de destino
- Schema de tipo WebApplication en la landing
- Schema de tipo FAQPage en la sección de preguntas frecuentes

### 7.4 Sitemap dinámico
- Generar sitemap.xml dinámico que incluya todas las páginas de itinerarios públicos
- Actualizar automáticamente cuando se publique un nuevo itinerario
- Incluir las landing pages de destino

### 7.5 Sección FAQ en la landing
- Añadir sección de preguntas frecuentes al final de la landing
- 8-10 preguntas: "¿Cómo funciona?", "¿Es gratis?", "¿Puedo compartir mi itinerario?", etc.
- Diseño con acordeón animado
- Optimizado para aparecer en Google con rich snippets

---

## FASE 8 — INTERNACIONALIZACIÓN COMPLETA

### 8.1 Verificar traducción al inglés
- Revisar TODOS los textos de la app en inglés — que no quede nada en español hardcodeado
- Verificar que cuando el usuario tiene el idioma en inglés, toda la app está en inglés
- Especial atención a: emails, toasts, mensajes de error, placeholders

### 8.2 Añadir francés
- Crear src/i18n/locales/fr.json
- Traducir todos los textos al francés
- Añadir "Français" al selector de idioma

### 8.3 Añadir portugués
- Crear src/i18n/locales/pt.json
- Traducir todos los textos al portugués (Brasil)
- Añadir "Português" al selector de idioma

### 8.4 Detección automática de idioma
- Al primer acceso, detectar el idioma del navegador (navigator.language)
- Si el idioma detectado está disponible (es, en, fr, pt), establecerlo automáticamente
- Guardar la preferencia en el perfil del usuario en Supabase

---

## FASE 9 — MOBILE Y PWA

### 9.1 Progressive Web App
- Crear manifest.json con: name, short_name, icons (usando itineraya-mark.png), theme_color, background_color, display: standalone
- Añadir service worker básico para cache offline de los itinerarios ya generados
- Meta tags PWA en el head: apple-mobile-web-app-capable, apple-touch-icon
- Banner "Añadir a pantalla de inicio" en mobile (después de 3 visitas)

### 9.2 Compartir nativo en mobile
- En el botón "Compartir" del itinerario, detectar si navigator.share está disponible
- Si está disponible (mobile), usar la API nativa de Share del navegador
- Si no está disponible (desktop), mostrar el modal de compartir actual

### 9.3 Gestos swipe en el onboarding
- En mobile, permitir swipe horizontal para avanzar/retroceder entre pasos del onboarding
- Implementar con el hook useDrag de framer-motion
- Indicadores de punto en la parte inferior para mostrar el paso actual

### 9.4 Bottom sheets en mobile
- Reemplazar los modales (dialog) por bottom sheets en mobile (se deslizan desde abajo)
- Aplicar en: modal de compartir, modal de invitar, modal de confirmación de borrado
- Usar la librería vaul que ya está instalada en el proyecto

---

## FASE 10 — MONETIZACIÓN OPTIMIZADA

### 10.1 Upsell inteligente
- Cuando un usuario free intenta usar el asistente IA: modal de upgrade con preview de lo que obtiene
- Cuando un usuario free lleva más de 3 viajes creados: banner sutil "Desbloquea viajes ilimitados"
- Cuando un usuario free intenta descargar el PDF: modal de upgrade
- Cuando un usuario free comparte 2+ itinerarios: "Los usuarios Viajero pueden hacer X"
- Todos los upsells deben ser sutiles y basados en valor, nunca agresivos

### 10.2 Página de precios optimizada
- Añadir tabla comparativa de features debajo de los cards de precio
- Añadir sección de testimonios de usuarios (inventados pero realistas para el lanzamiento)
- Añadir garantía: "30 días de devolución sin preguntas"
- Añadir FAQ específico de precios: "¿Puedo cancelar?", "¿Qué pasa si no estoy satisfecho?"
- Añadir logos de métodos de pago (Visa, Mastercard, etc.)

### 10.3 Descuento por referido
- Implementar el sistema de referidos de la Fase 5.9
- Página dedicada /referidos con explicación del programa
- Email automático cuando alguien usa tu código de referido

---

## FASE 11 — SEGURIDAD Y CALIDAD

### 11.1 Rate limiting
- En la generación de itinerarios: máximo 3 por hora para usuarios free, 20 para usuarios de pago
- En el registro: máximo 5 intentos por IP por hora
- En el login: bloqueo temporal después de 10 intentos fallidos
- Implementar con una tabla rate_limits en Supabase o con Vercel Edge Middleware

### 11.2 Validación de inputs
- Todos los formularios deben validar con Zod antes de enviar al servidor
- Mensajes de error claros y específicos
- Sanitizar inputs antes de guardarlos en Supabase
- Verificar que no hay inyección SQL posible en las queries

### 11.3 Logging de errores
- Implementar logging básico de errores del servidor en Vercel Logs
- Para errores críticos (fallo de pago, fallo de generación de IA): enviar email al admin (ivann.adsuaraa@gmail.com)
- Tabla error_logs en Supabase para errores de la app

---

## ORDEN DE PRIORIDAD SI SE ACABA EL CONTEXTO

1. Fase 2 (bugs críticos) — globo, maps, timeline, compartir
2. Fase 4 (UX/UI) — empty states, animaciones, carga del itinerario
3. Fase 5.1 (valoraciones feed) — feature de crecimiento
4. Fase 5.10 (trial 7 días) — conversión
5. Fase 7 (SEO) — adquisición orgánica
6. Fase 9 (PWA) — retención mobile
7. Fase 3 (performance) — experiencia
8. Fase 5 resto (features nuevas)
9. Fases 6, 8, 10, 11

---

## REGLAS PARA ESTA SESIÓN

- NO hagas commits ni push
- Haz un commit mental (anota en NIGHT_REPORT_2.md) por cada fase completada
- Si algo es muy arriesgado de cambiar sin poder verlo en producción, anótalo y sigue
- Usa siempre las skills disponibles antes de implementar
- Prioridad absoluta: que nada que funcionaba deje de funcionar
- Al terminar, crea NIGHT_REPORT_2.md con resumen completo de lo hecho
