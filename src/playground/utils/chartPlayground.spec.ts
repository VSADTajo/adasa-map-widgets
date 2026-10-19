import { describe, expect, it } from 'vitest'
import { chartToProps, chartToSnippet } from './chartPlayground'

const values = {
  chartLibrary: 'echarts',
  height: 360,
  axisCount: 2,
  s1Name: 'Caudal',
  s1Color: '#111111',
  s1Axis: '1',
  s2Name: 'Nivel',
  s2Color: '#222222',
  s2Axis: '2',
  s3Name: 'Lluvia',
  s3Color: '#333333',
  s3Axis: '3',
}

describe('chartPlayground', () => {
  it('genera tantos ejes como se piden y lleva al último las series de ejes que no existen', () => {
    const props = chartToProps(values) as { yAxes: { id: string }[]; series: { yAxis: string }[] }
    expect(props.yAxes.map((a) => a.id)).toEqual(['y1', 'y2'])
    expect(props.series.map((s) => s.yAxis)).toEqual(['y1', 'y2', 'y2'])
  })

  it('aplica nombre y color de cada serie y no pasa los controles del playground al componente', () => {
    const props = chartToProps(values) as Record<string, unknown> & {
      series: { name: string; color: string }[]
    }
    expect(props.series[0]).toMatchObject({ name: 'Caudal', color: '#111111' })
    expect(props).not.toHaveProperty('axisCount')
    expect(props).not.toHaveProperty('s1Name')
  })

  it('el código de ejemplo refleja series y ejes', () => {
    const code = chartToSnippet(values)
    expect(code).toContain(
      "name: 'Lluvia', type: 'bar', data: lluvia, color: '#333333', yAxis: 'y2'",
    )
    expect(code).not.toContain("id: 'y3'")
  })
})
