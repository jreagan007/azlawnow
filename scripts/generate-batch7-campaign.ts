/**
 * Generate Batch 7: "You Get Answers" Campaign Images + Brendan Portrait
 * Output: /public/images/heroes/ as WebP
 *
 * Usage: GEMINI_API_KEY=... npx tsx scripts/generate-batch7-campaign.ts
 */

import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import 'dotenv/config';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error('GEMINI_API_KEY not set');

const ai = new GoogleGenAI({ apiKey: API_KEY });

const NEGATIVE = `No stock photo feel, no glossy surfaces, no corporate office interiors, no gavels, no scales of justice, no courtroom interiors, no identifiable faces, no text overlays, no watermarks, no logos, no overly saturated colors, no HDR processing, no digital sharpening artifacts.`;

interface ImageSpec {
  slug: string;
  prompt: string;
  width: number;
  height: number;
  aspect: '16:9';
}

const images: ImageSpec[] = [
  // Brendan Franks author environment portrait
  {
    slug: 'author-brendan-env',
    width: 1200, height: 675, aspect: '16:9',
    prompt: `Kodak Portra 400 film photograph. Investigative journalist workspace in Arizona. Desk covered with printed government data reports, ADOT crash statistics, highlighted spreadsheets. Cork board on wall with pushpins and printed maps. Warm desk lamp. Coffee mug. No person visible, just the workspace that tells the story of someone who digs. Warm afternoon light through window blinds. Film grain texture. ${NEGATIVE}`,
  },
  // YGA-1: Answered Phone
  {
    slug: 'yga-answered-phone',
    width: 1200, height: 675, aspect: '16:9',
    prompt: `Kodak Portra 400 film photograph. Close-up of a desk phone handset being lifted from its cradle by a hand. Warm morning office light. Legal pad and pen visible on desk. The moment of answering. Not a call center — a real office, a real person. No face visible. Warm tones. Film grain texture. ${NEGATIVE}`,
  },
  // YGA-2: The Yes Moment
  {
    slug: 'yga-yes-moment',
    width: 1200, height: 675, aspect: '16:9',
    prompt: `Kodak Portra 400 film photograph. Wide shot of two people's hands across a desk — one pushing a document forward, the other reaching to accept it. Warm side light. Legal pad, coffee cup, pen visible. The moment of saying yes to a case. Professional but human. No faces visible. Warm golden light. Film grain texture. ${NEGATIVE}`,
  },
  // YGA-3: Keys to Resolution
  {
    slug: 'yga-keys-resolution',
    width: 1200, height: 675, aspect: '16:9',
    prompt: `Kodak Portra 400 film photograph. A set of house keys and a signed document on a clean desk in warm light. Suggesting resolution, moving forward, getting what you came for. Shallow depth of field on the keys. Warm afternoon light through window blinds. Peace after the fight. No person visible. Film grain texture. ${NEGATIVE}`,
  },
  // YGA-4: West Valley Morning
  {
    slug: 'yga-west-valley-morning',
    width: 1200, height: 675, aspect: '16:9',
    prompt: `Kodak Portra 400 film photograph. Wide cinematic shot of suburban Buckeye Arizona at sunrise. Rooftops, desert landscaping, Estrella Mountains in the background. Sprinklers on a lawn. A neighborhood waking up. Safe, grounded, real. No people visible. Warm golden light. Film grain texture. ${NEGATIVE}`,
  },
];

async function generateImage(spec: ImageSpec): Promise<void> {
  console.log(`  Generating: ${spec.slug}...`);

  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: spec.prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: spec.aspect,
    },
  });

  const image = response.generatedImages?.[0];
  if (!image?.image?.imageBytes) {
    throw new Error(`No image returned for ${spec.slug}`);
  }

  const buffer = Buffer.from(image.image.imageBytes, 'base64');

  await sharp(buffer)
    .resize(spec.width, spec.height, { fit: 'cover', position: 'center' })
    .webp({ quality: 88 })
    .toFile(`public/images/heroes/${spec.slug}.webp`);

  console.log(`  ✓ public/images/heroes/${spec.slug}.webp`);
}

async function main() {
  mkdirSync('public/images/heroes', { recursive: true });

  console.log(`\nGenerating ${images.length} images (Batch 7 + Brendan portrait)...\n`);

  let success = 0, fail = 0;

  for (const spec of images) {
    try {
      await generateImage(spec);
      success++;
    } catch (err: any) {
      console.error(`  ✗ ${spec.slug}: ${err.message}`);
      fail++;
    }
  }

  console.log(`\nDone. ${success} generated, ${fail} failed.\n`);
}

main().catch(console.error);
