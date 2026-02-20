/**
 * Maps CSS property:value pairs to the nearest Tailwind utility class.
 */

/* ── Font Size ──────────────────────────────────────────── */

const FONT_SIZE_MAP: Array<[number, string]> = [
  [10, 'text-[10px]'], [12, 'text-xs'], [14, 'text-sm'], [16, 'text-base'],
  [18, 'text-lg'], [20, 'text-xl'], [24, 'text-2xl'], [30, 'text-3xl'],
  [36, 'text-4xl'], [48, 'text-5xl'], [60, 'text-6xl'], [72, 'text-7xl'],
  [96, 'text-8xl'], [128, 'text-9xl'],
];

/* ── Font Weight ────────────────────────────────────────── */

const FONT_WEIGHT_MAP: Record<string, string> = {
  '100': 'font-thin',      '200': 'font-extralight', '300': 'font-light',
  '400': 'font-normal',    '500': 'font-medium',     '600': 'font-semibold',
  '700': 'font-bold',      '800': 'font-extrabold',  '900': 'font-black',
  'normal': 'font-normal', 'bold': 'font-bold',
};

/* ── Spacing ────────────────────────────────────────────── */

const SPACING_MAP: Array<[number, string]> = [
  [0, '0'], [1, 'px'], [2, '0.5'], [4, '1'], [6, '1.5'], [8, '2'],
  [10, '2.5'], [12, '3'], [14, '3.5'], [16, '4'], [20, '5'], [24, '6'],
  [28, '7'], [32, '8'], [36, '9'], [40, '10'], [44, '11'], [48, '12'],
  [56, '14'], [64, '16'], [80, '20'], [96, '24'], [112, '28'], [128, '32'],
  [144, '36'], [160, '40'], [176, '44'], [192, '48'], [208, '52'],
  [224, '56'], [240, '60'], [256, '64'], [288, '72'], [320, '80'], [384, '96'],
];

/* ── Border Radius ──────────────────────────────────────── */

const RADIUS_MAP: Array<[number, string]> = [
  [0, 'rounded-none'], [2, 'rounded-sm'], [4, 'rounded'],
  [6, 'rounded-md'], [8, 'rounded-lg'], [12, 'rounded-xl'],
  [16, 'rounded-2xl'], [24, 'rounded-3xl'], [9999, 'rounded-full'],
];

/* ── Box Shadow ─────────────────────────────────────────── */

const SHADOW_KEYWORDS: Array<[RegExp, string]> = [
  [/^none$/i, 'shadow-none'],
  [/0\s+1px\s+2px/i, 'shadow-sm'],
  [/0\s+1px\s+3px/i, 'shadow'],
  [/0\s+4px\s+6px/i, 'shadow-md'],
  [/0\s+10px\s+15px/i, 'shadow-lg'],
  [/0\s+20px\s+25px/i, 'shadow-xl'],
  [/0\s+25px\s+50px/i, 'shadow-2xl'],
];

/* ── Opacity ────────────────────────────────────────────── */

const OPACITY_MAP: Array<[number, string]> = [
  [0, 'opacity-0'], [0.05, 'opacity-5'], [0.1, 'opacity-10'],
  [0.2, 'opacity-20'], [0.25, 'opacity-25'], [0.3, 'opacity-30'],
  [0.4, 'opacity-40'], [0.5, 'opacity-50'], [0.6, 'opacity-60'],
  [0.7, 'opacity-70'], [0.75, 'opacity-75'], [0.8, 'opacity-80'],
  [0.9, 'opacity-90'], [0.95, 'opacity-95'], [1, 'opacity-100'],
];

/* ── Tailwind default color palette (subset for matching) ── */

const TW_COLORS: Array<[string, [number, number, number]]> = [
  ['slate-50', [248,250,252]], ['slate-100', [241,245,249]], ['slate-200', [226,232,240]],
  ['slate-300', [203,213,225]], ['slate-400', [148,163,184]], ['slate-500', [100,116,139]],
  ['slate-600', [71,85,105]], ['slate-700', [51,65,85]], ['slate-800', [30,41,59]], ['slate-900', [15,23,42]],
  ['gray-50', [249,250,251]], ['gray-100', [243,244,246]], ['gray-200', [229,231,235]],
  ['gray-300', [209,213,219]], ['gray-400', [156,163,175]], ['gray-500', [107,114,128]],
  ['gray-600', [75,85,99]], ['gray-700', [55,65,81]], ['gray-800', [31,41,55]], ['gray-900', [17,24,39]],
  ['red-50', [254,242,242]], ['red-100', [254,226,226]], ['red-200', [254,202,202]],
  ['red-300', [252,165,165]], ['red-400', [248,113,113]], ['red-500', [239,68,68]],
  ['red-600', [220,38,38]], ['red-700', [185,28,28]], ['red-800', [153,27,27]], ['red-900', [127,29,29]],
  ['orange-50', [255,247,237]], ['orange-400', [251,146,60]], ['orange-500', [249,115,22]], ['orange-600', [234,88,12]],
  ['yellow-50', [254,252,232]], ['yellow-400', [250,204,21]], ['yellow-500', [234,179,8]],
  ['green-50', [240,253,244]], ['green-400', [74,222,128]], ['green-500', [34,197,94]],
  ['green-600', [22,163,74]], ['green-700', [21,128,61]],
  ['blue-50', [239,246,255]], ['blue-400', [96,165,250]], ['blue-500', [59,130,246]],
  ['blue-600', [37,99,235]], ['blue-700', [29,78,216]],
  ['indigo-500', [99,102,241]], ['indigo-600', [79,70,229]],
  ['violet-500', [139,92,246]], ['violet-600', [124,58,237]],
  ['purple-500', [168,85,247]], ['purple-600', [147,51,234]],
  ['pink-500', [236,72,153]], ['pink-600', [219,39,119]],
  ['rose-500', [244,63,94]], ['rose-600', [225,29,72]],
  ['white', [255,255,255]], ['black', [0,0,0]],
];

/* ── Nearest match helpers ──────────────────────────────── */

function nearest<T extends string>(value: number, map: Array<[number, T]>): T {
  let best = map[0]![1];
  let bestDist = Infinity;
  for (const [target, cls] of map) {
    const d = Math.abs(value - target);
    if (d < bestDist) { bestDist = d; best = cls; }
  }
  return best;
}

function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);
}

function parseHexForMap(hex: string): [number, number, number] | null {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.charAt(0)+hex.charAt(0)+hex.charAt(1)+hex.charAt(1)+hex.charAt(2)+hex.charAt(2);
  if (hex.length !== 6) return null;
  return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
}

/* ── Main mapper ────────────────────────────────────────── */

export function cssToTailwind(property: string, value: string): string | null {
  property = property.trim().toLowerCase();
  value = value.trim();
  
  if (!value || value === 'none' || value === 'normal' || value === 'auto' || value === 'inherit' || value === 'initial') {
    return null;
  }

  switch (property) {
    case 'font-size': {
      const px = parseFloat(value);
      if (isNaN(px)) return null;
      return nearest(px, FONT_SIZE_MAP);
    }

    case 'font-weight':
      return FONT_WEIGHT_MAP[value] ?? null;

    case 'color':
    case 'background-color':
    case 'border-color': {
      const prefix = property === 'color' ? 'text' : property === 'background-color' ? 'bg' : 'border';
      const rgb = parseColorForTw(value);
      if (!rgb) return null;
      let bestName = 'gray-500';
      let bestDist = Infinity;
      for (const [name, twRgb] of TW_COLORS) {
        const d = colorDistance(rgb, twRgb);
        if (d < bestDist) { bestDist = d; bestName = name; }
      }
      return `${prefix}-${bestName}`;
    }

    case 'padding':
    case 'padding-top':
    case 'padding-right':
    case 'padding-bottom':
    case 'padding-left': {
      const px = parseFloat(value);
      if (isNaN(px)) return null;
      const suffix = property === 'padding' ? '' : ({ 'padding-top': 't', 'padding-right': 'r', 'padding-bottom': 'b', 'padding-left': 'l' }[property] ?? '');
      const twVal = nearest(px, SPACING_MAP);
      return `p${suffix}-${twVal}`;
    }

    case 'margin':
    case 'margin-top':
    case 'margin-right':
    case 'margin-bottom':
    case 'margin-left': {
      const px = parseFloat(value);
      if (isNaN(px)) return null;
      const suffix = property === 'margin' ? '' : ({ 'margin-top': 't', 'margin-right': 'r', 'margin-bottom': 'b', 'margin-left': 'l' }[property] ?? '');
      const twVal = nearest(px, SPACING_MAP);
      return `m${suffix}-${twVal}`;
    }

    case 'gap':
    case 'row-gap':
    case 'column-gap': {
      const px = parseFloat(value);
      if (isNaN(px)) return null;
      const prefix = property === 'gap' ? 'gap' : property === 'row-gap' ? 'gap-y' : 'gap-x';
      return `${prefix}-${nearest(px, SPACING_MAP)}`;
    }

    case 'border-radius': {
      const px = parseFloat(value);
      if (isNaN(px)) return null;
      if (value.includes('%') && parseFloat(value) >= 50) return 'rounded-full';
      return nearest(px, RADIUS_MAP);
    }

    case 'box-shadow': {
      for (const [re, cls] of SHADOW_KEYWORDS) {
        if (re.test(value)) return cls;
      }
      return 'shadow';
    }

    case 'opacity': {
      const val = parseFloat(value);
      if (isNaN(val)) return null;
      return nearest(val, OPACITY_MAP);
    }

    case 'display':
      return ({ 'block': 'block', 'inline': 'inline', 'inline-block': 'inline-block', 'flex': 'flex', 'inline-flex': 'inline-flex', 'grid': 'grid', 'inline-grid': 'inline-grid', 'none': 'hidden', 'contents': 'contents' })[value] ?? null;

    case 'position':
      return ({ 'static': 'static', 'relative': 'relative', 'absolute': 'absolute', 'fixed': 'fixed', 'sticky': 'sticky' })[value] ?? null;

    case 'text-align':
      return ({ 'left': 'text-left', 'center': 'text-center', 'right': 'text-right', 'justify': 'text-justify' })[value] ?? null;

    case 'overflow':
      return ({ 'hidden': 'overflow-hidden', 'auto': 'overflow-auto', 'scroll': 'overflow-scroll', 'visible': 'overflow-visible' })[value] ?? null;

    default:
      return null;
  }
}

function parseColorForTw(value: string): [number, number, number] | null {
  value = value.trim().toLowerCase();
  if (value.startsWith('#')) return parseHexForMap(value);
  const rgbMatch = value.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) return [Math.round(+rgbMatch[1]), Math.round(+rgbMatch[2]), Math.round(+rgbMatch[3])];
  return null;
}

/**
 * Convert a full element's computed style map to a Tailwind class string.
 */
export function stylesToTailwind(styles: Record<string, string>): string {
  const classes: string[] = [];
  for (const [prop, val] of Object.entries(styles)) {
    const tw = cssToTailwind(prop, val);
    if (tw) classes.push(tw);
  }
  return classes.join(' ');
}

/**
 * Get nearest Tailwind font-size class for a pixel value.
 */
export function fontSizeToTailwind(px: number): string {
  return nearest(px, FONT_SIZE_MAP);
}

/**
 * Get nearest Tailwind spacing class for a pixel value.
 */
export function spacingToTailwind(px: number): string {
  return nearest(px, SPACING_MAP);
}
