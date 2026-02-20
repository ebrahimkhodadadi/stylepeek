import React, { useState } from 'react';
import type { ExtractedDesignData, ParsedColor } from '../../shared/messaging';

interface Props {
  data: ExtractedDesignData;
}

export default function MiniColors({ data }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const topColors = data.colors.slice(0, 12);
  const groups = data.colorGroups.slice(0, 4);

  const copy = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div className="space-y-4">
      {/* Top colors swatches */}
      <div>
        <div className="text-[10px] text-secondary uppercase tracking-wider mb-2">
          Top {topColors.length} Colors
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {topColors.map((c) => (
            <button
              key={c.hex}
              onClick={() => copy(c.hex)}
              className="group relative aspect-square rounded-lg border border-border/50 transition-transform hover:scale-110 hover:z-10"
              style={{ backgroundColor: c.hex }}
              title={`${c.hex} — ${c.count}×`}
            >
              {copied === c.hex && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Color groups preview */}
      {groups.map(g => (
        <div key={g.name}>
          <div className="text-[10px] text-secondary mb-1.5">{g.name} · {g.colors.length}</div>
          <div className="flex gap-0.5">
            {g.colors.slice(0, 8).map((c, i) => (
              <button
                key={i}
                onClick={() => copy(c.hex)}
                className="h-5 flex-1 min-w-0 first:rounded-l-md last:rounded-r-md transition-transform hover:scale-y-125"
                style={{ backgroundColor: c.hex }}
                title={c.hex}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Semantic colors */}
      {data.semanticColors.length > 0 && (
        <div>
          <div className="text-[10px] text-secondary uppercase tracking-wider mb-2">Semantic</div>
          <div className="space-y-1">
            {data.semanticColors.slice(0, 6).map(s => (
              <div key={s.role} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border border-border/50" style={{ backgroundColor: s.color.hex }} />
                <span className="text-xs text-secondary flex-1">{s.role}</span>
                <span className="text-[10px] text-tertiary font-mono">{s.color.hex}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
