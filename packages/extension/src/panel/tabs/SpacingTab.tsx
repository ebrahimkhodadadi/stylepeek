import React, { useState } from 'react';
import type { ExtractedDesignData } from '../../shared/messaging';

interface Props {
  data: ExtractedDesignData;
  onCopy: (text: string, label?: string) => void;
}

type View = 'scale' | 'breakpoints' | 'radius' | 'shadows';

export default function SpacingTab({ data, onCopy }: Props) {
  const [view, setView] = useState<View>('scale');

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {(['scale', 'breakpoints', 'radius', 'shadows'] as View[]).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium capitalize transition-colors ${
              view === v ? 'bg-accent/20 text-accent' : 'text-secondary hover:bg-hover'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {view === 'scale' && <SpacingScale spacing={data.spacing} onCopy={onCopy} />}
      {view === 'breakpoints' && <Breakpoints breakpoints={data.breakpoints} onCopy={onCopy} />}
      {view === 'radius' && <BorderRadius radii={data.borderRadius} onCopy={onCopy} />}
      {view === 'shadows' && <Shadows shadows={data.shadows} onCopy={onCopy} />}
    </div>
  );
}

function SpacingScale({ spacing, onCopy }: { spacing: ExtractedDesignData['spacing']; onCopy: Props['onCopy'] }) {
  const groups = new Map<string, typeof spacing>();
  for (const s of spacing) {
    const key = s.group;
    const arr = groups.get(key) ?? [];
    arr.push(s);
    groups.set(key, arr);
  }

  return (
    <div className="space-y-4">
      {Array.from(groups.entries()).map(([group, items]) => (
        <div key={group}>
          <div className="text-xs text-secondary uppercase tracking-wider mb-2">{group}</div>
          <div className="space-y-1">
            {items.map(s => (
              <button
                key={s.px}
                onClick={() => onCopy(s.px, 'spacing')}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-hover transition-colors"
              >
                <div className="w-24 flex items-center">
                  <div className="h-3 bg-accent/30 rounded-sm" style={{ width: `${Math.min(parseFloat(s.px), 80)}px` }} />
                </div>
                <span className="text-xs font-mono text-primary w-12">{s.px}</span>
                <span className="text-xs font-mono text-secondary w-16">{s.rem}</span>
                {s.tailwind && (
                  <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded">{s.tailwind}</span>
                )}
                <span className="text-[10px] text-tertiary ml-auto">{s.count}×</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      {spacing.length === 0 && <Empty text="No spacing values found." />}
    </div>
  );
}

function Breakpoints({ breakpoints, onCopy }: { breakpoints: ExtractedDesignData['breakpoints']; onCopy: Props['onCopy'] }) {
  return (
    <div className="space-y-2">
      {breakpoints.map(bp => (
        <button
          key={bp.px}
          onClick={() => onCopy(`${bp.px}px`, 'breakpoint')}
          className="flex items-center gap-3 w-full bg-card rounded-lg px-4 py-3 hover:ring-1 hover:ring-accent/30 transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent text-sm font-bold">
            {bp.name}
          </div>
          <div>
            <div className="text-sm font-mono text-primary">{bp.px}px</div>
            <div className="text-[10px] text-secondary">{bp.tailwind}</div>
          </div>
        </button>
      ))}
      {breakpoints.length === 0 && <Empty text="No breakpoints detected." />}
    </div>
  );
}

function BorderRadius({ radii, onCopy }: { radii: ExtractedDesignData['borderRadius']; onCopy: Props['onCopy'] }) {
  return (
    <div className="space-y-2">
      {radii.map(r => (
        <button
          key={r.value}
          onClick={() => onCopy(r.value, 'border-radius')}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-hover transition-colors"
        >
          <div
            className="w-10 h-10 border-2 border-accent/50 bg-accent/10"
            style={{ borderRadius: r.value }}
          />
          <span className="text-xs font-mono text-primary">{r.value}</span>
          {r.tailwind && (
            <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded">{r.tailwind}</span>
          )}
          <span className="text-[10px] text-tertiary ml-auto">{r.count}×</span>
        </button>
      ))}
      {radii.length === 0 && <Empty text="No border-radius values found." />}
    </div>
  );
}

function Shadows({ shadows, onCopy }: { shadows: ExtractedDesignData['shadows']; onCopy: Props['onCopy'] }) {
  return (
    <div className="space-y-2">
      {shadows.map((s, i) => (
        <button
          key={i}
          onClick={() => onCopy(s.value, 'box-shadow')}
          className="w-full text-left bg-card rounded-lg p-3 hover:ring-1 hover:ring-accent/30 transition-all"
        >
          <div className="w-full h-8 rounded bg-surface mb-2" style={{ boxShadow: s.value }} />
          <div className="text-[10px] font-mono text-secondary truncate">{s.value}</div>
          <div className="flex items-center gap-2 mt-1">
            {s.tailwind && (
              <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded">{s.tailwind}</span>
            )}
            <span className="text-[10px] text-tertiary">{s.count}×</span>
          </div>
        </button>
      ))}
      {shadows.length === 0 && <Empty text="No box-shadows found." />}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-xs text-tertiary py-4 text-center">{text}</div>;
}
