import type { AskResponse } from '@saptalk/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

/**
 * Error carrying the backend's own message, plus the validator's reasons when a
 * question was rejected. Those reasons are the useful part -- they say which
 * field or operator was not allowed.
 *
 * `status` 0 means the request never got a response (network down, server
 * asleep). `retryAfter` is the rate limiter's wait, in seconds.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly reasons: string[] = [],
    readonly retryAfter?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorBody {
  message?: string;
  errors?: string[];
  retryAfter?: number;
}

async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal,
    });
  } catch (error) {
    // A cancel is the user's choice, not a failure; let the caller see it as such.
    if (signal?.aborted) throw error;
    throw new ApiError('Could not reach the SAPTalk server.', 0);
  }

  const payload = (await response.json().catch(() => null)) as ErrorBody | null;

  if (!response.ok) {
    throw new ApiError(
      payload?.message ?? `Request failed with ${response.status}.`,
      response.status,
      payload?.errors ?? [],
      payload?.retryAfter,
    );
  }

  return payload as T;
}

/** Ask a question in plain English. */
export function askQuestion(question: string, signal?: AbortSignal): Promise<AskResponse> {
  return post<AskResponse>('/ask', { question }, signal);
}
