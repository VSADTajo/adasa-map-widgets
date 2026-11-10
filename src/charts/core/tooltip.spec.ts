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

describe("tooltipHtml · solo la fecha (tooltip: 'time')", () => {
  it('muestra la fecha y ninguna fila de valores', () => {
    const html = tooltipHtml(
      { ...spec, tooltip: { mode: 'shared', content: 'time' } },
      at(1).getTime(),
    )
    expect(html).toContain('18/10/2026, 01:00')
    expect(html).not.toContain('Caudal')
    expect(html).not.toContain('m³/s')
  })
})

describe('tooltipRows · series escalonadas', () => {
  const stepped = (step: 'start' | 'end') =>
    resolveSpec(
      {
        series: [
          {
            id: 'p',
            name: 'Lluvia',
            type: 'area',
            step,
            data: [
              [at(0), 1],
              [at(1), 5],
              [at(2), 3],
            ],
          },
        ],
      },
      fakeTokens(),
      fakeLocale,
    )
  const valueAt = (step: 'start' | 'end', hours: number) =>
    tooltipRows(stepped(step), at(0).getTime() + hours * HOUR)[0]?.text

  it.each([
    [0.1, '5'],
    [0.9, '5'],
    [1, '5'],
    [1.5, '3'],
  ])("step 'start': a las %s h, el valor del escalón que termina después (%s)", (hours, text) => {
    expect(valueAt('start', hours)).toBe(text)
  })

  it.each([
    [0.1, '1'],
    [0.9, '1'],
    [1.5, '5'],
  ])("step 'end': a las %s h, el valor del escalón que empieza antes (%s)", (hours, text) => {
    expect(valueAt('end', hours)).toBe(text)
  })

  it('fuera de los datos, sin valor', () => {
    expect(valueAt('start', 3.5)).toBeUndefined()
    expect(valueAt('end', -0.5)).toBeUndefined()
  })
})
