/**
 * @stylepeek/core — public API
 *
 * This is the main entry point for the core package.
 */

// ── Types ──────────────────────────────────────────────────
export type {
  Result,
  ColorToken,
  ColorValue,
  ColorGroup,
  SemanticColors,
  GradientToken,
  FontFamilyToken,
  ScaleToken,
  TextStyleToken,
  ShadowToken,
  BreakpointToken,
  TransitionToken,
  ComponentToken,
  FontAsset,
  ImageAsset,
  IconAsset,
  DesignSystem,
  DesignSystemMeta,
  Exporter,
  ExportFile,
  RawPageData,
  RawCssRule,
  RawComputedStyle,
  RawFontFace,
  RawSvgElement,
  RawMediaQuery,
  StylepeekConfig,
  CrawlOptions,
  CrawlProgress,
  CrawlProgressCallback,
  OutputFormat,
  DetectedFramework,
} from './types/index.js';

export { ok, err } from './types/index.js';

// ── Config ─────────────────────────────────────────────────
export {
  stylepeekConfigSchema,
  parseConfig,
  defineConfig,
  DEFAULT_CONFIG,
} from './config/index.js';

// ── Crawler ────────────────────────────────────────────────
export { crawlSite, extractSinglePage } from './crawler/index.js';

// ── Extractors ─────────────────────────────────────────────
export {
  parseColor,
  colorDistance,
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
  cssSizeToPx,
  pxToRem,
} from './extractor/index.js';

export {
  extractFontAssets,
  extractImageAssets,
  extractIconAssets,
  downloadFonts,
  downloadImages,
  saveIcons,
  generateFontsCss,
  generateImageManifest,
} from './extractor/index.js';

// ── Analyzer ───────────────────────────────────────────────
export { analyze } from './analyzer/index.js';

// ── Exporters ──────────────────────────────────────────────
export {
  getExporter,
  listExportFormats,
  TailwindExporter,
  CssVarsExporter,
  StyleDictExporter,
  FigmaExporter,
  JsonExporter,
  HtmlExporter,
} from './exporter/index.js';

// ── High-level orchestrator ────────────────────────────────

import type { StylepeekConfig, DesignSystem, CrawlProgressCallback, ExportFile } from './types/index.js';
import { crawlSite } from './crawler/index.js';
import { analyze } from './analyzer/index.js';
import { getExporter, listExportFormats } from './exporter/index.js';
import { parseConfig, DEFAULT_CONFIG } from './config/index.js';

export interface StylepeekResult {
  designSystem: DesignSystem;
  exports: ExportFile[];
}

/**
 * Run the full stylepeek pipeline:
 *   Crawl → Extract → Analyze → Export
 */
export async function stylepeek(
  url: string,
  configOverrides?: Partial<StylepeekConfig>,
  onProgress?: CrawlProgressCallback,
): Promise<StylepeekResult> {
  const config: StylepeekConfig = {
    crawl: { ...DEFAULT_CONFIG.crawl, ...configOverrides?.crawl },
    extract: { ...DEFAULT_CONFIG.extract, ...configOverrides?.extract },
    output: { ...DEFAULT_CONFIG.output, ...configOverrides?.output },
    assets: configOverrides?.assets,
  };
  const startTime = Date.now();

  // 1. Crawl
  const crawlResult = await crawlSite(
    {
      url,
      depth: config.crawl?.depth ?? 2,
      workers: config.crawl?.workers ?? 3,
      waitAfterLoad: config.crawl?.waitAfterLoad ?? 1000,
      headless: config.crawl?.headless ?? true,
      include: config.crawl?.include?.[0] ? new RegExp(config.crawl.include[0]) : undefined,
      exclude: config.crawl?.exclude?.[0] ? new RegExp(config.crawl.exclude[0]) : undefined,
      ignoreTls: config.crawl?.ignoreTls ?? false,
      proxy: config.crawl?.proxy,
    },
    onProgress,
  );

  if (!crawlResult.ok) {
    throw new Error(`Crawl failed: ${crawlResult.error}`);
  }

  const pages = crawlResult.value;

  // 2. Analyze (includes extraction)
  const designSystem = analyze(pages, url, config, startTime);

  // 3. Export
  const exports: ExportFile[] = [];
  const formats = config.output?.formats ?? listExportFormats();
  for (const fmt of formats) {
    if (fmt === 'all') {
      for (const f of listExportFormats()) {
        const exporter = getExporter(f);
        const result = exporter.export(designSystem);
        if (Array.isArray(result)) exports.push(...result);
        else exports.push(result);
      }
    } else {
      const exporter = getExporter(fmt);
      const result = exporter.export(designSystem);
      if (Array.isArray(result)) exports.push(...result);
      else exports.push(result);
    }
  }

  return { designSystem, exports };
}
