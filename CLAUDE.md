# QuantumPapers

Buscador semántico de papers de ML cuántico para demostrar SSR con Next.js.
Plan completo: docs/architecture.md. Diseño: docs/design/ (tokens.json, components/, screens/).

## Comandos
- pnpm --dir web dev | build | lint | typecheck | test | test:e2e (disponibles desde la fase 1)
- uv run --project ingest python -m ingest.cli --help (disponible desde la fase 4)

## Reglas
- TypeScript estricto; sin `any`. Server Components por defecto.
- Las páginas no escriben SQL: usa web/src/lib y web/src/db.
- Los componentes de web/src/components/qp siguen docs/design/components/index.d.ts.
- Texto de interfaz en español; código y commits en inglés (Conventional Commits).
- No añadas dependencias sin preguntar. No guardes secretos en el repo.
- Antes de terminar una tarea: pnpm --dir web typecheck && pnpm --dir web test.

## Hecho significa
Tipos y pruebas en verde, y el criterio de «hecho» de la fase cumplido.
