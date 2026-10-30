import { describe, expect, it } from 'vitest'
import { buildPrecipitation } from './precipitationChart'
import { fakeLocale } from './chart.fixtures'
import type { HydroPoint } from '@/charts/types/HydrographProps'
import type { PrecipitationProps, PrecipitationSeries } from '@/charts/types/PrecipitationProps'

const T0 = new Date(2026, 9, 18, 0, 0)
/** Serie horaria desde la hora `fromHour` respecto a T0. */
const hourly = (fromHour: number, ...values: number[]): HydroPoint[] =>
  values.map((value, i) => [new Date(T0.getTime() + (fromHour + i) * 3_600_000), value])

const observed: PrecipitationSeries = {
  id: 'tr',
  name: 'P. TR',
  values: hourly(-3, 1, 2, 3),
  cumulative: true,
}
const forecast: PrecipitationSeries = {
  id: 'wrf',
  name: 'WRF',
  kind: 'forecast',
  values: hourly(0, 4, 1),
  cumulative: true,
}

const build = (extra: Partial<PrecipitationProps> = {}) =>
  buildPrecipitation({ series: [observed, forecast], ...extra }, fakeLocale.t)
const byId = (chart: ReturnType<typeof build>, id: string) => chart.series.find((s) => s.id === id)!
const values = (chart: ReturnType<typeof build>, id: string) =>
  (byId(chart, id).data as HydroPoint[]).map(([, v]) => v)

describe('buildPrecipitation', () => {
  describe('conversión y eje de intensidad', () => {
    it('por defecto, mm por intervalo → mm/h en el eje izquierdo', () => {
      const chart = buildPrecipitation(
        {
          series: [
            {
              id: 'a',
              name: 'A',
              values: [
                [T0, 1],
                [new Date(T0.getTime() + 1_800_000), 2],
              ],
            },
          ],
        },
        fakeLocale.t,
      )
      // Solo los datos reales: las columnas son geometría de dibujo de ASChart.
      expect(values(chart, 'precipitation-a')).toEqual([2, 4])
      expect(chart.yAxes![0]).toMatchObject({
        id: 'rate',
        unit: 'mm/h',
        label: 'Intensidad',
        position: 'left',
      })
    })

    it("input 'intensity' llega ya en mm/h; con rate 'depth' se pasa a mm", () => {
      const series: PrecipitationSeries[] = [
        { id: 'a', name: 'A', values: hourly(0, 6, 6), input: 'intensity', intervalMinutes: 30 },
      ]
      expect(values(buildPrecipitation({ series }, fakeLocale.t), 'precipitation-a')).toEqual([
        6, 6,
      ])
      const depth = buildPrecipitation({ series, rate: 'depth' }, fakeLocale.t)
      expect(values(depth, 'precipitation-a')).toEqual([3, 3])
      expect(depth.yAxes![0]).toMatchObject({ unit: 'mm', label: 'Precipitación' })
    })
  })

  describe('dibujo por defecto', () => {
    it('en columnas que ocupan su intervalo: observado casi opaco y previsto semitransparente', () => {
      const chart = build()
      expect(byId(chart, 'precipitation-tr')).toMatchObject({
        type: 'area',
        columns: true,
        color: 'var(--as-data-cat-1)',
        opacity: 0.85,
        lineStyle: 'solid',
        gradient: undefined,
      })
      expect(byId(chart, 'precipitation-wrf')).toMatchObject({
        type: 'area',
        columns: true,
        color: 'var(--as-data-cat-2)',
        opacity: 0.5,
      })
    })

    it('con intervalMinutes, columnas de ese ancho fijo (aunque haya huecos)', () => {
      const chart = buildPrecipitation(
        { series: [{ ...observed, intervalMinutes: 10 }] },
        fakeLocale.t,
      )
      expect(byId(chart, 'precipitation-tr').columns).toEqual({ width: 600_000 })
    })

    it('en área, la previsión lleva degradado y trazo discontinuo; en línea, el observado continuo', () => {
      const chart = buildPrecipitation(
        {
          series: [
            { ...observed, display: 'line' },
            { ...forecast, display: 'area' },
          ],
        },
        fakeLocale.t,
      )
      expect(byId(chart, 'precipitation-tr')).toMatchObject({ type: 'line', lineStyle: 'solid' })
      expect(byId(chart, 'precipitation-wrf')).toMatchObject({
        type: 'area',
        lineStyle: 'dashed',
        gradient: true,
        opacity: undefined,
      })
    })

    it('varios observados y varias previsiones a la vez, cada una con su acumulado', () => {
      const chart = buildPrecipitation(
        {
          series: [
            observed,
            { id: 'areal', name: 'P. Areal', values: hourly(-3, 0.5, 1, 1.5), cumulative: true },
            forecast,
            {
              id: 'ecmwf',
              name: 'ECMWF',
              kind: 'forecast',
              values: hourly(0, 2, 2),
              cumulative: true,
            },
          ],
        },
        fakeLocale.t,
      )
      expect(chart.series.filter((s) => s.yAxis === 'rate').map((s) => s.id)).toEqual([
        'precipitation-tr',
        'precipitation-areal',
        'precipitation-wrf',
        'precipitation-ecmwf',
      ])
      // Las dos previsiones continúan el primer observado con acumulado (P. TR: 6 mm).
      expect(values(chart, 'cumulative-wrf')).toEqual([6, 10, 11])
      expect(values(chart, 'cumulative-ecmwf')).toEqual([6, 8, 10])
      expect(values(chart, 'cumulative-areal')).toEqual([0.5, 1.5, 3])
    })

    it('display, gradient y style propios', () => {
      const chart = buildPrecipitation(
        {
          series: [
            { ...observed, opacity: 0.8 },
            {
              ...forecast,
              display: 'area',
              gradient: { from: 0.8 },
              style: { color: '#FFA500', width: 3, type: 'dotted' },
            },
          ],
        },
        fakeLocale.t,
      )
      expect(byId(chart, 'precipitation-tr')).toMatchObject({
        type: 'area',
        columns: true,
        opacity: 0.8,
      })
      expect(byId(chart, 'precipitation-wrf')).toMatchObject({
        gradient: { from: 0.8 },
        color: '#FFA500',
        lineWidth: 3,
        lineStyle: 'dotted',
      })
    })

    it('tooltip con solo la fecha, leyenda abajo con valores, y "ahora"', () => {
      expect(build()).toMatchObject({
        tooltip: 'time',
        legend: 'bottom',
        legendValues: true,
        now: true,
      })
    })
  })

  describe('acumulados', () => {
    it('cada serie que lo pide, en el eje derecho (mm), del color de su serie y en su línea de la leyenda', () => {
      const chart = build()
      expect(byId(chart, 'cumulative-tr')).toMatchObject({
        name: 'P. TR (acumulado)',
        legendLabel: 'P. TR',
        legendGroup: 'Acumulado',
        yAxis: 'cumulative',
        color: 'var(--as-data-cat-1)',
        lineWidth: 3,
        lineStyle: 'solid',
      })
      expect(values(chart, 'cumulative-tr')).toEqual([1, 3, 6])
      expect(chart.yAxes![1]).toMatchObject({
        id: 'cumulative',
        position: 'right',
        unit: 'mm',
        grid: false,
      })
    })

    it('la previsión continúa el observado, enlazada con su último punto', () => {
      const chart = build()
      expect(values(chart, 'cumulative-wrf')).toEqual([6, 10, 11])
      expect(byId(chart, 'cumulative-wrf').lineStyle).toBe('dashed')
    })

    it('continueFrom: false empieza en 0; un id continúa esa serie', () => {
      const alone = build({
        series: [observed, { ...forecast, cumulative: { continueFrom: false } }],
      })
      expect(values(alone, 'cumulative-wrf')).toEqual([4, 5])
      const other: PrecipitationSeries = {
        id: 'areal',
        name: 'P. Areal',
        values: hourly(-2, 10, 10),
        cumulative: true,
      }
      const chart = build({
        series: [observed, other, { ...forecast, cumulative: { continueFrom: 'areal' } }],
      })
      expect(values(chart, 'cumulative-wrf')).toEqual([20, 24, 25])
    })

    it('from: suma solo desde ese instante; name y style propios', () => {
      const chart = build({
        series: [
          {
            ...observed,
            cumulative: {
              from: hourly(-2, 0)[0]![0],
              name: 'Acumulat',
              style: { color: '#14b554' },
            },
          },
        ],
      })
      expect(values(chart, 'cumulative-tr')).toEqual([2, 5])
      expect(byId(chart, 'cumulative-tr')).toMatchObject({
        name: 'Acumulat',
        legendLabel: 'Acumulat',
        color: '#14b554',
      })
    })

    it('showCumulative: false los quita, con su eje; sin acumulados, solo el eje izquierdo', () => {
      const hidden = build({ showCumulative: false })
      expect(hidden.series.some((s) => s.yAxis === 'cumulative')).toBe(false)
      expect(hidden.yAxes!.map((a) => a.id)).toEqual(['rate'])
      const none = build({ series: [{ ...observed, cumulative: undefined }] })
      expect(none.yAxes!.map((a) => a.id)).toEqual(['rate'])
    })

    it('los acumulados salen siempre de mm, aunque la serie llegue en mm/h', () => {
      const chart = buildPrecipitation(
        {
          series: [
            { id: 'a', name: 'A', values: hourly(0, 2, 4), input: 'intensity', cumulative: true },
          ],
        },
        fakeLocale.t,
      )
      expect(values(chart, 'cumulative-a')).toEqual([2, 6])
    })
  })

  describe('umbrales y retoques', () => {
    it('umbrales de intensidad y de acumulado, cada uno en su eje (el de acumulado, solo si hay acumulados)', () => {
      const thresholds = [
        { value: 20, level: 'naranja' },
        { value: 60, level: 'rojo', axis: 'cumulative' as const, label: '60 mm' },
      ]
      expect(build({ thresholds }).annotations!.y!.map((a) => [a.yAxis, a.label])).toEqual([
        ['rate', 'Umbral naranja'],
        ['cumulative', '60 mm'],
      ])
      expect(build({ thresholds, showCumulative: false }).annotations!.y).toHaveLength(1)
    })

    it('seriesOverrides y yAxisOverrides por id', () => {
      const chart = build({
        seriesOverrides: { 'cumulative-wrf': { lineWidth: 5 } },
        yAxisOverrides: { rate: { max: 30 } },
      })
      expect(byId(chart, 'cumulative-wrf').lineWidth).toBe(5)
      expect(chart.yAxes![0]!.max).toBe(30)
    })
  })
})

describe('buildPrecipitation · intervalo común (interval)', () => {
  /** Serie cada 10 min durante 1 h: 1 mm por intervalo. */
  const tenMinutes: HydroPoint[] = [10, 20, 30, 40, 50, 60].map((m) => [
    new Date(T0.getTime() + m * 60_000),
    1,
  ])
  const threeHours: HydroPoint[] = [3, 6].map((h) => [new Date(T0.getTime() + h * 3_600_000), 6])
  const build60 = (rate?: 'depth' | 'intensity') =>
    buildPrecipitation(
      {
        interval: 60,
        rate,
        series: [
          { id: 'tr', name: 'P. TR', values: tenMinutes, cumulative: true },
          { id: 'ecmwf', name: 'ECMWF', kind: 'forecast', values: threeHours },
        ],
      },
      fakeLocale.t,
    )
  const series = (chart: ReturnType<typeof build60>, id: string) =>
    chart.series.find((s) => s.id === id)!

  it('las series más finas suman sus mm al intervalo, con columnas de ese ancho', () => {
    const depth = build60('depth')
    expect(series(depth, 'precipitation-tr').data).toEqual([
      [new Date(T0.getTime() + 3_600_000), 6],
    ])
    expect(series(depth, 'precipitation-tr').columns).toEqual({ width: 3_600_000 })
    // En mm/h, 6 mm en una hora son 6 mm/h.
    expect(series(build60(), 'precipitation-tr').data).toEqual([
      [new Date(T0.getTime() + 3_600_000), 6],
    ])
  })

  it('las más gruesas que el intervalo se quedan como están (no se reparte su lluvia)', () => {
    const chart = build60('depth')
    expect((series(chart, 'precipitation-ecmwf').data as HydroPoint[]).map(([, v]) => v)).toEqual([
      6, 6,
    ])
    expect(series(chart, 'precipitation-ecmwf').columns).toBe(true)
  })

  it('el acumulado no cambia (se calcula con los datos originales)', () => {
    const cumulative = series(build60(), 'cumulative-tr').data as HydroPoint[]
    expect(cumulative.map(([, v]) => v)).toEqual([1, 2, 3, 4, 5, 6])
  })
})
