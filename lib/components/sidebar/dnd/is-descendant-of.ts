import { type FlattenedNode } from "./types";

/**
 * Checks whether a node is a descendant of a potential ancestor
 * by walking up the parent chain in the flattened tree.
 * Used to prevent circular references during drag-and-drop (a node
 * cannot be dropped into one of its own descendants).
 *
 * @param nodeId - The node to check ancestry for.
 * @param potentialAncestorId - The node that may be an ancestor.
 * @param flatNodes - The flattened tree to search.
 * @returns True if nodeId is a descendant of potentialAncestorId.
 */
export function isDescendantOf(
  nodeId: string,
  potentialAncestorId: string,
  flatNodes: FlattenedNode[]
): boolean {
  const nodeMap = new Map(flatNodes.map((n) => [n.id, n]));

  let current = nodeMap.get(nodeId);
  while (current?.parentId) {
    if (current.parentId === potentialAncestorId) return true;
    current = nodeMap.get(current.parentId);
  }

  return false;
}
