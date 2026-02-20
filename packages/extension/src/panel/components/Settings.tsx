import React from 'react';
import type { ExtensionSettings, ThemeMode, ColorFormat } from '../../shared/messaging';

interface Props {
  settings: ExtensionSettings;
  onUpdate: (patch: Partial<ExtensionSettings>) => void;
}

export default function Settings({ settings, onUpdate }: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
      <h2 className="text-sm font-semibold text-primary">Settings</h2>

      {/* Theme */}
      <Section title="Appearance">
        <OptionRow label="Theme">
          <select
            value={settings.theme}
            onChange={(e) => onUpdate({ theme: e.target.value as ThemeMode })}
            className="bg-surface text-primary text-xs rounded-lg px-3 py-1.5 border border-border"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </OptionRow>
      </Section>

      {/* Analysis */}
      <Section title="Analysis">
        <Toggle
          label="Auto-analyze on page load"
          checked={settings.autoAnalyze}
          onChange={(v) => onUpdate({ autoAnalyze: v })}
        />
        <Toggle
          label="Enable cache"
          checked={settings.cacheEnabled}
          onChange={(v) => onUpdate({ cacheEnabled: v })}
        />
        <OptionRow label="Cache duration">
          <select
            value={settings.cacheDuration}
            onChange={(e) => onUpdate({ cacheDuration: Number(e.target.value) })}
            className="bg-surface text-primary text-xs rounded-lg px-3 py-1.5 border border-border"
          >
            <option value={5}>5 min</option>
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
            <option value={60}>1 hour</option>
          </select>
        </OptionRow>
      </Section>

      {/* Display */}
      <Section title="Display">
        <OptionRow label="Color format">
          <select
            value={settings.colorFormat}
            onChange={(e) => onUpdate({ colorFormat: e.target.value as ColorFormat })}
            className="bg-surface text-primary text-xs rounded-lg px-3 py-1.5 border border-border"
          >
            <option value="hex">HEX</option>
            <option value="rgb">RGB</option>
            <option value="hsl">HSL</option>
          </select>
        </OptionRow>
        <Toggle
          label="Show Tailwind mappings"
          checked={settings.showTailwind}
          onChange={(v) => onUpdate({ showTailwind: v })}
        />
      </Section>

      {/* About */}
      <Section title="About">
        <div className="text-xs text-secondary space-y-1">
          <div>StylePeek Extension v0.1.0</div>
          <div>Extract and inspect design systems from any website.</div>
          <a
            href="https://github.com/ebrahimkhodadadi/stylepeek"
            target="_blank"
            rel="noopener"
            className="text-accent hover:underline block"
          >
            GitHub Repository →
          </a>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="text-xs text-secondary uppercase tracking-wider">{title}</div>
      {children}
    </div>
  );
}

function OptionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-primary">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-primary">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-border'}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
