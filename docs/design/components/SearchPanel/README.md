Panel de búsqueda estilo línea de comandos: prompt `$` en `accent`, input mono de 18px y botón primario; con `children` muestra debajo una lista de resultados.

**Props:** `id`, `label` (etiqueta accesible, por defecto "Consulta"), `defaultValue`, `placeholder`, `buttonLabel` (por defecto "buscar ↵"), `resultsLabel`, `onChange`, `onSubmit`, `children` (filas `ResultRow`).

**Reglas**
- Fondo `bg-panel`, borde `border`, radio `radius-lg`, ancho máximo de 960px.
- El input es de tipo `search` y siempre tiene su `<label>`, aunque no se vea.
- Si hay resultados, la etiqueta superior dice cómo están ordenados.
- Es el elemento central del hero: va a `space-12` por debajo del h1.
