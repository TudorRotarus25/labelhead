import { describe, it, expect } from "vitest";
import { parseLabelHeadUrl } from "../parse-labelhead-url";

describe("parseLabelHeadUrl", () => {
  const validUuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

  it("extracts note ID from a valid LabelHead URL", () => {
    expect(parseLabelHeadUrl(`https://labelhead-phi.vercel.app/n/${validUuid}`)).toBe(validUuid);
  });

  it("works with http URLs", () => {
    expect(parseLabelHeadUrl(`http://localhost:3000/n/${validUuid}`)).toBe(validUuid);
  });

  it("works with custom base URLs", () => {
    expect(parseLabelHeadUrl(`https://my-custom-domain.com/n/${validUuid}`)).toBe(validUuid);
  });

  it("is case-insensitive for UUID hex characters", () => {
    const upperUuid = "A1B2C3D4-E5F6-7890-ABCD-EF1234567890";
    expect(parseLabelHeadUrl(`https://labelhead-phi.vercel.app/n/${upperUuid}`)).toBe(upperUuid);
  });

  it("returns null for non-LabelHead URLs", () => {
    expect(parseLabelHeadUrl("https://google.com")).toBeNull();
  });

  it("returns null for URLs without /n/ path", () => {
    expect(parseLabelHeadUrl(`https://labelhead-phi.vercel.app/notes/${validUuid}`)).toBeNull();
  });

  it("returns null for URLs with invalid UUID format", () => {
    expect(parseLabelHeadUrl("https://labelhead-phi.vercel.app/n/not-a-uuid")).toBeNull();
  });

  it("returns null for malformed URLs", () => {
    expect(parseLabelHeadUrl("not a url at all")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseLabelHeadUrl("")).toBeNull();
  });

  it("handles URLs with trailing slash", () => {
    expect(parseLabelHeadUrl(`https://labelhead-phi.vercel.app/n/${validUuid}/`)).toBe(validUuid);
  });

  it("handles URLs with query parameters", () => {
    expect(parseLabelHeadUrl(`https://labelhead-phi.vercel.app/n/${validUuid}?foo=bar`)).toBe(validUuid);
  });

  it("returns null for URLs with extra path segments after UUID", () => {
    expect(parseLabelHeadUrl(`https://labelhead-phi.vercel.app/n/${validUuid}/edit`)).toBeNull();
  });
});
