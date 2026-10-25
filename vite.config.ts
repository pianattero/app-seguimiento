/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Rutas relativas para que funcione en cualquier alojamiento estático (también en una subcarpeta).
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['fake-indexeddb/auto'],
  },
})
