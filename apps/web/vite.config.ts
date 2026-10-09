import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
const server = process.env.VITE_SERVER_URL ?? 'http://localhost:3001'
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': { target: server, ws: true, changeOrigin: true },
      '/api': { target: server, changeOrigin: true },
    },
  },
  build: { chunkSizeWarningLimit: 4000 },
})
