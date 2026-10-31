import { afterEach, describe, expect, it, vi } from 'vitest'
import { columnGeometry, drawIndexToPoint, resolveColor, resolveSpec } from './resolveSpec'
import { at, CATEGORICAL, fakeLocale, fakeTokens, T0 } from './chart.fixtures'
import type { ChartProps, ChartSeries } from '@/charts/types/chart'

const line = (id: string, extra: Partial<ChartSeries> = {}): ChartSeries => ({
  id,
  name: id,
  type: 'line',
  data: [
    [at(0), 1],
    [at(1), 2],
  ],
  ...extra,
})

const resolve = (props: ChartProps, surface?: string) =>
  resolveSpec(props, fakeTokens(surface), fakeLocale, () => T0)

afterEach(() => vi.restoreAllMocks())

describe('resolveSpec', () => {
  describe('colores', () => {
    it('asigna la paleta categórica en orden a las series sin color', () => {
      const spec = resolve({ series: [line('a'), line('b', { color: '#fixed' }), line('c')] })
      expect(spec.series.map((s) => s.color)).toEqual([CATEGORICAL[0], '#fixed', CATEGORICAL[1]])
    })

    it('resuelve var(--as-data-cat-N) al color del tema', () => {
      expect(resolveColor('var(--as-data-cat-3)', fakeTokens())).toBe(CATEGORICAL[2])
      expect(resolveColor('#123456', fakeTokens())).toBe('#123456')
    })

    it('refuerza la opacidad de los rellenos sobre una superficie oscura', () => {
      const props: ChartProps = { series: [line('a', { type: 'area' })] }
      expect(resolve(props).series[0]!.opacity).toBeCloseTo(0.25)
      expect(resolve(props, '#1e293b').series[0]!.opacity).toBeCloseTo(0.4)
    })
  })

  describe('ejes Y', () => {
    it('sin ejes crea uno automático', () => {
      expect(resolve({ series: [line('a')] }).yAxes.map((a) => a.id)).toEqual(['y'])
    })

    it('alterna los lados y desplaza hacia fuera el 3.º y 4.º eje', () => {
      const spec = resolve({
        series: [line('a')],
        yAxes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
      })
      expect(spec.yAxes.map((a) => [a.position, a.slot])).toEqual([
        ['left', 0],
        ['right', 0],
        ['left', 1],
        ['right', 1],
      ])
      expect(spec.maxAxesPerSide).toEqual({ left: 2, right: 2 })
    })

    it('avisa y dibuja solo 4 ejes si se piden más', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const spec = resolve({
        series: [line('a')],
        yAxes: ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id })),
      })
      expect(spec.yAxes).toHaveLength(4)
      expect(warn).toHaveBeenCalledOnce()
    })

    it('compone el título con la unidad y formatea los valores en es-ES', () => {
      const axis = resolve({
        series: [line('a')],
        yAxes: [{ id: 'q', label: 'Caudal', unit: 'm³/s' }],
      }).yAxes[0]!
      expect(axis.title).toBe('Caudal (m³/s)')
      expect(axis.formatValue(1234.5)).toBe('1234,5 m³/s')
    })

    it('asocia cada serie a su eje y al panel de ese eje', () => {
      const spec = resolve({
        series: [line('a', { yAxis: 'q' })],
        panels: [{ id: 'top' }, { id: 'bottom', weight: 3 }],
        yAxes: [
          { id: 'p', panel: 'top' },
          { id: 'q', panel: 'bottom' },
        ],
      })
      expect(spec.series[0]).toMatchObject({ yAxis: 'q', yAxisIndex: 1, panelIndex: 1 })
      expect(spec.panels.map((p) => p.fraction)).toEqual([0.25, 0.75])
    })
  })

  describe('anotaciones', () => {
    it('colorea los umbrales por nivel y amplía el eje para que se vean', () => {
      const spec = resolve({
        series: [line('a')],
        annotations: { y: [{ value: 120, level: 'rojo', label: 'Rojo' }] },
      })
      expect(spec.annotations.y[0]).toMatchObject({
        value: 120,
        color: '#strong-rojo',
        label: 'Rojo',
      })
      expect(spec.yAxes[0]!.include).toEqual([120])
    })

    it('now: true añade la línea "Ahora" en el instante actual', () => {
      const spec = resolve({ series: [line('a')], now: true })
      expect(spec.annotations.x).toEqual([
        expect.objectContaining({ kind: 'line', value: T0.getTime(), label: 'Ahora' }),
      ])
    })

    it('currentTime dibuja una línea vertical sin etiqueta en ese instante', () => {
      const spec = resolve({ series: [line('a')], currentTime: at(1) })
      expect(spec.annotations.x).toEqual([
        expect.objectContaining({ kind: 'line', value: at(1).getTime(), lineStyle: 'solid' }),
      ])
      expect(spec.annotations.x[0]).not.toHaveProperty('label')
    })

    it('normaliza las fechas de las anotaciones X a milisegundos', () => {
      const spec = resolve({
        series: [line('a')],
        annotations: { x: [{ type: 'range', from: at(0), to: at(1) }] },
      })
      expect(spec.annotations.x[0]).toMatchObject({ from: at(0).getTime(), to: at(1).getTime() })
    })
  })

  describe('eje X', () => {
    it('calcula un rango común con los datos y las anotaciones', () => {
      const spec = resolve({
        series: [line('a')],
        annotations: { x: [{ value: at(5) }] },
      })
      expect([spec.xAxis.min, spec.xAxis.max]).toEqual([at(0).getTime(), at(5).getTime()])
    })

    it('respeta min/max explícitos', () => {
      const spec = resolve({ series: [line('a')], xAxis: { min: at(-2) } })
      expect(spec.xAxis.min).toBe(at(-2).getTime())
    })

    it('formatea las fechas en es-ES', () => {
      expect(resolve({ series: [line('a')] }).xAxis.formatTooltip(T0.getTime())).toBe(
        '18/10/2026, 00:00',
      )
    })
  })

  describe('interacción', () => {
    it('leyenda por defecto solo con 2 o más series', () => {
      expect(resolve({ series: [line('a')] }).legend).toBe(false)
      expect(resolve({ series: [line('a'), line('b')] }).legend).toEqual({
        position: 'top',
        values: false,
      })
    })

    it('acepta la posición de la leyenda directamente', () => {
      expect(resolve({ series: [line('a'), line('b')], legend: 'bottom' }).legend).toEqual({
        position: 'bottom',
        values: false,
      })
      expect(resolve({ series: [line('a')], legend: { position: 'right' } }).legend).toMatchObject({
        position: 'right',
      })
      expect(resolve({ series: [line('a'), line('b')], legend: false }).legend).toBe(false)
    })

    it('con valores en la leyenda, la muestra aunque haya una sola serie', () => {
      expect(resolve({ series: [line('a')], legendValues: true }).legend).toEqual({
        position: 'top',
        values: true,
      })
    })

    it('tooltip compartido por defecto, desactivable', () => {
      expect(resolve({ series: [line('a')] }).tooltip).toEqual({
        mode: 'shared',
        content: 'values',
      })
      expect(resolve({ series: [line('a')], tooltip: false }).tooltip).toBe(false)
    })

    it("tooltip: 'time' (o content: 'time') muestra solo la fecha", () => {
      expect(resolve({ series: [line('a')], tooltip: 'time' }).tooltip).toEqual({
        mode: 'shared',
        content: 'time',
      })
      expect(
        resolve({ series: [line('a')], tooltip: { mode: 'item', content: 'time' } }).tooltip,
      ).toEqual({ mode: 'item', content: 'time' })
    })

    it('zoom desactivado por defecto; con barra si se activa', () => {
      expect(resolve({ series: [line('a')] }).zoom).toBe(false)
      expect(resolve({ series: [line('a')], zoom: true }).zoom).toEqual({ slider: true })
    })
  })

  it('separa las bandas en `ranges`', () => {
    const spec = resolve({
      series: [{ id: 'b', name: 'b', type: 'range', data: [[at(0), 1, 3]] }],
    })
    expect(spec.series[0]!.ranges).toEqual([[at(0).getTime(), 1, 3]])
    expect(spec.series[0]!.points).toEqual([])
  })
})

describe('resolveSpec · degradado de las áreas (gradient)', () => {
  const area = (extra: Partial<ChartSeries> = {}) =>
    resolve({ series: [line('a', { type: 'area', ...extra })] }).series[0]!

  it('sin gradient, relleno liso; con true, de 0,5 junto a la línea a 0,05 en la base', () => {
    expect(area().gradient).toBeUndefined()
    expect(area({ gradient: true }).gradient).toEqual({ from: 0.5, to: 0.05 })
  })

  it('from sale de la opacidad de la serie si no se da; to y from propios', () => {
    expect(area({ gradient: true, opacity: 0.4 }).gradient).toEqual({ from: 0.4, to: 0.05 })
    expect(area({ gradient: { from: 0.7, to: 0 } }).gradient).toEqual({ from: 0.7, to: 0 })
  })

  it('solo en áreas, y con patterns manda la trama', () => {
    expect(resolve({ series: [line('a', { gradient: true })] }).series[0]!.gradient).toBeUndefined()
    const withPatterns = resolve({
      series: [line('a', { type: 'area', gradient: true })],
      patterns: true,
    })
    expect(withPatterns.series[0]!.pattern).toBeDefined()
    expect(withPatterns.series[0]!.gradient).toBeUndefined()
  })
})

describe('columnGeometry y columns (hietograma)', () => {
  const H = 3_600_000
  it('cada valor, una columna del intervalo que termina en su punto, que sube de la base y vuelve', () => {
    const geometry = columnGeometry(
      [
        [H, 2],
        [2 * H, 4],
        [3 * H, null],
      ],
      { gap: 0.5 },
    )!
    expect(geometry).toEqual([
      [0.25 * H, 0],
      [0.25 * H, 2],
      [0.75 * H, 2],
      [0.75 * H, 0],
      [1.25 * H, 0],
      [1.25 * H, 4],
      [1.75 * H, 4],
      [1.75 * H, 0],
      // Un hueco en los datos, a 0 (sin null: ApexCharts no dibuja bien las áreas con null).
      [2.25 * H, 0],
      [2.25 * H, 0],
      [2.75 * H, 0],
      [2.75 * H, 0],
    ])
  })

  it('el primero usa el intervalo típico; con width, un ancho fijo; sin X numéricas, nada', () => {
    const irregular = columnGeometry(
      [
        [10 * H, 1],
        [11 * H, 1],
        [12 * H, 1],
        [15 * H, 1],
      ],
      { gap: 0 },
    )!
    expect(irregular[0]![0]).toBe(9 * H)
    expect(irregular[12]![0]).toBe(12 * H)
    const fixed = columnGeometry(
      [
        [10 * H, 1],
        [15 * H, 1],
      ],
      { gap: 0, width: H },
    )!
    expect(fixed[4]![0]).toBe(14 * H)
    expect(columnGeometry([['a', 1]])).toBeUndefined()
  })

  it('resolveSpec la calcula solo en áreas con columns, y les da step start para el tooltip', () => {
    const spec = resolve({
      series: [
        line('a', {
          type: 'area',
          columns: true,
          data: [
            [0, 1],
            [H, 2],
          ],
        }),
        line('b', {
          type: 'area',
          data: [
            [0, 1],
            [H, 2],
          ],
        }),
        line('c', {
          columns: true,
          data: [
            [0, 1],
            [H, 2],
          ],
        }),
      ],
      xAxis: { type: 'value' },
    })
    expect(spec.series[0]!.drawPoints).toHaveLength(8)
    expect(spec.series[0]!.step).toBe('start')
    expect(spec.series[0]!.points).toEqual([
      [0, 1],
      [H, 2],
    ])
    expect(spec.series[1]!.drawPoints).toBeUndefined()
    expect(spec.series[2]!.drawPoints).toBeUndefined()
  })

  it('drawIndexToPoint: cuatro puntos de dibujo por valor', () => {
    expect([0, 3, 4, 7, 8].map((i) => drawIndexToPoint({ drawPoints: [] }, i))).toEqual([
      0, 0, 1, 1, 2,
    ])
    expect(drawIndexToPoint({}, 4)).toBe(4)
  })
})
