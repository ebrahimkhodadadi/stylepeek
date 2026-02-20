/**
 * Tests for the analyzer module.
 */

import { describe, it, expect } from 'vitest';
import { analyze } from '../src/analyzer/index.js';
import type { RawPageData, StylepeekConfig } from '../src/types/index.js';
import { DEFAULT_CONFIG } from '../src/config/index.js';

function makePage(overrides: Partial<RawPageData> = {}): RawPageData {
  return {
    url: 'https://example.com',
    cssRules: [
      { selector: 'body', properties: { color: '#333333', 'font-family': '"Inter", sans-serif', 'font-size': '16px', 'font-weight': '400' }, source: 'inline' },
      { selector: '.btn', properties: { 'background-color': '#6366f1', color: '#ffffff', padding: '8px 16px', 'border-radius': '8px' }, source: 'inline' },
      { selector: '.card', properties: { 'box-shadow': '0 2px 8px rgba(0,0,0,0.1)', 'border-radius': '12px', padding: '24px' }, source: 'inline' },
      { selector: 'h1', properties: { 'font-size': '32px', 'font-weight': '700' }, source: 'inline' },
    ],
    customProperties: new Map([
      ['--primary', '#6366f1'],
      ['--text', '#333333'],
    ]),
    computedStyles: [
      { element: 'body', tagName: 'BODY', classList: [], styles: { color: 'rgb(51, 51, 51)', 'font-family': 'Inter, sans-serif', 'font-size': '16px' } },
    ],
    fontFaces: [
      { family: 'Inter', weight: '400', style: 'normal', src: 'url(https://fonts.gstatic.com/inter.woff2)' },
    ],
    imageUrls: ['https://example.com/logo.png'],
    svgElements: [
      { html: '<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>', viewBox: '0 0 24 24', classList: [] },
    ],
    mediaQueries: [
      { query: '(min-width: 768px)', rules: [] },
      { query: '(min-width: 1024px)', rules: [] },
    ],
    resourceUrls: [],
    classNames: ['btn', 'card', 'flex', 'items-center'],
    ...overrides,
  };
}

/** Config with minUsage=1 so single-occurrence values are kept in tests */
const TEST_CONFIG = { ...DEFAULT_CONFIG, extract: { ...DEFAULT_CONFIG.extract, minUsage: 1 } };

describe('analyze', () => {
  it('produces a DesignSystem from raw pages', () => {
    const pages = [makePage()];
    const ds = analyze(pages, 'https://example.com', TEST_CONFIG, Date.now() - 1000);

    expect(ds.meta.url).toBe('https://example.com');
    expect(ds.meta.pageCount).toBe(1);
  });

  it('extracts colors', () => {
    const ds = analyze([makePage()], 'https://example.com', TEST_CONFIG, Date.now());
    expect(ds.colors.palette.length).toBeGreaterThan(0);
  });

  it('extracts typography', () => {
    const ds = analyze([makePage()], 'https://example.com', TEST_CONFIG, Date.now());
    expect(ds.typography.fontFamilies.length).toBeGreaterThanOrEqual(1);
    expect(ds.typography.fontSizes.length).toBeGreaterThanOrEqual(1);
  });

  it('extracts spacing', () => {
    const ds = analyze([makePage()], 'https://example.com', TEST_CONFIG, Date.now());
    expect(ds.spacing.length).toBeGreaterThan(0);
  });

  it('extracts shadows', () => {
    const ds = analyze([makePage()], 'https://example.com', TEST_CONFIG, Date.now());
    expect(ds.shadows.length).toBeGreaterThan(0);
  });

  it('extracts breakpoints', () => {
    const ds = analyze([makePage()], 'https://example.com', TEST_CONFIG, Date.now());
    expect(ds.breakpoints.length).toBe(2);
  });

  it('extracts components', () => {
    const ds = analyze([makePage()], 'https://example.com', TEST_CONFIG, Date.now());
    expect(ds.components.length).toBeGreaterThan(0);
  });

  it('extracts assets', () => {
    const ds = analyze([makePage()], 'https://example.com', TEST_CONFIG, Date.now());
    expect(ds.assets.fonts.length).toBeGreaterThanOrEqual(1);
    expect(ds.assets.images.length).toBeGreaterThanOrEqual(1);
    expect(ds.assets.icons.length).toBeGreaterThanOrEqual(1);
  });

  it('groups colors by hue', () => {
    const ds = analyze([makePage()], 'https://example.com', TEST_CONFIG, Date.now());
    expect(ds.colors.groups.length).toBeGreaterThan(0);
  });

  it('handles multiple pages', () => {
    const page1 = makePage();
    const page2 = makePage({
      url: 'https://example.com/about',
      cssRules: [
        { selector: '.hero', properties: { 'background-color': '#ff5722', color: '#ffffff' }, source: 'inline' },
      ],
    });

    const ds = analyze([page1, page2], 'https://example.com', TEST_CONFIG, Date.now());
    expect(ds.meta.pageCount).toBe(2);
    expect(ds.colors.palette.length).toBeGreaterThanOrEqual(2);
  });
});
