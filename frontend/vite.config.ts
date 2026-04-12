import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/auth': 'http://localhost:3000',
      '/api/users': 'http://localhost:3001',
      '/api/orders': 'http://localhost:3002',
      '/api/portfolio': 'http://localhost:3002',
      '/api/wallet': 'http://localhost:3003',
      '/api/resolutions': 'http://localhost:3004',
      '/api/notifications': 'http://localhost:3005',
      // Order service routes under /api/markets/
      '^/api/markets/[^/]+/orderbook': 'http://localhost:3002',
      '^/api/markets/[^/]+/trades': 'http://localhost:3002',
      // All other /api/markets routes go to market service
      '/api/markets': 'http://localhost:3001',
      '/socket.io': {
        target: 'http://localhost:3005',
        ws: true,
      },
    },
  },
})
