---
'@vsadtajo/adasa-ui': minor
---

Tokens de diseño corporativos. Se mantienen los tokens existentes y se añaden:

- Escala tipográfica, espaciados (`--as-space-*`), radios, sombras y capas (`--as-z-*`).
- Paletas de datos: categórica de 8 colores validada para daltonismo, secuencial, divergente, rejilla y eje.
- Niveles de aviso (`--as-alert-normal|amarillo|naranja|rojo`, con variantes `-text` y `-strong`).
- Todo en claro y oscuro con `light-dark()` (requiere Chrome/Edge 123, Firefox 120 o Safari 17.5) y con contraste WCAG AA verificado por test.
- Nuevos `readTokens()` y `useTokens()` para leer los valores resueltos desde JS (p. ej. para motores de gráficas).
- Clase nueva `.as-light` para forzar el tema claro en un subárbol.

`ASMapDayIntervalControls` usa ahora los tokens de aviso por defecto. Dos cambios visibles, para cumplir contraste AA del texto:

- El texto sobre naranja pasa de blanco a casi negro.
- El rojo pasa de `#e53935` a `#d32f2f`.

Los widgets `ASMap*` usan `--as-z-map-control` (mismo valor, 1000).
