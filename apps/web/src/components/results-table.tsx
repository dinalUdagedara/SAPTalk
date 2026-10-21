import type { ColumnMeta, QueryRow } from '@saptalk/shared';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

/**
 * Renders whatever the query returned.
 *
 * Columns come from the response, which derives them from the field registry,
 * so a new entity is renderable without this file changing. There is no column
 * list here on purpose -- one would put the per-entity assumption straight back.
 *
 * A table on wider screens; a card per row on a phone, where six columns
 * would leave all but two off-screen.
 */

/**
 * Codes that mean nothing to a reader.
 *
 * Keyed by field name rather than entity: a code means the same thing wherever
 * it appears, and the table does not know which entity it is showing.
 */
const CODE_LABELS: Record<string, Record<string, string>> = {
  BusinessPartnerCategory: { '1': 'Person', '2': 'Organisation', '3': 'Group' },
};

/** Values that read better in mono: ids, codes and dates. */
function isMono(column: ColumnMeta): boolean {
  return column.type === 'date' || /ID$|^BusinessPartner$|Code$|Grouping$|User$/.test(column.name);
}

function render(column: ColumnMeta, value: string | null): string {
  if (value === null || value === '') return '—';
  const labels = CODE_LABELS[column.name];
  if (labels?.[value]) return labels[value];
  if (column.type === 'date') return value.slice(0, 10);
  return value;
}

/** The column a card leads with: the first readable, non-id column. */
function titleColumn(columns: ColumnMeta[]): ColumnMeta | undefined {
  return columns.find((column) => !isMono(column) && column.type === 'string') ?? columns[0];
}

export function ResultsTable({
  columns,
  rows,
  top,
  caption,
}: {
  columns: ColumnMeta[];
  rows: QueryRow[];
  /** The query's $top; when the rows fill it, there may be more in SAP. */
  top: number;
  caption: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface/40 px-4 py-10 text-center">
        <p className="text-sm text-foreground">No records matched.</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          The query ran successfully. SAP simply holds nothing that fits it.
        </p>
      </div>
    );
  }

  const lead = titleColumn(columns);
  const idColumn = columns.find((column) => column !== lead && isMono(column) && column.type !== 'date');
  const rest = columns.filter((column) => column !== lead && column !== idColumn);
  const capped = rows.length >= top;

  return (
    <div className="flex flex-col gap-2">
      {/* Phone: one card per row. */}
      <ul aria-label={caption} className="flex flex-col gap-2 sm:hidden">
        {rows.map((row, index) => (
          <li key={index} className="rounded-xl border border-border bg-surface/40 px-3.5 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 font-medium break-words">
                {lead ? render(lead, row[lead.name] ?? null) : null}
              </span>
              {idColumn && (
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {render(idColumn, row[idColumn.name] ?? null)}
                </span>
              )}
            </div>
            <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
              {rest.map((column) => (
                <div key={column.name} className="min-w-0 truncate">
                  <dt className="inline text-muted-foreground">{column.label} </dt>
                  <dd className={cn('inline', isMono(column) && 'font-mono')}>
                    {render(column, row[column.name] ?? null)}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      {/* Wider screens: a table. */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-surface/40 sm:block">
        <Table>
          <TableCaption className="sr-only">{caption}</TableCaption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.name}
                  className="h-10 px-3.5 text-xs font-medium whitespace-nowrap text-muted-foreground"
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => {
                  const text = render(column, row[column.name] ?? null);
                  return (
                    <TableCell
                      key={column.name}
                      title={text.length > 40 ? text : undefined}
                      className={cn(
                        'px-3.5 py-2.5 whitespace-nowrap',
                        isMono(column)
                          ? 'tabular font-mono text-[12.5px] text-muted-foreground'
                          : 'max-w-[22rem] truncate text-[13.5px] text-foreground',
                      )}
                    >
                      {text}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {capped && (
        <p className="px-1 text-xs text-muted-foreground">
          Showing the first {top} rows. The query asked SAP for at most {top} (
          <span className="font-mono">$top={top}</span>), so there may be more.
        </p>
      )}
    </div>
  );
}
