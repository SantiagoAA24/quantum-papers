# QuantumPapers

Búsqueda semántica sobre papers de ML cuántico.

Este sistema describe la dirección **Laboratorio**: oscuro, técnico y de una sola tinta. Nació de la opción B del home, elegida entre tres propuestas (editorial, laboratorio y bloques). Todos los valores salen de ese home; lo que no estaba allí está marcado como pendiente al final.

## Principios

- **Un solo acento.** El turquesa (`accent`) marca lo interactivo y los datos que importan; nada más lleva color.
- **Mono para lo que es del sistema, grotesk para lo que se lee.** Controles, metadatos y etiquetas van en JetBrains Mono; títulos y nombres de papers, en Space Grotesk.
- **Líneas, no sombras.** La profundidad se logra con `bg-panel` y bordes de 1px (`border`). No hay sombras ni degradados.
- **Datos reales o `[placeholder]`.** Lo que aún no se sabe (autores, año, id de arXiv) se escribe entre corchetes.

## Fundamentos de contenido

- **Idioma:** la interfaz va en español, tuteando ("Pregunta con tus palabras"). Los títulos de los papers se muestran en su idioma original (casi siempre inglés).
- **Etiquetas de sistema** en minúsculas y con guion bajo, como si fueran identificadores: `cómo_funciona`, `ver_todos →`, `quantum_papers`.
- **Kicker** con prefijo de comentario: `// búsqueda semántica sobre papers de arXiv`.
- **Titulares** en dos frases cortas; la segunda va en `accent`: "Pregunta con tus palabras. **Obtén los papers más cercanos.**"
- **Temas** como hashtags en minúsculas: `#vqc`, `#barren-plateaus`, `#corrección-de-errores`.
- Sin emojis, sin signos de exclamación.

## Fundamentos visuales

- **Fondo:** `bg-base` con una cuadrícula de 48px (`grid-line`). Es la firma del sistema.
- **Superficies:** el panel de búsqueda usa `bg-panel`, borde `border` y `radius-lg`. Las filas no tienen caja: solo una línea inferior, y `bg-panel` al pasar el cursor.
- **Tipografía:** `display` solo en el hero; `heading` para secciones; `title` y `result-title` para papers; el resto es mono (`mono-*`).
- **Radios:** `radius-md` en botones y tags, `radius-lg` en paneles, `radius-xs` en la barra de similitud.
- **Densidad:** filas de 18px de padding vertical en tablas y 14px en resultados (excepciones del origen que no están en la escala de espaciado). Objetivos táctiles de al menos `touch-min`.
- **Layout de página:** header, hero (kicker, h1, SearchPanel), sección "Papers destacados" como tabla, sección "Temas" como tags y pie de página. Contenido a `container-max`.
- **Estados:** hover con `bg-panel`; el foco usa un contorno de 2px en `text` (se añadió al implementar los componentes, no estaba en el home).

## Iconografía

No hay librería de iconos. El sistema usa glifos de texto: `>` y `$` como prompts en `accent`, `→` en enlaces, `↵` dentro del botón de buscar y `⌘K` en un chip decorativo. La barra de similitud es decorativa y va con `aria-hidden`.

## Reglas de uso

- El texto sobre `bg-base` o `bg-panel` es `text` o `text-muted`. Sobre `accent` solo `on-accent`.
- `accent` no se usa como fondo de áreas grandes, solo en botones, barras y pequeños acentos de texto.
- `border` es decorativo: un control que necesite límite visible debe apoyarse además en `bg-panel` o en el foco.
- Un botón primario por vista.
- Espaciado y radios siempre desde los tokens (`space-*`, `radius-*`); no valores sueltos.

## Mapeo a shadcn/ui (Next.js + Tailwind)

| Variable shadcn | Token |
|---|---|
| `--background` | `bg-base` |
| `--card` / `--popover` | `bg-panel` |
| `--border` / `--input` | `border` |
| `--foreground` | `text` |
| `--muted-foreground` | `text-muted` |
| `--primary` | `accent` |
| `--primary-foreground` | `on-accent` |
| `--radius` | `radius-md` |

## Responsive

Un único punto de corte, 640px. Por debajo, `SiteHeader` pasa a botón de menú, el botón de `SearchPanel` ocupa su propia fila, y `ResultRow` y `PaperRow` ponen el título en una línea completa con tema y similitud debajo. Los demás componentes ya envuelven de forma fluida.

## Componentes

`Button`, `TextLink`, `SearchPanel`, `ResultRow`, `PaperRow`, `TopicTag` y `SiteHeader`, más `Panel`, `DataList`, `Breadcrumb`, `Kicker`, `Checkbox`, `Radio`, `TextField`, `FilterGroup`, `Pagination`, `ResultRowSkeleton`, `SiteFooter` y `CommandPalette`. Todos con vista previa y guía.

Textos de lectura: `display-md` (56px, fluido) para el H1 de detalle y `body` (18px/1.6) para abstract y resumen.

## Pendiente

- Tema claro (hoy solo existe el oscuro).
- Estados vacío y error de la búsqueda (el estado cargando ya existe como `ResultRowSkeleton`).
- Elegir una librería de iconos si hacen falta más allá de los glifos.
- Tablas y encabezados de columna como componente (hoy solo existe la fila).
