/**
 * Shared types for SSE events between server and client.
 */

export interface CrawlProgressEvent {
  type: 'progress';
  crawledPages: number;
  totalPages: number;
  currentUrl: string;
}

export interface AnalyzingEvent {
  type: 'analyzing';
}

export interface ResultEvent {
  type: 'result';
  data: SerializedDesignSystem;
}

export interface ErrorEvent {
  type: 'error';
  message: string;
}

export interface DoneEvent {
  type: 'done';
}

export type SseEvent =
  | CrawlProgressEvent
  | AnalyzingEvent
  | ResultEvent
  | ErrorEvent
  | DoneEvent;

// ── Export types ──

export type ExportFormat = 'tailwind' | 'css-vars' | 'style-dict' | 'figma' | 'json' | 'html';

export interface ExportedFile {
  filename: string;
  content: string;
  mimeType: string;
  format?: string;
}

export const EXPORT_FORMATS: Array<{ id: ExportFormat; label: string; ext: string; description: string }> = [
  { id: 'tailwind', label: 'Tailwind Config', ext: '.config.js', description: 'Ready-to-use Tailwind CSS theme configuration' },
  { id: 'css-vars', label: 'CSS Variables', ext: '.css', description: 'Custom properties in a :root stylesheet' },
  { id: 'style-dict', label: 'Style Dictionary', ext: '.json', description: 'Amazon Style Dictionary compatible tokens' },
  { id: 'figma', label: 'Figma Tokens', ext: '.json', description: 'Token Studio format for Figma sync' },
  { id: 'json', label: 'JSON', ext: '.json', description: 'Full raw design system data' },
  { id: 'html', label: 'HTML Style Guide', ext: '.html', description: 'Self-contained visual style guide' },
];

// Serialized design system (Maps get JSON-serialized to objects)
export interface SerializedDesignSystem {
  meta: {
    url: string;
    crawledAt: string;
    pageCount: number;
    pages: string[];
    framework: string;
    totalRules: number;
    totalStylesheets: number;
    duration: number;
  };
  colors: {
    palette: Array<{
      name: string;
      value: { hex: string; rgb: { r: number; g: number; b: number }; hsl: { h: number; s: number; l: number }; alpha: number };
      raw: string;
      usageCount: number;
      usedIn: string[];
      cssVariable?: string;
    }>;
    groups: Array<{ name: string; colors: SerializedDesignSystem['colors']['palette'] }>;
    semantic?: Record<string, SerializedDesignSystem['colors']['palette'][number] | undefined>;
    gradients: Array<{ name: string; raw: string; type: string; usageCount: number }>;
  };
  typography: {
    fontFamilies: Array<{ name: string; stack: string[]; raw: string; usageCount: number; category: string }>;
    fontSizes: Array<{ name: string; value: string; numericPx: number; usageCount: number }>;
    fontWeights: number[];
    lineHeights: Array<{ name: string; value: string; numericPx: number; usageCount: number }>;
    letterSpacing: Array<{ name: string; value: string; numericPx: number; usageCount: number }>;
    textStyles: Array<{ name: string; fontFamily: string; fontSize: string; fontWeight: number; lineHeight: string; elements: string[] }>;
  };
  spacing: Array<{ name: string; value: string; numericPx: number; usageCount: number }>;
  borderRadius: Array<{ name: string; value: string; numericPx: number; usageCount: number }>;
  shadows: Array<{ name: string; raw: string; usageCount: number }>;
  breakpoints: Array<{ name: string; value: string; numericPx: number; type: string }>;
  zIndex: number[];
  transitions: Array<{ name: string; duration: string; timingFunction: string; property: string; raw: string; usageCount: number }>;
  components: Array<{ name: string; selectors: string[]; instanceCount: number; css?: string; html?: string }>;
  assets: {
    fonts: Array<{ family: string; format: string; url: string; source: string }>;
    images?: Array<{ url: string; alt?: string; type: string; format: string }>;
    icons: Array<{ name: string; svg: string }>;
  };
}
