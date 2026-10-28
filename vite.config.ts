import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API = process.env.API_URL ?? 'http://localhost:8787'

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 5173,
    // One origin in development too: the app calls /api and never needs CORS.
    proxy: {
      '/api': {
        target: API,
        configure: (proxy) => {
          // The counsellor streams; SSE must not be buffered.
          proxy.on('proxyRes', (proxyRes) => {
            if (proxyRes.headers['content-type']?.includes('text/event-stream')) {
              proxyRes.headers['cache-control'] = 'no-cache, no-transform'
            }
          })
        },
      },
    },
  },
})
