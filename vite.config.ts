import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serveert de site onder /dagdosis/. Op een eigen domein of
// Render: BASE_PATH=/ npm run build
const base = process.env.BASE_PATH ?? '/dagdosis/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Dagdosis',
        short_name: 'Dagdosis',
        description: 'Elke dag 5 vragen om je kennis als apotheker op peil te houden.',
        lang: 'nl',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        background_color: '#F4F5F0',
        theme_color: '#0E5A4F',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
    }),
  ],
})
