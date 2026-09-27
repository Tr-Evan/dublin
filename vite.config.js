import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: false,
      includeAssets: ["icons/dublin-mark.svg", "icons/apple-touch-icon.png", "manifest.json"],
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,svg,ico,png,jpg,jpeg,webp,json,woff,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\//,
            handler: "CacheFirst",
            options: {
              cacheName: "dublin-openstreetmap-tiles",
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/(?:place-covers|family-updates)\//,
            handler: "CacheFirst",
            options: {
              cacheName: "dublin-public-storage",
              expiration: { maxEntries: 160, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/v1\/forecast/,
            handler: "NetworkFirst",
            options: {
              cacheName: "dublin-live-weather",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/leaflet") || id.includes("node_modules/react-leaflet")) return "maps";
          if (id.includes("node_modules/framer-motion/") || id.includes("node_modules/motion-dom/") || id.includes("node_modules/motion-utils/")) return "animations";
          if (id.includes("node_modules/lucide-react/")) return "icons";
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/react-router/") || id.includes("node_modules/react-router-dom/") || id.includes("node_modules/scheduler/")) return "react-vendor";
        },
      },
    },
  },
});
