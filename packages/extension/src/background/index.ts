/**
 * Background service worker.
 * - Auto-extracts on tab navigation
 * - Manages cache in chrome.storage.session
 * - Opens detached panel window
 * - Relays messages between content/popup/panel
 */
import { getSettings } from '../shared/storage';
import { getCached, setCache, clearAllCache, getPanelPosition, savePanelPosition } from '../shared/storage';
import type { CacheEntry, ExtractedDesignData, Message } from '../shared/messaging';

let panelWindowId: number | null = null;

/* ── Message handling ───────────────────────────────────── */

chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true;
});

async function handleMessage(
  message: Message,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
) {
  try {
    switch (message.type) {
      case 'EXTRACT_REQUEST': {
        const tabId = message.tabId ?? sender.tab?.id;
        if (!tabId) { sendResponse({ ok: false, error: 'No tab ID' }); return; }
        const data = await triggerExtraction(tabId);
        sendResponse({ ok: true, data });
        return;
      }

      case 'EXTRACT_RESULT': {
        const tabId = sender.tab?.id;
        if (tabId != null) {
          const entry: CacheEntry = {
            url: message.url,
            title: message.title,
            data: message.data,
            timestamp: Date.now(),
          };
          await setCache(entry);
          broadcastToUI({ type: 'EXTRACT_RESULT', data: message.data, url: message.url, title: message.title });
        }
        sendResponse({ ok: true });
        return;
      }

      case 'GET_CACHED_DATA': {
        const settings = await getSettings();
        const tab = await chrome.tabs.get(message.tabId);
        if (tab.url) {
          const cached = await getCached(tab.url, settings.cacheDuration);
          sendResponse({ ok: true, data: cached });
        } else {
          sendResponse({ ok: true, data: null });
        }
        return;
      }

      case 'CLEAR_CACHE': {
        await clearAllCache();
        sendResponse({ ok: true });
        return;
      }

      case 'OPEN_PANEL': {
        await openPanelWindow(message.tab);
        sendResponse({ ok: true });
        return;
      }

      case 'INSPECT_ACTIVATE':
      case 'INSPECT_DEACTIVATE': {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          try { await chrome.tabs.sendMessage(tab.id, message); } catch { /* no content script */ }
        }
        sendResponse({ ok: true });
        return;
      }

      case 'ELEMENT_SELECTED':
      case 'ELEMENT_HOVERED': {
        broadcastToUI(message);
        sendResponse({ ok: true });
        return;
      }

      default:
        sendResponse({ ok: true });
    }
  } catch (err) {
    sendResponse({ ok: false, error: (err as Error).message });
  }
}

/* ── Extraction ─────────────────────────────────────────── */

async function triggerExtraction(tabId: number): Promise<ExtractedDesignData | null> {
  const settings = await getSettings();
  const tab = await chrome.tabs.get(tabId);
  if (tab.url) {
    const cached = await getCached(tab.url, settings.cacheDuration);
    if (cached) return cached.data;
  }

  // Ensure content script is injected
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'PING' });
  } catch {
    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['src/content/index.ts'] });
      await new Promise(r => setTimeout(r, 200));
    } catch { return null; }
  }

  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_REQUEST' });
    if (response?.ok && response.data) {
      const entry: CacheEntry = { url: tab.url || '', title: tab.title || '', data: response.data, timestamp: Date.now() };
      await setCache(entry);
      return response.data;
    }
  } catch { /* fail */ }
  return null;
}

/* ── Auto-extract on navigation ─────────────────────────── */

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) return;
  const settings = await getSettings();
  if (!settings.autoAnalyze) return;

  setTimeout(async () => {
    try {
      const data = await triggerExtraction(tabId);
      if (data) {
        broadcastToUI({ type: 'EXTRACT_RESULT', data, url: tab.url!, title: tab.title || '' });
        broadcastToUI({ type: 'TAB_CHANGED', tab: 'colors', tabId, url: tab.url! });
      }
    } catch { /* silent */ }
  }, 500);
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) return;
    broadcastToUI({ type: 'TAB_CHANGED', tab: 'colors', tabId: activeInfo.tabId, url: tab.url });
    const settings = await getSettings();
    if (!settings.autoAnalyze) return;
    const data = await triggerExtraction(activeInfo.tabId);
    if (data) broadcastToUI({ type: 'EXTRACT_RESULT', data, url: tab.url!, title: tab.title || '' });
  } catch { /* ignore */ }
});

/* ── Panel window ───────────────────────────────────────── */

async function openPanelWindow(defaultTab?: string) {
  if (panelWindowId != null) {
    try { await chrome.windows.update(panelWindowId, { focused: true }); return; }
    catch { panelWindowId = null; }
  }
  const baseUrl = chrome.runtime.getURL('src/panel/index.html');
  const url = defaultTab ? `${baseUrl}?tab=${defaultTab}` : baseUrl;
  const savedPos = await getPanelPosition();
  const win = await chrome.windows.create({
    url, type: 'popup',
    width: savedPos?.width ?? 420, height: savedPos?.height ?? 780,
    left: savedPos?.left, top: savedPos?.top, focused: true,
  });
  panelWindowId = win?.id ?? null;
}

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === panelWindowId) panelWindowId = null;
});

/* ── Keyboard commands ──────────────────────────────────── */

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'open-panel') await openPanelWindow();
  if (command === 'inspect-mode') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      try { await chrome.tabs.sendMessage(tab.id, { type: 'INSPECT_ACTIVATE' }); } catch { /* */ }
    }
  }
});

/* ── Broadcast ──────────────────────────────────────────── */

function broadcastToUI(message: Message) {
  chrome.runtime.sendMessage(message).catch(() => {});
}
