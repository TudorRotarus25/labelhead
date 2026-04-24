import { describe, it, expect } from "vitest";
import { extractPreview } from "../extract-preview";

describe("extractPreview", () => {
  it("extracts text from a simple paragraph block", () => {
    const content = [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Hello world" }],
      },
    ];
    expect(extractPreview(content)).toBe("Hello world");
  });

  it("joins multiple blocks with spaces", () => {
    const content = [
      { type: "paragraph", content: [{ type: "text", text: "First paragraph." }] },
      { type: "paragraph", content: [{ type: "text", text: "Second paragraph." }] },
    ];
    expect(extractPreview(content)).toBe("First paragraph. Second paragraph.");
  });

  it("handles blocks with multiple inline content", () => {
    const content = [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Hello " },
          { type: "text", text: "world", styles: { bold: true } },
        ],
      },
    ];
    expect(extractPreview(content)).toBe("Hello world");
  });

  it("truncates to maxLength with ellipsis", () => {
    const longText = "A".repeat(200);
    const content = [
      { type: "paragraph", content: [{ type: "text", text: longText }] },
    ];
    const result = extractPreview(content, 100);
    expect(result.length).toBeLessThanOrEqual(103); // 100 + "..."
    expect(result.endsWith("...")).toBe(true);
  });

  it("does not truncate text within maxLength", () => {
    const content = [
      { type: "paragraph", content: [{ type: "text", text: "Short text" }] },
    ];
    expect(extractPreview(content, 100)).toBe("Short text");
  });

  it("returns empty string for empty content array", () => {
    expect(extractPreview([])).toBe("");
  });

  it("returns empty string for null/undefined content", () => {
    expect(extractPreview(null as unknown as Record<string, unknown>[])).toBe("");
    expect(extractPreview(undefined as unknown as Record<string, unknown>[])).toBe("");
  });

  it("handles heading blocks", () => {
    const content = [
      {
        type: "heading",
        content: [{ type: "text", text: "My Heading" }],
      },
    ];
    expect(extractPreview(content)).toBe("My Heading");
  });

  it("skips blocks without text content (e.g. images)", () => {
    const content = [
      { type: "image", props: { url: "https://example.com/img.png" } },
      { type: "paragraph", content: [{ type: "text", text: "After image" }] },
    ];
    expect(extractPreview(content)).toBe("After image");
  });

  it("handles nested inline content in table cells", () => {
    const content = [
      {
        type: "table",
        content: {
          type: "tableContent",
          rows: [
            {
              cells: [[{ type: "text", text: "Cell 1" }], [{ type: "text", text: "Cell 2" }]],
            },
          ],
        },
      },
    ];
    // Tables are complex — we just skip them gracefully
    const result = extractPreview(content);
    expect(typeof result).toBe("string");
  });

  it("handles blocks with empty content array", () => {
    const content = [
      { type: "paragraph", content: [] },
    ];
    expect(extractPreview(content)).toBe("");
  });
});
