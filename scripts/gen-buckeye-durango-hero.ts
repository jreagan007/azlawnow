// Generate hero + OG base for the Buckeye Durango/Yuma investigation.
// Pulls GEMINI_API_KEY from the shared ops .env.
import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';

// Load ops .env
const envFile = readFileSync('/Users/taqticlaw/Projects/taqtics-ops/config/.env', 'utf8');
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) throw new Error('GEMINI_API_KEY not set');
const ai = new GoogleGenAI({ apiKey: KEY });

const STYLE = `Shot on Kodak Portra 400 film, shallow depth of field, cinematic composition, slight film grain. Color graded: deep navy blue in shadows, warm sienna in midtones, warm gold accent from ambient light sources only. High contrast, slightly desaturated, editorial magazine quality, documentary aesthetic. No text, no words, no letters, no numbers, no logos, no watermarks, no people faces, no hands.`;

const PROMPT = `Wide-angle documentary photograph of a suburban arterial T-intersection in Buckeye, Arizona at golden hour just before dusk. Asphalt road meeting a perpendicular cross street, fresh lane striping, traffic signal mast arm with dark signal heads, clean concrete curbs, desert landscape on shoulders with palo verde and creosote, distant subdivision rooftops on the horizon, low-angle warm sunlight raking across the pavement. Empty intersection, no vehicles. Atmosphere: civic infrastructure quietly built, the consequence of a planning decision visible in the geometry. ${STYLE}`;

console.log('Generating hero...');
const r = await ai.models.generateImages({
  model: 'imagen-4.0-generate-001',
  prompt: PROMPT,
  config: { numberOfImages: 1, aspectRatio: '16:9' },
});
const buf = Buffer.from(r.generatedImages![0].image!.imageBytes!, 'base64');

await sharp(buf).resize(1200, 675, { fit: 'cover' }).webp({ quality: 88 }).toFile('public/images/heroes/dj-buckeye-durango-yuma.webp');
console.log('  ✓ public/images/heroes/dj-buckeye-durango-yuma.webp');

await sharp(buf).resize(1200, 630, { fit: 'cover' }).png({ quality: 90 }).toFile('public/og/buckeye-durango-yuma-roundabout-rejected.png');
console.log('  ✓ public/og/buckeye-durango-yuma-roundabout-rejected.png');
