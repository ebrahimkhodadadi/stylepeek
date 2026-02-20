/**
 * Content-script entry point.
 * Listens for messages from the background / popup / panel.
 */
import { extractPageData } from './extract';
import { activateInspector, deactivateInspector } from './inspector';
import type { Message, ElementInspection } from '../shared/messaging';

/* ── Message handler ───────────────────────────────────── */

chrome.runtime.onMessage.addListener(
  (msg: Message, _sender, sendResponse) => {
    switch (msg.type) {
      case 'PING':
        sendResponse({ ok: true });
        return false;

      case 'EXTRACT_REQUEST': {
        try {
          const data = extractPageData();
          sendResponse({ ok: true, data });
        } catch (err) {
          sendResponse({ ok: false, data: null, error: String(err) });
        }
        return false;
      }

      case 'INSPECT_ACTIVATE':
        activateInspector(
          (data: ElementInspection) => {
            chrome.runtime.sendMessage({ type: 'ELEMENT_SELECTED', data });
          },
          (data) => {
            if (data) {
              chrome.runtime.sendMessage({ type: 'ELEMENT_HOVERED', data });
            }
          },
        );
        sendResponse({ ok: true });
        return false;

      case 'INSPECT_DEACTIVATE':
        deactivateInspector();
        sendResponse({ ok: true });
        return false;

      default:
        return false;
    }
  },
);

/* ── Inject a small marker so background knows we're loaded */
(window as any).__stylepeek_loaded = true;
