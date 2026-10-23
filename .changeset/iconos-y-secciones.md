---
'@vsadtajo/adasa-ui': minor
---

Iconos de cualquier librería y secciones más completas en el layout.

- Toda prop de icono acepta un `IconValue`: un trazado SVG (`@mdi/js`), un componente de cualquier librería (Lucide, Font Awesome...) o `{ component, props }`, o un nombre (`'mdi:layers'`, `'mdi-layers'`) que traduce el resolvedor registrado con `provideIcons` (nuevo en la raíz, junto a `useIconResolver` e `isSvgPath`). Compatible: un trazado sigue funcionando igual.
- `ASIcon` gana la prop `icon` (cualquier `IconValue`); `path` queda obsoleta, pero sigue funcionando.
- `AppSection` gana `badge` (contador sobre el icono, incluido en el nombre accesible), `disabled` y `disabledReason` (visible y enfocable, con `aria-disabled`, pero no se abre) y `tooltip`. Las pintan `ASAppRail` y `ASAppMobileMenu`.
- `ASAppMobileMenu` ordena las secciones de abajo (`position: 'bottom'`) al final, como la barra de iconos.
- `ASAppRail` se desplaza si las secciones no caben en vertical.
