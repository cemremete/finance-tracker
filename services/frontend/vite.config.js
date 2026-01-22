import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    proxy: {
      '/api/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/api/transactions': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false
      },
      '/api/budgets': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false
      },
      '/api/subscriptions': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false
      },
      '/api/goals': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false
      },
      '/api/analytics': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
