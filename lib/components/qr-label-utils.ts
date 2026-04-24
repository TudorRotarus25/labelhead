import QRCode from "qrcode";

/** QR code pixel dimensions. */
const QR_SIZE = 200;

/** Height reserved for the title text below the QR code. */
const TITLE_AREA_HEIGHT = 50;

/** Total label dimensions (QR + title). */
export const LABEL_WIDTH = QR_SIZE;
export const LABEL_HEIGHT = QR_SIZE + TITLE_AREA_HEIGHT;

/**
 * Builds the full URL for a note, suitable for embedding in a QR code.
 * @param noteId - The note's UUID.
 * @returns The absolute URL to the note's public view.
 */
export function buildNoteUrl(noteId: string): string {
  const base =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL || "https://labelhead-phi.vercel.app";
  return `${base}/n/${noteId}`;
}

/**
 * Truncates a title string to fit within a given pixel width on a canvas.
 * @param ctx - Canvas 2D rendering context (used to measure text).
 * @param title - The original title string.
 * @param maxWidth - Maximum pixel width for the text.
 * @returns The title, truncated with ellipsis if necessary.
 */
export function truncateTitle(
  ctx: CanvasRenderingContext2D,
  title: string,
  maxWidth: number
): string {
  if (ctx.measureText(title).width <= maxWidth) return title;

  let truncated = title;
  while (truncated.length > 0 && ctx.measureText(truncated + "…").width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "…";
}

/**
 * Generates a composite QR label canvas: QR code on top, title text below.
 * Optimized for Nelko P21 label printer (15mm tape, ~200px at 300 DPI).
 * @param noteId - The note's UUID (encoded in the QR code URL).
 * @param title - The note's title (rendered below the QR code).
 * @returns A canvas element containing the composite label image.
 */
export async function generateQRLabel(
  noteId: string,
  title: string
): Promise<HTMLCanvasElement> {
  const url = buildNoteUrl(noteId);

  // Generate QR code on a temporary canvas
  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, url, {
    width: QR_SIZE,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  // Create the final composite canvas
  const canvas = document.createElement("canvas");
  canvas.width = LABEL_WIDTH;
  canvas.height = LABEL_HEIGHT;
  const ctx = canvas.getContext("2d")!;

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, LABEL_WIDTH, LABEL_HEIGHT);

  // Draw QR code on top
  ctx.drawImage(qrCanvas, 0, 0, QR_SIZE, QR_SIZE);

  // Draw title text below
  ctx.fillStyle = "#000000";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const displayTitle = truncateTitle(ctx, title || "Untitled", LABEL_WIDTH - 16);
  ctx.fillText(displayTitle, LABEL_WIDTH / 2, QR_SIZE + TITLE_AREA_HEIGHT / 2);

  return canvas;
}

/**
 * Converts a canvas element to a PNG Blob.
 * @param canvas - The canvas to convert.
 * @returns A Promise resolving to the PNG Blob.
 */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create blob from canvas"));
    }, "image/png");
  });
}
