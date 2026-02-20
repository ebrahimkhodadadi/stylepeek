/**
 * Chrome runtime message types used across all extension contexts.
 */

export interface ExtractRequest {
  type: 'EXTRACT_REQUEST';
  tabId?: number;
}

export interface ExtractResult {
  type: 'EXTRACT_RESULT';
  data: ExtractedDesignData;
  url: string;
  title: string;
}

export interface ExtractProgress {
  type: 'EXTRACT_PROGRESS';
  phase: string;
  percent: number;
}

export interface InspectActivate {
  type: 'INSPECT_ACTIVATE';
}

export interface InspectDeactivate {
  type: 'INSPECT_DEACTIVATE';
}

export interface ElementSelected {
  type: 'ELEMENT_SELECTED';
  data: ElementInspection;
}

export interface ElementHovered {
  type: 'ELEMENT_HOVERED';
  data: Partial<ElementInspection>;
}

export interface PingMessage {
  type: 'PING';
}

export interface GetCachedData {
  type: 'GET_CACHED_DATA';
  tabId: number;
}

export interface ClearCache {
  type: 'CLEAR_CACHE';
}

export interface OpenPanel {
  type: 'OPEN_PANEL';
  tab?: string;
}

export interface TabChanged {
  type: 'TAB_CHANGED';
  tab: string;
  tabId?: number;
  url?: string;
}

export type Message =
  | ExtractRequest
  | ExtractResult
  | ExtractProgress
  | InspectActivate
  | InspectDeactivate
  | ElementSelected
  | ElementHovered
  | PingMessage
  | GetCachedData
  | ClearCache
  | OpenPanel
  | TabChanged;

/* ── Data types ─────────────────────────────────────────── */

export interface ParsedColor {
  value: string;        // normalized hex/rgb
  hex: string;          // always hex
  rgb: string;
  hsl: string;
  property: string;     // which CSS property
  count: number;        // usage frequency
  selectors: string[];  // which selectors use it (up to 5)
}

export interface ColorGroup {
  name: string;         // "Reds", "Blues", "Grays" etc
  colors: ParsedColor[];
}

export interface SemanticColor {
  role: string;  // Primary, Secondary, Background, Text, etc
  color: ParsedColor;
}

export interface GradientInfo {
  css: string;
  count: number;
}

export interface FontInfo {
  family: string;
  source: 'google-fonts' | 'adobe-fonts' | 'system' | 'custom';
  weights: string[];
  url?: string;
}

export interface TypeScaleEntry {
  size: string;       // px
  rem: string;
  tailwind: string;   // text-sm, text-xl etc
  count: number;
}

export interface TextStyle {
  name: string;       // "Heading 1", "Body", etc
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
}

export interface SpacingValue {
  px: string;
  rem: string;
  tailwind: string;
  count: number;
  group: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export interface BreakpointInfo {
  name: string;
  px: number;
  tailwind: string;
}

export interface BorderRadiusInfo {
  value: string;
  tailwind: string;
  count: number;
}

export interface ShadowInfo {
  value: string;
  tailwind: string;
  count: number;
}

export interface SvgIconInfo {
  svg: string;
  name: string;
  width: number;
  height: number;
  selector: string;
}

export interface ImageInfo {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  format?: string;
}

export interface FontFaceInfo {
  family: string;
  weight: string;
  style: string;
  src: string;
  format?: string;
  url?: string;
}

export interface FaviconInfo {
  href: string;
  sizes: string;
  type: string;
}

export interface ElementInspection {
  tag: string;
  id?: string;
  classNames: string[];
  selector: string;
  rect: { top: number; left: number; width: number; height: number };
  styles: Record<string, string>;
  colors: Array<{ property: string; value: string; hex: string }>;
  typography: Record<string, string>;
  spacing: {
    margin: { top: string; right: string; bottom: string; left: string };
    padding: { top: string; right: string; bottom: string; left: string };
    border: { top: string; right: string; bottom: string; left: string };
  };
  tailwindClasses?: string;
}

export interface ExtractedDesignData {
  url: string;
  title: string;
  colors: ParsedColor[];
  colorGroups: ColorGroup[];
  semanticColors: SemanticColor[];
  gradients: GradientInfo[];
  fonts: FontInfo[];
  typeScale: TypeScaleEntry[];
  textStyles: TextStyle[];
  spacing: SpacingValue[];
  breakpoints: BreakpointInfo[];
  borderRadius: BorderRadiusInfo[];
  shadows: ShadowInfo[];
  icons: SvgIconInfo[];
  images: ImageInfo[];
  fontFaces: FontFaceInfo[];
  favicons: FaviconInfo[];
  customProperties: Record<string, string>;
  cssRuleCount: number;
  stylesheetCount: number;
  classNames: string[];
}

/* ── Cache entry ────────────────────────────────────────── */

export interface CacheEntry {
  url: string;
  title: string;
  data: ExtractedDesignData;
  timestamp: number;
}

/* ── Settings ───────────────────────────────────────────── */

export type ThemeMode = 'auto' | 'light' | 'dark';
export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'css-var';

export interface ExtensionSettings {
  theme: ThemeMode;
  autoAnalyze: boolean;
  cacheEnabled: boolean;
  cacheDuration: number; // minutes
  colorFormat: ColorFormat;
  showTailwind: boolean;
  ignoredSelectors: string;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  theme: 'dark',
  autoAnalyze: true,
  cacheEnabled: true,
  cacheDuration: 5,
  colorFormat: 'hex',
  showTailwind: true,
  ignoredSelectors: '',
};
