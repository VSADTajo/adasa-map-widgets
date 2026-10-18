---
'@vsadtajo/adasa-ui': patch
---

`ASMapScale` (modo `bar`), dos arreglos:

- **La regla mide exactamente la distancia que indica.** Antes el ancho calculado se aplicaba al recuadro, y su relleno y bordes acortaban la regla unos 14 px, así que la escala mostrada era incorrecta.
- **Las etiquetas ya no se solapan** (p. ej. "0255075100 km" con reglas cortas). Cada etiqueta se coloca en su marca y solo se muestran las que caben: todas, una de cada dos, solo los extremos o, en el caso más estrecho, solo la final con la unidad.
