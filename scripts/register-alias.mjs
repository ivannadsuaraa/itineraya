// Resolutor mínimo del alias "@/" para ejecutar módulos de src/ con node a
// secas, sin bundler ni dependencias nuevas.
//
// Node 22 ya sabe quitar los tipos de un .ts (--experimental-strip-types), pero
// no sabe nada del alias "@/…" de tsconfig ni resuelve extensiones implícitas.
// Este hook cubre esas dos cosas y nada más: es lo justo para que
// scripts/generate-test-itinerary.ts pueda importar el MISMO
// src/lib/itinerary-prompt.ts que usa producción, en vez de una copia que se
// quedaría desincronizada al primer cambio del prompt.
//
// Uso:
//   node --experimental-strip-types --import ./scripts/register-alias.mjs script.ts

import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./alias-hooks.mjs", pathToFileURL(import.meta.filename));
