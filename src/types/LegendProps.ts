import type { LayerConfig } from './layers'
import type { TimeControlsTheme } from './TimelineProps'

/** Esquina del contenedor (normalmente un mapa) donde se ancla la leyenda. */
export type LegendPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

/**
 * Props de `ASMapLegend`.
 *
 * Componente **controlado** y agnóstico del motor de mapas: no inspecciona
 * el mapa ni sus capas ya renderizadas, recibe `layers` como prop — el mismo
 * array que ya tienes en la prop `layers` de `ASMap` — y genera la leyenda
 * de cada una con su adapter correspondiente (`generateLegend`, ver
 * `src/legend/`). Las capas sin leyenda generable (p. ej. Tiles/WMTS, o un
 * COG sin `colorScale`) simplemente no aparecen: no se rellenan con un
 * símbolo inventado.
 */
export interface LegendProps {
  /** Capas de las que mostrar leyenda. */
  layers: LayerConfig[]
  /** Título del panel. @default 'Leyenda' */
  title?: string
  /** Si es `true`, un botón en la cabecera colapsa/expande el panel. @default true */
  collapsible?: boolean
  /** Esquina donde se ancla. @default 'bottom-right' */
  position?: LegendPosition
  /**
   * Distancia entre el widget y los bordes del contenedor. Un `number` se
   * interpreta en píxeles; un `string` se usa tal cual. @default 20
   */
  offset?: string | number
  /** Tema visual. @default 'dark' */
  theme?: TimeControlsTheme
}
