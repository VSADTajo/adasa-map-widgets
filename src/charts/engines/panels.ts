import type { ResolvedChartSpec } from '@/charts/core/resolveSpec'
import { tooltipRows } from '@/charts/core/tooltip'
import { PATTERN_SIZE, patternDataUrl } from '@/charts/core/patterns'
import { layoutPanels } from './types'

/**
 * Para los motores que no saben repartir varios paneles con ejes a ambos
 * lados en un solo lienzo (Chart.js, ApexCharts): un lienzo por panel,
 * apilados, con alturas según su peso. El último panel recibe además el
 * hueco de las etiquetas del eje X, que solo se muestran en él.
 */
export function panelHeights(
  spec: ResolvedChartSpec,
  totalHeight: number,
  xLabelsSpace: number,
): number[] {
  return layoutPanels(
    spec.panels.map((panel) => panel.fraction),
    totalHeight - xLabelsSpace,
    0,
    0,
  ).map((layout, index, all) => layout.height + (index === all.length - 1 ? xLabelsSpace : 0))
}

/** Crea (o reutiliza) un `<div>` por panel dentro de `element`, con su alto. */
export function panelContainers(element: HTMLElement, heights: number[]): HTMLElement[] {
  const existing = Array.from(element.children).filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement && child.dataset.asPanel !== undefined,
  )
  existing.slice(heights.length).forEach((child) => child.remove())
  return heights.map((height, index) => {
    const container = existing[index] ?? document.createElement('div')
    container.dataset.asPanel = String(index)
    container.style.position = 'relative'
    container.style.height = `${height}px`
    if (!container.parentElement) element.appendChild(container)
    return container
  })
}

/** Elemento flotante para el tooltip HTML propio (mismo contenido en todos los motores). */
export function createTooltipElement(element: HTMLElement, spec: ResolvedChartSpec): HTMLElement {
  const tooltip = document.createElement('div')
  tooltip.dataset.asTooltip = ''
  Object.assign(tooltip.style, {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: '1',
    display: 'none',
    padding: '8px 10px',
    borderRadius: '6px',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
  } satisfies Partial<CSSStyleDeclaration>)
  styleTooltip(tooltip, spec)
  element.appendChild(tooltip)
  return tooltip
}

export function styleTooltip(tooltip: HTMLElement, spec: ResolvedChartSpec): void {
  Object.assign(tooltip.style, {
    background: spec.theme.surface,
    color: spec.theme.text,
    border: `1px solid ${spec.theme.border}`,
    fontFamily: spec.theme.fontFamily,
    fontSize: `${spec.theme.fontSize}px`,
  } satisfies Partial<CSSStyleDeclaration>)
}

/** Coloca el tooltip junto al cursor sin salirse del contenedor. */
export function placeTooltip(
  tooltip: HTMLElement,
  container: HTMLElement,
  x: number,
  y: number,
): void {
  const margin = 12
  const width = tooltip.offsetWidth
  const height = tooltip.offsetHeight
  const left = x + margin + width > container.clientWidth ? x - margin - width : x + margin
  const top = Math.min(Math.max(y - height / 2, 0), Math.max(container.clientHeight - height, 0))
  tooltip.style.left = `${Math.max(left, 0)}px`
  tooltip.style.top = `${top}px`
}

/**
 * Marco de los motores con un lienzo por panel: la leyenda (si hay) y el
 * contenedor de los paneles, colocados según `spec.legend.position`.
 */
export function createFrame(element: HTMLElement): { legend: HTMLElement; host: HTMLElement } {
  element.replaceChildren()
  // Flex desde ya (renderLegend ajusta luego la dirección): si no, el contenedor
  // de los paneles mide 0 de alto al crear el motor, y ECharts avisa de ello.
  Object.assign(element.style, { display: 'flex', flexDirection: 'column' })
  const legend = document.createElement('div')
  legend.dataset.asLegend = ''
  const host = document.createElement('div')
  host.dataset.asPanels = ''
  Object.assign(host.style, {
    position: 'relative',
    flex: '1 1 auto',
    minHeight: '0',
    minWidth: '0',
  })
  element.append(legend, host)
  return { legend, host }
}

/** Trazo de la muestra de una línea en la leyenda (atributo `stroke-dasharray`). */
const LEGEND_DASH = {
  solid: '',
  dashed: '4 3',
  dotted: '1.5 2.5',
  dashdot: '5 2.5 1.5 2.5',
} as const

function legendMarker(series: ResolvedChartSpec['series'][number]): string {
  if (series.type === 'line' || series.type === 'scatter') {
    const dash = LEGEND_DASH[series.lineStyle]
    return `<svg width="18" height="10" aria-hidden="true"><line x1="1" y1="5" x2="17" y2="5" stroke="${series.color}" stroke-width="2.5" stroke-dasharray="${dash}"/></svg>`
  }
  // Con `patterns`, la muestra lleva la misma trama que el relleno.
  const tile = series.pattern ? patternDataUrl(series.pattern.kind, series.pattern, 2) : null
  const background = tile
    ? `background:url(${tile}) 0 0/${PATTERN_SIZE}px ${PATTERN_SIZE}px;outline:1px solid ${series.color};outline-offset:-1px`
    : `background:${series.color};opacity:${Math.max(series.opacity, 0.5)}`
  return `<span aria-hidden="true" style="display:inline-block;width:14px;height:9px;border-radius:2px;${background}"></span>`
}

/** Valor de cada entrada de la leyenda en el instante `x` (las series con el mismo nombre, unidas con " · "). */
export function legendValues(
  spec: ResolvedChartSpec,
  x: number | string,
  hidden: Set<string>,
): Map<string, string> {
  const values = new Map<string, string[]>()
  const legendIds = new Set(
    spec.series.filter((s) => s.legend && !hidden.has(s.name)).map((s) => s.id),
  )
  for (const row of tooltipRows(spec, x)) {
    if (!legendIds.has(row.seriesId)) continue
    values.set(row.name, [...(values.get(row.name) ?? []), row.text])
  }
  return new Map([...values].map(([name, texts]) => [name, texts.join(' · ')]))
}

/**
 * Leyenda HTML común a los tres motores (y a todos los paneles a la vez):
 * un elemento por nombre de serie; pulsar uno oculta o muestra todas las
 * series con ese nombre, en todos los paneles.
 *
 * Devuelve una función para mostrar los valores de las series en el
 * instante `x` (con `legendValues`), o borrarlos con `null`.
 */
export function renderLegend(
  element: HTMLElement,
  legend: HTMLElement,
  spec: ResolvedChartSpec,
  hidden: Set<string>,
  onToggle: (name: string) => void,
): (x: number | string | null) => void {
  const position = spec.legend ? spec.legend.position : null
  const vertical = position === 'left' || position === 'right'
  Object.assign(element.style, {
    display: 'flex',
    flexDirection: vertical
      ? position === 'left'
        ? 'row'
        : 'row-reverse'
      : position === 'bottom'
        ? 'column-reverse'
        : 'column',
  } satisfies Partial<CSSStyleDeclaration>)
  legend.replaceChildren()
  if (!position) {
    legend.style.display = 'none'
    return () => {}
  }
  const withValues = spec.legend !== false && spec.legend.values
  Object.assign(legend.style, {
    display: 'flex',
    flexDirection: vertical ? 'column' : 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: vertical ? 'flex-start' : 'center',
    gap: vertical ? '4px' : '4px 16px',
    padding: '4px 8px',
    flex: 'none',
    width: vertical ? (withValues ? '170px' : '120px') : 'auto',
    fontFamily: spec.theme.fontFamily,
    fontSize: `${spec.theme.fontSize}px`,
    color: spec.theme.text,
  } satisfies Partial<CSSStyleDeclaration>)

  const escape = (text: string) => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
  const valueSpans = new Map<string, HTMLElement>()
  const seen = new Set<string>()
  for (const series of spec.series) {
    if (!series.legend || seen.has(series.name)) continue
    seen.add(series.name)
    const item = document.createElement('button')
    item.type = 'button'
    item.setAttribute('aria-pressed', String(!hidden.has(series.name)))
    item.innerHTML = `${legendMarker(series)}<span>${escape(series.name)}</span>`
    Object.assign(item.style, {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '0',
      border: 'none',
      background: 'none',
      font: 'inherit',
      color: 'inherit',
      cursor: 'pointer',
      opacity: hidden.has(series.name) ? '0.4' : '1',
    } satisfies Partial<CSSStyleDeclaration>)
    if (withValues) {
      const value = document.createElement('span')
      Object.assign(value.style, {
        fontWeight: '600',
        fontVariantNumeric: 'tabular-nums',
        minWidth: '4ch',
      } satisfies Partial<CSSStyleDeclaration>)
      item.appendChild(value)
      valueSpans.set(series.name, value)
    }
    item.addEventListener('click', () => onToggle(series.name))
    legend.appendChild(item)
  }

  return (x) => {
    if (!withValues) return
    const values = x === null ? new Map<string, string>() : legendValues(spec, x, hidden)
    for (const [name, span] of valueSpans) span.textContent = values.get(name) ?? ''
  }
}

/**
 * Cruceta vertical HTML sobre todos los paneles, para los motores que no la
 * dibujan sin su tooltip (ApexCharts, con los valores en la leyenda).
 */
export function createCrosshair(
  host: HTMLElement,
  spec: ResolvedChartSpec,
): (left: number | null) => void {
  const line = document.createElement('div')
  line.dataset.asCrosshair = ''
  Object.assign(line.style, {
    position: 'absolute',
    top: '0',
    bottom: '0',
    width: '1px',
    background: spec.theme.axis,
    pointerEvents: 'none',
    display: 'none',
    zIndex: '1',
  } satisfies Partial<CSSStyleDeclaration>)
  host.appendChild(line)
  return (left) => {
    line.style.display = left === null ? 'none' : 'block'
    if (left !== null) line.style.left = `${left}px`
  }
}
