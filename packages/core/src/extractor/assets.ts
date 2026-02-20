/**
 * Asset Extractor — downloads fonts, images, and extracts SVG icons.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import pLimit from 'p-limit';
import pRetry from 'p-retry';
import type {
  RawPageData,
  FontAsset,
  ImageAsset,
  IconAsset,
  Result,
} from '../types/index.js';
import { ok, err } from '../types/index.js';

const DOWNLOAD_CONCURRENCY = 5;

/**
 * Extract font asset metadata from raw page data.
 */
export function extractFontAssets(pages: RawPageData[]): FontAsset[] {
  const fontMap = new Map<string, FontAsset>();

  for (const page of pages) {
    // From @font-face declarations
    for (const ff of page.fontFaces) {
      const urls = extractUrlsFromSrc(ff.src);
      for (const url of urls) {
        const format = detectFontFormat(url);
        const key = `${ff.family}-${ff.weight ?? 'normal'}-${ff.style ?? 'normal'}-${format}`;

        if (!fontMap.has(key)) {
          fontMap.set(key, {
            family: ff.family,
            weight: ff.weight ?? '400',
            style: ff.style ?? 'normal',
            format,
            url,
            source: 'font-face',
          });
        }
      }
    }

    // From resource URLs (Google Fonts, Adobe Fonts)
    for (const url of page.resourceUrls) {
      if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
        const family = extractGoogleFontFamily(url);
        if (family && !fontMap.has(`google-${family}`)) {
          fontMap.set(`google-${family}`, {
            family,
            weight: '400',
            style: 'normal',
            format: 'unknown',
            url,
            source: 'google-fonts',
          });
        }
      }

      if (url.includes('use.typekit.net') || url.includes('typekit.com')) {
        if (!fontMap.has(`adobe-${url}`)) {
          fontMap.set(`adobe-${url}`, {
            family: 'Adobe Fonts',
            weight: '400',
            style: 'normal',
            format: 'unknown',
            url,
            source: 'adobe-fonts',
          });
        }
      }
    }
  }

  return Array.from(fontMap.values());
}

/**
 * Extract image asset metadata from raw page data.
 */
export function extractImageAssets(pages: RawPageData[]): ImageAsset[] {
  const imageMap = new Map<string, ImageAsset>();

  for (const page of pages) {
    for (const url of page.imageUrls) {
      if (imageMap.has(url)) continue;

      const format = detectImageFormat(url);
      const type = detectImageType(url, format);

      imageMap.set(url, {
        url,
        type,
        format,
      });
    }

    // CSS background images
    for (const rule of page.cssRules) {
      for (const [prop, value] of Object.entries(rule.properties)) {
        if (prop === 'background-image' || prop === 'background') {
          const urls = extractUrlsFromCssValue(value);
          for (const url of urls) {
            if (imageMap.has(url) || url.startsWith('data:')) continue;
            const format = detectImageFormat(url);
            imageMap.set(url, {
              url,
              type: 'background',
              format,
            });
          }
        }
      }
    }
  }

  return Array.from(imageMap.values());
}

/**
 * Extract SVG icon assets from raw page data.
 */
export function extractIconAssets(pages: RawPageData[]): IconAsset[] {
  const iconMap = new Map<string, IconAsset>();

  for (const page of pages) {
    for (const svg of page.svgElements) {
      // Use id or generate a name
      const name = svg.id || `icon-${iconMap.size + 1}`;
      const key = svg.html.slice(0, 200); // Dedupe by content prefix

      if (!iconMap.has(key)) {
        iconMap.set(key, {
          name,
          svg: svg.html,
          viewBox: svg.viewBox,
        });
      }
    }
  }

  return Array.from(iconMap.values());
}

/**
 * Download font files to the output directory.
 */
export async function downloadFonts(
  fonts: FontAsset[],
  outputDir: string,
): Promise<Result<FontAsset[]>> {
  const fontsDir = join(outputDir, 'fonts');
  await mkdir(fontsDir, { recursive: true });

  const limit = pLimit(DOWNLOAD_CONCURRENCY);
  const results: FontAsset[] = [];

  const tasks = fonts
    .filter((f) => f.url.startsWith('http'))
    .map((font) =>
      limit(async () => {
        try {
          const data = await pRetry(
            async () => {
              const response = await fetch(font.url);
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              return Buffer.from(await response.arrayBuffer());
            },
            { retries: 2, minTimeout: 500 },
          );

          const ext = fontFormatToExt(font.format);
          const filename = `${sanitizeFilename(font.family)}-${font.weight}-${font.style}${ext}`;
          const localPath = join(fontsDir, filename);

          await writeFile(localPath, data);

          results.push({ ...font, localPath });
        } catch {
          // Skip failed downloads
          results.push(font);
        }
      }),
    );

  await Promise.all(tasks);
  return ok(results);
}

/**
 * Download image files to the output directory.
 */
export async function downloadImages(
  images: ImageAsset[],
  outputDir: string,
  maxSize?: number,
): Promise<Result<ImageAsset[]>> {
  const imagesDir = join(outputDir, 'images');
  await mkdir(imagesDir, { recursive: true });

  const limit = pLimit(DOWNLOAD_CONCURRENCY);
  const results: ImageAsset[] = [];

  const tasks = images
    .filter((img) => img.url.startsWith('http'))
    .map((image) =>
      limit(async () => {
        try {
          const data = await pRetry(
            async () => {
              const response = await fetch(image.url);
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              return Buffer.from(await response.arrayBuffer());
            },
            { retries: 2, minTimeout: 500 },
          );

          // Skip oversized images
          if (maxSize && data.byteLength > maxSize) {
            results.push(image);
            return;
          }

          const urlPath = new URL(image.url).pathname;
          const filename = sanitizeFilename(basename(urlPath)) || `image-${results.length}.${image.format}`;
          const localPath = join(imagesDir, filename);

          await writeFile(localPath, data);

          results.push({
            ...image,
            size: data.byteLength,
            localPath,
          });
        } catch {
          results.push(image);
        }
      }),
    );

  await Promise.all(tasks);
  return ok(results);
}

/**
 * Save SVG icons to the output directory.
 */
export async function saveIcons(
  icons: IconAsset[],
  outputDir: string,
): Promise<Result<IconAsset[]>> {
  const iconsDir = join(outputDir, 'icons');
  await mkdir(iconsDir, { recursive: true });

  const results: IconAsset[] = [];

  for (const icon of icons) {
    try {
      const filename = `${sanitizeFilename(icon.name)}.svg`;
      const localPath = join(iconsDir, filename);
      await writeFile(localPath, icon.svg, 'utf-8');
      results.push({ ...icon, localPath });
    } catch {
      results.push(icon);
    }
  }

  return ok(results);
}

/**
 * Generate a fonts.css file with local @font-face declarations.
 */
export function generateFontsCss(fonts: FontAsset[]): string {
  const downloadedFonts = fonts.filter((f) => f.localPath);
  if (downloadedFonts.length === 0) return '';

  let css = '/* Generated by stylepeek — local font declarations */\n\n';

  for (const font of downloadedFonts) {
    const relativePath = `./fonts/${basename(font.localPath!)}`;
    css += `@font-face {\n`;
    css += `  font-family: '${font.family}';\n`;
    css += `  font-weight: ${font.weight};\n`;
    css += `  font-style: ${font.style};\n`;
    css += `  font-display: swap;\n`;
    css += `  src: url('${relativePath}') format('${font.format === 'unknown' ? 'woff2' : font.format}');\n`;
    css += `}\n\n`;
  }

  return css;
}

/**
 * Generate an image manifest JSON.
 */
export function generateImageManifest(images: ImageAsset[]): string {
  const manifest = images.map((img) => ({
    url: img.url,
    type: img.type,
    format: img.format,
    alt: img.alt,
    width: img.width,
    height: img.height,
    size: img.size,
    localPath: img.localPath ? basename(img.localPath) : undefined,
  }));

  return JSON.stringify(manifest, null, 2);
}

// ─── Helper Functions ───────────────────────────────────────────────────────

function extractUrlsFromSrc(src: string): string[] {
  const urls: string[] = [];
  const urlRegex = /url\(['"]?([^'")]+)['"]?\)/g;
  let match;

  while ((match = urlRegex.exec(src)) !== null) {
    if (match[1] && !match[1].startsWith('data:')) {
      urls.push(match[1]);
    }
  }

  return urls;
}

function extractUrlsFromCssValue(value: string): string[] {
  const urls: string[] = [];
  const urlRegex = /url\(['"]?([^'")]+)['"]?\)/g;
  let match;

  while ((match = urlRegex.exec(value)) !== null) {
    if (match[1]) urls.push(match[1]);
  }

  return urls;
}

function detectFontFormat(url: string): FontAsset['format'] {
  const ext = extname(new URL(url, 'https://x.com').pathname).toLowerCase();
  switch (ext) {
    case '.woff2': return 'woff2';
    case '.woff': return 'woff';
    case '.ttf': return 'ttf';
    case '.otf': return 'otf';
    default: return 'unknown';
  }
}

function fontFormatToExt(format: FontAsset['format']): string {
  switch (format) {
    case 'woff2': return '.woff2';
    case 'woff': return '.woff';
    case 'ttf': return '.ttf';
    case 'otf': return '.otf';
    default: return '.woff2';
  }
}

function detectImageFormat(url: string): string {
  try {
    const ext = extname(new URL(url, 'https://x.com').pathname).toLowerCase().replace('.', '');
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'ico', 'bmp'].includes(ext)
      ? ext
      : 'unknown';
  } catch {
    return 'unknown';
  }
}

function detectImageType(url: string, format: string): ImageAsset['type'] {
  if (format === 'svg') return 'icon';
  if (format === 'ico' || url.includes('favicon')) return 'favicon';
  if (url.includes('icon') || url.includes('logo')) return 'icon';
  return 'photo';
}

function extractGoogleFontFamily(url: string): string | null {
  try {
    const u = new URL(url);
    const family = u.searchParams.get('family');
    return family?.split(':')[0]?.replace(/\+/g, ' ') ?? null;
  } catch {
    return null;
  }
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}
