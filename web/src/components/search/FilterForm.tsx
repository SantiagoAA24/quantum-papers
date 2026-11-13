import { Button, Checkbox, FilterGroup, Radio, TextField, TextLink } from "@/components/qp";
import { listCategories, listTopics, type TopicRef } from "@/lib";
import { hasFilters, searchUrl, type SearchParams } from "@/lib/search-params";

async function TopicOptions({ selected }: { selected: string[] }) {
  const options = await listTopics().catch((): TopicRef[] => []);
  // A selected topic stays visible (and can be unchecked) even if it is not in the list.
  const known = new Set(options.map((t) => t.slug));
  const all = [
    ...options,
    ...selected.filter((s) => !known.has(s)).map((slug) => ({ slug, label: slug })),
  ];
  return all.map((t) => (
    <Checkbox key={t.slug} name="topic" value={t.slug} defaultChecked={selected.includes(t.slug)}>
      {"#" + t.slug}
    </Checkbox>
  ));
}

async function CategoryOptions({ selected }: { selected?: string }) {
  const options = await listCategories().catch((): string[] => []);
  const all = selected && !options.includes(selected) ? [...options, selected] : options;
  return (
    <>
      <Radio name="category" value="" defaultChecked={!selected}>
        todas
      </Radio>
      {all.map((c) => (
        <Radio key={c} name="category" value={c} defaultChecked={selected === c}>
          {c}
        </Radio>
      ))}
    </>
  );
}

function activeCount(p: SearchParams): number {
  return p.topics.length + (p.yearFrom !== undefined || p.yearTo !== undefined ? 1 : 0) + (p.category ? 1 : 0);
}

/**
 * One GET form (options are awaited, not streamed, so it works without JavaScript). Mobile: collapsed in a <details>. Wide screens: always open
 * (CSS hides the summary). Works without JavaScript; the URL is the state.
 */
export function FilterForm({ params, full = false }: { params: SearchParams; full?: boolean }) {
  const active = activeCount(params);
  return (
    <details className="qp-filters">
      <summary className="qp-filters__summary">
        <span>filtros</span>
        <span className="qp-filters__count">
          {active ? `${active} activo${active === 1 ? "" : "s"} ` : ""}
          <span className="qp-filters__sign" aria-hidden="true" />
        </span>
      </summary>
      <form className="qp-filters__form" method="get" action="/search">
        <input type="hidden" name="q" value={params.q} />
        {/* Keeps no-JavaScript users on the single-piece variant: one search per submit. */}
        {full ? <input type="hidden" name="render" value="full" /> : null}
        <FilterGroup legend="tema">
          <TopicOptions selected={params.topics} />
        </FilterGroup>
        <FilterGroup legend="año">
          <div className="qp-filter__row">
            <div style={{ flex: "1 1 0", minWidth: 0 }}>
              <TextField label="desde" name="year_from" type="number" placeholder="[año]" defaultValue={params.yearFrom?.toString()} />
            </div>
            <div style={{ flex: "1 1 0", minWidth: 0 }}>
              <TextField label="hasta" name="year_to" type="number" placeholder="[año]" defaultValue={params.yearTo?.toString()} />
            </div>
          </div>
        </FilterGroup>
        <FilterGroup legend="categoría">
          <CategoryOptions selected={params.category} />
        </FilterGroup>
        <div className="qp-filters__actions">
          <Button type="submit">aplicar</Button>
          {hasFilters(params) ? (
            <TextLink href={searchUrl({ q: params.q, topics: [] }, full ? { render: "full" } : {})}>limpiar_filtros →</TextLink>
          ) : null}
        </div>
        <p className="qp-note">{"// los filtros viven en la URL"}</p>
      </form>
    </details>
  );
}
