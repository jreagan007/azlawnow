/**
 * AZ Law Now editorial chart, 27th-ave-thomas-rd-bnsf-crossing.
 * Vertical timeline of pedestrian fatalities + serious injuries at twin
 * BNSF crossings 025430G + 025617C, with the June 2024 gate retrofit
 * marked as a structural event divider, and the April 25, 2026 strike on
 * Sonja Celius highlighted vermillion.
 */
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { TOKENS, FONTS, SIZES, PATHS } from './lib/azlawnow-chart-tokens.js';

const SLUG = '27th-ave-thomas-rd-bnsf-crossing';
const CAPTION_SLUG = '27th-ave-thomas-rd-bnsf-pedestrian-rail-incident-timeline-2021-2026';
const PUBLISH = 'May 8, 2026';
const BYLINE = 'Brendan Franks';
const OUTDIR = '/Users/taqticlaw/Projects/azlawnow/public/embeds';

type Item =
  | { kind: 'incident'; date: string; year: string; label: string; sublabel: string; isHighlight: boolean }
  | { kind: 'event'; date: string; label: string };

const TIMELINE: Item[] = [
  { kind: 'incident', date: 'Mar 20, 2021',  year: '2021', label: 'Pedestrian fatality, Thomas Rd',         sublabel: 'Woman, 57. DOT 025617C.', isHighlight: false },
  { kind: 'incident', date: 'Feb 17, 2022',  year: '2022', label: 'Pedestrian fatality',                    sublabel: '"Stepped off the median."', isHighlight: false },
  { kind: 'incident', date: 'Nov 4, 2022',   year: '2022', label: 'Wheelchair user injured',                sublabel: 'Mobility-device walk-around.', isHighlight: false },
  { kind: 'incident', date: 'Oct 1, 2023',   year: '2023', label: 'Pedestrian fatality, 27th Ave',          sublabel: 'DOT 025430G.', isHighlight: false },
  { kind: 'incident', date: 'Oct 12, 2023',  year: '2023', label: 'Pedestrian injured',                     sublabel: '', isHighlight: false },
  { kind: 'incident', date: 'Nov 25, 2023', year: '2023', label: 'Pedestrian injured',                     sublabel: '', isHighlight: false },
  { kind: 'event',    date: 'June 2024',     label: 'BNSF installs active warning gates at both crossings' },
  { kind: 'incident', date: 'Apr 25, 2026',  year: '2026', label: 'Sonja Celius struck at 27th Ave',        sublabel: 'Both legs amputated. Mother of three from Nevada.', isHighlight: true },
];

function escape(s: string): string { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

interface Layout {
  W: number; H: number; SAFE: number;
  EYEBROW_Y: number; HEADLINE_Y: number; HEADLINE_2_Y: number; SUBDECK_Y?: number;
  TIMELINE_TOP: number; TIMELINE_BOTTOM: number; TIMELINE_LEFT: number; TIMELINE_RIGHT: number;
  CAPTION_Y: number; SOURCE_Y: number; BYLINE_Y: number;
  LOGO_W: number; LOGO_RIGHT: number; LOGO_BOTTOM: number;
  HEADLINE_SIZE: number; itemTitleSize: number; itemDateSize: number; itemSubSize: number;
  showSubdeck: boolean;
}

function buildSvg(layout: Layout): string {
  const { W, H, SAFE, TIMELINE_TOP, TIMELINE_BOTTOM, TIMELINE_LEFT, TIMELINE_RIGHT, HEADLINE_SIZE, itemTitleSize, itemDateSize, itemSubSize } = layout;

  // Each item is vertically allocated equal share of the timeline strip
  const SLOT_H = (TIMELINE_BOTTOM - TIMELINE_TOP) / TIMELINE.length;
  const DATE_COL_W = 130;
  const TEXT_COL_X = TIMELINE_LEFT + DATE_COL_W + 20;
  const RAIL_X = TIMELINE_LEFT + DATE_COL_W;

  // Vertical rail line
  const railSvg = `<line x1="${RAIL_X}" y1="${TIMELINE_TOP + 8}" x2="${RAIL_X}" y2="${TIMELINE_BOTTOM - 8}" stroke="${TOKENS.hairline}" stroke-width="1.5"/>`;

  const itemsSvg = TIMELINE.map((it, i) => {
    const cy = TIMELINE_TOP + SLOT_H * i + SLOT_H / 2;
    if (it.kind === 'event') {
      // Vermillion event divider with text on the right
      return `
        <line x1="${TIMELINE_LEFT}" y1="${cy}" x2="${TIMELINE_RIGHT}" y2="${cy}" stroke="${TOKENS.vermillion}" stroke-width="2"/>
        <circle cx="${RAIL_X}" cy="${cy}" r="6" fill="${TOKENS.vermillion}" stroke="${TOKENS.cream}" stroke-width="2"/>
        <text x="${TIMELINE_LEFT}" y="${cy - 12}" font-family="${FONTS.mono}" font-size="${SIZES.micro}" letter-spacing="2" font-weight="700" fill="${TOKENS.vermillion}">${escape(it.date.toUpperCase())}</text>
        <text x="${TIMELINE_LEFT}" y="${cy + 22}" font-family="${FONTS.serif}" font-size="${itemTitleSize}" font-style="italic" font-weight="700" fill="${TOKENS.vermillion}">${escape(it.label)}</text>
      `;
    }
    const fill = it.isHighlight ? TOKENS.vermillion : TOKENS.ink;
    const subFill = it.isHighlight ? TOKENS.vermillion : TOKENS.slate;
    const dotFill = it.isHighlight ? TOKENS.vermillion : TOKENS.slate;
    const dotR = it.isHighlight ? 8 : 5;
    return `
      <text x="${RAIL_X - 16}" y="${cy + 4}" font-family="${FONTS.mono}" font-size="${itemDateSize}" letter-spacing="1" fill="${TOKENS.slateLight}" text-anchor="end">${escape(it.date)}</text>
      <circle cx="${RAIL_X}" cy="${cy}" r="${dotR}" fill="${dotFill}" stroke="${TOKENS.cream}" stroke-width="2"/>
      <text x="${TEXT_COL_X}" y="${cy - 2}" font-family="${FONTS.serif}" font-size="${itemTitleSize}" font-weight="700" fill="${fill}">${escape(it.label)}</text>
      ${it.sublabel ? `<text x="${TEXT_COL_X}" y="${cy + 18}" font-family="${FONTS.sans}" font-size="${itemSubSize}" fill="${subFill}">${escape(it.sublabel)}</text>` : ''}
    `;
  }).join('');

  const chartFrameSvg = `
    <line x1="${SAFE}" y1="${TIMELINE_TOP - 22}" x2="${W - SAFE}" y2="${TIMELINE_TOP - 22}" stroke="${TOKENS.ink}" stroke-width="1"/>
    <line x1="${SAFE}" y1="${TIMELINE_BOTTOM + 18}" x2="${W - SAFE}" y2="${TIMELINE_BOTTOM + 18}" stroke="${TOKENS.ink}" stroke-width="1"/>
  `;

  const headlineSvg = `
    <text x="${SAFE}" y="${layout.EYEBROW_Y}" font-family="${FONTS.mono}" font-size="${SIZES.micro}" letter-spacing="3" font-weight="700" fill="${TOKENS.vermillion}">AZ LAW NOW · RAIL CROSSING INVESTIGATION</text>
    <text x="${SAFE}" y="${layout.HEADLINE_Y}" font-family="${FONTS.serif}" font-size="${HEADLINE_SIZE}" font-weight="700" fill="${TOKENS.ink}">BNSF installed gates at 27th and Thomas in June 2024.</text>
    <text x="${SAFE}" y="${layout.HEADLINE_2_Y}" font-family="${FONTS.serif}" font-size="${HEADLINE_SIZE}" font-weight="700" fill="${TOKENS.ink}">Sonja Celius was struck 22 months later.</text>
    ${layout.showSubdeck && layout.SUBDECK_Y ? `<text x="${SAFE}" y="${layout.SUBDECK_Y}" font-family="${FONTS.serif}" font-size="${SIZES.bodyL}" font-style="italic" fill="${TOKENS.slate}">Twin BNSF crossings 50 feet apart. Combined AADT 70,000+. Neither in a quiet zone.</text>` : ''}
  `;

  const captionSvg = `
    <text x="${SAFE}" y="${layout.CAPTION_Y}" font-family="${FONTS.mono}" font-size="${SIZES.micro}" letter-spacing="1" fill="${TOKENS.slate}">${CAPTION_SLUG}</text>
    <text x="${SAFE}" y="${layout.SOURCE_Y}" font-family="${FONTS.serif}" font-size="${SIZES.bodyS}" font-style="italic" fill="${TOKENS.slate}">Source: FRA Form 6180.57 per-crossing accident reports for DOT IDs 025430G + 025617C. Plus AZ Family reporting on Sonja Celius (Mikayla, May 7, 2026).</text>
    <text x="${SAFE}" y="${layout.BYLINE_Y}" font-family="${FONTS.mono}" font-size="${SIZES.micro}" letter-spacing="1.5" fill="${TOKENS.slateLight}">REPORTING: ${BYLINE.toUpperCase()} · ${PUBLISH.toUpperCase()}</text>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="100%" height="100%" fill="${TOKENS.cream}"/>
    ${headlineSvg}
    ${chartFrameSvg}
    ${railSvg}
    ${itemsSvg}
    ${captionSvg}
  </svg>`;
}

async function render(name: string, layout: Layout): Promise<string> {
  const svg = buildSvg(layout);
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  const logo = await sharp(PATHS.logoDarkHz).resize({ width: layout.LOGO_W }).toBuffer();
  const logoMeta = await sharp(logo).metadata();
  const logoH = logoMeta.height || 36;
  const out = `${OUTDIR}/27th-thomas-bnsf-crossing-${name}.png`;
  await sharp(buf).composite([{ input: logo, top: layout.H - layout.LOGO_BOTTOM - logoH, left: layout.W - layout.LOGO_W - layout.LOGO_RIGHT }]).png({ compressionLevel: 9 }).toFile(out);
  console.log(`  ${name.padEnd(20)} ${layout.W}x${layout.H}  ${out}`);
  return out;
}

mkdirSync(OUTDIR, { recursive: true });

const master: Layout = { W: 1200, H: 675, SAFE: 70, EYEBROW_Y: 56, HEADLINE_Y: 96, HEADLINE_2_Y: 132, SUBDECK_Y: 168, TIMELINE_TOP: 220, TIMELINE_BOTTOM: 555, TIMELINE_LEFT: 90, TIMELINE_RIGHT: 1130, CAPTION_Y: 600, SOURCE_Y: 622, BYLINE_Y: 645, LOGO_W: 130, LOGO_RIGHT: 70, LOGO_BOTTOM: 24, HEADLINE_SIZE: 26, itemTitleSize: 16, itemDateSize: 12, itemSubSize: 12, showSubdeck: true };
const igSquare: Layout = { W: 1080, H: 1080, SAFE: 70, EYEBROW_Y: 90, HEADLINE_Y: 140, HEADLINE_2_Y: 184, SUBDECK_Y: 226, TIMELINE_TOP: 290, TIMELINE_BOTTOM: 920, TIMELINE_LEFT: 90, TIMELINE_RIGHT: 1010, CAPTION_Y: 970, SOURCE_Y: 998, BYLINE_Y: 1024, LOGO_W: 160, LOGO_RIGHT: 70, LOGO_BOTTOM: 32, HEADLINE_SIZE: 32, itemTitleSize: 20, itemDateSize: 14, itemSubSize: 14, showSubdeck: true };
const igPortrait: Layout = { W: 1080, H: 1350, SAFE: 70, EYEBROW_Y: 100, HEADLINE_Y: 158, HEADLINE_2_Y: 206, SUBDECK_Y: 252, TIMELINE_TOP: 320, TIMELINE_BOTTOM: 1180, TIMELINE_LEFT: 90, TIMELINE_RIGHT: 1010, CAPTION_Y: 1230, SOURCE_Y: 1262, BYLINE_Y: 1294, LOGO_W: 160, LOGO_RIGHT: 70, LOGO_BOTTOM: 36, HEADLINE_SIZE: 34, itemTitleSize: 22, itemDateSize: 14, itemSubSize: 15, showSubdeck: true };
const fbFeed: Layout = { W: 1200, H: 630, SAFE: 70, EYEBROW_Y: 54, HEADLINE_Y: 92, HEADLINE_2_Y: 128, SUBDECK_Y: 162, TIMELINE_TOP: 210, TIMELINE_BOTTOM: 522, TIMELINE_LEFT: 90, TIMELINE_RIGHT: 1130, CAPTION_Y: 558, SOURCE_Y: 580, BYLINE_Y: 602, LOGO_W: 130, LOGO_RIGHT: 70, LOGO_BOTTOM: 22, HEADLINE_SIZE: 26, itemTitleSize: 16, itemDateSize: 12, itemSubSize: 12, showSubdeck: true };

await render('master-1200x675', master);
await render('ig-square-1080', igSquare);
await render('ig-portrait-1080x1350', igPortrait);
await render('fb-feed-1200x630', fbFeed);

const igOut = '/Users/taqticlaw/Projects/azlawnow/public/ig';
const fbOut = '/Users/taqticlaw/Projects/azlawnow/public/fb';
mkdirSync(igOut, { recursive: true }); mkdirSync(fbOut, { recursive: true });
await sharp(`${OUTDIR}/27th-thomas-bnsf-crossing-ig-portrait-1080x1350.png`).jpeg({ quality: 90 }).toFile(`${igOut}/ig-27th-thomas-bnsf-crossing-2026-05.jpg`);
await sharp(`${OUTDIR}/27th-thomas-bnsf-crossing-fb-feed-1200x630.png`).png({ compressionLevel: 9 }).toFile(`${fbOut}/fb-27th-thomas-bnsf-crossing-2026-05.png`);
console.log(`IG: ${igOut}/ig-27th-thomas-bnsf-crossing-2026-05.jpg`);
console.log(`FB: ${fbOut}/fb-27th-thomas-bnsf-crossing-2026-05.png`);
