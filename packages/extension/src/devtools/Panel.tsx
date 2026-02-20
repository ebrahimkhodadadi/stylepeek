import React, { useState, useEffect, useCallback } from 'react';
import type { ExtractedPageData } from '../content/extract';

export function Panel() {
  const [data, setData] = useState<ExtractedPageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const extract = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tabId = chrome.devtools.inspectedWindow.tabId;
      const response = await chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_PAGE' });
      if (!response.ok) throw new Error(response.error);
      setData(response.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-extract on panel open
  useEffect(() => { extract(); }, [extract]);

  const copyValue = useCallback((val: string) => {
    navigator.clipboard.writeText(val);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-500">Extracting design tokens...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-3">{error}</p>
          <button onClick={extract} className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-3 border-b bg-white">
        <span className="text-brand-500 text-lg">◈</span>
        <span className="font-bold text-sm">Stylepeek</span>
        <input
          type="text"
          placeholder="Search tokens..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm px-3 py-1.5 border rounded-lg outline-none focus:border-brand-500"
        />
        <button onClick={extract} className="text-xs px-3 py-1.5 bg-brand-500 text-white rounded-lg">
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Overview */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="CSS Rules" value={data.cssRules.length} />
          <StatCard label="Custom Props" value={Object.keys(data.customProperties).length} />
          <StatCard label="Font Faces" value={data.fontFaces.length} />
          <StatCard label="Icons" value={data.svgs.length} />
        </div>

        {/* Custom properties */}
        {Object.keys(data.customProperties).length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              CSS Custom Properties ({Object.keys(data.customProperties).length})
            </h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {Object.entries(data.customProperties)
                .filter(([k, v]) => {
                  if (!search) return true;
                  return k.toLowerCase().includes(search.toLowerCase()) ||
                    v.toLowerCase().includes(search.toLowerCase());
                })
                .slice(0, 100)
                .map(([key, val]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                    onClick={() => copyValue(`var(${key})`)}
                  >
                    {isColor(val) && (
                      <div className="w-4 h-4 rounded border border-gray-200" style={{ backgroundColor: val }} />
                    )}
                    <span className="font-mono text-brand-600">{key}</span>
                    <span className="text-gray-400 ml-auto font-mono">{val}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Icons */}
        {data.svgs.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              SVG Icons ({data.svgs.length})
            </h3>
            <div className="grid grid-cols-8 gap-2">
              {data.svgs.slice(0, 40).map((svg, i) => (
                <div
                  key={i}
                  className="p-2 border rounded bg-white hover:border-brand-500 cursor-pointer"
                  onClick={() => copyValue(svg.svg)}
                  dangerouslySetInnerHTML={{ __html: svg.svg }}
                  title="Click to copy SVG"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center p-3 bg-gray-50 rounded-lg">
      <div className="text-2xl font-bold text-brand-500">{value}</div>
      <div className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function isColor(val: string): boolean {
  return /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\()/i.test(val.trim());
}
