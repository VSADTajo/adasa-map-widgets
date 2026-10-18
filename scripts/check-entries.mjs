/**
 * Guardarraíl de las fronteras entre dominios del build (ver
 * docs/adr/0000-estructura-paquete.md). Ejecutar tras `npm run build`.
 *
 * Para cada entry ESM de `exports` en package.json recorre su grafo de
 * imports en `dist/` (estáticos y `import()` dinámicos) y falla si:
 * - alcanza código de un dominio que no tiene permitido (se lee de los
 *   `sources` del sourcemap de cada archivo: `src/<dominio>/...`), o
 * - importa un paquete externo que no tiene permitido (p. ej. que el entry
 *   raíz llegue a `leaflet`, o que `/map` llegue a `echarts`).
 * Además imprime el tamaño (bruto y gzip) de lo que arrastra cada entry.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'))

/** Paquetes que cualquier entry puede importar: vue y las `dependencies`. */
const ALWAYS_ALLOWED = ['vue', ...Object.keys(pkg.dependencies ?? {})]

/**
 * Reglas por subpath de `exports`. Un subpath nuevo sin regla hace fallar el
 * script, para que nadie añada un dominio sin decidir sus fronteras.
 */
const RULES = {
  '.': { domains: ['core'], packages: [] },
  './map': {
    domains: ['core', 'map'],
    packages: [
      'leaflet',
      'leaflet.vectorgrid',
      'maplibre-gl',
      'georaster',
      'georaster-layer-for-leaflet',
      '@geomatico/maplibre-cog-protocol',
      'topojson-client',
      '@tmcw/togeojson',
      'fflate',
    ],
  },
}

const IMPORT_RE = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)["']([^"']+)["']/g

function packageName(specifier) {
  const parts = specifier.split('/')
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

function domainsOf(file) {
  const mapFile = `${file}.map`
  if (!existsSync(mapFile)) return new Set()
  const { sources = [] } = JSON.parse(readFileSync(mapFile, 'utf-8'))
  return new Set(
    sources
      .map((source) => /(?:^|\/)src\/([^/]+)\//.exec(source.replaceAll('\\', '/'))?.[1])
      .filter(Boolean),
  )
}

function walk(entryFile) {
  const files = new Set()
  const packages = new Set()
  const pending = [entryFile]
  while (pending.length) {
    const file = pending.pop()
    if (files.has(file)) continue
    files.add(file)
    for (const [, specifier] of readFileSync(file, 'utf-8').matchAll(IMPORT_RE)) {
      if (specifier.startsWith('.')) pending.push(resolve(dirname(file), specifier))
      else packages.add(packageName(specifier))
    }
  }
  return { files, packages }
}

const errors = []
for (const [subpath, target] of Object.entries(pkg.exports)) {
  if (typeof target === 'string') continue // style.css
  const rule = RULES[subpath]
  if (!rule) {
    errors.push(`"${subpath}" no tiene regla en scripts/check-entries.mjs`)
    continue
  }
  const entryFile = resolve(root, target.import)
  if (!existsSync(entryFile)) {
    errors.push(`"${subpath}": no existe ${target.import} (¿falta npm run build?)`)
    continue
  }

  const { files, packages } = walk(entryFile)
  let raw = 0
  let gzip = 0
  for (const file of files) {
    const content = readFileSync(file)
    raw += content.length
    gzip += gzipSync(content).length
    for (const domain of domainsOf(file)) {
      if (!rule.domains.includes(domain)) {
        errors.push(`"${subpath}" alcanza el dominio "${domain}" (${relative(root, file)})`)
      }
    }
  }
  for (const name of packages) {
    if (!ALWAYS_ALLOWED.includes(name) && !rule.packages.includes(name)) {
      errors.push(`"${subpath}" importa el paquete "${name}", que no tiene permitido`)
    }
  }

  const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`
  console.log(
    `${subpath.padEnd(8)} ${String(files.size).padStart(2)} archivos  ${kb(raw).padStart(9)}  (gzip ${kb(gzip)})  externos: ${[...packages].sort().join(', ') || '—'}`,
  )
}

if (errors.length) {
  console.error(`\n✗ Fronteras entre dominios rotas:\n  - ${errors.join('\n  - ')}`)
  process.exit(1)
}
console.log('\n✓ Cada entry solo alcanza sus dominios y paquetes permitidos.')
