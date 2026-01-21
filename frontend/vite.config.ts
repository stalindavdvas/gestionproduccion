import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,

    // 👇 Permite acceder desde ngrok
    allowedHosts: true,

    // 👇 PROXY para FastAPI (CLAVE)
    proxy: {
      '/api': {
        target: 'http://backend:8000', // nombre del servicio docker
        changeOrigin: true,
        secure: false
      }
    },

    watch: {
      usePolling: true
    }
  }
})
