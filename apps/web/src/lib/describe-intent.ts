import type { Filter, ResolvedQueryIntent } from '@saptalk/shared';
// Imported from the registry files directly rather than the package root: the
// root also re-exports the zod validator, which the browser has no use for.
import { ENTITIES, type EntityName } from '@saptalk/shared/dist/query-intent/fields';
import { OPERATORS } from '@saptalk/shared/dist/query-intent/operators';

/**
 * Plain-English summaries of an intent, for the answer heading.
 *
 * Every word comes from the field registry (labels, enum labels, operator
 * labels), so a new entity or field describes itself without this file
 * changing. Presentation only: nothing here feeds back into a query.
 */

/** Comparison symbols read better than "Created on on or after". */
const DATE_SYMBOLS: Partial<Record<Filter['op'], string>> = {
  eq: '=',
  ne: '≠',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
};

function plural(noun: string): string {
  return /(s|x|ch|sh)$/.test(noun) ? `${noun}es` : `${noun}s`;
}

function entityNoun(entity: EntityName, count: number): string {
  const singular = ENTITIES[entity].label.toLowerCase();
  return count === 1 ? singular : plural(singular);
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function describeFilter(entity: EntityName, filter: Filter): string {
  const field = ENTITIES[entity].fields[filter.field];
  if (!field) return `${filter.field} ${filter.op} ${filter.value}`;

  if (field.type === 'date') {
    const symbol = DATE_SYMBOLS[filter.op] ?? OPERATORS[filter.op].label;
    return `${field.label} ${symbol} ${formatDate(filter.value)}`;
  }

  const enumLabel = field.values?.find((v) => v.value === filter.value)?.label;
  const value = enumLabel ?? `“${filter.value}”`;
  return `${field.label} ${OPERATORS[filter.op].label} ${value}`;
}

/** "Name, Category, Created on…": what a question about this entity can filter on. */
export function filterableLabels(entity: EntityName): string[] {
  return Object.values(ENTITIES[entity].fields)
    .filter((field) => field.filterable)
    .map((field) => field.label);
}

/** True when nothing in the question narrowed the search. */
export function isUnfiltered(intent: ResolvedQueryIntent): boolean {
  return intent.filters.length === 0 && !(intent.related && intent.related.filters.length > 0);
}

/** "25 business partners" */
export function describeCount(entity: EntityName, count: number): string {
  return `${count.toLocaleString('en-GB')} ${entityNoun(entity, count)}`;
}

/** "Category is Organisation and Created on ≥ 1 Jan 2026. Sorted by Created on, newest first." */
export function describeIntent(intent: ResolvedQueryIntent): string {
  const parts: string[] = [];

  const own = intent.filters.map((f) => describeFilter(intent.entity, f));
  let where = own.join(` ${intent.filterLogic} `);

  if (intent.related && intent.related.filters.length > 0) {
    const related = intent.related;
    const conditions = related.filters.map((f) => describeFilter(related.entity, f)).join(' and ');
    const clause = `with a ${entityNoun(related.entity, 1)} where ${conditions}`;
    where = where ? `${where}, ${clause}` : clause;
  }

  parts.push(where ? capitalise(where) : 'No filters');

  const sort = intent.orderBy[0];
  if (sort) {
    const field = ENTITIES[intent.entity].fields[sort.field];
    const label = field?.label ?? sort.field;
    const order =
      field?.type === 'date'
        ? sort.direction === 'desc'
          ? 'newest first'
          : 'oldest first'
        : sort.direction === 'desc'
          ? 'Z to A'
          : 'A to Z';
    parts.push(`Sorted by ${label}, ${order}`);
  }

  return `${parts.join('. ')}.`;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
