import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ['atc.yinheshitong.com'],
    proxy: {
      '/v1beta': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
      },
      '/v1': {
        target: 'https://api.openai.com',
        changeOrigin: true,
      }
    }
  }
})
