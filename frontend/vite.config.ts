// frontend/vite.config.ts — Vite config for the public frontend
// Notes: dev server runs on port 5173; production builds are served from Vercel
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
})
