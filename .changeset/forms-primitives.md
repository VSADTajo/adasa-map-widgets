---
'@vsadtajo/adasa-ui': minor
---

Nuevo dominio de formularios, `@vsadtajo/adasa-ui/forms`, con las primitivas de formulario sin framework de UI. Todas son controladas (`v-model`), accesibles (etiqueta asociada, ayuda y error en `aria-describedby`, foco visible y teclado) y toman los colores de los tokens.

- **`ASButton`**: variantes `primary`, `secondary`, `ghost` y `danger`, tamaños `sm`/`md`/`lg`, icono y `loading` (mantiene el foco y el ancho, `aria-busy`).
- **`ASIconButton`**: botón solo con icono, con `label` obligatorio; con `pressed`, interruptor (`v-model:pressed`).
- **`ASInput`**: etiqueta, ayuda, error, iconos o slots a los lados, unidad, botón de borrar y `type="number"` con coma decimal.
- **`ASSelect`**: combobox WAI-ARIA con búsqueda, selección múltiple con chips, opciones agrupadas y teclado completo.
- **`ASCheckbox`** (booleano o grupo, indeterminado), **`ASSwitch`** y **`ASRadioGroup`**.
- **`ASFormField`**: etiqueta, ayuda y error para controles propios del proyecto.

En la raíz:

- **`ASIcon`**: los iconos son trazados SVG en el formato de `@mdi/js`, sin depender de él (ver "Iconos" en el README).
- Tokens `--as-color-danger-contrast` y `--as-control-height-sm/md/lg`, también en `readTokens()`.
