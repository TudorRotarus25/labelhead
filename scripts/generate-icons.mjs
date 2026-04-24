/**
 * Generates PWA icons as PNG files from inline SVG templates.
 * Creates regular and maskable variants at 192x192 and 512x512.
 */
import sharp from "sharp";

/**
 * Creates an SVG buffer for a PWA icon with "LH" text
 * @param {number} size - Icon dimensions in pixels
 * @param {boolean} maskable - Whether to add safe-zone padding for maskable icons
 * @returns {Buffer} SVG buffer
 */
function createSvg(size, maskable) {
  const fontSize = maskable ? size * 0.28 : size * 0.4;
  const cx = size / 2;
  const cy = size / 2;
  const rx = maskable ? 0 : size * 0.1;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#18181b" rx="${rx}"/>
  <text x="${cx}" y="${cy}" font-family="sans-serif" font-size="${fontSize}" font-weight="700" fill="#fafafa" text-anchor="middle" dominant-baseline="central">LH</text>
</svg>`;

  return Buffer.from(svg);
}

const variants = [
  { name: "icon-192.png", size: 192, maskable: false },
  { name: "icon-512.png", size: 512, maskable: false },
  { name: "icon-maskable-192.png", size: 192, maskable: true },
  { name: "icon-maskable-512.png", size: 512, maskable: true },
];

for (const { name, size, maskable } of variants) {
  await sharp(createSvg(size, maskable))
    .png()
    .toFile(`public/icons/${name}`);
  console.log(`Generated public/icons/${name}`);
}

console.log("Done!");
