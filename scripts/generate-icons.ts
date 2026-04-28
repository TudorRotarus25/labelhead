/**
 * Generate all PWA icon assets for LabelHead from the source `public/logo.png`.
 *
 * Produces:
 *  - public/icons/icon-192.png            (192x192, contain, white bg)
 *  - public/icons/icon-512.png            (512x512, contain, white bg)
 *  - public/icons/icon-maskable-192.png   (192x192, 80% + 10% safe-zone, white bg)
 *  - public/icons/icon-maskable-512.png   (512x512, 80% + 10% safe-zone, white bg)
 *  - public/apple-touch-icon.png          (180x180, contain, white bg, opaque)
 *  - app/icon.png                         (512x512, contain, white bg)
 *  - app/apple-icon.png                   (180x180, contain, white bg, opaque)
 *
 * Run with: pnpm tsx scripts/generate-icons.ts
 */

import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";

/** Repo root (script lives in <root>/scripts/). */
const ROOT = path.resolve(__dirname, "..");

/** Absolute path to the 1024x1024 source logo. */
const SRC = path.resolve(ROOT, "public/logo.png");

/** White background used to flatten transparency for opaque PNG outputs. */
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 } as const;

/**
 * Generate a single icon PNG at `outPath` with side length `size`.
 *
 * When `maskable` is true, the source logo is scaled to 80% of the canvas
 * and centered, leaving a 10% safe-zone of white padding on all sides so
 * Android can apply rounded/squircle masks without clipping the logo.
 *
 * When `maskable` is false, the source is fit with `contain` into the full
 * canvas (no padding) and flattened onto a white background.
 */
async function generate(
  size: number,
  outPath: string,
  { maskable }: { maskable: boolean },
): Promise<void> {
  await fs.mkdir(path.dirname(outPath), { recursive: true });

  if (maskable) {
    // Logo occupies the inner 80% of the canvas; remaining 20% is split as
    // 10% padding on each side (Android adaptive icon safe zone).
    const innerSize = Math.round(size * 0.8);
    const resizedLogo = await sharp(SRC)
      .resize(innerSize, innerSize, {
        fit: "contain",
        background: WHITE,
      })
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: WHITE,
      },
    })
      .composite([{ input: resizedLogo, gravity: "center" }])
      .flatten({ background: WHITE })
      .png()
      .toFile(outPath);
  } else {
    await sharp(SRC)
      .resize(size, size, {
        fit: "contain",
        background: WHITE,
      })
      .flatten({ background: WHITE })
      .png()
      .toFile(outPath);
  }

  console.log(`  wrote ${path.relative(ROOT, outPath)}`);
}

/** Entry point: generate every icon the app needs. */
async function main(): Promise<void> {
  // Sanity-check the source file exists before fanning out.
  await fs.access(SRC);

  const targets: Array<{ size: number; out: string; maskable: boolean }> = [
    { size: 192, out: "public/icons/icon-192.png", maskable: false },
    { size: 512, out: "public/icons/icon-512.png", maskable: false },
    { size: 192, out: "public/icons/icon-maskable-192.png", maskable: true },
    { size: 512, out: "public/icons/icon-maskable-512.png", maskable: true },
    { size: 180, out: "public/apple-touch-icon.png", maskable: false },
    { size: 512, out: "app/icon.png", maskable: false },
    { size: 180, out: "app/apple-icon.png", maskable: false },
  ];

  console.log(`Generating icons from ${path.relative(ROOT, SRC)}`);
  for (const { size, out, maskable } of targets) {
    await generate(size, path.resolve(ROOT, out), { maskable });
  }
  console.log("Done.");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
