/**
 * Playwright-based website crawler.
 * Crawls pages up to a configured depth, extracting design data from each page.
 */

import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import pLimit from 'p-limit';
import pRetry from 'p-retry';
import type {
  CrawlOptions,
  CrawlProgress,
  CrawlProgressCallback,
  RawPageData,
  RawCssRule,
  RawComputedStyle,
  RawFontFace,
  RawSvgElement,
  RawMediaQuery,
  Result,
} from '../types/index.js';
import { ok, err } from '../types/index.js';
import { extractPageData, type SerializablePageData } from './extract-script.js';

/** Default crawl options */
const DEFAULTS: Omit<CrawlOptions, 'url'> = {
  depth: 2,
  workers: 3,
  waitAfterLoad: 1000,
  headless: true,
  ignoreTls: false,
};

/**
 * Crawl a website and extract raw page data from all discovered pages.
 *
 * @param options - Crawl configuration
 * @param onProgress - Optional callback for progress updates
 * @returns Array of raw page data from each crawled page
 */
export async function crawlSite(
  options: Partial<CrawlOptions> & { url: string },
  onProgress?: CrawlProgressCallback,
): Promise<Result<RawPageData[]>> {
  const opts: CrawlOptions = { ...DEFAULTS, ...options };
  const baseUrl = new URL(opts.url);
  const visited = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [{ url: opts.url, depth: 0 }];
  const results: RawPageData[] = [];
  const limit = pLimit(opts.workers);
  let activeWorkers = 0;

  let browser: Browser | undefined;

  try {
    browser = await chromium.launch({
      headless: opts.headless,
      args: opts.ignoreTls ? ['--ignore-certificate-errors'] : [],
    });

    const contextOptions: Parameters<Browser['newContext']>[0] = {
      ignoreHTTPSErrors: opts.ignoreTls,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 stylepeek/0.1.0',
    };

    if (opts.proxy) {
      // Proxy must be set at browser-level in Playwright; inform users
      // For simplicity, pass via context extra HTTP headers instead
    }

    const context = await browser.newContext(contextOptions);

    // Set cookies if provided
    if (opts.cookie) {
      const cookies = parseCookieString(opts.cookie, baseUrl.hostname);
      await context.addCookies(cookies);
    }

    // Set custom headers if provided
    if (opts.header) {
      const [name, ...valueParts] = opts.header.split(':');
      if (name) {
        await context.setExtraHTTPHeaders({
          [name.trim()]: valueParts.join(':').trim(),
        });
      }
    }

    const emitProgress = () => {
      if (!onProgress) return;
      const tokens = aggregateTokenCounts(results);
      onProgress({
        totalPages: visited.size + queue.length,
        crawledPages: visited.size,
        currentUrl: queue[0]?.url ?? opts.url,
        activeWorkers,
        discoveredTokens: tokens,
      });
    };

    /**
     * Process a single page: navigate, extract data, discover links
     */
    const processPage = async (url: string, depth: number): Promise<void> => {
      const normalizedUrl = normalizeUrl(url);
      if (visited.has(normalizedUrl)) return;
      visited.add(normalizedUrl);

      activeWorkers++;
      emitProgress();

      try {
        const pageData = await pRetry(
          () => extractFromPage(context, url, opts.waitAfterLoad),
          {
            retries: 2,
            minTimeout: 500,
            onFailedAttempt: (error) => {
              if (error.retriesLeft === 0) {
                // Give up silently
              }
            },
          },
        );

        if (pageData) {
          results.push(pageData);

          // Discover new links if we haven't reached max depth
          if (depth < opts.depth) {
            const newLinks = await discoverLinks(context, url, baseUrl, opts);
            for (const link of newLinks) {
              const normalized = normalizeUrl(link);
              if (!visited.has(normalized) && !queue.some((q) => normalizeUrl(q.url) === normalized)) {
                queue.push({ url: link, depth: depth + 1 });
              }
            }
          }
        }
      } catch {
        // Skip pages that fail
      } finally {
        activeWorkers--;
        emitProgress();
      }
    };

    // Process queue with concurrency limit
    while (queue.length > 0) {
      const batch = queue.splice(0, opts.workers);
      const tasks = batch.map((item) =>
        limit(() => processPage(item.url, item.depth)),
      );
      await Promise.all(tasks);
    }

    await context.close();
    await browser.close();

    return ok(results);
  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // ignore
      }
    }
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Extract design data from a single page.
 */
async function extractFromPage(
  context: BrowserContext,
  url: string,
  waitAfterLoad: number,
): Promise<RawPageData | null> {
  let page: Page | undefined;

  try {
    page = await context.newPage();

    // Navigate with timeout
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Extra wait for JS-heavy pages
    if (waitAfterLoad > 0) {
      await page.waitForTimeout(waitAfterLoad);
    }

    // Execute extraction script in-page
    const data: SerializablePageData = await page.evaluate(extractPageData);

    await page.close();

    return serializableToRawPageData(data);
  } catch {
    if (page) {
      try {
        await page.close();
      } catch {
        // ignore
      }
    }
    return null;
  }
}

/**
 * Discover internal links on a page.
 */
async function discoverLinks(
  context: BrowserContext,
  url: string,
  baseUrl: URL,
  opts: CrawlOptions,
): Promise<string[]> {
  let page: Page | undefined;

  try {
    page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]'))
        .map((a) => (a as HTMLAnchorElement).href)
        .filter((href) => href.startsWith('http'));
    });

    await page.close();

    return links.filter((link) => {
      try {
        const linkUrl = new URL(link);
        // Only follow same-origin links
        if (linkUrl.origin !== baseUrl.origin) return false;

        // Apply include/exclude filters
        if (opts.include && !opts.include.test(linkUrl.pathname)) return false;
        if (opts.exclude && opts.exclude.test(linkUrl.pathname)) return false;

        // Skip common non-page URLs
        const skip = /\.(pdf|zip|tar|gz|mp4|mp3|avi|mov|dmg|exe|msi)$/i;
        if (skip.test(linkUrl.pathname)) return false;

        return true;
      } catch {
        return false;
      }
    });
  } catch {
    if (page) {
      try {
        await page.close();
      } catch {
        // ignore
      }
    }
    return [];
  }
}

/**
 * Extract data from a single page URL (no crawling).
 */
export async function extractSinglePage(
  url: string,
  options?: {
    waitAfterLoad?: number;
    headless?: boolean;
    cookie?: string;
    header?: string;
    ignoreTls?: boolean;
  },
): Promise<Result<RawPageData>> {
  const result = await crawlSite({
    url,
    depth: 0,
    workers: 1,
    waitAfterLoad: options?.waitAfterLoad ?? 1000,
    headless: options?.headless ?? true,
    cookie: options?.cookie,
    header: options?.header,
    ignoreTls: options?.ignoreTls ?? false,
  });

  if (!result.ok) return result;
  if (result.value.length === 0) {
    return err(new Error(`Failed to extract data from ${url}`));
  }
  return ok(result.value[0]!);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    // Remove trailing slash for consistency
    if (u.pathname.endsWith('/') && u.pathname.length > 1) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return url;
  }
}

function parseCookieString(
  cookieStr: string,
  domain: string,
): Array<{ name: string; value: string; domain: string; path: string }> {
  return cookieStr.split(';').map((pair) => {
    const [name, ...valueParts] = pair.trim().split('=');
    return {
      name: name?.trim() ?? '',
      value: valueParts.join('=').trim(),
      domain,
      path: '/',
    };
  }).filter((c) => c.name.length > 0);
}

function serializableToRawPageData(data: SerializablePageData): RawPageData {
  return {
    url: data.url,
    cssRules: data.cssRules as RawCssRule[],
    customProperties: new Map(Object.entries(data.customProperties)),
    computedStyles: data.computedStyles as RawComputedStyle[],
    fontFaces: data.fontFaces as RawFontFace[],
    imageUrls: data.imageUrls,
    svgElements: data.svgElements as RawSvgElement[],
    resourceUrls: data.resourceUrls,
    mediaQueries: data.mediaQueries as RawMediaQuery[],
    classNames: data.classNames,
  };
}

function aggregateTokenCounts(pages: RawPageData[]) {
  const colors = new Set<string>();
  const fontFamilies = new Set<string>();
  const fontSizes = new Set<string>();
  const spacingValues = new Set<string>();
  const borderRadii = new Set<string>();
  const shadows = new Set<string>();
  const breakpoints = new Set<string>();
  const components = new Set<string>();

  for (const page of pages) {
    for (const rule of page.cssRules) {
      for (const [prop, value] of Object.entries(rule.properties)) {
        if (['color', 'background-color', 'border-color'].includes(prop)) {
          colors.add(value);
        }
        if (prop === 'font-family') fontFamilies.add(value);
        if (prop === 'font-size') fontSizes.add(value);
        if (['margin', 'padding', 'gap'].some((p) => prop.startsWith(p))) {
          spacingValues.add(value);
        }
        if (prop.includes('border-radius')) borderRadii.add(value);
        if (prop === 'box-shadow') shadows.add(value);
      }
    }
    for (const mq of page.mediaQueries) {
      breakpoints.add(mq.query);
    }
  }

  return {
    colors: colors.size,
    fontFamilies: fontFamilies.size,
    fontSizes: fontSizes.size,
    spacingValues: spacingValues.size,
    borderRadii: borderRadii.size,
    shadows: shadows.size,
    breakpoints: breakpoints.size,
    components: components.size,
  };
}
