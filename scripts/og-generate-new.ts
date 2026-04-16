/**
 * Generate branded OG images for the 11 new AZ Law Now articles.
 *
 * Each OG: 1200x630 PNG, Gemini-generated scenery base, dark gradient, left
 * vermillion accent bar, headline text, AZ Law Now logo bottom-left.
 *
 * Usage: node --env-file=/Users/jaredreagan/Projects/taqticscom/.env --experimental-strip-types /Users/jaredreagan/Projects/taqticscom/scripts/az-law-now-og-generate.ts
 */
import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error('GEMINI_API_KEY not set');

const AZ_ROOT = '/Users/jaredreagan/Projects/az-law-now';
const OG_DIR = join(AZ_ROOT, 'public/og');
const LOGO_PATH = join(AZ_ROOT, 'public/logos/logo-light-hz.png');
mkdirSync(OG_DIR, { recursive: true });

const ai = new GoogleGenAI({ apiKey: API_KEY });

const STYLE_SUFFIX = `Shot on 35mm film, shallow depth of field, cinematic composition, slight film grain. Color graded: deep navy blue in shadows, warm sienna in midtones, warm gold accent from ambient light sources only. High contrast, slightly desaturated, editorial magazine quality, documentary aesthetic. No text, no words, no letters, no numbers, no logos, no watermarks, no people faces, no hands.`;

type Spec = { slug: string; headline: string; prompt: string };

const specs: Spec[] = [
  {
    slug: 'coolidge-daycare-19-families-lawsuit',
    headline: '19 Families. One Daycare.',
    prompt: `Empty daycare playroom at dusk, scattered children's plastic toys on carpet, afternoon light filtering through closed blinds, small chairs arranged in a circle, warm lamp in corner, unsettling stillness. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'maricopa-office-opening',
    headline: 'We Opened in Maricopa.',
    prompt: `Modern southwestern office reception at golden hour, warm wood reception desk, glass entry doors, Arizona desert visible through large window, leather chairs, brass fixtures, welcoming professional atmosphere. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'paws-claws-maricopa-sponsorship',
    headline: 'Community Comes First.',
    prompt: `Community park at dusk, wooden pavilion, string lights overhead, empty picnic tables, desert landscaping, festival tents in distance, saguaro cactus silhouette, warm evening glow. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'watson-yuma-buckeye-intersection',
    headline: "Buckeye's Busiest Crossing.",
    prompt: `Busy Arizona commercial intersection at blue hour, traffic signal lights glowing amber, wide asphalt lanes, commercial retail signage in background, palm trees lining the road, heat shimmer, desert sky gradient. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'sr-347-i-10-interchange',
    headline: "Maricopa's Daily Choke Point.",
    prompt: `Highway interchange at dusk, merging lane markings converging, amber overhead highway lights, desert mountain silhouettes, commercial truck taillights in distance, slight atmospheric haze. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'first-week-maricopa-sr-347-dispatch',
    headline: 'A Sobering Welcome.',
    prompt: `Arizona SR-347 at sunset, two-lane desert highway stretching to the horizon, mountains in distance, empty road, amber sky, melancholy quiet, no vehicles. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'arizona-uninsured-motorist-law',
    headline: 'One in Eight Drive Uninsured.',
    prompt: `Arizona auto body shop interior at dusk, damaged front fender on a lift, scattered tools on workbench, warm work lamp casting amber light, industrial concrete floor, grease-darkened steel. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'suing-a-restaurant-in-arizona',
    headline: 'Four Ways a Restaurant Can Hurt You.',
    prompt: `Empty restaurant dining room after closing, dim warm pendant lighting, tables set with folded napkins, dark hardwood floor reflecting amber light, elegant interior, wine bottles on shelf in background. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'flashbacks-after-arizona-car-crash',
    headline: "It's Not a Memory. It's a Symptom.",
    prompt: `Bedroom at night with moonlight through venetian blinds casting striped shadows, empty unmade bed, alarm clock glowing amber on nightstand, water glass, introspective quiet atmosphere. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'survivors-guilt-after-a-crash',
    headline: 'The Weight of Having Lived.',
    prompt: `Empty passenger car seat at dusk, unbuckled seatbelt hanging loose, dashboard dimly glowing amber, rearview mirror, windshield showing desert road disappearing into distance, quiet intimate stillness. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'psychological-recovery-after-arizona-crash',
    headline: "The Crash Didn't End at the Scene.",
    prompt: `Therapy office at golden hour, warm upholstered armchair, tissue box on small side table, potted plant in corner, soft amber light through blinds, calm healing space, wooden floor, Southwestern art on wall. ${STYLE_SUFFIX}`,
  },
];

// ---------- Helpers ----------
function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function wrapTitle(title: string, maxPerLine = 28): string[] {
  const words = title.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxPerLine && cur) {
      lines.push(cur.trim());
      cur = w;
    } else {
      cur = cur ? `${cur} ${w}` : w;
    }
  }
  if (cur) lines.push(cur.trim());
  return lines.slice(0, 3);
}

async function generateImage(spec: Spec): Promise<Buffer> {
  const resp = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: spec.prompt,
    config: { numberOfImages: 1, aspectRatio: '16:9' },
  });
  const img = resp.generatedImages?.[0]?.image?.imageBytes;
  if (!img) throw new Error(`No image bytes for ${spec.slug}`);
  return Buffer.from(img, 'base64');
}

async function compositeOG(imageBuffer: Buffer, spec: Spec): Promise<void> {
  const W = 1200, H = 630, PAD = 48;

  const base = await sharp(imageBuffer).resize(W, H, { fit: 'cover', position: 'center' }).toBuffer();

  const gradientSvg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1A1A1A" stop-opacity="0.2"/>
        <stop offset="35%" stop-color="#1A1A1A" stop-opacity="0.45"/>
        <stop offset="65%" stop-color="#1A1A1A" stop-opacity="0.75"/>
        <stop offset="100%" stop-color="#1A1A1A" stop-opacity="0.92"/>
      </linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`,
  );

  const accentSvg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="5" height="${H}" fill="#C23B22"/>
    </svg>`,
  );

  const lines = wrapTitle(spec.headline);
  const fontSize = lines.length > 1 ? 46 : 52;
  const lineHeight = fontSize * 1.25;
  const titleY = H * 0.42;
  const tspans = lines.map((line, i) =>
    `<tspan x="${PAD}" y="${titleY + i * lineHeight}">${escapeXml(line)}</tspan>`,
  ).join('');

  const titleSvg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <style>.t { font-family: Georgia, 'Times New Roman', serif; font-size: ${fontSize}px; font-weight: 700; }</style>
      <text class="t" fill="#FFFFFF">${tspans}</text>
    </svg>`,
  );

  const logo = await sharp(LOGO_PATH).resize({ width: 220, withoutEnlargement: false }).toBuffer();
  const logoMeta = await sharp(logo).metadata();
  const logoH = logoMeta.height || 60;

  await sharp(base)
    .composite([
      { input: gradientSvg, top: 0, left: 0 },
      { input: accentSvg, top: 0, left: 0 },
      { input: titleSvg, top: 0, left: 0 },
      { input: logo, top: H - logoH - PAD, left: PAD },
    ])
    .png({ compressionLevel: 9 })
    .toFile(join(OG_DIR, `${spec.slug}.png`));
}

(async () => {
  console.log(`Generating ${specs.length} branded OG images...`);
  let ok = 0;
  for (const spec of specs) {
    try {
      const target = join(OG_DIR, `${spec.slug}.png`);
      if (existsSync(target) && !process.argv.includes('--force')) {
        console.log(`  - ${spec.slug} (exists, skipping — pass --force to regenerate)`);
        ok++;
        continue;
      }
      const buf = await generateImage(spec);
      await compositeOG(buf, spec);
      console.log(`  ✓ ${spec.slug}`);
      ok++;
    } catch (err: any) {
      console.error(`  ✗ ${spec.slug}  —  ${err.message}`);
    }
  }
  console.log(`\nDone: ${ok}/${specs.length}`);
})();
