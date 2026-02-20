/**
 * Color parsing, grouping, contrast, and conversion utilities.
 */

/* ── Parsing ────────────────────────────────────────────── */

export function parseHex(hex: string): [number, number, number] | null {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.charAt(0)+hex.charAt(0)+hex.charAt(1)+hex.charAt(1)+hex.charAt(2)+hex.charAt(2);
  if (hex.length === 8) hex = hex.slice(0, 6); // strip alpha
  if (hex.length !== 6) return null;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return [r, g, b];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function parseColorToRgb(value: string): [number, number, number] | null {
  value = value.trim().toLowerCase();
  // Named colors
  if (value === 'transparent' || value === 'inherit' || value === 'initial' || value === 'currentcolor') return null;
  
  // Hex
  if (value.startsWith('#')) return parseHex(value);
  
  // rgb/rgba
  const rgbMatch = value.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
    return [Math.round(+rgbMatch[1]), Math.round(+rgbMatch[2]), Math.round(+rgbMatch[3])];
  }
  
  // hsl/hsla
  const hslMatch = value.match(/hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?/);
  if (hslMatch && hslMatch[1] && hslMatch[2] && hslMatch[3]) {
    return hslToRgb(+hslMatch[1], +hslMatch[2], +hslMatch[3]);
  }
  
  return null;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

export function colorToFormats(value: string): { hex: string; rgb: string; hsl: string } | null {
  const rgb = parseColorToRgb(value);
  if (!rgb) return null;
  const [r, g, b] = rgb;
  const hex = rgbToHex(r, g, b);
  const [h, s, l] = rgbToHsl(r, g, b);
  return {
    hex,
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl: `hsl(${h}, ${s}%, ${l}%)`,
  };
}

/* ── Contrast ───────────────────────────────────────────── */

function luminance(r: number, g: number, b: number): number {
  const mapped = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * mapped[0]! + 0.7152 * mapped[1]! + 0.0722 * mapped[2]!;
}

export function contrastRatio(color1: string | [number, number, number], color2: string | [number, number, number]): number {
  const rgb1 = typeof color1 === 'string' ? parseColorToRgb(color1) ?? parseHex(color1) ?? [0, 0, 0] as [number, number, number] : color1;
  const rgb2 = typeof color2 === 'string' ? parseColorToRgb(color2) ?? parseHex(color2) ?? [255, 255, 255] as [number, number, number] : color2;
  const l1 = luminance(...rgb1);
  const l2 = luminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function wcagLevel(ratio: number): 'AAA' | 'AA' | 'Fail' {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'Fail';
}

/* ── Grouping by Hue ────────────────────────────────────── */

export type HueFamily = 'Reds' | 'Oranges' | 'Yellows' | 'Greens' | 'Blues' | 'Purples' | 'Grays' | 'Neutrals';

export function getHueFamily(hex: string): HueFamily {
  const rgb = parseHex(hex);
  if (!rgb) return 'Neutrals';
  const [r, g, b] = rgb;
  const [h, s, l] = rgbToHsl(r, g, b);
  
  // Very low saturation or extreme lightness → neutral/gray
  if (s < 8 || l < 5 || l > 95) return 'Neutrals';
  if (s < 15) return 'Grays';
  
  // Group by hue angle
  if (h < 15 || h >= 345) return 'Reds';
  if (h < 45) return 'Oranges';
  if (h < 70) return 'Yellows';
  if (h < 165) return 'Greens';
  if (h < 260) return 'Blues';
  return 'Purples';
}

/* ── Semantic Detection ─────────────────────────────────── */

export function detectSemanticRole(color: { hex: string; property: string; selectors: string[] }): string | null {
  const { hex, property, selectors } = color;
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const [, s, l] = rgbToHsl(...rgb);
  const selectorStr = selectors.join(' ').toLowerCase();
  
  // Background detection
  if (property === 'background-color' && (selectorStr.includes('body') || selectorStr.includes('html') || selectorStr.includes(':root'))) {
    return 'Background';
  }
  
  // Text color
  if (property === 'color' && (selectorStr.includes('body') || selectorStr.includes('html') || selectorStr.includes('p'))) {
    return 'Text';
  }
  
  // Border
  if (property.includes('border')) return 'Border';
  
  // Success/Warning/Danger by color
  const [h] = rgbToHsl(...rgb);
  if (s > 50) {
    if (selectorStr.includes('success') || selectorStr.includes('.ok')) return 'Success';
    if (selectorStr.includes('warning') || selectorStr.includes('.warn')) return 'Warning';
    if (selectorStr.includes('danger') || selectorStr.includes('error') || selectorStr.includes('.err')) return 'Danger';
    
    // By hue
    if (h >= 100 && h <= 160 && l > 30 && l < 70) return 'Success';
    if (h >= 30 && h <= 55 && l > 40 && l < 75) return 'Warning';
    if ((h < 15 || h > 345) && l > 30 && l < 60) return 'Danger';
  }
  
  // Primary detection
  if (selectorStr.includes('primary') || selectorStr.includes('btn') || selectorStr.includes('button')) {
    return 'Primary';
  }
  
  // Accent
  if (selectorStr.includes('accent') || selectorStr.includes('highlight')) return 'Accent';
  
  return null;
}
