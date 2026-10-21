'use client';

import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Questions chosen to show range, not just success: a date filter, a substring
 * match, one that routes to the address object, one that spans both objects and
 * needs a join, and one the data genuinely cannot answer -- degrading honestly
 * is part of what this demonstrates, so that one is labelled as a refusal
 * rather than left to look broken.
 */
export const EXAMPLES = [
  'organisations added this year, newest first',
  'companies with tech in the name',
  'partners in London created this year',
  'addresses in Germany, by postal code',
] as const;

export const REFUSAL_EXAMPLE = 'total revenue last quarter';

const chip = cn(
  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] text-foreground',
  'transition-colors hover:border-primary/60',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
  'disabled:pointer-events-none disabled:opacity-50',
);

export function ExampleQuestions({
  onPick,
  disabled,
  includeRefusal = true,
  label = 'Try',
}: {
  onPick: (question: string) => void;
  disabled: boolean;
  includeRefusal?: boolean;
  label?: string;
}) {
  return (
    // One scrolling row on a phone, so five chips don't push the answer down;
    // wrapped on wider screens.
    <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
      <span className="mr-1 shrink-0 text-[13px] text-muted-foreground">{label}</span>
      {EXAMPLES.map((example) => (
        <button
          key={example}
          type="button"
          disabled={disabled}
          onClick={() => onPick(example)}
          className={cn(chip, 'border-border bg-surface/70')}
        >
          {example}
        </button>
      ))}
      {includeRefusal && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onPick(REFUSAL_EXAMPLE)}
          className={cn(chip, 'border-dashed border-signal-warn/50 bg-transparent')}
        >
          <ShieldCheck className="size-3.5 text-signal-warn" aria-hidden />
          {REFUSAL_EXAMPLE}
          <span className="text-signal-warn">(see a refusal)</span>
        </button>
      )}
    </div>
  );
}
