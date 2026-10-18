import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ASMapScale from './ASMapScale.vue'
import { computeMetricScaleBar, metersPerPixel } from '@/map/utils/mapScale'
import type { ScaleProps } from '@/map/types/ScaleProps'

const MADRID: [number, number] = [40.4168, -3.7038]

function mountScale(props: Partial<ScaleProps> = {}) {
  return mount(ASMapScale, { props: { center: MADRID, zoom: 6, ...props } })
}

function labelTexts(wrapper: ReturnType<typeof mountScale>): string[] {
  return wrapper.findAll('.as-scale__ruler-label').map((label) => label.text())
}

describe('ASMapScale', () => {
  describe('regla graduada', () => {
    it('la regla mide exactamente la distancia que representa', () => {
      const wrapper = mountScale({ zoom: 8, width: 150 })
      const expected = computeMetricScaleBar(metersPerPixel(MADRID[0], 8), 150).widthPx
      expect(wrapper.find('.as-scale__ruler-track').attributes('style')).toContain(
        `width: ${expected}px`,
      )
      // El ancho no puede ir en el recuadro: su relleno y bordes acortarían la regla.
      expect(wrapper.find('.as-scale__ruler').attributes('style')).toBeUndefined()
    })

    it('con una regla corta muestra solo la etiqueta final, fuera de la regla', () => {
      // Zoom 6 y 100 px → regla de ~54 px para 100 km: no caben las 5 etiquetas.
      const wrapper = mountScale()
      expect(wrapper.find('.as-scale__ruler-label-single').text()).toBe('100 km')
      expect(wrapper.findAll('.as-scale__ruler-label')).toHaveLength(0)
    })

    it('con sitio suficiente etiqueta todas las marcas en su posición', () => {
      // Zoom 8 y 450 px → regla de ~429 px para 200 km.
      const wrapper = mountScale({ zoom: 8, width: 450 })
      const labels = wrapper.findAll('.as-scale__ruler-label')
      expect(labels.map((label) => label.attributes('style'))).toEqual([
        'left: 0%;',
        'left: 25%;',
        'left: 50%;',
        'left: 75%;',
        'left: 100%;',
      ])
      expect(labelTexts(wrapper).at(-1)).toMatch(/ km$/)
    })

    it('alinea hacia dentro las etiquetas de los extremos y centra las intermedias', () => {
      const labels = mountScale({ zoom: 8, width: 450 }).findAll('.as-scale__ruler-label')
      expect(labels[0]!.classes()).toContain('as-scale__ruler-label--start')
      expect(labels[2]!.classes()).toContain('as-scale__ruler-label--center')
      expect(labels[4]!.classes()).toContain('as-scale__ruler-label--end')
    })

    it('usa millas o pies con units="imperial"', () => {
      expect(mountScale({ units: 'imperial', zoom: 8, width: 200 }).text()).toMatch(/ (mi|ft)$/)
    })
  })

  describe('razón numérica', () => {
    it('muestra 1 : N en lugar de la regla', () => {
      const wrapper = mountScale({ mode: 'numeric' })
      expect(wrapper.find('.as-scale__ruler').exists()).toBe(false)
      expect(wrapper.find('.as-scale__ratio').text()).toMatch(/^1 : [\d.\s]+$/)
    })
  })
})
