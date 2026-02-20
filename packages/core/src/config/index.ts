import { z } from 'zod';
import type { StylepeekConfig } from '../types/index.js';

/** Zod schema for runtime validation of stylepeek configuration */
export const stylepeekConfigSchema = z.object({
  crawl: z.object({
    depth: z.number().int().min(0).max(10).default(2),
    workers: z.number().int().min(1).max(10).default(3),
    waitAfterLoad: z.number().int().min(0).max(30000).default(1000),
    include: z.array(z.string()).optional(),
    exclude: z.array(z.string()).optional(),
    headless: z.boolean().default(true),
    proxy: z.string().optional(),
    ignoreTls: z.boolean().default(false),
  }).partial().default({}),
  extract: z.object({
    minUsage: z.number().int().min(1).default(2),
    mergeBreakpoints: z.boolean().default(true),
    groupSimilarColors: z.boolean().default(true),
    colorSimilarityThreshold: z.number().min(0).max(100).default(5),
    detectComponents: z.boolean().default(true),
  }).partial().default({}),
  assets: z.object({
    download: z.array(z.enum(['fonts', 'images', 'icons', 'svg', 'all'])).default([]),
    maxImageSize: z.number().int().min(0).default(500_000),
  }).partial().default({}),
  output: z.object({
    formats: z.array(z.enum(['tailwind', 'css-vars', 'style-dict', 'figma', 'html', 'json', 'all'])).default(['all']),
    dir: z.string().default('./stylepeek-output/'),
    tailwind: z.object({
      prefix: z.string().default(''),
      includeBase: z.boolean().default(true),
    }).partial().default({}),
    cssVars: z.object({
      selector: z.string().default(':root'),
      prefix: z.string().default('--'),
    }).partial().default({}),
  }).partial().default({}),
});

/**
 * Validate and merge a partial config with defaults.
 * @param raw - Unvalidated config object
 * @returns Validated StylepeekConfig
 */
export function parseConfig(raw: unknown): StylepeekConfig {
  return stylepeekConfigSchema.parse(raw) as StylepeekConfig;
}

/**
 * Helper for config file creation — provides type safety
 */
export function defineConfig(config: StylepeekConfig): StylepeekConfig {
  return parseConfig(config);
}

/** Default configuration values */
export const DEFAULT_CONFIG: Required<
  Pick<StylepeekConfig, 'crawl' | 'extract' | 'output'>
> = {
  crawl: {
    depth: 2,
    workers: 3,
    waitAfterLoad: 1000,
    headless: true,
    ignoreTls: false,
  },
  extract: {
    minUsage: 2,
    mergeBreakpoints: true,
    groupSimilarColors: true,
    colorSimilarityThreshold: 5,
    detectComponents: true,
  },
  output: {
    formats: ['all'],
    dir: './stylepeek-output/',
    tailwind: { prefix: '', includeBase: true },
    cssVars: { selector: ':root', prefix: '--' },
  },
};
