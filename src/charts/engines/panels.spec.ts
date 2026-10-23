import { describe, expect, it } from 'vitest'
import { resolveSpec } from '@/charts/core/resolveSpec'
import { at, fakeLocale, fakeTokens } from '@/charts/core/chart.fixtures'
import { legendValues, renderLegend } from './panels'

const spec = resolveSpec(
  {
    series: [
      { id: 'rain', name: 'Observado', type: 'bar', data: [[at(0), 2]], yAxis: 'p' },
      { id: 'flow', name: 'Observado', type: 'line', data: [[at(0), 45]], yAxis: 'q' },
      {
        id: 'band',
        name: 'Banda',
        type: 'range',
        data: [[at(0), 1, 9]],
        yAxis: 'q',
        legend: false,
      },
    ],
    yAxes: [
      { id: 'p', unit: 'mm' },
      { id: 'q', unit: 'm³/s' },
    ],
    legend: 'bottom',
    legendValues: true,
  },
  fakeTokens(),
  fakeLocale,
)

describe('legendValues', () => {
  it('une los valores de las series con el mismo nombre y omite las que no van en la leyenda', () => {
    expect(legendValues(spec, at(0).getTime(), new Set())).toEqual(
      new Map([['Observado', '2 mm · 45 m³/s']]),
    )
  })

  it('no da valores de las series ocultas desde la leyenda', () => {
    expect(legendValues(spec, at(0).getTime(), new Set(['Observado'])).size).toBe(0)
  })
})

describe('renderLegend', () => {
  const setup = () => {
    const element = document.createElement('div')
    const legend = document.createElement('div')
    const toggled: string[] = []
    const setValues = renderLegend(element, legend, spec, new Set(), (name) => toggled.push(name))
    return { element, legend, toggled, setValues }
  }

  it('una entrada por nombre, sin las series con legend: false', () => {
    const { legend } = setup()
    expect([...legend.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Observado'])
  })

  it('debajo de la gráfica con position: bottom', () => {
    expect(setup().element.style.flexDirection).toBe('column-reverse')
  })

  it('muestra y borra los valores del instante bajo el cursor', () => {
    const { legend, setValues } = setup()
    setValues(at(0).getTime())
    expect(legend.textContent).toContain('2 mm · 45 m³/s')
    setValues(null)
    expect(legend.textContent).toBe('Observado')
  })

  it('pulsar una entrada avisa con su nombre', () => {
    const { legend, toggled } = setup()
    legend.querySelector('button')!.click()
    expect(toggled).toEqual(['Observado'])
  })
})

describe('renderLegend · grupos (legendGroup)', () => {
  const grouped = resolveSpec(
    {
      series: [
        {
          id: 'rain',
          name: 'Precipitación · Observado',
          legendLabel: 'Observado',
          legendGroup: 'Precipitación',
          type: 'bar',
          data: [[at(0), 2]],
          yAxis: 'p',
        },
        { id: 'flow', name: 'Observado', type: 'line', data: [[at(0), 45]], yAxis: 'q' },
      ],
      yAxes: [
        { id: 'p', unit: 'mm' },
        { id: 'q', unit: 'm³/s' },
      ],
      legend: 'bottom',
      legendValues: true,
    },
    fakeTokens(),
    fakeLocale,
  )

  it('las series sin grupo en la primera línea; cada grupo en la suya, con su título', () => {
    const legend = document.createElement('div')
    renderLegend(document.createElement('div'), legend, grouped, new Set(), () => {})
    const rows = [...legend.children] as HTMLElement[]
    expect(rows.map((row) => row.textContent)).toEqual(['Observado', 'PrecipitaciónObservado'])
    const title = rows[1]!.querySelector('span')!
    expect(rows[1]!.getAttribute('aria-labelledby')).toBe(title.id)
  })

  it('el botón muestra el texto corto, se anuncia con el nombre completo y oculta solo su serie', () => {
    const legend = document.createElement('div')
    const toggled: string[] = []
    const setValues = renderLegend(document.createElement('div'), legend, grouped, new Set(), (n) =>
      toggled.push(n),
    )
    const rainButton = legend.children[1]!.querySelector('button')!
    expect(rainButton.getAttribute('aria-label')).toBe('Precipitación · Observado')
    rainButton.click()
    expect(toggled).toEqual(['Precipitación · Observado'])
    // Los valores de cada línea, en su sitio: la lluvia en la segunda.
    setValues(at(0).getTime())
    expect(rainButton.textContent).toMatch(/2\smm/)
    expect(legend.children[0]!.textContent).toMatch(/45\sm³\/s/)
  })
})
