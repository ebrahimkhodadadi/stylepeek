import React, { useState, useCallback } from 'react';
import type { ExtractedDesignData, ElementInspection } from '../../shared/messaging';

interface Props {
  data: ExtractedDesignData;
  onCopy: (text: string, label?: string) => void;
}

export default function InspectorPanel({ data, onCopy }: Props) {
  const [inspected, setInspected] = useState<ElementInspection | null>(null);
  const [inspecting, setInspecting] = useState(false);

  const startInspect = useCallback(() => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) return;
      chrome.tabs.sendMessage(tabId, { type: 'INSPECT_ACTIVATE' });
      setInspecting(true);
    });
  }, []);

  const stopInspect = useCallback(() => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) chrome.tabs.sendMessage(tabId, { type: 'INSPECT_DEACTIVATE' });
    });
    setInspecting(false);
  }, []);

  // Listen for element selection from content script
  React.useEffect(() => {
    const listener = (msg: any) => {
      if (msg.type === 'ELEMENT_SELECTED') {
        setInspected(msg.data);
        setInspecting(false);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  return (
    <div className="space-y-4">
      {/* Toggle button */}
      <button
        onClick={inspecting ? stopInspect : startInspect}
        className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
          inspecting
            ? 'bg-accent text-white shadow-lg shadow-accent/25'
            : 'bg-card text-primary hover:bg-hover border border-border'
        }`}
      >
        {inspecting ? '🎯 Click an element on the page…' : '🎯 Start Inspector'}
      </button>

      {inspected && (
        <div className="space-y-4">
          {/* Element info */}
          <div className="bg-card rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-accent font-mono text-sm">&lt;{inspected.tag}&gt;</span>
              {inspected.id && <span className="text-xs font-mono text-blue-400">#{inspected.id}</span>}
            </div>
            {inspected.classNames.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {inspected.classNames.map((c, i) => (
                  <span key={i} className="text-[10px] font-mono bg-surface px-1.5 py-0.5 rounded text-secondary">.{c}</span>
                ))}
              </div>
            )}
            <div className="text-[10px] font-mono text-tertiary">{inspected.selector}</div>
          </div>

          {/* Box model */}
          <BoxModelViz spacing={inspected.spacing} rect={inspected.rect} />

          {/* Colors */}
          {inspected.colors.length > 0 && (
            <div className="bg-card rounded-xl p-4">
              <div className="text-xs text-secondary mb-2">Colors</div>
              <div className="space-y-1.5">
                {inspected.colors.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => onCopy(c.hex, c.property)}
                    className="flex items-center gap-2 w-full hover:bg-hover rounded-lg p-1.5 transition-colors"
                  >
                    <div className="w-5 h-5 rounded border border-border/50" style={{ backgroundColor: c.hex }} />
                    <span className="text-[10px] text-secondary">{c.property}</span>
                    <span className="text-xs font-mono text-primary">{c.hex}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Typography */}
          <div className="bg-card rounded-xl p-4">
            <div className="text-xs text-secondary mb-2">Typography</div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {Object.entries(inspected.typography).map(([k, v]) => (
                <div key={k}>
                  <span className="text-tertiary">{k}: </span>
                  <span className="font-mono text-primary">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tailwind classes */}
          {inspected.tailwindClasses && (
            <div className="bg-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-secondary">Tailwind CSS</span>
                <button
                  onClick={() => onCopy(inspected.tailwindClasses!, 'Tailwind classes')}
                  className="text-[10px] text-accent hover:underline"
                >
                  Copy
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {inspected.tailwindClasses.split(' ').filter(Boolean).map((c, i) => (
                  <span key={i} className="text-[10px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* CSS Styles */}
          <div className="bg-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-secondary">Computed Styles</span>
              <button
                onClick={() => {
                  const css = Object.entries(inspected.styles).map(([k, v]) => `${k}: ${v};`).join('\n');
                  onCopy(css, 'CSS');
                }}
                className="text-[10px] text-accent hover:underline"
              >
                Copy CSS
              </button>
            </div>
            <div className="space-y-0.5 max-h-48 overflow-y-auto text-[10px] font-mono">
              {Object.entries(inspected.styles).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="text-blue-400">{k}</span>
                  <span className="text-primary truncate">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!inspected && !inspecting && (
        <div className="text-center py-8">
          <div className="text-secondary text-sm mb-1">No element selected</div>
          <div className="text-tertiary text-xs">Click "Start Inspector" then click any element on the page.</div>
        </div>
      )}
    </div>
  );
}

/* ── Box model visualizer ──────────────────────────────── */

function BoxModelViz({ spacing, rect }: {
  spacing: ElementInspection['spacing'];
  rect: ElementInspection['rect'];
}) {
  return (
    <div className="bg-card rounded-xl p-4">
      <div className="text-xs text-secondary mb-3">Box Model</div>
      <div className="flex items-center justify-center">
        <div className="relative w-56 h-36">
          {/* Margin layer */}
          <div className="absolute inset-0 border-2 border-dashed border-orange-400/40 rounded-lg">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] text-orange-400">{spacing.margin.top}</span>
            <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[9px] text-orange-400">{spacing.margin.bottom}</span>
            <span className="absolute top-1/2 -left-1 -translate-y-1/2 -translate-x-full text-[9px] text-orange-400">{spacing.margin.left}</span>
            <span className="absolute top-1/2 -right-1 -translate-y-1/2 translate-x-full text-[9px] text-orange-400">{spacing.margin.right}</span>
          </div>

          {/* Padding layer */}
          <div className="absolute inset-4 border-2 border-green-400/40 rounded-md bg-green-400/5">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] text-green-400">{spacing.padding.top}</span>
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] text-green-400">{spacing.padding.bottom}</span>
            <span className="absolute top-1/2 -left-1 -translate-y-1/2 -translate-x-full text-[9px] text-green-400">{spacing.padding.left}</span>
            <span className="absolute top-1/2 -right-1 -translate-y-1/2 translate-x-full text-[9px] text-green-400">{spacing.padding.right}</span>
          </div>

          {/* Content */}
          <div className="absolute inset-8 bg-accent/10 border border-accent/30 rounded flex items-center justify-center">
            <span className="text-[9px] text-accent">{Math.round(rect.width)}×{Math.round(rect.height)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
