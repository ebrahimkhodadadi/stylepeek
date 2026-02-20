import { useState, useCallback } from 'react';
import type { SerializedDesignSystem } from '../../shared/types.js';

type Color = SerializedDesignSystem['colors']['palette'][number];

interface Props {
  colors: SerializedDesignSystem['colors'];
}

function isLight(hex: string) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

function hslToString(hsl: { h: number; s: number; l: number }) {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

function rgbToString(rgb: { r: number; g: number; b: number }) {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

type ColorFormat = 'hex' | 'rgb' | 'hsl';

function getColorString(color: Color, format: ColorFormat): string {
  switch (format) {
    case 'hex': return color.value.hex;
    case 'rgb': return rgbToString(color.value.rgb);
    case 'hsl': return hslToString(color.value.hsl);
  }
}

function CopyNotification({ text }: { text: string }) {
  return (
    <div className="fixed top-6 right-6 z-50 animate-fade-in">
      <div className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 shadow-xl flex items-center gap-2">
        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        <span className="text-sm text-gray-200 font-mono">{text}</span>
        <span className="text-xs text-gray-500">copied!</span>
      </div>
    </div>
  );
}

function ColorSwatch({ color, format, onCopy }: { color: Color; format: ColorFormat; onCopy: (text: string) => void }) {
  const light = isLight(color.value.hex);
  const colorStr = getColorString(color, format);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(colorStr).catch(() => {});
        onCopy(colorStr);
      }}
      className="swatch w-full aspect-square flex flex-col justify-end p-2 group relative overflow-hidden"
      style={{ background: color.value.hex }}
      title={`${color.name}\n${colorStr}\n${color.usageCount} uses in: ${color.usedIn.join(', ')}`}
    >
      <span
        className="text-[11px] font-mono leading-none opacity-70 group-hover:opacity-100 transition-opacity"
        style={{ color: light ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)' }}
      >
        {colorStr}
      </span>
    </button>
  );
}

function PaletteStrip({ colors, format, onCopy }: { colors: Color[]; format: ColorFormat; onCopy: (text: string) => void }) {
  const topColors = [...colors].sort((a, b) => b.usageCount - a.usageCount).slice(0, 10);
  const totalUsage = topColors.reduce((sum, c) => sum + c.usageCount, 0);

  return (
    <div className="card">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
        Color Palette — Most Used
      </h3>
      <div className="flex rounded-xl overflow-hidden h-20 mb-4 border border-white/10">
        {topColors.map((c, i) => {
          const width = Math.max(5, (c.usageCount / totalUsage) * 100);
          return (
            <button
              key={i}
              className="h-full hover:opacity-90 transition-opacity relative group cursor-pointer"
              style={{ background: c.value.hex, width: `${width}%`, minWidth: '3%' }}
              onClick={() => {
                const str = getColorString(c, format);
                navigator.clipboard.writeText(str).catch(() => {});
                onCopy(str);
              }}
              title={`${c.name} — ${c.usageCount} uses`}
            >
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-mono text-white block truncate">{c.value.hex}</span>
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3">
        {topColors.map((c, i) => (
          <button
            key={i}
            className="flex items-center gap-2 text-xs group cursor-pointer hover:bg-gray-800 rounded-md px-2 py-1 -mx-2 transition-colors"
            onClick={() => {
              const str = getColorString(c, format);
              navigator.clipboard.writeText(str).catch(() => {});
              onCopy(str);
            }}
          >
            <span className="w-4 h-4 rounded border border-white/10 shrink-0" style={{ background: c.value.hex }} />
            <span className="font-mono text-gray-400 group-hover:text-white transition-colors">{c.value.hex}</span>
            <span className="text-gray-600">{c.usageCount}×</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ColorGrid({ colors }: Props) {
  const [view, setView] = useState<'palette' | 'all' | 'groups'>('palette');
  const [format, setFormat] = useState<ColorFormat>('hex');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = useCallback((text: string) => {
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1500);
  }, []);

  return (
    <div className="animate-slide-up space-y-4">
      {copiedText && <CopyNotification text={copiedText} />}

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          {(['palette', 'all', 'groups'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors capitalize font-medium
                ${view === v ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {v === 'palette' ? 'Palette' : v === 'all' ? `All (${colors.palette.length})` : `Groups (${colors.groups.length})`}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-0.5">
          {(['hex', 'rgb', 'hsl'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors uppercase font-mono
                ${format === f ? 'bg-gray-700 text-gray-200' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Palette view */}
      {view === 'palette' && (
        <>
          <PaletteStrip colors={colors.palette} format={format} onCopy={handleCopy} />

          {colors.semantic && Object.keys(colors.semantic).length > 0 && (
            <div className="card">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Semantic Colors</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Object.entries(colors.semantic).filter(([, c]) => c != null).map(([role, c]) => (
                  <button
                    key={role}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => {
                      if (c) {
                        const str = getColorString(c, format);
                        navigator.clipboard.writeText(str).catch(() => {});
                        handleCopy(str);
                      }
                    }}
                  >
                    <div className="w-10 h-10 rounded-full border-2 border-white/10" style={{ background: c?.value.hex }} />
                    <span className="text-xs text-gray-400 capitalize">{role}</span>
                    <span className="text-[10px] font-mono text-gray-600">{c?.value.hex}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Usage Distribution</h3>
            <div className="space-y-2">
              {[...colors.palette].sort((a, b) => b.usageCount - a.usageCount).slice(0, 8).map((c, i) => {
                const maxUsage = colors.palette.reduce((max, p) => Math.max(max, p.usageCount), 1);
                return (
                  <button
                    key={i}
                    className="flex items-center gap-3 w-full text-left hover:bg-gray-800/50 rounded-md px-1 py-0.5 transition-colors cursor-pointer"
                    onClick={() => {
                      const str = getColorString(c, format);
                      navigator.clipboard.writeText(str).catch(() => {});
                      handleCopy(str);
                    }}
                  >
                    <span className="w-5 h-5 rounded border border-white/10 shrink-0" style={{ background: c.value.hex }} />
                    <span className="text-xs font-mono text-gray-400 w-20 shrink-0">{getColorString(c, format)}</span>
                    <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(c.usageCount / maxUsage) * 100}%`, background: c.value.hex }} />
                    </div>
                    <span className="text-xs text-gray-600 w-8 text-right shrink-0">{c.usageCount}×</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* All colors grid */}
      {view === 'all' && (
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
          {colors.palette.map((c, i) => (
            <div key={i} className="flex flex-col gap-1">
              <ColorSwatch color={c} format={format} onCopy={handleCopy} />
              {c.cssVariable && (
                <span className="text-[10px] text-gray-600 font-mono truncate" title={c.cssVariable}>
                  {c.cssVariable.replace('--', '')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Group view */}
      {view === 'groups' && (
        <div className="space-y-5">
          {colors.groups.map(group => (
            <div key={group.name}>
              <h3 className="text-sm text-gray-400 mb-2 capitalize">{group.name}</h3>
              <div className="flex flex-wrap gap-2">
                {group.colors.map((c, i) => (
                  <button
                    key={i}
                    className="w-12 h-12 rounded-lg border border-white/10 cursor-pointer hover:scale-105 transition-transform relative group"
                    style={{ background: c.value.hex }}
                    title={`${c.value.hex} — ${c.usageCount} uses`}
                    onClick={() => {
                      const str = getColorString(c, format);
                      navigator.clipboard.writeText(str).catch(() => {});
                      handleCopy(str);
                    }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-mono"
                      style={{ color: isLight(c.value.hex) ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)' }}
                    >
                      {c.value.hex}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gradients */}
      {colors.gradients.length > 0 && (
        <div className="card mt-4">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
            Gradients ({colors.gradients.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {colors.gradients.slice(0, 12).map((g, i) => (
              <button
                key={i}
                className="h-16 rounded-lg border border-white/10 cursor-pointer hover:scale-[1.02] transition-transform"
                style={{ background: g.raw }}
                title={g.raw}
                onClick={() => {
                  navigator.clipboard.writeText(g.raw).catch(() => {});
                  handleCopy(g.raw);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
