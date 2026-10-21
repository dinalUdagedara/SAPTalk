import { cn } from '@/lib/utils';

/**
 * The numbered rail shared by the "how it works" panel and the answer trace.
 * Numbers are used because these really are a sequence.
 */
export function StepRail({
  children,
  last = false,
  verified = false,
}: {
  children: React.ReactNode;
  last?: boolean;
  verified?: boolean;
}) {
  return (
    <div className="flex flex-col items-center" aria-hidden>
      {children}
      {!last && (
        <span
          className={cn('mt-1 w-px flex-1', verified ? 'bg-verified/50' : 'bg-border')}
        />
      )}
    </div>
  );
}

export function StepMarker({
  children,
  verified = false,
}: {
  children: React.ReactNode;
  verified?: boolean;
}) {
  return (
    <span
      className={cn(
        'grid size-[26px] shrink-0 place-items-center rounded-full font-mono text-xs',
        verified
          ? 'bg-verified text-verified-foreground'
          : 'border border-border text-muted-foreground',
      )}
    >
      {children}
    </span>
  );
}
