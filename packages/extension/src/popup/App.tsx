import React, { useEffect, useState, useCallback } from 'react';
import type { ExtractedDesignData, ExtensionSettings, ThemeMode } from '../shared/messaging';
import { DEFAULT_SETTINGS } from '../shared/messaging';
import { getSettings, saveSettings } from '../shared/storage';
import Header from './components/Header';
import StatsBar from './components/StatsBar';
import MiniColors from './components/MiniColors';
import MiniTypography from './components/MiniTypography';

type Tab = 'colors' | 'typography' | 'overview';

export default function App() {
  const [data, setData] = useState<ExtractedDesignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('colors');
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);

  // Load settings
  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  // Auto-extract on open
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) { setError('No active tab'); setLoading(false); return; }

      chrome.runtime.sendMessage({ type: 'EXTRACT_PAGE', tabId }, (res) => {
        if (chrome.runtime.lastError) {
          setError(chrome.runtime.lastError.message || 'Extraction failed');
          setLoading(false);
          return;
        }
        if (res?.data) {
          setData(res.data);
        } else {
          setError(res?.error || 'No data extracted');
        }
        setLoading(false);
      });
    });
  }, []);

  // Listen for extraction results from background
  useEffect(() => {
    const listener = (msg: any) => {
      if (msg.type === 'EXTRACT_RESULT' && msg.data) {
        setData(msg.data);
        setLoading(false);
        setError(null);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const openPanel = useCallback((defaultTab?: string) => {
    chrome.runtime.sendMessage({ type: 'OPEN_PANEL', defaultTab });
  }, []);

  const toggleTheme = useCallback(async () => {
    const next: ThemeMode = settings.theme === 'dark' ? 'light' : 'dark';
    const updated = { ...settings, theme: next };
    setSettings(updated);
    await saveSettings(updated);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }, [settings]);

  const toggleInspector = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        chrome.tabs.sendMessage(tabId, { type: 'INSPECT_ACTIVATE' });
        window.close(); // close popup so user can interact with page
      }
    });
  }, []);

  return (
    <div className="w-[360px] h-[580px] bg-surface text-primary flex flex-col overflow-hidden">
      <Header
        url={data?.url}
        onOpenPanel={openPanel}
        onToggleTheme={toggleTheme}
        onInspect={toggleInspector}
        theme={settings.theme}
      />

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-secondary">Extracting…</span>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-red-400 text-sm mb-2">⚠ {error}</div>
            <button
              className="px-3 py-1.5 text-xs bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-colors"
              onClick={() => { setLoading(true); setError(null); window.location.reload(); }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {data && !loading && (
        <>
          <StatsBar data={data} />

          {/* Tabs */}
          <div className="flex border-b border-border px-4">
            {(['colors', 'typography', 'overview'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-2 text-xs font-medium capitalize transition-colors border-b-2 ${
                  tab === t
                    ? 'border-accent text-accent'
                    : 'border-transparent text-secondary hover:text-primary'
                }`}
              >
                {t}
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={() => openPanel(tab)}
              className="text-xs text-secondary hover:text-accent transition-colors px-2 py-2"
              title="Open in panel"
            >
              ↗
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin">
            {tab === 'colors' && <MiniColors data={data} />}
            {tab === 'typography' && <MiniTypography data={data} />}
            {tab === 'overview' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Stat label="Stylesheets" value={data.stylesheetCount} />
                  <Stat label="CSS Rules" value={data.cssRuleCount} />
                  <Stat label="Gradients" value={data.gradients.length} />
                  <Stat label="Shadows" value={data.shadows.length} />
                  <Stat label="SVG Icons" value={data.icons.length} />
                  <Stat label="Images" value={data.images.length} />
                  <Stat label="Custom Props" value={Object.keys(data.customProperties).length} />
                  <Stat label="Class Names" value={data.classNames.length} />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card rounded-lg p-2.5">
      <div className="text-lg font-semibold text-primary">{value}</div>
      <div className="text-[10px] text-secondary">{label}</div>
    </div>
  );
}
