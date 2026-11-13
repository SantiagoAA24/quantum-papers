Fila de resultado de búsqueda: posición, título del paper, tema y una barra que representa la similitud.

**Props:** `rank`, `title`, `topic` (sin el `#`), `similarity` (de 0 a 1).

**Reglas**
- Va dentro de `SearchPanel`; es un `<li>`.
- La barra es decorativa (`aria-hidden`): no pongas el valor numérico solo ahí.
- Título en `result-title`; posición en `mono-sm`; tema en `mono-xs` con `accent`.
- Los resultados llegan ordenados de mayor a menor similitud.
