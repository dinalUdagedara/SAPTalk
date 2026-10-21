import type { Filter, ResolvedQueryIntent } from '@saptalk/shared';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-mono">{children}</dd>
    </>
  );
}

function FilterLine({ filter, joiner }: { filter: Filter; joiner?: string }) {
  return (
    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      {joiner && <span className="text-muted-foreground">{joiner}</span>}
      <span className="break-all">{filter.field}</span>
      <span className="rounded bg-verified/12 px-1.5 text-verified">{filter.op}</span>
      <span className="break-all">{filter.value}</span>
    </span>
  );
}

/**
 * What the model decided.
 *
 * Rendered as structure rather than raw JSON: a reader should be able to check
 * it against their question without parsing braces. The raw JSON is one tab
 * away for anyone who wants it.
 */
export function IntentPanel({ intent }: { intent: ResolvedQueryIntent }) {
  return (
    <dl className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[12.5px]">
      <Row label="Object">
        <span className="text-verified">{intent.entity}</span>
      </Row>

      <Row label="Filters">
        {intent.filters.length === 0 ? (
          <span className="text-muted-foreground">none</span>
        ) : (
          <span className="flex flex-col gap-1">
            {intent.filters.map((filter, index) => (
              <FilterLine
                key={index}
                filter={filter}
                joiner={index > 0 ? intent.filterLogic : undefined}
              />
            ))}
          </span>
        )}
      </Row>

      {intent.related && intent.related.filters.length > 0 && (
        <Row label="Related">
          <span className="flex flex-col gap-1">
            <span className="text-verified">{intent.related.entity}</span>
            {intent.related.filters.map((filter, index) => (
              <FilterLine key={index} filter={filter} joiner={index > 0 ? 'and' : undefined} />
            ))}
          </span>
        </Row>
      )}

      <Row label="Sort">
        {intent.orderBy.length === 0 ? (
          <span className="text-muted-foreground">none</span>
        ) : (
          <span className="flex flex-col">
            {intent.orderBy.map((entry) => (
              <span key={entry.field}>
                {entry.field} <span className="text-muted-foreground">{entry.direction}</span>
              </span>
            ))}
          </span>
        )}
      </Row>

      <Row label="Limit">
        <span className="tabular">{intent.top}</span>
      </Row>

      <Row label="Columns">
        <span className="text-muted-foreground">
          {intent.select.length} field{intent.select.length === 1 ? '' : 's'}
        </span>
      </Row>
    </dl>
  );
}
