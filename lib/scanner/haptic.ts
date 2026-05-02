/** Duration of the detection-confirmed haptic buzz in milliseconds. */
const TAP_DURATION_MS = 40;

/**
 * Fires a short haptic buzz to confirm a successful QR detection.
 * No-ops when the Vibration API is unavailable (desktop, iOS Safari).
 * Errors are swallowed so feature-policy rejections can't crash the decode loop.
 */
export function hapticTap(): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }
  try {
    navigator.vibrate(TAP_DURATION_MS);
  } catch {
    // Permissions-Policy can reject vibrate; the scanner doesn't need to know.
  }
}
