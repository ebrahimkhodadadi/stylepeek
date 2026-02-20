/**
 * Enhanced in-page extraction logic.
 * Extracts colors, typography, spacing, shadows, gradients, SVGs, images,
 * favicons, breakpoints, border-radius, and more.
 */
import type {
  ExtractedDesignData, ParsedColor, ColorGroup, SemanticColor, GradientInfo,
  FontInfo, TypeScaleEntry, TextStyle, SpacingValue, BreakpointInfo,
  BorderRadiusInfo, ShadowInfo, SvgIconInfo, ImageInfo, FontFaceInfo, FaviconInfo,
} from '../shared/messaging';
import { colorToFormats, getHueFamily, detectSemanticRole, parseColorToRgb } from '../shared/color-utils';
import { fontSizeToTailwind, spacingToTailwind, cssToTailwind } from '../shared/tailwind-map';

const COLOR_PROPS = new Set([
  'color', 'background-color', 'border-color', 'border-top-color',
  'border-right-color', 'border-bottom-color', 'border-left-color',
  'outline-color', 'text-decoration-color', 'fill', 'stroke',
]);

const COLOR_REGEX = /(#[0-9a-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/gi;
const GRADIENT_REGEX = /((?:linear|radial|conic)-gradient\([^)]+(?:\([^)]*\))*[^)]*\))/gi;

const TYPOGRAPHY_PROPS = ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-transform'] as const;

const SPACING_PROPS = new Set([
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'gap', 'row-gap', 'column-gap',
]);

export function extractPageData(): ExtractedDesignData {
  // ── Collect raw CSS data ──────────────────────────────
  const colorMap = new Map<string, { value: string; hex: string; rgb: string; hsl: string; property: string; count: number; selectors: string[] }>();
  const gradientMap = new Map<string, number>();
  const fontSizeMap = new Map<string, number>();
  const spacingMap = new Map<string, number>();
  const borderRadiusMap = new Map<string, number>();
  const shadowMap = new Map<string, number>();
  const customProperties: Record<string, string> = {};
  let cssRuleCount = 0;
  let stylesheetCount = 0;
  const fontFamilies = new Map<string, { weights: Set<string> }>();
  const classNames = new Set<string>();

  // Process stylesheets
  for (const sheet of Array.from(document.styleSheets)) {
    stylesheetCount++;
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule instanceof CSSStyleRule) {
          cssRuleCount++;
          processStyleRule(rule, colorMap, gradientMap, fontSizeMap, spacingMap, borderRadiusMap, shadowMap, customProperties, fontFamilies);
        }
      }
    } catch { /* CORS */ }
  }

  // Process computed styles of visible elements (chunked)
  const allElements = document.querySelectorAll('body *');
  const MAX_ELEMENTS = 500;
  const step = Math.max(1, Math.floor(allElements.length / MAX_ELEMENTS));
  for (let i = 0; i < allElements.length && i < MAX_ELEMENTS * step; i += step) {
    const el = allElements[i];
    if (!el) continue;
    const cs = getComputedStyle(el);
    // Colors from computed
    for (const prop of COLOR_PROPS) {
      const val = cs.getPropertyValue(prop);
      if (val && val !== 'rgba(0, 0, 0, 0)' && val !== 'transparent') {
        addColor(colorMap, val, prop, getSimpleSelector(el));
      }
    }
    // Classes
    for (const cls of Array.from(el.classList)) classNames.add(cls);
  }

  // ── Build parsed colors ───────────────────────────────
  const colors: ParsedColor[] = Array.from(colorMap.values())
    .sort((a, b) => b.count - a.count);

  // ── Group by hue ──────────────────────────────────────
  const groupMap = new Map<string, ParsedColor[]>();
  for (const c of colors) {
    const family = getHueFamily(c.hex);
    const arr = groupMap.get(family) ?? [];
    arr.push(c);
    groupMap.set(family, arr);
  }
  const colorGroups: ColorGroup[] = Array.from(groupMap.entries())
    .map(([name, cols]) => ({ name, colors: cols }))
    .sort((a, b) => b.colors.length - a.colors.length);

  // ── Semantic detection ────────────────────────────────
  const semanticColors: SemanticColor[] = [];
  const seenRoles = new Set<string>();
  for (const c of colors.slice(0, 50)) {
    const role = detectSemanticRole(c);
    if (role && !seenRoles.has(role)) {
      seenRoles.add(role);
      semanticColors.push({ role, color: c });
    }
  }

  // ── Gradients ─────────────────────────────────────────
  const gradients: GradientInfo[] = Array.from(gradientMap.entries())
    .map(([css, count]) => ({ css, count }))
    .sort((a, b) => b.count - a.count);

  // ── Fonts ─────────────────────────────────────────────
  const fonts: FontInfo[] = Array.from(fontFamilies.entries()).map(([family, info]) => ({
    family,
    source: detectFontSource(family),
    weights: Array.from(info.weights).sort(),
  }));

  // ── Type scale ────────────────────────────────────────
  const typeScale: TypeScaleEntry[] = Array.from(fontSizeMap.entries())
    .map(([size, count]) => {
      const px = parseFloat(size);
      return { size, rem: (px / 16).toFixed(3) + 'rem', tailwind: fontSizeToTailwind(px), count };
    })
    .sort((a, b) => parseFloat(a.size) - parseFloat(b.size));

  // ── Text styles ───────────────────────────────────────
  const textStyles: TextStyle[] = extractTextStyles();

  // ── Spacing ───────────────────────────────────────────
  const spacing: SpacingValue[] = Array.from(spacingMap.entries())
    .map(([px, count]) => {
      const val = parseFloat(px);
      return {
        px, rem: (val / 16).toFixed(3) + 'rem',
        tailwind: spacingToTailwind(val), count,
        group: classifySpacing(val),
      };
    })
    .sort((a, b) => parseFloat(a.px) - parseFloat(b.px));

  // ── Breakpoints from media queries ────────────────────
  const breakpoints: BreakpointInfo[] = extractBreakpoints();

  // ── Border radius ─────────────────────────────────────
  const borderRadius: BorderRadiusInfo[] = Array.from(borderRadiusMap.entries())
    .map(([value, count]) => ({ value, tailwind: cssToTailwind('border-radius', value) || 'rounded', count }))
    .sort((a, b) => b.count - a.count);

  // ── Shadows ───────────────────────────────────────────
  const shadows: ShadowInfo[] = Array.from(shadowMap.entries())
    .map(([value, count]) => ({ value, tailwind: cssToTailwind('box-shadow', value) || 'shadow', count }))
    .sort((a, b) => b.count - a.count);

  // ── SVG icons ─────────────────────────────────────────
  const icons: SvgIconInfo[] = [];
  document.querySelectorAll('svg').forEach((svg, i) => {
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0 || rect.width > 200 || rect.height > 200) return;
    icons.push({
      svg: svg.outerHTML,
      name: svg.getAttribute('aria-label') || svg.id || `icon-${i + 1}`,
      width: rect.width,
      height: rect.height,
      selector: getSimpleSelector(svg),
    });
  });

  // ── Images ────────────────────────────────────────────
  const images: ImageInfo[] = [];
  const seenUrls = new Set<string>();
  document.querySelectorAll('img[src]').forEach(img => {
    const el = img as HTMLImageElement;
    if (!el.src || el.src.startsWith('data:') || seenUrls.has(el.src)) return;
    seenUrls.add(el.src);
    images.push({
      url: el.src,
      alt: el.alt || undefined,
      width: el.naturalWidth || undefined,
      height: el.naturalHeight || undefined,
      format: el.src.split('.').pop()?.split('?')[0] || undefined,
    });
  });

  // ── Font faces ────────────────────────────────────────
  const fontFaces: FontFaceInfo[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule instanceof CSSFontFaceRule) {
          const src = rule.style.getPropertyValue('src');
          const urlMatch = src.match(/url\(["']?([^"')]+)/);
          fontFaces.push({
            family: rule.style.getPropertyValue('font-family').replace(/['"]/g, ''),
            weight: rule.style.getPropertyValue('font-weight') || '400',
            style: rule.style.getPropertyValue('font-style') || 'normal',
            src,
            format: src.match(/format\(["']?([^"')]+)/)?.[1],
            url: urlMatch?.[1],
          });
        }
      }
    } catch { /* CORS */ }
  }

  // ── Favicons ──────────────────────────────────────────
  const favicons: FaviconInfo[] = [];
  document.querySelectorAll('link[rel*="icon"]').forEach(link => {
    const el = link as HTMLLinkElement;
    if (el.href) {
      favicons.push({
        href: el.href,
        sizes: el.getAttribute('sizes') || '',
        type: el.type || '',
      });
    }
  });

  return {
    url: location.href,
    title: document.title,
    colors,
    colorGroups,
    semanticColors,
    gradients,
    fonts,
    typeScale,
    textStyles,
    spacing,
    breakpoints,
    borderRadius,
    shadows,
    icons,
    images,
    fontFaces,
    favicons,
    customProperties,
    cssRuleCount,
    stylesheetCount,
    classNames: Array.from(classNames),
  };
}

/* ── Helpers ────────────────────────────────────────────── */

function addColor(
  map: Map<string, ParsedColor>,
  value: string,
  property: string,
  selector: string,
) {
  const matches = value.match(COLOR_REGEX);
  if (!matches) return;
  for (const m of matches) {
    const formats = colorToFormats(m);
    if (!formats) continue;
    const key = formats.hex.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.count++;
      if (existing.selectors.length < 5 && !existing.selectors.includes(selector)) {
        existing.selectors.push(selector);
      }
    } else {
      map.set(key, { value: m, ...formats, property, count: 1, selectors: [selector] });
    }
  }
}

function processStyleRule(
  rule: CSSStyleRule,
  colorMap: Map<string, ParsedColor>,
  gradientMap: Map<string, number>,
  fontSizeMap: Map<string, number>,
  spacingMap: Map<string, number>,
  borderRadiusMap: Map<string, number>,
  shadowMap: Map<string, number>,
  customProperties: Record<string, string>,
  fontFamilies: Map<string, { weights: Set<string> }>,
) {
  const style = rule.style;
  for (let i = 0; i < style.length; i++) {
    const prop = style[i];
    if (!prop) continue;
    const val = style.getPropertyValue(prop).trim();
    if (!val) continue;

    if (prop.startsWith('--')) {
      customProperties[prop] = val;
      addColor(colorMap, val, 'custom-property', rule.selectorText);
      continue;
    }

    // Colors
    if (COLOR_PROPS.has(prop)) {
      addColor(colorMap, val, prop, rule.selectorText);
    }

    // Gradients from background/background-image
    if (prop === 'background' || prop === 'background-image') {
      const gMatches = val.match(GRADIENT_REGEX);
      if (gMatches) {
        for (const g of gMatches) {
          gradientMap.set(g, (gradientMap.get(g) || 0) + 1);
        }
      }
    }

    // Font size
    if (prop === 'font-size') {
      const px = parseFloat(val);
      if (!isNaN(px)) fontSizeMap.set(val, (fontSizeMap.get(val) || 0) + 1);
    }

    // Font family
    if (prop === 'font-family') {
      const primary = val.split(',')[0]?.replace(/['"]/g, '').trim();
      if (primary) {
        const entry = fontFamilies.get(primary) ?? { weights: new Set<string>() };
        fontFamilies.set(primary, entry);
      }
    }

    // Font weight
    if (prop === 'font-weight') {
      // Associate with the last font family if possible
      const ff = style.getPropertyValue('font-family');
      if (ff) {
        const primary = ff.split(',')[0]?.replace(/['"]/g, '').trim();
        if (primary) {
          const entry = fontFamilies.get(primary);
          if (entry) entry.weights.add(val);
        }
      }
    }

    // Spacing
    if (SPACING_PROPS.has(prop)) {
      const parts = val.split(/\s+/);
      for (const p of parts) {
        const px = parseFloat(p);
        if (!isNaN(px) && px > 0 && px < 500) {
          spacingMap.set(p, (spacingMap.get(p) || 0) + 1);
        }
      }
    }

    // Border radius
    if (prop === 'border-radius' || prop.startsWith('border-') && prop.endsWith('-radius')) {
      if (val !== '0px' && val !== '0') {
        borderRadiusMap.set(val, (borderRadiusMap.get(val) || 0) + 1);
      }
    }

    // Box shadow
    if (prop === 'box-shadow' && val !== 'none') {
      shadowMap.set(val, (shadowMap.get(val) || 0) + 1);
    }
  }
}

function getSimpleSelector(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const cls = el.classList.length > 0 ? '.' + Array.from(el.classList).slice(0, 2).join('.') : '';
  return `${tag}${id}${cls}`;
}

function detectFontSource(family: string): FontInfo['source'] {
  const links = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
  if (links.length > 0) {
    for (const link of Array.from(links)) {
      if ((link as HTMLLinkElement).href.includes(family.replace(/\s/g, '+'))) return 'google-fonts';
    }
  }
  const adobeLinks = document.querySelectorAll('link[href*="use.typekit.net"]');
  if (adobeLinks.length > 0) return 'adobe-fonts';
  const systemFonts = new Set(['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'monospace', 'serif', 'sans-serif', 'cursive']);
  if (systemFonts.has(family)) return 'system';
  return 'custom';
}

function extractTextStyles(): TextStyle[] {
  const styles: TextStyle[] = [];
  const selectors = [
    ['h1', 'Heading 1'], ['h2', 'Heading 2'], ['h3', 'Heading 3'],
    ['h4', 'Heading 4'], ['h5', 'Heading 5'], ['h6', 'Heading 6'],
    ['p', 'Body'], ['a', 'Link'], ['button', 'Button'],
    ['small', 'Caption'], ['code', 'Code'], ['label', 'Label'],
  ] as const;

  for (const [sel, name] of selectors) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const cs = getComputedStyle(el);
    styles.push({
      name,
      fontFamily: cs.fontFamily.split(',')[0]?.replace(/['"]/g, '').trim() || 'sans-serif',
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
    });
  }
  return styles;
}

function classifySpacing(px: number): SpacingValue['group'] {
  if (px <= 4) return 'xs';
  if (px <= 8) return 'sm';
  if (px <= 16) return 'md';
  if (px <= 32) return 'lg';
  if (px <= 64) return 'xl';
  return '2xl';
}

function extractBreakpoints(): BreakpointInfo[] {
  const bps = new Map<number, string>();
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule instanceof CSSMediaRule) {
          const match = rule.conditionText.match(/min-width:\s*([\d.]+)px/);
          if (match && match[1]) {
            const px = Math.round(parseFloat(match[1]));
            if (!bps.has(px)) bps.set(px, '');
          }
        }
      }
    } catch { /* CORS */ }
  }

  const twBps: Record<number, string> = { 640: 'sm', 768: 'md', 1024: 'lg', 1280: 'xl', 1536: '2xl' };
  return Array.from(bps.keys())
    .sort((a, b) => a - b)
    .map(px => ({
      name: twBps[px] || `${px}px`,
      px,
      tailwind: twBps[px] || `min-[${px}px]`,
    }));
}
