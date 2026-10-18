import { formatDate, formatNumber } from '@/core/utils/format'
import type { ChartCsvOptions } from '@/charts/types/chart'
import type { ResolvedChartSpec, SpecLocale } from './resolveSpec'

/**
 * Los datos de una gráfica como tabla: una fila por valor de X y una
 * columna por serie (dos en las bandas: inferior y superior). Es la base
 * común del CSV (`exportData()`) y de la tabla alternativa para lectores de
 * pantalla, así que los dos cuentan lo mismo.
 */
export interface ChartDataTable {
  /** Cabecera de la columna X (título del eje, o "Fecha y hora" en ejes temporales). */
  xLabel: string
  columns: ChartDataColumn[]
  /** Ordenadas por X (en categorías, en el orden en que aparecen). */
  rows: { x: number | string; values: (number | null)[] }[]
}

export interface ChartDataColumn {
  seriesId: string
  /** Nombre de la serie (en bandas, con "inferior"/"superior"). */
  label: string
  /** Unidad del eje de la serie. */
  unit?: string
  /** Índice del eje Y de la serie, para formatear sus valores. */
  yAxisIndex: number
}

type Translate = SpecLocale['t']

/** Tabla con todos los datos de la gráfica (incluidas las series sin leyenda ni tooltip). */
export function chartDataTable(spec: ResolvedChartSpec, t: Translate): ChartDataTable {
  const columns: ChartDataColumn[] = []
  const lookups: Map<number | string, number | null>[] = []
  const xs: (number | string)[] = []
  const seen = new Set<number | string>()
  const addX = (x: number | string) => {
    if (seen.has(x)) return
    seen.add(x)
    xs.push(x)
  }

  for (const series of spec.series) {
    const base = {
      seriesId: series.id,
      unit: spec.yAxes[series.yAxisIndex]?.unit,
      yAxisIndex: series.yAxisIndex,
    }
    if (series.type === 'range') {
      columns.push(
        { ...base, label: t('chart.dataLower', { name: series.name }) },
        { ...base, label: t('chart.dataUpper', { name: series.name }) },
      )
      lookups.push(
        new Map(series.ranges.map(([x, low]) => [x, low])),
        new Map(series.ranges.map(([x, , high]) => [x, high])),
      )
      series.ranges.forEach(([x]) => addX(x))
    } else {
      columns.push({ ...base, label: series.name })
      lookups.push(new Map(series.points))
      series.points.forEach(([x]) => addX(x))
    }
  }

  // En categorías se respeta el orden de los datos; en el resto, de menor a mayor.
  if (spec.xAxis.type !== 'category') xs.sort((a, b) => Number(a) - Number(b))

  return {
    xLabel: spec.xAxis.label ?? t(spec.xAxis.type === 'time' ? 'chart.dataTime' : 'chart.dataX'),
    columns,
    rows: xs.map((x) => ({ x, values: lookups.map((lookup) => lookup.get(x) ?? null) })),
  }
}

/** Separador decimal del idioma (`,` en español, `.` en inglés). */
function decimalSeparatorOf(intlLocale: string): '.' | ',' {
  return formatNumber(1.5, { locale: intlLocale }).includes(',') ? ',' : '.'
}

/**
 * Celda de texto escapada según RFC 4180. Además, un texto que empieza por
 * `=`, `+`, `-` o `@` se precede de `'`: si no, Excel lo ejecutaría como
 * fórmula (inyección CSV con nombres de serie o categorías hostiles).
 */
function textCell(text: string, separator: string): string {
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
  return safe.includes(separator) || /["\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

/**
 * Los datos de la gráfica en CSV:
 *
 * - Una columna X y una por serie (dos en las bandas), con la unidad en la
 *   cabecera: `Caudal (m³/s)`.
 * - Separadores del idioma activo, para que Excel lo abra bien con doble
 *   clic: en español `;` entre columnas y coma decimal; en inglés `,` y punto.
 * - Fechas en hora local como `aaaa-mm-dd hh:mm` (con segundos si alguno
 *   los tiene): las entiende cualquier hoja de cálculo y se ordenan como texto.
 * - Números sin separador de miles y con hasta 6 decimales; huecos vacíos.
 * - Filas separadas con CRLF (RFC 4180).
 */
export function chartToCsv(
  spec: ResolvedChartSpec,
  t: Translate,
  options: ChartCsvOptions = {},
): string {
  const table = chartDataTable(spec, t)
  const decimal = options.decimalSeparator ?? decimalSeparatorOf(spec.intlLocale)
  const separator = options.separator ?? (decimal === ',' ? ';' : ',')
  if (separator === decimal) {
    throw new Error('[ASChart] El separador de columnas no puede ser el separador decimal.')
  }

  const number = (value: number | null) =>
    value === null || !Number.isFinite(value)
      ? ''
      : formatNumber(value, {
          locale: 'en-US',
          useGrouping: false,
          maximumFractionDigits: 6,
        }).replace('.', decimal)

  const withSeconds =
    spec.xAxis.type === 'time' && table.rows.some(({ x }) => Number(x) % 60_000 !== 0)
  const pattern = withSeconds ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd HH:mm'
  const xCell = (x: number | string) =>
    spec.xAxis.type === 'time'
      ? formatDate(Number(x), { pattern })
      : spec.xAxis.type === 'value'
        ? number(Number(x))
        : textCell(String(x), separator)

  const header = [
    textCell(table.xLabel, separator),
    ...table.columns.map((column) =>
      textCell(column.unit ? `${column.label} (${column.unit})` : column.label, separator),
    ),
  ]
  const rows = table.rows.map(({ x, values }) => [xCell(x), ...values.map(number)])
  return [header, ...rows].map((cells) => cells.join(separator)).join('\r\n')
}
