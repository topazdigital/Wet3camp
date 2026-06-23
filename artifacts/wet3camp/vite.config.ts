import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 5000;

const basePath = process.env.BASE_PATH ?? "/";

function jsonErrorHandler(proxy: any) {
  proxy.on('error', (_err: Error, _req: any, res: any) => {
    res.writeHead(503, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: 'API server unavailable', code: 'NO_DB' }))
  })
}

export default defineConfig(async ({ mode }) => {
  const isDev = mode !== 'production' && process.env.REPL_ID !== undefined

  const replitPlugins = isDev
    ? [
        runtimeErrorOverlay(),
        await import("@replit/vite-plugin-cartographer").then((m) =>
          m.cartographer({ root: path.resolve(import.meta.dirname, "..") }),
        ),
        await import("@replit/vite-plugin-dev-banner").then((m) =>
          m.devBanner(),
        ),
      ]
    : []

  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss(),
      ...replitPlugins,
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      // Split vendor libraries so the app shell is tiny and browsers cache libs separately
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return
            // Core React ecosystem — scheduler is react-dom's peer; all must share
            // the same chunk to avoid circular dependencies between vendor chunks
            if (
              id.includes('/react-dom/') ||
              id.includes('/node_modules/react/') ||
              id.includes('react/jsx-runtime') ||
              id.includes('react/jsx-dev-runtime') ||
              id.includes('/scheduler/')
            ) return 'vendor-react'
            // Data fetching — changes rarely
            if (id.includes('@tanstack/react-query') || id.includes('@tanstack/query')) return 'vendor-query'
            // Icons — big but static
            if (id.includes('lucide-react')) return 'vendor-icons'
            // Router
            if (id.includes('wouter')) return 'vendor-router'
            // Everything else (zod, date-fns, framer-motion, etc.)
            return 'vendor-misc'
          },
        },
      },
    },
    server: {
      port,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: true,
      },
      proxy: {
        '/sitemap.xml': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          configure: jsonErrorHandler,
        },
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          configure: jsonErrorHandler,
        },
      },
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  }
});
