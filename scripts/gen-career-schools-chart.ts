/**
 * AZ Law Now editorial chart, arizona-career-schools-37-adverse-actions.
 * 3-bar funnel: 237 licensed -> 37 adverse actions -> 9 closures (FY25).
 * Same lockup as buckeye chart (cream + ink + vermillion + hairlines).
 */
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { TOKENS, FONTS, SIZES, PATHS } from './lib/azlawnow-chart-tokens.js';

const SLUG = 'arizona-career-schools-37-adverse-actions';
const CAPTION_SLUG = 'arizona-private-career-schools-funnel-licensed-adverse-actions-closures-fy25';
const PUBLISH = 'May 6, 2026';
const BYLINE = 'Brendan Franks';
const OUTDIR = '/Users/taqticlaw/Projects/azlawnow/public/embeds';

type Bar = { label: string; tag: string; value: number; isHighlight: boolean };
const BARS: Bar[] = [
  { label: 'Licensed institutions',   tag: 'TOTAL',           value: 237, isHighlight: false },
  { label: 'Adverse actions',         tag: '15.6% OF TOTAL',  value: 37,  isHighlight: true  },
  { label: 'Assisted closures',       tag: '3.8% OF TOTAL',   value: 9,   isHighlight: false },
];
const X_MAX = 250;

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

  const ticks = [0, 50, 100, 150, 200, 250];
  const tickSvg = ticks.map(t => {
    const x = xScale(t);
    return `
      <line x1="${x}" y1="${CHART_TOP - 6}" x2="${x}" y2="${CHART_TOP - 1}" stroke="${TOKENS.hairline}" stroke-width="1"/>
      <text x="${x}" y="${CHART_TOP - 12}" font-family="${FONTS.mono}" font-size="${SIZES.micro}" fill="${TOKENS.slateLight}" text-anchor="middle">${t}</text>
    `;
  }).join('');

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
      <text x="${valueX}" y="${y + BAR_H / 2 + 8}" font-family="${FONTS.serif}" font-size="${numeralSize}" font-weight="700" fill="${valueFill}">${b.value}</text>
    `;
  }).join('');

  const axisSvg = `
    <line x1="${CHART_LEFT}" y1="${CHART_TOP}" x2="${CHART_LEFT}" y2="${CHART_BOTTOM}" stroke="${TOKENS.hairline}" stroke-width="1"/>
    <line x1="${CHART_LEFT}" y1="${CHART_BOTTOM}" x2="${CHART_RIGHT}" y2="${CHART_BOTTOM}" stroke="${TOKENS.hairline}" stroke-width="1"/>
  `;
  const chartFrameSvg = `
    <line x1="${SAFE}" y1="${CHART_TOP - 26}" x2="${W - SAFE}" y2="${CHART_TOP - 26}" stroke="${TOKENS.ink}" stroke-width="1"/>
    <line x1="${SAFE}" y1="${CHART_BOTTOM + 16}" x2="${W - SAFE}" y2="${CHART_BOTTOM + 16}" stroke="${TOKENS.ink}" stroke-width="1"/>
  `;
  const axisLabelSvg = `
    <text x="${CHART_LEFT + CHART_W / 2}" y="${CHART_BOTTOM + 32}" font-family="${FONTS.mono}" font-size="${SIZES.micro}" letter-spacing="2" fill="${TOKENS.slate}" text-anchor="middle">PRIVATE POSTSECONDARY BOARD ACTIONS, FISCAL YEAR 2025</text>
  `;
  const headlineSvg = `
    <text x="${SAFE}" y="${layout.EYEBROW_Y}" font-family="${FONTS.mono}" font-size="${SIZES.micro}" letter-spacing="3" font-weight="700" fill="${TOKENS.vermillion}">AZ LAW NOW · EDUCATION INVESTIGATION</text>
    <text x="${SAFE}" y="${layout.HEADLINE_Y}" font-family="${FONTS.serif}" font-size="${HEADLINE_SIZE}" font-weight="700" fill="${TOKENS.ink}">Arizona licensed 237 private career schools.</text>
    <text x="${SAFE}" y="${layout.HEADLINE_2_Y}" font-family="${FONTS.serif}" font-size="${HEADLINE_SIZE}" font-weight="700" fill="${TOKENS.ink}">37 got adverse actions in one year.</text>
    ${layout.showSubdeck && layout.SUBDECK_Y ? `
      <text x="${SAFE}" y="${layout.SUBDECK_Y}" font-family="${FONTS.serif}" font-size="${SIZES.bodyL}" font-style="italic" fill="${TOKENS.slate}">15.6% adverse-action rate. 9 schools closed. Most students, no warning.</text>
    ` : ''}
  `;
  const captionSvg = `
    <text x="${SAFE}" y="${layout.CAPTION_Y}" font-family="${FONTS.mono}" font-size="${SIZES.micro}" letter-spacing="1" fill="${TOKENS.slate}">${CAPTION_SLUG}</text>
    <text x="${SAFE}" y="${layout.SOURCE_Y}" font-family="${FONTS.serif}" font-size="${SIZES.bodyS}" font-style="italic" fill="${TOKENS.slate}">Source: Arizona State Board for Private Postsecondary Education, FY2025 Annual Report.</text>
    <text x="${SAFE}" y="${layout.BYLINE_Y}" font-family="${FONTS.mono}" font-size="${SIZES.micro}" letter-spacing="1.5" fill="${TOKENS.slateLight}">REPORTING: ${BYLINE.toUpperCase()} · ${PUBLISH.toUpperCase()}</text>
  `;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="100%" height="100%" fill="${TOKENS.cream}"/>
    ${headlineSvg}${chartFrameSvg}${tickSvg}${axisSvg}${barSvg}${axisLabelSvg}${captionSvg}
  </svg>`;
}

async function render(name: string, layout: Layout): Promise<string> {
  const svg = buildSvg(layout);
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  const logo = await sharp(PATHS.logoDarkHz).resize({ width: layout.LOGO_W }).toBuffer();
  const logoMeta = await sharp(logo).metadata();
  const logoH = logoMeta.height || 36;
  const out = `${OUTDIR}/career-schools-${name}.png`;
  await sharp(buf).composite([
    { input: logo, top: layout.H - layout.LOGO_BOTTOM - logoH, left: layout.W - layout.LOGO_W - layout.LOGO_RIGHT },
  ]).png({ compressionLevel: 9 }).toFile(out);
  console.log(`  ${name.padEnd(20)} ${layout.W}x${layout.H}  ${out}`);
  return out;
}

mkdirSync(OUTDIR, { recursive: true });

const master: Layout = { W: 1200, H: 675, SAFE: 80, EYEBROW_Y: 64, HEADLINE_Y: 110, HEADLINE_2_Y: 150, SUBDECK_Y: 188, CHART_TOP: 240, CHART_BOTTOM: 510, CHART_LEFT: 380, CHART_RIGHT: 1110, BAR_H: 64, CAPTION_Y: 565, SOURCE_Y: 590, BYLINE_Y: 615, LOGO_W: 130, LOGO_RIGHT: 80, LOGO_BOTTOM: 28, HEADLINE_SIZE: 30, numeralSize: 30, labelSize: 18, showSubdeck: true };
const igSquare: Layout = { W: 1080, H: 1080, SAFE: 80, EYEBROW_Y: 90, HEADLINE_Y: 150, HEADLINE_2_Y: 200, SUBDECK_Y: 250, CHART_TOP: 360, CHART_BOTTOM: 760, CHART_LEFT: 380, CHART_RIGHT: 1000, BAR_H: 90, CAPTION_Y: 870, SOURCE_Y: 905, BYLINE_Y: 940, LOGO_W: 160, LOGO_RIGHT: 80, LOGO_BOTTOM: 50, HEADLINE_SIZE: 38, numeralSize: 38, labelSize: 22, showSubdeck: true };
const igPortrait: Layout = { W: 1080, H: 1350, SAFE: 80, EYEBROW_Y: 100, HEADLINE_Y: 170, HEADLINE_2_Y: 222, SUBDECK_Y: 280, CHART_TOP: 420, CHART_BOTTOM: 980, CHART_LEFT: 380, CHART_RIGHT: 1000, BAR_H: 110, CAPTION_Y: 1115, SOURCE_Y: 1155, BYLINE_Y: 1195, LOGO_W: 160, LOGO_RIGHT: 80, LOGO_BOTTOM: 70, HEADLINE_SIZE: 40, numeralSize: 42, labelSize: 22, showSubdeck: true };
const fbFeed: Layout = { W: 1200, H: 630, SAFE: 70, EYEBROW_Y: 60, HEADLINE_Y: 104, HEADLINE_2_Y: 144, SUBDECK_Y: 178, CHART_TOP: 222, CHART_BOTTOM: 478, CHART_LEFT: 380, CHART_RIGHT: 1130, BAR_H: 62, CAPTION_Y: 522, SOURCE_Y: 548, BYLINE_Y: 572, LOGO_W: 130, LOGO_RIGHT: 70, LOGO_BOTTOM: 24, HEADLINE_SIZE: 30, numeralSize: 30, labelSize: 17, showSubdeck: true };

await render('master-1200x675', master);
await render('ig-square-1080', igSquare);
await render('ig-portrait-1080x1350', igPortrait);
await render('fb-feed-1200x630', fbFeed);

import { existsSync } from 'fs';
const igOut = '/Users/taqticlaw/Projects/azlawnow/public/ig';
const fbOut = '/Users/taqticlaw/Projects/azlawnow/public/fb';
mkdirSync(igOut, { recursive: true });
mkdirSync(fbOut, { recursive: true });
await sharp(`${OUTDIR}/career-schools-ig-portrait-1080x1350.png`).jpeg({ quality: 90 }).toFile(`${igOut}/ig-career-schools-chart-2026-05.jpg`);
await sharp(`${OUTDIR}/career-schools-fb-feed-1200x630.png`).png({ compressionLevel: 9 }).toFile(`${fbOut}/fb-career-schools-chart-2026-05.png`);
console.log(`IG: ${igOut}/ig-career-schools-chart-2026-05.jpg`);
console.log(`FB: ${fbOut}/fb-career-schools-chart-2026-05.png`);
