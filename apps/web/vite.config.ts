import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const server = process.env.VITE_SERVER_URL ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 3000,
    proxy: {
      '/socket.io': { target: server, ws: true, changeOrigin: true },
      '/api': { target: server, changeOrigin: true },
    },
  },
  build: { chunkSizeWarningLimit: 4000 },
})
