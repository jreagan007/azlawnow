/**
 * Batch 8: Generate hero + OG images for 6 new investigation articles
 * Uses Imagen 4 Standard for atmospheric editorial environments
 *
 * Usage: npx tsx scripts/generate-batch8-new-investigations.ts
 */

import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import 'dotenv/config';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error('GEMINI_API_KEY not set');

const ai = new GoogleGenAI({ apiKey: API_KEY });

const STYLE_SUFFIX = `Shot on 35mm film, shallow depth of field, cinematic composition, slight film grain. Color graded: deep navy blue in shadows, warm sienna in midtones, warm gold accent from ambient light sources only. High contrast, slightly desaturated, editorial magazine quality, documentary aesthetic. No text, no words, no letters, no numbers, no logos, no watermarks, no people faces, no hands, no identifiable faces.`;

interface ImageJob {
  slug: string;
  heroPrompt: string;
  ogPrompt: string;
}

const jobs: ImageJob[] = [
  {
    slug: 'ghost-fleets-chameleon-carriers-i10',
    heroPrompt: `Long-haul tractor trailer parked at Arizona desert truck stop at night, amber sodium vapor lights casting warm glow on chrome, DOT number plate on cab door partially visible but unreadable, desert darkness beyond the lot, heat shimmer on asphalt, freight corridor atmosphere. ${STYLE_SUFFIX}`,
    ogPrompt: `Row of semi trucks at Arizona truck stop at blue hour, amber running lights glowing, desert highway stretching into darkness, freight corridor, industrial scale, lonely isolated feeling. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'truck-crashes-maricopa-county-data',
    heroPrompt: `Arizona I-10 highway at dawn, long straight desert freeway, commercial truck convoy in distance creating dust haze, amber sun breaking over Estrella Mountains, freight corridor scale, empty lanes in foreground, asphalt texture. ${STYLE_SUFFIX}`,
    ogPrompt: `Wide Arizona interstate at sunrise, semi truck silhouette against amber sky, tire marks on highway surface, desert mountains on horizon, freight corridor atmosphere, cinematic scale. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'arizona-pedestrian-deaths-road-design',
    heroPrompt: `Wide Arizona arterial road at dusk, seven lanes, empty crosswalk markings fading on asphalt, no median refuge, distant streetlights just turning on, suburban strip mall architecture on both sides, long shadows, dangerous by design feeling. ${STYLE_SUFFIX}`,
    ogPrompt: `Arizona suburban stroad at twilight, wide multi-lane arterial with missing crosswalk, distant traffic lights, fading pedestrian markings on asphalt, harsh overhead lighting, empty sidewalk ending abruptly. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'fatigued-truckers-arizona-hos-data',
    heroPrompt: `Interior of semi truck cab at night on Arizona highway, amber dashboard lights, electronic logging device screen glowing, coffee cups on console, dark desert road through windshield, long-haul fatigue atmosphere, film noir lighting. ${STYLE_SUFFIX}`,
    ogPrompt: `Truck cab dashboard at night, ELD screen glowing amber, Arizona desert highway through windshield, dark sky, warm instrument panel lights, exhaustion atmosphere. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'hit-and-run-maricopa-county-data',
    heroPrompt: `Arizona arterial road at night after a crash, broken taillight debris scattered on asphalt, tire marks leading away, distant amber streetlight, empty road, suburban intersection, evidence left behind, dark and isolated. ${STYLE_SUFFIX}`,
    ogPrompt: `Dark Arizona road at night, scattered automotive debris on asphalt, skid marks, distant amber streetlight, empty intersection, no vehicles, aftermath feeling, urban arterial. ${STYLE_SUFFIX}`,
  },
  {
    slug: 'wrong-way-crashes-arizona-highways',
    heroPrompt: `Arizona freeway at night from overhead perspective, headlights approaching in the wrong direction on empty off-ramp, amber freeway lights in distance, thermal camera tower silhouette on pole, desert median, dark sky, ominous red reflectors on asphalt. ${STYLE_SUFFIX}`,
    ogPrompt: `Arizona highway off-ramp at night, single pair of headlights pointing the wrong direction, empty road curving into darkness, red reflectors on road surface, freeway lights in background, desert landscape, surveillance camera pole. ${STYLE_SUFFIX}`,
  },
];

async function generateImage(prompt: string, outputPath: string, width: number, height: number) {
  console.log(`  Generating ${outputPath}...`);
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt,
      config: { numberOfImages: 1, aspectRatio: width > height ? '16:9' : '1:1' },
    });

    if (!response.generatedImages?.[0]?.image?.imageBytes) {
      console.error(`  ✗ No image data returned for ${outputPath}`);
      return false;
    }

    const buf = Buffer.from(response.generatedImages[0].image.imageBytes, 'base64');
    await sharp(buf)
      .resize(width, height, { fit: 'cover' })
      .webp({ quality: 88 })
      .toFile(outputPath);

    console.log(`  ✓ ${outputPath}`);
    return true;
  } catch (err: any) {
    console.error(`  ✗ Failed: ${err.message}`);
    return false;
  }
}

async function main() {
  // Ensure directories exist
  const heroDir = 'public/images/heroes';
  const ogDir = 'public/og';
  if (!existsSync(heroDir)) mkdirSync(heroDir, { recursive: true });
  if (!existsSync(ogDir)) mkdirSync(ogDir, { recursive: true });

  console.log(`\nGenerating ${jobs.length} hero + OG image pairs...\n`);

  let success = 0;
  let failed = 0;

  for (const job of jobs) {
    // Hero image: 1200x675 (16:9)
    const heroPath = `${heroDir}/dj-${job.slug.replace(/.*-/, '').substring(0, 20)}.webp`;
    // Use the full slug for consistent naming
    const heroFile = `${heroDir}/dj-${job.slug.split('-').slice(0, 3).join('-')}.webp`;

    // Generate hero
    const heroOk = await generateImage(
      job.heroPrompt,
      `${heroDir}/dj-${job.slug}.webp`,
      1200,
      675
    );
    if (heroOk) success++; else failed++;

    // Generate OG (1200x630)
    const ogOk = await generateImage(
      job.ogPrompt,
      `${ogDir}/${job.slug}.webp`,
      1200,
      630
    );
    if (ogOk) success++; else failed++;

    // Rate limit: Imagen 4 Standard has limits
    console.log('  (waiting 3s for rate limit...)');
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`\nDone. ${success} generated, ${failed} failed.\n`);
}

main().catch(console.error);
