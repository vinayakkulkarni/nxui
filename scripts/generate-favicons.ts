import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const svg = readFileSync('public/favicon.svg');

// 1. apple-touch-icon.png (180×180)
// Apple touch icons need a solid background (no transparency)
// Use white background for light appearance on iOS home screens
await sharp(svg)
  .resize(180, 180)
  .flatten({ background: { r: 255, g: 255, b: 255 } })
  .png()
  .toFile('public/apple-touch-icon.png');

console.log('✅ apple-touch-icon.png (180×180)');

// 2. favicon.ico — generate 32×32 PNG buffer, wrap in ICO format
const png32 = await sharp(svg).resize(32, 32).png().toBuffer();

function pngToIco(pngBuffer: Buffer): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: ICO
  header.writeUInt16LE(1, 4); // image count: 1

  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0); // width
  entry.writeUInt8(32, 1); // height
  entry.writeUInt8(0, 2); // color palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8); // image size
  entry.writeUInt32LE(22, 12); // offset (6 header + 16 entry)

  return Buffer.concat([header, entry, pngBuffer]);
}

writeFileSync('public/favicon.ico', pngToIco(png32));
console.log('✅ favicon.ico (32×32)');
