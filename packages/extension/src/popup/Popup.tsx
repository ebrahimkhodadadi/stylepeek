import React, { useState, useCallback } from 'react';
import type { ExtractedPageData } from '../content/extract';

type ViewTab = 'colors' | 'typography' | 'spacing' | 'all';

interface ParsedColor {
  value: string;
  property: string;
  count: number;
}

export function Popup() {
  const [data, setData] = useState<ExtractedPageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ViewTab>('colors');
  const [copied, setCopied] = useState<string | null>(null);

  const handleExtract = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab?.id) throw new Error('No active tab');

      const response = await chrome.tabs.sendMessage(activeTab.id, { type: 'EXTRACT_PAGE' });
      if (!response.ok) throw new Error(response.error);

      setData(response.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const copyValue = useCallback((value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  if (!data) {
    return (
      <div className="w-80 p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">◈</span>
          <h1 className="text-lg font-bold text-brand-500">stylepeek</h1>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Extract design tokens from the current page.
        </p>
        <button
          onClick={handleExtract}
          disabled={loading}
          className="w-full py-2 px-4 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 disabled:opacity-50 transition"
        >
          {loading ? 'Extracting...' : 'Extract Design System'}
        </button>
        {error && (
          <p className="text-sm text-red-500 mt-2">{error}</p>
        )}
      </div>
    );
  }

  const colors = extractUniqueColors(data);
  const fonts = extractFonts(data);
  const spacingValues = extractSpacing(data);

  return (
    <div className="w-96 max-h-[500px] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b p-3 z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-brand-500">◈</span>
            <span className="font-bold text-sm">{data.url.slice(0, 30)}</span>
          </div>
          <button
            onClick={() => setData(null)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Re-scan
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1">
          {(['colors', 'typography', 'spacing', 'all'] as ViewTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs px-3 py-1 rounded-full capitalize transition ${
                tab === t
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3">
        {/* Colors */}
        {(tab === 'colors' || tab === 'all') && (
          <Section title={`Colors (${colors.length})`}>
            <div className="grid grid-cols-5 gap-2">
              {colors.slice(0, 50).map((c, i) => (
                <div
                  key={i}
                  onClick={() => copyValue(c.value)}
                  className="cursor-pointer group"
                  title={`${c.value} (used ${c.count}×)`}
                >
                  <div
                    className="w-full aspect-square rounded-md border border-gray-200 group-hover:scale-105 transition"
                    style={{ backgroundColor: c.value }}
                  />
                  <span className="text-[10px] text-gray-400 block truncate mt-1">
                    {c.value}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Typography */}
        {(tab === 'typography' || tab === 'all') && (
          <Section title={`Fonts (${fonts.length})`}>
            {fonts.map((f, i) => (
              <div
                key={i}
                onClick={() => copyValue(f)}
                className="text-sm py-2 px-3 bg-gray-50 rounded-md mb-2 cursor-pointer hover:bg-gray-100 transition"
              >
                <span style={{ fontFamily: f }} className="block text-lg">
                  Aa Bb Cc
                </span>
                <span className="text-xs text-gray-400 font-mono">{f}</span>
              </div>
            ))}
          </Section>
        )}

        {/* Spacing */}
        {(tab === 'spacing' || tab === 'all') && (
          <Section title={`Spacing (${spacingValues.length})`}>
            {spacingValues.slice(0, 20).map((s, i) => (
              <div
                key={i}
                onClick={() => copyValue(s)}
                className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded"
              >
                <div
                  className="h-3 bg-brand-400 rounded-sm"
                  style={{ width: s }}
                />
                <span className="text-xs font-mono text-gray-500">{s}</span>
              </div>
            ))}
          </Section>
        )}

        {/* Copy feedback */}
        {copied && (
          <div className="fixed bottom-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-full">
            Copied: {copied}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────

const COLOR_REGEX = /(#[0-9a-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/gi;

function extractUniqueColors(data: ExtractedPageData): ParsedColor[] {
  const map = new Map<string, ParsedColor>();

  for (const rule of data.cssRules) {
    for (const [prop, val] of Object.entries(rule.properties)) {
      const matches = val.match(COLOR_REGEX);
      if (!matches) continue;
      for (const m of matches) {
        const norm = m.toLowerCase();
        const existing = map.get(norm);
        if (existing) {
          existing.count++;
        } else {
          map.set(norm, { value: norm, property: prop, count: 1 });
        }
      }
    }
  }

  // Also from custom properties
  for (const [, val] of Object.entries(data.customProperties)) {
    const matches = val.match(COLOR_REGEX);
    if (!matches) continue;
    for (const m of matches) {
      const norm = m.toLowerCase();
      const existing = map.get(norm);
      if (existing) {
        existing.count++;
      } else {
        map.set(norm, { value: norm, property: 'custom-property', count: 1 });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

function extractFonts(data: ExtractedPageData): string[] {
  const fonts = new Set<string>();

  for (const rule of data.cssRules) {
    const ff = rule.properties['font-family'];
    if (ff) {
      const primary = ff.split(',')[0]?.replace(/['"]/g, '').trim();
      if (primary) fonts.add(primary);
    }
  }

  for (const cs of data.computedStyles) {
    const ff = cs.styles['font-family'];
    if (ff) {
      const primary = ff.split(',')[0]?.replace(/['"]/g, '').trim();
      if (primary) fonts.add(primary);
    }
  }

  return Array.from(fonts);
}

function extractSpacing(data: ExtractedPageData): string[] {
  const values = new Set<string>();
  const spacingProps = new Set([
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'gap', 'row-gap', 'column-gap',
  ]);

  for (const rule of data.cssRules) {
    for (const [prop, val] of Object.entries(rule.properties)) {
      if (spacingProps.has(prop) && val !== '0px' && val !== '0' && val !== 'auto') {
        values.add(val);
      }
    }
  }

  return Array.from(values)
    .filter(v => /^\d/.test(v))
    .sort((a, b) => parseFloat(a) - parseFloat(b));
}
