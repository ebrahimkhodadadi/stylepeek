import React from 'react';
import type { ThemeMode } from '../../shared/messaging';

interface Props {
  url?: string;
  theme: ThemeMode;
  onOpenPanel: (tab?: string) => void;
  onToggleTheme: () => void;
  onInspect: () => void;
}

export default function Header({ url, theme, onOpenPanel, onToggleTheme, onInspect }: Props) {
  const domain = url ? new URL(url).hostname : '—';

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
      {/* Logo */}
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0">
        <svg viewBox="0 0 128 128" className="w-4 h-4">
          <path
            d="M64 8 C50 8, 24 40, 24 72 C24 96, 42 120, 64 120 C86 120, 104 96, 104 72 C104 40, 78 8, 64 8Z"
            fill="white" opacity="0.9"
          />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-primary truncate">StylePeek</div>
        <div className="text-[10px] text-secondary truncate">{domain}</div>
      </div>

      {/* Inspect button */}
      <button
        onClick={onInspect}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-hover transition-colors text-secondary hover:text-accent"
        title="Element Inspector (Alt+I)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      </button>

      {/* Theme toggle */}
      <button
        onClick={onToggleTheme}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-hover transition-colors text-secondary hover:text-primary"
        title="Toggle theme"
      >
        {theme === 'dark' ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        )}
      </button>

      {/* Open panel */}
      <button
        onClick={() => onOpenPanel()}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-hover transition-colors text-secondary hover:text-accent"
        title="Open in panel (Alt+Shift+S)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
        </svg>
      </button>
    </div>
  );
}
