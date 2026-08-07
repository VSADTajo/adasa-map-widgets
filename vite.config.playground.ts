import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * Configuración para desarrollar (`npm run dev`) y compilar (`npm run build:playground`)
 * la aplicación interactiva que documenta y prueba los widgets en `src/playground`.
 * Importa los componentes directamente desde el código fuente (no desde `dist`),
 * para poder iterar sin reconstruir la librería.
 */
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist-playground',
    emptyOutDir: true,
  },
})
