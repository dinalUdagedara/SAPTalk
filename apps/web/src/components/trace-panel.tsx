import { Check, ChevronDown, TriangleAlert } from 'lucide-react';
import type { AskResponse } from '@saptalk/shared';
import { IntentPanel } from '@/components/intent-panel';
import { QueryPanel } from '@/components/query-panel';
import { StepMarker, StepRail } from '@/components/step-rail';

function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

function Step({
  marker,
  title,
  meta,
  last = false,
  verified = false,
  children,
}: {
  marker: React.ReactNode;
  title: string;
  meta?: string;
  last?: boolean;
  verified?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <li className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3">
      <StepRail last={last} verified={verified}>
        <StepMarker verified={verified}>{marker}</StepMarker>
      </StepRail>
      <div className={last ? 'min-w-0' : 'min-w-0 pb-5'}>
        <div className="flex min-h-[26px] flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
          <h3 className={verified ? 'font-medium text-verified' : 'font-medium'}>{title}</h3>
          {meta && <span className="font-mono text-xs text-muted-foreground">{meta}</span>}
        </div>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </li>
  );
}

/**
 * How an answer was produced, step by step: what the model decided, that our
 * code checked it, the exact OData sent to SAP, and what came back.
 *
 * Shown beside every answer rather than once on the first screen: the claim
 * "you see the query every time" is only true if it is always here. A join is
 * a step of its own, because a second request that happened silently would
 * make that claim false.
 */
export function TracePanel({ result }: { result: AskResponse }) {
  const { related } = result;
  const retried = result.attempts > 1;
  // Step 2 is the allowlist gate (drawn with a check, not a number).
  const odataStep = related ? 4 : 3;

  return (
    <details
      open
      className="group rounded-xl border border-border bg-surface/55 [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3.5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-5">
        How this was answered
        <ChevronDown
          className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <ol className="px-4 pb-4 text-sm sm:px-5 sm:pb-5">
        <Step
          marker={1}
          title="The model wrote an intent"
          meta={`${result.model}, ${seconds(result.modelMs)}`}
        >
          <IntentPanel intent={result.intent} />
        </Step>

        <Step
          marker={<Check className="size-3.5" strokeWidth={3} aria-hidden />}
          title="Passed the allowlist"
          verified
        >
          <p className="rounded-lg border border-verified/45 bg-verified/[0.07] px-3 py-2.5 text-[13px] text-verified-soft">
            {retried
              ? `The validator rejected the model's first intent and it was corrected on attempt ${result.attempts}. `
              : ''}
            Our code checked every field and operator against the field registry before building a
            query. The model never writes OData itself.
          </p>
        </Step>

        {related && (
          <Step
            marker={3}
            title={`Related query on ${related.entity}`}
            meta={seconds(related.durationMs)}
          >
            <p className="mb-2 text-[13px] text-muted-foreground">
              This question spanned two objects. OData V2 can&apos;t filter across a relationship,
              so it ran as two queries joined on a shared key. It matched {related.matched} key
              {related.matched === 1 ? '' : 's'} in {related.requests} request
              {related.requests === 1 ? '' : 's'}.
            </p>
            <QueryPanel url={related.query} />
            {related.truncated && (
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-signal-warn/35 bg-signal-warn/[0.06] p-2.5">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-signal-warn" aria-hidden />
                <p className="text-[13px] text-muted-foreground">
                  <span className="font-medium text-foreground">These results are incomplete.</span>{' '}
                  More records matched than could be carried between the two queries, so rows
                  beyond the scan limit were never considered. Narrow the question to get a
                  complete answer.
                </p>
              </div>
            )}
          </Step>
        )}

        <Step marker={odataStep} title="OData sent to SAP" meta={seconds(result.durationMs)}>
          <QueryPanel url={result.query} />
        </Step>

        <Step
          marker={odataStep + 1}
          title={`${result.count} row${result.count === 1 ? '' : 's'} returned`}
          last
        />
      </ol>
    </details>
  );
}
