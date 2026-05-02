"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

/** Props for the NoteMenu component. */
interface NoteMenuProps {
  /** Invoked when the user picks "Delete note" from the menu. */
  onDelete: () => void;
}

/**
 * NoteMenu renders a kebab (three-dot) trigger button with a portal-anchored
 * dropdown. The dropdown currently exposes a single destructive "Delete note"
 * action. Matches the portal popover pattern used by IconButton: positioned
 * beneath the trigger via getBoundingClientRect, and dismissed on selection,
 * Escape, or an outside mousedown.
 */
export function NoteMenu({ onDelete }: NoteMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(
    null
  );
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  /** Close the menu. Stable reference so effect cleanup can depend on it. */
  const close = useCallback(() => setOpen(false), []);

  /**
   * Measure the trigger and place the menu just below its right edge. Recomputed
   * on every open so the menu follows layout shifts (sidebar drawer, viewport
   * resize) without needing a scroll listener.
   */
  const openAndPosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen(true);
  }, []);

  /** Close on Escape or outside mousedown while open. */
  useEffect(() => {
    if (!open) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    function handleMouseDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      close();
    }

    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [open, close]);

  /** User picked "Delete note" — propagate and close. */
  function handleDelete() {
    close();
    onDelete();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Note actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-xl font-bold text-gray-800 hover:bg-gray-100 hover:text-black"
        onClick={openAndPosition}
      >
        <span aria-hidden="true">⋮</span>
      </button>

      {open &&
        position &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Note actions"
            className="fixed z-50 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
            style={{ top: position.top, right: position.right }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleDelete}
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Delete note
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
