import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: () => 'everything.js',
      }
    }
  },

  server: {
    port: 3000,
    open: true
  },

  preview: {
    port: 4173,
    open: true
  }
})