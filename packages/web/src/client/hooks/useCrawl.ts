import { useCallback, useRef, useState } from 'react';
import type { SerializedDesignSystem, SseEvent } from '../../shared/types.js';

export type CrawlStatus = 'idle' | 'crawling' | 'analyzing' | 'done' | 'error';

export interface CrawlProgress {
  crawledPages: number;
  totalPages: number;
  currentUrl: string;
}

export interface CrawlOptions {
  depth?: number;
  workers?: number;
  waitAfterLoad?: number;
}

export interface CrawlState {
  status: CrawlStatus;
  progress: CrawlProgress | null;
  result: SerializedDesignSystem | null;
  error: string | null;
  log: string[];
}

export function useCrawl() {
  const [state, setState] = useState<CrawlState>({
    status: 'idle',
    progress: null,
    result: null,
    error: null,
    log: [],
  });

  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (url: string, opts: CrawlOptions = {}) => {
    // Cancel any ongoing crawl
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: 'crawling', progress: null, result: null, error: null, log: [] });

    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, ...opts }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const text = await response.text().catch(() => 'Unknown error');
        setState(s => ({ ...s, status: 'error', error: text }));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE lines are separated by \n\n, each line starts with "data: "
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          for (const line of part.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6)) as SseEvent;
              handleEvent(event);
            } catch {
              // ignore malformed
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setState(s => ({
        ...s,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      }));
    }

    function handleEvent(event: SseEvent) {
      switch (event.type) {
        case 'progress':
          setState(s => ({
            ...s,
            status: 'crawling',
            progress: {
              crawledPages: event.crawledPages,
              totalPages: event.totalPages,
              currentUrl: event.currentUrl,
            },
            log: [...s.log, `✓ ${event.currentUrl}`].slice(-50),
          }));
          break;

        case 'analyzing':
          setState(s => ({ ...s, status: 'analyzing' }));
          break;

        case 'result':
          setState(s => ({ ...s, result: event.data }));
          break;

        case 'error':
          setState(s => ({ ...s, status: 'error', error: event.message }));
          break;

        case 'done':
          setState(s => ({
            ...s,
            status: s.status === 'error' ? 'error' : 'done',
          }));
          break;
      }
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: 'idle', progress: null, result: null, error: null, log: [] });
  }, []);

  return { ...state, start, reset };
}
