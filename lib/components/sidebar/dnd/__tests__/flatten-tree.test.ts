import { describe, it, expect } from "vitest";
import { flattenTree } from "../flatten-tree";
import { type NoteTreeNode } from "@/lib/db/schema";

/** Factory for a minimal NoteTreeNode fixture. */
function makeNode(overrides: Partial<NoteTreeNode> = {}): NoteTreeNode {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    title: "Test Note",
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

describe("flattenTree", () => {
  it("returns an empty array for an empty tree", () => {
    expect(flattenTree([])).toEqual([]);
  });

  it("flattens a single root node", () => {
    const nodes: NoteTreeNode[] = [makeNode({ id: "a", title: "Root" })];
    const result = flattenTree(nodes);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "a",
      parentId: null,
      depth: 0,
      index: 0,
    });
  });

  it("flattens multiple root nodes with correct indices", () => {
    const nodes: NoteTreeNode[] = [
      makeNode({ id: "a", title: "First" }),
      makeNode({ id: "b", title: "Second" }),
      makeNode({ id: "c", title: "Third" }),
    ];
    const result = flattenTree(nodes);

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ id: "a", index: 0, depth: 0 });
    expect(result[1]).toMatchObject({ id: "b", index: 1, depth: 0 });
    expect(result[2]).toMatchObject({ id: "c", index: 2, depth: 0 });
  });

  it("flattens nested children in depth-first order", () => {
    const nodes: NoteTreeNode[] = [
      makeNode({
        id: "parent",
        title: "Parent",
        children: [
          makeNode({
            id: "child-1",
            title: "Child 1",
            parentId: "parent",
          }),
          makeNode({
            id: "child-2",
            title: "Child 2",
            parentId: "parent",
          }),
        ],
      }),
    ];
    const result = flattenTree(nodes);

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ id: "parent", depth: 0, index: 0, parentId: null });
    expect(result[1]).toMatchObject({ id: "child-1", depth: 1, index: 0, parentId: "parent" });
    expect(result[2]).toMatchObject({ id: "child-2", depth: 1, index: 1, parentId: "parent" });
  });

  it("handles deeply nested trees", () => {
    const nodes: NoteTreeNode[] = [
      makeNode({
        id: "a",
        children: [
          makeNode({
            id: "b",
            parentId: "a",
            children: [
              makeNode({ id: "c", parentId: "b" }),
            ],
          }),
        ],
      }),
    ];
    const result = flattenTree(nodes);

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ id: "a", depth: 0, parentId: null });
    expect(result[1]).toMatchObject({ id: "b", depth: 1, parentId: "a" });
    expect(result[2]).toMatchObject({ id: "c", depth: 2, parentId: "b" });
  });

  it("preserves the original node reference", () => {
    const node = makeNode({ id: "x", title: "Original" });
    const result = flattenTree([node]);

    expect(result[0].node).toBe(node);
  });
});
