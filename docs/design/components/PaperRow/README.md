Fila de la tabla de papers: índice, título, tema, año e id de arXiv; toda la fila es un enlace.

**Props:** `index`, `title`, `topic` (sin el `#`), `year` (por defecto `[año]`), `arxiv` (por defecto `[arXiv:id]`), `href`.

**Reglas**
- Columnas: índice 32px, título flexible, tema 150px, año 64px y arXiv 120px; en pantallas estrechas envuelven.
- Solo línea inferior (`border`); `bg-panel` al pasar el cursor.
- Los datos que aún no se conocen se muestran entre corchetes.
- Sobre la tabla va un encabezado en `mono-xs` y mayúsculas (todavía no es un componente).
