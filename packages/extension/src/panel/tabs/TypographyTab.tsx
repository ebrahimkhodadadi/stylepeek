import React from 'react';
import type { ExtractedDesignData } from '../../shared/messaging';

interface Props {
  data: ExtractedDesignData;
  onCopy: (text: string, label?: string) => void;
}

export default function TypographyTab({ data, onCopy }: Props) {
  return (
    <div className="space-y-6">
      {/* Font families */}
      <section>
        <h2 className="text-xs text-secondary uppercase tracking-wider mb-3">Font Families ({data.fonts.length})</h2>
        <div className="space-y-2">
          {data.fonts.map(f => (
            <div key={f.family} className="bg-card rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl text-primary" style={{ fontFamily: f.family }}>Aa</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-primary truncate">{f.family}</div>
                  <div className="text-[10px] text-secondary capitalize">{f.source.replace('-', ' ')}</div>
                </div>
                <button
                  onClick={() => onCopy(f.family, 'font family')}
                  className="text-xs text-secondary hover:text-accent transition-colors"
                >
                  Copy
                </button>
              </div>

              {f.weights.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {f.weights.map(w => (
                    <span
                      key={w}
                      className="text-sm text-primary px-2 py-0.5 rounded bg-surface"
                      style={{ fontFamily: f.family, fontWeight: w }}
                    >
                      {w}
                    </span>
                  ))}
                </div>
              )}

              {/* Preview alphabet */}
              <div className="text-xs text-secondary font-mono" style={{ fontFamily: f.family }}>
                ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Text styles */}
      {data.textStyles.length > 0 && (
        <section>
          <h2 className="text-xs text-secondary uppercase tracking-wider mb-3">Text Styles</h2>
          <div className="space-y-1.5">
            {data.textStyles.map(s => (
              <div key={s.name} className="flex items-center gap-4 bg-card rounded-lg px-4 py-3">
                <span
                  className="text-primary flex-shrink-0 w-24"
                  style={{
                    fontFamily: s.fontFamily,
                    fontSize: s.fontSize,
                    fontWeight: s.fontWeight as any,
                    lineHeight: s.lineHeight,
                  }}
                >
                  {s.name}
                </span>
                <div className="flex-1 min-w-0 flex flex-wrap gap-x-3 gap-y-0.5">
                  <span className="text-[10px] font-mono text-secondary">{s.fontSize}</span>
                  <span className="text-[10px] font-mono text-secondary">weight: {s.fontWeight}</span>
                  <span className="text-[10px] font-mono text-secondary">lh: {s.lineHeight}</span>
                  {s.letterSpacing !== 'normal' && (
                    <span className="text-[10px] font-mono text-secondary">ls: {s.letterSpacing}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Type scale */}
      <section>
        <h2 className="text-xs text-secondary uppercase tracking-wider mb-3">Type Scale ({data.typeScale.length})</h2>
        <div className="space-y-1">
          {data.typeScale.map(t => (
            <button
              key={t.size}
              onClick={() => onCopy(t.size, 'font size')}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-hover transition-colors text-left"
            >
              <div className="w-8 text-right">
                <span className="text-primary font-bold" style={{ fontSize: t.size }}>A</span>
              </div>
              <span className="text-xs font-mono text-primary w-14">{t.size}</span>
              <span className="text-xs font-mono text-secondary w-16">{t.rem}</span>
              {t.tailwind && (
                <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded">{t.tailwind}</span>
              )}
              <span className="text-[10px] text-tertiary ml-auto">{t.count}×</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
