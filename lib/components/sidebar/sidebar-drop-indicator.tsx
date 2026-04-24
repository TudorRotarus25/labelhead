import { type DropPosition } from "./dnd/types";

/** Props for the SidebarDropIndicator component. */
interface SidebarDropIndicatorProps {
  /** Where the drop is positioned relative to the node. */
  position: DropPosition;
}

/**
 * Visual drop indicator shown during drag-and-drop.
 * - "before" / "after": renders a 2px blue horizontal line.
 * - "on": renders nothing (the parent node handles the ring highlight).
 */
export function SidebarDropIndicator({ position }: SidebarDropIndicatorProps) {
  if (position === "on") return null;

  return (
    <div
      data-testid="drop-indicator"
      data-position={position}
      className="pointer-events-none h-0.5 bg-blue-500 rounded-full mx-1"
    />
  );
}
