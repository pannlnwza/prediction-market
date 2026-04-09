import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/auth': 'http://localhost:3000',
      '/api/markets': 'http://localhost:3001',
      '/api/users': 'http://localhost:3001',
      '/api/orders': 'http://localhost:3002',
      '/api/portfolio': 'http://localhost:3002',
      '/api/wallet': 'http://localhost:3003',
      '/api/resolutions': 'http://localhost:3004',
      '/api/notifications': 'http://localhost:3005',
      '/socket.io': {
        target: 'http://localhost:3005',
        ws: true,
      },
    },
  },
})
