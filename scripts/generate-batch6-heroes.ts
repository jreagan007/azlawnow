/**
 * Generate Batch 6: Data Journalism Hero Images
 * Kodak Portra 400 editorial photography for Brendan's investigations
 * Output: /public/images/heroes/{slug}.webp at 1200x675
 *
 * Usage: npx tsx scripts/generate-batch6-heroes.ts
 */

import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import 'dotenv/config';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error('GEMINI_API_KEY not set');

const ai = new GoogleGenAI({ apiKey: API_KEY });

const NEGATIVE = `No stock photo feel, no glossy surfaces, no corporate office interiors, no gavels, no scales of justice, no courtroom interiors, no identifiable faces, no text overlays, no watermarks, no logos, no overly saturated colors, no HDR processing, no digital sharpening artifacts.`;

interface HeroSpec {
  slug: string;
  prompt: string;
}

const heroes: HeroSpec[] = [
  {
    slug: 'dj-i10-corridor',
    prompt: `Kodak Portra 400 film photograph. Wide shot of Interstate 10 through flat desert west of Phoenix near Buckeye Arizona. Semi-trucks in the distance. Heat shimmer rising from the highway surface. Midday harsh light. Power lines along the frontage road. No close-up vehicles. Vast, exposed, dangerous feel. The road stretches endlessly. Warm overexposed highlights. Film grain texture. ${NEGATIVE}`,
  },
  {
    slug: 'dj-sr347',
    prompt: `Kodak Portra 400 film photograph. Two-lane divided highway through flat Sonoran Desert between Maricopa and Chandler Arizona. Morning rush hour light. Cars in the distance creating a haze. Road surface showing patched asphalt and faded lane markings. No close-up people. Traffic signal visible at a distant intersection. The monotony and danger of a daily commute. Warm amber tones. Film grain texture. ${NEGATIVE}`,
  },
  {
    slug: 'dj-hazen-intersection',
    prompt: `Kodak Portra 400 film photograph. Rural four-way intersection in flat agricultural desert outside Buckeye Arizona. State highway crossing a local road. No traffic signals, just stop signs. Truck tire marks on pavement. Flat terrain with no visual barriers. Late afternoon light casting long shadows. The kind of intersection where you can't see what's coming. Isolated, unprotected. Film grain texture. ${NEGATIVE}`,
  },
  {
    slug: 'dj-pedestrian-crosswalk',
    prompt: `Kodak Portra 400 film photograph. Empty crosswalk at a busy suburban intersection at dusk. Faded paint on the crosswalk stripes. Streetlight casting orange glow. No pedestrians visible. A pair of shoes or a dropped grocery bag at the edge of the crosswalk suggesting someone was just here. Warm amber to deep blue sky gradient. Suburban West Phoenix setting. Film grain texture. ${NEGATIVE}`,
  },
  {
    slug: 'dj-nursing-citations',
    prompt: `Kodak Portra 400 film photograph. Long institutional hallway of a care facility. Fluorescent lighting mixing with natural window light from one side. Bulletin board on wall with papers pinned to it. Empty wheelchair at the far end. Linoleum floor reflecting light. Clinical but not sterile. The sense that something is being documented. Warm tones despite institutional setting. Film grain texture. ${NEGATIVE}`,
  },
  {
    slug: 'dj-school-bus-route',
    prompt: `Kodak Portra 400 film photograph. Yellow school bus driving down a quiet suburban street in Buckeye Arizona early morning. Long shadow of the bus stretching across the road. Desert landscaping in yards. No children visible. The bus is mid-route, in motion, slightly blurred. Warm golden morning light. The everyday routine that hides the risk. Film grain texture. ${NEGATIVE}`,
  },
  {
    slug: 'dj-motorcycle-helmet',
    prompt: `Kodak Portra 400 film photograph. Empty motorcycle helmet sitting on the shoulder of a desert highway. Road stretching into the distance. No rider, no bike. Just the helmet and the road. Late afternoon warm light. Saguaro cacti in the background. A still, heavy moment. Film grain texture. ${NEGATIVE}`,
  },
  {
    slug: 'dj-teravalis-construction',
    prompt: `Kodak Portra 400 film photograph. New housing construction in the desert west of Phoenix. Framed houses in various stages of completion. Dirt roads, construction equipment idle at golden hour. Desert mountains in the background. The scale of what's being built. No workers visible. Warm earth tones. Dust in the air catching light. Film grain texture. ${NEGATIVE}`,
  },
  {
    slug: 'dj-daycare-file',
    prompt: `Kodak Portra 400 film photograph. Close-up of a manila folder labeled with a handwritten tab, sitting on a desk next to a cup of coffee and reading glasses. Warm side light from a window. Papers slightly visible inside the folder. Professional, investigative mood. The story is in the paperwork. No person visible. Film grain texture. ${NEGATIVE}`,
  },
  {
    slug: 'dj-mediation-room',
    prompt: `Kodak Portra 400 film photograph. Empty conference room with a long wooden table, legal pads, and water glasses. Window showing Arizona afternoon light. Chairs pushed in, waiting. Professional but not intimidating. The room where things get resolved. No people. Warm tones. Film grain texture. ${NEGATIVE}`,
  },
  {
    slug: 'dj-dog-bite-fence',
    prompt: `Kodak Portra 400 film photograph. Close-up of a chain link fence gate in a suburban backyard in Arizona. "Beware of Dog" sign visible. Dry grass, afternoon shadows. No dog visible. No people. The gate is slightly ajar. Tension without showing the event. Warm muted tones. Film grain texture. ${NEGATIVE}`,
  },
  {
    slug: 'dj-buckeye-city-hall',
    prompt: `Kodak Portra 400 film photograph. Exterior of a small-city municipal building in the Sonoran Desert. American flag and Arizona flag on poles. Warm late afternoon light. Parking lot with a few vehicles. Clean, civic, local government feel. Desert landscaping around the entrance. No people visible. Warm earth tones. Film grain texture. ${NEGATIVE}`,
  },
];

async function generateHero(spec: HeroSpec): Promise<void> {
  console.log(`  Generating: ${spec.slug}...`);

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

  const buffer = Buffer.from(image.image.imageBytes, 'base64');

  await sharp(buffer)
    .resize(1200, 675, { fit: 'cover', position: 'center' })
    .webp({ quality: 88 })
    .toFile(`public/images/heroes/${spec.slug}.webp`);

  console.log(`  ✓ public/images/heroes/${spec.slug}.webp`);
}

async function main() {
  mkdirSync('public/images/heroes', { recursive: true });

  const slugFilter = process.argv.find(a => a.startsWith('--slug='))?.split('=')[1]
    || (process.argv.includes('--slug') ? process.argv[process.argv.indexOf('--slug') + 1] : null);

  const toProcess = slugFilter
    ? heroes.filter(s => s.slug === slugFilter)
    : heroes;

  console.log(`\nGenerating ${toProcess.length} Batch 6 hero images with Imagen 4...\n`);

  let success = 0, fail = 0;

  for (const spec of toProcess) {
    try {
      await generateHero(spec);
      success++;
    } catch (err: any) {
      console.error(`  ✗ ${spec.slug}: ${err.message}`);
      fail++;
    }
  }

  console.log(`\nDone. ${success} generated, ${fail} failed.\n`);
}

main().catch(console.error);
