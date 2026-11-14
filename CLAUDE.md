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

## Calidad (e2e, axe, Lighthouse)
Todas necesitan `DATABASE_URL` con datos (`pnpm --dir web db:migrate && pnpm --dir web db:seed` en local). `/search` además necesita `OPENAI_API_KEY` (o Azure); sin ella esas pruebas se saltan o fallan. En CI se usan la rama de pruebas de Neon (`DATABASE_URL_TEST`) y `OPENAI_API_KEY` desde GitHub Secrets.
- Todo Playwright (`web/tests/e2e/`): `pnpm --dir web test:e2e` (hace build y `next start`; con `PW_CHROMIUM_PATH` si el Chromium local difiere). Informe HTML en `web/playwright-report/` (solo en CI).
- Sin JavaScript (`no-js.spec.ts`): `pnpm --dir web exec playwright test no-js`.
- Accesibilidad (`a11y.spec.ts`, axe en 1280 y 390; falla con serious/critical): `pnpm --dir web exec playwright test a11y`.
- Lighthouse CI (mediana de 3 ejecuciones por URL; presupuestos en `web/lighthouserc.json`, no se relajan para que pase): con la app en marcha en el puerto 3000 (`pnpm --dir web build && pnpm --dir web start`), `CHROME_PATH=/usr/bin/google-chrome pnpm --dir web lhci`. Informes en `web/.lighthouseci/`. Los números locales dependen de tu máquina; CI es la referencia.

## Hecho significa
Tipos y pruebas en verde, y el criterio de «hecho» de la fase cumplido.
