import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const server = process.env.VITE_SERVER_URL ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
  server: {
    port: 3000,
    proxy: {
      '/socket.io': { target: server, ws: true, changeOrigin: true },
      '/api': { target: server, changeOrigin: true },
    },
  },
})
