import type { SerializedDesignSystem } from '../../shared/types.js';

interface Props {
  typography: SerializedDesignSystem['typography'];
}

export function TypographySection({ typography }: Props) {
  return (
    <div className="animate-slide-up space-y-6">
      {/* Font Families */}
      <div className="card space-y-4">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Font Families</h3>
        {typography.fontFamilies.map((f, i) => (
          <div key={i} className="flex items-baseline justify-between border-b border-gray-800 pb-4 last:border-0 last:pb-0 gap-4">
            <div>
              <p
                className="text-2xl font-medium text-gray-100 leading-tight"
                style={{ fontFamily: f.raw }}
              >
                {f.name}
              </p>
              <p className="text-xs text-gray-600 font-mono mt-1">{f.stack.join(', ')}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="tag capitalize">{f.category}</span>
              <span className="tag">{f.usageCount}×</span>
            </div>
          </div>
        ))}
      </div>

      {/* Font Sizes */}
      {typography.fontSizes.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Font Sizes</h3>
          <div className="space-y-2">
            {typography.fontSizes.slice(0, 20).map((s, i) => (
              <div key={i} className="flex items-baseline gap-3">
                <span className="text-gray-600 font-mono text-xs w-12 shrink-0">{s.value}</span>
                <span
                  className="text-gray-200 leading-tight truncate"
                  style={{ fontSize: Math.min(s.numericPx, 48) + 'px' }}
                >
                  Aa
                </span>
                <span className="text-xs text-gray-600 ml-auto">{s.usageCount}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Text Styles */}
      {typography.textStyles.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Text Styles</h3>
          <div className="space-y-4">
            {typography.textStyles.slice(0, 10).map((ts, i) => (
              <div key={i} className="border-b border-gray-800 pb-4 last:border-0 last:pb-0">
                <div
                  className="text-gray-100 mb-1 truncate"
                  style={{
                    fontFamily: ts.fontFamily,
                    fontSize: Math.min(parseFloat(ts.fontSize) || 16, 40) + 'px',
                    fontWeight: ts.fontWeight,
                    lineHeight: ts.lineHeight,
                  }}
                >
                  The quick brown fox jumps over the lazy dog
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {ts.fontFamily && <span className="tag">{ts.fontFamily}</span>}
                  <span className="tag">{ts.fontSize}</span>
                  <span className="tag">fw:{ts.fontWeight}</span>
                  <span className="tag">lh:{ts.lineHeight}</span>
                  {ts.elements.map(el => <span key={el} className="tag text-brand-400/80">{el}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Font Weights */}
      {typography.fontWeights.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Font Weights</h3>
          <div className="flex flex-wrap gap-3">
            {typography.fontWeights.map(w => (
              <div key={w} className="flex flex-col items-center gap-1">
                <span className="text-2xl text-white" style={{ fontWeight: w }}>Aa</span>
                <span className="text-xs text-gray-500">{w}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
