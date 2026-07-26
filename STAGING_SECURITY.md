# Exposición pública de entornos de staging/preview

## Resumen

Se pidió comprobar si algún entorno de staging o preview (Vercel Preview
Deployments) está expuesto públicamente e indexado en Google Search Console, y
en caso afirmativo restringir el acceso.

**Honestidad sobre el alcance de esta revisión**: esta sesión no tiene
credenciales de la cuenta de Vercel (API token / login CLI) ni acceso a la
Google Search Console del dominio `itineraya.com`. No he podido:

- Listar los deployments de preview reales del proyecto en Vercel.
- Comprobar en GSC (Cobertura / Páginas) si alguna URL `*.vercel.app` o de un
  dominio de preview quedó indexada.

Lo que sí he podido hacer es revisar el código y añadir protecciones que
**no dependen de esas credenciales** y que mitigan el riesgo aunque exista un
preview indexado ahora mismo: bloquear la indexación de cualquier despliegue
no-producción y, opcionalmente, exigir credenciales para acceder a él. La
verificación en GSC/Vercel queda como paso manual pendiente (ver §3).

## 1. Qué protegía antes el proyecto (y qué no)

- `vercel.json` define cabeceras de seguridad (CSP, HSTS, X-Frame-Options...)
  pero se aplican igual en producción y en previews — no distinguen entorno.
- `public/robots.txt` es un fichero estático servido igual en cualquier
  dominio (producción o `*.vercel.app`), y solo bloquea rutas de la app
  (`/dashboard`, `/new-trip`...), no bloquea el sitio entero.
- No existía ninguna comprobación de `VERCEL_ENV` en el código, ni cabecera
  `X-Robots-Tag`, ni autenticación para previews.

Esto significa que, por defecto, **cualquier preview de Vercel (una URL por
rama/PR) era rastreable e indexable como cualquier página de producción**, a
menos que la organización tenga activada manualmente la protección de
Vercel (Deployment Protection / Vercel Authentication) desde el dashboard —
algo que esta sesión no puede verificar ni activar sin acceso a la cuenta.

## 2. Cambios aplicados (`src/server.ts`)

`src/server.ts` es el punto de entrada único de todas las peticiones HTTP
(SSR, rutas de API, assets vía Nitro), así que es el sitio correcto para
aplicar una política transversal a todo el sitio sin tocar cada ruta.

Vercel expone automáticamente `VERCEL_ENV` en tiempo de ejecución:
`"production"` solo en el deploy de producción, `"preview"` en despliegues de
rama/PR, `"development"` en `vercel dev`. En local (`npm run dev`) esa
variable no existe. Se usa para detectar "esto no es producción":

```ts
const IS_NON_PRODUCTION_DEPLOY =
  !!process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production";
```

Con eso, en todo despliegue no-producción:

1. **`X-Robots-Tag: noindex, nofollow, noarchive`** se añade a *toda*
   respuesta (HTML, JSON, imágenes...). A diferencia de una `<meta
   name="robots">`, esta cabecera funciona para cualquier tipo de contenido y
   la respetan Google y el resto de buscadores aunque la URL ya esté
   enlazada o filtrada. Esto es la mitigación principal: aunque un preview
   sea "descubierto", no debería llegar a indexarse.

2. **Basic Auth opcional** (`STAGING_BASIC_AUTH_USER` /
   `STAGING_BASIC_AUTH_PASSWORD`): si ambas variables de entorno están
   configuradas en Vercel para el entorno Preview, toda petición a un
   preview sin credenciales válidas recibe `401` con
   `WWW-Authenticate: Basic`. La comparación de usuario/contraseña usa
   `crypto.timingSafeEqual` para evitar timing attacks. Si las variables
   **no** están configuradas, no se bloquea el acceso (para no romper
   previews existentes por sorpresa) — solo queda activo el `noindex` de
   arriba.

Producción (`VERCEL_ENV=production`) y el entorno local no se ven afectados
en ningún caso: `IS_NON_PRODUCTION_DEPLOY` es `false` para ambos.

## 3. Pasos manuales pendientes (requieren acceso a las cuentas)

Estos pasos no se pueden hacer desde el código y hay que hacerlos desde los
dashboards correspondientes:

### 3.1 Vercel — activar protección nativa de previews (recomendado)

En el dashboard del proyecto: **Settings → Deployment Protection** → activar
**Vercel Authentication** (o **Password Protection** si el plan no incluye
SSO) para el entorno *Preview*. Esto protege el preview a nivel de
infraestructura (antes de que la petición llegue siquiera al código), es más
robusto que el Basic Auth añadido aquí y no depende de gestionar un
usuario/contraseña compartido. Si se activa esto, el Basic Auth de
`src/server.ts` pasa a ser una segunda capa redundante (no hace falta
configurar `STAGING_BASIC_AUTH_*`).

Si se prefiere el Basic Auth propio en vez de (o además de) la protección
nativa de Vercel: añadir `STAGING_BASIC_AUTH_USER` y
`STAGING_BASIC_AUTH_PASSWORD` en **Settings → Environment Variables**,
marcadas solo para el entorno **Preview** (no Production).

### 3.2 Vercel — revisar deployments existentes

**Deployments** → filtrar por *Preview* → comprobar manualmente si hay URLs
de preview antiguas que se hayan compartido/enlazado públicamente (Slack,
issues, redes) y que convenga expirar (**Settings → Deployment Protection →
"Expiration"**, o eliminar el deployment).

### 3.3 Google Search Console

1. Confirmar que la propiedad verificada es el dominio de producción
   (`itineraya.com`), no un dominio `*.vercel.app` — GSC no permite verificar
   subdominios de `vercel.app` que no controlas.
2. **Coverage / Pages** → buscar si hay URLs indexadas con dominio distinto
   a `itineraya.com`. Si aparece alguna `*.vercel.app` indexada, usar
   **Removals → Temporary Removal** para sacarla de resultados de forma
   inmediata, y confirmar que ya devuelve `X-Robots-Tag: noindex` (con los
   cambios de este PR) o `401` (si se activa Deployment Protection) para que
   no vuelva a indexarse.
3. Si se encuentra contenido indexado de un preview, es señal de que el
   preview estuvo accesible públicamente sin protección — repasar §3.1 con
   prioridad.

## 4. Cómo verificar el cambio de código

No fue posible probar contra un despliegue real de Vercel en este entorno
(sin credenciales de la cuenta). Para verificar tras el merge:

1. Desplegar a un preview (push a esta rama ya genera uno automáticamente).
2. `curl -I https://<url-de-preview>.vercel.app/` y comprobar que la
   respuesta incluye `x-robots-tag: noindex, nofollow, noarchive`.
3. Si se configuraron `STAGING_BASIC_AUTH_USER/PASSWORD`: comprobar que sin
   cabecera `Authorization` la respuesta es `401`, y que
   `curl -u usuario:contraseña ...` devuelve `200`.
4. Repetir el `curl -I` contra el dominio de producción y confirmar que
   **no** aparece `x-robots-tag` (el comportamiento de producción no cambia).
