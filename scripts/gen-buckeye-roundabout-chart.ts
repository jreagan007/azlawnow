/**
 * AZ Law Now editorial chart — buckeye-durango-yuma-roundabout-rejected
 *
 * Master 1200x675 + 4 native social variants (IG square 1080, IG portrait 1080x1350,
 * FB feed 1200x630, X 1200x675).
 *
 * Style: Sunset Editorial palette from src/styles/theme.ts (cream + ink + vermillion).
 * Doctrine: TYNSKI-APPLIED.md (3 charts max, stat-leads-chart, kebab-case caption,
 * NYT Upshot / Pudding / 538 references).
 */
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { TOKENS, FONTS, SIZES, PATHS } from './lib/azlawnow-chart-tokens.js';

const SLUG = 'buckeye-durango-yuma-roundabout-rejected';
const CAPTION_SLUG = 'buckeye-durango-yuma-injury-crash-reduction-by-design-alternative';
const PUBLISH = 'May 6, 2026';
const BYLINE = 'Brendan Franks';
const OUTDIR = '/Users/taqticlaw/Projects/azlawnow/public/embeds';

// Bomb-stat data
type Bar = { label: string; tag: string; value: number; isHighlight: boolean };
const BARS: Bar[] = [
  { label: 'Roundabout (Alt 1)',     tag: 'REJECTED', value: 41.7, isHighlight: true  },
  { label: 'Signalized LILO (Alt 2)', tag: 'CHOSEN',   value: 15.4, isHighlight: false },
];
const X_MAX = 50;
const GAP_PT = 26.3;
const COST_GAP = '$1.4M';

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface Layout {
  W: number;
  H: number;
  SAFE: number;
  EYEBROW_Y: number;
  HEADLINE_Y: number;
  HEADLINE_2_Y: number;
  SUBDECK_Y?: number;
  CHART_TOP: number;
  CHART_BOTTOM: number;
  CHART_LEFT: number;
  CHART_RIGHT: number;
  BAR_H: number;
  CAPTION_Y: number;
  SOURCE_Y: number;
  BYLINE_Y: number;
  LOGO_W: number;
  LOGO_RIGHT: number;
  LOGO_BOTTOM: number;
  HEADLINE_SIZE: number;
  numeralSize: number;
  labelSize: number;
  showSubdeck: boolean;
}

function buildSvg(layout: Layout): string {
  const { W, H, SAFE, CHART_TOP, CHART_BOTTOM, CHART_LEFT, CHART_RIGHT, BAR_H, HEADLINE_SIZE, numeralSize, labelSize } = layout;
  const CHART_W = CHART_RIGHT - CHART_LEFT;
  const CHART_H = CHART_BOTTOM - CHART_TOP;
  const BAR_GAP = (CHART_H - BAR_H * BARS.length) / (BARS.length + 1);

  const xScale = (v: number) => CHART_LEFT + (v / X_MAX) * CHART_W;

  // X-axis ticks
  const ticks = [0, 10, 20, 30, 40, 50];
  const tickSvg = ticks.map(t => {
    const x = xScale(t);
    return `
      <line x1="${x}" y1="${CHART_TOP - 6}" x2="${x}" y2="${CHART_TOP - 1}" stroke="${TOKENS.hairline}" stroke-width="1"/>
      <text x="${x}" y="${CHART_TOP - 12}" font-family="${FONTS.mono}" font-size="${SIZES.micro}" fill="${TOKENS.slateLight}" text-anchor="middle">${t}%</text>
    `;
  }).join('');

  // Bars + labels
  const barSvg = BARS.map((b, i) => {
    const y = CHART_TOP + BAR_GAP * (i + 1) + BAR_H * i;
    const barWidth = xScale(b.value) - CHART_LEFT;
    const fill = b.isHighlight ? TOKENS.vermillion : TOKENS.slate;
    const tagFill = b.isHighlight ? TOKENS.vermillion : TOKENS.slateLight;
    const valueFill = b.isHighlight ? TOKENS.vermillion : TOKENS.ink;
    const labelX = CHART_LEFT - 14;
    const valueX = CHART_LEFT + barWidth + 12;
    return `
      <text x="${labelX}" y="${y + BAR_H / 2 - 4}" font-family="${FONTS.serif}" font-size="${labelSize}" font-weight="700" fill="${TOKENS.ink}" text-anchor="end">${escape(b.label)}</text>
      <text x="${labelX}" y="${y + BAR_H / 2 + 16}" font-family="${FONTS.mono}" font-size="${SIZES.micro}" letter-spacing="2" fill="${tagFill}" text-anchor="end">${escape(b.tag)}</text>
      <rect x="${CHART_LEFT}" y="${y}" width="${barWidth}" height="${BAR_H}" fill="${fill}"/>
      <text x="${valueX}" y="${y + BAR_H / 2 + 8}" font-family="${FONTS.serif}" font-size="${numeralSize}" font-weight="700" fill="${valueFill}">${b.value}%</text>
    `;
  }).join('');

  // Gap annotation between the bars (only on landscape variants where there's room)
  let gapSvg = '';
  if (W >= 1080 && layout.showSubdeck) {
    const yTop = CHART_TOP + BAR_GAP * 1 + BAR_H * 0 + BAR_H;
    const yBot = CHART_TOP + BAR_GAP * 2 + BAR_H * 1;
    const yMid = (yTop + yBot) / 2;
    const xAnnot = CHART_LEFT + xScale(15.4) - CHART_LEFT + 90;
    gapSvg = `
      <line x1="${xAnnot - 30}" y1="${yTop + 6}" x2="${xAnnot - 30}" y2="${yBot - 6}" stroke="${TOKENS.ink}" stroke-width="1"/>
      <line x1="${xAnnot - 36}" y1="${yTop + 6}" x2="${xAnnot - 24}" y2="${yTop + 6}" stroke="${TOKENS.ink}" stroke-width="1"/>
      <line x1="${xAnnot - 36}" y1="${yBot - 6}" x2="${xAnnot - 24}" y2="${yBot - 6}" stroke="${TOKENS.ink}" stroke-width="1"/>
      <text x="${xAnnot - 18}" y="${yMid - 4}" font-family="${FONTS.serif}" font-size="${SIZES.h3}" font-weight="700" fill="${TOKENS.ink}">${GAP_PT} pt gap</text>
      <text x="${xAnnot - 18}" y="${yMid + 16}" font-family="${FONTS.mono}" font-size="${SIZES.micro}" letter-spacing="1.5" fill="${TOKENS.slate}">IN INJURY-CRASH REDUCTION</text>
    `;
  }

  // Axis baseline
  const axisSvg = `
    <line x1="${CHART_LEFT}" y1="${CHART_TOP}" x2="${CHART_LEFT}" y2="${CHART_BOTTOM}" stroke="${TOKENS.hairline}" stroke-width="1"/>
    <line x1="${CHART_LEFT}" y1="${CHART_BOTTOM}" x2="${CHART_RIGHT}" y2="${CHART_BOTTOM}" stroke="${TOKENS.hairline}" stroke-width="1"/>
  `;

  // Top + bottom hairlines (newsprint convention)
  const chartFrameSvg = `
    <line x1="${SAFE}" y1="${CHART_TOP - 26}" x2="${W - SAFE}" y2="${CHART_TOP - 26}" stroke="${TOKENS.ink}" stroke-width="1"/>
    <line x1="${SAFE}" y1="${CHART_BOTTOM + 16}" x2="${W - SAFE}" y2="${CHART_BOTTOM + 16}" stroke="${TOKENS.ink}" stroke-width="1"/>
  `;

  // X-axis label
  const axisLabelSvg = `
    <text x="${CHART_LEFT + CHART_W / 2}" y="${CHART_BOTTOM + 32}" font-family="${FONTS.mono}" font-size="${SIZES.micro}" letter-spacing="2" fill="${TOKENS.slate}" text-anchor="middle">% REDUCTION IN SERIOUS, MINOR, OR SUSPECTED INJURY CRASHES</text>
  `;

  // Headlines
  const headlineSvg = `
    <text x="${SAFE}" y="${layout.EYEBROW_Y}" font-family="${FONTS.mono}" font-size="${SIZES.micro}" letter-spacing="3" font-weight="700" fill="${TOKENS.vermillion}">AZ LAW NOW · INFRASTRUCTURE INVESTIGATION</text>
    <text x="${SAFE}" y="${layout.HEADLINE_Y}" font-family="${FONTS.serif}" font-size="${HEADLINE_SIZE}" font-weight="700" fill="${TOKENS.ink}">Buckeye picked the design that prevents</text>
    <text x="${SAFE}" y="${layout.HEADLINE_2_Y}" font-family="${FONTS.serif}" font-size="${HEADLINE_SIZE}" font-weight="700" fill="${TOKENS.ink}">fewer injury crashes at Durango and Yuma.</text>
    ${layout.showSubdeck && layout.SUBDECK_Y ? `
      <text x="${SAFE}" y="${layout.SUBDECK_Y}" font-family="${FONTS.serif}" font-size="${SIZES.bodyL}" font-style="italic" fill="${TOKENS.slate}">Construction savings: ${COST_GAP}. Lifetime injury exposure: paid by every driver and pedestrian at the intersection.</text>
    ` : ''}
  `;

  // Caption + source + byline
  const captionSvg = `
    <text x="${SAFE}" y="${layout.CAPTION_Y}" font-family="${FONTS.mono}" font-size="${SIZES.micro}" letter-spacing="1" fill="${TOKENS.slate}">${CAPTION_SLUG}</text>
    <text x="${SAFE}" y="${layout.SOURCE_Y}" font-family="${FONTS.serif}" font-size="${SIZES.bodyS}" font-style="italic" fill="${TOKENS.slate}">Source: City of Buckeye Traffic Engineering Report ENGCIP-25-0004 (2025), Crash Modification Factor analysis.</text>
    <text x="${SAFE}" y="${layout.BYLINE_Y}" font-family="${FONTS.mono}" font-size="${SIZES.micro}" letter-spacing="1.5" fill="${TOKENS.slateLight}">REPORTING: ${BYLINE.toUpperCase()} · ${PUBLISH.toUpperCase()}</text>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="100%" height="100%" fill="${TOKENS.cream}"/>
    ${headlineSvg}
    ${chartFrameSvg}
    ${tickSvg}
    ${axisSvg}
    ${barSvg}
    ${gapSvg}
    ${axisLabelSvg}
    ${captionSvg}
  </svg>`;
}

async function render(name: string, layout: Layout, alt: string): Promise<string> {
  const svg = buildSvg(layout);
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();

  const logo = await sharp(PATHS.logoDarkHz).resize({ width: layout.LOGO_W }).toBuffer();
  const logoMeta = await sharp(logo).metadata();
  const logoH = logoMeta.height || 36;

  const out = `${OUTDIR}/buckeye-roundabout-${name}.png`;
  await sharp(buf).composite([
    { input: logo, top: layout.H - layout.LOGO_BOTTOM - logoH, left: layout.W - layout.LOGO_W - layout.LOGO_RIGHT },
  ]).png({ compressionLevel: 9 }).toFile(out);

  console.log(`  ${name.padEnd(20)} ${layout.W}x${layout.H}  ${out}`);
  return out;
}

mkdirSync(OUTDIR, { recursive: true });

// ── 1. MASTER 1200x675 (LinkedIn / X / Twitter / embed) ──
const master: Layout = {
  W: 1200, H: 675, SAFE: 80,
  EYEBROW_Y: 64, HEADLINE_Y: 110, HEADLINE_2_Y: 150, SUBDECK_Y: 188,
  CHART_TOP: 240, CHART_BOTTOM: 510,
  CHART_LEFT: 380, CHART_RIGHT: 1110,
  BAR_H: 64,
  CAPTION_Y: 565, SOURCE_Y: 590, BYLINE_Y: 615,
  LOGO_W: 130, LOGO_RIGHT: 80, LOGO_BOTTOM: 28,
  HEADLINE_SIZE: 30, numeralSize: 30, labelSize: 18,
  showSubdeck: true,
};

// ── 2. IG SQUARE 1080x1080 native ──
const igSquare: Layout = {
  W: 1080, H: 1080, SAFE: 80,
  EYEBROW_Y: 90, HEADLINE_Y: 150, HEADLINE_2_Y: 200, SUBDECK_Y: 250,
  CHART_TOP: 360, CHART_BOTTOM: 760,
  CHART_LEFT: 360, CHART_RIGHT: 1000,
  BAR_H: 90,
  CAPTION_Y: 870, SOURCE_Y: 905, BYLINE_Y: 940,
  LOGO_W: 160, LOGO_RIGHT: 80, LOGO_BOTTOM: 50,
  HEADLINE_SIZE: 38, numeralSize: 38, labelSize: 22,
  showSubdeck: true,
};

// ── 3. IG PORTRAIT 1080x1350 native ──
const igPortrait: Layout = {
  W: 1080, H: 1350, SAFE: 80,
  EYEBROW_Y: 100, HEADLINE_Y: 170, HEADLINE_2_Y: 222, SUBDECK_Y: 280,
  CHART_TOP: 420, CHART_BOTTOM: 980,
  CHART_LEFT: 360, CHART_RIGHT: 1000,
  BAR_H: 110,
  CAPTION_Y: 1115, SOURCE_Y: 1155, BYLINE_Y: 1195,
  LOGO_W: 160, LOGO_RIGHT: 80, LOGO_BOTTOM: 70,
  HEADLINE_SIZE: 40, numeralSize: 42, labelSize: 22,
  showSubdeck: true,
};

// ── 4. FB FEED 1200x630 ──
const fbFeed: Layout = {
  W: 1200, H: 630, SAFE: 70,
  EYEBROW_Y: 60, HEADLINE_Y: 104, HEADLINE_2_Y: 144, SUBDECK_Y: 178,
  CHART_TOP: 222, CHART_BOTTOM: 478,
  CHART_LEFT: 380, CHART_RIGHT: 1130,
  BAR_H: 62,
  CAPTION_Y: 522, SOURCE_Y: 548, BYLINE_Y: 572,
  LOGO_W: 130, LOGO_RIGHT: 70, LOGO_BOTTOM: 24,
  HEADLINE_SIZE: 30, numeralSize: 30, labelSize: 17,
  showSubdeck: true,
};

const out1 = await render('master-1200x675', master, 'Buckeye intersection: roundabout 41.7% vs signalized 15.4% injury reduction');
const out2 = await render('ig-square-1080', igSquare, 'Buckeye intersection: roundabout 41.7% vs signalized 15.4%');
const out3 = await render('ig-portrait-1080x1350', igPortrait, 'Buckeye intersection: roundabout 41.7% vs signalized 15.4%');
const out4 = await render('fb-feed-1200x630', fbFeed, 'Buckeye intersection: roundabout 41.7% vs signalized 15.4%');

console.log('\nEmbed code (master):');
console.log(`<a href="https://azlawnow.com/investigations/${SLUG}/" rel="dofollow"><img src="https://azlawnow.com/embeds/buckeye-roundabout-master-1200x675.png" alt="Buckeye Durango and Yuma intersection: roundabout would have reduced injury crashes 41.7%, signalized design chosen reduces them 15.4%" width="1200" height="675" loading="lazy" /></a>`);
console.log(`<p><small>Source: <a href="https://azlawnow.com/investigations/${SLUG}/" rel="dofollow">AZ Law Now investigation</a>, May 2026.</small></p>`);
