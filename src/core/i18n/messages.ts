/**
 * Textos de interfaz de la librería. Las claves son planas
 * (`'<componente>.<texto>'`) y admiten parámetros `{nombre}`.
 *
 * El español es la referencia: define todas las claves, y cualquier clave
 * que falte en otro idioma cae al español.
 */
export const es = {
  'map.loadErrorLeaflet':
    'No se pudo cargar Leaflet. Instala la dependencia opcional: npm i leaflet',
  'map.loadErrorMaplibre':
    'No se pudo cargar MapLibre GL JS. Instala la dependencia opcional: npm i maplibre-gl',

  'time.previous': 'Instante anterior',
  'time.next': 'Siguiente instante',
  'time.play': 'Reproducir',
  'time.pause': 'Pausar',
  'time.position': 'Posición en la línea de tiempo',

  'timeRange.start': 'Inicio del rango',
  'timeRange.end': 'Fin del rango',
  'timeRange.startBack': 'Retroceder inicio del rango',
  'timeRange.startForward': 'Avanzar inicio del rango',
  'timeRange.endBack': 'Retroceder fin del rango',
  'timeRange.endForward': 'Avanzar fin del rango',
  'timeRange.startBackShort': 'Inicio -1',
  'timeRange.startForwardShort': 'Inicio +1',
  'timeRange.endBackShort': 'Fin -1',
  'timeRange.endForwardShort': 'Fin +1',

  'dayInterval.title': 'Avisos',
  'dayInterval.today': 'Hoy',
  'dayInterval.tomorrow': 'Mañana',
  'dayInterval.dayAfterTomorrow': 'Pasado mañana',
  'dayInterval.intervalLabel': '{day}, {hours}h',
  'dayInterval.level': 'nivel {level}',
  'dayInterval.selected': 'seleccionado',

  'legend.title': 'Leyenda',
  'legend.expand': 'Expandir leyenda',
  'legend.collapse': 'Colapsar leyenda',
  'legend.empty': 'Sin leyenda disponible.',

  'basemaps.current': 'Basemap: {name}. Cambiar basemap',
  'basemaps.none': 'ninguno',
  'basemaps.list': 'Basemaps disponibles',

  'chart.now': 'Ahora',
  'chart.resetZoom': 'Restablecer zoom',
  'chart.empty': 'Sin datos',
  'chart.loading': 'Cargando…',
  'chart.loadError':
    'No se pudo cargar {library}. Instala la dependencia opcional: npm i {packages}',
  'chart.ariaLabel': 'Gráfica: {series}',

  'hydrograph.discharge': 'Caudal',
  'hydrograph.level': 'Nivel',
  'hydrograph.precipitation': 'Precipitación',
  'hydrograph.observed': 'Observado',
  'hydrograph.forecast': 'Previsto',
  'hydrograph.band': '{source} {range}',
  'hydrograph.threshold': 'Umbral {level}',
} as const

/** Clave de un texto de la librería. */
export type MessageKey = keyof typeof es

/** Textos de un idioma. */
export type Messages = Record<MessageKey, string>

export const en: Messages = {
  'map.loadErrorLeaflet':
    'Leaflet could not be loaded. Install the optional dependency: npm i leaflet',
  'map.loadErrorMaplibre':
    'MapLibre GL JS could not be loaded. Install the optional dependency: npm i maplibre-gl',

  'time.previous': 'Previous step',
  'time.next': 'Next step',
  'time.play': 'Play',
  'time.pause': 'Pause',
  'time.position': 'Position in the timeline',

  'timeRange.start': 'Range start',
  'timeRange.end': 'Range end',
  'timeRange.startBack': 'Move range start back',
  'timeRange.startForward': 'Move range start forward',
  'timeRange.endBack': 'Move range end back',
  'timeRange.endForward': 'Move range end forward',
  'timeRange.startBackShort': 'Start -1',
  'timeRange.startForwardShort': 'Start +1',
  'timeRange.endBackShort': 'End -1',
  'timeRange.endForwardShort': 'End +1',

  'dayInterval.title': 'Warnings',
  'dayInterval.today': 'Today',
  'dayInterval.tomorrow': 'Tomorrow',
  'dayInterval.dayAfterTomorrow': 'Day after tomorrow',
  'dayInterval.intervalLabel': '{day}, {hours}h',
  'dayInterval.level': 'level {level}',
  'dayInterval.selected': 'selected',

  'legend.title': 'Legend',
  'legend.expand': 'Expand legend',
  'legend.collapse': 'Collapse legend',
  'legend.empty': 'No legend available.',

  'basemaps.current': 'Basemap: {name}. Change basemap',
  'basemaps.none': 'none',
  'basemaps.list': 'Available basemaps',

  'chart.now': 'Now',
  'chart.resetZoom': 'Reset zoom',
  'chart.empty': 'No data',
  'chart.loading': 'Loading…',
  'chart.loadError':
    '{library} could not be loaded. Install the optional dependency: npm i {packages}',
  'chart.ariaLabel': 'Chart: {series}',

  'hydrograph.discharge': 'Discharge',
  'hydrograph.level': 'Level',
  'hydrograph.precipitation': 'Precipitation',
  'hydrograph.observed': 'Observed',
  'hydrograph.forecast': 'Forecast',
  'hydrograph.band': '{source} {range}',
  'hydrograph.threshold': 'Threshold {level}',
}
