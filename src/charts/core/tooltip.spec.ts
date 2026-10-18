import { describe, expect, it } from 'vitest'
import { resolveSpec } from './resolveSpec'
import { tooltipHtml, tooltipRows } from './tooltip'
import { at, fakeLocale, fakeTokens } from './chart.fixtures'

const HOUR = 3_600_000

const spec = resolveSpec(
  {
    series: [
      {
        id: 'q',
        name: 'Caudal',
        type: 'line',
        data: [
          [at(0), 10],
          [at(1), 12.5],
          [at(2), null],
        ],
        yAxis: 'q',
      },
      { id: 'band', name: 'EPS p10–p90', type: 'range', data: [[at(1), 9, 14]], yAxis: 'q' },
      { id: 'hidden', name: 'Oculta', type: 'line', data: [[at(1), 99]], tooltip: false },
    ],
    yAxes: [{ id: 'q', unit: 'm³/s' }],
  },
  fakeTokens(),
  fakeLocale,
)

describe('tooltipRows', () => {
  it('una fila por serie con valor en ese instante, con su unidad y sin las ocultas', () => {
    expect(tooltipRows(spec, at(1).getTime())).toEqual([
      { seriesId: 'q', name: 'Caudal', color: '#c1', text: '12,5 m³/s' },
      { seriesId: 'band', name: 'EPS p10–p90', color: '#c2', text: '9 m³/s – 14 m³/s' },
    ])
  })

  it('usa el punto más cercano si está a menos de medio paso de la serie', () => {
    const rows = tooltipRows(spec, at(1).getTime() + 0.4 * HOUR)
    expect(rows[0]!.text).toBe('12,5 m³/s')
  })

  it('no inventa valores lejos de cualquier punto ni en los huecos', () => {
    expect(tooltipRows(spec, at(5).getTime())).toEqual([])
    expect(tooltipRows(spec, at(2).getTime())).toEqual([])
  })

  it('en modo item, solo la serie indicada', () => {
    expect(tooltipRows(spec, at(1).getTime(), 'band').map((r) => r.seriesId)).toEqual(['band'])
  })
})

describe('tooltipHtml', () => {
  it('lleva la fecha en es-ES como cabecera y escapa el texto', () => {
    const html = tooltipHtml(
      { ...spec, series: [{ ...spec.series[0]!, name: '<b>Q</b>' }] },
      at(1).getTime(),
    )
    expect(html).toContain('18/10/2026, 01:00')
    expect(html).toContain('&#60;b&#62;Q&#60;/b&#62;')
    expect(html).not.toContain('<b>Q</b>')
  })
})
