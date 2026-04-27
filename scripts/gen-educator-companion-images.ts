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

const STYLE = `Shot on Kodak Portra 400 film, shallow depth of field, cinematic composition, slight film grain. Color graded: deep navy blue in shadows, warm sienna in midtones, warm gold accent from ambient light sources only. High contrast, slightly desaturated, editorial magazine quality, documentary aesthetic. No text, no words, no letters, no numbers, no logos, no watermarks, no faces, no hands, no children, no minors, no school logos.`;

const LOGO = `/Users/taqticlaw/Projects/azlawnow/public/logos/logo-light-hz.png`;

function escapeXml(s: string) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); }
function wrapTitle(title: string, max = 28) {
  const words = title.split(' '); const lines: string[] = []; let cur = '';
  for (const w of words) { if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur.trim()); cur = w; } else cur = cur ? `${cur} ${w}` : w; }
  if (cur) lines.push(cur.trim()); return lines.slice(0, 3);
}

async function genImage(prompt: string, heroOut: string, ogOut: string, headline: string) {
  console.log(`Generating ${heroOut}...`);
  const r = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt,
    config: { numberOfImages: 1, aspectRatio: '16:9' },
  });
  const buf = Buffer.from(r.generatedImages![0].image!.imageBytes!, 'base64');
  await sharp(buf).resize(1200, 675, { fit: 'cover' }).webp({ quality: 88 }).toFile(heroOut);
  console.log(`  ${heroOut}`);

  const W = 1200, H = 630, PAD = 48;
  const base = await sharp(buf).resize(W, H, { fit: 'cover', position: 'center' }).toBuffer();
  const gradientSvg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1A1A1A" stop-opacity="0.2"/><stop offset="35%" stop-color="#1A1A1A" stop-opacity="0.45"/><stop offset="65%" stop-color="#1A1A1A" stop-opacity="0.75"/><stop offset="100%" stop-color="#1A1A1A" stop-opacity="0.92"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
  const accentSvg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="5" height="${H}" fill="#C23B22"/></svg>`);
  const lines = wrapTitle(headline);
  const fontSize = lines.length > 1 ? 46 : 52;
  const lineHeight = fontSize * 1.25;
  const titleY = H * 0.42;
  const tspans = lines.map((line, i) => `<tspan x="${PAD}" y="${titleY + i * lineHeight}">${escapeXml(line)}</tspan>`).join('');
  const titleSvg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><style>.t { font-family: Georgia, 'Times New Roman', serif; font-size: ${fontSize}px; font-weight: 700; }</style><text class="t" fill="#FFFFFF">${tspans}</text></svg>`);
  const logo = await sharp(LOGO).resize({ width: 220, withoutEnlargement: false }).toBuffer();
  const logoMeta = await sharp(logo).metadata();
  const logoH = logoMeta.height || 60;
  await sharp(base).composite([
    { input: gradientSvg, top: 0, left: 0 },
    { input: accentSvg, top: 0, left: 0 },
    { input: titleSvg, top: 0, left: 0 },
    { input: logo, top: H - logoH - PAD, left: PAD },
  ]).png({ compressionLevel: 9 }).toFile(ogOut);
  console.log(`  ${ogOut}`);
}

await genImage(
  `Wide-angle documentary photograph of a calm law-firm conference room interior at dusk. A tall stack of bound case files on a polished oak table, a single brass desk lamp throwing warm amber light, walls of leather-bound legal volumes in soft shadow, a tall vertical window with venetian blinds half drawn. The atmosphere is methodical legal preparation. ${STYLE}`,
  'public/images/heroes/lg-arizona-educator-misconduct-claims.webp',
  '/Users/taqticlaw/Projects/azlawnow/public/og/arizona-educator-misconduct-civil-claims.png',
  'Six Theories. Two Clocks. The Civil Claim Map.',
);

await genImage(
  `Wide-angle documentary photograph of a quiet kitchen table at evening. A handwritten notebook open with a pen resting on it, a coffee cup half full, a folded school district letter beside the notebook, soft warm lamp light from a side table, the rest of the room receding into shadow. The atmosphere is a parent sitting alone at the kitchen table making careful notes. ${STYLE}`,
  'public/images/heroes/cg-educator-harmed-my-child-arizona.webp',
  '/Users/taqticlaw/Projects/azlawnow/public/og/educator-harmed-my-child-arizona.png',
  'A Family Step-by-Step. Arizona Parents.',
);
