/**
 * Design System Analyzer — transforms raw page data into a normalized,
 * structured DesignSystem with named tokens, grouped colors, and semantic mapping.
 */

import type {
  RawPageData,
  DesignSystem,
  ColorToken,
  ColorGroup,
  SemanticColors,
  StylepeekConfig,
} from '../types/index.js';

import {
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
  colorDistance,
  extractFontAssets,
  extractImageAssets,
  extractIconAssets,
} from '../extractor/index.js';

/**
 * Analyze raw page data and produce a complete DesignSystem.
 *
 * @param pages - Raw page data from crawler
 * @param url - Original crawl URL
 * @param config - Extraction configuration
 * @param startTime - Crawl start time for duration calculation
 * @returns A complete DesignSystem object
 */
export function analyze(
  pages: RawPageData[],
  url: string,
  config?: StylepeekConfig,
  startTime?: number,
): DesignSystem {
  const minUsage = config?.extract?.minUsage ?? 2;
  const doGroupColors = config?.extract?.groupSimilarColors ?? true;
  const colorThreshold = config?.extract?.colorSimilarityThreshold ?? 5;
  const doDetectComponents = config?.extract?.detectComponents ?? true;

  // Extract all token categories
  const palette = extractColors(pages, minUsage);
  const gradients = extractGradients(pages);
  const typography = extractTypography(pages, minUsage);
  const spacing = extractSpacing(pages, minUsage);
  const borderRadius = extractBorderRadius(pages, minUsage);
  const shadows = extractShadows(pages, minUsage);
  const breakpoints = extractBreakpoints(pages);
  const zIndex = extractZIndex(pages);
  const transitions = extractTransitions(pages, minUsage);
  const components = doDetectComponents ? extractComponents(pages, minUsage) : [];
  const framework = detectFramework(pages);

  // Group similar colors
  const groups = doGroupColors ? groupColors(palette, colorThreshold) : [];

  // Detect semantic colors
  const semantic = detectSemanticColors(palette, pages);

  // Extract asset metadata
  const fonts = extractFontAssets(pages);
  const images = extractImageAssets(pages);
  const icons = extractIconAssets(pages);

  // Count total rules and stylesheets
  let totalRules = 0;
  const stylesheets = new Set<string>();
  for (const page of pages) {
    totalRules += page.cssRules.length;
    for (const rule of page.cssRules) {
      stylesheets.add(rule.source);
    }
  }

  const ds: DesignSystem = {
    meta: {
      url,
      crawledAt: new Date().toISOString(),
      pageCount: pages.length,
      pages: pages.map((p) => p.url),
      framework,
      totalRules,
      totalStylesheets: stylesheets.size,
      duration: startTime ? Date.now() - startTime : 0,
    },
    colors: {
      palette,
      groups,
      semantic,
      gradients,
    },
    typography,
    spacing,
    borderRadius,
    shadows,
    breakpoints,
    zIndex,
    transitions,
    components,
    assets: {
      fonts,
      images,
      icons,
    },
  };

  return ds;
}

/**
 * Group colors by perceptual similarity using weighted RGB distance.
 */
function groupColors(palette: ColorToken[], threshold: number): ColorGroup[] {
  const groups: ColorGroup[] = [];
  const assigned = new Set<string>();

  // Pre-defined hue groups
  const HUE_GROUPS: Array<{ name: string; hueMin: number; hueMax: number }> = [
    { name: 'reds', hueMin: 0, hueMax: 15 },
    { name: 'oranges', hueMin: 15, hueMax: 45 },
    { name: 'yellows', hueMin: 45, hueMax: 65 },
    { name: 'greens', hueMin: 65, hueMax: 170 },
    { name: 'cyans', hueMin: 170, hueMax: 200 },
    { name: 'blues', hueMin: 200, hueMax: 260 },
    { name: 'purples', hueMin: 260, hueMax: 300 },
    { name: 'pinks', hueMin: 300, hueMax: 345 },
    { name: 'reds', hueMin: 345, hueMax: 360 },
  ];

  // First, separate grays (low saturation)
  const grays: ColorToken[] = [];
  const chromatic: ColorToken[] = [];

  for (const color of palette) {
    if (color.value.hsl.s < 10) {
      grays.push(color);
      assigned.add(color.value.hex);
    } else {
      chromatic.push(color);
    }
  }

  if (grays.length > 0) {
    grays.sort((a, b) => a.value.hsl.l - b.value.hsl.l);
    groups.push({ name: 'grays', colors: grays });
  }

  // Group chromatic colors by hue
  for (const hGroup of HUE_GROUPS) {
    const matching = chromatic.filter((c) => {
      if (assigned.has(c.value.hex)) return false;
      const h = c.value.hsl.h;
      return h >= hGroup.hueMin && h < hGroup.hueMax;
    });

    if (matching.length > 0) {
      matching.sort((a, b) => a.value.hsl.l - b.value.hsl.l);
      groups.push({ name: hGroup.name, colors: matching });
      for (const c of matching) assigned.add(c.value.hex);
    }
  }

  // Further merge groups that are perceptually similar
  if (threshold > 0) {
    for (const group of groups) {
      // Deduplicate very similar colors within groups
      const deduped: ColorToken[] = [];
      for (const color of group.colors) {
        const isDuplicate = deduped.some(
          (existing) => colorDistance(existing.value, color.value) < threshold,
        );
        if (!isDuplicate) {
          deduped.push(color);
        } else {
          // Merge usage counts into the existing similar color
          const similar = deduped.find(
            (existing) => colorDistance(existing.value, color.value) < threshold,
          );
          if (similar) {
            similar.usageCount += color.usageCount;
          }
        }
      }
      group.colors = deduped;
    }
  }

  // Remove empty groups
  return groups.filter((g) => g.colors.length > 0);
}

/**
 * Attempt to detect semantic color roles from CSS variable names and usage context.
 */
function detectSemanticColors(palette: ColorToken[], pages: RawPageData[]): SemanticColors {
  const semantic: SemanticColors = {};

  // Strategy 1: Match by CSS variable names
  for (const color of palette) {
    if (!color.cssVariable) continue;
    const varName = color.cssVariable.toLowerCase();

    if (!semantic.primary && /primary/.test(varName)) semantic.primary = color;
    if (!semantic.secondary && /secondary/.test(varName)) semantic.secondary = color;
    if (!semantic.accent && /accent/.test(varName)) semantic.accent = color;
    if (!semantic.background && /(background|bg-default)/.test(varName)) semantic.background = color;
    if (!semantic.foreground && /(foreground|text-default|fg)/.test(varName)) semantic.foreground = color;
    if (!semantic.muted && /muted/.test(varName)) semantic.muted = color;
    if (!semantic.danger && /(danger|error|destructive)/.test(varName)) semantic.danger = color;
    if (!semantic.warning && /warning/.test(varName)) semantic.warning = color;
    if (!semantic.success && /success/.test(varName)) semantic.success = color;
    if (!semantic.info && /info/.test(varName)) semantic.info = color;
  }

  // Strategy 2: Heuristic — most used color on buttons/links = primary
  if (!semantic.primary) {
    const buttonColors = new Map<string, { token: ColorToken; count: number }>();

    for (const page of pages) {
      for (const rule of page.cssRules) {
        if (/button|btn|\.cta|\.primary/i.test(rule.selector)) {
          const bgColor = rule.properties['background-color'];
          if (bgColor) {
            const match = palette.find((c) => c.raw === bgColor);
            if (match) {
              const key = match.value.hex;
              const existing = buttonColors.get(key);
              if (existing) existing.count++;
              else buttonColors.set(key, { token: match, count: 1 });
            }
          }
        }
      }
    }

    const topButton = Array.from(buttonColors.values()).sort((a, b) => b.count - a.count)[0];
    if (topButton) semantic.primary = topButton.token;
  }

  // Strategy 3: Guess danger/success/warning from hue
  if (!semantic.danger) {
    semantic.danger = palette.find(
      (c) => c.value.hsl.s > 50 && (c.value.hsl.h < 15 || c.value.hsl.h > 345) && c.usageCount > 1,
    );
  }
  if (!semantic.success) {
    semantic.success = palette.find(
      (c) => c.value.hsl.s > 50 && c.value.hsl.h > 100 && c.value.hsl.h < 160 && c.usageCount > 1,
    );
  }
  if (!semantic.warning) {
    semantic.warning = palette.find(
      (c) => c.value.hsl.s > 50 && c.value.hsl.h > 30 && c.value.hsl.h < 55 && c.usageCount > 1,
    );
  }
  if (!semantic.info) {
    semantic.info = palette.find(
      (c) => c.value.hsl.s > 50 && c.value.hsl.h > 190 && c.value.hsl.h < 240 && c.usageCount > 1,
    );
  }

  return semantic;
}
