---
'@vsadtajo/adasa-ui': minor
---

Fechas y búsqueda en `@vsadtajo/adasa-ui/forms`:

- **`ASDatePicker`**: fecha (y hora con `with-time`) que se escribe con el formato corto del idioma o se elige en un calendario accesible (patrón "date picker dialog" de WAI-ARIA, manejo completo con teclado). Admite `min` y `max`, y marca como error lo que no es una fecha válida.
- **`ASDateRangePicker`**: periodo `{ start, end }` con periodos predefinidos configurables (`today`, `last24h`, `last7d`, `last30d`, `hydroYear` o propios) y calendario de inicio y fin, con hora opcional. Emite además `preset-selected`.
- **`ASSearchInput`**: buscador con sugerencias asíncronas de `fetchSuggestions(query, signal)`, con `debounce`, `min-chars`, cancelación de la petición anterior, grupos, resaltado de lo buscado y anuncio del estado para lectores de pantalla. Emite `select` y `submit`.
- **`hydrologicalYearStart(date)`**: inicio del año hidrológico (1 de octubre).
- **`useLocale()`** expone además `dateFnsLocale`, el locale de date-fns del idioma activo.
