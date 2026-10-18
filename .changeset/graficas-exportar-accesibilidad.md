---
'@vsadtajo/adasa-ui': minor
---

Exportación y accesibilidad en todas las gráficas (`ASChart` y `ASHydrographChart`, con los tres motores):

- **Barra de herramientas** (`toolbar`):
  - descargar PNG, SVG y CSV;
  - restablecer zoom;
  - pantalla completa.

  `fileName` da nombre a los archivos.
- **Métodos expuestos** (tipo `ChartExposed`): `exportImage(format?)`, `exportData(options?)`, `download(format)`, `toggleFullscreen()`, además de los que ya había.
  - Las imágenes incluyen la leyenda.
  - El CSV usa los separadores del idioma (en español, `;` y coma decimal).
- **Accesibilidad**:
  - `aria-label` y descripción generadas: tipo, series, rango del eje X, extremos y umbrales. Se pueden sustituir con `ariaLabel` y `description`.
  - Recorrido con el teclado: flechas, Inicio/Fin, Re Pág/Av Pág, Intro para elegir el instante y Esc, con anuncios al lector de pantalla.
  - Tabla de datos alternativa oculta (`dataTable`).
  - Tramas opcionales para daltonismo (`patterns`).

Aviso: en `toolbar`, la opción `download` pasa a ser obsoleta y la sustituye `png`. Sigue funcionando: `download: false` oculta el PNG.

Además, la barra de herramientas pasa de `role="toolbar"` a `role="group"`, porque no implementa la navegación con flechas que exige `toolbar`. El nombre accesible por defecto cambia de "Gráfica: …" a "Gráfica de líneas: …".
