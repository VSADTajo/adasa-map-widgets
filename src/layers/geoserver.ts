import type { GeoServerOptions, LayerConfig } from '@/types/layers'

/**
 * GeoServer no es un protocolo de capas distinto: un layer de GeoServer
 * siempre se sirve como WMS o WFS. Este helper construye el `LayerConfig`
 * correspondiente (`type: 'wms'` o `'wfs'` según `options.mode`, con la URL y
 * el nombre `workspace:layer` ya resueltos) para no tener que concatenarlos
 * a mano cada vez que se usa un servidor GeoServer.
 *
 * @example
 * ```ts
 * const estadosUSA = geoServerLayer({
 *   id: 'estados-usa',
 *   name: 'Estados de EE. UU.',
 *   visible: true,
 *   options: { url: 'https://ahocevar.com/geoserver', workspace: 'topp', layer: 'states', mode: 'wfs' },
 * })
 * // estadosUSA.type === 'wfs'
 * // estadosUSA.options === { url: '.../geoserver/wfs', typeName: 'topp:states', cql_filter: undefined, editable: undefined }
 * ```
 */
export function geoServerLayer(
  config: Omit<LayerConfig, 'type' | 'options'> & { options: GeoServerOptions },
): LayerConfig {
  const { options } = config

  if (options.mode === 'wms') {
    return {
      ...config,
      type: 'wms',
      options: {
        url: `${options.url}/wms`,
        layers: `${options.workspace}:${options.layer}`,
        style: options.style,
      },
    }
  }

  return {
    ...config,
    type: 'wfs',
    options: {
      url: `${options.url}/wfs`,
      typeName: `${options.workspace}:${options.layer}`,
      cql_filter: options.filter,
      editable: options.editable,
    },
  }
}
