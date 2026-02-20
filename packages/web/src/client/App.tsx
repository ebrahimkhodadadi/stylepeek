import { useCrawl } from './hooks/useCrawl.js';
import { UrlInput } from './components/UrlInput.js';
import { CrawlProgress } from './components/CrawlProgress.js';
import { ResultsDashboard } from './components/ResultsDashboard.js';

export default function App() {
  const { status, progress, result, error, log, start, reset } = useCrawl();

  const isActive = status === 'crawling' || status === 'analyzing';
  const isDone = status === 'done' && result !== null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <span className="text-xl text-brand-500 font-bold select-none">◈</span>
          <span className="font-semibold text-gray-100">stylepeek</span>
          <span className="text-gray-600 text-sm hidden sm:block">— design system extractor</span>
          {isDone && (
            <span className="ml-auto text-xs px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">
              {result.colors.palette.length} colors · {result.typography.fontFamilies.length} fonts
            </span>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Hero — shown when idle or on error */}
        {!isDone && (
          <div className="text-center space-y-4 pb-4">
            {status === 'idle' && (
              <>
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  Extract any design system
                </h1>
                <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
                  Enter a URL — stylepeek crawls the site, extracts every design
                  token, and shows colors, typography, spacing &amp; more in real time.
                </p>
              </>
            )}
          </div>
        )}

        {/* URL input — hide while showing results */}
        {!isDone && (
          <UrlInput
            onSubmit={(url, opts) => start(url, opts)}
            disabled={isActive}
          />
        )}

        {/* Crawl progress */}
        {isActive && (
          <CrawlProgress status={status} progress={progress} log={log} />
        )}

        {/* Error */}
        {status === 'error' && error && (
          <div className="max-w-3xl mx-auto bg-red-500/10 border border-red-500/30 rounded-xl p-5 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-red-400 font-medium">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              Crawl failed
            </div>
            <p className="text-sm text-red-300/80 font-mono break-all">{error}</p>
            <button onClick={reset} className="text-xs text-red-400 hover:text-red-300 underline">
              Try again
            </button>
          </div>
        )}

        {/* Results */}
        {isDone && (
          <ResultsDashboard ds={result} onReset={reset} />
        )}

        {/* Example sites — only on idle */}
        {status === 'idle' && (
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-gray-600 mb-3 text-center">Try an example</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'https://stripe.com',
                'https://linear.app',
                'https://vercel.com',
                'https://tailwindcss.com',
                'https://github.com',
              ].map(site => (
                <button
                  key={site}
                  onClick={() => start(site, { depth: 1 })}
                  className="tag hover:bg-gray-700 hover:text-gray-200 transition-colors cursor-pointer py-1.5 px-3"
                >
                  {site.replace('https://', '')}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
