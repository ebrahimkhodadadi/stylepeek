/**
 * Tests for the config module.
 */

import { describe, it, expect } from 'vitest';
import { parseConfig, defineConfig, DEFAULT_CONFIG } from '../src/config/index.js';

describe('parseConfig', () => {
  it('validates a valid config', () => {
    const result = parseConfig({
      crawl: { depth: 2, workers: 4 },
      extract: { minUsage: 3 },
    });
    expect(result.crawl?.depth).toBe(2);
    expect(result.crawl?.workers).toBe(4);
    expect(result.extract?.minUsage).toBe(3);
  });

  it('applies defaults for missing fields', () => {
    const result = parseConfig({});
    // Zod .default() fills these in
    expect(result.crawl).toBeDefined();
    expect(result.extract).toBeDefined();
    expect(result.output).toBeDefined();
  });

  it('rejects invalid worker count', () => {
    expect(() => parseConfig({ crawl: { workers: -1 } })).toThrow();
  });

  it('rejects invalid depth', () => {
    expect(() => parseConfig({ crawl: { depth: 999 } })).toThrow();
  });

  it('accepts partial config with only output', () => {
    const result = parseConfig({
      output: { formats: ['html', 'json'], dir: './out' },
    });
    expect(result.output?.formats).toEqual(['html', 'json']);
    expect(result.output?.dir).toBe('./out');
  });
});

describe('defineConfig', () => {
  it('returns a validated config (type helper)', () => {
    const config = defineConfig({
      crawl: { depth: 5 },
      extract: { minUsage: 1 },
    });
    expect(config.crawl?.depth).toBe(5);
    expect(config.extract?.minUsage).toBe(1);
  });
});

describe('DEFAULT_CONFIG', () => {
  it('has sensible defaults', () => {
    expect(DEFAULT_CONFIG.crawl.depth).toBe(2);
    expect(DEFAULT_CONFIG.crawl.workers).toBe(3);
    expect(DEFAULT_CONFIG.crawl.waitAfterLoad).toBe(1000);
    expect(DEFAULT_CONFIG.extract.minUsage).toBe(2);
    expect(DEFAULT_CONFIG.extract.groupSimilarColors).toBe(true);
    expect(DEFAULT_CONFIG.output.formats).toEqual(['all']);
  });
});
