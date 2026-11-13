Botón de acción primaria: fondo `accent`, texto `on-accent`, mono de 15px con peso 500.

**Props:** `type` (`button` o `submit`), `disabled`, `onClick`, `children`.

**Reglas**
- Un solo botón primario por vista.
- Texto en minúsculas, y con el glifo `↵` cuando envía un formulario ("buscar ↵").
- Alto `control-md`, radio `radius-md`.
- El estado deshabilitado (opacidad al 50%) se añadió al implementar; el home no lo mostraba.
