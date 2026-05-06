import sharp from 'sharp';
import { mkdirSync } from 'fs';

const SRC = '/Users/taqticlaw/Projects/azlawnow/public/embeds';
const OUT_IG = '/Users/taqticlaw/Projects/azlawnow/public/ig';
const OUT_FB = '/Users/taqticlaw/Projects/azlawnow/public/fb';
mkdirSync(OUT_IG, { recursive: true });
mkdirSync(OUT_FB, { recursive: true });

await sharp(`${SRC}/buckeye-roundabout-ig-portrait-1080x1350.png`)
  .jpeg({ quality: 90 })
  .toFile(`${OUT_IG}/ig-buckeye-roundabout-chart-2026-05.jpg`);
console.log(`IG saved: ${OUT_IG}/ig-buckeye-roundabout-chart-2026-05.jpg`);

await sharp(`${SRC}/buckeye-roundabout-fb-feed-1200x630.png`)
  .png({ compressionLevel: 9 })
  .toFile(`${OUT_FB}/fb-buckeye-roundabout-chart-2026-05.png`);
console.log(`FB saved: ${OUT_FB}/fb-buckeye-roundabout-chart-2026-05.png`);
