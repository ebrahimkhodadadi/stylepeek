import React, { useState } from 'react';
import type { ExtractedDesignData, ParsedColor, ColorGroup, ExtensionSettings } from '../../shared/messaging';
import { contrastRatio, wcagLevel } from '../../shared/color-utils';

interface Props {
  data: ExtractedDesignData;
  onCopy: (text: string, label?: string) => void;
  settings: ExtensionSettings;
}

export default function ColorsTab({ data, onCopy, settings }: Props) {
  const [view, setView] = useState<'palette' | 'usage' | 'semantic' | 'gradients'>('palette');
  const [selected, setSelected] = useState<ParsedColor | null>(null);

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1">
        {(['palette', 'usage', 'semantic', 'gradients'] as const).map(v => (
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

      {view === 'palette' && (
        <PaletteView groups={data.colorGroups} onSelect={setSelected} onCopy={onCopy} />
      )}
      {view === 'usage' && (
        <UsageView colors={data.colors} onSelect={setSelected} onCopy={onCopy} />
      )}
      {view === 'semantic' && (
        <SemanticView colors={data.semanticColors} onCopy={onCopy} />
      )}
      {view === 'gradients' && (
        <GradientsView gradients={data.gradients} onCopy={onCopy} />
      )}

      {/* Color detail modal */}
      {selected && (
        <ColorModal
          color={selected}
          onClose={() => setSelected(null)}
          onCopy={onCopy}
          format={settings.colorFormat}
        />
      )}
    </div>
  );
}

/* ── Palette View ──────────────────────────────────────── */

function PaletteView({ groups, onSelect, onCopy }: {
  groups: ColorGroup[];
  onSelect: (c: ParsedColor) => void;
  onCopy: (t: string, l?: string) => void;
}) {
  return (
    <div className="space-y-4">
      {groups.map(g => (
        <div key={g.name}>
          <div className="text-xs text-secondary mb-2">{g.name} · {g.colors.length}</div>
          <div className="flex flex-wrap gap-1.5">
            {g.colors.map(c => (
              <Swatch key={c.hex} color={c} onClick={() => onSelect(c)} onCopy={onCopy} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Usage View (ranked) ───────────────────────────────── */

function UsageView({ colors, onSelect, onCopy }: {
  colors: ParsedColor[];
  onSelect: (c: ParsedColor) => void;
  onCopy: (t: string, l?: string) => void;
}) {
  return (
    <div className="space-y-1">
      {colors.slice(0, 30).map((c, i) => (
        <button
          key={c.hex}
          onClick={() => onSelect(c)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-hover transition-colors text-left"
        >
          <span className="text-xs text-tertiary w-5">{i + 1}</span>
          <div className="w-6 h-6 rounded-md border border-border/50 flex-shrink-0" style={{ backgroundColor: c.hex }} />
          <span className="text-xs font-mono text-primary flex-1">{c.hex}</span>
          <span className="text-xs text-secondary">{c.property}</span>
          <span className="text-[10px] text-tertiary">{c.count}×</span>
        </button>
      ))}
    </div>
  );
}

/* ── Semantic View ─────────────────────────────────────── */

function SemanticView({ colors, onCopy }: {
  colors: { role: string; color: ParsedColor }[];
  onCopy: (t: string, l?: string) => void;
}) {
  return (
    <div className="space-y-2">
      {colors.length === 0 && <div className="text-xs text-tertiary">No semantic roles detected.</div>}
      {colors.map(s => (
        <div key={s.role} className="flex items-center gap-3 bg-card rounded-lg p-3">
          <div className="w-8 h-8 rounded-lg border border-border/50" style={{ backgroundColor: s.color.hex }} />
          <div className="flex-1">
            <div className="text-sm font-medium text-primary">{s.role}</div>
            <div className="text-xs font-mono text-secondary">{s.color.hex}</div>
          </div>
          <button
            onClick={() => onCopy(s.color.hex, s.role)}
            className="text-xs text-secondary hover:text-accent transition-colors"
          >
            Copy
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── Gradients View ────────────────────────────────────── */

function GradientsView({ gradients, onCopy }: {
  gradients: { css: string; count: number }[];
  onCopy: (t: string, l?: string) => void;
}) {
  return (
    <div className="space-y-2">
      {gradients.length === 0 && <div className="text-xs text-tertiary">No gradients found.</div>}
      {gradients.map((g, i) => (
        <button
          key={i}
          onClick={() => onCopy(g.css, 'gradient')}
          className="w-full text-left bg-card rounded-lg p-3 hover:ring-1 hover:ring-accent/40 transition-all"
        >
          <div className="h-10 rounded-md mb-2" style={{ background: g.css }} />
          <div className="text-[10px] font-mono text-secondary truncate">{g.css}</div>
          <div className="text-[10px] text-tertiary">{g.count}×</div>
        </button>
      ))}
    </div>
  );
}

/* ── Color Swatch ──────────────────────────────────────── */

function Swatch({ color, onClick, onCopy }: {
  color: ParsedColor; onClick: () => void;
  onCopy: (t: string, l?: string) => void;
}) {
  return (
    <button
      onClick={onClick}
      onContextMenu={(e) => { e.preventDefault(); onCopy(color.hex, color.hex); }}
      className="group w-10 h-10 rounded-lg border border-border/30 hover:scale-110 hover:z-10 transition-transform relative"
      style={{ backgroundColor: color.hex }}
      title={`${color.hex} — ${color.count}× — right-click to copy`}
    >
      {color.count > 5 && (
        <span className="absolute -top-1 -right-1 bg-surface text-[8px] text-secondary rounded-full px-1 border border-border">
          {color.count}
        </span>
      )}
    </button>
  );
}

/* ── Color Detail Modal ────────────────────────────────── */

function ColorModal({ color, onClose, onCopy, format }: {
  color: ParsedColor; onClose: () => void;
  onCopy: (t: string, l?: string) => void;
  format: string;
}) {
  const cr = contrastRatio(color.hex, '#FFFFFF');
  const crBlack = contrastRatio(color.hex, '#000000');
  const wcagW = wcagLevel(cr);
  const wcagB = wcagLevel(crBlack);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl w-80 max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Preview */}
        <div className="h-28 rounded-t-2xl" style={{ backgroundColor: color.hex }} />
        <div className="p-4 space-y-4">
          {/* Formats */}
          <div className="space-y-1.5">
            {([
              ['HEX', color.hex],
              ['RGB', color.rgb],
              ['HSL', color.hsl],
            ] as const).map(([label, val]) => (
              <button
                key={label}
                onClick={() => onCopy(val, label)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-surface hover:bg-hover transition-colors text-left"
              >
                <span className="text-[10px] text-secondary w-8">{label}</span>
                <span className="text-xs font-mono text-primary flex-1">{val}</span>
                <span className="text-[10px] text-tertiary">copy</span>
              </button>
            ))}
          </div>

          {/* Contrast */}
          <div>
            <div className="text-xs text-secondary mb-2">Contrast Ratio</div>
            <div className="grid grid-cols-2 gap-2">
              <ContrastCard fg={color.hex} bgLabel="White" bg="#FFFFFF" ratio={cr} wcag={wcagW} />
              <ContrastCard fg={color.hex} bgLabel="Black" bg="#000000" ratio={crBlack} wcag={wcagB} />
            </div>
          </div>

          {/* Usage */}
          <div>
            <div className="text-xs text-secondary mb-1">Property: <span className="font-mono text-primary">{color.property}</span></div>
            <div className="text-xs text-secondary mb-1">Used {color.count}× in:</div>
            <div className="flex flex-wrap gap-1">
              {color.selectors.map((s, i) => (
                <span key={i} className="text-[10px] font-mono text-tertiary bg-surface px-2 py-0.5 rounded">{s}</span>
              ))}
            </div>
          </div>

          <button onClick={onClose} className="w-full py-2 text-xs text-secondary hover:text-primary transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

function ContrastCard({ fg, bgLabel, bg, ratio, wcag }: {
  fg: string; bgLabel: string; bg: string; ratio: number; wcag: string;
}) {
  const color = wcag === 'AAA' ? 'text-green-400' : wcag === 'AA' ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className="bg-surface rounded-lg p-2.5 text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: fg }} />
        <span className="text-[10px] text-secondary">on {bgLabel}</span>
      </div>
      <div className="text-sm font-mono font-semibold text-primary">{ratio.toFixed(2)}:1</div>
      <div className={`text-[10px] font-bold ${color}`}>{wcag}</div>
    </div>
  );
}
