---
'@vsadtajo/adasa-ui': patch
---

`ASMap`: un `center` o `zoom` cambiado desde el proyecto (`v-model`) ya no se vuelve a emitir. Leaflet ajusta el centro a la rejilla de píxeles, y el `update:center` que salía pisaba el valor recién puesto con otro ligeramente distinto. Ahora ese movimiento se aplica sin animación y solo se emiten los movimientos del usuario.
