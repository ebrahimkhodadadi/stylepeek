/**
 * HTML Style Guide Exporter — generates a beautiful, self-contained
 * single HTML file that serves as a visual reference for the design system.
 */

import type { DesignSystem, Exporter, ExportFile, ColorToken, ColorGroup } from '../types/index.js';

export class HtmlExporter implements Exporter {
  format = 'html';
  extension = '.html';

  /**
   * Generate a self-contained HTML style guide.
   */
  export(ds: DesignSystem): ExportFile {
    const html = this.buildHtml(ds);
    return {
      filename: 'style-guide.html',
      content: html,
      mimeType: 'text/html',
    };
  }

  private buildHtml(ds: DesignSystem): string {
    return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Style Guide — ${this.escapeHtml(ds.meta.url)}</title>
  ${this.buildStyles()}
</head>
<body>
  ${this.buildSidebar(ds)}
  <main class="main">
    ${this.buildHeader(ds)}
    ${this.buildColorSection(ds)}
    ${this.buildTypographySection(ds)}
    ${this.buildSpacingSection(ds)}
    ${this.buildBorderRadiusSection(ds)}
    ${this.buildShadowSection(ds)}
    ${this.buildBreakpointSection(ds)}
    ${this.buildComponentSection(ds)}
    ${this.buildAssetSection(ds)}
  </main>
  ${this.buildScripts(ds)}
</body>
</html>`;
  }

  private buildStyles(): string {
    return `<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #f1f3f5;
  --text: #1a1a2e;
  --text-secondary: #6c757d;
  --text-muted: #adb5bd;
  --border: #dee2e6;
  --accent: #6366f1;
  --accent-light: #eef2ff;
  --radius: 8px;
  --shadow: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 25px rgba(0,0,0,0.1);
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
  --sidebar-width: 260px;
}

[data-theme="dark"] {
  --bg: #0f0f23;
  --bg-secondary: #1a1a3e;
  --bg-tertiary: #252547;
  --text: #e8e8f0;
  --text-secondary: #a0a0c0;
  --text-muted: #6a6a8a;
  --border: #2d2d5e;
  --accent: #818cf8;
  --accent-light: #1e1b4b;
  --shadow: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-lg: 0 10px 25px rgba(0,0,0,0.4);
}

body {
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  display: flex;
  min-height: 100vh;
}

/* Sidebar */
.sidebar {
  width: var(--sidebar-width);
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  padding: 24px 0;
  overflow-y: auto;
  z-index: 100;
}

.sidebar-logo {
  padding: 0 20px 20px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 16px;
}

.sidebar-logo h1 {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent);
  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar-logo h1::before {
  content: '◈';
  font-size: 22px;
}

.sidebar nav a {
  display: block;
  padding: 8px 20px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.15s;
}

.sidebar nav a:hover, .sidebar nav a.active {
  color: var(--accent);
  background: var(--accent-light);
}

.sidebar-controls {
  padding: 16px 20px;
  border-top: 1px solid var(--border);
  margin-top: auto;
}

.theme-toggle {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 8px 16px;
  border-radius: var(--radius);
  cursor: pointer;
  width: 100%;
  font-size: 13px;
  transition: all 0.15s;
}

.theme-toggle:hover { border-color: var(--accent); }

/* Filter */
.filter-input {
  display: block;
  width: calc(100% - 40px);
  margin: 0 20px 12px;
  padding: 8px 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 13px;
  outline: none;
}

.filter-input:focus { border-color: var(--accent); }

/* Main content */
.main {
  margin-left: var(--sidebar-width);
  padding: 40px 48px;
  flex: 1;
  max-width: 1200px;
}

/* Sections */
.section { margin-bottom: 64px; }

.section-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text);
}

.section-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 32px;
}

/* Header */
.header-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 48px;
}

.header-url {
  font-size: 14px;
  color: var(--accent);
  word-break: break-all;
  margin-bottom: 12px;
}

.header-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.stat-box {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent);
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: var(--accent-light);
  color: var(--accent);
}

/* Color swatches */
.color-group { margin-bottom: 32px; }

.color-group-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  text-transform: capitalize;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.color-swatch {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.color-swatch:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.swatch-preview {
  height: 80px;
  position: relative;
}

.swatch-info {
  padding: 10px 12px;
  background: var(--bg);
}

.swatch-name {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 2px;
}

.swatch-hex {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-secondary);
}

.swatch-usage {
  font-size: 11px;
  color: var(--text-muted);
}

/* Typography previews */
.type-sample {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  margin-bottom: 16px;
}

.type-sample-text { margin-bottom: 8px; }

.type-meta {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
}

.font-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 12px;
}

.font-preview {
  font-size: 32px;
  font-weight: 400;
  min-width: 60px;
}

.font-details { flex: 1; }

.font-name { font-weight: 600; font-size: 15px; }

.font-stack {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* Scale visualization */
.scale-bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  cursor: pointer;
}

.scale-bar-row:hover .scale-bar { background: var(--accent); }

.scale-label {
  font-family: var(--font-mono);
  font-size: 13px;
  min-width: 80px;
  text-align: right;
  color: var(--text-secondary);
}

.scale-bar {
  height: 24px;
  background: var(--accent);
  opacity: 0.7;
  border-radius: 4px;
  transition: all 0.15s;
  min-width: 4px;
}

.scale-value {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
  min-width: 60px;
}

/* Radius preview */
.radius-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
}

.radius-box {
  text-align: center;
  cursor: pointer;
}

.radius-preview {
  width: 80px;
  height: 80px;
  background: var(--accent);
  opacity: 0.7;
  margin: 0 auto 8px;
}

.radius-label {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-secondary);
}

/* Shadow preview */
.shadow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
}

.shadow-box {
  text-align: center;
  cursor: pointer;
}

.shadow-preview {
  width: 120px;
  height: 80px;
  background: var(--bg);
  border-radius: var(--radius);
  margin: 0 auto 12px;
}

.shadow-label {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-secondary);
  word-break: break-all;
}

/* Table */
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: 12px 16px;
  border-bottom: 2px solid var(--border);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}

.data-table tr:hover td { background: var(--bg-secondary); }

/* Component cards */
.component-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 24px;
  overflow: hidden;
}

.component-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.component-name {
  font-size: 16px;
  font-weight: 600;
}

.component-count {
  font-size: 12px;
  color: var(--text-muted);
}

.component-code {
  padding: 16px 20px;
  background: var(--bg-tertiary);
  overflow-x: auto;
}

.component-code pre {
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.5;
  color: var(--text);
}

/* Icons & images */
.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
}

.asset-item {
  text-align: center;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.15s;
}

.asset-item:hover {
  border-color: var(--accent);
  box-shadow: var(--shadow);
}

.asset-item svg {
  max-width: 48px;
  max-height: 48px;
  margin-bottom: 8px;
}

.asset-name {
  font-size: 11px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--text);
  color: var(--bg);
  padding: 12px 20px;
  border-radius: var(--radius);
  font-size: 13px;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s;
  z-index: 1000;
  pointer-events: none;
}

.toast.show {
  opacity: 1;
  transform: translateY(0);
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar { display: none; }
  .main { margin-left: 0; padding: 24px; }
}
</style>`;
  }

  private buildSidebar(ds: DesignSystem): string {
    return `<aside class="sidebar">
  <div class="sidebar-logo">
    <h1>stylepeek</h1>
  </div>
  <input type="text" class="filter-input" placeholder="Search tokens..." id="filterInput" />
  <nav>
    <a href="#header">Overview</a>
    <a href="#colors">Colors (${ds.colors.palette.length})</a>
    <a href="#typography">Typography (${ds.typography.fontFamilies.length} families)</a>
    <a href="#spacing">Spacing (${ds.spacing.length})</a>
    <a href="#radius">Border Radius (${ds.borderRadius.length})</a>
    <a href="#shadows">Shadows (${ds.shadows.length})</a>
    <a href="#breakpoints">Breakpoints (${ds.breakpoints.length})</a>
    ${ds.components.length > 0 ? `<a href="#components">Components (${ds.components.length})</a>` : ''}
    <a href="#assets">Assets</a>
  </nav>
  <div class="sidebar-controls">
    <button class="theme-toggle" onclick="toggleTheme()">Toggle Dark Mode</button>
  </div>
</aside>`;
  }

  private buildHeader(ds: DesignSystem): string {
    const m = ds.meta;
    return `<div id="header" class="header-card">
  <div class="header-url">${this.escapeHtml(m.url)}</div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
    <span class="badge">${m.framework !== 'unknown' ? m.framework : 'No framework detected'}</span>
    <span class="badge">${m.pageCount} page${m.pageCount !== 1 ? 's' : ''} crawled</span>
    <span class="badge">${m.totalStylesheets} stylesheets</span>
    <span class="badge">${m.totalRules} CSS rules</span>
    ${m.duration > 0 ? `<span class="badge">${(m.duration / 1000).toFixed(1)}s</span>` : ''}
  </div>
  <div class="header-stats">
    <div class="stat-box">
      <div class="stat-value">${ds.colors.palette.length}</div>
      <div class="stat-label">Colors</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${ds.typography.fontFamilies.length}</div>
      <div class="stat-label">Fonts</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${ds.typography.fontSizes.length}</div>
      <div class="stat-label">Font Sizes</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${ds.spacing.length}</div>
      <div class="stat-label">Spacing</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${ds.shadows.length}</div>
      <div class="stat-label">Shadows</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${ds.components.length}</div>
      <div class="stat-label">Components</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${ds.assets.fonts.length}</div>
      <div class="stat-label">Font Files</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${ds.assets.icons.length}</div>
      <div class="stat-label">Icons</div>
    </div>
  </div>
</div>`;
  }

  private buildColorSection(ds: DesignSystem): string {
    if (ds.colors.palette.length === 0) return '';

    let html = `<section id="colors" class="section">
  <h2 class="section-title">Colors</h2>
  <p class="section-subtitle">${ds.colors.palette.length} unique colors in ${ds.colors.groups.length} groups. Click any swatch to copy its hex value.</p>`;

    // Semantic colors
    const sem = ds.colors.semantic;
    const semanticEntries = Object.entries(sem).filter(([, v]) => v != null) as Array<[string, ColorToken]>;
    if (semanticEntries.length > 0) {
      html += `<div class="color-group">
    <h3 class="color-group-title">Semantic Colors</h3>
    <div class="color-grid">`;
      for (const [role, color] of semanticEntries) {
        html += this.buildColorSwatch(color, role);
      }
      html += `</div></div>`;
    }

    // Grouped colors
    for (const group of ds.colors.groups) {
      html += this.buildColorGroup(group);
    }

    // Gradients
    if (ds.colors.gradients.length > 0) {
      html += `<div class="color-group">
    <h3 class="color-group-title">Gradients</h3>
    <div class="color-grid">`;
      for (const g of ds.colors.gradients) {
        html += `<div class="color-swatch" onclick="copyToClipboard('${this.escapeAttr(g.raw)}')" title="Click to copy">
      <div class="swatch-preview" style="background:${this.escapeAttr(g.raw)}"></div>
      <div class="swatch-info">
        <div class="swatch-name">${this.escapeHtml(g.name)}</div>
        <div class="swatch-hex">${g.type}-gradient</div>
      </div>
    </div>`;
      }
      html += `</div></div>`;
    }

    html += `</section>`;
    return html;
  }

  private buildColorGroup(group: ColorGroup): string {
    let html = `<div class="color-group">
    <h3 class="color-group-title">${this.escapeHtml(group.name)} (${group.colors.length})</h3>
    <div class="color-grid">`;

    for (const color of group.colors) {
      html += this.buildColorSwatch(color);
    }

    html += `</div></div>`;
    return html;
  }

  private buildColorSwatch(color: ColorToken, label?: string): string {
    const name = label ?? color.name;
    const textColor = color.value.hsl.l > 50 ? '#000' : '#fff';
    return `<div class="color-swatch" data-token="${this.escapeAttr(name)}" onclick="copyToClipboard('${color.value.hex}')" title="Click to copy ${color.value.hex}">
      <div class="swatch-preview" style="background:${color.value.hex};color:${textColor};display:flex;align-items:center;justify-content:center;font-size:12px;font-family:var(--font-mono)">${color.value.hex}</div>
      <div class="swatch-info">
        <div class="swatch-name">${this.escapeHtml(name)}</div>
        <div class="swatch-hex">rgb(${color.value.rgb.r}, ${color.value.rgb.g}, ${color.value.rgb.b})</div>
        <div class="swatch-usage">Used ${color.usageCount}×${color.cssVariable ? ` · ${this.escapeHtml(color.cssVariable)}` : ''}</div>
      </div>
    </div>`;
  }

  private buildTypographySection(ds: DesignSystem): string {
    if (ds.typography.fontFamilies.length === 0 && ds.typography.fontSizes.length === 0) return '';

    let html = `<section id="typography" class="section">
  <h2 class="section-title">Typography</h2>
  <p class="section-subtitle">${ds.typography.fontFamilies.length} font families, ${ds.typography.fontSizes.length} sizes, ${ds.typography.fontWeights.length} weights.</p>`;

    // Font families
    for (const ff of ds.typography.fontFamilies) {
      html += `<div class="font-card" onclick="copyToClipboard('${this.escapeAttr(ff.raw)}')">
    <div class="font-preview" style="font-family:${this.escapeAttr(ff.raw)}">Aa</div>
    <div class="font-details">
      <div class="font-name">${this.escapeHtml(ff.stack[0] ?? ff.name)}</div>
      <div class="font-stack">${this.escapeHtml(ff.raw)}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Category: ${ff.category} · Used ${ff.usageCount}×</div>
    </div>
  </div>`;
    }

    // Text styles
    if (ds.typography.textStyles.length > 0) {
      html += `<h3 class="color-group-title" style="margin-top:32px">Text Styles</h3>`;
      for (const ts of ds.typography.textStyles) {
        html += `<div class="type-sample">
      <div class="type-sample-text" style="font-family:${this.escapeAttr(ts.fontFamily)};font-size:${ts.fontSize};font-weight:${ts.fontWeight};line-height:${ts.lineHeight};letter-spacing:${ts.letterSpacing}">The quick brown fox jumps over the lazy dog</div>
      <div class="type-meta">${this.escapeHtml(ts.name)} · ${ts.fontSize} / ${ts.fontWeight} / ${ts.lineHeight}</div>
    </div>`;
      }
    }

    // Font sizes as scale
    if (ds.typography.fontSizes.length > 0) {
      html += `<h3 class="color-group-title" style="margin-top:32px">Font Size Scale</h3>`;
      for (const fs of ds.typography.fontSizes) {
        html += `<div class="scale-bar-row" onclick="copyToClipboard('${this.escapeAttr(fs.value)}')">
      <span class="scale-label">${this.escapeHtml(fs.name)}</span>
      <div class="scale-bar" style="width:${Math.min(fs.numericPx * 3, 600)}px"></div>
      <span class="scale-value">${this.escapeHtml(fs.value)}</span>
    </div>`;
      }
    }

    // Font weights
    if (ds.typography.fontWeights.length > 0) {
      html += `<h3 class="color-group-title" style="margin-top:32px">Font Weights</h3>
    <div style="display:flex;gap:16px;flex-wrap:wrap">`;
      for (const w of ds.typography.fontWeights) {
        html += `<div class="type-sample" style="cursor:pointer" onclick="copyToClipboard('${w}')">
        <div style="font-weight:${w};font-size:24px">${w}</div>
        <div class="type-meta">${this.weightName(w)}</div>
      </div>`;
      }
      html += `</div>`;
    }

    html += `</section>`;
    return html;
  }

  private buildSpacingSection(ds: DesignSystem): string {
    if (ds.spacing.length === 0) return '';

    let html = `<section id="spacing" class="section">
  <h2 class="section-title">Spacing</h2>
  <p class="section-subtitle">${ds.spacing.length} spacing values detected.</p>`;

    for (const s of ds.spacing) {
      const barWidth = Math.min(s.numericPx * 2, 600);
      html += `<div class="scale-bar-row" onclick="copyToClipboard('${this.escapeAttr(s.value)}')">
    <span class="scale-label">${this.escapeHtml(s.name)}</span>
    <div class="scale-bar" style="width:${barWidth}px"></div>
    <span class="scale-value">${this.escapeHtml(s.value)} (${s.numericPx}px)</span>
  </div>`;
    }

    html += `</section>`;
    return html;
  }

  private buildBorderRadiusSection(ds: DesignSystem): string {
    if (ds.borderRadius.length === 0) return '';

    let html = `<section id="radius" class="section">
  <h2 class="section-title">Border Radius</h2>
  <p class="section-subtitle">${ds.borderRadius.length} unique radius values.</p>
  <div class="radius-grid">`;

    for (const r of ds.borderRadius) {
      html += `<div class="radius-box" onclick="copyToClipboard('${this.escapeAttr(r.value)}')">
    <div class="radius-preview" style="border-radius:${r.value}"></div>
    <div class="radius-label">${this.escapeHtml(r.name)}<br>${this.escapeHtml(r.value)}</div>
  </div>`;
    }

    html += `</div></section>`;
    return html;
  }

  private buildShadowSection(ds: DesignSystem): string {
    if (ds.shadows.length === 0) return '';

    let html = `<section id="shadows" class="section">
  <h2 class="section-title">Shadows</h2>
  <p class="section-subtitle">${ds.shadows.length} shadow definitions.</p>
  <div class="shadow-grid">`;

    for (const s of ds.shadows) {
      html += `<div class="shadow-box" onclick="copyToClipboard(\`${this.escapeAttr(s.raw)}\`)">
    <div class="shadow-preview" style="box-shadow:${s.raw}"></div>
    <div class="shadow-label"><strong>${this.escapeHtml(s.name)}</strong><br>${this.escapeHtml(s.raw)}</div>
  </div>`;
    }

    html += `</div></section>`;
    return html;
  }

  private buildBreakpointSection(ds: DesignSystem): string {
    if (ds.breakpoints.length === 0) return '';

    let html = `<section id="breakpoints" class="section">
  <h2 class="section-title">Breakpoints</h2>
  <p class="section-subtitle">${ds.breakpoints.length} responsive breakpoints detected.</p>
  <table class="data-table">
    <thead><tr><th>Name</th><th>Type</th><th>Value</th><th>Pixels</th></tr></thead>
    <tbody>`;

    for (const bp of ds.breakpoints) {
      html += `<tr onclick="copyToClipboard('${this.escapeAttr(bp.value)}')">
      <td><strong>${this.escapeHtml(bp.name)}</strong></td>
      <td>${bp.type}</td>
      <td style="font-family:var(--font-mono)">${this.escapeHtml(bp.value)}</td>
      <td>${bp.numericPx}px</td>
    </tr>`;
    }

    html += `</tbody></table>`;

    // Z-index table
    if (ds.zIndex.length > 0) {
      html += `<h3 class="color-group-title" style="margin-top:32px">Z-Index Stack</h3>
    <div style="display:flex;gap:8px;flex-wrap:wrap">`;
      for (const z of ds.zIndex) {
        html += `<div class="badge" style="cursor:pointer" onclick="copyToClipboard('${z}')">${z}</div>`;
      }
      html += `</div>`;
    }

    html += `</section>`;
    return html;
  }

  private buildComponentSection(ds: DesignSystem): string {
    if (ds.components.length === 0) return '';

    let html = `<section id="components" class="section">
  <h2 class="section-title">Components</h2>
  <p class="section-subtitle">${ds.components.length} UI components detected.</p>`;

    for (const comp of ds.components) {
      html += `<div class="component-card">
    <div class="component-header">
      <span class="component-name">${this.escapeHtml(comp.name)}</span>
      <span class="component-count">${comp.instanceCount} instances · ${comp.selectors.length} selectors</span>
    </div>
    <div class="component-code">
      <pre>${this.escapeHtml(comp.css)}</pre>
    </div>
  </div>`;
    }

    html += `</section>`;
    return html;
  }

  private buildAssetSection(ds: DesignSystem): string {
    const hasAssets = ds.assets.fonts.length > 0 || ds.assets.images.length > 0 || ds.assets.icons.length > 0;
    if (!hasAssets) return '';

    let html = `<section id="assets" class="section">
  <h2 class="section-title">Assets</h2>
  <p class="section-subtitle">${ds.assets.fonts.length} fonts, ${ds.assets.images.length} images, ${ds.assets.icons.length} icons.</p>`;

    // Fonts table
    if (ds.assets.fonts.length > 0) {
      html += `<h3 class="color-group-title">Font Files</h3>
    <table class="data-table">
      <thead><tr><th>Family</th><th>Weight</th><th>Style</th><th>Format</th><th>Source</th></tr></thead>
      <tbody>`;
      for (const f of ds.assets.fonts) {
        html += `<tr>
        <td><strong>${this.escapeHtml(f.family)}</strong></td>
        <td>${f.weight}</td>
        <td>${f.style}</td>
        <td class="badge">${f.format}</td>
        <td>${f.source}</td>
      </tr>`;
      }
      html += `</tbody></table>`;
    }

    // Icons
    if (ds.assets.icons.length > 0) {
      html += `<h3 class="color-group-title" style="margin-top:32px">Icons (${ds.assets.icons.length})</h3>
    <div class="asset-grid">`;
      for (const icon of ds.assets.icons.slice(0, 60)) {
        // Sanitize SVG for inline display
        const safeSvg = icon.svg.replace(/script/gi, 'removed');
        html += `<div class="asset-item" onclick="copyToClipboard(this.querySelector('svg')?.outerHTML || '')" title="${this.escapeAttr(icon.name)}">
      ${safeSvg}
      <div class="asset-name">${this.escapeHtml(icon.name)}</div>
    </div>`;
      }
      html += `</div>`;
    }

    html += `</section>`;
    return html;
  }

  private buildScripts(ds: DesignSystem): string {
    return `<div class="toast" id="toast">Copied!</div>
<script>
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(function() {
    var toast = document.getElementById('toast');
    toast.textContent = 'Copied: ' + text.slice(0, 60) + (text.length > 60 ? '...' : '');
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 1500);
  });
}

function toggleTheme() {
  var html = document.documentElement;
  var current = html.getAttribute('data-theme');
  html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
}

// Sidebar active link tracking
var sections = document.querySelectorAll('.section, .header-card');
var navLinks = document.querySelectorAll('.sidebar nav a');

var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      navLinks.forEach(function(l) { l.classList.remove('active'); });
      var id = entry.target.id;
      var active = document.querySelector('.sidebar nav a[href="#' + id + '"]');
      if (active) active.classList.add('active');
    }
  });
}, { rootMargin: '-20% 0px -70% 0px' });

sections.forEach(function(s) { if (s.id) observer.observe(s); });

// Token filter
document.getElementById('filterInput').addEventListener('input', function(e) {
  var q = e.target.value.toLowerCase();
  document.querySelectorAll('.color-swatch, .scale-bar-row, .radius-box, .shadow-box, .component-card').forEach(function(el) {
    var text = el.textContent.toLowerCase();
    el.style.display = q === '' || text.includes(q) ? '' : 'none';
  });
});
</script>`;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private escapeAttr(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, "\\'")
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private weightName(w: number): string {
    const names: Record<number, string> = {
      100: 'Thin', 200: 'Extra Light', 300: 'Light', 400: 'Regular',
      500: 'Medium', 600: 'Semi Bold', 700: 'Bold', 800: 'Extra Bold', 900: 'Black',
    };
    return names[w] ?? String(w);
  }
}
