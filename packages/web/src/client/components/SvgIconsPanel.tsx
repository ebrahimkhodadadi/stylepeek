import { useState, useMemo } from 'react';
import type { SerializedDesignSystem } from '../../shared/types.js';

interface Props {
  icons: SerializedDesignSystem['assets']['icons'];
}

export function SvgIconsPanel({ icons }: Props) {
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filtered = useMemo(
    () =>
      search.trim()
        ? icons.filter(ic => ic.name.toLowerCase().includes(search.toLowerCase()))
        : icons,
    [icons, search],
  );

  function copySvg(svg: string, idx: number) {
    navigator.clipboard.writeText(svg).catch(() => {});
    setCopied(idx);
    setTimeout(() => setCopied(null), 1500);
  }

  function downloadSvg(icon: { name: string; svg: string }) {
    const blob = new Blob([icon.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${icon.name || 'icon'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadAllSvg() {
    // Download as a single concatenated SVG sprite or individual files via zip-like approach
    // Simple approach: download each one, or create a sprite sheet
    const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${icons
      .map((ic, i) => {
        // Wrap each icon in a <symbol>
        const inner = ic.svg
          .replace(/<svg[^>]*>/, '')
          .replace(/<\/svg>/, '');
        const viewBox = ic.svg.match(/viewBox="([^"]+)"/)?.[1] || '0 0 24 24';
        return `  <symbol id="${ic.name || `icon-${i}`}" viewBox="${viewBox}">\n    ${inner}\n  </symbol>`;
      })
      .join('\n')}\n</svg>`;
    const blob = new Blob([sprite], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'icons-sprite.svg';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (icons.length === 0) {
    return (
      <div className="animate-slide-up card text-center py-12">
        <span className="text-4xl mb-3 block">🔍</span>
        <p className="text-gray-400">No SVG icons found on this site.</p>
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search icons…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg
                         text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap">{filtered.length} icons</span>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 text-xs ${viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6Zm0 9.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6Zm0 9.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1.5 text-xs ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
              </svg>
            </button>
          </div>

          {/* Download all */}
          <button
            onClick={downloadAllSvg}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-brand-400 bg-brand-500/10
                       border border-brand-500/30 rounded-lg hover:bg-brand-500/20 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download Sprite
          </button>
        </div>
      </div>

      {/* Grid view */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {filtered.map((icon, i) => (
            <div key={i} className="group relative">
              <button
                className="w-full aspect-square flex items-center justify-center bg-gray-900 rounded-lg border border-gray-800
                           hover:border-brand-500 transition-all group"
                title={icon.name}
                onClick={() => copySvg(icon.svg, i)}
              >
                <div
                  className="w-7 h-7 text-gray-400 group-hover:text-white transition-colors [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: icon.svg }}
                />
                {copied === i && (
                  <span className="absolute inset-0 flex items-center justify-center bg-green-500/90 rounded-lg text-white text-xs font-bold">
                    Copied!
                  </span>
                )}
              </button>
              {/* Hover actions */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100
                              z-10 bg-gray-800 border border-gray-700 rounded-lg p-1 flex gap-1 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                <button
                  onClick={e => { e.stopPropagation(); downloadSvg(icon); }}
                  className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                  title="Download SVG"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <div className="card space-y-0 divide-y divide-gray-800">
          {filtered.map((icon, i) => (
            <div key={i} className="flex items-center gap-4 py-3 group">
              <div
                className="w-8 h-8 flex-shrink-0 text-gray-400 group-hover:text-white transition-colors [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: icon.svg }}
              />
              <span className="flex-1 text-sm text-gray-300 font-mono truncate">{icon.name || `icon-${i}`}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copySvg(icon.svg, i)}
                  className="px-2.5 py-1 text-xs rounded-md border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                >
                  {copied === i ? '✓ Copied' : 'Copy SVG'}
                </button>
                <button
                  onClick={() => downloadSvg(icon)}
                  className="px-2.5 py-1 text-xs rounded-md border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
