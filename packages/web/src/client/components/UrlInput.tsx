import { useState } from 'react';

interface Props {
  onSubmit: (url: string, opts: { depth: number; workers: number }) => void;
  disabled?: boolean;
}

export function UrlInput({ onSubmit, disabled }: Props) {
  const [url, setUrl] = useState('');
  const [depth, setDepth] = useState(2);
  const [showOpts, setShowOpts] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const trimmed = url.trim();
    if (!trimmed) { setError('Please enter a URL'); return; }

    let normalized = trimmed;
    if (!/^https?:\/\//i.test(normalized)) normalized = 'https://' + normalized;

    try {
      new URL(normalized);
    } catch {
      setError('Please enter a valid URL');
      return;
    }
    onSubmit(normalized, { depth, workers: 3 });
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="relative flex items-center gap-2">
        {/* URL input */}
        <div className="flex-1 flex items-center bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 gap-3
                        focus-within:border-brand-500 transition-colors">
          <svg className="w-5 h-5 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://stripe.com"
            disabled={disabled}
            className="flex-1 bg-transparent outline-none text-gray-100 placeholder-gray-600 text-base disabled:opacity-50"
            autoFocus
          />
        </div>

        {/* Options toggle */}
        <button
          type="button"
          onClick={() => setShowOpts(o => !o)}
          className="px-3 py-3 text-gray-500 hover:text-gray-300 bg-gray-900 border border-gray-700 rounded-xl transition-colors"
          title="Options"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
        </button>

        {/* Analyze button */}
        <button
          type="submit"
          disabled={disabled}
          className="px-6 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed
                     text-white font-semibold rounded-xl transition-colors whitespace-nowrap"
        >
          {disabled ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>

      {/* Options panel */}
      {showOpts && (
        <div className="mt-2 bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-6 text-sm animate-fade-in">
          <label className="flex items-center gap-2 text-gray-400">
            Crawl depth
            <select
              value={depth}
              onChange={e => setDepth(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200 outline-none"
            >
              {[0, 1, 2, 3, 4, 5].map(d => (
                <option key={d} value={d}>{d === 0 ? '0 (single page)' : d}</option>
              ))}
            </select>
          </label>
          <span className="text-gray-600 text-xs self-center">
            Depth 0 = single page · Depth 2 = up to ~20 pages
          </span>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-400 pl-1">{error}</p>
      )}
    </form>
  );
}
