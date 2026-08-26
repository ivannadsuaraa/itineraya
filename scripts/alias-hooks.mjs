// Hook de resolución: "@/loquesea" → <repo>/src/loquesea(.ts|.tsx|/index.ts).
// Ver scripts/register-alias.mjs para el porqué.

import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src");

const CANDIDATE_SUFFIXES = ["", ".ts", ".tsx", ".js", "/index.ts", "/index.tsx"];

function resolveFromSrc(specifier) {
  const base = path.join(SRC, specifier.slice(2));
  for (const suffix of CANDIDATE_SUFFIXES) {
    const candidate = base + suffix;
    if (existsSync(candidate)) return pathToFileURL(candidate).href;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const url = resolveFromSrc(specifier);
    // Sin `format`: dejamos que Node lo deduzca de la extensión. Forzar
    // "module" saltaría el borrado de tipos y un .ts explotaría en el primer
    // `export type`.
    if (url) return { url, shortCircuit: true };
    throw new Error(`No se pudo resolver el alias "${specifier}" bajo ${SRC}`);
  }
  return nextResolve(specifier, context);
}
