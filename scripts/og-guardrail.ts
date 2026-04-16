/**
 * OG image guardrail.
 * Detects bare/unbranded OG images by sampling the bottom-left 100x80 region
 * (where every branded composite has either the AZLAWNOW.COM wordmark or the
 * logo lockup on a dark gradient). A bare image will show bright/varied pixels
 * there instead of a uniform dark band.
 *
 * Exit 1 if any bare images found. Wire into CI to fail builds.
 *
 * Usage: npx tsx scripts/og-guardrail.ts
 */
import sharp from 'sharp';
import { readdirSync } from 'fs';
import { join } from 'path';

const OG_DIR = join(process.cwd(), 'public/og');

async function isBare(file: string): Promise<boolean> {
  const path = join(OG_DIR, file);
  const meta = await sharp(path).metadata();
  if (!meta.width || !meta.height) return false;

  // Sample bottom-left 120x100 region — branded images have dark gradient + branding here
  const sampleW = 120;
  const sampleH = 100;
  const left = 0;
  const top = meta.height - sampleH;

  const buf = await sharp(path)
    .extract({ left, top, width: sampleW, height: sampleH })
    .raw()
    .toBuffer();

  // Compute average brightness
  let sum = 0;
  const channels = meta.channels || 3;
  const px = buf.length / channels;
  for (let i = 0; i < buf.length; i += channels) {
    sum += (buf[i] + buf[i + 1] + buf[i + 2]) / 3;
  }
  const avg = sum / px;

  // Branded: bottom band has dark gradient overlay (avg < 80)
  // Bare: raw image, bottom shows whatever the photo has (typically > 80 for outdoor scenes)
  return avg > 80;
}

(async () => {
  const files = readdirSync(OG_DIR).filter((f) => f.endsWith('.png'));
  const bare: string[] = [];

  for (const f of files) {
    if (await isBare(f)) {
      bare.push(f);
      console.log(`  ✗ BARE  ${f}`);
    }
  }

  if (bare.length > 0) {
    console.error(`\n${bare.length} unbranded OG image(s) detected. Run the OG generator to add gradient + headline + logo overlay.`);
    process.exit(1);
  }
  console.log(`\n✓ All ${files.length} OG images have proper branding.`);
})();
