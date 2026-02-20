import type { SerializedDesignSystem } from '../../shared/types.js';

interface Props {
  spacing: SerializedDesignSystem['spacing'];
  borderRadius: SerializedDesignSystem['borderRadius'];
  breakpoints: SerializedDesignSystem['breakpoints'];
  zIndex: SerializedDesignSystem['zIndex'];
}

export function SpacingSection({ spacing, borderRadius, breakpoints, zIndex }: Props) {
  const maxPx = Math.max(...spacing.slice(0, 20).map(s => s.numericPx), 1);

  return (
    <div className="animate-slide-up space-y-6">
      {/* Spacing scale */}
      {spacing.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Spacing Scale</h3>
          <div className="space-y-2">
            {spacing.slice(0, 25).map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 font-mono w-14 shrink-0 text-right">{s.value}</span>
                <div className="flex-1 h-5 flex items-center">
                  <div
                    className="h-3 bg-brand-500/60 rounded-sm border border-brand-500/40 min-w-[2px]"
                    style={{ width: `${Math.max(2, (s.numericPx / maxPx) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 w-8 shrink-0">{s.numericPx}px</span>
                <span className="text-xs text-gray-700 w-6 shrink-0">{s.usageCount}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Border Radius */}
      {borderRadius.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Border Radius</h3>
          <div className="flex flex-wrap gap-4">
            {borderRadius.slice(0, 12).map((r, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className="w-12 h-12 bg-brand-500/30 border-2 border-brand-500/60"
                  style={{ borderRadius: r.value }}
                />
                <span className="text-xs text-gray-500 font-mono">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breakpoints */}
      {breakpoints.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Breakpoints</h3>
          <div className="space-y-2">
            {breakpoints.map((bp, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="tag w-20">{bp.value}</span>
                <span className="text-gray-500">{bp.numericPx}px</span>
                <span className="text-gray-600 text-xs">({bp.type})</span>
                {bp.name && <span className="tag text-brand-400/80">{bp.name}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Z-Index */}
      {zIndex.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Z-Index</h3>
          <div className="flex flex-wrap gap-2">
            {zIndex.map(z => (
              <span key={z} className="tag text-yellow-400/80">{z}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
