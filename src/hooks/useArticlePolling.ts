import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Article } from '../types';

const MAX_WAIT_MS = 5 * 60 * 1000;

export interface PollState {
  article: Article | null;
  error: boolean;
  timedOut: boolean;
  retry: () => void;
}

/**
 * Loads an article and, while it is still PROCESSING (the backend analyses asynchronously),
 * keeps polling with a gentle backoff until it settles.
 */
export function useArticlePolling(id: string | null): PollState {
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setArticle(null);
    setError(false);
    setTimedOut(false);
    if (!id) return;

    let cancelled = false;
    let timer: number | undefined;
    let delay = 2500;
    const startedAt = Date.now();

    const tick = async () => {
      try {
        const { data } = await api.get<Article>(`/article/${id}`);
        if (cancelled) return;
        setArticle(data);
        if (data.status !== 'PROCESSING') return;
        if (Date.now() - startedAt > MAX_WAIT_MS) {
          setTimedOut(true);
          return;
        }
        delay = Math.min(delay * 1.25, 8000);
        timer = window.setTimeout(tick, delay);
      } catch {
        if (!cancelled) setError(true);
      }
    };
    void tick();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [id, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { article, error, timedOut, retry };
}
