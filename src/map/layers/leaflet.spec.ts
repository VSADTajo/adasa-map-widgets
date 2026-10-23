import { describe, expect, it } from 'vitest'
import type { Feature } from 'geojson'
import { withOpacity } from './leaflet'

const feature = { type: 'Feature', properties: {}, geometry: null } as unknown as Feature

describe('withOpacity', () => {
  it('sin estilo ni opacidad, Leaflet usa los suyos', () => {
    expect(withOpacity(undefined, undefined)).toBeUndefined()
  })

  it('la opacidad de la capa multiplica la del estilo (no la sustituye)', () => {
    const style = withOpacity(() => ({ color: '#f00', fillOpacity: 0.25, opacity: 0.8 }), 0.5)!
    expect(style(feature)).toEqual({ color: '#f00', fillOpacity: 0.125, opacity: 0.4 })
  })

  it('sin opacidades en el estilo, parte de las de Leaflet (1 y 0,2)', () => {
    expect(withOpacity(undefined, 0.5)!(feature)).toEqual({ opacity: 0.5, fillOpacity: 0.1 })
  })

  it('con opacidad 1 deja el estilo tal cual', () => {
    const style = withOpacity(() => ({ fillOpacity: 0.25 }), 1)!
    expect(style(feature)).toMatchObject({ fillOpacity: 0.25, opacity: 1 })
  })

  it('sin opacidad de capa, el estilo sin tocar', () => {
    expect(withOpacity(() => ({ fillOpacity: 0.3 }), undefined)!(feature)).toEqual({
      fillOpacity: 0.3,
    })
  })
})
