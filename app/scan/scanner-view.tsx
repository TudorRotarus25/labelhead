"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { parseLabelHeadUrl } from "@/lib/scanner/parse-labelhead-url";
import { extractPreview } from "@/lib/scanner/extract-preview";
import { getNote } from "@/app/actions/notes";

/** Scanner state machine states. */
type ScannerState =
  | "idle"
  | "requesting_permission"
  | "scanning"
  | "detected"
  | "permission_denied";

/** Data for a detected note shown in the overlay. */
interface DetectedNote {
  id: string;
  title: string;
  icon: string | null;
  preview: string;
}

/** Decode interval in milliseconds (~7 fps). */
const DECODE_INTERVAL_MS = 150;

/** How long the overlay stays visible (ms). */
const OVERLAY_DURATION_MS = 3000;

/** Cooldown before the same QR code triggers a new fetch (ms). */
const SAME_QR_COOLDOWN_MS = 3000;

/**
 * Full-screen QR scanner with camera feed and detection overlay.
 * Uses getUserMedia for the camera, draws frames to a hidden canvas,
 * and decodes QR codes with jsQR at throttled intervals.
 */
export function ScannerView() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const decodeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDetectedIdRef = useRef<string | null>(null);
  const lastDetectedTimeRef = useRef<number>(0);

  const [state, setState] = useState<ScannerState>("idle");
  const [detected, setDetected] = useState<DetectedNote | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);

  /** Starts the camera and begins scanning. */
  const startCamera = useCallback(async () => {
    setState("requesting_permission");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState("scanning");
    } catch {
      setState("permission_denied");
    }
  }, []);

  /** Stops the camera and clears timers. */
  const stopCamera = useCallback(() => {
    if (decodeTimerRef.current) {
      clearInterval(decodeTimerRef.current);
      decodeTimerRef.current = null;
    }
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
      overlayTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  /** Decodes a single frame from the video feed. */
  const decodeFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (!code?.data) return;

    const noteId = parseLabelHeadUrl(code.data);
    if (!noteId) return; // Ignore non-LabelHead QR codes

    // Debounce: skip if same QR within cooldown period
    const now = Date.now();
    if (
      noteId === lastDetectedIdRef.current &&
      now - lastDetectedTimeRef.current < SAME_QR_COOLDOWN_MS
    ) {
      return;
    }

    lastDetectedIdRef.current = noteId;
    lastDetectedTimeRef.current = now;

    // Fetch note data
    const note = await getNote(noteId);
    if (!note) return;

    const preview = extractPreview(
      (note.content as Record<string, unknown>[]) ?? []
    );

    setDetected({
      id: note.id,
      title: note.title || "Untitled",
      icon: note.icon,
      preview,
    });
    setOverlayVisible(true);
    setState("detected");

    // Auto-fade overlay
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    overlayTimerRef.current = setTimeout(() => {
      setOverlayVisible(false);
      setState("scanning");
    }, OVERLAY_DURATION_MS);
  }, []);

  // Start camera on mount, clean up on unmount
  useEffect(() => {
    startCamera();
    return stopCamera;
  }, [startCamera, stopCamera]);

  // Start decode loop when scanning
  useEffect(() => {
    if (state === "scanning" || state === "detected") {
      decodeTimerRef.current = setInterval(decodeFrame, DECODE_INTERVAL_MS);
      return () => {
        if (decodeTimerRef.current) {
          clearInterval(decodeTimerRef.current);
          decodeTimerRef.current = null;
        }
      };
    }
  }, [state, decodeFrame]);

  /** Navigates to the detected note's read-only view. */
  function handleOverlayTap() {
    if (!detected) return;
    stopCamera();
    router.push(`/n/${detected.id}`);
  }

  return (
    <div className="relative h-full w-full bg-black" data-testid="scanner-view">
      {/* Camera feed */}
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        playsInline
        muted
        data-testid="scanner-video"
      />

      {/* Hidden canvas for frame extraction */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Crosshair guide */}
      {(state === "scanning" || state === "detected") && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-48 w-48 rounded-2xl border-2 border-white/40" />
        </div>
      )}

      {/* Permission denied state */}
      {state === "permission_denied" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 px-6 text-center"
          data-testid="permission-denied"
        >
          <div className="text-4xl">📷</div>
          <h2 className="text-lg font-semibold text-white">
            Camera access required
          </h2>
          <p className="max-w-xs text-sm text-zinc-400">
            LabelHead needs camera access to scan QR codes. Please enable camera
            permissions in your browser settings and reload the page.
          </p>
          <button
            type="button"
            onClick={() => startCamera()}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
          >
            Try again
          </button>
        </div>
      )}

      {/* Detection overlay */}
      {detected && (
        <button
          type="button"
          onClick={handleOverlayTap}
          data-testid="detection-overlay"
          className={`absolute bottom-6 left-4 right-4 rounded-xl bg-white/95 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 ${
            overlayVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl" data-testid="overlay-icon">
              {detected.icon ?? "📄"}
            </span>
            <div className="min-w-0 flex-1 text-left">
              <h3
                className="truncate text-sm font-semibold text-zinc-900"
                data-testid="overlay-title"
              >
                {detected.title}
              </h3>
              {detected.preview && (
                <p
                  className="mt-0.5 line-clamp-2 text-xs text-zinc-500"
                  data-testid="overlay-preview"
                >
                  {detected.preview}
                </p>
              )}
              <p className="mt-1 text-xs text-blue-600">Tap to open</p>
            </div>
          </div>
        </button>
      )}

      {/* Back button */}
      <button
        type="button"
        onClick={() => {
          stopCamera();
          router.back();
        }}
        className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
        aria-label="Go back"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
    </div>
  );
}
