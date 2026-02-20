/**
 * stylepeek CLI — Extract design systems from any website.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { existsSync } from 'node:fs';

import {
  stylepeek,
  crawlSite,
  analyze,
  getExporter,
  listExportFormats,
  parseConfig,
  DEFAULT_CONFIG,
  downloadFonts,
  downloadImages,
  saveIcons,
  generateFontsCss,
  generateImageManifest,
} from '@stylepeek/core';
import type {
  StylepeekConfig,
  DesignSystem,
  CrawlProgress,
  OutputFormat,
  ExportFile,
} from '@stylepeek/core';

const VERSION = '0.1.0';

const program = new Command();

program
  .name('stylepeek')
  .description('Extract design tokens and assets from any website')
  .version(VERSION);

// ── Crawl command ─────────────────────────────────────────

program
  .command('crawl')
  .alias('extract')
  .description('Crawl a website and extract its design system')
  .argument('<url>', 'URL to crawl')
  .option('-o, --output <dir>', 'Output directory', './stylepeek-output')
  .option('-f, --format <formats...>', 'Output formats (html, tailwind, css-vars, style-dict, figma, json)')
  .option('-d, --depth <n>', 'Max crawl depth', '3')
  .option('-w, --workers <n>', 'Concurrent workers', '3')
  .option('--wait <ms>', 'Wait after page load (ms)', '1000')
  .option('--assets', 'Download fonts, images, and icons', false)
  .option('-c, --config <path>', 'Path to config file')
  .option('--no-open', 'Do not open the style guide in browser')
  .action(async (url: string, opts: Record<string, unknown>) => {
    const config = await resolveConfig(opts);
    const outputDir = resolve(String(opts['output'] ?? config.output?.dir ?? './stylepeek-output'));

    console.log('');
    console.log(chalk.bold.hex('#6366f1')('◈ stylepeek'));
    console.log(chalk.dim(`  Extracting design system from ${chalk.white(url)}`));
    console.log('');

    const spinner = ora({ text: 'Starting crawl...', color: 'cyan' }).start();
    const startTime = Date.now();

    try {
      // Crawl
      const crawlResult = await crawlSite(
        {
          url,
          depth: config.crawl?.depth ?? 2,
          workers: config.crawl?.workers ?? 3,
          waitAfterLoad: config.crawl?.waitAfterLoad ?? 1000,
          headless: config.crawl?.headless ?? true,
          ignoreTls: config.crawl?.ignoreTls ?? false,
          proxy: config.crawl?.proxy,
          include: config.crawl?.include?.[0] ? new RegExp(config.crawl.include[0]) : undefined,
          exclude: config.crawl?.exclude?.[0] ? new RegExp(config.crawl.exclude[0]) : undefined,
        },
        (progress: CrawlProgress) => {
          spinner.text = `Crawling... ${progress.crawledPages}/${progress.totalPages} pages (${progress.currentUrl?.slice(0, 50)}...)`;
        },
      );

      if (!crawlResult.ok) {
        spinner.fail(chalk.red(`Crawl failed: ${crawlResult.error}`));
        process.exit(1);
      }

      const pages = crawlResult.value;
      spinner.text = `Analyzing ${pages.length} pages...`;

      // Analyze
      const ds = analyze(pages, url, config, startTime);

      spinner.text = 'Generating exports...';

      // Ensure output directory
      await mkdir(outputDir, { recursive: true });

      // Export
      const formats = (opts['format'] as OutputFormat[] | undefined) ?? config.output?.formats ?? listExportFormats();
      const allFiles: ExportFile[] = [];

      for (const fmt of formats) {
        if (fmt === 'all') {
          for (const f of listExportFormats()) {
            const exporter = getExporter(f);
            const result = exporter.export(ds);
            const files = Array.isArray(result) ? result : [result];
            allFiles.push(...files);
          }
        } else {
          const exporter = getExporter(fmt as OutputFormat);
          const result = exporter.export(ds);
          const files = Array.isArray(result) ? result : [result];
          allFiles.push(...files);
        }
      }

      // Write files
      for (const file of allFiles) {
        const filePath = join(outputDir, file.filename);
        await writeFile(filePath, file.content, 'utf-8');
      }

      // Download assets if requested
      if (opts['assets']) {
        spinner.text = 'Downloading assets...';
        const assetsDir = join(outputDir, 'assets');

        if (ds.assets.fonts.length > 0) {
          const fontDir = join(assetsDir, 'fonts');
          await downloadFonts(ds.assets.fonts, fontDir);
          const fontsCss = generateFontsCss(ds.assets.fonts);
          await writeFile(join(fontDir, 'fonts.css'), fontsCss, 'utf-8');
        }

        if (ds.assets.images.length > 0) {
          const imgDir = join(assetsDir, 'images');
          await downloadImages(ds.assets.images, imgDir);
          const manifest = generateImageManifest(ds.assets.images);
          await writeFile(join(imgDir, 'manifest.json'), manifest, 'utf-8');
        }

        if (ds.assets.icons.length > 0) {
          const iconDir = join(assetsDir, 'icons');
          await saveIcons(ds.assets.icons, iconDir);
        }
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      spinner.succeed(chalk.green(`Done in ${elapsed}s`));

      // Summary
      console.log('');
      console.log(chalk.bold('  Design System Summary'));
      console.log(chalk.dim('  ─────────────────────'));
      console.log(`  ${chalk.cyan(String(ds.colors.palette.length))} colors`);
      console.log(`  ${chalk.cyan(String(ds.typography.fontFamilies.length))} font families`);
      console.log(`  ${chalk.cyan(String(ds.typography.fontSizes.length))} font sizes`);
      console.log(`  ${chalk.cyan(String(ds.spacing.length))} spacing values`);
      console.log(`  ${chalk.cyan(String(ds.shadows.length))} shadows`);
      console.log(`  ${chalk.cyan(String(ds.breakpoints.length))} breakpoints`);
      console.log(`  ${chalk.cyan(String(ds.components.length))} components`);
      console.log(`  ${chalk.cyan(String(ds.assets.icons.length))} icons`);
      console.log('');
      console.log(`  ${chalk.dim('Output:')} ${chalk.white(outputDir)}`);
      console.log(`  ${chalk.dim('Files:')} ${allFiles.map(f => f.filename).join(', ')}`);
      console.log('');

      // Open style guide if html format was exported
      if (formats.includes('html') && opts['open'] !== false) {
        try {
          const open = (await import('open')).default;
          await open(join(outputDir, 'style-guide.html'));
          console.log(chalk.dim('  Opened style-guide.html in your browser.'));
        } catch {
          // open is optional
        }
      }
    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// ── Preview command ───────────────────────────────────────

program
  .command('preview')
  .description('Quick preview — crawls a single page and opens the style guide')
  .argument('<url>', 'URL to preview')
  .action(async (url: string) => {
    const spinner = ora({ text: 'Peeking...', color: 'cyan' }).start();

    try {
      const result = await stylepeek(url, {
        crawl: { depth: 0, workers: 1 },
        output: { formats: ['html'] },
      });

      const htmlFile = result.exports.find(f => f.filename.endsWith('.html'));
      if (!htmlFile) {
        spinner.fail('No HTML output generated');
        process.exit(1);
      }

      const tmpDir = resolve('.stylepeek-preview');
      await mkdir(tmpDir, { recursive: true });
      const filePath = join(tmpDir, 'style-guide.html');
      await writeFile(filePath, htmlFile.content, 'utf-8');

      spinner.succeed('Style guide generated');

      try {
        const open = (await import('open')).default;
        await open(filePath);
        console.log(chalk.dim(`  Opened ${filePath}`));
      } catch {
        console.log(chalk.dim(`  Open ${filePath} in your browser`));
      }
    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// ── Diff command ──────────────────────────────────────────

program
  .command('diff')
  .description('Compare design systems from two URLs')
  .argument('<url1>', 'First URL')
  .argument('<url2>', 'Second URL')
  .option('-o, --output <dir>', 'Output directory', './stylepeek-diff')
  .action(async (url1: string, url2: string, opts: Record<string, unknown>) => {
    const spinner = ora({ text: 'Crawling first URL...', color: 'cyan' }).start();

    try {
      const sharedConfig: Partial<StylepeekConfig> = {
        crawl: { depth: 1, workers: 2 },
      };

      const r1 = await stylepeek(url1, sharedConfig);
      spinner.text = 'Crawling second URL...';
      const r2 = await stylepeek(url2, sharedConfig);

      spinner.text = 'Computing diff...';

      const diff = computeDiff(r1.designSystem, r2.designSystem);

      const outputDir = resolve(String(opts['output'] ?? './stylepeek-diff'));
      await mkdir(outputDir, { recursive: true });
      await writeFile(join(outputDir, 'diff.json'), JSON.stringify(diff, null, 2), 'utf-8');

      spinner.succeed('Diff complete');
      console.log(`  Output: ${outputDir}/diff.json`);

      // Print summary
      console.log('');
      console.log(chalk.bold('  Diff Summary'));
      console.log(`  Colors: ${chalk.green('+' + diff.colors.added)} ${chalk.red('-' + diff.colors.removed)} ${chalk.yellow('~' + diff.colors.changed)}`);
      console.log(`  Fonts: ${chalk.green('+' + diff.fonts.added)} ${chalk.red('-' + diff.fonts.removed)}`);
      console.log(`  Spacing: ${chalk.green('+' + diff.spacing.added)} ${chalk.red('-' + diff.spacing.removed)}`);
      console.log('');
    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// ── Config init command ───────────────────────────────────

program
  .command('init')
  .description('Create a default stylepeek.config.ts file')
  .action(async () => {
    const configPath = resolve('stylepeek.config.ts');

    if (existsSync(configPath)) {
      console.log(chalk.yellow('  stylepeek.config.ts already exists'));
      return;
    }

    const content = `import { defineConfig } from '@stylepeek/core';

export default defineConfig({
  crawl: {
    depth: 3,
    workers: 3,
    waitAfterLoad: 1000,
    headless: true,
    // include: ['https://example.com/.*'],
    // exclude: ['/admin/.*'],
  },
  extract: {
    minUsage: 2,
    groupSimilarColors: true,
    colorSimilarityThreshold: 5,
    detectComponents: true,
  },
  output: {
    formats: ['html', 'tailwind', 'css-vars', 'json'],
    dir: './stylepeek-output',
  },
  assets: {
    download: [],
    // download: ['fonts', 'images', 'icons'],
  },
});
`;

    await writeFile(configPath, content, 'utf-8');
    console.log(chalk.green('  Created stylepeek.config.ts'));
  });

// ── Formats command ───────────────────────────────────────

program
  .command('formats')
  .description('List all available export formats')
  .action(() => {
    console.log('');
    console.log(chalk.bold('  Available Export Formats'));
    console.log(chalk.dim('  ───────────────────────'));
    const descriptions: Record<string, string> = {
      html: 'Self-contained HTML style guide with visual previews',
      tailwind: 'Tailwind CSS configuration (tailwind.config.js)',
      'css-vars': 'CSS custom properties (:root variables)',
      'style-dict': 'Amazon Style Dictionary compatible tokens',
      figma: 'Figma Token Studio compatible tokens',
      json: 'Raw JSON dump of the full design system',
    };
    for (const fmt of listExportFormats()) {
      console.log(`  ${chalk.cyan(fmt.padEnd(20))} ${chalk.dim(descriptions[fmt] ?? '')}`);
    }
    console.log('');
  });

// ── Helpers ───────────────────────────────────────────────

async function resolveConfig(opts: Record<string, unknown>): Promise<StylepeekConfig> {
  let config: StylepeekConfig = {
    crawl: { ...DEFAULT_CONFIG.crawl },
    extract: { ...DEFAULT_CONFIG.extract },
    output: { ...DEFAULT_CONFIG.output },
  };

  // Load config file
  const configPath = opts['config'] as string | undefined;
  if (configPath) {
    try {
      const content = await readFile(resolve(configPath), 'utf-8');
      const parsed = parseConfig(JSON.parse(content));
      config = {
        crawl: { ...config.crawl, ...parsed.crawl },
        extract: { ...config.extract, ...parsed.extract },
        output: { ...config.output, ...parsed.output },
        assets: parsed.assets,
      };
    } catch {
      // Try import for TS/JS configs
      try {
        const mod = await import(resolve(configPath));
        const imported = mod.default ?? mod;
        config = {
          crawl: { ...config.crawl, ...imported.crawl },
          extract: { ...config.extract, ...imported.extract },
          output: { ...config.output, ...imported.output },
          assets: imported.assets ?? config.assets,
        };
      } catch {
        console.warn(chalk.yellow(`  Warning: Could not load config from ${configPath}`));
      }
    }
  }

  // Override with CLI options
  if (opts['depth']) config.crawl = { ...config.crawl, depth: Number(opts['depth']) };
  if (opts['workers']) config.crawl = { ...config.crawl, workers: Number(opts['workers']) };
  if (opts['wait']) config.crawl = { ...config.crawl, waitAfterLoad: Number(opts['wait']) };

  return config;
}

interface DiffSection {
  added: number;
  removed: number;
  changed: number;
  details: Array<{ type: 'added' | 'removed' | 'changed'; value: string }>;
}

interface DiffResult {
  url1: string;
  url2: string;
  colors: DiffSection;
  fonts: DiffSection;
  spacing: DiffSection;
}

function computeDiff(a: DesignSystem, b: DesignSystem): DiffResult {
  const colorsA = new Set(a.colors.palette.map(c => c.value.hex));
  const colorsB = new Set(b.colors.palette.map(c => c.value.hex));

  const fontsA = new Set(a.typography.fontFamilies.map(f => f.name));
  const fontsB = new Set(b.typography.fontFamilies.map(f => f.name));

  const spacingA = new Set(a.spacing.map(s => s.value));
  const spacingB = new Set(b.spacing.map(s => s.value));

  return {
    url1: a.meta.url,
    url2: b.meta.url,
    colors: buildDiffSection(colorsA, colorsB),
    fonts: buildDiffSection(fontsA, fontsB),
    spacing: buildDiffSection(spacingA, spacingB),
  };
}

function buildDiffSection(a: Set<string>, b: Set<string>): DiffSection {
  const details: DiffSection['details'] = [];
  let added = 0, removed = 0;

  for (const v of b) {
    if (!a.has(v)) {
      added++;
      details.push({ type: 'added', value: v });
    }
  }

  for (const v of a) {
    if (!b.has(v)) {
      removed++;
      details.push({ type: 'removed', value: v });
    }
  }

  return { added, removed, changed: 0, details };
}

program.parse();
