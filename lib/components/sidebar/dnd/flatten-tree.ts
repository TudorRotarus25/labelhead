import { type NoteTreeNode } from "@/lib/db/schema";
import { type FlattenedNode } from "./types";

/**
 * Flattens a recursive NoteTreeNode tree into a single-level array
 * suitable for @dnd-kit/sortable. Traverses depth-first.
 * @param nodes - Array of tree nodes to flatten.
 * @param parentId - Parent UUID for the current level (null for root).
 * @param depth - Current nesting depth (0 for root).
 * @returns Flat array of FlattenedNode in depth-first order.
 */
export function flattenTree(
  nodes: NoteTreeNode[],
  parentId: string | null = null,
  depth: number = 0
): FlattenedNode[] {
  const result: FlattenedNode[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    result.push({
      id: node.id,
      parentId,
      depth,
      index: i,
      node,
    });

    if (node.children.length > 0) {
      result.push(...flattenTree(node.children, node.id, depth + 1));
    }
  }

  return result;
}
