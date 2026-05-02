import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      // Тестовая копия из frontend-test (npm run dev:frontend-test, порт 5174): один origin без Docker
      '/test': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        ws: true
      }
    }
  }
})
