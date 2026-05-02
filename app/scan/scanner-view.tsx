"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { parseLabelHeadUrl } from "@/lib/scanner/parse-labelhead-url";
import { extractPreview } from "@/lib/scanner/extract-preview";
import { hapticTap } from "@/lib/scanner/haptic";
import { getNote } from "@/app/actions/notes";
import { ScanCameraPanel } from "./scan-camera-panel";
import { ScanNotePanel, type ScanNoteData } from "./scan-note-panel";

/** Scanner state machine states. */
type ScannerState =
  | "idle"
  | "requesting_permission"
  | "scanning"
  | "loading"
  | "detected"
  | "permission_denied";

/** Decode interval in milliseconds (~7 fps). */
const DECODE_INTERVAL_MS = 150;

/** How long the detection-confirmed feedback animation plays. */
const FEEDBACK_DURATION_MS = 600;

/**
 * Full-screen QR scanner with a 50/50 vertical split: camera feed on top,
 * note content on bottom. Uses getUserMedia for the camera, draws frames
 * to a hidden canvas, and decodes QR codes with jsQR at throttled intervals.
 *
 * The note panel is sticky — it stays visible until a different LabelHead QR
 * is scanned, so users can pause mid-workflow without losing context.
 */
export function ScannerView() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const decodeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightIdRef = useRef<string | null>(null);

  const [state, setState] = useState<ScannerState>("requesting_permission");
  const [detected, setDetected] = useState<ScanNoteData | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  /**
   * Requests camera access and attaches the stream to the video element.
   * Sets component state based on whether the user grants or denies camera
   * permission. Called on mount and from the retry button.
   */
  const attachCameraStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // iOS Safari can leave play()'s promise pending even while the stream
        // renders. Fire-and-forget so the decode loop arms regardless.
        videoRef.current.play().catch(() => {});
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
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
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
    // iOS Safari often plateaus readyState at HAVE_CURRENT_DATA (2) for
    // getUserMedia streams, so HAVE_ENOUGH_DATA (4) is too strict. Gate on
    // actual frame dimensions instead — that's what drawImage/jsQR require.
    if (
      !video ||
      !canvas ||
      video.readyState < video.HAVE_CURRENT_DATA ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      return;
    }

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

    // Swap-on-different: ignore the same QR while its note is already showing
    // or being fetched, so the user isn't hammered with re-triggering feedback
    // every frame while the camera lingers on the label.
    if (noteId === detected?.id || noteId === inFlightIdRef.current) {
      return;
    }

    // Fire feedback immediately — even before the network resolves — so the
    // tap/haptic lines up with the moment the QR crosses the viewfinder.
    inFlightIdRef.current = noteId;
    hapticTap();
    setShowFeedback(true);
    setState("loading");
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(
      () => setShowFeedback(false),
      FEEDBACK_DURATION_MS
    );

    // Fetch note data. Wrap in try/catch because this runs inside a
    // setInterval callback — an unhandled rejection here is invisible and
    // looks identical to "nothing happened".
    let note: Awaited<ReturnType<typeof getNote>>;
    try {
      note = await getNote(noteId);
    } catch (err) {
      console.error("[scanner] getNote failed", err);
      inFlightIdRef.current = null;
      setState("scanning");
      return;
    }
    inFlightIdRef.current = null;
    if (!note) {
      setState("scanning");
      return;
    }

    const preview = extractPreview(
      (note.content as Record<string, unknown>[]) ?? []
    );

    setDetected({
      id: note.id,
      title: note.title || "Untitled",
      icon: note.icon,
      preview,
    });
    setState("detected");
  }, [detected?.id]);

  // Start camera on mount, clean up on unmount. The Promise returned by
  // `attachCameraStream` is intentionally unhandled here — it uses its own
  // try/catch to drive state transitions in async callbacks.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state transitions occur in async Promise callbacks, not synchronously in the effect body.
    void attachCameraStream();
    return stopCamera;
  }, [attachCameraStream, stopCamera]);

  // Start decode loop while the camera is active. "loading" and "detected"
  // keep the loop running so the next distinct QR can swap the panel.
  useEffect(() => {
    if (
      state === "scanning" ||
      state === "loading" ||
      state === "detected"
    ) {
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
  const handleOpen = useCallback(
    (noteId: string) => {
      stopCamera();
      router.push(`/n/${noteId}`);
    },
    [router, stopCamera]
  );

  /** Navigates to the detected note's edit view. */
  const handleEdit = useCallback(
    (noteId: string) => {
      stopCamera();
      router.push(`/n/${noteId}?edit=1`);
    },
    [router, stopCamera]
  );

  const handleBack = useCallback(() => {
    stopCamera();
    router.back();
  }, [router, stopCamera]);

  // Map the scanner state to the note panel's visual state.
  const notePanelState =
    state === "loading"
      ? "loading"
      : state === "detected"
        ? "loaded"
        : "idle";

  return (
    <div
      className="relative flex h-full w-full flex-col bg-black"
      data-testid="scanner-view"
    >
      {/* Top half — camera */}
      <div className="relative h-1/2 w-full">
        <ScanCameraPanel
          showFeedback={showFeedback}
          onBack={handleBack}
          videoRef={videoRef}
        />

        {/* Hidden canvas for frame extraction */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Permission denied overlay (covers the camera area only) */}
        {state === "permission_denied" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 px-6 text-center"
            data-testid="permission-denied"
          >
            <div className="text-4xl">📷</div>
            <h2 className="text-base font-semibold text-white">
              Camera access required
            </h2>
            <p className="max-w-xs text-sm text-zinc-400">
              LabelHead needs camera access to scan QR codes. Please enable
              camera permissions in your browser settings and reload the page.
            </p>
            <button
              type="button"
              onClick={() => {
                setState("requesting_permission");
                attachCameraStream();
              }}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Bottom half — note panel */}
      <div className="h-1/2 w-full">
        <ScanNotePanel
          state={notePanelState}
          note={detected}
          onOpen={handleOpen}
          onEdit={handleEdit}
        />
      </div>
    </div>
  );
}
