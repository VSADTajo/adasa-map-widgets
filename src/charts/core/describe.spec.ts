import { describe, expect, it } from 'vitest'
import { chartAnnouncement, chartAriaLabel, chartDescription } from './describe'
import { resolveSpec } from './resolveSpec'
import { at, fakeLocale, fakeTokens, T0 } from './chart.fixtures'
import type { ChartProps } from '@/charts/types/chart'

const { t } = fakeLocale

/** formatUnit separa número y unidad con un espacio duro (no se parten en dos líneas). */
const NBSP = String.fromCharCode(0xa0)
const nbsp = (text: string) => text.replace(/ (m³\/s|mm)/g, `${NBSP}$1`)

const props: ChartProps = {
  series: [
    {
      id: 'q',
      name: 'Caudal',
      type: 'line',
      data: [
        [at(0), 50],
        [at(1), 154.25],
        [at(2), 90],
      ],
    },
    { id: 'p', name: 'Lluvia', type: 'bar', yAxis: 'p', data: [[at(1), 6]] },
    { id: 'b', name: 'Banda', type: 'range', legend: false, data: [[at(0), 40, 60]] },
  ],
  yAxes: [
    { id: 'q', unit: 'm³/s' },
    { id: 'p', unit: 'mm' },
  ],
  annotations: { y: [{ value: 120, label: 'Umbral rojo', level: 'rojo' }, { value: 80 }] },
}

const spec = resolveSpec(props, fakeTokens(), fakeLocale, () => T0)

describe('chartAriaLabel', () => {
  it('nombra el tipo y las series de la leyenda', () => {
    expect(chartAriaLabel(props.series, 'es-ES', t)).toBe(
      'Gráfica de líneas, barras y bandas: Caudal, Lluvia',
    )
  })

  it('no repite nombres (p. ej. "Observado" en dos paneles)', () => {
    const series = [
      { name: 'Observado', type: 'bar' as const },
      { name: 'Observado', type: 'line' as const },
    ]
    expect(chartAriaLabel(series, 'es-ES', t)).toBe('Gráfica de barras y líneas: Observado')
  })
})

describe('chartDescription', () => {
  const text = chartDescription(spec, t)

  it('describe el rango del eje X', () => {
    expect(text).toContain('Valores desde 18/10/2026, 00:00 hasta 18/10/2026, 02:00.')
  })

  it('da mínimo y máximo de cada serie, con su unidad y el instante del máximo', () => {
    expect(text).toContain(nbsp('Caudal: mínimo 50 m³/s, máximo 154,25 m³/s (18/10/2026, 01:00).'))
    expect(text).toContain(nbsp('Banda: entre 40 m³/s y 60 m³/s.'))
  })

  it('incluye solo los umbrales con nombre', () => {
    expect(text).toContain(nbsp('Referencia «Umbral rojo» en 120 m³/s.'))
    expect(text).not.toContain('80')
  })
})

describe('chartAnnouncement', () => {
  it('anuncia el instante y el valor de cada serie', () => {
    expect(chartAnnouncement(spec, at(1).getTime(), t)).toBe(
      nbsp('18/10/2026, 01:00: Caudal 154,25 m³/s, Lluvia 6 mm'),
    )
  })

  it('avisa cuando no hay valores en ese instante', () => {
    expect(chartAnnouncement(spec, at(9).getTime(), t)).toBe('18/10/2026, 09:00: sin datos')
  })
})
