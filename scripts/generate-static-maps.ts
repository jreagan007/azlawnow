/**
 * Generate branded static map images for AZ Law Now offices and locations
 *
 * Uses Google Maps Static API with Sunset Editorial styling:
 * - Headline Black (#1A1A1A) base
 * - Golden Hour gold roads
 * - Dusk Slate water
 * - Vermillion office markers
 * - Roads visible, POIs hidden, business labels off
 *
 * Usage:
 *   GOOGLE_MAPS_API_KEY=... npx tsx scripts/generate-static-maps.ts
 *
 * Requires: GOOGLE_MAPS_API_KEY in env
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!API_KEY) {
  console.error('GOOGLE_MAPS_API_KEY not set');
  process.exit(1);
}

const OUT_DIR = path.join(process.cwd(), 'public/images/maps');
fs.mkdirSync(OUT_DIR, { recursive: true });

// Sunset Editorial palette
const HEADLINE_BLACK = '0x1A1A1A';
const NEWSPRINT = '0xFAF5ED';
const GOLDEN_HOUR = '0xD4943A';
const SIENNA = '0x8B4513';
const VERMILLION = '0xC23B22';
const DUSK_SLATE = '0x4A5859';
const NEUTRAL_DARK = '0x2D2D2D';
const NEUTRAL_MID = '0x4A4A4A';

const MAP_WIDTH = 800;
const MAP_HEIGHT = 500;

// Sunset Editorial map style
const STYLES = [
  // Land base — dark
  { feature: 'all', element: 'geometry', rules: { color: HEADLINE_BLACK } },
  { feature: 'all', element: 'labels.text.fill', rules: { color: '0x6B6259' } },
  { feature: 'all', element: 'labels.text.stroke', rules: { color: HEADLINE_BLACK, weight: 2 } },
  // Land/landscape
  { feature: 'landscape', element: 'geometry', rules: { color: NEUTRAL_DARK } },
  { feature: 'landscape.man_made', element: 'geometry', rules: { color: '0x232323' } },
  // Water — slate
  { feature: 'water', element: 'geometry', rules: { color: DUSK_SLATE } },
  { feature: 'water', element: 'labels.text.fill', rules: { color: '0x8C8276' } },
  // Roads — gold
  { feature: 'road', element: 'geometry', rules: { color: '0x3a2e1c' } },
  { feature: 'road.highway', element: 'geometry', rules: { color: GOLDEN_HOUR } },
  { feature: 'road.highway', element: 'geometry.stroke', rules: { color: '0x6b4a1c' } },
  { feature: 'road.arterial', element: 'geometry', rules: { color: '0x6b4a1c' } },
  { feature: 'road.local', element: 'geometry', rules: { color: '0x4a3a1f' } },
  { feature: 'road', element: 'labels', rules: { visibility: 'off' } },
  // Parks
  { feature: 'poi.park', element: 'geometry', rules: { color: '0x1f2a1a' } },
  // Hide POIs and businesses
  { feature: 'poi', rules: { visibility: 'off' } },
  { feature: 'poi.business', rules: { visibility: 'off' } },
  { feature: 'transit', rules: { visibility: 'off' } },
  // Admin lines
  { feature: 'administrative', element: 'geometry.stroke', rules: { color: NEUTRAL_MID } },
  { feature: 'administrative.locality', element: 'labels.text.fill', rules: { color: '0x8C8276' } },
];

function encodeStyles(): string {
  return STYLES.map((s) => {
    let str = 'style=';
    if (s.feature) str += `feature:${s.feature}|`;
    if (s.element) str += `element:${s.element}|`;
    if (s.rules) {
      for (const [k, v] of Object.entries(s.rules)) {
        str += `${k}:${v}|`;
      }
    }
    return str.replace(/\|$/, '');
  }).join('&');
}

interface MapTarget {
  id: string;
  label: string;
  lat: number;
  lng: number;
  zoom: number;
}

const targets: MapTarget[] = [
  // Office locations (most zoomed in)
  { id: 'office-buckeye', label: 'Buckeye HQ', lat: 33.3702914, lng: -112.5801643, zoom: 15 },
  { id: 'office-maricopa', label: 'Maricopa', lat: 33.0736004, lng: -112.0445217, zoom: 15 },

  // Location pages (zoomed out for city overview)
  { id: 'buckeye', label: 'Buckeye', lat: 33.3702914, lng: -112.5801643, zoom: 12 },
  { id: 'maricopa', label: 'Maricopa', lat: 33.0736004, lng: -112.0445217, zoom: 12 },
  { id: 'goodyear', label: 'Goodyear', lat: 33.4355, lng: -112.3576, zoom: 12 },
  { id: 'avondale', label: 'Avondale', lat: 33.4356, lng: -112.3496, zoom: 12 },
  { id: 'phoenix', label: 'Phoenix', lat: 33.4484, lng: -112.0740, zoom: 11 },
];

function buildMapUrl(t: MapTarget): string {
  let url = 'https://maps.googleapis.com/maps/api/staticmap?';
  url += `center=${t.lat},${t.lng}`;
  url += `&zoom=${t.zoom}`;
  url += `&size=${MAP_WIDTH}x${MAP_HEIGHT}`;
  url += `&scale=2`;
  url += `&maptype=roadmap`;
  url += `&format=png`;
  url += `&key=${API_KEY}`;
  url += `&${encodeStyles()}`;

  // Vermillion marker at center
  url += `&markers=color:${VERMILLION}|size:mid|${t.lat},${t.lng}`;

  return url;
}

async function generateMap(t: MapTarget): Promise<void> {
  const url = buildMapUrl(t);
  console.log(`  Generating: ${t.id} (zoom ${t.zoom})...`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());

  // Convert to WebP
  const outFile = path.join(OUT_DIR, `${t.id}.webp`);
  await sharp(buf)
    .resize(MAP_WIDTH, MAP_HEIGHT, { fit: 'cover' })
    .webp({ quality: 88 })
    .toFile(outFile);

  const size = Math.round(fs.statSync(outFile).size / 1024);
  console.log(`  ✓ ${outFile} (${size}KB)`);
}

async function main() {
  console.log(`\nGenerating ${targets.length} branded static maps...\n`);
  let success = 0;
  let fail = 0;

  for (const t of targets) {
    try {
      await generateMap(t);
      success++;
    } catch (err: any) {
      console.error(`  ✗ ${t.id}: ${err.message}`);
      fail++;
    }
    // Rate limit
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\nDone. ${success} generated, ${fail} failed.\n`);
}

main().catch(console.error);
