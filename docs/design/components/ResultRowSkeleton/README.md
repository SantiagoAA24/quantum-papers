Fila esqueleto con la misma estructura que `ResultRow`, para el fallback de Suspense.

**Props:** `titleWidth` (ancho máximo del título, por defecto `60%`).

**Reglas**
- Varía `titleWidth` entre filas para que no parezca una tabla.
- Sin animación: los bloques usan el color `border`.
- Va oculta a lectores de pantalla (`aria-hidden`); anuncia el estado de carga en el contenedor.
