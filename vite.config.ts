import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the app from /<repo>/; local dev serves from /.
const base = process.env.GITHUB_PAGES ? '/musician/' : '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'capture-worklet.js'],
      manifest: {
        name: 'Musician',
        short_name: 'Musician',
        description: "Learn music from real songs and your own voice: find a song's key, scale, and chord loops, then sing its scale and time your runs.",
        theme_color: '#131a2e',
        background_color: '#f6f7f9',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        categories: ['music', 'education'],
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/is\d+-ssl\.mzstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'artwork', expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 60 } },
          },
        ],
      },
    }),
  ],
  worker: {
    format: 'es',
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
