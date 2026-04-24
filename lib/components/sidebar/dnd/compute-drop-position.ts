import { type DropPosition } from "./types";

/**
 * Determines where a drop lands relative to a target node based on
 * the pointer's vertical position within the node's bounding rect.
 *
 * - Top 25%: "before" (reorder above)
 * - Middle 50%: "on" (reparent into)
 * - Bottom 25%: "after" (reorder below)
 *
 * @param nodeRect - The target node's top and height.
 * @param pointerY - The pointer's Y coordinate.
 * @returns The drop position relative to the node.
 */
export function computeDropPosition(
  nodeRect: { top: number; height: number },
  pointerY: number
): DropPosition {
  if (nodeRect.height === 0) return "on";

  const offset = pointerY - nodeRect.top;
  const quarterHeight = nodeRect.height * 0.25;

  if (offset < quarterHeight) return "before";
  if (offset >= nodeRect.height - quarterHeight) return "after";
  return "on";
}
