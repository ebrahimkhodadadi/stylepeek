/**
 * CSS Extractor — parses raw page data and extracts color, typography,
 * spacing, shadow, breakpoint, transition, and component tokens.
 */

import type {
  RawPageData,
  ColorToken,
  ColorValue,
  GradientToken,
  FontFamilyToken,
  ScaleToken,
  TextStyleToken,
  ShadowToken,
  BreakpointToken,
  TransitionToken,
  ComponentToken,
  DetectedFramework,
} from '../types/index.js';

// ─── Color Extraction ───────────────────────────────────────────────────────

const COLOR_PROPERTIES = new Set([
  'color', 'background-color', 'border-color', 'border-top-color',
  'border-right-color', 'border-bottom-color', 'border-left-color',
  'outline-color', 'text-decoration-color', 'fill', 'stroke',
  'caret-color', 'column-rule-color',
]);

const HEX_RE = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
const RGB_RE = /rgba?\(\s*[\d.]+%?\s*[,\s]\s*[\d.]+%?\s*[,\s]\s*[\d.]+%?\s*(?:[,/]\s*[\d.]+%?\s*)?\)/g;
const HSL_RE = /hsla?\(\s*[\d.]+(?:deg)?\s*[,\s]\s*[\d.]+%\s*[,\s]\s*[\d.]+%\s*(?:[,/]\s*[\d.]+%?\s*)?\)/g;

/**
 * Parse a CSS color string into a normalized ColorValue.
 * Returns null for transparent, inherit, initial, currentColor.
 */
export function parseColor(raw: string): ColorValue | null {
  const trimmed = raw.trim().toLowerCase();

  // Skip non-colors
  if (['transparent', 'inherit', 'initial', 'currentcolor', 'unset', 'none', ''].includes(trimmed)) {
    return null;
  }

  try {
    // Parse hex
    if (trimmed.startsWith('#')) {
      return hexToColorValue(trimmed);
    }

    // Parse rgb/rgba
    if (trimmed.startsWith('rgb')) {
      return rgbStringToColorValue(trimmed);
    }

    // Parse hsl/hsla
    if (trimmed.startsWith('hsl')) {
      return hslStringToColorValue(trimmed);
    }

    // Named colors
    const named = NAMED_COLORS[trimmed];
    if (named) {
      return hexToColorValue(named);
    }

    return null;
  } catch {
    return null;
  }
}

function hexToColorValue(hex: string): ColorValue {
  let r: number, g: number, b: number, a = 1;
  const h = hex.replace('#', '');

  if (h.length === 3 || h.length === 4) {
    r = parseInt(h[0]! + h[0]!, 16);
    g = parseInt(h[1]! + h[1]!, 16);
    b = parseInt(h[2]! + h[2]!, 16);
    if (h.length === 4) a = parseInt(h[3]! + h[3]!, 16) / 255;
  } else {
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
    if (h.length === 8) a = parseInt(h.slice(6, 8), 16) / 255;
  }

  const { h: hue, s, l } = rgbToHsl(r, g, b);

  return {
    hex: rgbToHex(r, g, b),
    rgb: { r, g, b },
    hsl: { h: hue, s, l },
    alpha: Math.round(a * 100) / 100,
  };
}

function rgbStringToColorValue(raw: string): ColorValue | null {
  const match = raw.match(/rgba?\(\s*([\d.]+)%?\s*[,\s]\s*([\d.]+)%?\s*[,\s]\s*([\d.]+)%?\s*(?:[,/]\s*([\d.]+)%?\s*)?\)/);
  if (!match) return null;

  const r = Math.round(parseFloat(match[1]!));
  const g = Math.round(parseFloat(match[2]!));
  const b = Math.round(parseFloat(match[3]!));
  const a = match[4] ? parseFloat(match[4]) : 1;

  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;

  const { h, s, l } = rgbToHsl(r, g, b);

  return {
    hex: rgbToHex(r, g, b),
    rgb: { r, g, b },
    hsl: { h, s, l },
    alpha: a > 1 ? a / 100 : a,
  };
}

function hslStringToColorValue(raw: string): ColorValue | null {
  const match = raw.match(/hsla?\(\s*([\d.]+)(?:deg)?\s*[,\s]\s*([\d.]+)%\s*[,\s]\s*([\d.]+)%\s*(?:[,/]\s*([\d.]+)%?\s*)?\)/);
  if (!match) return null;

  const h = parseFloat(match[1]!);
  const s = parseFloat(match[2]!);
  const l = parseFloat(match[3]!);
  const a = match[4] ? parseFloat(match[4]) : 1;

  if (isNaN(h) || isNaN(s) || isNaN(l)) return null;

  const { r, g, b } = hslToRgb(h, s, l);

  return {
    hex: rgbToHex(r, g, b),
    rgb: { r, g, b },
    hsl: { h: Math.round(h), s: Math.round(s), l: Math.round(l) },
    alpha: a > 1 ? a / 100 : a,
  };
}

// ─── Color math utilities ───────────────────────────────────────────────────

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p2 = 2 * l - q2;
    r = hue2rgb(p2, q2, h + 1 / 3);
    g = hue2rgb(p2, q2, h);
    b = hue2rgb(p2, q2, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Calculate perceptual color distance (simplified CIE76 deltaE).
 * Returns 0 for identical colors, higher values for more different colors.
 */
export function colorDistance(a: ColorValue, b: ColorValue): number {
  // Simple Euclidean distance in RGB space weighted for perception
  const rDiff = a.rgb.r - b.rgb.r;
  const gDiff = a.rgb.g - b.rgb.g;
  const bDiff = a.rgb.b - b.rgb.b;

  // Weighted for human color perception
  const rMean = (a.rgb.r + b.rgb.r) / 2;
  const rWeight = 2 + rMean / 256;
  const gWeight = 4;
  const bWeight = 2 + (255 - rMean) / 256;

  return Math.sqrt(rWeight * rDiff * rDiff + gWeight * gDiff * gDiff + bWeight * bDiff * bDiff);
}

// ─── Main Extraction Functions ──────────────────────────────────────────────

/**
 * Extract all colors from raw page data.
 */
export function extractColors(pages: RawPageData[], minUsage: number): ColorToken[] {
  const colorMap = new Map<string, { value: ColorValue; raw: string; count: number; usedIn: Set<string>; cssVar?: string }>();

  for (const page of pages) {
    // From CSS rules
    for (const rule of page.cssRules) {
      for (const [prop, value] of Object.entries(rule.properties)) {
        if (COLOR_PROPERTIES.has(prop)) {
          const colors = extractColorsFromValue(value);
          for (const { raw, parsed } of colors) {
            const key = parsed.hex;
            const existing = colorMap.get(key);
            if (existing) {
              existing.count++;
              existing.usedIn.add(prop);
            } else {
              colorMap.set(key, { value: parsed, raw, count: 1, usedIn: new Set([prop]) });
            }
          }
        }

        // Custom properties with color values
        if (prop.startsWith('--') && (prop.includes('color') || prop.includes('bg') || prop.includes('text'))) {
          const parsed = parseColor(value);
          if (parsed) {
            const key = parsed.hex;
            const existing = colorMap.get(key);
            if (existing) {
              existing.count++;
              existing.cssVar = prop;
            } else {
              colorMap.set(key, { value: parsed, raw: value, count: 1, usedIn: new Set(), cssVar: prop });
            }
          }
        }
      }
    }

    // From custom properties
    for (const [prop, value] of page.customProperties.entries()) {
      const parsed = parseColor(value);
      if (parsed) {
        const key = parsed.hex;
        const existing = colorMap.get(key);
        if (existing) {
          existing.cssVar = existing.cssVar ?? prop;
        } else {
          colorMap.set(key, { value: parsed, raw: value, count: 1, usedIn: new Set(), cssVar: prop });
        }
      }
    }

    // From computed styles
    for (const cs of page.computedStyles) {
      for (const [prop, value] of Object.entries(cs.styles)) {
        if (COLOR_PROPERTIES.has(prop)) {
          const parsed = parseColor(value);
          if (parsed) {
            const key = parsed.hex;
            const existing = colorMap.get(key);
            if (existing) {
              existing.count++;
              existing.usedIn.add(prop);
            } else {
              colorMap.set(key, { value: parsed, raw: value, count: 1, usedIn: new Set([prop]) });
            }
          }
        }
      }
    }
  }

  // Filter by minimum usage and convert to tokens
  const tokens: ColorToken[] = [];
  let index = 0;

  for (const [, data] of colorMap) {
    if (data.count < minUsage) continue;

    const name = data.cssVar
      ? cssVarToName(data.cssVar)
      : generateColorName(data.value, index);

    tokens.push({
      name,
      value: data.value,
      raw: data.raw,
      usageCount: data.count,
      usedIn: Array.from(data.usedIn),
      cssVariable: data.cssVar,
    });
    index++;
  }

  // Sort by usage count (most used first)
  tokens.sort((a, b) => b.usageCount - a.usageCount);

  return tokens;
}

function extractColorsFromValue(value: string): Array<{ raw: string; parsed: ColorValue }> {
  const results: Array<{ raw: string; parsed: ColorValue }> = [];

  // Try direct parse first
  const direct = parseColor(value);
  if (direct) {
    results.push({ raw: value, parsed: direct });
    return results;
  }

  // Extract hex colors  
  const hexMatches = value.match(HEX_RE);
  if (hexMatches) {
    for (const m of hexMatches) {
      const parsed = parseColor(m);
      if (parsed) results.push({ raw: m, parsed });
    }
  }

  // Extract rgb/rgba
  const rgbMatches = value.match(RGB_RE);
  if (rgbMatches) {
    for (const m of rgbMatches) {
      const parsed = parseColor(m);
      if (parsed) results.push({ raw: m, parsed });
    }
  }

  // Extract hsl/hsla
  const hslMatches = value.match(HSL_RE);
  if (hslMatches) {
    for (const m of hslMatches) {
      const parsed = parseColor(m);
      if (parsed) results.push({ raw: m, parsed });
    }
  }

  return results;
}

/**
 * Extract gradients from raw page data.
 */
export function extractGradients(pages: RawPageData[]): GradientToken[] {
  const gradientMap = new Map<string, { raw: string; type: 'linear' | 'radial' | 'conic'; count: number }>();

  for (const page of pages) {
    for (const rule of page.cssRules) {
      for (const [prop, value] of Object.entries(rule.properties)) {
        if (prop === 'background-image' || prop === 'background') {
          const gradientMatch = value.match(/(linear|radial|conic)-gradient\([^)]+\)/g);
          if (gradientMatch) {
            for (const g of gradientMatch) {
              const existing = gradientMap.get(g);
              if (existing) {
                existing.count++;
              } else {
                const type = g.startsWith('linear') ? 'linear'
                  : g.startsWith('radial') ? 'radial'
                  : 'conic';
                gradientMap.set(g, { raw: g, type, count: 1 });
              }
            }
          }
        }
      }
    }
  }

  return Array.from(gradientMap.entries()).map(([, data], i) => ({
    name: `gradient-${i + 1}`,
    raw: data.raw,
    type: data.type,
    stops: [], // Simplified — full gradient parsing is complex
    usageCount: data.count,
  }));
}

/**
 * Extract typography tokens from raw page data.
 */
export function extractTypography(pages: RawPageData[], minUsage: number): {
  fontFamilies: FontFamilyToken[];
  fontSizes: ScaleToken[];
  fontWeights: number[];
  lineHeights: ScaleToken[];
  letterSpacing: ScaleToken[];
  textStyles: TextStyleToken[];
} {
  const familyMap = new Map<string, { stack: string[]; raw: string; count: number }>();
  const sizeMap = new Map<string, { count: number; px: number }>();
  const weightSet = new Map<number, number>();
  const lineHeightMap = new Map<string, { count: number; px: number }>();
  const letterSpacingMap = new Map<string, { count: number; px: number }>();

  for (const page of pages) {
    for (const rule of page.cssRules) {
      const props = rule.properties;

      // Font families
      if (props['font-family']) {
        const raw = props['font-family'];
        const key = raw.toLowerCase().replace(/['"]/g, '').trim();
        const existing = familyMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          const stack = raw.split(',').map((f) => f.trim().replace(/['"]/g, ''));
          familyMap.set(key, { stack, raw, count: 1 });
        }
      }

      // Font sizes
      if (props['font-size']) {
        const raw = props['font-size'];
        const px = cssSizeToPx(raw);
        const existing = sizeMap.get(raw);
        if (existing) {
          existing.count++;
        } else {
          sizeMap.set(raw, { count: 1, px });
        }
      }

      // Font weights
      if (props['font-weight']) {
        const w = parseFontWeight(props['font-weight']);
        weightSet.set(w, (weightSet.get(w) ?? 0) + 1);
      }

      // Line heights
      if (props['line-height']) {
        const raw = props['line-height'];
        const px = cssSizeToPx(raw);
        const existing = lineHeightMap.get(raw);
        if (existing) {
          existing.count++;
        } else {
          lineHeightMap.set(raw, { count: 1, px });
        }
      }

      // Letter spacing
      if (props['letter-spacing']) {
        const raw = props['letter-spacing'];
        const px = cssSizeToPx(raw);
        const existing = letterSpacingMap.get(raw);
        if (existing) {
          existing.count++;
        } else {
          letterSpacingMap.set(raw, { count: 1, px });
        }
      }
    }
  }

  // Also extract from computed styles
  for (const page of pages) {
    for (const cs of page.computedStyles) {
      if (cs.styles['font-family']) {
        const raw = cs.styles['font-family'];
        const key = raw.toLowerCase().replace(/['"]/g, '').trim();
        const existing = familyMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          const stack = raw.split(',').map((f) => f.trim().replace(/['"]/g, ''));
          familyMap.set(key, { stack, raw, count: 1 });
        }
      }
      if (cs.styles['font-size']) {
        const raw = cs.styles['font-size'];
        const px = cssSizeToPx(raw);
        const existing = sizeMap.get(raw);
        if (existing) existing.count++;
        else sizeMap.set(raw, { count: 1, px });
      }
    }
  }

  // Build font family tokens
  const fontFamilies: FontFamilyToken[] = [];
  let famIdx = 0;
  for (const [, data] of familyMap) {
    if (data.count < minUsage) continue;
    fontFamilies.push({
      name: `font-${famIdx}`,
      stack: data.stack,
      raw: data.raw,
      usageCount: data.count,
      category: detectFontCategory(data.stack),
    });
    famIdx++;
  }
  fontFamilies.sort((a, b) => b.usageCount - a.usageCount);

  // Assign better names
  const categoryCount: Record<string, number> = {};
  for (const ff of fontFamilies) {
    const cat = ff.category;
    categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;
    if (categoryCount[cat] === 1) {
      ff.name = cat === 'unknown' ? (ff.stack[0] ?? 'font').toLowerCase().replace(/\s+/g, '-') : cat;
    } else {
      ff.name = `${cat}-${categoryCount[cat]}`;
    }
  }

  // Build font size tokens
  const fontSizes = mapToScaleTokens(sizeMap, minUsage, 'text');

  // Build line height tokens
  const lineHeights = mapToScaleTokens(lineHeightMap, minUsage, 'leading');

  // Build letter spacing tokens
  const letterSpacing = mapToScaleTokens(letterSpacingMap, minUsage, 'tracking');

  // Extract text styles from computed styles of key elements
  const textStyles = extractTextStyles(pages);

  // Font weights
  const fontWeights = Array.from(weightSet.entries())
    .filter(([, count]) => count >= minUsage)
    .map(([w]) => w)
    .sort((a, b) => a - b);

  return { fontFamilies, fontSizes, fontWeights, lineHeights, letterSpacing, textStyles };
}

/**
 * Extract spacing scale tokens.
 */
export function extractSpacing(pages: RawPageData[], minUsage: number): ScaleToken[] {
  const spacingMap = new Map<string, { count: number; px: number }>();
  const spacingProps = new Set([
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'gap', 'row-gap', 'column-gap',
  ]);

  for (const page of pages) {
    for (const rule of page.cssRules) {
      for (const [prop, value] of Object.entries(rule.properties)) {
        if (spacingProps.has(prop)) {
          // Split compound values like "8px 16px"
          const values = value.split(/\s+/);
          for (const v of values) {
            if (v === '0' || v === 'auto' || v === 'inherit' || v === 'initial') continue;
            const px = cssSizeToPx(v);
            if (px === 0 || isNaN(px)) continue;
            const existing = spacingMap.get(v);
            if (existing) existing.count++;
            else spacingMap.set(v, { count: 1, px });
          }
        }
      }
    }
  }

  return mapToScaleTokens(spacingMap, minUsage, 'space');
}

/**
 * Extract border radius tokens.
 */
export function extractBorderRadius(pages: RawPageData[], minUsage: number): ScaleToken[] {
  const radiusMap = new Map<string, { count: number; px: number }>();

  for (const page of pages) {
    for (const rule of page.cssRules) {
      for (const [prop, value] of Object.entries(rule.properties)) {
        if (prop.includes('border-radius')) {
          const values = value.split(/\s+/);
          for (const v of values) {
            if (v === '0' || v === 'inherit' || v === 'initial') continue;
            const px = cssSizeToPx(v);
            if (isNaN(px)) continue;
            const existing = radiusMap.get(v);
            if (existing) existing.count++;
            else radiusMap.set(v, { count: 1, px });
          }
        }
      }
    }
  }

  return mapToScaleTokens(radiusMap, minUsage, 'radius');
}

/**
 * Extract shadow tokens.
 */
export function extractShadows(pages: RawPageData[], minUsage: number): ShadowToken[] {
  const shadowMap = new Map<string, number>();

  for (const page of pages) {
    for (const rule of page.cssRules) {
      for (const [prop, value] of Object.entries(rule.properties)) {
        if (prop === 'box-shadow' || prop === 'text-shadow') {
          if (value === 'none' || value === 'inherit') continue;
          shadowMap.set(value, (shadowMap.get(value) ?? 0) + 1);
        }
      }
    }
  }

  const SHADOW_SIZES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

  return Array.from(shadowMap.entries())
    .filter(([, count]) => count >= minUsage)
    .sort((a, b) => {
      // Sort by shadow "size" (rough estimate from blur radius)
      const aBlur = estimateShadowSize(a[0]);
      const bBlur = estimateShadowSize(b[0]);
      return aBlur - bBlur;
    })
    .map(([raw, count], i) => ({
      name: SHADOW_SIZES[i] ?? `shadow-${i + 1}`,
      raw,
      usageCount: count,
    }));
}

/**
 * Extract breakpoint tokens from media queries.
 */
export function extractBreakpoints(pages: RawPageData[]): BreakpointToken[] {
  const breakpointMap = new Map<string, { value: string; px: number; type: 'min-width' | 'max-width' }>();

  for (const page of pages) {
    for (const mq of page.mediaQueries) {
      const minMatch = mq.query.match(/min-width:\s*([\d.]+(?:px|em|rem))/);
      const maxMatch = mq.query.match(/max-width:\s*([\d.]+(?:px|em|rem))/);

      if (minMatch?.[1]) {
        const px = cssSizeToPx(minMatch[1]);
        breakpointMap.set(`min-${px}`, { value: minMatch[1], px, type: 'min-width' });
      }
      if (maxMatch?.[1]) {
        const px = cssSizeToPx(maxMatch[1]);
        breakpointMap.set(`max-${px}`, { value: maxMatch[1], px, type: 'max-width' });
      }
    }
  }

  // Map to Tailwind-compatible names
  const TAILWIND_BREAKPOINTS: Record<number, string> = {
    640: 'sm', 768: 'md', 1024: 'lg', 1280: 'xl', 1536: '2xl',
  };

  return Array.from(breakpointMap.values())
    .sort((a, b) => a.px - b.px)
    .map((bp, i) => ({
      name: TAILWIND_BREAKPOINTS[bp.px] ?? `bp-${i + 1}`,
      value: bp.value,
      numericPx: bp.px,
      type: bp.type,
    }));
}

/**
 * Extract z-index values.
 */
export function extractZIndex(pages: RawPageData[]): number[] {
  const zSet = new Set<number>();

  for (const page of pages) {
    for (const rule of page.cssRules) {
      if (rule.properties['z-index']) {
        const z = parseInt(rule.properties['z-index'], 10);
        if (!isNaN(z)) zSet.add(z);
      }
    }
  }

  return Array.from(zSet).sort((a, b) => a - b);
}

/**
 * Extract transition tokens.
 */
export function extractTransitions(pages: RawPageData[], minUsage: number): TransitionToken[] {
  const transitionMap = new Map<string, { duration: string; timing: string; property: string; count: number }>();

  for (const page of pages) {
    for (const rule of page.cssRules) {
      const props = rule.properties;
      if (props['transition']) {
        const raw = props['transition'];
        if (raw === 'none' || raw === 'inherit') continue;
        const existing = transitionMap.get(raw);
        if (existing) {
          existing.count++;
        } else {
          // Parse "property duration timing-function"
          const parts = raw.split(/\s+/);
          transitionMap.set(raw, {
            property: parts[0] ?? 'all',
            duration: parts[1] ?? '0s',
            timing: parts[2] ?? 'ease',
            count: 1,
          });
        }
      }

      if (props['transition-duration'] && props['transition-duration'] !== '0s') {
        const key = `${props['transition-property'] ?? 'all'} ${props['transition-duration']} ${props['transition-timing-function'] ?? 'ease'}`;
        const existing = transitionMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          transitionMap.set(key, {
            property: props['transition-property'] ?? 'all',
            duration: props['transition-duration'],
            timing: props['transition-timing-function'] ?? 'ease',
            count: 1,
          });
        }
      }
    }
  }

  return Array.from(transitionMap.entries())
    .filter(([, data]) => data.count >= minUsage)
    .map(([raw, data], i) => ({
      name: `transition-${i + 1}`,
      duration: data.duration,
      timingFunction: data.timing,
      property: data.property,
      raw,
      usageCount: data.count,
    }));
}

/**
 * Detect CSS framework from class names.
 */
export function detectFramework(pages: RawPageData[]): DetectedFramework {
  const allClasses = new Set<string>();
  for (const page of pages) {
    for (const cls of page.classNames) {
      allClasses.add(cls);
    }
  }

  const classes = Array.from(allClasses);

  // Tailwind detection
  const twPatterns = /^(text-|bg-|flex|grid|p-|m-|w-|h-|rounded|border|shadow|space-|gap-|items-|justify-)/;
  const twCount = classes.filter((c) => twPatterns.test(c)).length;
  if (twCount > 20) return 'tailwind';

  // Bootstrap detection
  const bsPatterns = /^(col-|row|btn-|nav-|navbar|modal|card|container|form-)/;
  const bsCount = classes.filter((c) => bsPatterns.test(c)).length;
  if (bsCount > 10) return 'bootstrap';

  // MUI detection
  if (classes.some((c) => c.startsWith('Mui') || c.startsWith('css-'))) return 'mui';

  // Chakra UI detection
  if (classes.some((c) => c.startsWith('chakra-'))) return 'chakra';

  // Mantine detection
  if (classes.some((c) => c.startsWith('mantine-'))) return 'mantine';

  // Ant Design detection
  if (classes.some((c) => c.startsWith('ant-'))) return 'antd';

  // Bulma detection
  if (classes.some((c) => ['is-primary', 'is-info', 'is-success', 'columns', 'column'].includes(c))) return 'bulma';

  return 'unknown';
}

/**
 * Detect component patterns from CSS rules.
 */
export function extractComponents(pages: RawPageData[], minUsage: number): ComponentToken[] {
  const componentMap = new Map<string, {
    selectors: Set<string>;
    rules: Map<string, Record<string, string>>;
    count: number;
  }>();

  // Component detection patterns
  const COMPONENT_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /\.btn|\.button/i, name: 'button' },
    { pattern: /\.card/i, name: 'card' },
    { pattern: /\.nav|\.navbar/i, name: 'nav' },
    { pattern: /\.modal|\.dialog/i, name: 'modal' },
    { pattern: /\.header/i, name: 'header' },
    { pattern: /\.footer/i, name: 'footer' },
    { pattern: /\.sidebar/i, name: 'sidebar' },
    { pattern: /\.badge|\.tag|\.chip/i, name: 'badge' },
    { pattern: /\.alert|\.toast|\.notification/i, name: 'alert' },
    { pattern: /\.dropdown|\.menu/i, name: 'dropdown' },
    { pattern: /\.tab/i, name: 'tab' },
    { pattern: /\.accordion|\.collapse/i, name: 'accordion' },
    { pattern: /\.input|\.form-control/i, name: 'input' },
    { pattern: /\.avatar/i, name: 'avatar' },
    { pattern: /\.tooltip|\.popover/i, name: 'tooltip' },
    { pattern: /\.breadcrumb/i, name: 'breadcrumb' },
    { pattern: /\.pagination/i, name: 'pagination' },
    { pattern: /\.progress/i, name: 'progress' },
    { pattern: /\.spinner|\.loader/i, name: 'spinner' },
    { pattern: /\.table/i, name: 'table' },
    { pattern: /\.list/i, name: 'list' },
    { pattern: /\.hero/i, name: 'hero' },
  ];

  for (const page of pages) {
    for (const rule of page.cssRules) {
      for (const { pattern, name } of COMPONENT_PATTERNS) {
        if (pattern.test(rule.selector)) {
          const existing = componentMap.get(name);
          if (existing) {
            existing.selectors.add(rule.selector);
            existing.rules.set(rule.selector, rule.properties);
            existing.count++;
          } else {
            const rules = new Map<string, Record<string, string>>();
            rules.set(rule.selector, rule.properties);
            componentMap.set(name, {
              selectors: new Set([rule.selector]),
              rules,
              count: 1,
            });
          }
        }
      }
    }
  }

  return Array.from(componentMap.entries())
    .filter(([, data]) => data.count >= minUsage)
    .map(([name, data]) => {
      // Build CSS snippet
      let css = '';
      for (const [selector, props] of data.rules) {
        css += `${selector} {\n`;
        for (const [prop, value] of Object.entries(props)) {
          css += `  ${prop}: ${value};\n`;
        }
        css += '}\n\n';
      }

      // Extract used tokens
      const colors = new Set<string>();
      const fonts = new Set<string>();
      const spacing = new Set<string>();

      for (const [, props] of data.rules) {
        for (const [prop, value] of Object.entries(props)) {
          if (COLOR_PROPERTIES.has(prop)) colors.add(value);
          if (prop === 'font-family') fonts.add(value);
          if (prop.startsWith('margin') || prop.startsWith('padding') || prop === 'gap') {
            spacing.add(value);
          }
        }
      }

      return {
        name,
        selectors: Array.from(data.selectors),
        css: css.trim(),
        instanceCount: data.count,
        tokens: {
          colors: Array.from(colors),
          fonts: Array.from(fonts),
          spacing: Array.from(spacing),
        },
      };
    })
    .sort((a, b) => b.instanceCount - a.instanceCount);
}

// ─── Helper Functions ───────────────────────────────────────────────────────

/** Convert CSS size value to pixels */
export function cssSizeToPx(value: string): number {
  const num = parseFloat(value);
  if (isNaN(num)) return 0;

  if (value.endsWith('px')) return num;
  if (value.endsWith('rem')) return num * 16;
  if (value.endsWith('em')) return num * 16;
  if (value.endsWith('pt')) return num * 1.333;
  if (value.endsWith('vw') || value.endsWith('vh')) return num * 10; // rough estimate
  if (value.endsWith('%')) return 0; // can't convert percentages

  // Unitless (could be a line-height or z-index)
  return num;
}

/** Convert pixel value to rem */
export function pxToRem(px: number): string {
  const value = px / 16;
  return `${parseFloat(value.toFixed(3))}rem`;
}

function mapToScaleTokens(
  map: Map<string, { count: number; px: number }>,
  minUsage: number,
  prefix: string,
): ScaleToken[] {
  const SIZE_NAMES = ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'];

  const filtered = Array.from(map.entries())
    .filter(([, data]) => data.count >= minUsage && data.px > 0)
    .sort((a, b) => a[1].px - b[1].px);

  return filtered.map(([value, data], i) => ({
    name: i < SIZE_NAMES.length ? `${prefix}-${SIZE_NAMES[i]}` : `${prefix}-${i + 1}`,
    value,
    numericPx: data.px,
    usageCount: data.count,
  }));
}

function cssVarToName(varName: string): string {
  return varName
    .replace(/^--/, '')
    .replace(/[-_]+/g, '-')
    .replace(/^(color|clr|c)-?/, '')
    .trim() || varName.replace(/^--/, '');
}

function generateColorName(color: ColorValue, index: number): string {
  const { h, s, l } = color.hsl;

  // Very low saturation = gray scale
  if (s < 10) {
    if (l > 95) return `white`;
    if (l < 5) return `black`;
    const grayLevel = Math.round(l / 10) * 100;
    return `gray-${grayLevel}`;
  }

  // Map hue to color name
  const hueNames: Array<[number, string]> = [
    [15, 'red'],
    [45, 'orange'],
    [65, 'yellow'],
    [160, 'green'],
    [200, 'cyan'],
    [250, 'blue'],
    [290, 'purple'],
    [340, 'pink'],
    [360, 'red'],
  ];

  let hueName = 'color';
  for (const [maxHue, name] of hueNames) {
    if (h <= maxHue) {
      hueName = name;
      break;
    }
  }

  // Add lightness qualifier
  const lightLevel = Math.round(l / 10) * 100;

  return `${hueName}-${lightLevel || index + 1}`;
}

function detectFontCategory(stack: string[]): FontFamilyToken['category'] {
  const joined = stack.join(' ').toLowerCase();
  if (/sans-serif|system-ui|helvetica|arial|inter|roboto|open\s?sans|lato|nunito|poppins|segoe|sf\s?pro/.test(joined)) return 'sans-serif';
  if (/serif|georgia|times|garamond|palatino|cambria|merriweather|playfair/.test(joined)) return 'serif';
  if (/mono|monospace|courier|consolas|fira\s?code|jetbrains|source\s?code|menlo/.test(joined)) return 'monospace';
  if (/cursive|brush|handwriting|script|dancing|caveat|pacifico/.test(joined)) return 'handwriting';
  if (/fantasy|display|impact|oswald|bebas/.test(joined)) return 'display';
  return 'unknown';
}

function parseFontWeight(value: string): number {
  const num = parseInt(value, 10);
  if (!isNaN(num)) return num;

  const map: Record<string, number> = {
    thin: 100, hairline: 100,
    extralight: 200, ultralight: 200,
    light: 300,
    normal: 400, regular: 400,
    medium: 500,
    semibold: 600, demibold: 600,
    bold: 700,
    extrabold: 800, ultrabold: 800,
    black: 900, heavy: 900,
  };

  return map[value.toLowerCase()] ?? 400;
}

function extractTextStyles(pages: RawPageData[]): TextStyleToken[] {
  const styleMap = new Map<string, TextStyleToken>();

  const TAG_NAMES: Record<string, string> = {
    h1: 'heading-1', h2: 'heading-2', h3: 'heading-3',
    h4: 'heading-4', h5: 'heading-5', h6: 'heading-6',
    p: 'body', a: 'link', button: 'button', label: 'label',
    code: 'code', pre: 'pre',
  };

  for (const page of pages) {
    for (const cs of page.computedStyles) {
      const name = TAG_NAMES[cs.tagName];
      if (!name) continue;

      const existing = styleMap.get(name);
      if (existing) {
        if (!existing.elements.includes(cs.tagName)) {
          existing.elements.push(cs.tagName);
        }
        continue;
      }

      styleMap.set(name, {
        name,
        fontFamily: cs.styles['font-family'] ?? 'inherit',
        fontSize: cs.styles['font-size'] ?? 'inherit',
        fontWeight: parseFontWeight(cs.styles['font-weight'] ?? '400'),
        lineHeight: cs.styles['line-height'] ?? 'normal',
        letterSpacing: cs.styles['letter-spacing'] ?? 'normal',
        textTransform: cs.styles['text-transform'],
        elements: [cs.tagName],
      });
    }
  }

  return Array.from(styleMap.values());
}

function estimateShadowSize(shadow: string): number {
  // Extract blur radius from box-shadow value
  const parts = shadow.split(/\s+/);
  // box-shadow: offset-x offset-y blur-radius spread-radius color
  const blurIndex = parts.findIndex((p) => /^\d/.test(p));
  const blurPart = blurIndex >= 0 ? parts[blurIndex + 2] : undefined;
  if (blurPart) {
    return parseFloat(blurPart) || 0;
  }
  return 0;
}

// ─── Named Colors (common subset) ──────────────────────────────────────────

const NAMED_COLORS: Record<string, string> = {
  black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000',
  blue: '#0000ff', yellow: '#ffff00', cyan: '#00ffff', magenta: '#ff00ff',
  orange: '#ffa500', purple: '#800080', pink: '#ffc0cb', gray: '#808080',
  grey: '#808080', silver: '#c0c0c0', maroon: '#800000', navy: '#000080',
  olive: '#808000', teal: '#008080', aqua: '#00ffff', lime: '#00ff00',
  fuchsia: '#ff00ff', darkgray: '#a9a9a9', darkgrey: '#a9a9a9',
  lightgray: '#d3d3d3', lightgrey: '#d3d3d3', coral: '#ff7f50',
  tomato: '#ff6347', gold: '#ffd700', indigo: '#4b0082',
  violet: '#ee82ee', crimson: '#dc143c', khaki: '#f0e68c',
  salmon: '#fa8072', turquoise: '#40e0d0', plum: '#dda0dd',
  orchid: '#da70d6', sienna: '#a0522d', peru: '#cd853f',
  chocolate: '#d2691e', tan: '#d2b48c', beige: '#f5f5dc',
  ivory: '#fffff0', linen: '#faf0e6', lavender: '#e6e6fa',
  wheat: '#f5deb3', aliceblue: '#f0f8ff', antiquewhite: '#faebd7',
  azure: '#f0ffff', bisque: '#ffe4c4', blanchedalmond: '#ffebcd',
  cornsilk: '#fff8dc', floralwhite: '#fffaf0', ghostwhite: '#f8f8ff',
  honeydew: '#f0fff0', lemonchiffon: '#fffacd', mintcream: '#f5fffa',
  mistyrose: '#ffe4e1', moccasin: '#ffe4b5', oldlace: '#fdf5e6',
  papayawhip: '#ffefd5', seashell: '#fff5ee', snow: '#fffafa',
  whitesmoke: '#f5f5f5', cornflowerblue: '#6495ed', darkblue: '#00008b',
  darkcyan: '#008b8b', darkgoldenrod: '#b8860b', darkgreen: '#006400',
  darkkhaki: '#bdb76b', darkmagenta: '#8b008b', darkolivegreen: '#556b2f',
  darkorange: '#ff8c00', darkorchid: '#9932cc', darkred: '#8b0000',
  darksalmon: '#e9967a', darkseagreen: '#8fbc8f', darkslateblue: '#483d8b',
  darkslategray: '#2f4f4f', darkslategrey: '#2f4f4f', darkturquoise: '#00ced1',
  darkviolet: '#9400d3', deeppink: '#ff1493', deepskyblue: '#00bfff',
  dimgray: '#696969', dimgrey: '#696969', dodgerblue: '#1e90ff',
  firebrick: '#b22222', forestgreen: '#228b22', gainsboro: '#dcdcdc',
  goldenrod: '#daa520', greenyellow: '#adff2f', hotpink: '#ff69b4',
  indianred: '#cd5c5c', lawngreen: '#7cfc00', lightblue: '#add8e6',
  lightcoral: '#f08080', lightcyan: '#e0ffff', lightgreen: '#90ee90',
  lightpink: '#ffb6c1', lightsalmon: '#ffa07a', lightseagreen: '#20b2aa',
  lightskyblue: '#87cefa', lightslategray: '#778899', lightslategrey: '#778899',
  lightsteelblue: '#b0c4de', lightyellow: '#ffffe0', limegreen: '#32cd32',
  mediumaquamarine: '#66cdaa', mediumblue: '#0000cd', mediumorchid: '#ba55d3',
  mediumpurple: '#9370db', mediumseagreen: '#3cb371', mediumslateblue: '#7b68ee',
  mediumspringgreen: '#00fa9a', mediumturquoise: '#48d1cc', mediumvioletred: '#c71585',
  midnightblue: '#191970', navajowhite: '#ffdead', olivedrab: '#6b8e23',
  orangered: '#ff4500', palegoldenrod: '#eee8aa', palegreen: '#98fb98',
  paleturquoise: '#afeeee', palevioletred: '#db7093', peachpuff: '#ffdab9',
  powderblue: '#b0e0e6', rosybrown: '#bc8f8f', royalblue: '#4169e1',
  saddlebrown: '#8b4513', sandybrown: '#f4a460', seagreen: '#2e8b57',
  skyblue: '#87ceeb', slateblue: '#6a5acd', slategray: '#708090',
  slategrey: '#708090', springgreen: '#00ff7f', steelblue: '#4682b4',
  thistle: '#d8bfd8', yellowgreen: '#9acd32',
};
