import { useLocale } from '@/core/composables/useLocale'
import type { MessageKey } from '@/core/i18n/messages'
import type { AlertLevel } from '@/core/types/theme'

/**
 * Formatos comunes de las tarjetas hidrológicas, ligados al idioma activo:
 * valores con su unidad, fechas e instantes, y nombres de nivel.
 */
export function useMeasureFormat() {
  const { t, formatNumber, formatUnit, formatDate } = useLocale()
  return {
    t,
    /** "12,4 m³/s" (o solo el número sin unidad). */
    value: (value: number | null | undefined, unit?: string) =>
      unit ? formatUnit(value, unit) : formatNumber(value),
    /** "19/10/2026, 06:00". */
    dateTime: (date: Date) => formatDate(date, 'datetime'),
    /** "06:00". */
    time: (date: Date) => formatDate(date, 'time'),
    /** "19 oct, 06:00". */
    dateTimeShort: (date: Date) => formatDate(date, 'datetimeShort'),
    /** "Naranja". */
    levelName: (level: AlertLevel) => t(`detail.level.${level}` as MessageKey),
  }
}
