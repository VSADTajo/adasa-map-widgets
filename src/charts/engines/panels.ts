import type { ResolvedChartSpec } from '@/charts/core/resolveSpec'
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

/** Botón "Restablecer zoom" para los motores sin barra de herramientas propia. */
export function createResetZoomButton(
  element: HTMLElement,
  spec: ResolvedChartSpec,
  onClick: () => void,
): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = spec.texts.resetZoom
  Object.assign(button.style, {
    position: 'absolute',
    top: '4px',
    right: '8px',
    zIndex: '1',
    display: 'none',
    padding: '2px 8px',
    borderRadius: '4px',
    border: `1px solid ${spec.theme.border}`,
    background: spec.theme.surface,
    color: spec.theme.text,
    font: `12px ${spec.theme.fontFamily}`,
    cursor: 'pointer',
  } satisfies Partial<CSSStyleDeclaration>)
  button.addEventListener('click', onClick)
  element.appendChild(button)
  return button
}

/**
 * Marco de los motores con un lienzo por panel: la leyenda (si hay) y el
 * contenedor de los paneles, colocados según `spec.legend.position`.
 */
export function createFrame(element: HTMLElement): { legend: HTMLElement; host: HTMLElement } {
  element.replaceChildren()
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

function legendMarker(series: ResolvedChartSpec['series'][number]): string {
  if (series.type === 'line' || series.type === 'scatter') {
    const dash =
      series.lineStyle === 'dashed' ? '4 3' : series.lineStyle === 'dotted' ? '1.5 2.5' : ''
    return `<svg width="18" height="10" aria-hidden="true"><line x1="1" y1="5" x2="17" y2="5" stroke="${series.color}" stroke-width="2.5" stroke-dasharray="${dash}"/></svg>`
  }
  return `<span aria-hidden="true" style="display:inline-block;width:14px;height:9px;border-radius:2px;background:${series.color};opacity:${Math.max(series.opacity, 0.5)}"></span>`
}

/**
 * Leyenda HTML común (la misma en Chart.js y ApexCharts, y para todos los
 * paneles a la vez): un elemento por nombre de serie; pulsar uno oculta o
 * muestra todas las series con ese nombre, en todos los paneles.
 */
export function renderLegend(
  element: HTMLElement,
  legend: HTMLElement,
  spec: ResolvedChartSpec,
  hidden: Set<string>,
  onToggle: (name: string) => void,
): void {
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
    return
  }
  Object.assign(legend.style, {
    display: 'flex',
    flexDirection: vertical ? 'column' : 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: vertical ? 'flex-start' : 'center',
    gap: vertical ? '4px' : '4px 14px',
    padding: '4px 8px',
    flex: 'none',
    width: vertical ? '120px' : 'auto',
    fontFamily: spec.theme.fontFamily,
    fontSize: `${spec.theme.fontSize}px`,
    color: spec.theme.text,
  } satisfies Partial<CSSStyleDeclaration>)

  const seen = new Set<string>()
  for (const series of spec.series) {
    if (!series.legend || seen.has(series.name)) continue
    seen.add(series.name)
    const item = document.createElement('button')
    item.type = 'button'
    item.setAttribute('aria-pressed', String(!hidden.has(series.name)))
    item.innerHTML = `${legendMarker(series)}<span>${series.name.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)}</span>`
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
    item.addEventListener('click', () => onToggle(series.name))
    legend.appendChild(item)
  }
}
