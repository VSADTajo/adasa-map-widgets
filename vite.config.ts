import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

/**
 * Lo que nunca se empaqueta dentro de la librería: `vue`, las
 * `dependencies` (las instala el proyecto consumidor junto al paquete) y
 * las `peerDependencies` (mapas, gráficas...: opcionales, ver ADR 0000).
 * Se deriva de package.json para que añadir una peer baste para excluirla.
 */
const externalPackages = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
]

function isExternal(id: string): boolean {
  return externalPackages.some((dep) => id === dep || id.startsWith(`${dep}/`))
}

/**
 * Un entry por dominio (ver docs/adr/0000-estructura-paquete.md). Al añadir
 * uno, declara también su subpath en `exports` y `typesVersions` de package.json.
 */
const entries = {
  index: 'src/index.ts',
  map: 'src/map/index.ts',
}

/**
 * Configuración de build de la librería (modo "lib", multi-entry).
 * Genera ESM + CJS por entry, con el código compartido en chunks, y un
 * `.d.ts` por entry. Para desarrollo interactivo usa `vite.config.playground.ts`.
 */
export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: './tsconfig.build.json',
      include: ['src/index.ts', 'src/core/**/*', 'src/map/**/*'],
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
      entry: Object.fromEntries(
        Object.entries(entries).map(([name, path]) => [
          name,
          fileURLToPath(new URL(`./${path}`, import.meta.url)),
        ]),
      ),
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: isExternal,
      // Un output por formato para que los chunks CJS terminen en `.cjs`: el
      // paquete es `"type": "module"` y un `.js` se cargaría como ESM.
      output: (['es', 'cjs'] as const).map((format) => ({
        format,
        exports: 'named' as const,
        chunkFileNames: `chunks/[name]-[hash].${format === 'es' ? 'js' : 'cjs'}`,
        // `core` lo comparten todos los entries: un chunk con nombre estable.
        manualChunks: (id: string) => (id.includes('/src/core/') ? 'core' : undefined),
      })),
    },
    // Un único dist/style.css con el CSS de todos los dominios (ADR 0000).
    cssCodeSplit: false,
    sourcemap: true,
    emptyOutDir: true,
  },
})
