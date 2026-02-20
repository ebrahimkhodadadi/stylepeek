/**
 * In-page extraction script that runs inside the browser context.
 * This is evaluated via Playwright's page.evaluate() or injected as a content script.
 * It collects all CSS data, computed styles, assets, and class names from a page.
 */

/** Serializable version of RawPageData for transport from browser to Node */
export interface SerializablePageData {
  url: string;
  cssRules: Array<{
    selector: string;
    properties: Record<string, string>;
    media?: string;
    source: string;
  }>;
  customProperties: Record<string, string>;
  computedStyles: Array<{
    element: string;
    tagName: string;
    classList: string[];
    styles: Record<string, string>;
  }>;
  fontFaces: Array<{
    family: string;
    src: string;
    weight?: string;
    style?: string;
    display?: string;
  }>;
  imageUrls: string[];
  svgElements: Array<{
    html: string;
    id?: string;
    viewBox?: string;
    classList: string[];
  }>;
  resourceUrls: string[];
  mediaQueries: Array<{
    query: string;
    rules: Array<{
      selector: string;
      properties: Record<string, string>;
      source: string;
    }>;
  }>;
  classNames: string[];
}

/**
 * Extract all design-relevant data from the current page.
 * This function runs entirely in the browser context.
 */
export function extractPageData(): SerializablePageData {
  const COLOR_PROPS = [
    'color', 'background-color', 'border-color', 'border-top-color',
    'border-right-color', 'border-bottom-color', 'border-left-color',
    'outline-color', 'text-decoration-color', 'fill', 'stroke',
    'box-shadow', 'text-shadow', 'background-image', 'background',
    'caret-color', 'column-rule-color', 'flood-color', 'lighting-color',
    'stop-color',
  ];

  const TYPOGRAPHY_PROPS = [
    'font-family', 'font-size', 'font-weight', 'font-style',
    'line-height', 'letter-spacing', 'word-spacing', 'text-transform',
    'text-decoration',
  ];

  const SPACING_PROPS = [
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'gap', 'row-gap', 'column-gap',
    'top', 'right', 'bottom', 'left',
  ];

  const LAYOUT_PROPS = [
    'border-radius', 'border-top-left-radius', 'border-top-right-radius',
    'border-bottom-left-radius', 'border-bottom-right-radius',
    'border-width', 'border-style',
    'z-index', 'opacity',
    'transition', 'transition-duration', 'transition-timing-function',
    'transition-property', 'animation', 'animation-duration',
    'width', 'height', 'max-width', 'max-height', 'min-width', 'min-height',
  ];

  const ALL_INTERESTING_PROPS = new Set([
    ...COLOR_PROPS, ...TYPOGRAPHY_PROPS, ...SPACING_PROPS, ...LAYOUT_PROPS,
  ]);

  const cssRules: SerializablePageData['cssRules'] = [];
  const customProperties: Record<string, string> = {};
  const fontFaces: SerializablePageData['fontFaces'] = [];
  const mediaQueries: SerializablePageData['mediaQueries'] = [];
  const classNames = new Set<string>();

  // ─── Extract from document.styleSheets ────────────────────────────

  function processRule(rule: CSSRule, source: string, mediaQuery?: string): void {
    if (rule instanceof CSSStyleRule) {
      const selector = rule.selectorText;
      const style = rule.style;
      const properties: Record<string, string> = {};

      for (let i = 0; i < style.length; i++) {
        const prop = style[i]!;
        if (ALL_INTERESTING_PROPS.has(prop) || prop.startsWith('--')) {
          const value = style.getPropertyValue(prop).trim();
          if (value) {
            properties[prop] = value;

            // Collect custom properties
            if (prop.startsWith('--')) {
              customProperties[prop] = value;
            }
          }
        }
      }

      if (Object.keys(properties).length > 0) {
        cssRules.push({
          selector,
          properties,
          media: mediaQuery,
          source,
        });
      }
    } else if (rule instanceof CSSMediaRule) {
      const mqRules: SerializablePageData['mediaQueries'][0]['rules'] = [];
      for (let i = 0; i < rule.cssRules.length; i++) {
        const innerRule = rule.cssRules[i]!;
        processRule(innerRule, source, rule.conditionText);

        if (innerRule instanceof CSSStyleRule) {
          const style = innerRule.style;
          const properties: Record<string, string> = {};
          for (let j = 0; j < style.length; j++) {
            const prop = style[j]!;
            const value = style.getPropertyValue(prop).trim();
            if (value) properties[prop] = value;
          }
          if (Object.keys(properties).length > 0) {
            mqRules.push({ selector: innerRule.selectorText, properties, source });
          }
        }
      }
      if (mqRules.length > 0) {
        mediaQueries.push({ query: rule.conditionText, rules: mqRules });
      }
    } else if (rule instanceof CSSFontFaceRule) {
      const style = rule.style;
      const family = style.getPropertyValue('font-family').replace(/['"]/g, '').trim();
      const src = style.getPropertyValue('src');
      if (family && src) {
        fontFaces.push({
          family,
          src,
          weight: style.getPropertyValue('font-weight') || undefined,
          style: style.getPropertyValue('font-style') || undefined,
          display: style.getPropertyValue('font-display') || undefined,
        });
      }
    }
  }

  try {
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i]!;
      const source = sheet.href || 'inline';
      try {
        const rules = sheet.cssRules;
        for (let j = 0; j < rules.length; j++) {
          processRule(rules[j]!, source);
        }
      } catch {
        // CORS-blocked stylesheet — skip
      }
    }
  } catch {
    // Stylesheet access error — skip
  }

  // ─── Extract inline styles ────────────────────────────────────────

  const allElements = document.querySelectorAll('[style]');
  allElements.forEach((el) => {
    const style = (el as HTMLElement).style;
    const properties: Record<string, string> = {};
    for (let i = 0; i < style.length; i++) {
      const prop = style[i]!;
      if (ALL_INTERESTING_PROPS.has(prop)) {
        const value = style.getPropertyValue(prop).trim();
        if (value) properties[prop] = value;
      }
    }
    if (Object.keys(properties).length > 0) {
      cssRules.push({
        selector: `[inline] ${el.tagName.toLowerCase()}`,
        properties,
        source: 'inline',
      });
    }
  });

  // ─── Extract computed styles for key elements ──────────────────────

  const KEY_ELEMENTS = [
    'body', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'a', 'button', 'input', 'label', 'code', 'pre',
    'nav', 'header', 'footer', 'main', 'section', 'article',
  ];

  const computedStyles: SerializablePageData['computedStyles'] = [];

  for (const tag of KEY_ELEMENTS) {
    const elements = document.querySelectorAll(tag);
    // Sample up to 3 of each element type
    const limit = Math.min(elements.length, 3);
    for (let i = 0; i < limit; i++) {
      const el = elements[i]! as HTMLElement;
      const computed = window.getComputedStyle(el);
      const styles: Record<string, string> = {};

      for (const prop of [...COLOR_PROPS, ...TYPOGRAPHY_PROPS, ...SPACING_PROPS, ...LAYOUT_PROPS]) {
        const value = computed.getPropertyValue(prop);
        if (value) styles[prop] = value;
      }

      computedStyles.push({
        element: el.outerHTML.slice(0, 200),
        tagName: tag,
        classList: Array.from(el.classList),
        styles,
      });
    }
  }

  // ─── Collect all class names for framework detection ───────────────

  document.querySelectorAll('[class]').forEach((el) => {
    el.classList.forEach((cls) => classNames.add(cls));
  });

  // ─── Collect images ────────────────────────────────────────────────

  const imageUrls = new Set<string>();

  document.querySelectorAll('img[src]').forEach((img) => {
    const src = (img as HTMLImageElement).src;
    if (src && !src.startsWith('data:')) imageUrls.add(src);
  });

  document.querySelectorAll('img[srcset]').forEach((img) => {
    const srcset = (img as HTMLImageElement).srcset;
    srcset.split(',').forEach((entry) => {
      const url = entry.trim().split(/\s+/)[0];
      if (url && !url.startsWith('data:')) imageUrls.add(url);
    });
  });

  document.querySelectorAll('source[srcset]').forEach((source) => {
    const srcset = (source as HTMLSourceElement).srcset;
    srcset.split(',').forEach((entry) => {
      const url = entry.trim().split(/\s+/)[0];
      if (url && !url.startsWith('data:')) imageUrls.add(url);
    });
  });

  // ─── Collect SVGs ──────────────────────────────────────────────────

  const svgElements: SerializablePageData['svgElements'] = [];

  document.querySelectorAll('svg').forEach((svg) => {
    const html = svg.outerHTML;
    if (html.length > 50000) return; // skip massive SVGs
    svgElements.push({
      html,
      id: svg.id || undefined,
      viewBox: svg.getAttribute('viewBox') || undefined,
      classList: Array.from(svg.classList),
    });
  });

  // ─── Collect resource URLs ─────────────────────────────────────────

  const resourceUrls = new Set<string>();

  document.querySelectorAll('link[href]').forEach((link) => {
    const href = (link as HTMLLinkElement).href;
    if (href) resourceUrls.add(href);
  });

  // Collect font links (Google Fonts, etc.)
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = (link as HTMLLinkElement).href;
    if (href) resourceUrls.add(href);
  });

  return {
    url: window.location.href,
    cssRules,
    customProperties,
    computedStyles,
    fontFaces,
    imageUrls: Array.from(imageUrls),
    svgElements,
    resourceUrls: Array.from(resourceUrls),
    mediaQueries,
    classNames: Array.from(classNames),
  };
}
