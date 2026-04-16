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
    headline: '19 Coolidge Families. Two Years of Complaints.',
    prompt: `Quiet residential street in Coolidge Arizona at dusk, modest single-story home with a driveway, small front yard, front porch with a single forgotten child's stuffed animal sitting on the step, desert landscaping, warm amber light from a single porch lamp, atmosphere of something gone wrong behind a normal door. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'maricopa-office-opening',
    headline: '21300 N John Wayne Pkwy. Now Open.',
    prompt: `Exterior of a modern Southwest professional office building at golden hour, Maricopa Professional Village architectural vibe, saguaro cactus landscaping, warm parking lot lights beginning to glow, clean glass entry doors, desert mountains in the distance, open for business feel. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'paws-claws-maricopa-sponsorship',
    headline: 'Pacana Park. Third Annual Paws & Claws.',
    prompt: `Pacana Park in Maricopa Arizona at golden hour, empty festival pavilion setup with string lights strung overhead, rows of wooden picnic tables, event tents implied by silhouettes on the grass field, saguaro cactus on the horizon, warm evening community atmosphere. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'watson-yuma-buckeye-intersection',
    headline: 'Watson & Yuma. The Pattern Is Structural.',
    prompt: `Busy suburban Arizona intersection at blue hour, wide four-lane crossing, traffic signal glowing amber mid-phase, Buckeye commercial strip architecture in the background, retail storefront silhouettes, palm trees, heat-shimmer atmosphere, vehicles queued at the red light. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'sr-347-i-10-interchange',
    headline: '25,000 Vehicles Per Day. One Merge.',
    prompt: `Arizona highway on-ramp merging into I-10 at dusk, bright amber overhead highway lights, converging lane lines funneling toward a narrow merge point, commercial truck taillights glowing red in the merge zone, desert mountain silhouettes, heavy rush-hour atmosphere, sky transitioning to blue hour. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'first-week-maricopa-sr-347-dispatch',
    headline: 'Four Days In. January 15. SR-347.',
    prompt: `SR-347 desert highway at dusk with stopped traffic ahead, red brake lights glowing in a long line into the distance, emergency vehicle amber flashing lights reflecting off the asphalt, saguaro cactus silhouettes on both sides of the road, somber melancholy mood, Arizona mountain horizon. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'arizona-uninsured-motorist-law',
    headline: 'One in Eight Drive Uninsured.',
    prompt: `Close-up of a damaged rear quarter panel of an Arizona-plated sedan inside a body shop bay, cracked tail light, amber work lamp casting light across the metal, loose insurance paperwork on a workbench in the soft background, industrial concrete floor, moody low lighting. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'suing-a-restaurant-in-arizona',
    headline: 'Slip. Object. Allergy. Poisoning.',
    prompt: `Restaurant kitchen at closing time, stainless steel prep counter with a single overhead service lamp casting warm light, wet tiled floor with a yellow wet-floor caution sign, pots hanging from a rack overhead, dark quiet atmosphere, a clipboard with an inspection form on the counter edge. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'flashbacks-after-arizona-car-crash',
    headline: '9% of Crash Survivors. One Symptom.',
    prompt: `Dim car dashboard view at night from driver's perspective, amber instrument cluster glow, rain reflections on the windshield, distant oncoming headlights creating a bright bloom in the glass, tight composition focused on steering wheel and speedometer, sensory tension. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'survivors-guilt-after-a-crash',
    headline: 'The 90% Carry This.',
    prompt: `Empty front passenger seat of a car at dusk, a folded jacket left behind on the seat, unbuckled seatbelt hanging loose, amber dashboard glow, quiet intimate composition, Arizona desert road softly visible through the windshield, heavy stillness. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'psychological-recovery-after-arizona-crash',
    headline: "The Crash Didn't End at the Scene.",
    prompt: `Therapist's office at golden hour, warm upholstered reading chair facing a window with soft blinds letting amber light through, small side table with a tissue box and a water glass, potted plant in the corner, Southwestern abstract art on the wall, atmosphere of a calm private recovery space. ${STYLE_SUFFIX}`,
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
