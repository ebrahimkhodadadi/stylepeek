/**
 * In-page extraction logic for the browser extension content script.
 * This is a streamlined version of the core extract-script, running
 * directly in the page context (no Playwright).
 */

export interface ExtractedPageData {
  url: string;
  title: string;
  cssRules: Array<{
    selector: string;
    properties: Record<string, string>;
  }>;
  customProperties: Record<string, string>;
  computedStyles: Array<{
    selector: string;
    styles: Record<string, string>;
  }>;
  fontFaces: Array<{
    family: string;
    weight: string;
    style: string;
    src: string;
  }>;
  images: string[];
  svgs: Array<{
    svg: string;
    selector: string;
    width: number;
    height: number;
  }>;
  classNames: string[];
}

const COLOR_PROPS = new Set([
  'color', 'background-color', 'border-color', 'border-top-color',
  'border-right-color', 'border-bottom-color', 'border-left-color',
  'outline-color', 'text-decoration-color', 'fill', 'stroke',
  'box-shadow', 'text-shadow', 'background',
]);

const TYPOGRAPHY_PROPS = new Set([
  'font-family', 'font-size', 'font-weight', 'font-style',
  'line-height', 'letter-spacing', 'text-transform', 'text-decoration',
]);

const SPACING_PROPS = new Set([
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'gap', 'row-gap', 'column-gap',
]);

const ALL_INTERESTING = new Set([...COLOR_PROPS, ...TYPOGRAPHY_PROPS, ...SPACING_PROPS,
  'border-radius', 'box-shadow', 'transition', 'z-index',
]);

export function extractPageData(): ExtractedPageData {
  const cssRules: ExtractedPageData['cssRules'] = [];
  const customProperties: Record<string, string> = {};

  // Extract from stylesheets
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule instanceof CSSStyleRule) {
          const props: Record<string, string> = {};
          const style = rule.style;

          for (let i = 0; i < style.length; i++) {
            const prop = style[i];
            if (!prop) continue;
            const val = style.getPropertyValue(prop).trim();
            if (!val) continue;

            if (prop.startsWith('--')) {
              customProperties[prop] = val;
            } else if (ALL_INTERESTING.has(prop)) {
              props[prop] = val;
            }
          }

          if (Object.keys(props).length > 0) {
            cssRules.push({ selector: rule.selectorText, properties: props });
          }
        }
      }
    } catch {
      // CORS blocked stylesheets
    }
  }

  // Computed styles for key elements
  const selectors = ['body', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'button', 'input', 'nav', 'header', 'footer'];
  const computedStyles: ExtractedPageData['computedStyles'] = [];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (!el) continue;

    const cs = getComputedStyle(el);
    const styles: Record<string, string> = {};

    for (const prop of ALL_INTERESTING) {
      const val = cs.getPropertyValue(prop);
      if (val) styles[prop] = val;
    }

    computedStyles.push({ selector: sel, styles });
  }

  // Font faces
  const fontFaces: ExtractedPageData['fontFaces'] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule instanceof CSSFontFaceRule) {
          fontFaces.push({
            family: rule.style.getPropertyValue('font-family').replace(/['"]/g, ''),
            weight: rule.style.getPropertyValue('font-weight') || '400',
            style: rule.style.getPropertyValue('font-style') || 'normal',
            src: rule.style.getPropertyValue('src'),
          });
        }
      }
    } catch {
      // CORS
    }
  }

  // Images
  const images: string[] = [];
  document.querySelectorAll('img[src]').forEach(img => {
    const src = (img as HTMLImageElement).src;
    if (src && !src.startsWith('data:')) images.push(src);
  });

  // SVGs
  const svgs: ExtractedPageData['svgs'] = [];
  document.querySelectorAll('svg').forEach((svg, i) => {
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    if (rect.width > 200 || rect.height > 200) return; // skip non-icon SVGs

    svgs.push({
      svg: svg.outerHTML,
      selector: `svg:nth-of-type(${i + 1})`,
      width: rect.width,
      height: rect.height,
    });
  });

  // Class names
  const classNames: string[] = [];
  const seen = new Set<string>();
  document.querySelectorAll('[class]').forEach(el => {
    for (const cls of Array.from(el.classList)) {
      if (!seen.has(cls)) {
        seen.add(cls);
        classNames.push(cls);
      }
    }
  });

  return {
    url: location.href,
    title: document.title,
    cssRules,
    customProperties,
    computedStyles,
    fontFaces,
    images,
    svgs,
    classNames,
  };
}
