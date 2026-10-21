import { Check } from 'lucide-react';
import { StepMarker, StepRail } from '@/components/step-rail';

interface Stage {
  title: string;
  detail: string;
  /** The trust boundary, drawn differently from the steps around it. */
  gate?: boolean;
}

const STAGES: Stage[] = [
  { title: 'You ask in plain English', detail: 'Up to 300 characters, about partners or their addresses.' },
  {
    title: 'The model fills in a query intent',
    detail: 'Structured JSON: object, filters, sort and limit. Never a query string.',
  },
  {
    title: 'Our code checks it against the allowlist',
    detail: 'Every field and operator must be in the registry, or the question is refused.',
    gate: true,
  },
  {
    title: 'Our code compiles it to OData',
    detail: '$filter, $orderby, $top and $select, built from the checked intent.',
  },
  {
    title: 'SAP returns the rows',
    detail: 'Shown next to the exact query, so you can check one against the other.',
  },
];

/**
 * Shown before the first question, beside the ask bar.
 *
 * The pipeline is the product's argument, so it is stated once, where a
 * first-time visitor will read it. Once there is an answer, the same steps
 * reappear filled in with what actually happened (see TracePanel).
 */
export function EmptyState() {
  return (
    <section
      aria-labelledby="how-it-works"
      className="rounded-2xl border border-border bg-surface/55 p-5 sm:p-7"
    >
      <h2 id="how-it-works" className="text-base font-semibold">
        How a question becomes a query
      </h2>
      <p className="mt-1.5 text-[13.5px] text-muted-foreground">
        The model never writes the query. Our own code checks what it asks for before anything
        reaches SAP.
      </p>

      <ol className="mt-5 flex flex-col">
        {STAGES.map((stage, index) => (
          <li key={stage.title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3.5">
            <StepRail last={index === STAGES.length - 1} verified={stage.gate}>
              {stage.gate ? (
                <StepMarker verified>
                  <Check className="size-3.5" strokeWidth={3} aria-hidden />
                </StepMarker>
              ) : (
                <StepMarker>{index + 1}</StepMarker>
              )}
            </StepRail>
            <div className={index === STAGES.length - 1 ? '' : 'pb-4'}>
              {stage.gate ? (
                <div className="rounded-lg border border-verified/45 bg-verified/[0.07] px-3 py-2.5">
                  <div className="font-medium text-verified">{stage.title}</div>
                  <div className="text-[13px] text-verified-soft">{stage.detail}</div>
                </div>
              ) : (
                <>
                  <div className="font-medium">{stage.title}</div>
                  <div className="text-[13px] text-muted-foreground">{stage.detail}</div>
                </>
              )}
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-5 border-t border-border pt-4 text-[12.5px] text-muted-foreground">
        Built with Next.js, NestJS, OpenAI Structured Outputs and SAP&apos;s OData V2 Business
        Partner API.
      </p>
    </section>
  );
}
