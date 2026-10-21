'use client';

import { useEffect, useState } from 'react';
import { Clock, Loader2, ShieldCheck, TriangleAlert, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExampleQuestions } from '@/components/example-questions';
import type { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

/** After this long, say so: the model and the sandbox can both be slow. */
const SLOW_AFTER_S = 8;

/**
 * A question in flight.
 *
 * Shows elapsed time and a way out, because a cold sandbox or a model retry
 * can take most of a minute and a static skeleton gives no sign of life. The
 * live region only changes once (when it turns slow), so a screen reader is
 * not read a ticking clock.
 */
export function LoadingState({ onCancel }: { onCancel: () => void }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const slow = elapsed >= SLOW_AFTER_S;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3 rounded-xl border border-border bg-surface/55 px-4 py-4 sm:px-5">
        <Loader2 className="mt-0.5 size-[18px] shrink-0 animate-spin text-primary" aria-hidden />
        <div className="min-w-0 flex-1" role="status">
          <div className="flex items-baseline gap-2.5">
            <span className="font-medium">
              {slow ? 'Still working on your question' : 'Turning your question into a query'}
            </span>
            <span className="tabular font-mono text-xs text-muted-foreground" aria-hidden>
              {elapsed}s
            </span>
          </div>
          {slow && (
            <p className="mt-1 max-w-[62ch] text-[13px] text-muted-foreground">
              The model and the SAP sandbox can take up to a minute when they are busy or starting
              up. You can keep waiting or cancel.
            </p>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onCancel} className="h-9">
          Cancel
        </Button>
      </div>

      <div className="flex flex-col gap-5 opacity-60 lg:flex-row" aria-hidden>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-11 rounded-lg" />
          <Skeleton className="h-11 rounded-lg opacity-70" />
          <Skeleton className="h-11 rounded-lg opacity-45" />
        </div>
        <Skeleton className="h-44 rounded-xl lg:w-[440px]" />
      </div>
    </div>
  );
}

interface Copy {
  title: string;
  body?: string;
  tone: 'error' | 'neutral' | 'blocked';
  icon: React.ComponentType<{ className?: string }>;
  retry: boolean;
  /** Show the backend's own message as a detail line. */
  detail: boolean;
}

function minutes(seconds: number): string {
  const m = Math.max(1, Math.round(seconds / 60));
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'}`;
  const h = Math.round(m / 60);
  return `${h} hour${h === 1 ? '' : 's'}`;
}

/**
 * Turn a failure into something a visitor can act on.
 *
 * The backend's messages are accurate but written for a developer ("The model
 * returned 401."). They stay on screen as a detail line; the heading says what
 * it means and what to do next.
 */
function describe(error: ApiError): Copy {
  if (error.status === 422 && error.reasons.length > 0) {
    return {
      title: error.message,
      body: 'The validator refused the query the model produced. Nothing was sent to SAP.',
      tone: 'blocked',
      icon: ShieldCheck,
      retry: false,
      detail: false,
    };
  }
  if (error.status === 429) {
    return {
      title: "You've reached this demo's question limit for now",
      body:
        error.message +
        (error.retryAfter ? ` You can ask again in about ${minutes(error.retryAfter)}.` : ''),
      tone: 'neutral',
      icon: Clock,
      retry: false,
      detail: false,
    };
  }
  if (error.status === 0) {
    return {
      title: "SAPTalk's server isn't responding",
      body: 'It may be starting up after a quiet period. Try again in a few seconds.',
      tone: 'error',
      icon: WifiOff,
      retry: true,
      detail: false,
    };
  }
  if (error.status === 400) {
    return { title: error.message, tone: 'neutral', icon: TriangleAlert, retry: false, detail: false };
  }

  const fromModel = /model/i.test(error.message);
  const fromSap = /SAP/.test(error.message);
  if (error.status === 502 || error.status === 504) {
    if (fromModel) {
      return {
        title: "The AI model didn't give an answer",
        body: 'Nothing was sent to SAP. This is usually temporary, so try again in a moment.',
        tone: 'error',
        icon: TriangleAlert,
        retry: true,
        detail: true,
      };
    }
    if (fromSap) {
      return {
        title: "The SAP sandbox didn't answer",
        body: "The query was built and checked, but SAP's public sandbox didn't respond in time. Try again in a moment.",
        tone: 'error',
        icon: TriangleAlert,
        retry: true,
        detail: true,
      };
    }
  }

  return {
    title: 'Something went wrong on the server',
    body: 'Try again in a moment.',
    tone: 'error',
    icon: TriangleAlert,
    retry: true,
    detail: true,
  };
}

const TONE = {
  error: { box: 'border-destructive/45 bg-destructive/[0.07]', icon: 'text-destructive' },
  neutral: { box: 'border-border bg-surface/55', icon: 'text-muted-foreground' },
  blocked: { box: 'border-signal-warn/35 bg-signal-warn/[0.06]', icon: 'text-signal-warn' },
} as const;

export function ErrorPanel({
  error,
  onRetry,
  onPick,
}: {
  error: ApiError;
  onRetry: () => void;
  onPick: (question: string) => void;
}) {
  const copy = describe(error);
  const tone = TONE[copy.tone];
  const Icon = copy.icon;

  return (
    <div
      role={copy.tone === 'neutral' ? 'status' : 'alert'}
      className={cn('flex flex-wrap items-start gap-x-4 gap-y-3 rounded-xl border px-4 py-4 sm:px-5', tone.box)}
    >
      <Icon className={cn('mt-0.5 size-[18px] shrink-0', tone.icon)} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{copy.title}</p>
        {copy.body && (
          <p className="mt-1 max-w-[70ch] text-[13px] text-muted-foreground">{copy.body}</p>
        )}
        {copy.detail && (
          <p className="mt-2 font-mono text-xs break-words text-muted-foreground">
            Details: {error.message}
          </p>
        )}

        {copy.tone === 'blocked' && (
          <>
            <ul className="mt-3 flex flex-col gap-1.5">
              {error.reasons.map((reason) => (
                <li
                  key={reason}
                  className="rounded-lg border border-border/70 bg-background/50 px-3 py-2 font-mono text-xs leading-relaxed text-muted-foreground"
                >
                  {reason}
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <ExampleQuestions
                onPick={onPick}
                disabled={false}
                includeRefusal={false}
                label="Try one that works"
              />
            </div>
          </>
        )}
      </div>
      {copy.retry && (
        <Button type="button" size="sm" onClick={onRetry} className="h-9">
          Try again
        </Button>
      )}
    </div>
  );
}
