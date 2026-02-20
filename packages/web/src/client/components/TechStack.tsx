import type { SerializedDesignSystem } from '../../shared/types.js';

/** Tab IDs the TechStack stat cards can navigate to */
export type NavigableTab =
  | 'overview' | 'colors' | 'typography' | 'spacing'
  | 'more' | 'icons' | 'assets' | 'export' | 'tech';

interface Props {
  ds: SerializedDesignSystem;
  onNavigate?: (tab: NavigableTab) => void;
}

const FRAMEWORK_INFO: Record<string, { label: string; color: string; description: string }> = {
  tailwind:   { label: 'Tailwind CSS', color: '#38bdf8', description: 'Utility-first CSS framework' },
  bootstrap:  { label: 'Bootstrap',    color: '#7952b3', description: 'CSS component framework' },
  chakra:     { label: 'Chakra UI',    color: '#319795', description: 'React component library' },
  mantine:    { label: 'Mantine',      color: '#339af0', description: 'React components + hooks' },
  mui:        { label: 'Material UI',  color: '#1976d2', description: 'Google Material Design for React' },
  antd:       { label: 'Ant Design',   color: '#1890ff', description: 'Enterprise React UI library' },
  bulma:      { label: 'Bulma',        color: '#00d1b2', description: 'Modern CSS framework' },
  foundation: { label: 'Foundation',   color: '#1779ba', description: 'Responsive front-end framework' },
  unknown:    { label: 'Custom CSS',   color: '#a3a3a3', description: 'No known framework detected' },
};

export function TechStack({ ds, onNavigate }: Props) {
  const fw = FRAMEWORK_INFO[ds.meta.framework] || FRAMEWORK_INFO['unknown']!;
  const hasFontAssets = (ds.assets.fonts?.length ?? 0) > 0;
  const hasIcons = (ds.assets.icons?.length ?? 0) > 0;
  const hasImages = (ds.assets.images?.length ?? 0) > 0;
  const hasTransitions = (ds.transitions?.length ?? 0) > 0;

  /** Stat cards with optional navigation target */
  const techItems: Array<{ label: string; value: string | number; icon: string; navigateTo?: NavigableTab }> = [
    { label: 'CSS Framework', value: fw.label,               icon: '🎨' },
    { label: 'Stylesheets',   value: ds.meta.totalStylesheets, icon: '📄' },
    { label: 'CSS Rules',     value: ds.meta.totalRules,      icon: '📐' },
    { label: 'Pages Analyzed', value: ds.meta.pageCount,      icon: '🌐', navigateTo: 'overview' },
    { label: 'Colors',        value: ds.colors.palette.length, icon: '🎨', navigateTo: 'colors' },
    { label: 'Typography',    value: ds.typography.fontFamilies.length, icon: '🔠', navigateTo: 'typography' },
    { label: 'Spacing',       value: ds.spacing.length,       icon: '↔️', navigateTo: 'spacing' },
    { label: 'Shadows',       value: ds.shadows.length,       icon: '🌒', navigateTo: 'more' },
    { label: 'Components',    value: ds.components.length,    icon: '🧩', navigateTo: 'more' },
  ];

  if (hasFontAssets) techItems.push({ label: 'External Fonts', value: ds.assets.fonts.length, icon: '🔤', navigateTo: 'assets' });
  if (hasIcons) techItems.push({ label: 'SVG Icons', value: ds.assets.icons.length, icon: '✨', navigateTo: 'icons' });
  if (hasImages) techItems.push({ label: 'Images', value: ds.assets.images?.length ?? 0, icon: '🖼️', navigateTo: 'assets' });
  if (hasTransitions) techItems.push({ label: 'Transitions', value: ds.transitions.length, icon: '⚡' });

  // Detect font providers
  const fontProviders = new Set<string>();
  for (const font of ds.assets.fonts) {
    if (font.source === 'google-fonts') fontProviders.add('Google Fonts');
    else if (font.source === 'adobe-fonts') fontProviders.add('Adobe Fonts');
    else if (font.source === 'font-face') fontProviders.add('Self-hosted');
    else if (font.source === 'link') fontProviders.add('CDN');
  }

  return (
    <div className="animate-slide-up space-y-4">
      {/* Framework badge */}
      <div className="card flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
          style={{ background: fw.color + '20', color: fw.color }}
        >
          {fw.label.charAt(0)}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{fw.label}</h3>
          <p className="text-xs text-gray-500">{fw.description}</p>
        </div>
        <span
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ background: fw.color + '20', color: fw.color }}
        >
          {ds.meta.framework}
        </span>
      </div>

      {/* Tech grid — clickable stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {techItems.map(({ label, value, icon, navigateTo }) => {
          const isClickable = !!navigateTo && !!onNavigate;
          const Tag = isClickable ? 'button' : 'div';
          return (
            <Tag
              key={label}
              {...(isClickable ? { onClick: () => onNavigate!(navigateTo!) } : {})}
              className={`stat-card text-left transition-all ${
                isClickable
                  ? 'cursor-pointer hover:border-brand-500 hover:bg-gray-800/80 active:scale-[0.98] group'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{icon}</span>
                {isClickable && (
                  <svg className="w-4 h-4 text-gray-600 group-hover:text-brand-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                )}
              </div>
              <span className="text-xl font-bold text-white tabular-nums">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </span>
              <span className="text-xs text-gray-500">{label}</span>
            </Tag>
          );
        })}
      </div>

      {/* Font providers */}
      {fontProviders.size > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Font Sources</h3>
            {onNavigate && (
              <button onClick={() => onNavigate('assets')} className="text-xs text-brand-400 hover:underline">
                View all in Assets →
              </button>
            )}
          </div>
          <div className="space-y-2">
            {ds.assets.fonts.map((font, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-800 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 font-medium">{font.family}</span>
                  <span className="tag">{font.format}</span>
                </div>
                <span className="tag capitalize">{font.source.replace('-', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transitions */}
      {hasTransitions && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
            Transitions ({ds.transitions.length})
          </h3>
          <div className="space-y-2">
            {ds.transitions.slice(0, 10).map((t, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="tag w-20">{t.duration}</span>
                <span className="text-gray-400 font-mono text-xs flex-1 truncate">{t.property}</span>
                <span className="tag">{t.timingFunction}</span>
                <span className="text-xs text-gray-600">{t.usageCount}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SVG Icons preview */}
      {hasIcons && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
              SVG Icons ({ds.assets.icons.length})
            </h3>
            {onNavigate && (
              <button onClick={() => onNavigate('icons')} className="text-xs text-brand-400 hover:underline">
                View all →
              </button>
            )}
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {ds.assets.icons.slice(0, 30).map((icon, i) => (
              <button
                key={i}
                className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-lg border border-gray-700 hover:border-brand-500 transition-colors group"
                title={icon.name}
                onClick={() => {
                  navigator.clipboard.writeText(icon.svg).catch(() => {});
                }}
              >
                <div
                  className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: icon.svg }}
                />
              </button>
            ))}
          </div>
          {ds.assets.icons.length > 30 && (
            <p className="text-xs text-gray-600 mt-2">+{ds.assets.icons.length - 30} more icons</p>
          )}
        </div>
      )}
    </div>
  );
}
