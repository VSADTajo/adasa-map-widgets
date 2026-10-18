---
'@vsadtajo/adasa-map-widgets': minor
---

Los widgets `ASMap*` heredan el tema de `provideTheme` cuando no reciben la prop `theme`. Sin `provideTheme` ni prop siguen siendo `'dark'`, como hasta ahora. Nuevo composable `useResolvedTheme` para resolver el tema de un componente.
