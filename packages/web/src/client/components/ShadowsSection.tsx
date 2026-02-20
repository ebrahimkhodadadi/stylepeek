import type { SerializedDesignSystem } from '../../shared/types.js';

interface Props {
  shadows: SerializedDesignSystem['shadows'];
  components: SerializedDesignSystem['components'];
}

export function ShadowsSection({ shadows, components }: Props) {
  return (
    <div className="animate-slide-up space-y-6">
      {/* Shadows */}
      {shadows.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
            Shadows ({shadows.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {shadows.slice(0, 12).map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-3 p-4 bg-gray-800 rounded-lg">
                <div
                  className="w-16 h-10 bg-gray-200 rounded-md"
                  style={{ boxShadow: s.raw }}
                />
                <div className="text-center">
                  <p className="text-xs text-gray-400">{s.name}</p>
                  <p className="text-[10px] text-gray-600 font-mono mt-0.5 line-clamp-2 text-center">{s.raw}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Components */}
      {components.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
            Detected Components ({components.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {components.map((c, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-200 capitalize">{c.name}</span>
                  <span className="tag">{c.instanceCount}×</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {c.selectors.slice(0, 3).map((sel, j) => (
                    <span key={j} className="tag text-[10px]">{sel}</span>
                  ))}
                  {c.selectors.length > 3 && (
                    <span className="text-[10px] text-gray-600">+{c.selectors.length - 3}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {shadows.length === 0 && components.length === 0 && (
        <div className="card text-center py-10 text-gray-600">
          No shadows or components detected on this site.
        </div>
      )}
    </div>
  );
}
