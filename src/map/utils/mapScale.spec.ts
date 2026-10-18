import { describe, expect, it } from 'vitest'
import {
  computeImperialScaleBar,
  computeMetricScaleBar,
  computeScaleRatio,
  metersPerPixel,
} from './mapScale'

/** Metros por píxel en el ecuador a zoom 0 (Web Mercator, teselas de 256px). */
const EQUATOR_ZOOM_0 = 156543.03392804097

/** Las únicas "cifras bonitas" que puede mostrar una escala: 1/2/3/5 × 10^n. */
function isNiceNumber(value: number): boolean {
  const fraction = value / 10 ** Math.floor(Math.log10(value))
  return [1, 2, 3, 5].some((nice) => Math.abs(fraction - nice) < 1e-9)
}

describe('metersPerPixel', () => {
  it('en el ecuador a zoom 0 vale la constante de Web Mercator', () => {
    expect(metersPerPixel(0, 0)).toBeCloseTo(EQUATOR_ZOOM_0, 6)
  })

  it('se divide entre 2 con cada nivel de zoom', () => {
    expect(metersPerPixel(0, 1)).toBeCloseTo(EQUATOR_ZOOM_0 / 2, 6)
    expect(metersPerPixel(40, 10) / metersPerPixel(40, 11)).toBeCloseTo(2, 10)
  })

  it('se reduce con el coseno de la latitud', () => {
    expect(metersPerPixel(60, 5)).toBeCloseTo(metersPerPixel(0, 5) / 2, 6)
  })
})

describe('computeMetricScaleBar', () => {
  it('usa metros por debajo de 1 km y redondea hacia abajo a una cifra bonita', () => {
    // 7 m/px × 100 px = 700 m → 500 m
    const bar = computeMetricScaleBar(7, 100)
    expect(bar).toMatchObject({ distance: 500, unit: 'm' })
    expect(bar.widthPx).toBeCloseTo(500 / 7, 6)
  })

  it.each([
    [1.5, 100, 100], // 150 m → 100
    [2.5, 100, 200], // 250 m → 200
    [4, 100, 300], // 400 m → 300
    [6, 100, 500], // 600 m → 500
  ])('con %f m/px y %i px elige %i m (escalones 1/2/3/5)', (mpp, width, expected) => {
    expect(computeMetricScaleBar(mpp, width)).toMatchObject({ distance: expected, unit: 'm' })
  })

  it('pasa a kilómetros a partir de exactamente 1000 m', () => {
    expect(computeMetricScaleBar(10, 100)).toEqual({ widthPx: 100, distance: 1, unit: 'km' })
    expect(computeMetricScaleBar(9.99, 100)).toMatchObject({ distance: 500, unit: 'm' })
  })

  it.each([
    [0.05, 80],
    [3.2, 120],
    [61.4, 100],
    [1234.5, 150],
    [98765, 200],
  ])('con %f m/px y %i px nunca supera el ancho máximo y usa una cifra bonita', (mpp, width) => {
    const bar = computeMetricScaleBar(mpp, width)
    expect(bar.widthPx).toBeLessThanOrEqual(width)
    expect(isNiceNumber(bar.distance)).toBe(true)
  })
})

describe('computeImperialScaleBar', () => {
  it('usa pies por debajo de una milla', () => {
    // 1 m/px × 100 px = 328 ft → 300 ft
    const bar = computeImperialScaleBar(1, 100)
    expect(bar).toMatchObject({ distance: 300, unit: 'ft' })
    expect(bar.widthPx).toBeCloseTo(300 / 3.28084, 6)
  })

  it('pasa a millas a partir de 5280 ft', () => {
    // 20 m/px × 100 px ≈ 6562 ft ≈ 1.24 mi → 1 mi
    const bar = computeImperialScaleBar(20, 100)
    expect(bar).toMatchObject({ distance: 1, unit: 'mi' })
    expect(bar.widthPx).toBeCloseTo(5280 / (20 * 3.28084), 6)
  })
})

describe('computeScaleRatio', () => {
  it('devuelve el denominador N de 1:N asumiendo 96 dpi', () => {
    const metersPerScreenPixel = 0.0254 / 96
    expect(computeScaleRatio(metersPerScreenPixel * 50_000)).toBe(50_000)
  })

  it('redondea a un entero', () => {
    expect(Number.isInteger(computeScaleRatio(metersPerPixel(40.4, 6)))).toBe(true)
  })
})
