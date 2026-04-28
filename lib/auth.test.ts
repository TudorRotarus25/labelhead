import { describe, expect, it } from "vitest";
import {
  AUTH_COOKIE,
  SESSION_MS,
  constantTimeEquals,
  hashPassword,
  signToken,
  verifyToken,
} from "./auth";

const SECRET = "a".repeat(64);

describe("constants", () => {
  it("exposes a cookie name and a 30-day session window", () => {
    expect(AUTH_COOKIE).toBe("labelhead_auth");
    expect(SESSION_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });
});

describe("hashPassword", () => {
  it("returns a 64-char lowercase hex SHA-256 digest", async () => {
    const hash = await hashPassword("hunter2");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).toBe(b);
  });

  it("produces different output for different inputs", async () => {
    const a = await hashPassword("one");
    const b = await hashPassword("two");
    expect(a).not.toBe(b);
  });

  it("matches a known SHA-256 of an empty string", async () => {
    // SHA-256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    expect(await hashPassword("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });
});

describe("constantTimeEquals", () => {
  it("returns true for identical strings", () => {
    expect(constantTimeEquals("abc123", "abc123")).toBe(true);
  });

  it("returns false for differing strings of equal length", () => {
    expect(constantTimeEquals("abc123", "abc124")).toBe(false);
  });

  it("returns false for strings of different lengths (without throwing)", () => {
    expect(constantTimeEquals("abc", "abcd")).toBe(false);
  });
});

describe("signToken / verifyToken", () => {
  it("signs a token in the format '<expiry>.<hmacHex>'", async () => {
    const expiry = Date.now() + 60_000;
    const token = await signToken(expiry, SECRET);
    const parts = token.split(".");
    expect(parts).toHaveLength(2);
    expect(parts[0]).toBe(String(expiry));
    expect(parts[1]).toMatch(/^[0-9a-f]{64}$/);
  });

  it("verifies a freshly-signed token", async () => {
    const expiry = Date.now() + 60_000;
    const token = await signToken(expiry, SECRET);
    expect(await verifyToken(token, SECRET)).toBe(true);
  });

  it("rejects a token signed with a different secret", async () => {
    const expiry = Date.now() + 60_000;
    const token = await signToken(expiry, SECRET);
    expect(await verifyToken(token, "b".repeat(64))).toBe(false);
  });

  it("rejects a tampered expiry", async () => {
    const expiry = Date.now() + 60_000;
    const token = await signToken(expiry, SECRET);
    const [, sig] = token.split(".");
    const forged = `${expiry + 1_000_000}.${sig}`;
    expect(await verifyToken(forged, SECRET)).toBe(false);
  });

  it("rejects a tampered signature", async () => {
    const expiry = Date.now() + 60_000;
    const token = await signToken(expiry, SECRET);
    const [exp, sig] = token.split(".");
    const flipped = sig.startsWith("0")
      ? `1${sig.slice(1)}`
      : `0${sig.slice(1)}`;
    expect(await verifyToken(`${exp}.${flipped}`, SECRET)).toBe(false);
  });

  it("rejects an expired token", async () => {
    const expiry = Date.now() - 1_000;
    const token = await signToken(expiry, SECRET);
    expect(await verifyToken(token, SECRET)).toBe(false);
  });

  it("rejects a malformed token", async () => {
    expect(await verifyToken("not-a-token", SECRET)).toBe(false);
    expect(await verifyToken("", SECRET)).toBe(false);
    expect(await verifyToken("123.", SECRET)).toBe(false);
    expect(await verifyToken(".abc", SECRET)).toBe(false);
  });

  it("rejects a token whose expiry is not a number", async () => {
    expect(await verifyToken("notanumber.abcd", SECRET)).toBe(false);
  });
});
