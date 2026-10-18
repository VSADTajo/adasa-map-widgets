---
'@vsadtajo/adasa-ui': minor
---

**Cambio incompatible.** El paquete se renombra de `@vsadtajo/adasa-map-widgets` a `@vsadtajo/adasa-ui` y se organiza por dominios con un subpath por dominio (ver `docs/adr/0000-estructura-paquete.md`):

- `@vsadtajo/adasa-ui`: solo `core` (`provideTheme`, `useTheme`, `useResolvedTheme`, `useClickOutside`, tipos de tema).
- `@vsadtajo/adasa-ui/map`: `ASMap`, los widgets `ASMap*`, capas, leyendas y sus tipos. Ya no se exportan desde la raíz.
- Las variables CSS pasan de `--amw-*` a `--as-*`, y las clases de `amw-*` a `as-*` (la clase de tema oscuro es ahora `as-dark`).
- Los tipos internos del playground (`WidgetRegistryEntry`, `WidgetPlacement`...) dejan de ser API pública. `MapLibraryOption` se exporta desde `/map`.
