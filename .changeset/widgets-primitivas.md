---
'@vsadtajo/adasa-ui': minor
---

Cierre de la fase de primitivas y formularios: los widgets del mapa reutilizan las primitivas donde encajan, sin cambiar su API ni su aspecto.

- **`ASMapTimeControls` y `ASMapTimeRangeControls`**: sus botones (anterior, reproducir/pausar, siguiente y los de mover el inicio y el fin del rango) son ahora `ASIconButton`. Se ven igual: mismos iconos, tamaño, hover y anillo de foco.
- **`ASIconButton`**: nuevo slot `icon` para un SVG propio (p. ej. un icono de trazo), con lo que la prop `icon` pasa a ser opcional.
- **Fronteras entre dominios**: `map` puede importar de `forms` (ADR 0000). `forms` no tiene dependencias externas, así que `/map` sigue sin arrastrar ningún paquete ajeno a los mapas.

No se migran, porque las primitivas no les aportan nada sin cambiar su aspecto:
- `ASMapButtonToggle`: grupo segmentado con color de acento.
- `ASMapBasemapsSelector`: menú de miniaturas.
- `ASMapDayIntervalControls`: pastillas coloreadas por nivel de aviso.
- `ASMapLegend`: botón de plegar con flecha de texto.
