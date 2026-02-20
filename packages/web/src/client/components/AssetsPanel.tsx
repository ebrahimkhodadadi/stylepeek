import { useState } from 'react';
import type { SerializedDesignSystem } from '../../shared/types.js';

interface Props {
  assets: SerializedDesignSystem['assets'];
}

export function AssetsPanel({ assets }: Props) {
  const [tab, setTab] = useState<'images' | 'fonts'>('images');
  const images = assets.images ?? [];
  const fonts = assets.fonts ?? [];

  function downloadImage(img: { url: string; format: string; alt?: string }) {
    const a = document.createElement('a');
    a.href = img.url;
    a.download = img.alt || `image.${img.format || 'png'}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  }

  function downloadFont(font: { family: string; url: string; format: string }) {
    if (!font.url) return;
    const a = document.createElement('a');
    a.href = font.url;
    a.download = `${font.family}.${font.format || 'woff2'}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  }

  const hasImages = images.length > 0;
  const hasFonts = fonts.length > 0;

  if (!hasImages && !hasFonts) {
    return (
      <div className="animate-slide-up card text-center py-12">
        <span className="text-4xl mb-3 block">📦</span>
        <p className="text-gray-400">No downloadable assets found on this site.</p>
      </div>
    );
  }

  const subTabs = [
    ...(hasImages ? [{ id: 'images' as const, label: 'Images', count: images.length }] : []),
    ...(hasFonts ? [{ id: 'fonts' as const, label: 'Fonts', count: fonts.length }] : []),
  ];

  return (
    <div className="animate-slide-up space-y-4">
      {/* Sub-tabs */}
      {subTabs.length > 1 && (
        <div className="flex gap-2">
          {subTabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                tab === t.id
                  ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                  : 'border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              {t.label}
              <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded bg-gray-800">{t.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Images tab */}
      {tab === 'images' && hasImages && (
        <div className="space-y-4">
          {/* Download all */}
          <div className="flex justify-end">
            <button
              onClick={() => images.forEach(img => downloadImage(img))}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-brand-400 bg-brand-500/10
                         border border-brand-500/30 rounded-lg hover:bg-brand-500/20 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download All Images
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img, i) => (
              <div key={i} className="group relative bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-colors">
                {/* Image preview */}
                <div className="aspect-video bg-gray-800/50 flex items-center justify-center overflow-hidden">
                  <img
                    src={img.url}
                    alt={img.alt || `Image ${i + 1}`}
                    className="max-w-full max-h-full object-contain"
                    loading="lazy"
                    onError={e => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                        '<span class="text-gray-600 text-xs">Failed to load</span>';
                    }}
                  />
                </div>
                {/* Info */}
                <div className="p-3 space-y-2">
                  <p className="text-xs text-gray-400 truncate font-mono" title={img.url}>
                    {img.alt || extractFilename(img.url)}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <span className="tag">{img.format || img.type}</span>
                      <span className="tag">{img.type}</span>
                    </div>
                    <button
                      onClick={() => downloadImage(img)}
                      className="p-1.5 rounded-md border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                      title="Download"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fonts tab */}
      {tab === 'fonts' && hasFonts && (
        <div className="space-y-4">
          <div className="card space-y-0 divide-y divide-gray-800">
            {fonts.map((font, i) => (
              <div key={i} className="flex items-center gap-4 py-3.5 group">
                {/* Font preview */}
                <div className="w-10 h-10 flex-shrink-0 bg-gray-800 rounded-lg flex items-center justify-center text-lg font-bold text-gray-300">
                  Aa
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{font.family}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="tag">{font.format}</span>
                    <span className="tag capitalize">{font.source.replace('-', ' ')}</span>
                  </div>
                </div>
                {font.url && (
                  <button
                    onClick={() => downloadFont(font)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-gray-700
                               text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Download
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function extractFilename(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname.split('/').pop() || url;
  } catch {
    return url;
  }
}
