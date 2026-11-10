/**
 * Props de `ASCollapsible`: una sección con cabecera que se pliega y despliega.
 *
 * @example
 * ```vue
 * <ASCollapsible title="Estaciones" :badge="activas.length">
 *   <ASTreeList v-model="activas" :items="estaciones" label="Capas de estaciones" />
 * </ASCollapsible>
 * ```
 */
export interface CollapsibleProps {
  /** Título de la cabecera (y nombre accesible de la sección). */
  title: string
  /**
   * Abierta (`v-model:open`). Sin él, la sección guarda su propio estado,
   * que empieza en `defaultOpen`.
   */
  open?: boolean
  /**
   * Estado inicial cuando no se controla con `open`.
   * @default true
   */
  defaultOpen?: boolean
  /** Contador junto al título (p. ej. capas activas). `0` o vacío no se muestra. */
  badge?: number | string
  /**
   * Nivel del encabezado que envuelve al botón (`<h3>`...), para que la
   * sección entre en el esquema de la página.
   * @default 3
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  /**
   * Sin borde ni fondo: para apilar varias dentro de un panel.
   * @default false
   */
  flat?: boolean
  /** Deshabilitada: no se puede abrir ni cerrar. */
  disabled?: boolean
  /** Id del contenido (para `aria-controls`). Si no se pasa, se genera uno. */
  id?: string
  /**
   * Tema. Sin prop, el de `provideTheme`; si tampoco hay, el del contenedor.
   */
  theme?: 'light' | 'dark'
}

/** Eventos de `ASCollapsible`. */
export interface CollapsibleEmits {
  /** Se abrió o se cerró (para `v-model:open`). */
  'update:open': [open: boolean]
}
