import { useState } from 'react';
import type { SerializedDesignSystem } from '../../shared/types.js';
import { OverviewStats } from './OverviewStats.js';
import { ColorGrid } from './ColorGrid.js';
import { TypographySection } from './TypographySection.js';
import { SpacingSection } from './SpacingSection.js';
import { ShadowsSection } from './ShadowsSection.js';
import { ExportPanel } from './ExportPanel.js';
import { TechStack } from './TechStack.js';
import { SvgIconsPanel } from './SvgIconsPanel.js';
import { AssetsPanel } from './AssetsPanel.js';

interface Props {
  ds: SerializedDesignSystem;
  onReset: () => void;
}

const TABS = [
  { id: 'overview',    label: 'Overview' },
  { id: 'colors',      label: 'Colors' },
  { id: 'icons',       label: 'SVG Icons' },
  { id: 'assets',      label: 'Assets' },
  { id: 'typography',  label: 'Typography' },
  { id: 'spacing',     label: 'Spacing' },
  { id: 'more',        label: 'Shadows & Components' },
  { id: 'export',      label: 'Export' },
  { id: 'tech',        label: 'Tech Stack' },
] as const;

type Tab = typeof TABS[number]['id'];

export function ResultsDashboard({ ds, onReset }: Props) {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="w-full animate-fade-in space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-2 w-2 rounded-full bg-green-400" />
          <span className="text-sm text-gray-400 truncate">
            Extracted from <a href={ds.meta.url} target="_blank" rel="noopener noreferrer"
              className="text-brand-400 hover:underline">{ds.meta.url}</a>
          </span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white
                     border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          New analysis
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px
              ${tab === t.id
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            {t.label}
            {t.id === 'colors' && ` (${ds.colors.palette.length})`}
            {t.id === 'icons' && ` (${ds.assets.icons.length})`}
            {t.id === 'typography' && ` (${ds.typography.fontFamilies.length})`}
            {t.id === 'spacing' && ` (${ds.spacing.length})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-96">
        {tab === 'overview'   && <OverviewStats ds={ds} />}
        {tab === 'colors'     && <ColorGrid colors={ds.colors} />}
        {tab === 'icons'      && <SvgIconsPanel icons={ds.assets.icons} />}
        {tab === 'assets'     && <AssetsPanel assets={ds.assets} />}
        {tab === 'typography' && <TypographySection typography={ds.typography} />}
        {tab === 'spacing'    && <SpacingSection spacing={ds.spacing} borderRadius={ds.borderRadius} breakpoints={ds.breakpoints} zIndex={ds.zIndex} />}
        {tab === 'more'       && <ShadowsSection shadows={ds.shadows} components={ds.components} />}
        {tab === 'export'     && <ExportPanel ds={ds} />}
        {tab === 'tech'       && <TechStack ds={ds} onNavigate={(t) => setTab(t as Tab)} />}
      </div>
    </div>
  );
}
