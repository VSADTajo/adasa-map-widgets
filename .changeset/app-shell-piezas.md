---
'@vsadtajo/adasa-ui': minor
---

`ASAppShell` dividido en piezas públicas y documentadas, al estilo del `MainLayout` de los visores SAIH. La API de `ASAppShell` no cambia.

- **Piezas extraídas**: `ASAppDrawer` (panel de sección que empuja el contenido), `ASAppDetailPanel` (detalle por la derecha), `ASAppBottomSheet` (panel móvil con asa) y `ASAppMobileMenu` (secciones encima de la barra móvil). Se pueden usar sueltas para montar un layout propio.
- **Piezas nuevas de la barra**:
  - `ASAppBrand`: logos, nombre y subtítulo; se reduce sola en móvil.
  - `ASAppSearch`: el buscador de la barra, sobre `ASSearchInput`.
  - `ASAppUserMenu`: avatar, nombre y correo, tema oscuro e idioma (con `provideTheme`/`provideLocale` o `v-model`) y "Cerrar sesión" (evento `logout`).
- **`useAppShellContext()`**: las piezas de los slots saben si el shell está en móvil.
- **`ASSearchInput`**:
  - por sugerencia: `tags` (con el color de texto que contrasta), `actions` (evento `suggestion-action`; Mayús + Intro ejecuta la primera) y `unavailable` con `unavailableReason`;
  - slot `#suggestion` y `hide-label` (también en `ASFormField`).
- **`ASMenu`**: slots `#trigger` (contenido del botón) y `#header` (cabecera fija del menú).
