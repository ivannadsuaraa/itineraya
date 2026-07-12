import { existsSync, readFileSync } from "node:fs";
import { cp, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

const require = createRequire(import.meta.url);

export default defineConfig(async ({ command }) => {
  const plugins = [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
    }),
  ];

  if (command === "build") {
    const { nitro } = await import("nitro/vite");
    // Let Nitro auto-detect the platform (Vercel, Netlify, etc.) from its own
    // env vars; only force Cloudflare Workers when nothing else is detected.
    const preset = process.env.VERCEL
      ? "vercel"
      : process.env.NETLIFY
        ? "netlify"
        : "cloudflare-module";

    // ── @resvg/resvg-js (usado por /api/og/$slug) ──
    // Es un módulo nativo: su binario .node no es JS válido. Nitro/nf3
    // reconoce el paquete base como externalizable vía `traceDeps`, pero:
    //  1) Los binarios reales viven en paquetes npm HERMANOS con nombre
    //     propio (@resvg/resvg-js-linux-x64-gnu, ...-musl, ...-win32-x64-msvc,
    //     etc. — optionalDependencies de @resvg/resvg-js, no subrutas suyas),
    //     y el matching interno de nf3 no los reconocía de forma fiable: el
    //     build en Vercel fallaba con "[nitro:externals]
    //     ...resvgjs.linux-x64-musl.node: Unexpected character" porque
    //     Rollup intentaba parsear el binario como si fuera JS.
    //  2) Externalizar por nuestra cuenta implica que ya no pasa por el
    //     tracer de Nitro, que es quien copia los paquetes externalizados al
    //     output — sin ese paso el require() falla en runtime con
    //     MODULE_NOT_FOUND.
    // Solución: un plugin de Rollup propio, inyectado vía el hook oficial
    // `rollup:before` justo antes de que Nitro invoque Rollup para el
    // bundle de servidor, que externaliza cualquier id que contenga
    // "resvg-js" usando resolución real de Rollup (evita los problemas de
    // matching por regex/separadores de ruta de nf3). Y en `compiled`
    // copiamos a mano los paquetes de plataforma presentes en node_modules
    // (npm solo instala el que coincide con el SO/arch de la máquina de
    // build: en Vercel será el de Linux) al directorio de salida del
    // servidor.
    const resvgPkgPath = require.resolve("@resvg/resvg-js/package.json");
    const resvgDir = dirname(resvgPkgPath);
    const { optionalDependencies } = JSON.parse(readFileSync(resvgPkgPath, "utf8")) as {
      optionalDependencies?: Record<string, string>;
    };
    const resvgPlatformPkgs = Object.keys(optionalDependencies ?? {}).map((p) =>
      p.replace("@resvg/", ""),
    );

    plugins.push(
      nitro({
        preset,
        hooks: {
          "rollup:before": (_nitro, rollupConfig) => {
            rollupConfig.plugins = [
              {
                name: "resvg-js-external",
                resolveId: {
                  order: "pre",
                  async handler(id, importer, opts) {
                    if (!id.includes("resvg-js")) return null;
                    const resolved = await this.resolve(id, importer, { ...opts, skipSelf: true });
                    if (!resolved) return null;
                    return { id: resolved.id, external: true };
                  },
                },
              },
              ...((rollupConfig.plugins as unknown[]) ?? []),
            ] as typeof rollupConfig.plugins;
          },
          async compiled(nitroInstance) {
            const destBase = join(nitroInstance.options.output.serverDir, "node_modules", "@resvg");
            await mkdir(destBase, { recursive: true });
            for (const name of ["resvg-js", ...resvgPlatformPkgs]) {
              const src = name === "resvg-js" ? resvgDir : join(dirname(resvgDir), name);
              if (!existsSync(src)) continue; // paquete opcional no instalado en esta plataforma
              await cp(src, join(destBase, name), { recursive: true });
            }
          },
        },
      }),
    );
  }

  plugins.push(viteReact());

  return {
    plugins,
    // Mantiene @resvg/resvg-js fuera del bundle SSR de Vite en dev/preview.
    ssr: { external: ["@resvg/resvg-js"] },
  };
});
