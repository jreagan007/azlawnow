// Generate branded 1080x1350 (4:5 vertical) IG cards for AZ Law Now posts.
// Reuses the brand pipeline: hero base + dark gradient + vermillion accent
// bar + headline + AZ Law Now logo. 4:5 is IG's max-real-estate format.
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';

const W = 1080, H = 1350, PAD = 56;
const LOGO = '/Users/taqticlaw/Projects/azlawnow/public/logos/logo-light-hz.png';
const OUT_DIR = '/Users/taqticlaw/Projects/azlawnow/public/ig';
mkdirSync(OUT_DIR, { recursive: true });

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
function wrap(t: string, max = 22): string[] {
  const words = t.split(' '); const lines: string[] = []; let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur.trim()); cur = w; } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur.trim());
  return lines.slice(0, 4);
}

interface Spec { slug: string; headline: string; eyebrow: string; source: string; }

const specs: Spec[] = [
  {
    slug: 'ig-buckeye-durango-yuma',
    headline: '26-Point Safety Gap. $1.4M Discount.',
    eyebrow: 'BUCKEYE — DURANGO + YUMA',
    source: '/Users/taqticlaw/Projects/azlawnow/public/images/heroes/dj-buckeye-durango-yuma.webp',
  },
  {
    slug: 'ig-mesa-elder-abuse-hb2228',
    headline: '60% Have Dementia. 30% Get Reported.',
    eyebrow: 'MESA — HB2228 IN THE SENATE',
    source: '/Users/taqticlaw/Projects/azlawnow/public/images/heroes/dj-grand-court-mesa-elder-abuse-hb2228.webp',
  },
  {
    slug: 'ig-fhwa-roundabout-data',
    headline: '46% Fewer Fatal & Serious Crashes.',
    eyebrow: 'FHWA DATA — WHAT BUCKEYE PASSED ON',
    source: '/Users/taqticlaw/Projects/azlawnow/public/images/heroes/dj-buckeye-durango-yuma.webp',
  },
  {
    slug: 'ig-buckeye-population',
    headline: '32.95% Growth in Four Years.',
    eyebrow: 'BUCKEYE — FASTEST-GROWING US CITY TIER',
    source: '/Users/taqticlaw/Projects/azlawnow/public/images/heroes/dj-buckeye-durango-yuma.webp',
  },
  {
    slug: 'ig-aps-hotline',
    headline: 'APS Hotline: 1-877-767-2385.',
    eyebrow: 'IF YOU SUSPECT ELDER ABUSE IN AZ',
    source: '/Users/taqticlaw/Projects/azlawnow/public/images/heroes/dj-grand-court-mesa-elder-abuse-hb2228.webp',
  },
];

async function build(spec: Spec) {
  const base = await sharp(spec.source).resize(W, H, { fit: 'cover', position: 'center' }).toBuffer();

  // Dark gradient: stronger at bottom for headline read
  const gradientSvg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1A1A1A" stop-opacity="0.15"/>
        <stop offset="40%" stop-color="#1A1A1A" stop-opacity="0.35"/>
        <stop offset="70%" stop-color="#1A1A1A" stop-opacity="0.78"/>
        <stop offset="100%" stop-color="#1A1A1A" stop-opacity="0.95"/>
      </linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`,
  );

  // Vermillion accent bar — left edge
  const accentSvg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="6" height="${H}" fill="#C23B22"/>
    </svg>`,
  );

  // Headline + eyebrow text in lower band
  const lines = wrap(spec.headline, 22);
  const headlineSize = lines.length > 2 ? 60 : 70;
  const headlineLh = headlineSize * 1.18;
  const headlineStartY = H - PAD - 110 - (lines.length - 1) * headlineLh;
  const headlineTspans = lines.map((line, i) =>
    `<tspan x="${PAD}" y="${headlineStartY + i * headlineLh}">${escape(line)}</tspan>`,
  ).join('');

  const textSvg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .eyebrow { font-family: 'SF Mono', 'Menlo', monospace; font-size: 22px; font-weight: 600; letter-spacing: 2.5px; }
        .headline { font-family: Georgia, 'Times New Roman', serif; font-size: ${headlineSize}px; font-weight: 700; }
      </style>
      <text class="eyebrow" fill="#D4943A" x="${PAD}" y="${headlineStartY - 32}">${escape(spec.eyebrow)}</text>
      <text class="headline" fill="#FFFFFF">${headlineTspans}</text>
    </svg>`,
  );

  // Logo bottom-left (smaller for square)
  const logo = await sharp(LOGO).resize({ width: 200, withoutEnlargement: false }).toBuffer();
  const logoMeta = await sharp(logo).metadata();
  const logoH = logoMeta.height || 50;

  await sharp(base)
    .composite([
      { input: gradientSvg, top: 0, left: 0 },
      { input: accentSvg, top: 0, left: 0 },
      { input: textSvg, top: 0, left: 0 },
      { input: logo, top: H - logoH - PAD + 40, left: PAD },
    ])
    .jpeg({ quality: 92 })
    .toFile(`${OUT_DIR}/${spec.slug}.jpg`);
  console.log(`  ✓ ${OUT_DIR}/${spec.slug}.jpg`);
}

console.log('Generating 5 branded IG cards (1080x1350 portrait)...');
for (const s of specs) await build(s);
console.log('Done.');
