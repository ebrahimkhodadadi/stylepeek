import React, { useState, useCallback } from 'react';
import type { ExtractedDesignData } from '../../shared/messaging';

interface Props {
  data: ExtractedDesignData;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type Format = 'json' | 'css-vars' | 'scss' | 'tailwind' | 'tokens';

export default function ExportTab({ data, addToast }: Props) {
  const [format, setFormat] = useState<Format>('json');

  const generate = useCallback((): string => {
    switch (format) {
      case 'json':
        return JSON.stringify({
          colors: data.colors.map(c => ({ hex: c.hex, rgb: c.rgb, hsl: c.hsl, count: c.count })),
          fonts: data.fonts,
          spacing: data.spacing.map(s => ({ px: s.px, rem: s.rem, tailwind: s.tailwind })),
          breakpoints: data.breakpoints,
          borderRadius: data.borderRadius.map(r => ({ value: r.value, tailwind: r.tailwind })),
        }, null, 2);

      case 'css-vars': {
        const lines = [':root {'];
        data.colors.slice(0, 20).forEach((c, i) => {
          lines.push(`  --color-${i + 1}: ${c.hex};`);
        });
        data.semanticColors.forEach(s => {
          lines.push(`  --color-${s.role.toLowerCase()}: ${s.color.hex};`);
        });
        data.spacing.forEach(s => {
          const name = s.tailwind || s.px.replace('px', '');
          lines.push(`  --spacing-${name}: ${s.px};`);
        });
        data.fonts.forEach(f => {
          lines.push(`  --font-${f.family.toLowerCase().replace(/\s+/g, '-')}: '${f.family}';`);
        });
        lines.push('}');
        return lines.join('\n');
      }

      case 'scss': {
        const lines: string[] = [];
        lines.push('// Colors');
        data.colors.slice(0, 20).forEach((c, i) => {
          lines.push(`$color-${i + 1}: ${c.hex};`);
        });
        lines.push('\n// Fonts');
        data.fonts.forEach(f => {
          lines.push(`$font-${f.family.toLowerCase().replace(/\s+/g, '-')}: '${f.family}';`);
        });
        lines.push('\n// Spacing');
        data.spacing.forEach(s => {
          const name = s.tailwind || s.px.replace('px', '');
          lines.push(`$spacing-${name}: ${s.px};`);
        });
        return lines.join('\n');
      }

      case 'tailwind':
        return JSON.stringify({
          theme: {
            extend: {
              colors: Object.fromEntries(
                data.semanticColors.map(s => [s.role.toLowerCase(), s.color.hex])
              ),
              fontFamily: Object.fromEntries(
                data.fonts.map(f => [f.family.toLowerCase().replace(/\s+/g, '-'), [f.family]])
              ),
              spacing: Object.fromEntries(
                data.spacing.slice(0, 20).map(s => [s.tailwind || s.px.replace('px', ''), s.px])
              ),
            },
          },
        }, null, 2);

      case 'tokens':
        return JSON.stringify({
          color: Object.fromEntries(
            data.colors.slice(0, 20).map((c, i) => [`color-${i + 1}`, { value: c.hex, type: 'color' }])
          ),
          fontSize: Object.fromEntries(
            data.typeScale.map(t => [t.tailwind || t.size, { value: t.rem, type: 'fontSize' }])
          ),
          spacing: Object.fromEntries(
            data.spacing.map(s => [s.tailwind || s.px.replace('px', ''), { value: s.rem, type: 'spacing' }])
          ),
        }, null, 2);

      default:
        return '';
    }
  }, [format, data]);

  const copyAll = useCallback(() => {
    navigator.clipboard.writeText(generate());
    addToast('Copied to clipboard', 'success');
  }, [generate, addToast]);

  const download = useCallback(() => {
    const content = generate();
    const ext = format === 'scss' ? 'scss' : format === 'css-vars' ? 'css' : 'json';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stylepeek-${format}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`Downloaded stylepeek-${format}.${ext}`, 'success');
  }, [format, generate, addToast]);

  return (
    <div className="space-y-4">
      {/* Format selector */}
      <div className="flex flex-wrap gap-1.5">
        {([
          ['json', 'JSON'],
          ['css-vars', 'CSS Variables'],
          ['scss', 'SCSS'],
          ['tailwind', 'Tailwind Config'],
          ['tokens', 'Design Tokens'],
        ] as [Format, string][]).map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              format === f ? 'bg-accent text-white' : 'bg-card text-secondary hover:bg-hover'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="bg-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="text-xs text-secondary">Preview</span>
          <div className="flex gap-2">
            <button onClick={copyAll} className="text-xs text-accent hover:underline">📋 Copy</button>
            <button onClick={download} className="text-xs text-accent hover:underline">⬇ Download</button>
          </div>
        </div>
        <pre className="p-4 text-xs font-mono text-primary overflow-x-auto max-h-[60vh] scrollbar-thin">
          {generate()}
        </pre>
      </div>

      {/* Summary */}
      <div className="bg-card rounded-xl p-4">
        <div className="text-xs text-secondary mb-2">Export Summary</div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div><span className="text-tertiary">Colors:</span> <span className="text-primary">{data.colors.length}</span></div>
          <div><span className="text-tertiary">Fonts:</span> <span className="text-primary">{data.fonts.length}</span></div>
          <div><span className="text-tertiary">Spacing:</span> <span className="text-primary">{data.spacing.length}</span></div>
          <div><span className="text-tertiary">Breakpoints:</span> <span className="text-primary">{data.breakpoints.length}</span></div>
          <div><span className="text-tertiary">Shadows:</span> <span className="text-primary">{data.shadows.length}</span></div>
          <div><span className="text-tertiary">Border Radius:</span> <span className="text-primary">{data.borderRadius.length}</span></div>
        </div>
      </div>
    </div>
  );
}
