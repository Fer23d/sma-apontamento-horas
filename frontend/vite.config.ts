import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/sma-apontamento-horas/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      manifest: {
        name: 'SM&A Horas',
        short_name: 'SM&A Horas',
        description: 'Sistema corporativo de apontamento e banco de horas da SM&A.',
        start_url: './colaborador',
        display: 'standalone',
        theme_color: '#0A161E',
        background_color: '#0A161E',
        lang: 'pt-BR',
        icons: [
          { src: './favicon.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: './favicon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
})
