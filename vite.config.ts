import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      base: '/admin/',
      manifest: {
        name: 'GoFolyX Admin',
        short_name: 'GFX Admin',
        description: "Panel d'administration GoFolyX",
        start_url: '/admin/',
        scope: '/admin/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0d0118',
        theme_color: '#7B3FF2',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
      },
    }),
  ],
  base: '/admin/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'https://gofolyx.com',
        changeOrigin: true,
        timeout: 7200000,
        proxyTimeout: 7200000,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            console.error('[proxy error]', err.message)
            if (!res.headersSent) {
              (res as import('http').ServerResponse).writeHead(502)
              res.end('Proxy error: ' + err.message)
            }
          })
        },
      },
    },
  },
})
