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
  'chart.download': 'Descargar',
  'chart.downloadPng': 'Descargar imagen PNG',
  'chart.downloadSvg': 'Descargar imagen SVG',
  'chart.downloadCsv': 'Descargar datos CSV',
  'chart.fullscreen': 'Pantalla completa',
  'chart.exitFullscreen': 'Salir de pantalla completa',
  'chart.toolbar': 'Herramientas de la gráfica',
  'chart.fileName': 'grafica',
  'chart.empty': 'Sin datos',
  'chart.loading': 'Cargando…',
  'chart.loadError':
    'No se pudo cargar {library}. Instala la dependencia opcional: npm i {packages}',
  'chart.ariaLabel': 'Gráfica de {types}: {series}',
  'chart.typeLine': 'líneas',
  'chart.typeArea': 'áreas',
  'chart.typeBar': 'barras',
  'chart.typeRange': 'bandas',
  'chart.typeScatter': 'puntos',
  'chart.describeX': 'Valores desde {from} hasta {to}.',
  'chart.describeSeries': '{name}: mínimo {min}, máximo {max} ({at}).',
  'chart.describeRange': '{name}: entre {min} y {max}.',
  'chart.describeThreshold': 'Referencia «{label}» en {value}.',
  'chart.noValues': 'sin datos',
  'chart.plotArea': 'Área de datos',
  'chart.keyboardHelp':
    'Usa las flechas izquierda y derecha para recorrer los valores, Inicio y Fin para ir al primero y al último, e Intro para seleccionar ese instante.',
  'chart.dataTable': 'Datos: {label}',
  'chart.dataTruncated': 'Se muestran {shown} de {total} filas. Descarga el CSV para verlas todas.',
  'chart.dataTime': 'Fecha y hora',
  'chart.dataX': 'X',
  'chart.dataLower': '{name}, inferior',
  'chart.dataUpper': '{name}, superior',

  'layout.sections': 'Secciones',
  'layout.menu': 'Menú',
  'layout.closePanel': 'Cerrar panel',
  'layout.detail': 'Detalle',
  'layout.closeDetail': 'Cerrar detalle',
  'layout.search': 'Buscar',
  'layout.closeSearch': 'Cerrar búsqueda',
  'layout.expandSheet': 'Ampliar panel',
  'layout.collapseSheet': 'Reducir panel',

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
  'chart.download': 'Download',
  'chart.downloadPng': 'Download PNG image',
  'chart.downloadSvg': 'Download SVG image',
  'chart.downloadCsv': 'Download CSV data',
  'chart.fullscreen': 'Full screen',
  'chart.exitFullscreen': 'Exit full screen',
  'chart.toolbar': 'Chart tools',
  'chart.fileName': 'chart',
  'chart.empty': 'No data',
  'chart.loading': 'Loading…',
  'chart.loadError':
    '{library} could not be loaded. Install the optional dependency: npm i {packages}',
  'chart.ariaLabel': '{types} chart: {series}',
  'chart.typeLine': 'line',
  'chart.typeArea': 'area',
  'chart.typeBar': 'bar',
  'chart.typeRange': 'band',
  'chart.typeScatter': 'scatter',
  'chart.describeX': 'Values from {from} to {to}.',
  'chart.describeSeries': '{name}: minimum {min}, maximum {max} ({at}).',
  'chart.describeRange': '{name}: between {min} and {max}.',
  'chart.describeThreshold': 'Reference "{label}" at {value}.',
  'chart.noValues': 'no data',
  'chart.plotArea': 'Data area',
  'chart.keyboardHelp':
    'Use the left and right arrows to move through the values, Home and End to go to the first and last, and Enter to select that time.',
  'chart.dataTable': 'Data: {label}',
  'chart.dataTruncated': 'Showing {shown} of {total} rows. Download the CSV to see them all.',
  'chart.dataTime': 'Date and time',
  'chart.dataX': 'X',
  'chart.dataLower': '{name}, lower',
  'chart.dataUpper': '{name}, upper',

  'layout.sections': 'Sections',
  'layout.menu': 'Menu',
  'layout.closePanel': 'Close panel',
  'layout.detail': 'Details',
  'layout.closeDetail': 'Close details',
  'layout.search': 'Search',
  'layout.closeSearch': 'Close search',
  'layout.expandSheet': 'Expand panel',
  'layout.collapseSheet': 'Collapse panel',

  'hydrograph.discharge': 'Discharge',
  'hydrograph.level': 'Level',
  'hydrograph.precipitation': 'Precipitation',
  'hydrograph.observed': 'Observed',
  'hydrograph.forecast': 'Forecast',
  'hydrograph.band': '{source} {range}',
  'hydrograph.threshold': 'Threshold {level}',
}
