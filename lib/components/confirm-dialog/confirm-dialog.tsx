"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

/** Props for the ConfirmDialog component. */
interface ConfirmDialogProps {
  /** Whether the dialog is visible. When false, nothing is rendered. */
  open: boolean;
  /** Short heading shown in bold at the top of the dialog. */
  title: string;
  /** Explanatory body text beneath the title. */
  message: string;
  /** Label for the destructive/primary confirm button. */
  confirmLabel: string;
  /** Invoked when the user clicks the confirm button. */
  onConfirm: () => void;
  /** Invoked when the user dismisses the dialog (Cancel, Escape, or backdrop click). */
  onCancel: () => void;
}

/**
 * ConfirmDialog renders a portal-anchored modal for destructive confirmations.
 * A semi-transparent backdrop covers the viewport; a centered card holds the
 * title, message, and Cancel/Confirm buttons. The confirm button is styled in
 * the destructive red palette. The dialog closes via the Cancel button,
 * Escape key, or clicking the backdrop (not the dialog card itself).
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  /** Close on Escape while open. */
  useEffect(() => {
    if (!open) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      data-testid="confirm-dialog-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="confirm-dialog-title"
          className="mb-2 text-lg font-semibold text-gray-900"
        >
          {title}
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
