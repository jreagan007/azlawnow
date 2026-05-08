/**
 * One-shot fix for the 6 legal-guide MDX files referencing /og/ paths
 * with no file on disk. Composites brand-chrome OG (sienna stripe + navy
 * gradient + serif headline + light logo) over the existing hero webp.
 */
import sharp from 'sharp';
import { mkdirSync } from 'fs';

const LOGO = '/Users/taqticlaw/Projects/azlawnow/public/logos/logo-light-hz.png';
const OG_DIR = '/Users/taqticlaw/Projects/azlawnow/public/og';
mkdirSync(OG_DIR, { recursive: true });

const TARGETS = [
  { slug: 'arizona-drowsy-driving-law',   headline: 'Arizona Drowsy Driving Law: HOS + Liability' },
  { slug: 'arizona-hit-and-run-law',      headline: 'Arizona Hit-and-Run Law: ARS 28-661 to 665' },
  { slug: 'arizona-pedestrian-law',       headline: 'Arizona Pedestrian Law: ARS 28-790 to 797' },
  { slug: 'arizona-truck-accident-law',   headline: 'Arizona Truck Accident Law: FMCSA + Liability' },
  { slug: 'arizona-wrong-way-crash-law',  headline: 'AZ Wrong-Way Crash Law: DUI + Dram Shop' },
  { slug: 'arizona-wrongful-death-statute', headline: 'Arizona Wrongful Death: ARS 12-611 to 613' },
];

const W = 1200, H = 630, PAD = 48;

function escapeXml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
function wrapTitle(title: string, max = 28): string[] {
  const words = title.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur.trim()); cur = w; }
    else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur.trim());
  return lines.slice(0, 3);
}

const gradientSvg = Buffer.from(
  `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1A1A1A" stop-opacity="0.2"/><stop offset="35%" stop-color="#1A1A1A" stop-opacity="0.45"/><stop offset="65%" stop-color="#1A1A1A" stop-opacity="0.75"/><stop offset="100%" stop-color="#1A1A1A" stop-opacity="0.92"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`
);
const accentSvg = Buffer.from(
  `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="5" height="${H}" fill="#C23B22"/></svg>`
);

const logo = await sharp(LOGO).resize({ width: 220, withoutEnlargement: false }).toBuffer();
const logoMeta = await sharp(logo).metadata();
const logoH = logoMeta.height || 60;

for (const { slug, headline } of TARGETS) {
  const HERO = `/Users/taqticlaw/Projects/azlawnow/public/images/heroes/lg-${slug}.webp`;
  const OUT = `${OG_DIR}/${slug}.png`;
  const base = await sharp(HERO).resize(W, H, { fit: 'cover', position: 'center' }).toBuffer();
  const lines = wrapTitle(headline);
  const fontSize = lines.length > 1 ? 46 : 52;
  const lineHeight = fontSize * 1.25;
  const titleY = H * 0.42;
  const tspans = lines.map((line, i) => `<tspan x="${PAD}" y="${titleY + i * lineHeight}">${escapeXml(line)}</tspan>`).join('');
  const titleSvg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><style>.t { font-family: Georgia, 'Times New Roman', serif; font-size: ${fontSize}px; font-weight: 700; }</style><text class="t" fill="#FFFFFF">${tspans}</text></svg>`
  );
  await sharp(base).composite([
    { input: gradientSvg, top: 0, left: 0 },
    { input: accentSvg, top: 0, left: 0 },
    { input: titleSvg, top: 0, left: 0 },
    { input: logo, top: H - logoH - PAD, left: PAD },
  ]).png({ compressionLevel: 9 }).toFile(OUT);
  console.log(`  ${slug.padEnd(40)} -> ${OUT}`);
}
