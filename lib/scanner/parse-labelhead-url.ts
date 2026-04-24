/** Regex matching a LabelHead note path: /n/{uuid} */
const NOTE_PATH_PATTERN =
  /^\/n\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i;

/**
 * Parses a URL string and extracts the LabelHead note ID if it matches
 * the `/n/{uuid}` pattern. Returns null for non-LabelHead URLs, malformed
 * input, or URLs with extra path segments (e.g. `/n/{uuid}/edit`).
 * @param raw - The raw string decoded from a QR code.
 * @returns The note UUID, or null if the URL is not a LabelHead note link.
 */
export function parseLabelHeadUrl(raw: string): string | null {
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const match = url.pathname.match(NOTE_PATH_PATTERN);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
