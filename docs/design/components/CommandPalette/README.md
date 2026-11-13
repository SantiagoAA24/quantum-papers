Paleta de comandos que abre el atajo ⌘K: busca papers y temas o salta a una página sin usar el ratón.

**Props:** `groups` (grupos con `label` e `items` de `label`, `hint?`, `active?`), `defaultValue`, `placeholder`, `onChange`, `label`, `className`.

**Reglas**
- Ancho de 640px (máximo 100%), panel con borde `border` y radio `radius-lg`, sin sombra.
- El elemento activo lleva `>` en acento y fondo `bg-tag`: nunca dependas solo del color.
- Filas de al menos `touch-min`; los títulos van en sans y los metadatos (`hint`) en mono.
- Pensado para teclado: `↑↓` navegan, `↵` abre y `esc` cierra. El componente solo dibuja; el manejo de foco y teclas va en la página.
- La página debe dibujar el fondo atenuado (`bg-base` con opacidad) y devolver el foco al cerrar. En móvil no hay atajo: ábrela desde el botón de búsqueda.
