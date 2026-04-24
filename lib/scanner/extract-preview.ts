/**
 * Extracts a plain-text preview string from BlockNote JSONB content.
 * Walks block-level nodes and concatenates their inline text content,
 * skipping non-text blocks (images, tables, etc.).
 * @param blocks - The BlockNote content array (stored as JSONB).
 * @param maxLength - Maximum character length before truncation (default 100).
 * @returns A plain-text preview string, truncated with "..." if needed.
 */
export function extractPreview(
  blocks: Record<string, unknown>[],
  maxLength = 100
): string {
  if (!blocks || !Array.isArray(blocks)) return "";

  const parts: string[] = [];

  for (const block of blocks) {
    const text = extractBlockText(block);
    if (text) parts.push(text);
  }

  const joined = parts.join(" ");

  if (joined.length > maxLength) {
    return joined.slice(0, maxLength) + "...";
  }

  return joined;
}

/**
 * Extracts text from a single BlockNote block's inline content array.
 * @param block - A BlockNote block object.
 * @returns Concatenated text from inline content, or empty string.
 */
function extractBlockText(block: Record<string, unknown>): string {
  const content = block.content;

  if (!content || !Array.isArray(content)) return "";

  const texts: string[] = [];
  for (const inline of content) {
    if (
      typeof inline === "object" &&
      inline !== null &&
      "text" in inline &&
      typeof (inline as Record<string, unknown>).text === "string"
    ) {
      texts.push((inline as Record<string, unknown>).text as string);
    }
  }

  return texts.join("");
}
