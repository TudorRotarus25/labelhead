"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { generateQRLabel, canvasToBlob } from "./qr-label-utils";

/**
 * QRLabel displays a QR code label for a note, with download and share actions.
 * The QR code encodes the note's permanent URL (/n/{uuid}).
 * Optimized for Nelko P21 label printer (15mm tape width).
 *
 * @param props.noteId - The note's UUID (encoded in the QR URL).
 * @param props.noteTitle - The note's title (rendered below the QR code).
 */
export function QRLabel({
  noteId,
  noteTitle,
}: {
  noteId: string;
  noteTitle: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      setLoading(true);
      const canvas = await generateQRLabel(noteId, noteTitle);
      if (cancelled) return;

      canvasRef.current = canvas;

      // Mount the canvas in the container
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(canvas);
      }
      setLoading(false);
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [noteId, noteTitle]);

  /** Downloads the QR label as a PNG file. */
  const handleDownload = useCallback(async () => {
    if (!canvasRef.current) return;
    const blob = await canvasToBlob(canvasRef.current);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${noteTitle || "label"}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, [noteTitle]);

  /** Shares the QR label via the Web Share API (mobile). */
  const handleShare = useCallback(async () => {
    if (!canvasRef.current) return;
    const blob = await canvasToBlob(canvasRef.current);
    const file = new File([blob], `${noteTitle || "label"}.png`, {
      type: "image/png",
    });

    try {
      await navigator.share({ files: [file] });
    } catch {
      // User cancelled or share failed — fall back to download
      handleDownload();
    }
  }, [noteTitle, handleDownload]);

  return (
    <div className="flex items-center gap-4">
      <div
        ref={containerRef}
        className="shrink-0 overflow-hidden rounded border border-gray-200 dark:border-gray-700"
        aria-label="QR code label"
      >
        {loading && (
          <div className="flex h-[250px] w-[200px] items-center justify-center text-sm text-gray-400">
            Generating...
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Label for this note
        </p>
        <button
          type="button"
          onClick={handleDownload}
          className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
        >
          Download PNG
        </button>
        {canShare && (
          <button
            type="button"
            onClick={handleShare}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Share
          </button>
        )}
      </div>
    </div>
  );
}
