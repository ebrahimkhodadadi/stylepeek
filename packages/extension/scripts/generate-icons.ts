/**
 * Generate PNG icons from the master SVG at all required sizes.
 * Usage: npx tsx scripts/generate-icons.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

async function main() {
  const sizes = [16, 32, 48, 128];
  const svgSource = readFileSync(join(root, 'src/icons/drop.svg'), 'utf-8');
  const outDir = join(root, 'icons');
  mkdirSync(outDir, { recursive: true });

  // Try sharp first, fall back to resvg
  let renderSvg: (svg: string, size: number) => Promise<Buffer>;

  try {
    const sharp = (await import('sharp')).default;
    renderSvg = async (svg: string, size: number) => {
      return sharp(Buffer.from(svg))
        .resize(size, size)
        .png()
        .toBuffer();
    };
    console.log('Using sharp for icon generation');
  } catch {
    try {
      const { Resvg } = await import('@aspect-dev/resvg');
      renderSvg = async (svg: string, size: number) => {
        const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
        const data = resvg.render();
        return Buffer.from(data.asPng());
      };
      console.log('Using @aspect-dev/resvg for icon generation');
    } catch {
      // Fallback: write inline minimal PNGs (1x1 purple pixel scaled)
      // Actually let's just generate simple canvas-based PNGs using Node canvas or just output SVGs
      console.log('No image library available. Writing SVG files as fallback.');
      for (const size of sizes) {
        const sized = svgSource
          .replace('viewBox="0 0 128 128"', `viewBox="0 0 128 128" width="${size}" height="${size}"`);
        writeFileSync(join(outDir, `icon-${size}.svg`), sized);
        console.log(`  ✓ icon-${size}.svg`);
      }
      return;
    }
  }

  for (const size of sizes) {
    const buf = await renderSvg(svgSource, size);
    writeFileSync(join(outDir, `icon-${size}.png`), buf);
    console.log(`  ✓ icon-${size}.png (${buf.length} bytes)`);
  }

  console.log('Done!');
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
