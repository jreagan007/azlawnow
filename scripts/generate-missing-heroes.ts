import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const NEG = 'No stock photo feel, no glossy surfaces, no gavels, no scales of justice, no identifiable faces, no text, no watermarks, no logos, no overly saturated colors.';

const prompts: Record<string, string> = {
  'school-abuse': `Kodak Portra 400 film photograph. Empty school hallway in Arizona. Fluorescent lights, lockers, linoleum floor. A single small backpack left on a bench outside a closed office door. Warm afternoon light from a window at the end of the hall. Still, quiet, unsettling. No children visible. Film grain texture. ${NEG}`,
  'practice-area-default': `Kodak Portra 400 film photograph. Arizona law office reception area at golden hour. Warm leather chairs, desert landscape painting on wall, potted palo verde on counter. No people. Clean, professional, welcoming. Film grain texture. ${NEG}`,
};

async function main() {
  for (const [slug, prompt] of Object.entries(prompts)) {
    console.log(`  Generating ${slug}...`);
    const r = await ai.models.generateImages({ model: 'imagen-4.0-generate-001', prompt, config: { numberOfImages: 1, aspectRatio: '16:9' } });
    const buf = Buffer.from(r.generatedImages![0].image!.imageBytes!, 'base64');
    await sharp(buf).resize(1200, 675, { fit: 'cover' }).webp({ quality: 88 }).toFile(`public/images/heroes/${slug}.webp`);
    console.log(`  ✓ public/images/heroes/${slug}.webp`);
  }
  console.log('Done.');
}

main().catch(console.error);
