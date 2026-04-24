import { describe, it, expect } from "vitest";
import { computeDropPosition } from "../compute-drop-position";

describe("computeDropPosition", () => {
  const rect = { top: 100, height: 40 };

  it('returns "before" when pointer is in the top 25%', () => {
    expect(computeDropPosition(rect, 100)).toBe("before");
    expect(computeDropPosition(rect, 109)).toBe("before");
  });

  it('returns "on" when pointer is in the middle 50%', () => {
    expect(computeDropPosition(rect, 110)).toBe("on");
    expect(computeDropPosition(rect, 120)).toBe("on");
    expect(computeDropPosition(rect, 129)).toBe("on");
  });

  it('returns "after" when pointer is in the bottom 25%', () => {
    expect(computeDropPosition(rect, 130)).toBe("after");
    expect(computeDropPosition(rect, 139)).toBe("after");
  });

  it("handles zero-height rect gracefully", () => {
    const zeroRect = { top: 50, height: 0 };
    // With zero height all thresholds collapse; defaults to "on"
    expect(computeDropPosition(zeroRect, 50)).toBe("on");
  });

  it("handles boundary exactly at 25%", () => {
    // 25% of 40 = 10, threshold at 110
    expect(computeDropPosition(rect, 110)).toBe("on");
  });

  it("handles boundary exactly at 75%", () => {
    // 75% of 40 = 30, threshold at 130
    expect(computeDropPosition(rect, 130)).toBe("after");
  });
});
