import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { chartDataTable, chartToCsv } from './data'
import { resolveSpec } from './resolveSpec'
import { at, fakeLocale, fakeTokens, T0 } from './chart.fixtures'
import type { ChartProps } from '@/charts/types/chart'

const { t } = fakeLocale

const props: ChartProps = {
  series: [
    {
      id: 'q',
      name: 'Caudal',
      type: 'line',
      yAxis: 'q',
      data: [
        [at(1), 12.5],
        [at(0), 1234.5678],
        [at(2), null],
      ],
    },
    { id: 'p', name: 'Lluvia', type: 'bar', yAxis: 'p', data: [[at(1), 0.4]] },
    {
      id: 'b',
      name: 'EPS p10–p90',
      type: 'range',
      yAxis: 'q',
      data: [
        [at(0), 10, 14],
        [at(1), null, 20],
      ],
    },
  ],
  yAxes: [
    { id: 'q', label: 'Caudal', unit: 'm³/s' },
    { id: 'p', label: 'Lluvia', unit: 'mm' },
  ],
}

const spec = (extra: Partial<ChartProps> = {}, intlLocale = 'es-ES') =>
  resolveSpec(
    { ...props, ...extra },
    fakeTokens(),
    { ...fakeLocale, intlLocale: ref(intlLocale) },
    () => T0,
  )

const lines = (csv: string) => csv.split('\r\n')

describe('chartDataTable', () => {
  it('una fila por X (ordenadas, sin repetir) y una columna por serie; las bandas, dos', () => {
    const table = chartDataTable(spec(), t)
    expect(table.xLabel).toBe('Fecha y hora')
    expect(table.columns.map((column) => column.label)).toEqual([
      'Caudal',
      'Lluvia',
      'EPS p10–p90, inferior',
      'EPS p10–p90, superior',
    ])
    expect(table.rows.map((row) => row.x)).toEqual([at(0), at(1), at(2)].map((d) => d.getTime()))
    expect(table.rows[1]!.values).toEqual([12.5, 0.4, null, 20])
  })

  it('en un eje de categorías respeta el orden de los datos', () => {
    const table = chartDataTable(
      spec({
        xAxis: { type: 'category' },
        series: [
          {
            id: 'a',
            name: 'A',
            type: 'bar',
            data: [
              ['Tajo', 3],
              ['Duero', 1],
            ],
          },
        ],
      }),
      t,
    )
    expect(table.xLabel).toBe('X')
    expect(table.rows.map((row) => row.x)).toEqual(['Tajo', 'Duero'])
  })
})

describe('chartToCsv', () => {
  it('en español: punto y coma, coma decimal, sin separador de miles y unidad en la cabecera', () => {
    expect(lines(chartToCsv(spec(), t))).toEqual([
      'Fecha y hora;Caudal (m³/s);Lluvia (mm);EPS p10–p90, inferior (m³/s);EPS p10–p90, superior (m³/s)',
      '2026-10-18 00:00;1234,5678;;10;14',
      '2026-10-18 01:00;12,5;0,4;;20',
      '2026-10-18 02:00;;;;',
    ])
  })

  it('en inglés: coma entre columnas y punto decimal', () => {
    const [, first] = lines(chartToCsv(spec({}, 'en-GB'), t))
    expect(first).toBe('2026-10-18 00:00,1234.5678,,10,14')
  })

  it('separadores a medida, y error si coinciden columna y decimal', () => {
    const [, first] = lines(chartToCsv(spec(), t, { separator: '\t', decimalSeparator: '.' }))
    expect(first).toBe('2026-10-18 00:00\t1234.5678\t\t10\t14')
    expect(() => chartToCsv(spec(), t, { separator: ',', decimalSeparator: ',' })).toThrow()
  })

  it('redondea a 6 decimales, sin notación científica ni errores de coma flotante', () => {
    const csv = chartToCsv(
      spec({ series: [{ id: 'a', name: 'A', type: 'line', data: [[at(0), 0.1 + 0.2]] }] }),
      t,
    )
    expect(lines(csv)[1]).toBe('2026-10-18 00:00;0,3')
  })

  it('añade los segundos solo si algún instante los tiene', () => {
    const csv = chartToCsv(
      spec({
        series: [
          {
            id: 'a',
            name: 'A',
            type: 'line',
            data: [
              [at(0), 1],
              [new Date(at(0).getTime() + 30_000), 2],
            ],
          },
        ],
      }),
      t,
    )
    expect(lines(csv).slice(1)).toEqual(['2026-10-18 00:00:00;1', '2026-10-18 00:00:30;2'])
  })

  it('escapa comillas y separadores (RFC 4180) y neutraliza fórmulas de Excel', () => {
    const csv = chartToCsv(
      spec({
        xAxis: { type: 'category', label: 'Embalse; zona' },
        yAxes: undefined,
        series: [
          {
            id: 'a',
            name: 'Volumen "útil"',
            type: 'bar',
            data: [
              ['=HYPERLINK("x")', 1],
              ['-2', -2.5],
            ],
          },
        ],
      }),
      t,
    )
    expect(lines(csv)).toEqual([
      '"Embalse; zona";"Volumen ""útil"""',
      `"'=HYPERLINK(""x"")";1`,
      "'-2;-2,5",
    ])
  })

  it('en un eje numérico, X también va como número del idioma', () => {
    const csv = chartToCsv(
      spec({
        xAxis: { type: 'value', label: 'Cota' },
        yAxes: undefined,
        series: [{ id: 'a', name: 'A', type: 'line', data: [[-1.5, 2]] }],
      }),
      t,
    )
    expect(lines(csv)).toEqual(['Cota;A', '-1,5;2'])
  })

  it('sin series, solo la cabecera', () => {
    expect(chartToCsv(spec({ series: [] }), t)).toBe('Fecha y hora')
  })
})
