/**
 * Stylepeek Web Server — Express + Server-Sent Events for real-time crawl streaming.
 *
 * Endpoints:
 *   POST /api/crawl    — Starts a crawl, streams SSE events as `text/event-stream`
 *   POST /api/export   — Generate export files (tailwind, css-vars, etc.) from a DesignSystem
 *   GET  /health       — Health check
 *   GET  *             — Serves the built SPA (production)
 */

import express, { type Express } from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { crawlSite, analyze, DEFAULT_CONFIG, getExporter, listExportFormats } from '@stylepeek/core';
import type { CrawlProgress, DesignSystem, OutputFormat } from '@stylepeek/core';
import type { SseEvent } from '../shared/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env['PORT'] ?? 4201);
const IS_PROD = process.env['NODE_ENV'] === 'production';

const app: Express = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ── Export endpoint ──────────────────────────────────────────────────────────
// Accepts a full DesignSystem payload and returns generated files for a given format

app.post('/api/export', (req, res) => {
  const { designSystem, format } = req.body as { designSystem?: unknown; format?: string };

  if (!designSystem || typeof designSystem !== 'object') {
    res.status(400).json({ error: 'designSystem is required' });
    return;
  }

  const validFormats = listExportFormats();
  if (!format || !validFormats.includes(format as OutputFormat)) {
    res.status(400).json({ error: `Invalid format. Valid: ${validFormats.join(', ')}` });
    return;
  }

  try {
    const exporter = getExporter(format as OutputFormat);
    const result = exporter.export(designSystem as DesignSystem);
    const files = Array.isArray(result) ? result : [result];
    res.json({ files });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// ── Export bundle (all formats as ZIP-ready object) ──────────────────────────

app.post('/api/export-all', (req, res) => {
  const { designSystem } = req.body as { designSystem?: unknown };

  if (!designSystem || typeof designSystem !== 'object') {
    res.status(400).json({ error: 'designSystem is required' });
    return;
  }

  try {
    const allFiles: Array<{ format: string; filename: string; content: string; mimeType: string }> = [];
    for (const fmt of listExportFormats()) {
      const exporter = getExporter(fmt);
      const result = exporter.export(designSystem as DesignSystem);
      const files = Array.isArray(result) ? result : [result];
      for (const f of files) {
        allFiles.push({ format: fmt, ...f });
      }
    }
    res.json({ files: allFiles });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// ── Crawl endpoint (SSE stream) ───────────────────────────────────────────────

app.post('/api/crawl', async (req, res) => {
  const { url, depth = 2, workers = 3, waitAfterLoad = 1000 } = req.body as {
    url?: string;
    depth?: number;
    workers?: number;
    waitAfterLoad?: number;
  };

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'url is required' });
    return;
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    res.status(400).json({ error: 'Invalid URL' });
    return;
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  const send = (event: SseEvent) => {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  };

  // Handle client disconnect — use res 'close' which fires when SSE connection drops.
  // NOTE: do NOT use req.on('close') — that fires when Express finishes reading the POST body,
  // which happens before crawlSite() returns, giving a false-positive abort signal.
  let aborted = false;
  res.on('close', () => {
    if (!res.writableEnded) {
      aborted = true;
    }
  });

  try {
    // ── Crawl phase ──────────────────────────────────────────────────────────
    const crawlResult = await crawlSite(
      {
        url,
        depth: Math.min(Number(depth), 5),
        workers: Math.min(Number(workers), 5),
        waitAfterLoad: Number(waitAfterLoad),
        headless: true,
        ignoreTls: false,
      },
      (progress: CrawlProgress) => {
        if (!aborted) {
          send({
            type: 'progress',
            crawledPages: progress.crawledPages,
            totalPages: progress.totalPages,
            currentUrl: progress.currentUrl ?? url,
          });
        }
      },
    );

    if (aborted) return;

    if (!crawlResult.ok) {
      send({ type: 'error', message: String(crawlResult.error) });
      send({ type: 'done' });
      res.end();
      return;
    }

    // ── Analyze phase ────────────────────────────────────────────────────────
    send({ type: 'analyzing' });

    const pages = crawlResult.value;
    const ds = analyze(pages, url, {
      crawl: { ...DEFAULT_CONFIG.crawl, depth, workers, waitAfterLoad },
      extract: { ...DEFAULT_CONFIG.extract },
      output: { ...DEFAULT_CONFIG.output },
    }, Date.now());

    // Send result
    send({ type: 'result', data: ds as unknown as import('../shared/types.js').SerializedDesignSystem });
    send({ type: 'done' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    send({ type: 'error', message: msg });
    send({ type: 'done' });
  } finally {
    if (!res.writableEnded) res.end();
  }
});

// ── Serve SPA in production ───────────────────────────────────────────────────

if (IS_PROD) {
  const staticDir = join(__dirname, '../client');
  if (existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.get('*', (_req, res) => {
      res.sendFile(join(staticDir, 'index.html'));
    });
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────

const server = createServer(app);
server.listen(PORT, () => {
  console.log(`◈ stylepeek server running on http://localhost:${PORT}`);
  if (!IS_PROD) {
    console.log(`  API: http://localhost:${PORT}/api/crawl`);
    console.log(`  UI:  http://localhost:5173  (Vite dev server)`);
  }
});

export { app };
