import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Short git commit hash, shown in the app header so it's obvious whether a
// deployed build actually matches the latest commit (build-time only — not
// available at runtime any other way in a static, backend-less app).
function gitShortHash(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'dev'
  }
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(gitShortHash()),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32.png', 'logo.png'],
      manifest: {
        id: '/',
        name: 'Os Quase Profissionais',
        short_name: 'Quase Pro',
        description: 'Gerenciador de torneios de Tennis Americano',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        background_color: '#152142',
        theme_color: '#152142',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
      },
    }),
  ],
})
