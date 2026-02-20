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
    <div className="animate-slide-up space-y-4">
      {/* Download all */}
      <div className="card flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-200">Download All Formats</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Generate Tailwind, CSS vars, Style Dict, Figma tokens, JSON &amp; HTML
          </p>
        </div>
        <button
          onClick={() => void downloadAll()}
          disabled={generating !== null}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {EXPORT_FORMATS.map(fmt => (
          <div
            key={fmt.id}
            className="card hover:border-gray-600 transition-colors group cursor-pointer"
            onClick={() => void generateExport(fmt.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="text-sm font-medium text-gray-200 group-hover:text-brand-400 transition-colors">
                  {fmt.label}
                </h4>
                <span className="tag mt-1">{fmt.ext}</span>
              </div>
              {generating === fmt.id ? (
                <svg className="w-5 h-5 text-brand-400 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" /></svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600 group-hover:text-brand-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              )}
            </div>
            <p className="text-xs text-gray-500">{fmt.description}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-gray-300">{preview.filename}</h4>
              <span className="tag">{(preview.content.length / 1024).toFixed(1)} KB</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(preview.content)}
                className="text-xs text-gray-400 hover:text-white px-2 py-1 border border-gray-700 rounded transition-colors"
              >
                Copy
              </button>
              <button
                onClick={() => downloadFile(preview)}
                className="text-xs text-brand-400 hover:text-brand-300 px-2 py-1 bg-brand-500/10 border border-brand-500/20 rounded transition-colors"
              >
                Download
              </button>
            </div>
          </div>
          <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 text-xs text-gray-400 font-mono overflow-auto max-h-80 whitespace-pre-wrap">
            {preview.content.slice(0, 5000)}
            {preview.content.length > 5000 && '\n\n... (truncated)'}
          </pre>
        </div>
      )}
    </div>
  );
}
