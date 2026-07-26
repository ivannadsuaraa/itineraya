# STAGING_SECURITY.md

Auditoría de entornos de staging/preview expuestos públicamente (2026-07-26).
**Cambios de código ya aplicados** en `src/server.ts` (verificados de extremo
a extremo con un build real, ver sección de verificación). Dos acciones
manuales quedan pendientes porque requieren acceso a paneles a los que esta
sesión no tiene credenciales — se detallan al final.

## Limitación de partida — sé transparente sobre esto

Esta sesión **no tiene acceso a Google Search Console** (requiere OAuth con
la cuenta de Google propietaria de la propiedad) **ni al panel/API de
Vercel** (requiere el token/login de la cuenta de Vercel del proyecto). No
pude iniciar sesión en ninguno de los dos para comprobar directamente qué
hay indexado o qué Preview Deployments existen activos ahora mismo. Lo que
sigue es lo que **sí** pude determinar: por inspección del código fuente,
por intentos de alcance HTTP reales (bloqueados o resueltos, según el caso),
y por búsqueda web pública.

## Hallazgos

### 1. Dominio de staging de Lovable — `https://itineraya.lovable.app`

Encontrado hardcodeado en `src/routes/email/email/auth/preview.ts` (línea
28, `SAMPLE_PROJECT_URL`) como dato de ejemplo para previsualizar plantillas
de email. Esto confirma que el proyecto se originó en **Lovable** (una
plataforma de desarrollo con IA que aloja una preview en vivo de cada
proyecto en `<slug>.lovable.app`) antes de migrar al stack actual (TanStack
Start + Vercel + Supabase directo). `AUDIT_REPORT.md` (auditoría previa) ya
había señalado "restos de Lovable" en comentarios y nombres de fichero como
ruido inofensivo — pero un **despliegue en vivo** en esa plataforma es un
asunto distinto y más serio que un comentario: si sigue activo, es
potencialmente una versión antigua de la app, servida desde una cuenta que
ya no es la actual, y sin ninguna de las cabeceras de seguridad ni la CSP
que sí tiene `vercel.json` (`X-Frame-Options`, CSP, HSTS, etc. — todas son
específicas de la config de Vercel, no se replican en Lovable).

- Intento de alcance directo (`curl`) bloqueado por la política de red del
  sandbox (igual que ocurrió con `itineraya.com` en una sesión anterior de
  esta misma auditoría de seguridad).
- Con `WebFetch`: el dominio devuelve **403 Forbidden**. Esto es ambiguo —
  puede significar que la app fue despublicada en Lovable (403 genérico de
  la plataforma para slugs no reclamados/borrados), o que hay una protección
  activa bloqueando el user-agent del fetch, no necesariamente a un
  navegador humano.
- Búsqueda web (`site:lovable.app itineraya` y variantes con "preview" /
  "staging"): **no aparece indexado** por el motor de búsqueda usado. Esto
  reduce el riesgo de exposición vía buscadores, pero no prueba que el sitio
  esté inaccesible para alguien con el enlace directo.

**Acción requerida (manual, no puedo hacerlo desde aquí):** entrar a la
cuenta de Lovable del proyecto y confirmar que el despliegue está
**despublicado/eliminado** por completo, no solo desvinculado del dominio
`itineraya.com`. Si Lovable ofrece protección por contraseña en su plan y se
quiere mantener el proyecto vivo ahí por algún motivo, activarla.

### 2. Vercel Preview Deployments — sin ninguna protección configurada

Vercel genera automáticamente una URL pública (`*.vercel.app`) para **cada
push/PR**, sin autenticación por defecto salvo que el equipo active
"Deployment Protection" desde el panel del proyecto (Project Settings →
Deployment Protection: Vercel Authentication, Password Protection, o
restricción por IP — funciones de panel, no expresables en `vercel.json`).

Confirmé que este proyecto usa activamente Preview Deployments: un informe
de sesión anterior (`FABLE_FINAL_REPORT.md`, línea 111) recomienda
explícitamente añadir `https://*.vercel.app/*` a las restricciones de la API
key de Google Maps "(previews)" — es decir, ya se sabía y asumía que existen
previews públicas en `*.vercel.app` sirviendo tráfico real.

Revisé `vercel.json`: las cabeceras de seguridad (CSP, HSTS, X-Frame-Options)
se aplican igual en cualquier despliegue, pero **no hay nada** que
distinga producción de una preview — ninguna preview estaba protegida ni
excluida de indexación. Cada preview comparte el mismo proyecto de Supabase
que producción (confirmado por las variables de entorno del proyecto: no
hay un Supabase "de staging" separado), así que una preview expuesta es
funcionalmente idéntica a producción en cuanto a los datos a los que puede
llegar — el único gap es que cualquiera con la URL de la preview (que
Vercel publica en cada comentario de PR de GitHub) puede usarla sin ningún
control adicional.

**No pude enumerar las URLs de preview actualmente activas** (requiere el
panel de Vercel) ni confirmar si Google las ha indexado (requiere Search
Console). Lo que sí pude hacer es cerrar el problema de raíz para **todas**
las previews, pasadas y futuras, sin necesitar conocer sus URLs una por una.

## Fix aplicado — `src/server.ts`

Vercel expone automáticamente `VERCEL_ENV` en cada despliegue: `"production"`
solo en el dominio de producción, `"preview"` en cada Preview Deployment.
Es la señal fiable — no depende de adivinar dominios ni de mantener una
lista. `src/server.ts` es el punto de entrada único de todo el tráfico HTTP
del proyecto (páginas SSR, rutas API, todo pasa por su `fetch()`), así que
es el sitio correcto para aplicar esto una sola vez, sin tocar cada ruta:

```ts
// src/server.ts
import { timingSafeEqual } from "node:crypto";

const IS_PREVIEW = process.env.VERCEL_ENV === "preview";
const IS_PRODUCTION = process.env.VERCEL_ENV === "production";

// Stripe llama al webhook con su propia verificación de firma — no puede
// completar un reto interactivo de Basic Auth, así que debe seguir
// accesible incluso en preview.
const BASIC_AUTH_EXEMPT_PREFIXES = ["/api/public/"];

function checkPreviewAccess(request: Request): Response | null {
  if (!IS_PREVIEW) return null;
  const url = new URL(request.url);
  if (BASIC_AUTH_EXEMPT_PREFIXES.some((p) => url.pathname.startsWith(p))) return null;

  const expectedUser = process.env.PREVIEW_BASIC_AUTH_USER;
  const expectedPass = process.env.PREVIEW_BASIC_AUTH_PASS;
  if (!expectedUser || !expectedPass) {
    // Falla CERRADO: sin credenciales configuradas, bloquea todo en vez de
    // dejar la preview abierta silenciosamente.
    return unauthorizedResponse();
  }
  // ...valida el header Authorization: Basic con comparación de tiempo
  // constante (timingSafeEqual) contra esas credenciales...
}

function withRobotsHeaderIfNonProd(response: Response): Response {
  if (IS_PRODUCTION) return response;
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return new Response(response.body, { status: response.status, headers });
}

export default {
  async fetch(request, env, ctx) {
    const authFailure = checkPreviewAccess(request);
    if (authFailure) return authFailure;
    // ...handler normal...
    return withRobotsHeaderIfNonProd(response);
  },
};
```

Dos mecanismos independientes, cada uno cubre lo que pediste:

1. **"No accesible públicamente"** → HTTP Basic Auth obligatorio en toda
   preview (`VERCEL_ENV=preview`), excepto el webhook de Stripe
   (`/api/public/payments/webhook`, que se autentica por firma, no por
   sesión de navegador). Falla cerrado si las credenciales no están
   configuradas como variables de entorno de Vercel.
2. **"No indexado"** → cabecera `X-Robots-Tag: noindex, nofollow, noarchive`
   en toda respuesta cuando `VERCEL_ENV !== "production"` — cubre HTML, JSON
   y cualquier otro tipo de respuesta (a diferencia de una etiqueta
   `<meta name="robots">`, que solo funciona en páginas HTML). Con la
   Basic Auth activa además, Googlebot ni siquiera puede completar el
   crawl (recibe 401), así que en la práctica esta cabecera es una segunda
   capa de defensa para cualquier ruta exenta de la auth (el webhook) o
   para local/dev donde `VERCEL_ENV` no está definido.

`public/robots.txt` es un fichero estático (no pasa por `server.ts`) y sigue
siendo idéntico en todos los entornos — deliberadamente no lo convertí en
una ruta dinámica: `X-Robots-Tag` es la señal que de verdad decide la
indexación (Google la respeta incluso si `robots.txt` permite el rastreo);
`robots.txt` solo controla el rastreo, no la indexación, así que un
`Disallow` ahí sería una segunda señal redundante frente a un mecanismo ya
más fuerte, no una protección adicional real.

## Verificación (build real, `VERCEL_ENV` simulado, extremo a extremo)

Construí el proyecto (preset `node-server` para poder ejecutarlo localmente)
y serví el build resultante con distintos valores de `VERCEL_ENV`:

| Escenario                                                      | Esperado            | Obtenido                             |
| -------------------------------------------------------------- | ------------------- | ------------------------------------ |
| `preview`, sin cabecera `Authorization`                        | 401                 | ✅ 401                               |
| `preview`, credenciales incorrectas                            | 401                 | ✅ 401                               |
| `preview`, credenciales correctas                              | 200                 | ✅ 200                               |
| `preview`, ruta del webhook de Stripe, sin auth                | 200 (exenta)        | ✅ 200                               |
| `preview`, **sin** `PREVIEW_BASIC_AUTH_USER/PASS` configuradas | 401 (falla cerrado) | ✅ 401                               |
| `production`, sin credenciales                                 | 200                 | ✅ 200                               |
| Cabecera `WWW-Authenticate` en el 401                          | presente            | ✅ `Basic realm="Itineraya preview"` |
| Cabecera `X-Robots-Tag` en `preview` (autorizado)              | presente            | ✅ `noindex, nofollow, noarchive`    |
| Cabecera `X-Robots-Tag` en `production`                        | ausente             | ✅ ausente                           |

`tsc --noEmit`, ESLint y Prettier: limpios en `src/server.ts`.

## Acciones manuales pendientes (requieren acceso que esta sesión no tiene)

1. **Configurar `PREVIEW_BASIC_AUTH_USER` y `PREVIEW_BASIC_AUTH_PASS`** como
   variables de entorno en el panel de Vercel del proyecto, **con el scope
   limitado a "Preview"** (no Production, no Development) — Project
   Settings → Environment Variables. Sin esto, el fix ya desplegado
   **bloqueará todas las previews** (por el diseño fail-closed) hasta que se
   configuren; es una consecuencia intencionada, no un efecto secundario:
   así se nota inmediatamente en la primera preview tras el deploy si falta
   este paso, en vez de descubrir silenciosamente meses después que nunca
   se protegió nada.
2. **Confirmar en la cuenta de Lovable** que `itineraya.lovable.app` está
   completamente despublicado (no solo desvinculado del dominio propio).
3. **Opcional, más robusto a largo plazo:** si el plan de Vercel lo incluye,
   activar "Deployment Protection" nativo (Vercel Authentication o Password
   Protection) desde Project Settings — es el mecanismo soportado
   oficialmente por Vercel, con mejor UX que un Basic Auth casero (SSO con
   la cuenta de Vercel del equipo, o un login dedicado). El fix de este
   informe es una capa adicional y no oficial que funciona en cualquier
   plan, incluido el gratuito, precisamente para no depender de si el plan
   de Vercel del proyecto incluye esa función.
4. **Revisar en Google Search Console** (cuando se tenga acceso) la sección
   "Cobertura"/"Páginas" filtrando por el dominio o por URLs que contengan
   `vercel.app` o `lovable.app`, y solicitar la eliminación manual de
   cualquier URL de ese tipo que aparezca ya indexada — el `X-Robots-Tag`
   añadido evita que se indexe **de aquí en adelante**, pero no retira lo
   que Google ya hubiera indexado antes de este cambio.
