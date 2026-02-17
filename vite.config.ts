// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    chunkSizeWarningLimit: 1000, // Increases limit to 1000 kB to hide the warning
  }
})