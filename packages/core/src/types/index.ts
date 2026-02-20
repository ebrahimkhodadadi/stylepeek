/**
 * Core type definitions for the stylepeek design system extraction engine.
 * All types are shared across CLI, extension, and core packages.
 */

// ─── Result Type ────────────────────────────────────────────────────────────

/** Discriminated union for safe error handling — no uncaught exceptions */
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/** Create a successful result */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/** Create a failed result */
export function err<E = Error>(error: E): Result<never, E> {
  return { ok: false, error };
}

// ─── Color Types ────────────────────────────────────────────────────────────

export interface ColorValue {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  alpha: number;
}

export interface ColorToken {
  /** Token name, e.g. "primary", "gray-100" */
  name: string;
  value: ColorValue;
  /** Raw CSS value as found in stylesheet */
  raw: string;
  /** Number of times this color appears in stylesheets */
  usageCount: number;
  /** CSS properties where this color is used */
  usedIn: string[];
  /** CSS variable name if extracted from a custom property */
  cssVariable?: string;
}

export interface ColorGroup {
  /** Group name, e.g. "grays", "blues", "reds" */
  name: string;
  colors: ColorToken[];
}

export interface SemanticColors {
  primary?: ColorToken;
  secondary?: ColorToken;
  accent?: ColorToken;
  background?: ColorToken;
  foreground?: ColorToken;
  muted?: ColorToken;
  danger?: ColorToken;
  warning?: ColorToken;
  success?: ColorToken;
  info?: ColorToken;
}

export interface GradientToken {
  name: string;
  raw: string;
  type: 'linear' | 'radial' | 'conic';
  stops: Array<{ color: ColorValue; position?: string }>;
  usageCount: number;
}

// ─── Typography Types ───────────────────────────────────────────────────────

export interface FontFamilyToken {
  name: string;
  stack: string[];
  raw: string;
  usageCount: number;
  category: 'sans-serif' | 'serif' | 'monospace' | 'display' | 'handwriting' | 'unknown';
}

export interface ScaleToken {
  name: string;
  value: string;
  /** Numeric value in pixels for comparison */
  numericPx: number;
  usageCount: number;
}

export interface TextStyleToken {
  name: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  letterSpacing: string;
  textTransform?: string;
  /** HTML element(s) this style was found on */
  elements: string[];
}

// ─── Spacing & Layout Types ────────────────────────────────────────────────

export interface ShadowToken {
  name: string;
  raw: string;
  usageCount: number;
}

export interface BreakpointToken {
  name: string;
  /** e.g. "640px" */
  value: string;
  numericPx: number;
  type: 'min-width' | 'max-width';
}

export interface TransitionToken {
  name: string;
  duration: string;
  timingFunction: string;
  property: string;
  raw: string;
  usageCount: number;
}

// ─── Component Types ────────────────────────────────────────────────────────

export interface ComponentToken {
  /** Detected component name, e.g. "button", "card", "nav" */
  name: string;
  /** CSS selectors that define this component */
  selectors: string[];
  /** Self-contained CSS snippet for this component */
  css: string;
  /** Sample HTML if detected */
  html?: string;
  /** Number of instances found */
  instanceCount: number;
  /** Tokens used by this component */
  tokens: {
    colors: string[];
    fonts: string[];
    spacing: string[];
  };
}

// ─── Asset Types ────────────────────────────────────────────────────────────

export interface FontAsset {
  family: string;
  weight: string;
  style: string;
  format: 'woff2' | 'woff' | 'ttf' | 'otf' | 'unknown';
  url: string;
  /** Local file path after download */
  localPath?: string;
  source: 'font-face' | 'google-fonts' | 'adobe-fonts' | 'link';
}

export interface ImageAsset {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  type: 'photo' | 'icon' | 'favicon' | 'background' | 'unknown';
  format: string;
  /** File size in bytes */
  size?: number;
  localPath?: string;
}

export interface IconAsset {
  name: string;
  svg: string;
  viewBox?: string;
  url?: string;
  localPath?: string;
}

// ─── Design System (Root Type) ──────────────────────────────────────────────

export type DetectedFramework =
  | 'tailwind'
  | 'bootstrap'
  | 'chakra'
  | 'mantine'
  | 'mui'
  | 'antd'
  | 'bulma'
  | 'foundation'
  | 'unknown';

export interface DesignSystemMeta {
  url: string;
  crawledAt: string;
  pageCount: number;
  /** Pages that were crawled */
  pages: string[];
  framework: DetectedFramework;
  /** Total number of CSS rules processed */
  totalRules: number;
  /** Total number of stylesheets processed */
  totalStylesheets: number;
  /** Crawl duration in ms */
  duration: number;
}

export interface DesignSystem {
  meta: DesignSystemMeta;
  colors: {
    palette: ColorToken[];
    groups: ColorGroup[];
    semantic: SemanticColors;
    gradients: GradientToken[];
  };
  typography: {
    fontFamilies: FontFamilyToken[];
    fontSizes: ScaleToken[];
    fontWeights: number[];
    lineHeights: ScaleToken[];
    letterSpacing: ScaleToken[];
    textStyles: TextStyleToken[];
  };
  spacing: ScaleToken[];
  borderRadius: ScaleToken[];
  shadows: ShadowToken[];
  breakpoints: BreakpointToken[];
  zIndex: number[];
  transitions: TransitionToken[];
  components: ComponentToken[];
  assets: {
    fonts: FontAsset[];
    images: ImageAsset[];
    icons: IconAsset[];
  };
}

// ─── Exporter Interface ─────────────────────────────────────────────────────

export interface ExportFile {
  filename: string;
  content: string;
  mimeType: string;
}

export interface Exporter {
  /** Format identifier */
  format: string;
  /** File extension */
  extension: string;
  /** Generate export file(s) from a design system */
  export(ds: DesignSystem): ExportFile | ExportFile[];
}

// ─── Extraction Raw Data ────────────────────────────────────────────────────

/** Raw extracted data from a single page before analysis */
export interface RawPageData {
  url: string;
  /** All CSS rules collected */
  cssRules: RawCssRule[];
  /** All CSS custom properties */
  customProperties: Map<string, string>;
  /** All computed styles for key elements */
  computedStyles: RawComputedStyle[];
  /** All font-face declarations */
  fontFaces: RawFontFace[];
  /** All image URLs */
  imageUrls: string[];
  /** All SVG elements */
  svgElements: RawSvgElement[];
  /** All link/script resource URLs */
  resourceUrls: string[];
  /** Media queries found */
  mediaQueries: RawMediaQuery[];
  /** HTML class names found (for framework detection) */
  classNames: string[];
}

export interface RawCssRule {
  selector: string;
  properties: Record<string, string>;
  media?: string;
  /** Which stylesheet this came from */
  source: string;
}

export interface RawComputedStyle {
  element: string;
  tagName: string;
  classList: string[];
  styles: Record<string, string>;
}

export interface RawFontFace {
  family: string;
  src: string;
  weight?: string;
  style?: string;
  display?: string;
}

export interface RawSvgElement {
  html: string;
  id?: string;
  viewBox?: string;
  classList: string[];
}

export interface RawMediaQuery {
  query: string;
  rules: RawCssRule[];
}

// ─── Config Types ───────────────────────────────────────────────────────────

export interface StylepeekConfig {
  crawl?: {
    depth?: number;
    workers?: number;
    waitAfterLoad?: number;
    include?: string[];
    exclude?: string[];
    headless?: boolean;
    proxy?: string;
    ignoreTls?: boolean;
  };
  extract?: {
    minUsage?: number;
    mergeBreakpoints?: boolean;
    groupSimilarColors?: boolean;
    colorSimilarityThreshold?: number;
    detectComponents?: boolean;
  };
  assets?: {
    download?: Array<'fonts' | 'images' | 'icons' | 'svg' | 'all'>;
    maxImageSize?: number;
  };
  output?: {
    formats?: OutputFormat[];
    dir?: string;
    tailwind?: {
      prefix?: string;
      includeBase?: boolean;
    };
    cssVars?: {
      selector?: string;
      prefix?: string;
    };
  };
}

export type OutputFormat =
  | 'tailwind'
  | 'css-vars'
  | 'style-dict'
  | 'figma'
  | 'html'
  | 'json'
  | 'all';

// ─── Crawler Types ──────────────────────────────────────────────────────────

export interface CrawlOptions {
  url: string;
  depth: number;
  workers: number;
  waitAfterLoad: number;
  headless: boolean;
  include?: RegExp;
  exclude?: RegExp;
  cookie?: string;
  header?: string;
  proxy?: string;
  ignoreTls: boolean;
}

export interface CrawlProgress {
  totalPages: number;
  crawledPages: number;
  currentUrl: string;
  activeWorkers: number;
  discoveredTokens: {
    colors: number;
    fontFamilies: number;
    fontSizes: number;
    spacingValues: number;
    borderRadii: number;
    shadows: number;
    breakpoints: number;
    components: number;
  };
}

export type CrawlProgressCallback = (progress: CrawlProgress) => void;
