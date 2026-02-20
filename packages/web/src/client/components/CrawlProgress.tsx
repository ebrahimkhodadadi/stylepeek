import type { CrawlProgress, CrawlStatus } from '../hooks/useCrawl.js';

interface Props {
  status: CrawlStatus;
  progress: CrawlProgress | null;
  log: string[];
}

export function CrawlProgress({ status, progress, log }: Props) {
  const isActive = status === 'crawling' || status === 'analyzing';

  const pct = progress
    ? Math.min(100, Math.round((progress.crawledPages / Math.max(progress.totalPages, 1)) * 100))
    : 0;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 animate-fade-in">
      {/* Status header */}
      <div className="flex items-center gap-3">
        {isActive && (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500" />
          </span>
        )}
        <span className="text-sm font-medium text-gray-300">
          {status === 'crawling' && progress
            ? `Crawling — ${progress.crawledPages} / ${progress.totalPages || '?'} pages`
            : status === 'analyzing'
            ? 'Analyzing design tokens…'
            : status === 'done'
            ? 'Done'
            : 'Starting…'}
        </span>
        {progress && (
          <span className="ml-auto text-xs text-gray-600 font-mono">{pct}%</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
          style={{ width: status === 'analyzing' ? '90%' : `${pct}%` }}
        />
      </div>

      {/* Current URL */}
      {progress?.currentUrl && (
        <p className="text-xs text-gray-500 font-mono truncate">
          → {progress.currentUrl}
        </p>
      )}

      {/* Crawl log */}
      {log.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 max-h-40 overflow-y-auto space-y-0.5">
          {[...log].reverse().map((entry, i) => (
            <p key={i} className="text-xs text-gray-500 font-mono truncate">{entry}</p>
          ))}
        </div>
      )}
    </div>
  );
}
