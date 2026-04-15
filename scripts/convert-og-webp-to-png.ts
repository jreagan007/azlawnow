/**
 * One-shot: convert every public/og/*.webp to PNG.
 *
 * Slack, LinkedIn, and iMessage don't reliably unfurl WebP OG images.
 * Facebook and X/Twitter handle WebP, but the lowest-common-denominator
 * format for social link previews is PNG. This script keeps the WebP
 * source files intact and writes PNG siblings.
 */

import { readdirSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
import sharp from 'sharp';

const OG_DIR = 'public/og';

async function run() {
  const files = readdirSync(OG_DIR).filter(f => f.endsWith('.webp'));
  console.log(`Converting ${files.length} WebP OG images to PNG...\n`);

  let converted = 0;
  let skipped = 0;
  for (const f of files) {
    const src = join(OG_DIR, f);
    const dst = join(OG_DIR, basename(f, extname(f)) + '.png');

    // Skip if PNG already exists and is newer.
    try {
      const srcStat = statSync(src);
      const dstStat = statSync(dst);
      if (dstStat.mtimeMs >= srcStat.mtimeMs) {
        skipped++;
        continue;
      }
    } catch {
      // dst missing, proceed.
    }

    await sharp(src).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(dst);
    converted++;
    console.log(`  ${f} → ${basename(dst)}`);
  }

  console.log(`\nDone. ${converted} converted, ${skipped} skipped.`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
