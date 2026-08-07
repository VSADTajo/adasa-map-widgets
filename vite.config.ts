import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

/**
 * Configuración de build de la librería (modo "lib").
 * Genera ESM + CJS tree-shakeable junto a las declaraciones de tipos.
 * Para desarrollo interactivo usa `vite.config.playground.ts` (`npm run dev`).
 */
export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: './tsconfig.build.json',
      include: [
        'src/index.ts',
        'src/components/**/*.vue',
        'src/components/**/*.ts',
        'src/types/**/*.ts',
        'src/composables/**/*.ts',
      ],
      exclude: ['src/playground/**/*'],
      rollupTypes: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'AdasaMapWidgets',
      fileName: (format) => (format === 'es' ? 'adasa-map-widgets.js' : 'adasa-map-widgets.cjs'),
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // `leaflet` y `maplibre-gl` son peerDependencies opcionales (ver ASMap.vue):
      // deben quedar como import() externos en tiempo de ejecución, nunca
      // empaquetados dentro de esta librería.
      external: (id) => id === 'vue' || id.startsWith('leaflet') || id.startsWith('maplibre-gl'),
      output: {
        globals: { vue: 'Vue' },
        exports: 'named',
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
    emptyOutDir: true,
  },
})
