---
'@vsadtajo/adasa-ui': minor
---

Idioma y formateo compartidos (sin vue-i18n):

- `provideLocale` / `useLocale`: textos de interfaz de la librería en español (por defecto) e inglés. Otros idiomas (ca, eu, gl...) los define el proyecto, y las claves que no traduzca caen al español.
- Formateadores `formatNumber`, `formatDate` (presets de Intl, opciones de Intl o patrones de date-fns), `formatDuration` y `formatUnit` (`m³/s`, `mm`, `hm³`, `m`, `%`, `°C`). Se pueden usar como funciones puras o ligados al idioma activo desde `useLocale()`.
- Todos los widgets toman sus textos y etiquetas accesibles de las claves de idioma. Por defecto muestran los mismos textos que antes.

**Cambio visible:** los controles de tiempo mostraban los meses en inglés ("18 Oct 2026") porque date-fns se usaba sin locale. Ahora siguen el idioma activo: "18 oct 2026" en español.

Los props `title` de `ASMapDayIntervalControls` y `ASMapLegend` pasan a no tener valor por defecto: si no se pasan, usan el texto traducido ("Avisos" / "Leyenda" en español).
