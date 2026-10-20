import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

/**
 * Leaflet simulado: guarda los handlers y deja mover el mapa "como el
 * usuario" (`userMove`) o desde las props (`setView`). Como el Leaflet real,
 * `setView` ajusta el centro a la rejilla de píxeles (aquí, un desfase fijo)
 * y dispara zoomend y moveend.
 */
interface FakeLeaflet {
  center: [number, number]
  zoom: number
  handlers: Record<string, () => void>
  setView: ReturnType<typeof vi.fn>
  userMove: (center: [number, number], zoom?: number) => void
}

const fake = vi.hoisted(() => {
  const state: FakeLeaflet = {
    center: [0, 0] as [number, number],
    zoom: 0,
    handlers: {} as Record<string, () => void>,
    setView: undefined as unknown as ReturnType<typeof vi.fn>,
    userMove(center: [number, number], zoom = state.zoom) {
      state.center = center
      state.zoom = zoom
      state.handlers.zoomend?.()
      state.handlers.moveend?.()
    },
  }
  return state
})

vi.mock('leaflet/dist/leaflet.css', () => ({}))
vi.mock('leaflet', () => {
  fake.setView = vi.fn((center: [number, number], zoom: number) => {
    fake.center = [center[0] + 0.003, center[1] + 0.01]
    fake.zoom = zoom
    fake.handlers.zoomend?.()
    fake.handlers.moveend?.()
  })
  const map = (_el: HTMLElement, options: { center: [number, number]; zoom: number }) => {
    fake.center = options.center
    fake.zoom = options.zoom
    fake.handlers = {}
    return {
      on: (event: string, handler: () => void) => (fake.handlers[event] = handler),
      getCenter: () => ({ lat: fake.center[0], lng: fake.center[1] }),
      getZoom: () => fake.zoom,
      setView: fake.setView,
      invalidateSize: () => {},
      remove: () => {},
    }
  }
  const tileLayer = () => ({ addTo: () => {} })
  return { default: { map, tileLayer }, map, tileLayer }
})

const { default: ASMap } = await import('./ASMap.vue')

async function mountMap() {
  const wrapper = mount(ASMap, {
    props: {
      center: [40.4168, -3.7038] as [number, number],
      zoom: 6,
      'onUpdate:center': (center: [number, number]) => wrapper.setProps({ center }),
      'onUpdate:zoom': (zoom: number) => wrapper.setProps({ zoom }),
    },
  })
  await flushPromises()
  return wrapper
}

describe('ASMap · v-model:center y v-model:zoom', () => {
  it('emite el centro y el zoom cuando los mueve el usuario', async () => {
    const wrapper = await mountMap()
    expect(wrapper.emitted('map-ready')).toHaveLength(1)
    fake.userMove([39.86, -4.03], 8)
    expect(wrapper.emitted('update:center')).toEqual([[[39.86, -4.03]]])
    expect(wrapper.emitted('update:zoom')).toEqual([[8]])
  })

  it('un centro cambiado por props mueve el mapa sin animar y no se vuelve a emitir', async () => {
    const wrapper = await mountMap()
    await wrapper.setProps({ center: [39.8628, -4.0273] })
    expect(fake.setView).toHaveBeenLastCalledWith([39.8628, -4.0273], 6, { animate: false })
    // Leaflet lo ajustó a otro centro, pero no pisa el valor que puso el proyecto.
    expect(wrapper.emitted('update:center')).toBeUndefined()
    expect(wrapper.props('center')).toEqual([39.8628, -4.0273])
    // El siguiente movimiento del usuario se sigue emitiendo.
    fake.userMove([39.5, -4.2])
    expect(wrapper.emitted('update:center')).toEqual([[[39.5, -4.2]]])
  })

  it('un zoom cambiado por props tampoco se vuelve a emitir', async () => {
    const wrapper = await mountMap()
    await wrapper.setProps({ zoom: 10 })
    expect(fake.setView).toHaveBeenLastCalledWith([40.4168, -3.7038], 10, { animate: false })
    expect(wrapper.emitted('update:zoom')).toBeUndefined()
  })
})
