/**
 * Generate OG images + card images for AZ Law Now
 * Uses Gemini Imagen 4 for documentary-style editorial photography
 * Then composites with Sharp: dark gradient + logo
 *
 * Usage: GEMINI_API_KEY=... npx tsx scripts/generate-og-images.ts
 * Or:    npx tsx scripts/generate-og-images.ts --slug index
 */

import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error('GEMINI_API_KEY not set');

const ai = new GoogleGenAI({ apiKey: API_KEY });

const STYLE_SUFFIX = `Shot on 35mm film, shallow depth of field, cinematic composition, slight film grain. Color graded: deep navy blue in shadows, warm sienna in midtones, warm gold accent from ambient light sources only. High contrast, slightly desaturated, editorial magazine quality, documentary aesthetic. No text, no words, no letters, no numbers, no logos, no watermarks, no people faces, no hands.`;

interface ImageSpec {
  slug: string;
  prompt: string;
  type: 'og' | 'card' | 'hero';
}

const specs: ImageSpec[] = [
  // Homepage + core
  { slug: 'index', type: 'og', prompt: `Arizona desert law office at golden hour, warm light through floor-to-ceiling windows, saguaro cactus visible through glass, modern reception desk with warm wood and leather chairs, potted desert plants, Southwest architectural details. ${STYLE_SUFFIX}` },
  { slug: 'about', type: 'og', prompt: `Empty consultation room in a Southwest office, two warm leather chairs facing each other across a small table, desert landscape visible through large windows, afternoon golden light, legal books on shelf. ${STYLE_SUFFIX}` },
  { slug: 'contact', type: 'og', prompt: `Arizona office entrance at dusk, warm interior light spilling through glass doors, desert landscaping, modern Southwest architecture, brass house numbers, welcoming. ${STYLE_SUFFIX}` },
  { slug: 'case-results', type: 'og', prompt: `Polished conference table with legal documents stacked neatly, brass pen, warm desk lamp casting golden light, Arizona landscape painting on wall in background. ${STYLE_SUFFIX}` },

  // Cluster hubs
  { slug: 'vehicle-crashes', type: 'og', prompt: `Wide Arizona highway at blue hour, fresh tire marks on asphalt, emergency vehicle amber lights reflecting in distance, saguaro silhouettes against fading sky, desert mountains on horizon. ${STYLE_SUFFIX}` },
  { slug: 'abuse-negligence', type: 'og', prompt: `Empty nursing home hallway at golden hour, wheelchair near window, warm light streaming in, hand rail along wall, clean but institutional, Arizona desert visible through window. ${STYLE_SUFFIX}` },
  { slug: 'other-claims', type: 'og', prompt: `Arizona commercial property exterior at dusk, wet sidewalk reflecting warm streetlights, caution tape caught on railing, suburban strip mall architecture, desert sky. ${STYLE_SUFFIX}` },
  { slug: 'investigations', type: 'og', prompt: `Newsroom desk with scattered data printouts, laptop showing spreadsheet data, warm desk lamp, coffee mug, Arizona map pinned to corkboard in background, investigative journalist workspace. ${STYLE_SUFFIX}` },

  // Content hubs
  { slug: 'resources', type: 'og', prompt: `Data analysis workspace, multiple printed charts and graphs on warm wooden desk, highlighter marks on documents, Arizona crash data reports, warm amber desk lamp, editorial research. ${STYLE_SUFFIX}` },
  { slug: 'legal-guides', type: 'og', prompt: `Arizona statute books on shelf with warm side lighting, brass bookend, legal notepad with pen, leather desk surface, warm afternoon light from window. ${STYLE_SUFFIX}` },
  { slug: 'client-guides', type: 'og', prompt: `Family kitchen table with medical paperwork organized in folder, insurance claim form, warm morning light, coffee mug, Arizona suburban home through window. ${STYLE_SUFFIX}` },

  // Locations
  { slug: 'buckeye', type: 'og', prompt: `Buckeye Arizona downtown at golden hour, wide desert road, small-town commercial buildings, saguaro cactus, Estrella Mountains in background, warm desert light. ${STYLE_SUFFIX}` },
  { slug: 'maricopa', type: 'og', prompt: `SR-347 highway near Maricopa Arizona at sunset, long straight desert road, agricultural fields on sides, dust in amber light, distant city development. ${STYLE_SUFFIX}` },
  { slug: 'goodyear', type: 'og', prompt: `Goodyear Arizona suburban intersection at blue hour, new development, wide boulevard with desert landscaping, Estrella foothills visible, warm streetlights. ${STYLE_SUFFIX}` },
  { slug: 'avondale', type: 'og', prompt: `Avondale Arizona residential street at golden hour, desert suburban homes, palm trees, school zone sign, warm evening light, family neighborhood feel. ${STYLE_SUFFIX}` },
  { slug: 'phoenix', type: 'og', prompt: `Phoenix Arizona skyline at blue hour from elevated perspective, Camelback Mountain silhouette, city lights beginning to glow, desert sky gradient. ${STYLE_SUFFIX}` },

  // Article cards
  { slug: 'i-10-crash-data-buckeye-goodyear', type: 'card', prompt: `I-10 freeway through Arizona desert at dusk, multiple lanes, truck traffic, amber highway lights, heat shimmer on asphalt, Buckeye exit sign area. ${STYLE_SUFFIX}` },
  { slug: 'arizona-car-accident-law', type: 'card', prompt: `Arizona Superior Court building columns at golden hour, carved stone facade, American flag, warm desert light on sandstone. ${STYLE_SUFFIX}` },
  { slug: 'car-accident-first-48-hours', type: 'card', prompt: `Car dashboard after an incident, rearview mirror reflecting amber hazard lights, Arizona desert road in background, evening. ${STYLE_SUFFIX}` },
  { slug: 'arizona-school-bus-seat-belts', type: 'card', prompt: `Empty school bus interior, rows of bench seats without seatbelts, warm afternoon Arizona light through windows, desert mountains visible outside. ${STYLE_SUFFIX}` },
  { slug: 'suing-school-district-arizona', type: 'card', prompt: `Arizona school district administration building exterior, government architecture, flagpole, warm afternoon light, desert landscaping. ${STYLE_SUFFIX}` },
  { slug: 'child-injured-at-school', type: 'card', prompt: `Empty school playground at golden hour, swing set casting long shadows, Arizona desert school campus, warm light. ${STYLE_SUFFIX}` },
  { slug: 'arizona-nursing-home-violations', type: 'card', prompt: `Nursing home facility exterior at dusk, institutional building, parking lot, wheelchair ramp, warm interior lights visible through windows, Arizona desert setting. ${STYLE_SUFFIX}` },
  { slug: 'arizona-elder-abuse-law', type: 'card', prompt: `Reading glasses on legal documents next to a cup of coffee, warm morning light, Arizona desert view through window, care facility paperwork. ${STYLE_SUFFIX}` },
  { slug: 'nursing-home-abuse-signs-reporting', type: 'card', prompt: `Empty nursing home room, adjustable bed, call button on nightstand, warm afternoon light through curtain, Arizona landscape outside. ${STYLE_SUFFIX}` },
  { slug: 'west-valley-dangerous-intersections', type: 'card', prompt: `Wide Arizona suburban intersection at dusk, crosswalk markings fading, traffic signal overhead, no sidewalks visible, West Valley sprawl. ${STYLE_SUFFIX}` },
  { slug: 'arizona-pedestrian-rights', type: 'card', prompt: `Crosswalk signal at an Arizona intersection, pedestrian walk sign illuminated, desert boulevard in background, warm streetlight glow. ${STYLE_SUFFIX}` },
  { slug: 'hit-by-car-walking-action-plan', type: 'card', prompt: `Arizona sidewalk at night, street reflections on wet pavement after rain, pedestrian crossing ahead sign, warm amber streetlights. ${STYLE_SUFFIX}` },
];

async function generateImage(spec: ImageSpec): Promise<Buffer> {
  console.log(`  Generating: ${spec.slug} (${spec.type})...`);

  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: spec.prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: '16:9',
    },
  });

  const image = response.generatedImages?.[0];
  if (!image?.image?.imageBytes) {
    throw new Error(`No image returned for ${spec.slug}`);
  }

  return Buffer.from(image.image.imageBytes, 'base64');
}

async function compositeOG(imageBuffer: Buffer, slug: string): Promise<void> {
  // Resize to OG dimensions
  const base = await sharp(imageBuffer)
    .resize(1200, 630, { fit: 'cover', position: 'center' })
    .toBuffer();

  // Create gradient overlay SVG
  const gradientSvg = Buffer.from(
    `<svg width="1200" height="630">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1A1A1A" stop-opacity="0.3"/>
        <stop offset="0.6" stop-color="#1A1A1A" stop-opacity="0.5"/>
        <stop offset="1" stop-color="#1A1A1A" stop-opacity="0.8"/>
      </linearGradient></defs>
      <rect width="1200" height="630" fill="url(#g)"/>
    </svg>`
  );

  // Resize logo
  const logo = await sharp('public/logos/logo-light-hz.png')
    .resize({ width: 260, withoutEnlargement: false })
    .toBuffer();
  const logoMeta = await sharp(logo).metadata();

  // Composite: base + gradient + logo bottom-left
  await sharp(base)
    .composite([
      { input: gradientSvg, blend: 'over' },
      { input: logo, top: 630 - (logoMeta.height || 30) - 36, left: 48 },
    ])
    .webp({ quality: 88 })
    .toFile(`public/og/${slug}.webp`);
}

async function processCard(imageBuffer: Buffer, slug: string): Promise<void> {
  await sharp(imageBuffer)
    .resize(800, 450, { fit: 'cover', position: 'center' })
    .webp({ quality: 88 })
    .toFile(`public/images/cards/${slug}.webp`);
}

async function main() {
  mkdirSync('public/og', { recursive: true });
  mkdirSync('public/images/cards', { recursive: true });

  // Check for --slug filter
  const slugFilter = process.argv.find(a => a.startsWith('--slug='))?.split('=')[1]
    || (process.argv.includes('--slug') ? process.argv[process.argv.indexOf('--slug') + 1] : null);

  const toProcess = slugFilter
    ? specs.filter(s => s.slug === slugFilter)
    : specs;

  console.log(`Generating ${toProcess.length} images with Gemini Imagen 4...\n`);

  for (const spec of toProcess) {
    try {
      const buffer = await generateImage(spec);

      if (spec.type === 'og') {
        await compositeOG(buffer, spec.slug);
        console.log(`  ✓ OG: public/og/${spec.slug}.webp`);
      } else if (spec.type === 'card') {
        await processCard(buffer, spec.slug);
        // Also generate an OG version for articles
        await compositeOG(buffer, spec.slug);
        console.log(`  ✓ Card: public/images/cards/${spec.slug}.webp`);
        console.log(`  ✓ OG:   public/og/${spec.slug}.webp`);
      }
    } catch (err: any) {
      console.error(`  ✗ FAILED: ${spec.slug} — ${err.message}`);
    }
  }

  console.log('\nDone.');
}

main();
