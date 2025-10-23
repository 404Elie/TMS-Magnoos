import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Dev-only Replit helpers
const isProd = process.env.NODE_ENV === "production";
const isReplit = process.env.REPL_ID !== undefined;

export default defineConfig({
  // IMPORTANT for GitHub Pages: set to "/<repo-name>/"
  // If you later rename/move the repo, update this accordingly.
  base: "/TMS-Magnoos/",

  plugins: [
    react(),
    // Show the runtime error overlay only when developing (not on Pages)
    ...(!isProd ? [ (await import("@replit/vite-plugin-runtime-error-modal")).default() ] : []),
    // Replit cartographer only in Replit + dev
    ...(!isProd && isReplit
      ? [ (await import("@replit/vite-plugin-cartographer")).then((m) => m.cartographer()) ]
      : []),
  ],

  // Your current aliases preserved
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },

  // Keep the same project layout: root in client/, output to dist/public
  root: path.resolve(import.meta.dirname, "client"),

  build: {
    // This matches what you already had (server serves from dist/public)
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },

  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
