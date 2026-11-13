Ruta de navegación en mono 14px separada por `/`. El último elemento es la página actual, sin enlace.

**Props:** `items` (`label`, `href?`), `className`.

**Reglas**
- Los enlaces miden al menos `touch-min` de alto.
- La página actual usa `aria-current="page"` y color `text`.
