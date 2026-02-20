import { useState, useCallback } from 'react';
import type { SerializedDesignSystem, ExportFormat, ExportedFile } from '../../shared/types.js';
import { EXPORT_FORMATS } from '../../shared/types.js';

interface Props {
  ds: SerializedDesignSystem;
}

export function ExportPanel({ ds }: Props) {
  const [generating, setGenerating] = useState<ExportFormat | 'all' | null>(null);
  const [preview, setPreview] = useState<ExportedFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateExport = useCallback(async (format: ExportFormat) => {
    setGenerating(format);
    setError(null);
    setPreview(null);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designSystem: ds, format }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' })) as { error: string };
        throw new Error(data.error);
      }
      const data = await res.json() as { files: ExportedFile[] };
      const first = data.files[0];
      if (first) {
        setPreview(first);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(null);
    }
  }, [ds]);

  const downloadFile = useCallback((file: ExportedFile) => {
    const blob = new Blob([file.content], { type: file.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const downloadAll = useCallback(async () => {
    setGenerating('all');
    setError(null);
    try {
      const res = await fetch('/api/export-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designSystem: ds }),
      });
      if (!res.ok) throw new Error('Export failed');
      const data = await res.json() as { files: ExportedFile[] };
      // Download each file
      for (const file of data.files) {
        downloadFile(file);
        await new Promise(r => setTimeout(r, 200)); // stagger downloads
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(null);
    }
  }, [ds, downloadFile]);

  const copyToClipboard = useCallback((content: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
  }, []);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Download all */}
      <div className="flex items-center justify-between card">
        <div>
          <h3 className="text-sm font-medium text-gray-200">Download All Formats</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Generate Tailwind, CSS vars, Style Dict, Figma tokens, JSON &amp; HTML
          </p>
        </div>
        <button
          onClick={() => void downloadAll()}
          disabled={generating !== null}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50"
        >
          {generating === 'all' ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          )}
          Download All
        </button>
      </div>

      {/* Format cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {EXPORT_FORMATS.map(fmt => (
          <div
            key={fmt.id}
            className="transition-colors cursor-pointer card hover:border-gray-600 group"
            onClick={() => void generateExport(fmt.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="text-sm font-medium text-gray-200 transition-colors group-hover:text-brand-400">
                  {fmt.label}
                </h4>
                <span className="mt-1 tag">{fmt.ext}</span>
              </div>
              {generating === fmt.id ? (
                <svg className="w-5 h-5 text-brand-400 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" /></svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600 transition-colors group-hover:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              )}
            </div>
            <p className="text-xs text-gray-500">{fmt.description}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 text-sm text-red-400 border rounded-lg bg-red-500/10 border-red-500/20">
          {error}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-3 card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-gray-300">{preview.filename}</h4>
              <span className="tag">{(preview.content.length / 1024).toFixed(1)} KB</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(preview.content)}
                className="px-2 py-1 text-xs text-gray-400 transition-colors border border-gray-700 rounded hover:text-white"
              >
                Copy
              </button>
              <button
                onClick={() => downloadFile(preview)}
                className="px-2 py-1 text-xs transition-colors border rounded text-brand-400 hover:text-brand-300 bg-brand-500/10 border-brand-500/20"
              >
                Download
              </button>
            </div>
          </div>
          <pre className="p-4 overflow-auto font-mono text-xs text-gray-400 whitespace-pre-wrap border border-gray-800 rounded-lg bg-gray-950 max-h-80">
            {preview.content.slice(0, 5000)}
            {preview.content.length > 5000 && '\n\n... (truncated)'}
          </pre>
        </div>
      )}
    </div>
  );
}
