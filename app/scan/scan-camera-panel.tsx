"use client";

import { type RefObject } from "react";

interface ScanCameraPanelProps {
  /** When true, the detection feedback (corners flash + rings + check badge) animates in. */
  showFeedback: boolean;
  onBack: () => void;
  /** Parent supplies the ref so it can own the getUserMedia stream. */
  videoRef?: RefObject<HTMLVideoElement | null>;
}

/**
 * Top half of the scanner screen. Renders the live camera feed, a centered
 * viewfinder, a back button, and the detection-confirmed feedback overlay
 * (corner burst + haptic rings + check badge) when {@link showFeedback} is true.
 *
 * The camera stream itself is managed by the parent via {@link videoRef} so
 * this component stays stateless and testable without mocking getUserMedia.
 */
export function ScanCameraPanel({
  showFeedback,
  onBack,
  videoRef,
}: ScanCameraPanelProps) {
  return (
    <div
      className="relative h-full w-full overflow-hidden bg-black"
      data-testid="scan-camera-panel"
    >
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        playsInline
        muted
        data-testid="scanner-video"
      />

      {/* Viewfinder corners */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        data-testid="scanner-viewfinder"
      >
        <div className="relative h-[180px] w-[180px]">
          <Corner position="tl" active={showFeedback} />
          <Corner position="tr" active={showFeedback} />
          <Corner position="bl" active={showFeedback} />
          <Corner position="br" active={showFeedback} />
        </div>
      </div>

      {/* Detection feedback — rings + badge */}
      {showFeedback && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 animate-scan-haptic rounded-full border-2 border-[var(--accent)]/60"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 animate-scan-haptic rounded-full border-2 border-[var(--accent)]/60 [animation-delay:0.15s]"
          />
          <div
            data-testid="scanner-detection-badge"
            className="pointer-events-none absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 animate-scan-check items-center justify-center rounded-full bg-[var(--accent)] shadow-[0_0_40px_rgba(16,185,129,0.6),0_0_0_8px_rgba(16,185,129,0.2)]"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </>
      )}

      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
        aria-label="Go back"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
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

function Corner({
  position,
  active,
}: {
  position: "tl" | "tr" | "bl" | "br";
  active: boolean;
}) {
  const sideClasses = {
    tl: "top-0 left-0 border-r-0 border-b-0 rounded-tl-lg",
    tr: "top-0 right-0 border-l-0 border-b-0 rounded-tr-lg",
    bl: "bottom-0 left-0 border-r-0 border-t-0 rounded-bl-lg",
    br: "bottom-0 right-0 border-l-0 border-t-0 rounded-br-lg",
  }[position];

  return (
    <span
      aria-hidden="true"
      className={`absolute h-7 w-7 border-[3px] transition-colors duration-200 ${sideClasses} ${
        active
          ? "animate-scan-corner-burst border-[var(--accent)]"
          : "border-white/85"
      }`}
    />
  );
}
