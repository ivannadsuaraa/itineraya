# Quality Overhaul — itinerarios en los que se puede confiar

Informe de la segunda tanda de trabajo sobre el núcleo de Itineraya: requisitos 3–6 de
la Parte 2, la Parte 3 (cruce con Google Places) y la Parte 4 (UI de confianza), más
dos itinerarios de prueba con todos sus lugares verificados a mano.

Rama: `claude/simplify-itineraya-core-2o4djo`.

---

## 1. Qué se ha cambiado

### 1.1 El prompt ahora es un módulo propio y probable

`buildItineraryPrompt()` vive en **`src/lib/itinerary-prompt.ts`** y es una función pura.
Antes el prompt era un template literal de 350 líneas dentro del handler de
`generateItinerary`, así que la única forma de ver el prompt real era desplegar y generar
un viaje.

Ahora lo usan dos sitios y **el mismo texto**:

- `src/lib/itinerary.functions.ts` → la generación de producción
- `scripts/generate-test-itinerary.ts` → el banco de pruebas

Esto es lo que hace que las pruebas de más abajo signifiquen algo. Si el script
construyera su propio prompt, estaríamos midiendo un prompt que ningún usuario recibe.

> El propio banco de pruebas encontró un fallo durante la extracción: la primera versión
> del módulo indentaba dos espacios cada línea del template, así que el prompt salía con
> `  THE TRAVELER` en vez de `THE TRAVELER`. Se ve al renderizarlo y no se ve leyendo el
> código. Corregido.

### 1.2 Requisito 3 — Personalización profunda

El problema anterior no era que faltaran datos del usuario en el prompt: estaban todos.
Era que entraban como **descripción** ("viaja en pareja", "presupuesto medio") y el
modelo los repetía en el texto sin que cambiaran qué sitios elegía. La regla nueva es que
cada entrada tiene que mover la **selección**, no el adjetivo.

| Entrada | Antes | Ahora |
|---|---|---|
| Primera visita / repetición | Una frase de tono: "evita los tópicos" | Contraste explícito y accionable: al primerizo los iconos son **no negociables** (un primerizo en Roma ve el Coliseo); al repetidor se le prohíbe rehacer la ruta de primerizo y se le manda a barrios, museos de segunda fila y una salida a un pueblo real. Con ejemplo concreto de qué significa cada caso en Roma. |
| Compañía | Solo aparecía en "Profile:" | Bloque propio por tipo: solo → barras y mercados, barrios vivos de noche, nada de "cena romántica para dos"; pareja → atmósfera y una noche que sea *la* noche; amigos → platos para compartir, terrazas, sitios con continuación; familia → tramos cortos, dónde sentarse y dónde hay baño, cenas antes, y **plan B para toda actividad larga o con entrada**. |
| Presupuesto | "Ajusta las opciones a este nivel" | Se declara filtro de selección, no pie de foto, con qué significa en concreto arriba y abajo (mirador gratis y comida de mercado vs. menú degustación con reserva y traslado privado) y prohibición de mezclar los dos registros en un mismo día. |
| Dieta / ritmo / intereses | Ya funcionaban | Sin cambios de fondo. |

Y una comprobación final que obliga a demostrarlo: *"este itinerario no se le podría dar
tal cual a otro viajero. Señala las paradas que existen por SU presupuesto, SU ritmo, con
quién viaja, su dieta y si es su primera vez. Si no puedes señalarlas, escribiste una guía
genérica con sus datos pegados encima — reconstruye los días."*

### 1.3 Requisito 4 — Clustering geográfico real, según el transporte

"Cerca" sin un número es exactamente lo que producía días que zigzagueaban. Ahora cada
modo de transporte lleva una **geometría con cifras**, que se inyecta literalmente en la
regla de geografía y en la auto-comprobación final:

| Modo | Salto entre paradas | Diámetro del día | Se anda por debajo de |
|---|---|---|---|
| A pie | ~1 km | ~3 km | 1 km |
| Transporte público | ~6 km | ~12 km | 1 km |
| Taxi / VTC | ~8 km | ~15 km | 0,8 km |
| Coche | ~25 km | ~90 km | 1 km |
| Mixto | ~4 km | ~10 km | 1,2 km |

Además: cada día se ancla en **una zona real y bien nombrada** que aparece en el título;
la ruta es línea o bucle y **no vuelve sobre sus pasos**; las comidas caen dentro de la
zona del día, al lado de la parada anterior ("un restaurante al otro lado de la ciudad es
la señal clásica de un itinerario inventado"); y las excursiones fuera del destino se
permiten una o dos veces por viaje, pero **ocupando el día entero**, nunca pegadas al
final de un día normal.

Cada modo lleva también sus avisos prácticos: a pie, tramos empinados, adoquinados o sin
sombra y aviso al pasar de ~8 km diarios; en coche, dónde aparcar en **cada** parada y las
zonas de tráfico restringido; en taxi, dónde no se puede parar uno en la calle; en
transporte público, prohibición de citar una línea sin estar seguro de que existe.

### 1.4 Requisito 5 — Calibración de escala

Bloque nuevo `DESTINATION SCALE`, con cuatro niveles y una instrucción de clasificar el
destino **antes** de planificar nada:

- **Pueblo (< ~20.000 hab.)** — lo que sí tiene: un puñado de monumentos, iglesia o
  castillo, una calle o plaza principal, mercado un día fijo, paseo del río. Lo que **no**
  tiene: barrios con nombre, metro o tranvía, barrio de museos, escena de azoteas, ni tres
  días de monumentos distintos. Y la salida correcta cuando un día se queda corto: llenarlo
  con pueblos, playas o parques **reales de alrededor**, diciendo a qué distancia están y
  cómo se llega en el transporte del viajero. *"Un «condujimos 40 min hasta X» de verdad
  vale más que un tercer barrio inventado."*
- **Villa / ciudad pequeña (20.000–200.000)** — usar las zonas que existen de verdad; no
  fabricar un cuarto barrio para rellenar el día 4.
- **Ciudad (200.000–1M)** — distritos reales con carácter propio, varios museos, red de
  transporte de verdad.
- **Metrópoli (> 1M)** — organizar por distrito y por línea; nunca un día que cruce la
  ciudad entera.

Con regla de desempate: **ante la duda, planifica para el nivel más pequeño**. *"Un
itinerario que trata un pueblo como un pueblo se lee como conocimiento local; uno que le
pone metro a un pueblo se lee como ficción, y todo lo demás pasa a ser sospechoso."*

### 1.5 Requisito 6 — Tips específicos y accionables

La regla de tips pasa de una línea a un bloque con criterio, ejemplos y lista negra
explícita. El criterio: **un tip solo se gana el sitio si es algo que el viajero no podría
deducir plantado delante del sitio**, y tiene que nombrar algo comprobable — un plato por
su nombre local, una hora concreta, una puerta o andén concreto, una costumbre concreta.

Prohibidos por escrito, en cualquier redacción: *lleva calzado cómodo, reserva con
antelación, ve pronto, prueba la comida local, cuidado con tus pertenencias, el atardecer
es precioso, empápate del ambiente, no te lo pierdas*. Y explícitamente: **mejor ningún
tip que un tip de relleno** — un viaje con cuatro tips reales vale más que uno con catorce
frases hechas.

La REGLA CERO se extiende a los tips: nunca dar un precio exacto, una hora exacta de
apertura ni una norma de reserva como hecho cierto; decir lo que es habitual y, donde
importe, decir que se confirme.

---

## 2. Parte 3 — Cruce con Google Places

**Sí se puede, y está implementado.** `src/lib/place-verification.ts`.

### 2.1 Cómo funciona

Después de generar el itinerario y antes de guardarlo, cada `place` distinto se busca en
la **Places API (New)**, endpoint `places:searchText`, y el resultado se anota en la propia
actividad (`activity.verification`), más un resumen en `itinerary.verification_summary`.

Tres estados, y la diferencia entre ellos importa:

| Estado | Significa |
|---|---|
| `verified` | Places devolvió un sitio con nombre compatible y cerca del destino. |
| `not_found` | Se buscó y no apareció nada que encajase. El nombre es sospechoso. |
| `unchecked` | No se miró: sin key, error de red, timeout o tope de búsquedas. |

### 2.2 La parte que de verdad importa: no validar la alucinación

Google Places hace búsqueda difusa y devuelve *algo* para casi cualquier texto. Si buscas
un restaurante inventado en Roma, te devuelve la trattoria real más parecida. Una
implementación ingenua marcaría como "verificado" precisamente lo que intenta cazar — y
eso es **peor que no comprobar nada**, porque le pone un sello verde a la mentira.

Por eso un resultado solo cuenta si pasa dos filtros:

1. **Similitud de nombre** (`namesMatch`): se pliegan acentos y puntuación, se descartan
   palabras que no distinguen nada ("restaurante", "bar", "plaza", artículos y
   preposiciones en es/en/fr/pt) y se exige que **dos tercios** de los tokens
   significativos del nombre pedido aparezcan en el que devuelve Google. Con inclusión
   directa como atajo, para que "Museo del Prado" case con "Museo Nacional del Prado".
2. **Distancia** (`haversineKm`): el resultado tiene que caer a ≤120 km del destino. Atrapa
   el fallo clásico de que un bar de Cádiz resuelva a otro del mismo nombre en México.

### 2.3 Garantías operativas

- **Nunca rompe la generación.** Sin `GOOGLE_PLACES_KEY` no se ejecuta. Con la red caída,
  cuota agotada o respuestas raras, todo queda `unchecked` y el viaje se guarda igual. Un
  itinerario sin verificar sigue siendo un itinerario; uno que no llega, no.
- **Coste acotado**: deduplicación por nombre, tope duro de 70 búsquedas por itinerario,
  concurrencia 6, timeout de 4 s por petición y presupuesto total de 20 s.
- **Field mask mínimo** (`id`, `displayName`, `location`, `formattedAddress`), porque en
  Places API (New) el field mask es lo que determina el SKU facturado.
- **También en la edición.** `itinerary-edit.functions.ts` vuelve a verificar tras editar:
  el modelo reescribe el itinerario entero, así que sin esto una edición borraría en
  silencio todos los sellos. Un sello que desaparece daña más la confianza que uno que
  nunca estuvo.

### 2.4 Coste — la razón de que sea opcional

Esto es lo que hay que decidir antes de activarlo en producción:

| Viaje | Búsquedas (tras deduplicar) | Coste aprox. |
|---|---|---|
| 3 días | ~18 | ~0,58 € |
| 7 días | ~41 | ~1,31 € |
| 14 días | ~70 (tope) | ~2,24 € |

Calculado sobre el SKU **Text Search (Pro)** de Places API (New), del orden de 32 $ por
cada 1.000 peticiones en el momento de escribir esto. **Hay que confirmarlo contra la
tarifa vigente y contra el crédito mensual gratuito de Google Cloud antes de activarlo**:
es un coste del mismo orden de magnitud que la propia generación con Haiku, o mayor.

Tres formas de bajarlo, por orden de relación valor/esfuerzo, ninguna implementada aún:

1. **Verificar solo donde se inventan los nombres.** Restaurantes, bares, ocio nocturno y
   tiendas concentran casi todas las invenciones; monumentos, museos y plazas casi
   ninguna. Filtrar por `category` recortaría en torno al 60 % de las búsquedas perdiendo
   muy poca señal.
2. **Caché persistente entre itinerarios.** Ahora solo se deduplica dentro de una misma
   llamada. El Coliseo se busca de nuevo en cada viaje a Roma; una tabla `place_cache` con
   TTL largo lo resolvería una vez.
3. **Verificar en segundo plano.** Entregar el itinerario y verificar después, actualizando
   los sellos cuando lleguen. Quita 2–4 s de la generación a cambio de que los sellos
   aparezcan con retraso.

### 2.5 Activación

```bash
GOOGLE_PLACES_KEY=...   # server-side, SIN prefijo VITE_
```

Requiere **Places API (New)** habilitada en el proyecto de Google Cloud. Sin la variable,
todo el módulo se salta y la app se comporta exactamente como antes.

---

## 3. Parte 4 — UI de confianza

| Dónde | Qué se ve |
|---|---|
| Ficha de actividad (vista del autor) | Sello **Verificado** en verde junto al nombre del sitio cuando Places lo confirmó, con el nombre exacto que devolvió Google en el `title`. |
| Ficha de actividad | Sello **Sin confirmar** en ámbar cuando se buscó y no apareció. |
| Botón *Maps* | Con `place_id` verificado usa el enlace canónico `?q=place_id:…`, que garantiza que el pin cae en ese local. Sin él, búsqueda por texto — que puede aterrizar en un homónimo, y de ahí que el sello importe. |
| Pie del itinerario | Nota de que lo ha generado una IA a partir de tus respuestas, y de que horarios, precios y días de cierre cambian y hay que confirmarlos antes de ir. |
| Pie del itinerario | Si hubo verificación: "Hemos cruzado los lugares con Google Maps: N de M confirmados." |
| **Página pública compartida** | Lo mismo: sellos, nota de IA, y el nombre del sitio pasa a ser **enlace a Maps** — antes era texto muerto. Quien recibe un itinerario ajeno es justo quien más necesita saber qué se ha comprobado. |

Dos decisiones deliberadas:

- **Sin verificación no se pinta nada.** Un icono gris de "no verificado" en cada parada
  dice "no nos fiamos de esto" sobre un itinerario que puede ser perfectamente correcto.
  El ruido cuesta más confianza de la que aporta.
- **"Sin confirmar" es ámbar, no rojo**, y el texto explica el matiz real: los bares
  pequeños y los negocios recién abiertos faltan a menudo en Places. Ni se acusa al
  itinerario ni se le exculpa.

Cadenas añadidas a los cuatro idiomas (`es`, `en`, `fr`, `pt`).

---

## 4. Itinerarios de prueba

### 4.1 Metodología y una advertencia importante

Se han probado dos escenarios que atacan los extremos opuestos del requisito de escala:

| | Ciudad grande | Pueblo pequeño |
|---|---|---|
| Destino | **Roma** (~2,7 M hab.) | **Albarracín**, Teruel (~1.000 hab.) |
| Fechas | 12–14 oct 2026 (lun–mié) | 17–19 oct 2026 (sáb–lun) |
| Viajeros | Pareja, 34 años | Familia, niños de 8 y 11 |
| Transporte | **A pie** | **Coche** |
| Ritmo | Equilibrado | Relajado |
| Presupuesto | 900–1.400 € | 600–900 € |
| Dieta | — | **Sin gluten** |
| Primera vez | Sí | Sí |
| Prompt generado | 17.585 car. | 18.090 car. |

> ⚠️ **Advertencia sobre cómo se generaron estos itinerarios.** Este contenedor de
> desarrollo **no tiene `ANTHROPIC_API_KEY`**, así que no se pudo ejecutar la ruta real de
> producción. Los prompts sí son los reales, generados por `buildItineraryPrompt` y
> guardados en `scripts/output/*.prompt.txt`. Los **itinerarios** los produjo Claude Opus 5
> ejecutando ese prompt dentro de la sesión de desarrollo, **no `claude-haiku-4-5` vía
> API**. Sirven para comprobar que el prompt pide lo correcto y que la verificación manual
> encuentra lugares reales — **no** para medir cómo se comporta Haiku, que es un modelo más
> pequeño y el que de verdad genera en producción.
>
> Para obtener la medición que falta, con la key puesta:
> ```bash
> node --experimental-strip-types --import ./scripts/register-alias.mjs \
>   scripts/generate-test-itinerary.ts scripts/scenarios/roma-primera-vez.json
> ```

Salidas en `scripts/output/roma-primera-vez.json` y `scripts/output/albarracin-pueblo.json`.

### 4.2 Verificación manual — Roma

Comprobado uno a uno vía búsqueda web. 19 lugares (17 en `place`, 2 más citados en tips).

| # | Lugar | Estado | Comprobación |
|---|---|---|---|
| 1 | Armando al Pantheon | ✅ Real | Salita de' Crescenzi 31. Familia Gargioli desde 1961. En la guía Michelin y en Turismo Roma. **Cierra domingos** — el día 1 es lunes, correcto. |
| 2 | Pantheon | ✅ Real | — |
| 3 | Chiesa di San Luigi dei Francesi | ✅ Real | Ciclo de San Mateo de Caravaggio, entrada libre. |
| 4 | Piazza Navona | ✅ Real | — |
| 5 | Ponte Sant'Angelo | ✅ Real | — |
| 6 | Roscioli Salumeria con Cucina | ✅ Real | Via dei Giubbonari 21. |
| 7 | Sant'Eustachio Il Caffè *(tip)* | ✅ Real | Piazza Sant'Eustachio 82. Abre lunes 07:30–01:00. |
| 8 | Antico Forno Roscioli *(tip)* | ✅ Real | Via dei Chiavari 34, lun–sáb 07:00–19:30. |
| 9 | Colosseo | ✅ Real | Abre lunes. |
| 10 | Basilica di San Clemente | ✅ Real | — |
| 11 | Foro Romano | ✅ Real | Abre lunes; mismo billete que el Coliseo. |
| 12 | La Carbonara | ✅ Real | Via Panisperna 214, Monti, desde 1906. |
| 13 | Basilica di San Pietro in Vincoli | ✅ Real | Moisés de Miguel Ángel. |
| 14 | Ai Tre Scalini | ✅ Real | Via Panisperna 251, Monti. |
| 15 | Piazza della Madonna dei Monti *(tip)* | ✅ Real | — |
| 16 | Musei Vaticani | ✅ Real | — |
| 17 | **Borgo Pio** | ✅ Real — **recurso REGLA CERO** | Calle peatonal real del Borgo. Usada como ancla en lugar de inventar un nombre de trattoria. |
| 18 | Basilica di San Pietro | ✅ Real | — |
| 19 | Piazza San Pietro | ✅ Real | — |

**19 de 19 reales. 0 inventados. 1 uso del recurso de la REGLA CERO** (la comida del día 3,
justo donde el prompt avisa de que se cuelan los nombres inventados).

Datos comprobados que **cambiaron la estructura** del itinerario:

- **Los miércoles por la mañana la Basílica de San Pedro cierra al público** por la
  audiencia papal y reabre sobre las 12:30. El día 3 es miércoles → museos a primera hora,
  comida en Borgo Pio, basílica a las 13:45. Esto no es un adorno: es la diferencia entre
  el itinerario y una puerta cerrada, y va explicado en el tip.
- **Galleria Doria Pamphilj cierra los miércoles.** Comprobado y por eso **no** aparece.
- Musei Capitolini abren todos los días — se comprobó por si hacía falta alternativa el
  lunes; no hizo falta.

Un dato **no verificado de forma independiente** en esta pasada, y marcado como tal por
honestidad: el detalle de que el *gran caffè* de Sant'Eustachio viene ya azucarado y hay
que pedirlo "senza zucchero". Es sabido y coherente con la casa, pero no se confirmó en
fuente en esta sesión.

### 4.3 Verificación manual — Albarracín

14 lugares (12 en `place`, 3 citados en tips; Rincón del Chorro aparece dos veces).

| # | Lugar | Estado | Comprobación |
|---|---|---|---|
| 1 | Rincón del Chorro | ✅ Real | Desde 1980, misma familia. En el directorio oficial del Ayuntamiento de Albarracín y con web propia. Ternasco de Aragón, migas, sopas de ajo, borraja. **Ofrece opciones sin gluten.** |
| 2 | Plaza Mayor | ✅ Real | — |
| 3 | Casa de la Julianeta *(tip)* | ✅ Real | La casa torcida, señalizada. |
| 4 | Catedral del Salvador | ✅ Real | Gótico tardío, 1572–1600. Visita guiada; retablo mayor de madera y techumbre. |
| 5 | Torre del Andador | ✅ Real | Siglo X, la más alta de la muralla. Se sube por camino de tierra en cuesta. |
| 6 | Paisaje Protegido de los Pinares de Rodeno | ✅ Real | Pino rodeno sobre arenisca roja; abarca Albarracín, Bezas y Gea de Albarracín. |
| 7 | Prado del Navazo | ✅ Real | **4 km ida y vuelta, ~100 m de desnivel, ~1 h, dificultad muy fácil** — las cifras del itinerario son las reales. |
| 8 | Abrigo de la Cocinilla del Obispo *(tip)* | ✅ Real | En el Prado del Navazo / Callejón del Plou. |
| 9 | Toros del Prado *(tip)* | ✅ Real | Uno de los abrigos del mismo sendero. |
| 10 | Sendero del Arrastradero | ✅ Real | Ruta señalizada del mismo espacio protegido. |
| 11 | Museo del Juguete | ✅ Real | En la **Casa del Arrabal**, colección de Eustaquio Castellano. **3,50 € adultos / 2 € niños**. |
| 12 | Castillo de Albarracín | ✅ Real | Origen musulmán, sobre el espolón rocoso. **Se visita con guía organizada por el museo del pueblo**; subida empinada de unos 20 min. |
| 13 | Río Guadalaviar | ✅ Real | Rodea el casco. |
| 14 | Albarracín *(ancla de cena, día 2)* | ✅ Real — **recurso REGLA CERO** | — |

**14 de 14 reales. 0 inventados. 2 usos del recurso de la REGLA CERO**, ambos en cenas —
otra vez, exactamente donde el prompt dice que se concentra el riesgo.

### 4.4 Qué demuestra cada prueba

**Escala (req. 5)** — el caso Albarracín es el que más podía romperse, y aguantó:

- **Cero barrios inventados.** El pueblo se trata como lo que es: una Plaza Mayor, una
  catedral, una muralla, un río. No aparece ningún "barrio de los artesanos" ni "zona
  alta" fabricados.
- **Cero líneas de transporte inventadas.** No hay bus urbano en un pueblo de 1.000
  habitantes, y el itinerario no lo menciona.
- **El día 2 entero está fuera del casco**, en los Pinares de Rodeno, con distancia y
  tiempo de coche. Es exactamente la salida que pide la regla: cuando el pueblo no da para
  tres días, se llena con sitios reales de alrededor en vez de inflar el pueblo.
- Roma, en el otro extremo, sí se organiza por zonas reales con sus nombres correctos
  (centro storico, Monti, Vaticano/Borgo) y una zona distinta por día.

**Clustering por transporte (req. 4)** — se comprobó cada salto contra el límite del modo:

- Roma, **a pie**: saltos entre paradas de 2 a 12 min (máximo 900 m, por debajo del límite
  de ~1 km) y cada día contenido en menos de ~3 km. Los tres días son línea o bucle, sin
  volver sobre lo andado. La comida del día 3 se movió a Borgo Pio precisamente porque la
  alternativa quedaba a 1,4 km y **rompía el límite del propio prompt**.
- Albarracín, **en coche**: los tramos de coche llevan minutos (15 min al Rodeno, 5 min
  entre senderos), cada parada con coche dice **dónde aparcar**, y el aviso de que el casco
  es peatonal y se deja el coche fuera de la muralla aparece como tip.

**Personalización (req. 3)** — paradas que existen por quién viaja, no por el destino:

- **Sin gluten** → Rincón del Chorro no está por bueno, está porque tiene opciones sin
  gluten *comprobadas*; se repite el día 3 a propósito antes de tres horas de coche; y la
  comida del día 2 es picnic comprado por la mañana justamente porque en mitad del monte
  la celiaquía no se improvisa.
- **Presupuesto** → *Tiempo de Ensueño*, restaurante real de Albarracín con
  reconocimiento gastronómico y sin gluten, se **descartó a propósito**: 600–900 € para
  cuatro personas y tres días es tramo "budget" y no encaja. Es la prueba de que el
  presupuesto filtra de verdad en vez de decorar.
- **Familia con niños** → la Torre del Andador avisa de camino de tierra y cuestas; el
  tip de las pinturas dice que hay que contarles qué buscan *antes* de llegar o pasarán de
  largo; el Museo del Juguete va **antes** que el castillo porque es lo más fácil de vender
  tras dos días de cuestas; y el Arrastradero lleva permiso explícito de saltárselo.
- **Ritmo relajado** → nada empieza antes de las 10:00 y ningún día pasa de 5 paradas.
- **Pareja + primera vez en Roma** → el Coliseo, el Panteón y San Pedro están, sin
  disculpas, y alrededor se cuelan San Clemente y San Pietro in Vincoli, que es la parte
  que un primerizo se pierde.

**Tips (req. 6)** — 15 tips entre los dos itinerarios, ninguno genérico. Muestra:

- "Pedid los rigatoni alla gricia — es su plato, más que la carbonara." *(plato real y
  concreto)*
- "El gran caffè viene ya azucarado: hay que decir «senza zucchero» al pagar." *(costumbre
  local)*
- "Llevad monedas de 1 € para el foco de la capilla: sin luz los cuadros se ven negros."
  *(mecánica real del sitio)*
- "Los miércoles la basílica cierra por la audiencia y reabre sobre las 12:30." *(hecho
  verificado que reordena el día)*
- "Avisad de la celiaquía al reservar, no al sentaros: en un pueblo la cocina es chica."
  *(costumbre local + dieta)*
- "Contadles a los niños qué buscan antes de llegar — arqueros, toros, ciervos — o pasarán
  de largo." *(compañía + sitio concreto)*

Ni un "lleva calzado cómodo", ni un "reserva con antelación" suelto, ni un "empápate del
ambiente".

---

## 5. Estado de comprobaciones

| Comprobación | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ Limpio |
| `npx eslint` sobre los ficheros tocados | ✅ Limpio |
| `npm run build` | ✅ Correcto |
| Harness renderizando ambos prompts | ✅ Correcto |
| `npm run lint` (repo completo) | ⚠️ ~1.320 errores de prettier **preexistentes**, en ficheros no tocados aquí (`terms.tsx`, `swipe.js`, etc.). No introducidos por este trabajo. |

---

## 6. Qué queda pendiente

1. **Ejecutar el harness con `ANTHROPIC_API_KEY`** contra `claude-haiku-4-5`. Es la medición
   que falta: todo lo de arriba demuestra que el prompt pide lo correcto, no que Haiku lo
   cumpla. Es el paso que más información daría por menos esfuerzo.
2. **Decidir sobre Places** con la tarifa vigente delante (§2.4). Si el coste no sale,
   filtrar por categoría es el recorte con mejor relación valor/esfuerzo.
3. **Caché persistente de lugares** entre itinerarios, si Places se activa.
4. **Migración `transport`** (`supabase/migrations/20260825120000_trip_transport_mode.sql`)
   pendiente de aplicar en producción. Hasta entonces el código cae al fallback y el modo
   de transporte es "mixto" para todo el mundo — es decir, el requisito 4 funciona pero con
   la geometría genérica en vez de la del modo elegido.

---

## 7. Ficheros

**Nuevos**

- `src/lib/itinerary-prompt.ts` — constructor del prompt, función pura
- `src/lib/place-verification.ts` — cruce con Google Places
- `scripts/generate-test-itinerary.ts` — banco de pruebas
- `scripts/register-alias.mjs`, `scripts/alias-hooks.mjs` — resolutor del alias `@/` para
  ejecutar módulos de `src/` con node a secas, sin dependencias nuevas
- `scripts/scenarios/*.json` — los dos escenarios de prueba
- `scripts/output/*` — prompts renderizados e itinerarios de prueba

**Modificados**

- `src/lib/itinerary.functions.ts` — usa el constructor extraído; verifica antes de guardar
- `src/lib/itinerary-edit.functions.ts` — vuelve a verificar tras editar
- `src/lib/itinerary-shared.ts` — tipos de verificación
- `src/lib/share.functions.ts` — la verificación viaja al itinerario público
- `src/routes/_authenticated/my-trip.$tripId.tsx` — sellos, enlaces por `place_id`, nota de IA
- `src/routes/trip.$slug.tsx` — lo mismo en la página compartida
- `src/i18n/locales/{es,en,fr,pt}.json` — 7 cadenas nuevas por idioma
