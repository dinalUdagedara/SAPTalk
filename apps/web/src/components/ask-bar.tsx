'use client';

import { ArrowUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AskBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  /** Larger on the first screen, where it is the only thing to do. */
  size?: 'hero' | 'compact';
}

/**
 * The primary input. Everything else on screen is a consequence of what is
 * typed here.
 *
 * While a question runs the input goes read-only rather than disabled: a
 * disabled input drops keyboard focus to the page body, and a keyboard user
 * would have to tab back from the top.
 */
export function AskBar({ value, onChange, onSubmit, loading, size = 'compact' }: AskBarProps) {
  const canSubmit = value.trim().length > 0 && !loading;
  const hero = size === 'hero';

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit();
      }}
      className={cn(
        'flex w-full items-center gap-2 rounded-xl border border-border bg-surface',
        'transition-[border-color,box-shadow] focus-within:border-primary/70',
        'focus-within:shadow-[0_0_0_4px_oklch(0.72_0.14_252/0.16)]',
        hero ? 'py-2.5 pl-4 pr-2.5 sm:pl-5' : 'py-2 pl-3.5 pr-2 sm:pl-4',
      )}
    >
      <label htmlFor="question" className="sr-only">
        Ask a question about SAP business data
      </label>
      <input
        id="question"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        readOnly={loading}
        aria-busy={loading}
        maxLength={300}
        autoComplete="off"
        placeholder="Ask about business partners or their addresses"
        className={cn(
          'min-w-0 flex-1 bg-transparent text-foreground outline-none',
          'placeholder:text-muted-foreground read-only:text-muted-foreground',
          hero ? 'h-12 text-base sm:text-[17px]' : 'h-11 text-base sm:text-[15px]',
        )}
      />
      <Button
        type="submit"
        size="icon"
        disabled={!canSubmit}
        aria-label={loading ? 'Running question' : 'Run question'}
        className={cn('shrink-0 rounded-lg', hero ? 'size-12' : 'size-11 sm:size-10')}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
      </Button>
    </form>
  );
}
