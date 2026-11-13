Cabecera del sitio: wordmark `> quantum_papers`, navegación en mono y un chip decorativo de atajo (⌘K).

**Props:** `links` (lista de `{label, href}`; por defecto papers, temas, autores y cómo_funciona), `homeHref`.

**Reglas**
- Línea inferior de 1px (`border`) y `space-4` de padding vertical.
- Enlaces del nav en `text-muted`, `mono-nav`, con alto `touch-min` y `space-7` entre ellos.
- El `>` del wordmark va en `accent`.
- El chip ⌘K es decorativo (`aria-hidden`); si se implementa el atajo, debe haber una alternativa visible para abrir el buscador.

**Móvil**
- Por debajo de 640px (o con `compact`) la navegación y el chip ⌘K se ocultan y aparece un botón `menú`/`cerrar` de 44px.
- Abierto, los enlaces se apilan a ancho completo con una línea superior; `open` y `onMenuClick` permiten controlarlo desde fuera.
