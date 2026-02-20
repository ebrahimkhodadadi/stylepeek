/**
 * Typed wrappers for chrome.storage operations.
 */
import type { ExtensionSettings, CacheEntry } from './messaging';

const SETTINGS_KEY = 'stylepeek_settings';
const CACHE_PREFIX = 'cache_';

/* ── Settings (chrome.storage.local) ───────────────────── */

export async function getSettings(): Promise<ExtensionSettings> {
  const defaults: ExtensionSettings = {
    theme: 'dark',
    autoAnalyze: true,
    cacheEnabled: true,
    cacheDuration: 5,
    colorFormat: 'hex',
    showTailwind: true,
    ignoredSelectors: '',
  };
  try {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    return { ...defaults, ...(result[SETTINGS_KEY] ?? {}) };
  } catch {
    return defaults;
  }
}

export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  const current = await getSettings();
  await chrome.storage.local.set({ [SETTINGS_KEY]: { ...current, ...settings } });
}

/* ── Cache (chrome.storage.session) ────────────────────── */

function cacheKey(url: string): string {
  return CACHE_PREFIX + btoa(url).slice(0, 64);
}

export async function getCached(url: string, maxAgeMinutes: number): Promise<CacheEntry | null> {
  try {
    const key = cacheKey(url);
    const result = await chrome.storage.session.get(key);
    const entry = result[key] as CacheEntry | undefined;
    if (!entry) return null;
    const age = (Date.now() - entry.timestamp) / 60_000;
    if (age > maxAgeMinutes) {
      await chrome.storage.session.remove(key);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

export async function setCache(entry: CacheEntry): Promise<void> {
  try {
    const key = cacheKey(entry.url);
    await chrome.storage.session.set({ [key]: entry });
  } catch {
    // Session storage may not be available in all contexts
  }
}

export async function clearAllCache(): Promise<void> {
  try {
    const all = await chrome.storage.session.get(null);
    const cacheKeys = Object.keys(all).filter(k => k.startsWith(CACHE_PREFIX));
    if (cacheKeys.length) await chrome.storage.session.remove(cacheKeys);
  } catch {
    // ignore
  }
}

/* ── Panel Window Position ─────────────────────────────── */

const PANEL_POS_KEY = 'panel_position';

export interface PanelPosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

export async function getPanelPosition(): Promise<PanelPosition | null> {
  try {
    const result = await chrome.storage.local.get(PANEL_POS_KEY);
    return (result[PANEL_POS_KEY] as PanelPosition | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function savePanelPosition(pos: PanelPosition): Promise<void> {
  await chrome.storage.local.set({ [PANEL_POS_KEY]: pos });
}
