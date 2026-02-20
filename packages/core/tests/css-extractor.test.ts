/**
 * Tests for the CSS extractor module.
 */

import { describe, it, expect } from 'vitest';
import {
  parseColor,
  colorDistance,
  extractColors,
  extractGradients,
  extractTypography,
  extractSpacing,
  extractBorderRadius,
  extractShadows,
  extractBreakpoints,
  extractZIndex,
  extractTransitions,
  extractComponents,
  detectFramework,
  cssSizeToPx,
  pxToRem,
} from '../src/extractor/css-extractor.js';
import type { RawPageData } from '../src/types/index.js';

/** Helper to create a minimal RawPageData from components */
function makePage(overrides: Partial<RawPageData> = {}): RawPageData {
  return {
    url: 'https://test.local',
    cssRules: [],
    customProperties: new Map<string, string>(),
    computedStyles: [],
    fontFaces: [],
    imageUrls: [],
    svgElements: [],
    resourceUrls: [],
    mediaQueries: [],
    classNames: [],
    ...overrides,
  };
}

// ── parseColor ────────────────────────────────────────────

describe('parseColor', () => {
  it('parses 6-digit hex', () => {
    const c = parseColor('#ff0000');
    expect(c).not.toBeNull();
    expect(c!.rgb).toEqual({ r: 255, g: 0, b: 0 });
    expect(c!.hex).toBe('#ff0000');
  });

  it('parses 3-digit hex', () => {
    const c = parseColor('#f00');
    expect(c).not.toBeNull();
    expect(c!.rgb).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses rgb()', () => {
    const c = parseColor('rgb(0, 128, 255)');
    expect(c).not.toBeNull();
    expect(c!.rgb).toEqual({ r: 0, g: 128, b: 255 });
  });

  it('parses rgba()', () => {
    const c = parseColor('rgba(255, 0, 0, 0.5)');
    expect(c).not.toBeNull();
    expect(c!.rgb).toEqual({ r: 255, g: 0, b: 0 });
    expect(c!.alpha).toBe(0.5);
  });

  it('parses hsl()', () => {
    const c = parseColor('hsl(0, 100%, 50%)');
    expect(c).not.toBeNull();
    expect(c!.rgb.r).toBe(255);
    expect(c!.rgb.g).toBe(0);
    expect(c!.rgb.b).toBe(0);
  });

  it('parses named colors', () => {
    const c = parseColor('red');
    expect(c).not.toBeNull();
    expect(c!.hex).toBe('#ff0000');
  });

  it('returns null for invalid values', () => {
    expect(parseColor('not-a-color')).toBeNull();
    expect(parseColor('inherit')).toBeNull();
    expect(parseColor('transparent')).toBeNull();
  });

  it('parses 8-digit hex with alpha', () => {
    const c = parseColor('#ff000080');
    expect(c).not.toBeNull();
    expect(c!.rgb).toEqual({ r: 255, g: 0, b: 0 });
    expect(c!.alpha).toBeCloseTo(0.5, 1);
  });
});

// ── colorDistance ──────────────────────────────────────────

function makeColorValue(r: number, g: number, b: number) {
  return {
    hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
    rgb: { r, g, b },
    hsl: { h: 0, s: 0, l: 0 }, // approximate
    alpha: 1,
  };
}

describe('colorDistance', () => {
  it('returns 0 for identical colors', () => {
    expect(colorDistance(makeColorValue(100, 100, 100), makeColorValue(100, 100, 100))).toBe(0);
  });

  it('returns > 0 for different colors', () => {
    const d = colorDistance(makeColorValue(255, 0, 0), makeColorValue(0, 0, 255));
    expect(d).toBeGreaterThan(0);
  });

  it('black vs white is near max distance', () => {
    const d = colorDistance(makeColorValue(0, 0, 0), makeColorValue(255, 255, 255));
    expect(d).toBeGreaterThan(200);
  });
});

// ── cssSizeToPx ───────────────────────────────────────────

describe('cssSizeToPx', () => {
  it('converts px values', () => {
    expect(cssSizeToPx('16px')).toBe(16);
    expect(cssSizeToPx('0px')).toBe(0);
  });

  it('converts rem values (base 16)', () => {
    expect(cssSizeToPx('1rem')).toBe(16);
    expect(cssSizeToPx('0.5rem')).toBe(8);
    expect(cssSizeToPx('2rem')).toBe(32);
  });

  it('converts em values (base 16)', () => {
    expect(cssSizeToPx('1em')).toBe(16);
  });

  it('converts pt values', () => {
    expect(cssSizeToPx('12pt')).toBeCloseTo(16, 0);
  });

  it('returns 0 for unrecognized values', () => {
    expect(cssSizeToPx('auto')).toBe(0);
    expect(cssSizeToPx('inherit')).toBe(0);
  });
});

// ── pxToRem ───────────────────────────────────────────────

describe('pxToRem', () => {
  it('converts pixels to rem', () => {
    expect(pxToRem(16)).toBe('1rem');
    expect(pxToRem(8)).toBe('0.5rem');
    expect(pxToRem(24)).toBe('1.5rem');
  });
});

// ── extractColors ─────────────────────────────────────────

describe('extractColors', () => {
  it('extracts unique colors from CSS rules', () => {
    const pages = [makePage({
      cssRules: [
        { selector: '.a', properties: { color: '#ff0000' }, source: 'test' },
        { selector: '.b', properties: { 'background-color': '#00ff00' }, source: 'test' },
        { selector: '.c', properties: { color: '#ff0000' }, source: 'test' }, // duplicate
      ],
    })];

    const colors = extractColors(pages, 1);
    expect(colors.length).toBeGreaterThanOrEqual(2);

    const hexes = colors.map(c => c.value.hex);
    expect(hexes).toContain('#ff0000');
    expect(hexes).toContain('#00ff00');
  });

  it('counts usage frequency', () => {
    const pages = [makePage({
      cssRules: [
        { selector: '.a', properties: { color: '#ff0000' }, source: 'test' },
        { selector: '.b', properties: { color: '#ff0000' }, source: 'test' },
        { selector: '.c', properties: { color: '#ff0000' }, source: 'test' },
      ],
    })];

    const colors = extractColors(pages, 1);
    const red = colors.find(c => c.value.hex === '#ff0000');
    expect(red).toBeDefined();
    expect(red!.usageCount).toBe(3);
  });

  it('extracts colors from custom properties', () => {
    const pages = [makePage({
      customProperties: new Map([['--primary', '#6366f1'], ['--bg', '#ffffff']]),
    })];
    const colors = extractColors(pages, 1);
    expect(colors.length).toBeGreaterThanOrEqual(2);
  });
});

// ── extractGradients ──────────────────────────────────────

describe('extractGradients', () => {
  it('extracts linear-gradient', () => {
    const pages = [makePage({
      cssRules: [
        { selector: '.bg', properties: { background: 'linear-gradient(90deg, #ff0000, #0000ff)' }, source: 'test' },
      ],
    })];
    const gradients = extractGradients(pages);
    expect(gradients.length).toBe(1);
    expect(gradients[0].type).toBe('linear');
  });

  it('extracts radial-gradient', () => {
    const pages = [makePage({
      cssRules: [
        { selector: '.bg', properties: { background: 'radial-gradient(circle, #fff, #000)' }, source: 'test' },
      ],
    })];
    const gradients = extractGradients(pages);
    expect(gradients.length).toBe(1);
    expect(gradients[0].type).toBe('radial');
  });
});

// ── extractTypography ─────────────────────────────────────

describe('extractTypography', () => {
  it('extracts font families, sizes, weights', () => {
    const pages = [makePage({
      cssRules: [
        { selector: 'body', properties: { 'font-family': '"Inter", sans-serif', 'font-size': '16px', 'font-weight': '400' }, source: 'test' },
        { selector: 'h1', properties: { 'font-family': '"Inter", sans-serif', 'font-size': '32px', 'font-weight': '700' }, source: 'test' },
      ],
    })];

    const typo = extractTypography(pages, 1);

    expect(typo.fontFamilies.length).toBeGreaterThanOrEqual(1);
    expect(typo.fontSizes.length).toBeGreaterThanOrEqual(2);
    expect(typo.fontWeights).toContain(400);
    expect(typo.fontWeights).toContain(700);
  });
});

// ── extractSpacing ────────────────────────────────────────

describe('extractSpacing', () => {
  it('extracts unique spacing values', () => {
    const pages = [makePage({
      cssRules: [
        { selector: '.a', properties: { margin: '16px', padding: '8px' }, source: 'test' },
        { selector: '.b', properties: { gap: '24px' }, source: 'test' },
      ],
    })];

    const spacing = extractSpacing(pages, 1);
    const values = spacing.map(s => s.value);
    expect(values).toContain('8px');
    expect(values).toContain('16px');
    expect(values).toContain('24px');
  });

  it('sorts spacing by pixel value', () => {
    const pages = [makePage({
      cssRules: [
        { selector: '.a', properties: { padding: '32px', margin: '4px' }, source: 'test' },
      ],
    })];

    const spacing = extractSpacing(pages, 1);
    for (let i = 1; i < spacing.length; i++) {
      expect(spacing[i].numericPx).toBeGreaterThanOrEqual(spacing[i - 1].numericPx);
    }
  });
});

// ── extractBorderRadius ───────────────────────────────────

describe('extractBorderRadius', () => {
  it('extracts unique border radius values', () => {
    const pages = [makePage({
      cssRules: [
        { selector: '.btn', properties: { 'border-radius': '8px' }, source: 'test' },
        { selector: '.card', properties: { 'border-radius': '12px' }, source: 'test' },
      ],
    })];

    const radii = extractBorderRadius(pages, 1);
    expect(radii.length).toBe(2);
  });
});

// ── extractShadows ────────────────────────────────────────

describe('extractShadows', () => {
  it('extracts box-shadow values', () => {
    const pages = [makePage({
      cssRules: [
        { selector: '.card', properties: { 'box-shadow': '0 2px 4px rgba(0,0,0,0.1)' }, source: 'test' },
      ],
    })];

    const shadows = extractShadows(pages, 1);
    expect(shadows.length).toBe(1);
    expect(shadows[0].raw).toContain('rgba(0,0,0,0.1)');
  });

  it('skips "none" shadow', () => {
    const pages = [makePage({
      cssRules: [
        { selector: '.flat', properties: { 'box-shadow': 'none' }, source: 'test' },
      ],
    })];
    const shadows = extractShadows(pages, 1);
    expect(shadows.length).toBe(0);
  });
});

// ── extractBreakpoints ────────────────────────────────────

describe('extractBreakpoints', () => {
  it('extracts breakpoints from media queries', () => {
    const pages = [makePage({
      mediaQueries: [
        { query: '(min-width: 768px)', rules: [] },
        { query: '(min-width: 1024px)', rules: [] },
      ],
    })];

    const bp = extractBreakpoints(pages);
    expect(bp.length).toBe(2);
    expect(bp[0].numericPx).toBe(768);
    expect(bp[1].numericPx).toBe(1024);
  });
});

// ── extractZIndex ─────────────────────────────────────────

describe('extractZIndex', () => {
  it('extracts unique z-index values sorted', () => {
    const pages = [makePage({
      cssRules: [
        { selector: '.modal', properties: { 'z-index': '1000' }, source: 'test' },
        { selector: '.header', properties: { 'z-index': '100' }, source: 'test' },
        { selector: '.dropdown', properties: { 'z-index': '1000' }, source: 'test' }, // dupe
      ],
    })];

    const zIndex = extractZIndex(pages);
    expect(zIndex).toEqual([100, 1000]);
  });
});

// ── extractTransitions ────────────────────────────────────

describe('extractTransitions', () => {
  it('extracts transitions', () => {
    const pages = [makePage({
      cssRules: [
        { selector: '.btn', properties: { transition: 'all 0.3s ease' }, source: 'test' },
      ],
    })];

    const transitions = extractTransitions(pages, 1);
    expect(transitions.length).toBe(1);
    expect(transitions[0].raw).toBe('all 0.3s ease');
  });

  it('skips "none"', () => {
    const pages = [makePage({
      cssRules: [
        { selector: '.x', properties: { transition: 'none' }, source: 'test' },
      ],
    })];
    const transitions = extractTransitions(pages, 1);
    expect(transitions.length).toBe(0);
  });
});

// ── detectFramework ───────────────────────────────────────

describe('detectFramework', () => {
  it('detects Tailwind CSS', () => {
    const pages = [makePage({
      classNames: [
        'flex', 'items-center', 'bg-blue-500', 'text-sm', 'p-4', 'rounded-lg',
        'text-white', 'bg-gray-100', 'p-2', 'p-6', 'm-4', 'm-2', 'w-full', 'h-screen',
        'border-gray-200', 'shadow-lg', 'space-x-4', 'gap-2', 'justify-between',
        'items-start', 'grid', 'text-lg', 'bg-red-500', 'rounded-md',
      ],
    })];
    expect(detectFramework(pages)).toBe('tailwind');
  });

  it('detects Bootstrap', () => {
    const pages = [makePage({
      classNames: [
        'btn', 'btn-primary', 'container', 'row', 'col-md-6',
        'col-lg-4', 'col-sm-12', 'btn-secondary', 'btn-danger', 'nav-link',
        'navbar-brand', 'modal-dialog', 'card-body', 'form-control',
      ],
    })];
    expect(detectFramework(pages)).toBe('bootstrap');
  });

  it('returns unknown for generic classes', () => {
    const pages = [makePage({
      classNames: ['header', 'content', 'footer', 'active'],
    })];
    expect(detectFramework(pages)).toBe('unknown');
  });
});

// ── extractComponents ─────────────────────────────────────

describe('extractComponents', () => {
  it('groups rules by component pattern', () => {
    const pages = [makePage({
      cssRules: [
        { selector: '.btn', properties: { padding: '8px 16px', 'border-radius': '4px' }, source: 'test' },
        { selector: '.btn-primary', properties: { 'background-color': '#0066ff', color: '#fff' }, source: 'test' },
        { selector: '.card', properties: { padding: '16px', 'border-radius': '8px' }, source: 'test' },
      ],
    })];

    const components = extractComponents(pages, 1);
    expect(components.length).toBeGreaterThanOrEqual(2);

    const names = components.map(c => c.name);
    expect(names).toContain('button');
    expect(names).toContain('card');
  });
});
