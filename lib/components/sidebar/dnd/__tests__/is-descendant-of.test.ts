import { describe, it, expect } from "vitest";
import { isDescendantOf } from "../is-descendant-of";
import { type FlattenedNode } from "../types";
import { type NoteTreeNode } from "@/lib/db/schema";

/** Factory for a minimal NoteTreeNode fixture. */
function makeNode(overrides: Partial<NoteTreeNode> = {}): NoteTreeNode {
  return {
    id: "default",
    title: "",
    content: [],
    parentId: null,
    icon: null,
    order: 0,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    children: [],
    ...overrides,
  };
}

/** Factory for a flat node entry. */
function flat(id: string, parentId: string | null): FlattenedNode {
  return {
    id,
    parentId,
    depth: 0,
    index: 0,
    node: makeNode({ id, parentId }),
  };
}

describe("isDescendantOf", () => {
  // Tree: A -> B -> C
  const flatNodes: FlattenedNode[] = [
    flat("a", null),
    flat("b", "a"),
    flat("c", "b"),
  ];

  it("returns true for a direct child", () => {
    expect(isDescendantOf("b", "a", flatNodes)).toBe(true);
  });

  it("returns true for a deep descendant", () => {
    expect(isDescendantOf("c", "a", flatNodes)).toBe(true);
  });

  it("returns false for a non-descendant", () => {
    expect(isDescendantOf("a", "c", flatNodes)).toBe(false);
  });

  it("returns false when node is the same as the potential ancestor", () => {
    expect(isDescendantOf("a", "a", flatNodes)).toBe(false);
  });

  it("returns false for siblings", () => {
    const siblings: FlattenedNode[] = [
      flat("parent", null),
      flat("x", "parent"),
      flat("y", "parent"),
    ];
    expect(isDescendantOf("x", "y", siblings)).toBe(false);
    expect(isDescendantOf("y", "x", siblings)).toBe(false);
  });

  it("returns false when nodeId does not exist", () => {
    expect(isDescendantOf("nonexistent", "a", flatNodes)).toBe(false);
  });

  it("returns false when potentialAncestorId does not exist", () => {
    expect(isDescendantOf("b", "nonexistent", flatNodes)).toBe(false);
  });
});
