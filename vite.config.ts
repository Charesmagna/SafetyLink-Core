import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const appVersion = process.env.VITE_APP_VERSION || pkg.version || '1.1.0';

export default defineConfig({
  css: { postcss: "./postcss.config.cjs" },
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  },
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.png', 'Polish_20260620_014530309.jpg'],
    manifest: {
      name: 'SafetyLink Core',
      short_name: 'SafetyLink',
      description: 'Multi-layer, offline-first emergency response platform.',
      theme_color: '#020408',
      background_color: '#020408',
      display: 'standalone',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    },
    workbox: {
      skipWaiting: true,
      clientsClaim: true,
      cleanupOutdatedCaches: true,
      globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp}'],
      maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/.*\.basemaps\.cartocdn\.com\/.*/i,
          handler: 'CacheFirst',
          options: { cacheName: 'cartodb-basemaps', expiration: { maxEntries: 500, maxAgeSeconds: 2592000 }, cacheableResponse: { statuses: [0, 200] } }
        },
        {
          urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
          handler: 'CacheFirst',
          options: { cacheName: 'osm-basemaps', expiration: { maxEntries: 500, maxAgeSeconds: 2592000 }, cacheableResponse: { statuses: [0, 200] } }
        }
      ]
    }
  })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild'
  }
});
