import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

/**
 * Tests unitarios y de componente (`npm run test`). Los tests van co-locados
 * junto al código que prueban (`X.spec.ts` al lado de `X.ts`/`X.vue`, ver
 * CLAUDE.md). No reutiliza `vite.config.ts` porque ese arrastra el modo
 * librería y vite-plugin-dts, que no pintan nada al testear.
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    // Sin globals: cada test importa `describe`/`it`/`expect` de 'vitest', así
    // los tipos salen del import y no hace falta declarar nada en tsconfig.
    globals: false,
    coverage: {
      provider: 'v8',
      include: ['src/core/**', 'src/map/**'],
      exclude: ['**/*.spec.ts', '**/*.d.ts', '**/index.ts', '**/types/**'],
      reporter: ['text-summary', 'html'],
      reportsDirectory: 'coverage',
    },
  },
})
