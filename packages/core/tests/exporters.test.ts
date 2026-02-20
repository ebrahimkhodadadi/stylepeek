/**
 * Tests for the exporter modules.
 */

import { describe, it, expect } from 'vitest';
import {
  TailwindExporter,
  CssVarsExporter,
  StyleDictExporter,
  FigmaExporter,
  JsonExporter,
  HtmlExporter,
  getExporter,
  listExportFormats,
} from '../src/exporter/index.js';
import { analyze } from '../src/analyzer/index.js';
import { DEFAULT_CONFIG } from '../src/config/index.js';
import type { RawPageData, DesignSystem } from '../src/types/index.js';

function makeDesignSystem(): DesignSystem {
  const page: RawPageData = {
    url: 'https://example.com',
    cssRules: [
      { selector: 'body', properties: { color: '#1a1a2e', 'font-family': '"Inter", sans-serif', 'font-size': '16px', 'font-weight': '400' }, source: 'inline' },
      { selector: '.btn', properties: { 'background-color': '#6366f1', color: '#ffffff', padding: '12px 24px', 'border-radius': '8px', transition: 'all 0.2s ease' }, source: 'inline' },
      { selector: 'h1', properties: { 'font-size': '48px', 'font-weight': '700', color: '#1a1a2e' }, source: 'inline' },
      { selector: 'h2', properties: { 'font-size': '32px', 'font-weight': '600' }, source: 'inline' },
      { selector: '.card', properties: { 'box-shadow': '0 4px 12px rgba(0,0,0,0.1)', 'border-radius': '12px', padding: '24px' }, source: 'inline' },
    ],
    customProperties: new Map([['--primary', '#6366f1'], ['--bg', '#ffffff']]),
    computedStyles: [],
    fontFaces: [],
    imageUrls: [],
    svgElements: [],
    mediaQueries: [
      { query: '(min-width: 640px)', rules: [] },
      { query: '(min-width: 768px)', rules: [] },
    ],
    resourceUrls: [],
    classNames: [],
  };

  return analyze([page], 'https://example.com', DEFAULT_CONFIG, Date.now());
}

describe('getExporter', () => {
  it('returns an exporter for each format', () => {
    for (const fmt of listExportFormats()) {
      const exporter = getExporter(fmt);
      expect(exporter).toBeDefined();
      expect(exporter.format).toBe(fmt);
    }
  });

  it('throws for unknown format', () => {
    expect(() => getExporter('nonexistent' as any)).toThrow();
  });
});

describe('listExportFormats', () => {
  it('returns all format names', () => {
    const formats = listExportFormats();
    expect(formats).toContain('html');
    expect(formats).toContain('tailwind');
    expect(formats).toContain('css-vars');
    expect(formats).toContain('json');
    expect(formats).toContain('style-dict');
    expect(formats).toContain('figma');
  });
});

describe('TailwindExporter', () => {
  it('generates tailwind.config.js', () => {
    const ds = makeDesignSystem();
    const exporter = new TailwindExporter();
    const result = exporter.export(ds);
    const file = Array.isArray(result) ? result[0] : result;

    expect(file.filename).toBe('tailwind.config.js');
    expect(file.content).toContain('module.exports');
    expect(file.content).toContain('colors');
  });
});

describe('CssVarsExporter', () => {
  it('generates variables.css', () => {
    const ds = makeDesignSystem();
    const exporter = new CssVarsExporter();
    const result = exporter.export(ds);
    const file = Array.isArray(result) ? result[0] : result;

    expect(file.filename).toBe('variables.css');
    expect(file.content).toContain(':root');
    expect(file.content).toContain('--');
  });
});

describe('StyleDictExporter', () => {
  it('generates style dictionary JSON', () => {
    const ds = makeDesignSystem();
    const exporter = new StyleDictExporter();
    const result = exporter.export(ds);
    const file = Array.isArray(result) ? result[0] : result;

    expect(file.filename).toBe('tokens.style-dict.json');
    const data = JSON.parse(file.content);
    expect(data).toHaveProperty('color');
  });
});

describe('FigmaExporter', () => {
  it('generates Figma-compatible JSON', () => {
    const ds = makeDesignSystem();
    const exporter = new FigmaExporter();
    const result = exporter.export(ds);
    const file = Array.isArray(result) ? result[0] : result;

    expect(file.filename).toBe('tokens.figma.json');
    const data = JSON.parse(file.content);
    expect(data).toHaveProperty('global');
  });
});

describe('JsonExporter', () => {
  it('generates full design system JSON', () => {
    const ds = makeDesignSystem();
    const exporter = new JsonExporter();
    const result = exporter.export(ds);
    const file = Array.isArray(result) ? result[0] : result;

    expect(file.filename).toBe('design-system.json');
    const data = JSON.parse(file.content);
    expect(data).toHaveProperty('colors');
    expect(data).toHaveProperty('typography');
    expect(data).toHaveProperty('spacing');
    expect(data).toHaveProperty('meta');
  });
});

describe('HtmlExporter', () => {
  it('generates a valid HTML file', () => {
    const ds = makeDesignSystem();
    const exporter = new HtmlExporter();
    const result = exporter.export(ds);
    const file = Array.isArray(result) ? result[0] : result;

    expect(file.filename).toBe('style-guide.html');
    expect(file.content).toContain('<!DOCTYPE html>');
    expect(file.content).toContain('stylepeek');
    expect(file.content).toContain('Colors');
    expect(file.content).toContain('Typography');
  });

  it('includes dark mode toggle', () => {
    const ds = makeDesignSystem();
    const exporter = new HtmlExporter();
    const result = exporter.export(ds);
    const file = Array.isArray(result) ? result[0] : result;

    expect(file.content).toContain('data-theme');
    expect(file.content).toContain('toggleTheme');
  });
});
