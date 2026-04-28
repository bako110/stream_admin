import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
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
        target: 'http://178.104.248.78',
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
