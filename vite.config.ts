// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // CHANGED: Set base to your repository name for GitHub Pages default URL
  base: "/dream-home-calc-typescript/", 
  server: {
    port: 3000, 
    strictPort: true, 
  }
})