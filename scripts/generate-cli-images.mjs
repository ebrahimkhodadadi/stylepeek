#!/usr/bin/env node
/**
 * Generate terminal-style screenshots of stylepeek CLI output.
 * Uses Playwright to render HTML → PNG.
 *
 * Usage:  node scripts/generate-cli-images.mjs
 * Output: assets/cli-help.png, assets/cli-formats.png
 */

import { execSync } from 'child_process';
import { createRequire } from 'module';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirnameHere = dirname(fileURLToPath(import.meta.url));
const corePkg = resolve(__dirnameHere, '..', 'packages', 'core');
const require_ = createRequire(resolve(corePkg, 'package.json'));
const { chromium } = require_('playwright');

const ROOT = resolve(__dirnameHere, '..');
const ASSETS = resolve(ROOT, 'assets');

mkdirSync(ASSETS, { recursive: true });

// ── Capture CLI output ──────────────────────────────────────────────
function run(cmd) {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      env: { ...process.env, FORCE_COLOR: '3', NO_COLOR: undefined },
      timeout: 15_000,
    });
  } catch (e) {
    return e.stdout || e.message;
  }
}

// ── ANSI → HTML ─────────────────────────────────────────────────────
function ansiToHtml(str) {
  const COLORS = {
    '30': '#5c6370', '31': '#e06c75', '32': '#98c379', '33': '#e5c07b',
    '34': '#61afef', '35': '#c678dd', '36': '#56b6c2', '37': '#abb2bf',
    '90': '#5c6370', '91': '#e06c75', '92': '#98c379', '93': '#e5c07b',
    '94': '#61afef', '95': '#c678dd', '96': '#56b6c2', '97': '#ffffff',
  };

  let html = '';
  let i = 0;
  let openSpans = 0;

  while (i < str.length) {
    if (str[i] === '\x1b' && str[i + 1] === '[') {
      // Parse escape sequence
      let j = i + 2;
      while (j < str.length && str[j] !== 'm') j++;
      const codes = str.slice(i + 2, j).split(';');
      i = j + 1;

      for (const code of codes) {
        if (code === '0' || code === '') {
          // Reset
          while (openSpans > 0) { html += '</span>'; openSpans--; }
        } else if (code === '1') {
          html += '<span style="font-weight:700">';
          openSpans++;
        } else if (code === '2') {
          html += '<span style="opacity:0.6">';
          openSpans++;
        } else if (code === '4') {
          html += '<span style="text-decoration:underline">';
          openSpans++;
        } else if (COLORS[code]) {
          html += `<span style="color:${COLORS[code]}">`;
          openSpans++;
        }
      }
    } else if (str[i] === '<') {
      html += '&lt;'; i++;
    } else if (str[i] === '>') {
      html += '&gt;'; i++;
    } else if (str[i] === '&') {
      html += '&amp;'; i++;
    } else {
      html += str[i]; i++;
    }
  }
  while (openSpans > 0) { html += '</span>'; openSpans--; }
  return html;
}

// ── Terminal HTML template ──────────────────────────────────────────
function terminalHtml(title, promptLines) {
  // promptLines: [{ prompt: '$ ', command: '...', output: '...' }, ...]
  let body = '';
  for (const { prompt, command, output } of promptLines) {
    body += `<div class="line"><span class="prompt">${prompt}</span><span class="cmd">${escHtml(command)}</span></div>\n`;
    if (output) {
      body += `<div class="output">${ansiToHtml(output)}</div>\n`;
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background: transparent;
    padding: 0;
    font-size: 0;
  }
  .terminal {
    background: #282c34;
    border-radius: 12px;
    overflow: hidden;
    display: inline-block;
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    min-width: 680px;
    max-width: 780px;
  }
  .titlebar {
    background: #21252b;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .dot { width:12px; height:12px; border-radius:50%; }
  .dot.red { background:#ff5f57; }
  .dot.yellow { background:#febc2e; }
  .dot.green { background:#28c840; }
  .title {
    flex:1;
    text-align:center;
    color:#636d83;
    font-family: 'SF Mono','Cascadia Code','Consolas',monospace;
    font-size: 12px;
    margin-right: 52px;
  }
  .body {
    padding: 20px 24px 24px;
    font-family: 'SF Mono','Cascadia Code','Consolas','Courier New',monospace;
    font-size: 14px;
    line-height: 1.6;
    color: #abb2bf;
  }
  .line { white-space: pre; }
  .prompt { color: #98c379; font-weight: 700; }
  .cmd { color: #61afef; font-weight: 600; }
  .output { white-space: pre; margin-bottom: 8px; }
</style>
</head>
<body>
  <div class="terminal">
    <div class="titlebar">
      <div class="dot red"></div>
      <div class="dot yellow"></div>
      <div class="dot green"></div>
      <div class="title">${escHtml(title)}</div>
    </div>
    <div class="body">${body}</div>
  </div>
</body>
</html>`;
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Screenshot ──────────────────────────────────────────────────────
async function screenshot(html, outPath) {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 900, height: 800 },
    deviceScaleFactor: 2,           // retina quality
  });
  await page.setContent(html, { waitUntil: 'load' });

  // Wait for fonts
  await page.evaluate(() => document.fonts.ready);

  const el = await page.$('.terminal');
  await el.screenshot({ path: outPath, omitBackground: true });
  await browser.close();
  console.log(`  ✓ ${outPath}`);
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log('Capturing CLI output...');
  const helpOut = run('stylepeek --help');
  const fmtOut = run('stylepeek formats');

  console.log('Generating terminal images...');

  // 1) Help screenshot
  const helpHtml = terminalHtml('stylepeek — CLI', [
    { prompt: '$ ', command: 'stylepeek --help', output: helpOut },
  ]);
  await screenshot(helpHtml, resolve(ASSETS, 'cli-help.png'));

  // 2) Formats screenshot
  const fmtHtml = terminalHtml('stylepeek — export formats', [
    { prompt: '$ ', command: 'stylepeek formats', output: fmtOut },
  ]);
  await screenshot(fmtHtml, resolve(ASSETS, 'cli-formats.png'));

  // 3) Combined screenshot (help + formats together)
  const combinedHtml = terminalHtml('stylepeek — CLI', [
    { prompt: '$ ', command: 'stylepeek --help', output: helpOut },
    { prompt: '$ ', command: 'stylepeek formats', output: fmtOut },
  ]);
  await screenshot(combinedHtml, resolve(ASSETS, 'cli-demo.png'));

  console.log('Done!');
}

main().catch(e => { console.error(e); process.exit(1); });
