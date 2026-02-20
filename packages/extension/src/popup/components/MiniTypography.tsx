import React from 'react';
import type { ExtractedDesignData } from '../../shared/messaging';

interface Props {
  data: ExtractedDesignData;
}

export default function MiniTypography({ data }: Props) {
  return (
    <div className="space-y-4">
      {/* Font families */}
      <div>
        <div className="text-[10px] text-secondary uppercase tracking-wider mb-2">Font Families</div>
        <div className="space-y-2">
          {data.fonts.slice(0, 5).map(f => (
            <div key={f.family} className="bg-card rounded-lg p-3">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl text-primary" style={{ fontFamily: f.family }}>Aa</span>
                <span className="text-xs font-medium text-primary truncate">{f.family}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-secondary capitalize">{f.source.replace('-', ' ')}</span>
                {f.weights.length > 0 && (
                  <span className="text-[10px] text-tertiary">{f.weights.join(', ')}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Text styles */}
      {data.textStyles.length > 0 && (
        <div>
          <div className="text-[10px] text-secondary uppercase tracking-wider mb-2">Text Styles</div>
          <div className="space-y-1">
            {data.textStyles.map(s => (
              <div key={s.name} className="flex items-center gap-3 py-1">
                <span className="text-xs w-16 text-secondary">{s.name}</span>
                <span className="text-xs font-mono text-tertiary">{s.fontSize}</span>
                <span className="text-xs text-tertiary">/ {s.fontWeight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Type scale */}
      {data.typeScale.length > 0 && (
        <div>
          <div className="text-[10px] text-secondary uppercase tracking-wider mb-2">Type Scale</div>
          <div className="flex flex-wrap gap-1">
            {data.typeScale.slice(0, 12).map(t => (
              <div
                key={t.size}
                className="bg-card text-[10px] text-secondary px-2 py-1 rounded-md font-mono"
                title={`${t.rem} · ${t.tailwind || '—'} · ${t.count}×`}
              >
                {t.size}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
