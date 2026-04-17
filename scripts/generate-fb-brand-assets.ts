/**
 * Generate FB profile picture + cover photo for AZ Law Now.
 * Uses BRAND-LOCKED ASSETS:
 *   - Cover base: arc-relief-office-v5 (kid hugging mom at reception, golden hour, cactus in frame)
 *   - Profile: actual logo-dark wordmark on Newsprint
 *   - Logo overlay (cover): actual logo-light wordmark on dark gradient
 *
 * Output: ~/Desktop/azlawnow-fb-{profile,cover}.png
 * Usage: npx tsx scripts/generate-fb-brand-assets.ts
 */

import sharp from 'sharp';
import { homedir } from 'os';
import { join } from 'path';

const OUT = join(homedir(), 'Desktop');
const BRAND = '/Users/jaredreagan/Projects/taqticscom/clients/az-law-now/brand/images';
const LOGOS = '/Users/jaredreagan/Projects/az-law-now/public/logos';
const FAVICONS = '/Users/jaredreagan/Projects/az-law-now/public/favicons';

// Brand colors
const NEWSPRINT = '#FAF5ED';
const BLACK = '#1A1A1A';
const VERMILLION = '#C23B22';
const GOLD = '#D4943A';
const WHITE = '#FFFFFF';

// ============== PROFILE 1024x1024 ==============
// Newsprint background + actual brand wordmark logo centered.
// FB displays as circle (~640px diameter visible). Safe zone for content
// inside the circle is ~720px diameter, so logo must stay well inside.
// Width 600px keeps comfortable padding from the circle edge.
async function buildProfile(): Promise<void> {
  // logo-light.png = BLACK wordmark intended for use on light backgrounds (Newsprint)
  const logoBuf = await sharp(`${LOGOS}/logo-light.png`)
    .resize({ width: 600, withoutEnlargement: false })
    .png()
    .toBuffer();
  const logoMeta = await sharp(logoBuf).metadata();
  const logoH = logoMeta.height ?? 140;
  const logoW = logoMeta.width ?? 720;

  // Build Newsprint canvas + center the wordmark
  const canvas = sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: NEWSPRINT,
    },
  });

  await canvas
    .composite([
      {
        input: logoBuf,
        top: Math.round((1024 - logoH) / 2),
        left: Math.round((1024 - logoW) / 2),
      },
    ])
    .png()
    .toFile(join(OUT, 'azlawnow-fb-profile.png'));

  console.log(`  ✓ ${join(OUT, 'azlawnow-fb-profile.png')}`);
}

// ============== COVER 1640x624 ==============
// Correct FB cover dimensions (was 1640x856 — wrong ratio).
// Mobile-safe zone: center 1080x624 (FB crops 280px each side on mobile).
// All logo + text MUST stay within x=280 to x=1360.
//
// Base: arc-relief-office-v5 (locked primary hero per brand spec).
// Bottom-up dark gradient for text legibility across photo width.
// Logo + tagline + phone all centered within mobile-safe zone.
async function buildCover(): Promise<void> {
  const W = 1640;
  const H = 624;
  const SAFE_LEFT = 280;   // mobile-safe left edge
  const SAFE_RIGHT = 1360; // mobile-safe right edge
  const SAFE_W = SAFE_RIGHT - SAFE_LEFT; // 1080

  // 1) Resize hero base to exact cover dimensions
  const photoBuf = await sharp(`${BRAND}/arc-relief-office-v5.png`)
    .resize(W, H, { fit: 'cover', position: 'center' })
    .png()
    .toBuffer();

  // 2) Bottom-up dark gradient — full width, transparent top → dark bottom for legibility
  const gradientSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <defs>
        <linearGradient id="darkfade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0F1314" stop-opacity="0"/>
          <stop offset="35%" stop-color="#0F1314" stop-opacity="0.20"/>
          <stop offset="70%" stop-color="#0F1314" stop-opacity="0.78"/>
          <stop offset="100%" stop-color="#0F1314" stop-opacity="0.93"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#darkfade)"/>
    </svg>
  `;

  // 3) Vermillion top accent bar (decorative, full-width is fine)
  const accentSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="6">
      <rect width="${W}" height="6" fill="${VERMILLION}"/>
    </svg>
  `;

  // 4) (Logo removed from cover per design call — profile picture carries the brand mark.)

  // 5) Headline + subhead + phone, all centered inside mobile-safe zone.
  // Use text-anchor="middle" so everything aligns to the safe-zone center (x=820).
  const CENTER = (SAFE_LEFT + SAFE_RIGHT) / 2; // 820
  const textSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <!-- Headline -->
      <text x="${CENTER}" y="380" text-anchor="middle" font-family="Cormorant Garamond" font-style="italic" font-weight="500" font-size="96" fill="#FAF5ED">You Get Answers.</text>
      <!-- Vermillion accent under headline -->
      <line x1="${CENTER - 110}" y1="408" x2="${CENTER + 110}" y2="408" stroke="${VERMILLION}" stroke-width="4" stroke-linecap="round"/>
      <!-- Subhead -->
      <text x="${CENTER}" y="460" text-anchor="middle" font-family="DM Sans" font-weight="400" font-size="26" fill="#FAF5ED" opacity="0.95">The firm that does the work before the case.</text>
      <!-- Bottom row: phone + trust + cities, all in safe zone -->
      <text x="${CENTER}" y="540" text-anchor="middle" font-family="DM Sans" font-weight="700" font-size="28" fill="#FAF5ED">(602) 654-0202  ·  azlawnow.com  ·  Free Consultation</text>
      <text x="${CENTER}" y="580" text-anchor="middle" font-family="DM Sans" font-weight="700" font-size="14" fill="${GOLD}" letter-spacing="2.5">BUCKEYE  ·  MARICOPA  ·  GOODYEAR  ·  AVONDALE  ·  PHOENIX  ·  MESA  ·  CHANDLER  ·  TEMPE  ·  SCOTTSDALE</text>
    </svg>
  `;

  await sharp(photoBuf)
    .composite([
      { input: Buffer.from(gradientSvg), top: 0, left: 0 },
      { input: Buffer.from(accentSvg), top: 0, left: 0 },
      { input: Buffer.from(textSvg), top: 0, left: 0 },
    ])
    .png()
    .toFile(join(OUT, 'azlawnow-fb-cover.png'));

  console.log(`  ✓ ${join(OUT, 'azlawnow-fb-cover.png')}`);
}

// ============== PROFILE ICON 1024x1024 ==============
// Cactus icon (black rounded square) centered on a white circle.
// FB crops the 1024x1024 square to a circle; the white disk sits flush
// against that crop so the final profile reads as a clean circular badge.
async function buildProfileIcon(): Promise<void> {
  const SIZE = 1024;
  const R = SIZE / 2;
  const ICON_W = 640; // cactus badge fits with comfortable breathing room

  const iconBuf = await sharp(`${FAVICONS}/favicon-source.png`)
    .resize({ width: ICON_W, withoutEnlargement: false })
    .png()
    .toBuffer();
  const iconMeta = await sharp(iconBuf).metadata();
  const iconH = iconMeta.height ?? ICON_W;
  const iconW = iconMeta.width ?? ICON_W;

  const circleSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
      <circle cx="${R}" cy="${R}" r="${R}" fill="${WHITE}"/>
    </svg>
  `;

  await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: Buffer.from(circleSvg), top: 0, left: 0 },
      {
        input: iconBuf,
        top: Math.round((SIZE - iconH) / 2),
        left: Math.round((SIZE - iconW) / 2),
      },
    ])
    .png()
    .toFile(join(OUT, 'azlawnow-fb-profile-icon.png'));

  console.log(`  ✓ ${join(OUT, 'azlawnow-fb-profile-icon.png')}`);
}

async function main() {
  const coverOnly = process.argv.includes('--cover');
  const profileOnly = process.argv.includes('--profile');
  const iconOnly = process.argv.includes('--icon');
  console.log('\nGenerating FB brand assets (locked relief hero + actual logo)...\n');
  if (iconOnly) {
    await buildProfileIcon();
  } else {
    if (!coverOnly) await buildProfile();
    if (!profileOnly) await buildCover();
  }
  console.log('\nDone.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
