/**
 * Content script — extracts design data from the current page.
 * Runs in the context of the web page.
 */

import { extractPageData } from './extract';

// Listen for messages from popup/devtools
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'EXTRACT_PAGE') {
    try {
      const data = extractPageData();
      sendResponse({ ok: true, data });
    } catch (error) {
      sendResponse({ ok: false, error: (error as Error).message });
    }
    return true; // keep channel open for async response
  }

  if (message.type === 'PING') {
    sendResponse({ ok: true });
    return true;
  }
});
