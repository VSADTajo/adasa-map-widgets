---
'@vsadtajo/adasa-ui': minor
---

Nuevo dominio de gráficas, `@vsadtajo/adasa-ui/charts`:

- **`ASChart`**: gráfica cartesiana con el mismo API para tres motores, que se eligen con `chart-library`:
  - ECharts, por defecto;
  - Chart.js;
  - ApexCharts, que requiere licencia comercial (ver `docs/adr/0001-motores-graficas.md`).

  Todos son `peerDependencies` opcionales y se cargan bajo demanda. Por props se configura:
  - de 1 a 4 ejes Y y paneles apilados con el eje X compartido;
  - umbrales e intervalos como anotaciones, coloreados por nivel de aviso;
  - línea "ahora", tooltip, zoom y exportación PNG;
  - leyenda HTML común a los tres motores, colocable con `legend="top|bottom|left|right"` y con los valores bajo el cursor (`legend-values`) como alternativa al tooltip;
  - `nativeOptions` como vía de escape.

  Usa los tokens del tema y el idioma activo (es-ES por defecto).
- **`ASHydrographChart`**: hidrograma para visores hidrológicos:
  - precipitación con el eje invertido arriba, y caudal o nivel abajo;
  - observado frente a previsto;
  - varias fuentes de previsión con bandas p10–p90 y p25–p75;
  - umbrales del punto de control;
  - precipitación alineada en su propio panel o superpuesta al caudal (`precipitation-layout`), colgando desde arriba o no (`precipitation-inverted`).

Además:

- `useResolvedTheme` acepta `fallback: null` para no forzar tema y heredar el de la página.
- Textos nuevos `chart.*` y `hydrograph.*` en es y en.
