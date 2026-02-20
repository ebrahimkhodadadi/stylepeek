/**
 * Background service worker for the extension.
 * Manages state and coordinates between popup/devtools and content scripts.
 */

interface ExtractedData {
  url: string;
  title: string;
  data: unknown;
  timestamp: number;
}

// Cache extracted data per tab
const tabCache = new Map<number, ExtractedData>();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STORE_DATA') {
    const tabId = sender.tab?.id;
    if (tabId != null) {
      tabCache.set(tabId, {
        url: message.url,
        title: message.title,
        data: message.data,
        timestamp: Date.now(),
      });
    }
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === 'GET_CACHED_DATA') {
    const tabId = message.tabId;
    const cached = tabCache.get(tabId);
    sendResponse({ ok: true, data: cached ?? null });
    return true;
  }

  if (message.type === 'CLEAR_CACHE') {
    tabCache.clear();
    sendResponse({ ok: true });
    return true;
  }
});

// Clean up on tab close
chrome.tabs.onRemoved.addListener((tabId) => {
  tabCache.delete(tabId);
});
