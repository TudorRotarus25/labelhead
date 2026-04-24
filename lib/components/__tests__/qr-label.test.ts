// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildNoteUrl, LABEL_WIDTH, LABEL_HEIGHT } from "../qr-label-utils";

describe("buildNoteUrl", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("should build URL using NEXT_PUBLIC_BASE_URL when set", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://labelhead-phi.vercel.app");
    const url = buildNoteUrl("abc-123");
    expect(url).toBe("https://labelhead-phi.vercel.app/n/abc-123");
  });

  it("should fall back to window.location.origin when env is empty", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");
    const url = buildNoteUrl("abc-123");
    expect(url).toBe(`${window.location.origin}/n/abc-123`);
  });

  it("should include the /n/ prefix in the URL path", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://example.com");
    const url = buildNoteUrl("550e8400-e29b-41d4-a716-446655440000");
    expect(url).toBe("https://example.com/n/550e8400-e29b-41d4-a716-446655440000");
  });
});

describe("Label dimensions", () => {
  it("should have 200px width for Nelko P21 at 300 DPI", () => {
    expect(LABEL_WIDTH).toBe(200);
  });

  it("should have 250px height (200 QR + 50 title area)", () => {
    expect(LABEL_HEIGHT).toBe(250);
  });
});

describe("QRLabel component", () => {
  it("should export QRLabel as a named export", async () => {
    const mod = await import("../qr-label");
    expect(mod.QRLabel).toBeDefined();
    expect(typeof mod.QRLabel).toBe("function");
  });
});
