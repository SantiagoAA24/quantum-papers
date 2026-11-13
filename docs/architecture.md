# QuantumPapers: arquitectura y plan de implementación

Nov 12, 2026 · @Santiago Acevedo

## Visión y alcance

QuantumPapers es un buscador semántico de papers de aprendizaje automático cuántico de arXiv, construido con Next.js para demostrar, en una aplicación real, cuándo y por qué usar SSG, ISR y SSR. El diseño ya está terminado; este documento cubre cómo se construye.

**Dentro del alcance**

- Búsqueda semántica con streaming, filtros por tema, año y orden, guardados en la URL.
- Catálogo navegable: papers, autores y temas, cada uno con su página indexable.
- Ingesta automática desde arXiv con embeddings y un resumen con IA por paper.
- Páginas de proyecto: `/how-it-works` y `/about`, más los estados de vacío, error y 404.
- Paleta de comandos ⌘K y versión móvil a 390px.

**Fuera del alcance**

- Cuentas de usuario, favoritos o historial persistente.
- Chat o RAG conversacional sobre los papers.
- Tema claro e internacionalización: la interfaz es solo en español, los abstracts quedan en su idioma original.

**Criterios de éxito para el portafolio**

- El HTML de `/`, `/papers/[id]` y las páginas de autor y tema llega completo con JavaScript desactivado.
- Lighthouse en producción con 90 o más en rendimiento, accesibilidad, mejores prácticas y SEO en `/` y `/papers/[id]`. Es una meta; los valores reales se publican en `/how-it-works`.
- CI verde en cada PR: tipos, pruebas, e2e y Lighthouse.
- Un README que compara la misma página renderizada en cliente frente a servidor, con métricas.

## Decisiones de arquitectura

Una sola aplicación Next.js con App Router sirve toda la web, y un script de Python aparte alimenta la base de datos. Eso mantiene un solo servicio en producción, además de la base de datos.

| Capa | Decisión | Por qué | Descartado |
| --- | --- | --- | --- |
| Web | Next.js (App Router) + TypeScript estricto | Server Components, `generateMetadata` y streaming con Suspense son el núcleo de la demo de SSR | Pages Router: no permite streaming por componente |
| Estilos | CSS del sistema de diseño + Tailwind v4 para maquetación; shadcn/ui solo para la paleta de comandos | Los componentes ya están diseñados; shadcn aporta accesibilidad de teclado donde hace falta | Reestilizar shadcn completo: duplica trabajo ya hecho |
| Datos | Postgres con pgvector en Neon | Vectores y metadatos en una sola base, sin otro servicio | Pinecone: un servicio más sin necesidad a esta escala |
| ORM | Drizzle | Esquema en TypeScript y SQL visible; permite escribir la consulta vectorial a mano | Prisma: la consulta con `<=>` queda fuera de su API tipada |
| Ingesta | Script de Python con CLI | Ecosistema de ML y experiencia previa; corre como tarea programada | FastAPI permanente: no hace falta un servidor que solo se usa de noche |
| Embeddings y resumen | OpenAI o Azure OpenAI, modelo por decidir | Experiencia previa con ambos | Modelo local: más infraestructura para el mismo resultado |
| Pruebas | Vitest, Playwright, axe y Lighthouse CI | Cubren lógica, HTML sin JavaScript, accesibilidad y rendimiento | Solo pruebas manuales |
| Despliegue | Vercel + Neon, ingesta en GitHub Actions | ISR y revalidación bajo demanda funcionan de forma nativa en Vercel | Servidor propio: pierde ISR gestionado |

La decisión más importante es no tener una API separada: las páginas leen la base de datos directamente desde Server Components, y solo `/api/revalidate` es un endpoint público.

## Mapa de rutas y estrategia de render

Cada ruta usa la estrategia más barata que cumple su necesidad de frescura: lo estático se genera una vez, el catálogo se revalida, y solo la búsqueda se renderiza en cada petición.

| Ruta | Estrategia | Datos y caché | Diseño |
| --- | --- | --- | --- |
| `/` | SSG | Destacados y temas se leen al construir; se regenera con cada despliegue | Home (opción B) |
| `/search` | SSR + streaming | `searchParams` (`q`, `tema`, `desde`, `hasta`, `orden`); Suspense con `ResultRowSkeleton`; `noindex` | Resultados, cargando, vacío, error |
| `/papers/page/[n]` | ISR | Listado paginado; `revalidate` de 1 hora | Listado (reutiliza Resultados) |
| `/papers/[id]` | ISR | `generateStaticParams` para los más recientes; `revalidate` de 1 hora y revalidación bajo demanda; `notFound()` si no existe | Detalle y 404 |
| `/authors/[slug]` | ISR | Papers del autor; mismo `revalidate` | Listado |
| `/topics/[slug]` | ISR | Papers del tema; mismo `revalidate` | Listado |
| `/about`, `/how-it-works` | SSG | Contenido fijo; las métricas se actualizan a mano tras cada medición | About, Cómo funciona |
| `/sitemap.xml`, `/robots.txt` | Generadas | `sitemap.ts` lee los identificadores de la base | n/a |
| `/api/revalidate` | Route Handler | `POST` con secreto; llama a `revalidatePath` y `revalidateTag` | n/a |

Dos decisiones que conviene fijar desde el principio:

- **La paginación del catálogo va en la ruta** (`/papers/page/2`), no en `?page=`. Leer `searchParams` obliga a renderizar en cada petición y haría perder el ISR.
- **La búsqueda sí usa la URL como estado.** Es el caso donde SSR se justifica, y compartir un enlace de búsqueda reproduce el resultado.

## Estructura del repositorio

Un solo repositorio con dos programas independientes, `web` e `ingest`, que solo comparten la base de datos.

```text
quantum-papers/
├─ CLAUDE.md                 # reglas para Claude Code
├─ README.md
├─ docs/
│  ├─ architecture.md        # este plan, en el repo
│  └─ design/                # tokens.json, bundle.js, bundle.css, index.d.ts y capturas
├─ web/
│  ├─ src/app/               # rutas (App Router)
│  ├─ src/components/
│  │  ├─ qp/                 # componentes del sistema de diseño
│  │  └─ ui/                 # shadcn/ui (solo Command)
│  ├─ src/db/                # schema.ts, migraciones, cliente
│  ├─ src/lib/               # search, papers, seo, format
│  ├─ src/styles/            # tokens.css, components.css
│  └─ tests/                 # unitarias y e2e
├─ ingest/
│  ├─ pyproject.toml
│  └─ src/ingest/            # arxiv.py, embed.py, summarize.py, store.py, cli.py
└─ .github/workflows/        # ci.yml, ingest.yml
```

**Convenciones**

- Los componentes de `qp/` son Server Components salvo los marcados `'use client'` por necesidad de estado o teclado.
- El acceso a datos vive solo en `src/lib/` y `src/db/`; las páginas no escriben SQL.
- Un nombre de componente igual al del sistema de diseño, y sus props igual a `index.d.ts`.
- Texto de interfaz en español; código, nombres y commits en inglés.

## Modelo de datos

Cinco tablas bastan: los papers llevan el vector y el resumen, y autores y temas se relacionan con tablas puente.

| Tabla | Campos clave | Notas |
| --- | --- | --- |
| `papers` | `id`, `arxiv_id` (único), `title`, `abstract`, `published_at`, `updated_at`, `version`, `primary_category`, `doi`, `pdf_url`, `ai_summary` (JSON: problema, método, resultado, modelo, fecha), `embedding` (vector de 1536 dimensiones) | `arxiv_id` hace idempotente la ingesta |
| `authors` | `id`, `slug` (único), `name` | El `slug` se deriva del nombre |
| `paper_authors` | `paper_id`, `author_id`, `position` | Conserva el orden de autores |
| `topics` | `id`, `slug` (único), `label` | Los temas salen de la categoría y de términos frecuentes |
| `paper_topics` | `paper_id`, `topic_id` | Un paper puede tener varios temas |

Los 1536 de la dimensión corresponden a `text-embedding-3-small` de OpenAI; si se elige otro modelo, cambia la dimensión y hay que recalcular todos los vectores.

**Índices**

- `papers.arxiv_id`: único.
- `papers.embedding`: HNSW con `vector_cosine_ops`.
- `paper_topics(topic_id, paper_id)` y `paper_authors(author_id, paper_id)` para las páginas de tema y autor.

**Consulta de búsqueda.** Se escribe a mano en SQL, no con el generador del ORM:

```sql
SELECT p.id, p.arxiv_id, p.title,
       1 - (p.embedding <=> $1) AS similarity
FROM papers p
WHERE ($2::int IS NULL OR extract(year FROM p.published_at) >= $2)
  AND ($3::int IS NULL OR extract(year FROM p.published_at) <= $3)
ORDER BY p.embedding <=> $1
LIMIT 20 OFFSET $4;
```

Con filtros, el índice HNSW puede devolver menos filas de las pedidas porque filtra después de recorrer el índice. Hay que comprobar en la versión de pgvector de Neon si está disponible `hnsw.iterative_scan` (pgvector 0.8 en adelante) y, si no, subir `hnsw.ef_search`.

## Flujos de datos

Hay dos caminos independientes. La **ingesta** se ejecuta por lotes desde GitHub Actions: pide papers a arXiv, calcula el embedding de título y resumen, genera el resumen con IA y hace upsert en Postgres. La **búsqueda** ocurre en cada petición a `/search`: el servidor convierte la consulta en un vector, ordena por distancia coseno en Postgres y envía la página con esqueletos que se reemplazan por los resultados mediante streaming.

&#91;embedded content: flujos de datos · ingesta y búsqueda\]

Los dos flujos solo comparten la base de datos: la ingesta es un proceso por lotes que escribe, y la búsqueda es una petición en vivo que solo lee.

## Del sistema de diseño al código

La vía más corta y fiel es portar el sistema tal como está: los tokens pasan a variables CSS, el CSS de los componentes se copia casi sin cambios, y cada componente se reescribe como TSX tipado con las props de `index.d.ts`. Tailwind queda para maquetar páginas, no para redefinir componentes.

**Antes de empezar:** Claude Code no puede abrir los enlaces de diseño, así que los archivos del sistema (`tokens.json`, `bundle.js`, `bundle.css`, `index.d.ts` y los README de cada componente) se descargan y se guardan en `docs/design/`.

| Pieza del sistema | En el código |
| --- | --- |
| `tokens.json` | `src/styles/tokens.css` con las variables (`--bg-base`, `--accent`, `--space-*`, `--radius-*`) y `@theme` de Tailwind v4 apuntando a ellas |
| Tipografías | `next/font` para Space Grotesk y JetBrains Mono, expuestas como `--font-sans` y `--font-mono` |
| `bundle.css` | `src/styles/components.css`, con las clases `qp-*` y las reglas a 640px |
| Componentes sin estado: `Panel`, `DataList`, `Breadcrumb`, `Kicker`, `TopicTag`, `TextLink`, `Button`, `ResultRow`, `PaperRow`, `ResultRowSkeleton`, `Pagination`, `SiteFooter` | Server Components en `src/components/qp/` |
| `SiteHeader` | Client Component: gestiona el menú móvil |
| `SearchPanel` y los filtros (`FilterGroup`, `Checkbox`, `Radio`, `TextField`) | Client Components que escriben los parámetros en la URL |
| `CommandPalette` | Client Component sobre `Command` de shadcn/ui (cmdk) con el atajo ⌘K; se estiliza con las clases `qp-cmd` |

Regla de fidelidad: cada pantalla del diseño se compara con su captura antes de darla por terminada. Los puntos del diseño que no son componentes (el desplegable de filtros del móvil, los bloques de contenido de `/how-it-works` y `/about`) se escriben como marcado en la página.

**Fuentes de diseño**

- [Sistema de diseño](https://claude.ai/artifact/9efHAparu8zAscz6sRuPzY)
- [Pantallas de escritorio](https://claude.ai/artifact/Q2XhRzN2o7VT6i8Y1k7Vi2): detalle, resultados, cargando, `/how-it-works`, `/about` y paleta ⌘K
- [Estados](https://claude.ai/artifact/BrXS7RKE2jhZv5YU6ChwkZ): sin resultados, error y 404
- [Versión móvil](https://claude.ai/artifact/A5fYHCzB4JavWoqVUcKasR)
- [Home, tres opciones](https://claude.ai/artifact/AvS2i38dc4w8JipYiYMeJJ): la opción B es la elegida

## SEO, rendimiento y accesibilidad

Estas tres cosas son el producto de la demo, así que se verifican con pruebas automáticas desde la primera página, no al final.

| Qué | Dónde | Cómo se verifica |
| --- | --- | --- |
| Metadatos únicos por página | `generateMetadata` en cada ruta; `canonical` y `robots` | Prueba e2e que lee `<title>` y `<meta>` del HTML |
| Imagen Open Graph | `opengraph-image.tsx` por paper, con título y tema | Revisión manual con un depurador de enlaces |
| Datos estructurados | JSON-LD `ScholarlyArticle` en `/papers/[id]`; `Person` en `/about` | Prueba que analiza el `<script type="application/ld+json">` |
| Indexación | `sitemap.ts`, `robots.ts`; `noindex` en `/search` y en el 404 | Prueba e2e sobre `/sitemap.xml` y las cabeceras |
| HTML sin JavaScript | Contenido completo en el HTML inicial de las rutas ISR y SSG | Playwright con JavaScript desactivado comprueba que el título y el resumen están presentes |
| Rendimiento | Presupuestos de LCP, TTFB y CLS fijados tras la primera medición | Lighthouse CI en cada PR, con fallo si se supera el presupuesto |
| Accesibilidad | Etiquetas visibles, foco visible, objetivos de 44px | axe con Playwright en cada pantalla, más revisión de teclado en la paleta ⌘K |

Una nota del diseño: el color `border` es decorativo y tiene poco contraste. Los campos de texto dependen del contorno de foco y de su etiqueta visible; no hay que usar `border` como único límite de un control.

## Despliegue y entornos

La web se despliega en Vercel, la base de datos vive en Neon y la ingesta corre como tarea programada de GitHub Actions, que al terminar avisa a la web para revalidar.

| Entorno | Web | Base de datos | Ingesta |
| --- | --- | --- | --- |
| Local | `next dev` | Postgres con pgvector en Docker, o una rama de Neon | CLI manual con un límite de papers |
| Preview (por PR) | Despliegue de vista previa de Vercel | Rama de Neon por PR, con datos de ejemplo | No corre |
| Producción | Vercel, rama `main` | Neon, rama principal | Tarea programada diaria y ejecución manual |

**Variables de entorno**

| Variable | Quién la usa | Para qué |
| --- | --- | --- |
| `DATABASE_URL` | web e ingesta | Conexión a Postgres |
| `OPENAI_API_KEY` (o las de Azure OpenAI) | web e ingesta | Embeddings de la consulta y de los papers, y resúmenes |
| `REVALIDATE_SECRET` | web e ingesta | Autoriza `POST /api/revalidate` |
| `NEXT_PUBLIC_SITE_URL` | web | URL canónica, sitemap y Open Graph |

Ninguna clave se guarda en el repositorio; se cargan en Vercel y en los secretos de GitHub, y `.env.example` documenta los nombres.

**Flujo de CI** (`ci.yml`, en cada PR): instalar, lint, tipos, pruebas unitarias, build, e2e con Playwright contra la vista previa, axe y Lighthouse CI. `ingest.yml` solo se ejecuta en `main` y por programación.

## Cómo trabajar con Claude Code

Cada fase del plan se hace en una rama y un PR propios, y sigue el mismo ciclo: planificar, implementar, verificar. Claude Code rinde mejor con tareas acotadas y un criterio de "hecho" que se pueda comprobar con un comando.

1. **Planificar.** Empieza la fase en modo plan: Claude Code lee el código y propone los archivos que tocar antes de escribir nada. Tú apruebas o corriges.
2. **Implementar.** Una fase a la vez, con los pasos de la fase como lista de tareas.
3. **Verificar.** Antes de dar la fase por terminada, ejecuta `pnpm typecheck && pnpm test` y el criterio propio de la fase.
4. **Revisar y fusionar.** Revisas el diff, pides cambios y fusionas cuando CI está en verde.

Crea `CLAUDE.md` en la raíz en la fase 0. Es lo primero que Claude Code lee en cada sesión, así que va corto y con comandos exactos:

```markdown
# QuantumPapers

Buscador semántico de papers de ML cuántico para demostrar SSR con Next.js.
Plan completo: docs/architecture.md. Diseño: docs/design/.

## Comandos
- pnpm --dir web dev | build | lint | typecheck | test | test:e2e
- uv run --project ingest python -m ingest.cli --help

## Reglas
- TypeScript estricto; sin `any`. Server Components por defecto.
- Las páginas no escriben SQL: usa web/src/lib y web/src/db.
- Los componentes de web/src/components/qp siguen docs/design/index.d.ts.
- Texto de interfaz en español; código y commits en inglés (Conventional Commits).
- No añadas dependencias sin preguntar. No guardes secretos en el repo.
- Antes de terminar una tarea: pnpm typecheck && pnpm test.

## Hecho significa
Tipos y pruebas en verde, y el criterio de "hecho" de la fase cumplido.
```

**Plantilla de prompt para cada fase**

```text
Fase N: <título>. Lee CLAUDE.md y docs/architecture.md (sección <X>).
Objetivo: <una frase>.
Haz un plan primero y espérame antes de escribir código.
Hecho cuando: <comando o comportamiento comprobable>.
```

## Orden de construcción por fases

Doce fases, cada una con un resultado que se puede ejecutar o medir. El orden importa: primero los datos y el sistema de diseño, luego las páginas que los consumen, y al final SEO, calidad y despliegue. Cada fase usa la plantilla de prompt de la sección anterior.

| Fase | Resultado | Depende de |
| --- | --- | --- |
| 0 | Repo, CLAUDE.md y diseño exportado | n/a |
| 1 | Next.js corriendo con tooling y CI | 0 |
| 2 | Sistema de diseño en código y galería | 1 |
| 3 | Base de datos con esquema y semilla | 1 |
| 4 | Ingesta de arXiv con embeddings | 3 |
| 5 | Capa de acceso a datos probada | 3, 4 |
| 6 | Home, detalle de paper y listado ISR | 2, 5 |
| 7 | Búsqueda SSR con streaming y paleta ⌘K | 6 |
| 8 | Autores, temas, about y how-it-works | 6 |
| 9 | SEO, Open Graph, JSON-LD y revalidación | 6, 8 |
| 10 | Pruebas, accesibilidad y presupuestos Lighthouse | 7, 9 |
| 11 | Producción, cron de ingesta y métricas reales | 10 |

Las fases 2 y 3 son independientes y pueden avanzar en paralelo. Lo mismo ocurre con 7 y 8.

### Fase 0. Preparación

**Objetivo.** Dejar el repo listo para que Claude Code trabaje con contexto completo.

**Prompt para Claude Code**

```text
Fase 0: preparación del repositorio.

Contexto: QuantumPapers es un buscador semántico de papers de ML cuántico, hecho como proyecto de portafolio para demostrar SSR con Next.js. Es un monorepo con web/ (Next.js), ingest/ (Python), docs/ y .github/workflows/. Lee primero docs/architecture.md, secciones «Visión y alcance», «Decisiones de arquitectura» y «Estructura del repositorio».

Tareas, en este orden:
1. Crea el árbol de carpetas exacto de «Estructura del repositorio», con un .gitkeep en las carpetas vacías.
2. Crea .gitignore (node_modules, .next, .env*, !.env.example, __pycache__, .venv, *.pyc, .vercel, playwright-report, test-results) y .env.example con las variables de «Despliegue y entornos», sin valores.
3. Escribe CLAUDE.md en la raíz con la plantilla de «Cómo trabajar con Claude Code». Los comandos que aún no existen llevan al lado «(disponible desde la fase N)».
4. Comprueba que docs/design/ contiene tokens.json, bundle.css, bundle.js, index.d.ts, README.md y las capturas de pantallas. Si falta algo, lístalo; no lo inventes ni lo reconstruyas.
5. Crea un README.md corto: qué es el proyecto, stack y enlace a docs/architecture.md.

Restricciones: no escribas código de aplicación, no instales dependencias, no hagas commit todavía.

Antes de crear nada, muéstrame el plan en una lista de archivos y espera mi aprobación. Al terminar, muestra el árbol resultante (tree -a -I .git) y la lista de archivos de diseño que encontraste y los que faltan.
```

**Hecho cuando** el árbol coincide con el de la sección de estructura, `CLAUDE.md` describe comandos y reglas reales, y sabes exactamente qué archivos de diseño faltan, si falta alguno.

### Fase 1. Scaffold y herramientas

**Objetivo.** Una app vacía que compila, con las herramientas de calidad ya activas y CI en verde.

**Prompt para Claude Code**

```text
Fase 1: scaffold de Next.js y herramientas. Lee CLAUDE.md y docs/architecture.md (secciones «Decisiones de arquitectura» y «Estructura del repositorio»). Haz plan y espera mi aprobación.

Trabaja solo dentro de web/. Usa pnpm.

1. Inicializa Next.js (versión estable actual) con App Router, TypeScript, ESLint, src/ y alias @/*. Tailwind debe ser la v4: globals.css usa @import 'tailwindcss' y no existe tailwind.config.js. Verifica la versión instalada y dime cuál es.
2. tsconfig: strict true, noUncheckedIndexedAccess true, noImplicitOverride true.
3. Scripts en package.json: dev, build, start, lint, typecheck (tsc --noEmit), test (vitest run), test:e2e (playwright test).
4. Vitest con entorno jsdom y un test trivial que pase. Playwright con proyecto chromium, webServer que arranca la app y un test de humo: la home responde 200 y tiene un h1.
5. Fuentes con next/font/google: Space Grotesk como variable CSS --font-sans y JetBrains Mono como --font-mono, aplicadas en el layout. <html lang='es'>.
6. Página de inicio provisional con un h1 «QuantumPapers». Nada de diseño todavía.
7. .github/workflows/ci.yml: en push y pull_request, Node 22, pnpm con caché, install con lockfile congelado, y pasos lint, typecheck, test y build, en ese orden, con working-directory web.

Restricciones: no añadas dependencias más allá de las que pide este prompt; no toques docs/ ni ingest/; sin código de la fase 2 en adelante.

Verifica antes de decir que terminaste: pnpm --dir web lint && pnpm --dir web typecheck && pnpm --dir web test && pnpm --dir web build, y pnpm --dir web test:e2e. Pégame el resultado de cada comando (solo las últimas líneas).
```

**Hecho cuando** los cinco comandos pasan en local, CI está en verde en el PR y `tsconfig.json` tiene el modo estricto con los tres indicadores.

### Fase 2. Sistema de diseño en código

**Objetivo.** Los 19 componentes del diseño disponibles como componentes React tipados y verificados, más una galería para compararlos con las capturas.

**Prompt para Claude Code**

```text
Fase 2: sistema de diseño «Laboratorio» en código. Lee CLAUDE.md y, en docs/design/, README.md, tokens.json, index.d.ts, bundle.css y bundle.js. Lee también la sección «Del sistema de diseño al código» de docs/architecture.md. Haz plan y espera mi aprobación; el plan debe listar cada componente con su archivo destino.

Reglas de fondo: el CSS del diseño se porta tal cual; NO lo reescribas en utilidades de Tailwind. Tailwind solo se usa para maquetación de páginas. El diseño es oscuro con rejilla de 48px, un único acento teal #2dd4bf, bordes de un píxel y etiquetas en español en minúsculas con guion bajo.

1. web/src/styles/tokens.css: un bloque @theme con todos los tokens de tokens.json (colores, tipografías, tamaños de texto incluidos display-md y body, espaciado, radios). Escribe un test de Vitest que lea tokens.json y falle si algún token no aparece en tokens.css.
2. web/src/styles/components.css: copia bundle.css sin cambios de reglas (solo el cambio de cabecera de comentario). Impórtalo en globals.css después de tokens.css.
3. Porta a TSX cada componente de bundle.js (Button, TextLink, SearchPanel, ResultRow, PaperRow, TopicTag, SiteHeader, Panel, DataList, Breadcrumb, Kicker, Checkbox, Radio, TextField, FilterGroup, Pagination, ResultRowSkeleton, SiteFooter, CommandPalette) en web/src/components/qp/<Nombre>.tsx con un barrel index.ts. Las props deben coincidir exactamente con index.d.ts, incluidas compact, open y onMenuClick de SiteHeader. Mantén las clases qp-* idénticas. Son Server Components por defecto; solo SiteHeader (menú móvil con estado) y CommandPalette llevan 'use client'.
4. CommandPalette: construye con el componente Command de shadcn/ui (cmdk). Te autorizo a añadir solo shadcn/ui Command y sus dependencias directas; nada más. Estilízalo con las clases .qp-cmd* de components.css, no con los estilos por defecto de shadcn.
5. Galería en web/src/app/dev/components/page.tsx: cada componente con todas sus variantes y estados (hover y foco documentados, deshabilitado, activo, cargando). Debe devolver notFound() cuando process.env.VERCEL_ENV === 'production' y exportar robots noindex.
6. Pruebas: Vitest + Testing Library para el comportamiento (Button deshabilitado, Pagination marca aria-current en la página actual, SiteHeader abre y cierra el menú, Checkbox y Radio son operables con teclado). Añade @axe-core/playwright y un test E2E que abra la galería en 1280 y 390 de ancho y falle con violaciones serious o critical.

Restricciones: no cambies bundle.css ni index.d.ts; si una prop o un estado no cuadra con el diseño, dímelo en lugar de improvisar. Sin datos reales ni acceso a base de datos.

Verifica: typecheck, lint, test, test:e2e y build. Genera capturas de la galería (1280 y 390) en web/test-results/ y dime cómo difieren de docs/design, si difieren.
```

**Hecho cuando** la galería muestra todos los componentes igual que las capturas, axe no reporta errores serios, el test de tokens pasa y `components.css` coincide con `bundle.css` salvo el comentario de cabecera.

### Fase 3. Base de datos

**Objetivo.** Postgres con pgvector, el esquema completo, el índice HNSW y datos de prueba, todo reproducible desde migraciones.

**Antes de empezar (lo haces tú):** crea el proyecto en Neon con una rama `main` y una rama `dev`, y pon la cadena de conexión de `dev` en `web/.env.local` como `DATABASE_URL`. Claude Code solo trabaja contra `dev`.

**Prompt para Claude Code**

```text
Fase 3: base de datos. Lee CLAUDE.md y la sección «Modelo de datos» de docs/architecture.md. Haz plan, muéstrame el SQL de la migración completo y espera mi aprobación antes de aplicar nada. Trabaja solo contra DATABASE_URL de la rama dev; nunca contra producción.

1. Dependencias permitidas: drizzle-orm, drizzle-kit, @neondatabase/serverless y ws. Usa el driver drizzle-orm/neon-serverless con Pool (no neon-http), porque en la fase 5 necesito transacciones con SET LOCAL hnsw.ef_search.
2. Esquema en web/src/db/schema.ts: papers, authors, paper_authors, topics, paper_topics, tal como está en el documento (arxiv_id único, título, resumen, fechas, versión, categoría primaria, doi, pdf_url, ai_summary jsonb, embedding vector(1536)). Añade además papers.embedding_model text not null default 'text-embedding-3-small' y actualiza docs/architecture.md con ese cambio. authors y topics llevan slug único.
3. drizzle.config.ts y scripts db:generate, db:migrate y db:seed en package.json.
4. La primera migración debe empezar con CREATE EXTENSION IF NOT EXISTS vector e incluir un índice HNSW: USING hnsw (embedding vector_cosine_ops) con los parámetros por defecto (m=16, ef_construction=64). Añade además índices btree en papers.published_at y en las claves foráneas de las tablas puente.
5. Tras migrar, ejecuta SELECT extversion FROM pg_extension WHERE extname='vector' y dime la versión. Si es menor que 0.8, avísame, porque hnsw.iterative_scan no existiría.
6. db:seed: lee web/src/db/seed/papers.json (50 papers reales de quant-ph/cs.LG con arxiv_id, título, resumen, autores, categorías, fechas) e inserta idempotentemente por arxiv_id. Genera los embeddings de desarrollo de forma determinista a partir de un hash del arxiv_id, normalizados a longitud 1, y márcalos en la columna embedding_model con el valor 'dev-fake'. Deja un comentario bien visible diciendo que son vectores falsos que la fase 4 reemplaza. Si no puedes reunir 50 papers reales con certeza, usa los que puedas verificar y dime cuántos son; no inventes ids de arXiv.

Verifica: aplica la migración sobre una rama limpia, ejecuta el seed dos veces (la segunda no debe duplicar nada) y corre esta consulta de similitud tomando el embedding de un paper como referencia: SELECT arxiv_id, embedding <=> (SELECT embedding FROM papers WHERE arxiv_id='X') AS dist FROM papers ORDER BY dist LIMIT 5. El primer resultado debe ser el propio paper con distancia 0. Pégame las salidas.
```

**Hecho cuando** la migración se aplica en una base limpia, el seed es idempotente y la consulta de similitud devuelve resultados ordenados con el propio paper primero.

### Fase 4. Ingesta en Python

**Objetivo.** Un CLI de Python que trae papers de arXiv y los deja listos en la base, con coste controlado y sin duplicados.

**Prompt para Claude Code**

```text
Fase 4: ingesta en Python. Lee CLAUDE.md y las secciones «Modelo de datos» y «Flujos de datos» de docs/architecture.md. Haz plan con la lista de módulos y espera mi aprobación.

Trabaja solo en ingest/, con uv. Dependencias permitidas: httpx, feedparser, openai, psycopg[binary], pgvector, pydantic, typer, tenacity, pytest y respx.

Módulos (src/ingest/):
- arxiv_client.py: consulta la API de arXiv (export.arxiv.org/api/query, Atom). Consulta por defecto cat:quant-ph AND cat:cs.LG, configurable con --query; orden por fecha de envío descendente; páginas de 100 resultados. Respeta el límite: máximo una petición cada 3 segundos (un sleep entre páginas), cabecera User-Agent con CONTACT_EMAIL, y reintentos con espera exponencial ante 429 o 5xx usando tenacity. Parsea arxiv_id sin versión, versión, título, resumen, autores, categoría primaria, categorías, doi si existe, pdf_url, published y updated.
- models.py: modelos pydantic de Paper y Summary. El resumen con IA sigue los campos de ai_summary definidos en «Modelo de datos».
- embed.py: modelo text-embedding-3-small, 1536 dimensiones, entrada f'{titulo}\n\n{resumen}', lotes de hasta 64. Soporta OpenAI y Azure OpenAI según variables de entorno (OPENAI_API_KEY o AZURE_OPENAI_*).
- summarize.py: genera el resumen en JSON con el modelo de SUMMARY_MODEL, validado con pydantic; si la salida no valida, reintenta una vez y si falla deja ai_summary en null y registra una advertencia.
- db.py: upsert por arxiv_id con ON CONFLICT. Solo recalcula embedding y resumen si el paper es nuevo o su versión cambió; guarda embedding_model. Upsert también de autores y temas (slug a partir del nombre) y tablas puente.
- cli.py (typer): comando ingest run con --since YYYY-MM-DD, --limit N, --dry-run (no escribe en la base ni llama a OpenAI; solo imprime qué haría) y --query. Al final imprime un resumen: nuevos, actualizados, omitidos, fallidos, y escribe los arxiv_id tocados en un archivo changed_ids.txt para que la fase 11 revalide páginas.

Pruebas (pytest, sin red): usa respuestas Atom grabadas en tests/fixtures y respx; prueba parseo, paginación con retardo simulado, reintentos, idempotencia del upsert contra una base de prueba, y que --dry-run no escribe.

Verifica: uv run pytest; luego, contra la rama dev, uv run python -m ingest.cli run --limit 20 dos veces seguidas. La segunda debe reportar 0 nuevos y 0 llamadas a OpenAI. Pégame ambos resúmenes y el conteo de filas antes y después.
```

**Hecho cuando** ejecutar el CLI dos veces no duplica filas ni vuelve a gastar tokens, y una ejecución con `--limit 20` carga papers con embedding real, resumen y modelo registrado.

### Fase 5. Capa de acceso a datos

**Objetivo.** Que ninguna página escriba SQL: toda lectura pasa por funciones tipadas y probadas.

**Prompt para Claude Code**

```text
Fase 5: capa de acceso a datos. Lee CLAUDE.md, la sección «Modelo de datos» y la de «Mapa de rutas y estrategia de render» de docs/architecture.md. Haz plan y espera mi aprobación.

Crea web/src/lib/ con 'import server-only' en cada módulo. Los tipos de retorno son propios (lib/types.ts), no los de Drizzle: Paper, PaperSummary (sin embedding), AuthorRef, TopicRef.

Funciones y firmas:
- getPaper(arxivId: string): Promise<PaperDetail | null>. Incluye autores, temas y ai_summary.
- listPapers({ page, pageSize = 20 }): Promise<{ items: PaperSummary[]; total: number; pageCount: number }>, orden published_at descendente.
- listPaperIds(limit?: number): Promise<string[]>, para generateStaticParams y el sitemap.
- searchPapers({ query, filters, limit = 20 }): Promise<SearchResult[]>. filters: { topics?: string[]; yearFrom?: number; yearTo?: number; category?: string }. Convierte la consulta en embedding con OpenAI en lib/embeddings.ts (mismo modelo que la ingesta, leído de la configuración, no escrito dos veces). Consulta en SQL crudo con sql`` de Drizzle: ORDER BY embedding <=> $vector, y devuelve similarity = 1 - distancia coseno. Ejecútala en una transacción con SET LOCAL hnsw.ef_search = 100 y, si la versión de pgvector lo permite, SET LOCAL hnsw.iterative_scan = 'relaxed_order' para que los filtros no devuelvan menos filas de las pedidas. Valida query: trim, entre 2 y 200 caracteres; si no cumple, lanza un error tipado.
- getRelated(arxivId, limit = 5): usa el embedding ya guardado del paper, excluye el propio paper.
- getAuthor(slug) y getTopic(slug): entidad más sus papers (hasta 50, más recientes primero), o null.
- Un error de base de datos se propaga como DataUnavailableError para que la página muestre el estado 503 del diseño.

Pruebas de integración con Vitest contra una rama de pruebas de Neon (DATABASE_URL_TEST); si la variable no existe, se omiten con un aviso claro. Cubre: getPaper existente e inexistente, paginación (total y pageCount correctos), búsqueda con y sin filtros, que con un filtro estricto la búsqueda devuelva todas las filas disponibles hasta el límite (el caso de HNSW con filtros), y getRelated sin el propio paper.

Restricciones: no añadas dependencias, no crees páginas, no cambies el esquema.

Verifica: typecheck, lint, test. Pégame el resultado de una búsqueda real contra la rama dev con tres consultas de ejemplo y su top 3.
```

**Hecho cuando** las pruebas pasan, `searchPapers` devuelve resultados coherentes con y sin filtros y ninguna página o componente importa `db` directamente.

### Fase 6. Páginas ISR y SSG

**Objetivo.** Las rutas de lectura funcionando con el diseño real, en escritorio y en móvil.

**Prompt para Claude Code**

```text
Fase 6: layout y páginas ISR/SSG. Lee CLAUDE.md, «Mapa de rutas y estrategia de render» y «Del sistema de diseño al código» de docs/architecture.md, y mira en docs/design las capturas de home (opción Laboratorio), detalle de paper, listado y 404, tanto de escritorio como móvil. Haz plan y espera mi aprobación.

Usa solo componentes de web/src/components/qp y funciones de web/src/lib. Server Components; sin 'use client' salvo los ya previstos.

1. app/layout.tsx: SiteHeader y SiteFooter, lang='es', metadataBase desde NEXT_PUBLIC_SITE_URL, title template '%s · QuantumPapers'.
2. app/page.tsx (SSG): la home del diseño. El SearchPanel es un <form method='get' action='/search'> que funciona sin JavaScript. Muestra los papers más recientes con PaperRow.
3. app/papers/[id]/page.tsx (ISR): generateStaticParams con listPaperIds(100), dynamicParams true, export const revalidate = 3600, notFound() si getPaper devuelve null. Maqueta como el diseño: Breadcrumb, Kicker, título, DataList de metadatos, Panel con el resumen de IA, resumen original, autores y temas como TopicTag enlazados, y relacionados con PaperRow desde getRelated.
4. app/papers/page/[n]/page.tsx (ISR): n debe ser un entero >= 1 y <= pageCount, si no notFound(); generateStaticParams para las primeras páginas; revalidate 3600; Pagination con hrefs reales /papers/page/N. Configura en next.config un redirect permanente de /papers a /papers/page/1.
5. app/not-found.tsx y app/error.tsx con el diseño de 404 y de error 503 respectivamente.
6. Textos de interfaz en español con las etiquetas en minúsculas con guion bajo del diseño.

Restricciones: no implementes búsqueda, autores, temas, SEO avanzado ni imágenes OG todavía. No escribas SQL ni importes db.

Verifica: typecheck, lint, test, build. Pega la tabla de rutas que imprime next build y confirma que / es estática y que /papers/[id] y /papers/page/[n] aparecen como ISR (con revalidate de 1 h). Genera capturas con Playwright en 1280 y 390 de ancho de home, un detalle, el listado y un 404, y dime en qué se separan del diseño.
```

**Hecho cuando** `next build` marca las rutas como estáticas o ISR, un id inexistente devuelve 404 real, y las capturas se ven como el diseño de escritorio y móvil.

### Fase 7. Búsqueda con streaming

**Objetivo.** El punto fuerte del proyecto: SSR real, con la estructura de la página al instante y los resultados llegando por streaming.

**Prompt para Claude Code**

```text
Fase 7: búsqueda con SSR y streaming. Lee CLAUDE.md, «Flujos de datos» y «Mapa de rutas y estrategia de render» de docs/architecture.md, y las capturas de búsqueda, carga (esqueletos), sin resultados, error y paleta ⌘K en docs/design (escritorio y móvil). Haz plan y espera mi aprobación.

1. app/search/page.tsx, dinámica: lee searchParams (una Promise en esta versión de Next; haz await). Parámetros: q, topic (repetible), year_from, year_to, category. Valida y normaliza en una función aparte con pruebas de Vitest: q con trim y máximo 200 caracteres, años enteros razonables, valores desconocidos ignorados.
2. Estructura para el streaming: la página renderiza de inmediato el SearchPanel con q rellenado y el FilterGroup, y envuelve los resultados en <Suspense key={JSON.stringify(parámetros)} fallback={<seis ResultRowSkeleton />}>. El componente de resultados es un Server Component asíncrono que llama a searchPapers. Sin q, muestra el estado inicial del diseño.
3. Filtros en la URL: un <form method='get'> con Checkbox y Radio que funciona sin JavaScript. En móvil, los filtros van en un <details> como en el diseño.
4. Estados: sin resultados (diseño «sin resultados»), y error 503 cuando searchPapers lance DataUnavailableError, mediante error.tsx en el segmento /search. Estado de q demasiado corta o larga con un mensaje claro, sin llamar a OpenAI.
5. generateMetadata de /search con robots noindex, nofollow.
6. Paleta ⌘K: monta CommandPalette en el SiteHeader. Atajos Cmd+K y Ctrl+K abren; Escape cierra; el foco queda atrapado y vuelve al disparador. Opciones: navegación a las rutas principales y una acción «buscar «texto»» que hace router.push('/search?q=...'). No hace búsqueda en vivo contra la API.

Restricciones: no cambies los componentes qp salvo que el diseño no pueda lograrse sin hacerlo, y en ese caso avísame antes. No añadas dependencias.

Verifica: typecheck, lint, test, build. Después prueba el streaming con curl --no-buffer 'http://localhost:3000/search?q=variational+quantum+classifier' y muéstrame que el HTML inicial ya contiene el skeleton antes de que lleguen los resultados. Con JavaScript desactivado en Playwright, la búsqueda y los filtros deben funcionar. Pega ambos resultados.
```

**Hecho cuando** con JavaScript desactivado la búsqueda devuelve resultados, el esqueleto aparece en el HTML antes que los resultados, los estados vacío y de error se ven como el diseño y la paleta se opera solo con teclado.

### Fase 8. Autores, temas y páginas informativas

**Objetivo.** Completar el mapa de rutas con autores, temas y las dos páginas informativas.

**Prompt para Claude Code**

```text
Fase 8: autores, temas, about y how-it-works. Lee CLAUDE.md, «Mapa de rutas y estrategia de render» y mira en docs/design las capturas de /about y /how-it-works (escritorio y móvil). Haz plan y espera mi aprobación.

1. app/authors/[slug]/page.tsx y app/topics/[slug]/page.tsx (ISR, revalidate 3600): generateStaticParams con los slugs existentes, notFound() si getAuthor o getTopic devuelven null. Estructura: Breadcrumb, Kicker, nombre y número de papers, y lista de PaperRow con hasta 50 papers (los que devuelve la capa de datos). Si hay más de 50, muestra una nota con el total; no inventes paginación aún.
2. Enlaza autores y temas desde el detalle de paper (TopicTag y enlaces de autor).
3. app/about/page.tsx y app/how-it-works/page.tsx (SSG), fieles al diseño: copia el texto del diseño, no lo reescribas. Si algún texto del diseño depende de datos (cifras de rendimiento), sácalo a web/src/lib/metrics.ts con un comentario TODO fase 11, y en la página rotula esas cifras como «valores de ejemplo» hasta que haya mediciones reales.
4. Revisa que todos los enlaces internos del header, footer y páginas apunten a rutas existentes; añade un test de Playwright que recorra los enlaces internos de la home y falle ante cualquier 404.

Restricciones: sin SEO avanzado todavía; no cambies componentes qp.

Verifica: typecheck, lint, test, test:e2e, build, y confirma en la salida de build el tipo de render de cada ruta nueva. Capturas en 1280 y 390 de las cuatro páginas nuevas.
```

**Hecho cuando** todas las rutas del mapa existen, los enlaces internos no devuelven 404 y las cifras provisionales están claramente marcadas como ejemplo.

### Fase 9. SEO y revalidación

**Objetivo.** Que buscadores y vistas previas entiendan cada página, y poder refrescar el contenido bajo demanda.

**Prompt para Claude Code**

```text
Fase 9: SEO y revalidación. Lee CLAUDE.md y la sección «SEO, rendimiento y accesibilidad» de docs/architecture.md. Haz plan y espera mi aprobación.

1. generateMetadata en cada ruta pública: title (con el template del layout), description (en el detalle, los primeros ~155 caracteres del resumen sin cortar palabras), alternates.canonical con la URL absoluta, openGraph (type 'article' en detalle, 'website' en el resto) y twitter card summary_large_image.
2. app/papers/[id]/opengraph-image.tsx con ImageResponse a 1200x630: fondo oscuro con la rejilla del diseño, título del paper (máx. 3 líneas), primeros autores, el kicker y la marca. Usa las tokens de color del diseño. Carga Space Grotesk desde un archivo local en web/src/assets/fonts (descárgalo con la licencia correcta y dime de dónde). Añade también una imagen OG por defecto para el resto del sitio.
3. JSON-LD ScholarlyArticle en el detalle, generado por una función pura lib/jsonld.ts con pruebas: headline, name, abstract, author como lista de Person, datePublished, dateModified, identifier con el arXiv id (y el DOI si existe, como PropertyValue), url, sameAs con la URL de arXiv, keywords con los temas. Renderízalo en <script type='application/ld+json'> usando JSON.stringify y reemplazando '<' por '<' para evitar inyección.
4. app/sitemap.ts: rutas estáticas, todos los papers, autores y temas, con lastModified desde updated_at. app/robots.ts: permite /, bloquea /search, /api/ y /dev/, e indica la URL del sitemap.
5. app/api/revalidate/route.ts, POST: exige la cabecera x-revalidate-secret igual a REVALIDATE_SECRET, comparada con crypto.timingSafeEqual. El cuerpo es { paths?: string[] } y solo acepta rutas que empiecen por /papers, /authors o /topics. Sin secreto o con secreto incorrecto: 401. Cuerpo inválido: 400. Éxito: llama a revalidatePath por cada ruta y responde 200 con la lista revalidada. Cualquier otro método: 405.
6. Pruebas de Vitest: lib/jsonld, y el handler de revalidación (401, 400, 200, 405).

Verifica: typecheck, lint, test, build. Pega el JSON-LD generado de un paper real, abre /papers/<id>/opengraph-image y confirma que devuelve un PNG 1200x630, muestra las primeras líneas del sitemap, y prueba con curl la revalidación sin secreto (401) y con secreto (200).
```

**Hecho cuando** el JSON-LD pasa el validador de datos estructurados, el sitemap lista todos los papers, la imagen OG se genera con el título correcto y la revalidación sin secreto devuelve 401.

### Fase 10. Calidad

**Objetivo.** Convertir las promesas del diseño y de la arquitectura en comprobaciones automáticas que fallen en CI.

**Prompt para Claude Code**

```text
Fase 10: calidad. Lee CLAUDE.md, «SEO, rendimiento y accesibilidad» y «Despliegue y entornos» de docs/architecture.md. Haz plan y espera mi aprobación. Te autorizo a añadir @axe-core/playwright (si no está) y @lhci/cli.

1. Pruebas Playwright con JavaScript desactivado (test.use({ javaScriptEnabled: false })) en web/e2e/no-js.spec.ts: (a) la home tiene h1 y el formulario de búsqueda lleva a /search?q=... con al menos un resultado; (b) un detalle de paper tiene h1, un script ld+json que se parsea y tiene @type ScholarlyArticle, og:title y canonical; (c) /search con una consulta devuelve estado 200 y al menos una fila de resultado; (d) /papers/no-existe devuelve estado 404.
2. axe en web/e2e/a11y.spec.ts: rutas /, un detalle, /search?q=quantum, /papers/page/1, /about y /how-it-works, en 1280 y 390 de ancho; falla ante violaciones serious o critical.
3. Lighthouse CI: lighthouserc.json con tres ejecuciones por URL contra next start local. Presupuestos que fallan: largest-contentful-paint <= 2500 ms, cumulative-layout-shift <= 0.1, total-blocking-time <= 200 ms, categoría accessibility >= 0.95, seo >= 0.95, best-practices >= 0.9. Para server-response-time usa aviso con umbral de 600 ms. En /search usa avisos en lugar de errores para LCP, porque depende de OpenAI y de la base.
4. Conecta todo a ci.yml como trabajos separados (e2e y lighthouse), con DATABASE_URL de la rama de pruebas de Neon y OPENAI_API_KEY desde GitHub Secrets. Sube los informes de Playwright y Lighthouse como artefactos.
5. Documenta en CLAUDE.md cómo correr cada comprobación en local.

Restricciones: no relajes un presupuesto para que pase; si algo falla, arregla la causa o cuéntamelo. Lighthouse en CI es ruidoso, por eso se usa la mediana de tres ejecuciones.

Verifica: ejecuta cada comprobación en local y pega el resultado. Provoca a propósito un fallo (por ejemplo, quita un alt) y confirma que la comprobación correspondiente lo detecta; luego revierte.
```

**Hecho cuando** CI falla si se rompe cualquiera de los presupuestos o reglas, pasa en la rama principal y has visto fallar una comprobación a propósito.

### Fase 11. Despliegue y métricas

**Objetivo.** Producción pública, ingesta programada y la comparación CSR contra SSR con números propios.

**Antes de empezar (lo haces tú):** crea el proyecto en Vercel apuntando a `web/` y la rama de producción en Neon; carga los secretos en Vercel (`DATABASE_URL`, `OPENAI_API_KEY`, `REVALIDATE_SECRET`, `NEXT_PUBLIC_SITE_URL`) y en GitHub Actions para el cron.

**Prompt para Claude Code**

```text
Fase 11: despliegue, cron de ingesta y métricas. Lee CLAUDE.md y «Despliegue y entornos» de docs/architecture.md. Haz plan y espera mi aprobación. Nada de lo que hagas debe tocar la base de producción sin que yo lo confirme.

1. Despliegue: confirma vercel.json si hace falta (raíz web/), que /dev/components devuelve 404 en producción, y que las variables de entorno están en uso solo en el servidor (ninguna con NEXT_PUBLIC_ salvo NEXT_PUBLIC_SITE_URL). Documenta el flujo de migraciones a producción como un workflow manual (workflow_dispatch) que ejecuta db:migrate; no migres automáticamente en cada despliegue.
2. .github/workflows/ingest.yml: cron diario (0 6 * * * UTC) y workflow_dispatch. Instala uv, ejecuta el CLI de ingest/ con --since de las últimas 48 horas, y luego llama a POST /api/revalidate con x-revalidate-secret y las rutas de los papers de changed_ids.txt (en lotes de 50, más /papers/page/1 y la home). Falla el trabajo si el CLI reporta fallos.
3. Línea base CSR para medir: crea app/baseline/csr/[id]/page.tsx como Client Component que, tras hidratar, pide /api/baseline/papers/[id] y renderiza el mismo detalle. Debe ser noindex y estar fuera del sitemap. Es solo para la medición.
4. scripts/measure.mjs: usando Lighthouse (perfil móvil por defecto) ejecuta 5 veces contra la URL pública, para /papers/<id> (ISR) y /baseline/csr/<id>, y calcula la mediana de TTFB (server-response-time), FCP y LCP. Escribe web/src/lib/metrics.json con los resultados, la fecha y la URL medida. Si Lighthouse no puede correr desde tu entorno, dímelo y dame el comando exacto para correrlo yo.
5. Sustituye las cifras de ejemplo de /how-it-works por las de metrics.json y quita el rótulo «valores de ejemplo». Añade al README una tabla CSR frente a SSR con esos números, la fecha de medición y capturas.

Restricciones: no inventes ni redondees a tu favor las mediciones; si CSR sale mejor en algún indicador, se reporta tal cual.

Verifica: ci.yml en verde en main, dispara ingest.yml a mano con workflow_dispatch y muéstrame el log, y confirma que la URL pública responde.
```

**Hecho cuando** la URL pública responde, el cron corre una vez con éxito y revalida páginas, y `/how-it-works` muestra mediciones propias con fecha.

## Riesgos y decisiones abiertas

**Riesgos**

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Límites de la API de arXiv | La ingesta falla o te bloquean | Una petición cada 3 s, reintentos con espera creciente, `User-Agent` identificable, ingesta incremental con `--since` |
| Coste de embeddings y resúmenes | Gasto inesperado | Corpus acotado (cientos de papers), `--dry-run`, caché por `arxiv_id` y versión para no recalcular |
| Cambiar de modelo de embeddings | Los vectores antiguos dejan de ser comparables | Guardar el nombre del modelo junto al vector y reindexar todo si cambia; la dimensión va fija en el esquema |
| HNSW con filtros devuelve menos filas de las pedidas | Resultados incompletos con filtros estrictos | `hnsw.iterative_scan` (pgvector 0.8 o superior) y subir `hnsw.ef_search`; probarlo en la fase 5 |
| Versión de pgvector en Neon | Faltan funciones del plan | Verificar la versión en la fase 3 antes de diseñar consultas |
| Desvío entre diseño y código | La app no se parece a las capturas | Galería `/dev/components` en la fase 2 y comparación visual por pantalla en cada fase |
| Latencia de la búsqueda (embedding más consulta) | TTFB alto en `/search` | Streaming con esqueletos y caché de embeddings de consultas frecuentes si hace falta |

**Decisiones abiertas**

- **Proveedor de embeddings:** OpenAI directo o Azure OpenAI. Cambia solo las variables de entorno y el cliente del CLI.
- **Idioma de los resúmenes con IA:** español o inglés. La interfaz está en español, pero los papers y términos técnicos están en inglés.
- **Alcance del corpus:** solo `quant-ph` o `quant-ph` cruzado con `cs.LG`. Define el tamaño de la base y el coste.
- **Dominio propio:** afecta `NEXT_PUBLIC_SITE_URL`, el sitemap y las imágenes Open Graph.
- **Repositorio público o privado:** para un portafolio conviene público, con la comparación CSR contra SSR en el README.

Conviene cerrar estas decisiones antes de las fases 3 y 4, porque son las que más cuesta cambiar después.
