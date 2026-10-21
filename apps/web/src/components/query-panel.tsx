'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Break a query URL into readable parts.
 *
 * The URL arrives percent-encoded and on one line, which is unreadable at the
 * size that matters. Decoding and splitting is presentation only -- the string
 * copied to the clipboard is the real one.
 */
function splitQuery(url: string): { base: string; params: [string, string][] } {
  const [base, search = ''] = url.split('?');
  const params = search
    .split('&')
    .filter(Boolean)
    .map((pair): [string, string] => {
      const index = pair.indexOf('=');
      return [decodePart(pair.slice(0, index)), decodePart(pair.slice(index + 1))];
    });
  return { base, params };
}

/**
 * Decode one query-string component.
 *
 * A query string encodes a space as `+`, which decodeURIComponent leaves alone
 * -- so a filter renders as `BusinessPartnerCategory+eq+'2'` without this.
 */
function decodePart(part: string): string {
  return decodeURIComponent(part.replace(/\+/g, ' '));
}

/** Shorten the host; the service and entity set are the parts that matter. */
function shortenBase(base: string): { service: string; entitySet: string } {
  const match = /\/([A-Za-z_]+)\/([A-Za-z_]+)$/.exec(base);
  return match ? { service: `…/${match[1]}/`, entitySet: match[2] } : { service: '', entitySet: base };
}

/** Parameters that are plumbing rather than the question; shown dimmed. */
const PLUMBING = new Set(['$format']);

/**
 * Values longer than this are collapsed by default.
 *
 * A join restricts by an or-chain of up to a hundred keys, which runs to
 * thousands of characters and buries the condition the user actually asked
 * about. Collapsing keeps the panel readable; the full text is one click away
 * and the copy button always copies the real URL.
 */
const COLLAPSE_OVER = 240;

/** What our code built, laid out one parameter per line. */
export function QueryPanel({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { base, params } = splitQuery(url);
  const { service, entitySet } = shortenBase(base);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked by permissions; the query is on screen anyway.
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <pre className="overflow-x-auto rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-[12px] leading-[1.7] whitespace-pre-wrap break-words">
        <code>
          <span className="text-muted-foreground">GET {service}</span>
          <span className="text-foreground">{entitySet}</span>
          {params.map(([key, value], index) => {
            const long = value.length > COLLAPSE_OVER;
            const open = expanded[key] ?? false;
            const shown = long && !open ? value.slice(0, COLLAPSE_OVER) : value;
            const separator = index === 0 ? '?' : '&';

            if (PLUMBING.has(key)) {
              return (
                <span key={key} className="block pl-3 text-muted-foreground">
                  {separator}
                  {key}={value}
                </span>
              );
            }

            return (
              <span key={key} className="block pl-3">
                {/* The `&$key=` prefix must not break, or a long value pushes
                    it onto a line of its own. Only the value wraps. */}
                <span className="whitespace-nowrap">
                  <span className="text-muted-foreground">{separator}</span>
                  <span className="text-verified">{key}</span>
                  <span className="text-muted-foreground">=</span>
                </span>
                <span className="break-all text-foreground">{shown}</span>
                {long && (
                  <>
                    {!open && <span className="text-muted-foreground">…</span>}{' '}
                    <button
                      type="button"
                      onClick={() => setExpanded((current) => ({ ...current, [key]: !open }))}
                      className="rounded text-[11.5px] text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {open ? 'show less' : `show all ${value.length.toLocaleString()} characters`}
                    </button>
                  </>
                )}
              </span>
            );
          })}
        </code>
      </pre>
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copy}
          className="h-8 gap-1.5 text-xs"
        >
          {copied ? (
            <Check className="size-3.5 text-verified" aria-hidden />
          ) : (
            <Copy className="size-3.5" aria-hidden />
          )}
          <span aria-live="polite">{copied ? 'Copied' : 'Copy URL'}</span>
        </Button>
      </div>
    </div>
  );
}
