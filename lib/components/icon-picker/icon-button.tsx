"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

/** Fallback icon used when a note has no explicit icon set. */
const DEFAULT_ICON = "📄";

/** Available button sizes. */
type IconButtonSize = "sm" | "lg";

/** Shape of the object emoji-mart passes to `onEmojiSelect`. */
interface EmojiMartEmoji {
  native: string;
}

/** Props for the IconButton component. */
interface IconButtonProps {
  /** Current icon emoji, or null for the default placeholder. */
  icon: string | null;
  /** Called with the selected emoji, or null when the user clears the icon. */
  onChange: (icon: string | null) => void;
  /** Visual size preset. `sm` fits tight sidebar rows, `lg` matches the edit-page title bar. */
  size?: IconButtonSize;
  /** Accessible label for the trigger button. Defaults to "Change icon". */
  ariaLabel?: string;
}

/** Size classes keyed by preset. */
const SIZE_CLASSES: Record<IconButtonSize, string> = {
  sm: "h-5 w-5 text-sm",
  lg: "h-10 w-10 text-3xl",
};

/**
 * IconButton renders the current note icon (or the default placeholder) as a
 * clickable trigger. Clicking it opens an emoji-mart picker in a portal popover
 * anchored beneath the trigger. Selection calls `onChange` with the chosen
 * emoji; a secondary "Remove icon" action clears the value. The popover closes
 * on selection, Escape, and outside click.
 */
export function IconButton({
  icon,
  onChange,
  size = "sm",
  ariaLabel = "Change icon",
}: IconButtonProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null
  );
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const displayIcon = icon ?? DEFAULT_ICON;

  /** Close the popover. Stable reference for effect cleanup. */
  const close = useCallback(() => setOpen(false), []);

  /**
   * Measure the trigger and place the popover just below it. Recomputed when
   * opening so the popover follows the trigger across re-layouts (e.g. the
   * mobile drawer opening).
   */
  const openAndPosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen(true);
  }, []);

  /** Close on Escape or outside click while open. */
  useEffect(() => {
    if (!open) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    function handleMouseDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (popoverRef.current?.contains(target)) return;
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

  /** User picked an emoji — propagate and close. */
  function handleEmojiSelect(emoji: EmojiMartEmoji) {
    onChange(emoji.native);
    close();
  }

  /** User cleared the icon — propagate null and close. */
  function handleRemove() {
    onChange(null);
    close();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex shrink-0 items-center justify-center rounded hover:bg-gray-100 ${SIZE_CLASSES[size]}`}
        onClick={openAndPosition}
      >
        <span role="img" aria-hidden="true">
          {displayIcon}
        </span>
      </button>

      {open &&
        position &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Icon picker"
            className="fixed z-50 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
            style={{ top: position.top, left: position.left }}
          >
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              autoFocus
              theme="light"
              previewPosition="none"
              skinTonePosition="none"
            />
            {icon !== null && (
              <div className="border-t border-gray-200 p-2 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleRemove}
                  className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Remove icon
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
