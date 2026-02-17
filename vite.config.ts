// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: "/", 
  server: {
    port: 3000, // Change this to any available port
    strictPort: true, // If true, Vite will exit if the port is already in use
  }
})