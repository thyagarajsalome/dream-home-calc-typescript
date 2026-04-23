import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Removed 'base: "/"' as it is the default for root domain hosting on Firebase
  server: {
    port: 3000, 
    strictPort: true, 
  }
})