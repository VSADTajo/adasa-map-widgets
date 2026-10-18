/**
 * Resuelve el valor real de un módulo cargado con `import()` dinámico, tanto
 * si expone su API como `export default` (p. ej. Leaflet) como si la expone
 * directamente en el propio namespace del módulo. Se usa al integrar
 * librerías de mapas opcionales (`leaflet`, `maplibre-gl`) sin depender de
 * cómo empaqueten exactamente su punto de entrada.
 */
export function resolveNamespace<T>(mod: object): T {
  return ((mod as { default?: T }).default ?? mod) as T
}
