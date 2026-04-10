import sharp from 'sharp';

const SRC = 'public/favicons/source-saguaro.png';
const SIZES = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
];

async function main() {
  const meta = await sharp(SRC).metadata();
  console.log(`Source: ${meta.width}x${meta.height}`);

  for (const { size, name } of SIZES) {
    await sharp(SRC)
      .resize(size, size, { fit: 'contain', background: { r: 250, g: 245, b: 237, alpha: 1 } })
      .png({ quality: 95 })
      .toFile(`public/favicons/${name}`);
    console.log(`  ✓ ${name}`);
  }
  console.log('Done.');
}

main().catch(console.error);
