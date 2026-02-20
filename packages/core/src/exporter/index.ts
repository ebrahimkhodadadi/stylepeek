/**
 * Exporter barrel — re-exports all exporters and provides a factory.
 */

export { TailwindExporter } from './tailwind.js';
export { CssVarsExporter } from './css-vars.js';
export { StyleDictExporter } from './style-dict.js';
export { FigmaExporter } from './figma.js';
export { JsonExporter } from './json.js';
export { HtmlExporter } from './html.js';

import type { Exporter, OutputFormat } from '../types/index.js';
import { TailwindExporter } from './tailwind.js';
import { CssVarsExporter } from './css-vars.js';
import { StyleDictExporter } from './style-dict.js';
import { FigmaExporter } from './figma.js';
import { JsonExporter } from './json.js';
import { HtmlExporter } from './html.js';

const exporterMap: Record<string, () => Exporter> = {
  tailwind: () => new TailwindExporter(),
  'css-vars': () => new CssVarsExporter(),
  'style-dict': () => new StyleDictExporter(),
  figma: () => new FigmaExporter(),
  json: () => new JsonExporter(),
  html: () => new HtmlExporter(),
};

/**
 * Create an exporter instance by format name.
 */
export function getExporter(format: OutputFormat): Exporter {
  const factory = exporterMap[format];
  if (!factory) {
    throw new Error(`Unknown export format: "${format}". Available: ${Object.keys(exporterMap).join(', ')}`);
  }
  return factory();
}

/**
 * List all available export format names.
 */
export function listExportFormats(): OutputFormat[] {
  return Object.keys(exporterMap) as OutputFormat[];
}
