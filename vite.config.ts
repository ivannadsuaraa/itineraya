import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

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
    plugins.push(nitro({ preset }));
  }

  plugins.push(viteReact());

  return {
    plugins,
    // @resvg/resvg-js es un módulo nativo (.node): no debe pasar por Rollup.
    // Solo lo usa la ruta /api/og/$slug en runtime Node (Vercel).
    ssr: { external: ["@resvg/resvg-js"] },
  };
});
