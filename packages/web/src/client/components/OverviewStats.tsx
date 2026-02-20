import type { SerializedDesignSystem } from '../../shared/types.js';

interface Props {
  ds: SerializedDesignSystem;
}

const stats = (ds: SerializedDesignSystem) => [
  { label: 'Pages',       value: ds.meta.pageCount,                   icon: '🌐' },
  { label: 'Colors',      value: ds.colors.palette.length,            icon: '🎨' },
  { label: 'Font Families', value: ds.typography.fontFamilies.length, icon: '🔤' },
  { label: 'Font Sizes',  value: ds.typography.fontSizes.length,      icon: '📐' },
  { label: 'Spacing',     value: ds.spacing.length,                   icon: '↔️' },
  { label: 'Breakpoints', value: ds.breakpoints.length,               icon: '📱' },
  { label: 'Shadows',     value: ds.shadows.length,                   icon: '🌒' },
  { label: 'Components',  value: ds.components.length,                icon: '🧩' },
];

export function OverviewStats({ ds }: Props) {
  const dur = (ds.meta.duration / 1000).toFixed(1);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Meta */}
      <div className="card flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <span className="text-gray-500">URL <span className="text-brand-400 font-mono">{ds.meta.url}</span></span>
        <span className="text-gray-500">Framework <span className="text-gray-300">{ds.meta.framework}</span></span>
        <span className="text-gray-500">Rules <span className="text-gray-300">{ds.meta.totalRules}</span></span>
        <span className="text-gray-500">Sheets <span className="text-gray-300">{ds.meta.totalStylesheets}</span></span>
        <span className="text-gray-500">Duration <span className="text-gray-300">{dur}s</span></span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats(ds).map(({ label, value, icon }) => (
          <div key={label} className="stat-card">
            <span className="text-xl">{icon}</span>
            <span className="text-2xl font-bold text-white tabular-nums">{value}</span>
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Pages crawled */}
      {ds.meta.pages.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Pages crawled</h3>
          <div className="flex flex-wrap gap-1.5">
            {ds.meta.pages.map(p => (
              <a
                key={p}
                href={p}
                target="_blank"
                rel="noopener noreferrer"
                className="tag hover:text-brand-400 hover:bg-gray-700 transition-colors"
              >
                {new URL(p).pathname || '/'}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
