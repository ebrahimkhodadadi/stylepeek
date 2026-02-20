import React, { useEffect, useState, useCallback } from 'react';
import type { ExtractedDesignData, ExtensionSettings, ThemeMode, Message } from '../shared/messaging';
import { DEFAULT_SETTINGS } from '../shared/messaging';
import { getSettings, saveSettings } from '../shared/storage';
import ColorsTab from './tabs/ColorsTab';
import TypographyTab from './tabs/TypographyTab';
import SpacingTab from './tabs/SpacingTab';
import AssetsTab from './tabs/AssetsTab';
import ExportTab from './tabs/ExportTab';
import InspectorPanel from './tabs/InspectorPanel';
import Settings from './components/Settings';
import Toast, { useToast } from './components/Toast';

type TabId = 'colors' | 'typography' | 'spacing' | 'inspector' | 'assets' | 'export';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'colors', label: 'Colors', icon: '🎨' },
  { id: 'typography', label: 'Typography', icon: '🔤' },
  { id: 'spacing', label: 'Spacing', icon: '📐' },
  { id: 'inspector', label: 'Inspector', icon: '🎯' },
  { id: 'assets', label: 'Assets', icon: '📦' },
  { id: 'export', label: 'Export', icon: '💾' },
];

export default function App() {
  const [data, setData] = useState<ExtractedDesignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('colors');
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  // Read initial tab from URL params (set by background when opening)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tab');
    if (t && TABS.some(tt => tt.id === t)) setTab(t as TabId);
  }, []);

  useEffect(() => { getSettings().then(setSettings); }, []);

  // Listen for extraction results
  useEffect(() => {
    const listener = (msg: Message) => {
      if (msg.type === 'EXTRACT_RESULT' && msg.data) {
        setData(msg.data);
        setLoading(false);
      }
      if (msg.type === 'TAB_CHANGED') {
        setTab(msg.tab as TabId);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  // Request extraction from the active tab
  useEffect(() => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) { setLoading(false); return; }
      chrome.runtime.sendMessage({ type: 'EXTRACT_PAGE', tabId }, (res: any) => {
        if (res?.data) { setData(res.data); }
        setLoading(false);
      });
    });
  }, []);

  const updateSettings = useCallback(async (patch: Partial<ExtensionSettings>) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    await saveSettings(updated);
    if (patch.theme) {
      document.documentElement.classList.toggle('dark', patch.theme === 'dark');
    }
  }, [settings]);

  const copyToClipboard = useCallback((text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    addToast(`Copied ${label || 'to clipboard'}`, 'success');
  }, [addToast]);

  return (
    <div className="min-h-screen bg-surface text-primary flex">
      {/* Sidebar */}
      <aside className="w-14 bg-card border-r border-border flex flex-col items-center py-4 gap-1 flex-shrink-0">
        {/* Logo */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mb-4">
          <svg viewBox="0 0 128 128" className="w-5 h-5">
            <path d="M64 8 C50 8, 24 40, 24 72 C24 96, 42 120, 64 120 C86 120, 104 96, 104 72 C104 40, 78 8, 64 8Z" fill="white" opacity="0.9" />
          </svg>
        </div>

        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm transition-all ${
              tab === t.id
                ? 'bg-accent/20 text-accent shadow-sm'
                : 'text-secondary hover:bg-hover hover:text-primary'
            }`}
            title={t.label}
          >
            {t.icon}
          </button>
        ))}

        <div className="flex-1" />

        <button
          onClick={() => setShowSettings(s => !s)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm transition-all ${
            showSettings ? 'bg-accent/20 text-accent' : 'text-secondary hover:bg-hover hover:text-primary'
          }`}
          title="Settings"
        >
          ⚙️
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-12 border-b border-border flex items-center px-4 gap-3 flex-shrink-0">
          <h1 className="text-sm font-semibold text-primary">
            {TABS.find(t => t.id === tab)?.label || 'Settings'}
          </h1>
          {data && (
            <span className="text-xs text-secondary truncate ml-auto">{data.title || data.url}</span>
          )}
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-secondary">Analyzing page…</span>
            </div>
          </div>
        ) : showSettings ? (
          <Settings settings={settings} onUpdate={updateSettings} />
        ) : !data ? (
          <div className="flex-1 flex items-center justify-center text-secondary text-sm">
            No data — navigate to a page and this panel will auto-analyze.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
            {tab === 'colors' && <ColorsTab data={data} onCopy={copyToClipboard} settings={settings} />}
            {tab === 'typography' && <TypographyTab data={data} onCopy={copyToClipboard} />}
            {tab === 'spacing' && <SpacingTab data={data} onCopy={copyToClipboard} />}
            {tab === 'inspector' && <InspectorPanel data={data} onCopy={copyToClipboard} />}
            {tab === 'assets' && <AssetsTab data={data} />}
            {tab === 'export' && <ExportTab data={data} addToast={addToast} />}
          </div>
        )}
      </main>

      {/* Toast container */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
