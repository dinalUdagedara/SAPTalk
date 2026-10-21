'use client';

import { useRef, useState } from 'react';
import { ChevronRight, ShieldQuestion } from 'lucide-react';
import type { AskResponse } from '@saptalk/shared';
import { AskBar } from '@/components/ask-bar';
import { EmptyState } from '@/components/empty-state';
import { ExampleQuestions } from '@/components/example-questions';
import { ResultsTable } from '@/components/results-table';
import { ErrorPanel, LoadingState } from '@/components/status-panels';
import { TracePanel } from '@/components/trace-panel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiError, askQuestion } from '@/lib/api';
import {
  describeCount,
  describeIntent,
  filterableLabels,
  isUnfiltered,
} from '@/lib/describe-intent';
import { cn } from '@/lib/utils';

/** One width for header and content, so their edges line up. */
const CONTAINER = 'mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-10';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);
  // Read out by screen readers when an answer lands. Errors announce
  // themselves (role="alert"), and the loading panel is its own status.
  const [announcement, setAnnouncement] = useState('');
  const inFlight = useRef<AbortController | null>(null);

  async function run(text: string = question) {
    const trimmed = text.trim();
    if (!trimmed) return;

    // A chip or "Try again" button is disabled or removed while the question
    // runs; keep keyboard focus on the question instead of losing it.
    document.getElementById('question')?.focus({ preventScroll: true });

    const controller = new AbortController();
    inFlight.current = controller;
    setLoading(true);
    setError(null);
    setAnnouncement('');

    try {
      const answer = await askQuestion(trimmed, controller.signal);
      setResult(answer);
      setAnnouncement(`${describeCount(answer.entity, answer.count)} returned.`);
    } catch (caught) {
      // Cancelled by the user: go back to whatever was on screen before.
      if (controller.signal.aborted) return;
      setResult(null);
      setError(
        caught instanceof ApiError ? caught : new ApiError('Something went wrong.', 500),
      );
    } finally {
      if (inFlight.current === controller) {
        inFlight.current = null;
        setLoading(false);
      }
    }
  }

  function cancel() {
    inFlight.current?.abort();
    inFlight.current = null;
    setLoading(false);
    setAnnouncement('Question cancelled.');
  }

  function pickExample(example: string) {
    setQuestion(example);
    void run(example);
  }

  /** The logo: back to the first screen, ready for a new question. */
  function startOver() {
    inFlight.current?.abort();
    inFlight.current = null;
    setLoading(false);
    setResult(null);
    setError(null);
    setQuestion('');
    setAnnouncement('');
    window.scrollTo({ top: 0 });
    // After React has swapped the layout back in.
    requestAnimationFrame(() => document.getElementById('question')?.focus());
  }

  const idle = !loading && !error && !result;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border/80 bg-background/85 backdrop-blur">
        <div className={cn(CONTAINER, 'flex h-14 items-center justify-between gap-3')}>
          <div className="flex min-w-0 items-center gap-3">
            <a
              href="/"
              onClick={(event) => {
                event.preventDefault();
                startOver();
              }}
              aria-label="SAPTalk, back to start"
              className="-ml-1 flex items-center gap-2.5 rounded-lg px-1 py-1 transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span
                className="grid size-7 place-items-center rounded-md border border-border bg-surface"
                aria-hidden
              >
                <ChevronRight className="size-4 text-verified" strokeWidth={3} />
              </span>
              <span className="text-[15px] font-semibold tracking-tight">SAPTalk</span>
            </a>
            <span className="hidden text-[13px] text-muted-foreground md:inline">
              Natural language to OData
            </span>
          </div>
          <span className="truncate text-xs text-muted-foreground sm:text-[13px]">
            S/4HANA Cloud sandbox<span className="hidden sm:inline">, Business Partner API</span>
          </span>
        </div>
      </header>

      <main className={cn(CONTAINER, 'pb-24', idle ? 'pt-10 sm:pt-16 lg:pt-24' : 'pt-8 sm:pt-10')}>
        {/* One tree for both layouts, only the classes change: if the first
            screen and the answer screen rendered separate ask bars, React
            would swap the input out mid-question and keyboard focus would
            drop to the page. */}
        <div
          className={cn(
            'flex flex-col',
            idle && 'gap-10 lg:flex-row lg:items-start lg:gap-16',
          )}
        >
          <div className={cn('min-w-0', idle && 'lg:flex-[6]')}>
            <h1
              className={cn(
                'font-semibold text-balance',
                idle
                  ? 'max-w-[18ch] text-[32px] leading-[1.1] tracking-[-0.025em] sm:text-[44px]'
                  : 'text-xl tracking-[-0.015em] sm:text-2xl',
              )}
            >
              Ask SAP questions in plain English
            </h1>
            {idle && (
              <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-muted-foreground sm:text-[17px]">
                SAPTalk turns your question into an OData query against SAP S/4HANA Cloud&apos;s
                Business Partner sandbox, then shows you the rows and the exact query it ran.
              </p>
            )}
            <div className={cn('flex flex-col', idle ? 'mt-8 gap-4' : 'mt-4 gap-3')}>
              <AskBar
                value={question}
                onChange={setQuestion}
                onSubmit={() => void run()}
                loading={loading}
                size={idle ? 'hero' : 'compact'}
              />
              <ExampleQuestions onPick={pickExample} disabled={loading} />
            </div>
          </div>
          {idle && (
            <div className="min-w-0 lg:flex-[4]">
              <EmptyState />
            </div>
          )}
        </div>

        {!idle && (
          <div className="mt-9">
            {loading && <LoadingState onCancel={cancel} />}
            {!loading && error && (
              <ErrorPanel error={error} onRetry={() => void run()} onPick={pickExample} />
            )}
            {!loading && !error && result && <Result result={result} />}
          </div>
        )}

        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
      </main>
    </div>
  );
}

function Result({ result }: { result: AskResponse }) {
  const heading = describeCount(result.entity, result.count);

  return (
    <section aria-labelledby="answer-heading">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div className="min-w-0">
          <h2 id="answer-heading" className="text-xl font-semibold tracking-[-0.01em] sm:text-[22px]">
            {heading}
          </h2>
          <p className="mt-1 max-w-[80ch] text-[13.5px] text-muted-foreground">
            {describeIntent(result.intent)}
          </p>
        </div>
        <dl className="flex gap-5 text-[13px]">
          <Metric label="Model" value={`${(result.modelMs / 1000).toFixed(1)}s`} />
          <Metric label="SAP" value={`${(result.durationMs / 1000).toFixed(1)}s`} />
          <Metric
            label="Attempts"
            value={String(result.attempts)}
            warn={result.attempts > 1}
          />
        </dl>
      </div>

      {isUnfiltered(result.intent) && <UnfilteredNotice result={result} />}

      <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start">
        {/* First in the DOM so a phone shows the query before 25 cards; moved
            to the right on wide screens, where it stays in view while the rows
            scroll. */}
        <div className="min-w-0 lg:sticky lg:top-20 lg:order-last lg:max-h-[calc(100vh-6rem)] lg:w-[440px] lg:shrink-0 lg:overflow-y-auto xl:w-[480px]">
          <TracePanel result={result} />
        </div>

        <div className="min-w-0 flex-1">
          <Tabs defaultValue="rows">
            <TabsList className="h-9 max-w-full justify-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <TabsTrigger value="rows" className="px-3">
                Rows
                <span className="tabular font-mono text-[11px] text-muted-foreground">
                  {result.count}
                </span>
              </TabsTrigger>
              <TabsTrigger value="intent" className="px-3">
                Intent JSON
              </TabsTrigger>
              <TabsTrigger value="raw" className="px-3">
                Raw SAP response
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rows" className="mt-1 rounded-xl focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              <ResultsTable
                columns={result.columns}
                rows={result.data}
                top={result.intent.top}
                caption={`${heading} returned by SAP`}
              />
            </TabsContent>
            <TabsContent value="intent" className="mt-1 rounded-xl focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              <JsonBlock value={result.intent} />
            </TabsContent>
            <TabsContent value="raw" className="mt-1 rounded-xl focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              <JsonBlock value={result.raw} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}

/**
 * Said out loud when nothing in the question narrowed the search.
 *
 * The model can only name allowlisted fields, so a question about data SAPTalk
 * doesn't hold ("total revenue last quarter") runs unfiltered rather than
 * failing. Without this, the first N rows would look like an answer.
 */
function UnfilteredNotice({ result }: { result: AskResponse }) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-xl border border-signal-warn/35 bg-signal-warn/[0.06] px-4 py-3">
      <ShieldQuestion className="mt-0.5 size-4 shrink-0 text-signal-warn" aria-hidden />
      <div className="text-[13px] text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">
            Nothing in this question matched a field SAPTalk can filter on,
          </span>{' '}
          so these are the first {result.intent.top} rows, unfiltered. Data outside the field
          registry, such as revenue or invoices, can&apos;t be asked about.
        </p>
        <p className="mt-1">
          You can filter on: {filterableLabels(result.entity).join(', ')}.
        </p>
      </div>
    </div>
  );
}

function Metric({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('tabular font-mono', warn ? 'text-signal-warn' : 'text-foreground')}>
        {value}
      </dd>
    </div>
  );
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[32rem] overflow-auto rounded-xl border border-border bg-surface/40 p-4 font-mono text-xs leading-relaxed text-muted-foreground">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
