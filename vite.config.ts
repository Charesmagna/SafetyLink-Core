import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  css: { postcss: "./postcss.config.cjs" },
  plugins: [
    react(),
    {
      name: 'add-cfasync-false',
      enforce: 'post',
      transformIndexHtml: {
        order: 'post',
        handler(html: string) {
          return html.replace(/<script (?!data-cfasync="false")/g, '<script data-cfasync="false" ');
        }
      },
      closeBundle() {
        import('fs').then(fs => {
          import('path').then(path => {
            const indexPath = path.resolve(process.cwd(), 'dist/index.html');
            if (fs.existsSync(indexPath)) {
              let html = fs.readFileSync(indexPath, 'utf-8');
              html = html.replace(/<script (?!data-cfasync="false")/g, '<script data-cfasync="false" ');
              fs.writeFileSync(indexPath, html);
            }
          });
        });
      }
    },
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
      },
      manifest: {
        name: 'SafetyLink Core',
        short_name: 'SafetyLink',
        description: 'SafetyLink Secure Emergency Alert Platform',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'zustand'],
          maps: ['react-leaflet', 'leaflet', '@vis.gl/react-google-maps'],
          icons: ['lucide-react'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
});
