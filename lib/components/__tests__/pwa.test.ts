import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import path from "path";

const publicDir = path.resolve(__dirname, "../../../public");

describe("PWA manifest", () => {
  it("manifest.json exists in public/", () => {
    expect(existsSync(path.join(publicDir, "manifest.json"))).toBe(true);
  });

  it("manifest.json is valid JSON", () => {
    const raw = readFileSync(path.join(publicDir, "manifest.json"), "utf-8");
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it("has required PWA fields", () => {
    const manifest = JSON.parse(
      readFileSync(path.join(publicDir, "manifest.json"), "utf-8"),
    );
    expect(manifest.name).toBe("LabelHead");
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons).toBeInstanceOf(Array);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(4);
  });

  it("has theme_color and background_color", () => {
    const manifest = JSON.parse(
      readFileSync(path.join(publicDir, "manifest.json"), "utf-8"),
    );
    expect(manifest.theme_color).toBeTruthy();
    expect(manifest.background_color).toBeTruthy();
  });

  it("icons have correct sizes and types", () => {
    const manifest = JSON.parse(
      readFileSync(path.join(publicDir, "manifest.json"), "utf-8"),
    );
    const sizes = manifest.icons.map(
      (i: { sizes: string }) => i.sizes,
    );
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");

    for (const icon of manifest.icons) {
      expect(icon.type).toBe("image/png");
      expect(icon.src).toMatch(/^\/icons\//);
    }
  });

  it("includes maskable icons", () => {
    const manifest = JSON.parse(
      readFileSync(path.join(publicDir, "manifest.json"), "utf-8"),
    );
    const maskable = manifest.icons.filter(
      (i: { purpose?: string }) => i.purpose === "maskable",
    );
    expect(maskable.length).toBeGreaterThanOrEqual(2);
  });
});

describe("PWA icon files", () => {
  const manifest = JSON.parse(
    readFileSync(path.join(publicDir, "manifest.json"), "utf-8"),
  );

  for (const icon of manifest.icons) {
    it(`icon file exists: ${icon.src}`, () => {
      const iconPath = path.join(publicDir, icon.src);
      expect(existsSync(iconPath)).toBe(true);
    });

    it(`icon file is not empty: ${icon.src}`, () => {
      const iconPath = path.join(publicDir, icon.src);
      const stat = readFileSync(iconPath);
      expect(stat.length).toBeGreaterThan(0);
    });
  }
});
