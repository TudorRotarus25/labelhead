import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { hapticTap } from "../haptic";

describe("hapticTap", () => {
  const originalVibrate = navigator.vibrate;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, "vibrate", {
      value: originalVibrate,
      writable: true,
      configurable: true,
    });
  });

  it("calls navigator.vibrate with a short buzz when available", () => {
    const vibrate = vi.fn(() => true);
    Object.defineProperty(navigator, "vibrate", {
      value: vibrate,
      writable: true,
      configurable: true,
    });

    hapticTap();

    expect(vibrate).toHaveBeenCalledTimes(1);
    expect(vibrate).toHaveBeenCalledWith(40);
  });

  it("is a no-op when navigator.vibrate is undefined", () => {
    Object.defineProperty(navigator, "vibrate", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    expect(() => hapticTap()).not.toThrow();
  });

  it("swallows errors thrown by vibrate (e.g. permissions policy)", () => {
    const vibrate = vi.fn(() => {
      throw new Error("blocked");
    });
    Object.defineProperty(navigator, "vibrate", {
      value: vibrate,
      writable: true,
      configurable: true,
    });

    expect(() => hapticTap()).not.toThrow();
  });
});
