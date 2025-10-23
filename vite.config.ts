import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const isProd = process.env.NODE_ENV === "production";
const isReplit = process.env.REPL_ID !== undefined;

export default defineConfig(async () => {
  const plugins = [react()];

  if (!isProd) {
    const runtimeErrorOverlay = (await import("@replit/vite-plugin-runtime-error-modal")).default;
    plugins.push(runtimeErrorOverlay());
  }
  if (!isProd && isReplit) {
    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    plugins.push(cartographer());
  }

  return {
    // IMPORTANT for GitHub Pages under /TMS-Magnoos/
    base: "/TMS-Magnoos/",

    plugins,

    // Aliases unchanged
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },

    // Tell Vite that source code is in client/
    root: path.resolve(import.meta.dirname, "client"),

    // Build to dist/public (repo root) so the server/Render can also serve it
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },

    server: {
      fs: { strict: true, deny: ["**/.*"] },
    },
  };
});
