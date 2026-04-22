// Hero + branded OG for the Grand Court of Mesa elder abuse investigation.
// Imagen 4.0 documentary aesthetic + brand composite (gradient + accent + headline + logo).
import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import { readFileSync } from 'fs';

const envFile = readFileSync('/Users/taqticlaw/Projects/taqtics-ops/config/.env', 'utf8');
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) throw new Error('GEMINI_API_KEY not set');
const ai = new GoogleGenAI({ apiKey: KEY });

const SLUG = 'grand-court-mesa-elder-abuse-hb2228';
const HEADLINE = '60% Have Dementia. 30% Get Reported.';

const STYLE = `Shot on Kodak Portra 400 film, shallow depth of field, cinematic composition, slight film grain. Color graded: deep navy blue in shadows, warm sienna in midtones, warm gold accent from ambient light sources only. High contrast, slightly desaturated, editorial magazine quality, documentary aesthetic. No text, no words, no letters, no numbers, no logos, no watermarks, no people faces, no hands.`;

const PROMPT = `Documentary photograph of an empty assisted-living facility hallway at dusk in Arizona. Long perpendicular hallway with handrails along both walls, closed resident-room doors with small placards beside each door, soft amber lighting from overhead recessed fixtures, polished vinyl floor, a single empty wheelchair sitting near a doorway in the middle distance, a service cart parked along one wall, atmosphere of institutional quiet after visiting hours. Late evening shadows. ${STYLE}`;

console.log('Generating hero...');
const r = await ai.models.generateImages({
  model: 'imagen-4.0-generate-001',
  prompt: PROMPT,
  config: { numberOfImages: 1, aspectRatio: '16:9' },
});
const buf = Buffer.from(r.generatedImages![0].image!.imageBytes!, 'base64');
await sharp(buf).resize(1200, 675, { fit: 'cover' }).webp({ quality: 88 }).toFile(`public/images/heroes/dj-${SLUG}.webp`);
console.log(`  ✓ public/images/heroes/dj-${SLUG}.webp`);

// Branded OG composite
const W = 1200, H = 630, PAD = 48;
const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
function wrap(t: string, max = 28): string[] {
  const words = t.split(' '); const lines: string[] = []; let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur.trim()); cur = w; } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur.trim()); return lines.slice(0, 3);
}
const base = await sharp(buf).resize(W, H, { fit: 'cover', position: 'center' }).toBuffer();
const gradientSvg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1A1A1A" stop-opacity="0.2"/><stop offset="35%" stop-color="#1A1A1A" stop-opacity="0.45"/><stop offset="65%" stop-color="#1A1A1A" stop-opacity="0.75"/><stop offset="100%" stop-color="#1A1A1A" stop-opacity="0.92"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
const accentSvg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="5" height="${H}" fill="#C23B22"/></svg>`);
const lines = wrap(HEADLINE);
const fontSize = lines.length > 1 ? 46 : 52;
const titleY = H * 0.42;
const tspans = lines.map((l, i) => `<tspan x="${PAD}" y="${titleY + i * fontSize * 1.25}">${escape(l)}</tspan>`).join('');
const titleSvg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><style>.t { font-family: Georgia, 'Times New Roman', serif; font-size: ${fontSize}px; font-weight: 700; }</style><text class="t" fill="#FFFFFF">${tspans}</text></svg>`);
const logo = await sharp('/Users/taqticlaw/Projects/azlawnow/public/logos/logo-light-hz.png').resize({ width: 220, withoutEnlargement: false }).toBuffer();
const logoMeta = await sharp(logo).metadata();
const logoH = logoMeta.height || 60;
await sharp(base).composite([
  { input: gradientSvg, top: 0, left: 0 },
  { input: accentSvg, top: 0, left: 0 },
  { input: titleSvg, top: 0, left: 0 },
  { input: logo, top: H - logoH - PAD, left: PAD },
]).png({ compressionLevel: 9 }).toFile(`public/og/${SLUG}.png`);
console.log(`  ✓ public/og/${SLUG}.png`);
