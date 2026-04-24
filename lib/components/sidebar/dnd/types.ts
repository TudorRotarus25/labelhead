import { type NoteTreeNode } from "@/lib/db/schema";

/** A tree node flattened into a single-level array for @dnd-kit/sortable. */
export interface FlattenedNode {
  /** Note UUID. */
  id: string;
  /** Parent note UUID, or null for root-level nodes. */
  parentId: string | null;
  /** Nesting depth (0 = root). */
  depth: number;
  /** Sibling index within the parent's children. */
  index: number;
  /** The original tree node reference. */
  node: NoteTreeNode;
}

/** Where a drop lands relative to the target node. */
export type DropPosition = "before" | "on" | "after";
