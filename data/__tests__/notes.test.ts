import { describe, it, expect, beforeEach } from "vitest";
import { testDb, cleanDatabase } from "@/lib/test/setup";
import {
  createNote,
  getNote,
  updateNote,
  deleteNote,
  getNoteTree,
  moveNote,
} from "@/data/notes";

beforeEach(async () => {
  await cleanDatabase();
});

describe("createNote", () => {
  it("should create a note with default values and return it with a UUID id", async () => {
    const note = await createNote({}, testDb);

    expect(note.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(note.title).toBe("");
    expect(note.content).toEqual([]);
    expect(note.parentId).toBeNull();
    expect(note.icon).toBeNull();
    expect(note.order).toBe(0);
  });

  it("should create a note with title, content, and icon", async () => {
    const content = [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }];
    const note = await createNote(
      { title: "My Note", content, icon: "📦" },
      testDb
    );

    expect(note.title).toBe("My Note");
    expect(note.content).toEqual(content);
    expect(note.icon).toBe("📦");
  });

  it("should auto-assign order as last sibling when order is not specified", async () => {
    const first = await createNote({ title: "First" }, testDb);
    const second = await createNote({ title: "Second" }, testDb);
    const third = await createNote({ title: "Third" }, testDb);

    expect(first.order).toBe(0);
    expect(second.order).toBe(1);
    expect(third.order).toBe(2);
  });

  it("should create a child note with parentId referencing an existing note", async () => {
    const parent = await createNote({ title: "Parent" }, testDb);
    const child = await createNote(
      { title: "Child", parentId: parent.id },
      testDb
    );

    expect(child.parentId).toBe(parent.id);
  });

  it("should auto-assign order within the same parent scope", async () => {
    const parent = await createNote({ title: "Parent" }, testDb);
    const rootNote = await createNote({ title: "Root" }, testDb);
    const child1 = await createNote({ title: "Child 1", parentId: parent.id }, testDb);
    const child2 = await createNote({ title: "Child 2", parentId: parent.id }, testDb);

    // Root-level notes have their own ordering
    expect(rootNote.order).toBe(1);
    // Children under parent have their own ordering starting at 0
    expect(child1.order).toBe(0);
    expect(child2.order).toBe(1);
  });

  it("should set createdAt and updatedAt to approximately now", async () => {
    const before = new Date();
    const note = await createNote({ title: "Timestamped" }, testDb);
    const after = new Date();

    expect(note.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
    expect(note.createdAt.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
    expect(note.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
    expect(note.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
  });
});

describe("getNote", () => {
  it("should return a note by valid UUID", async () => {
    const created = await createNote({ title: "Findable" }, testDb);
    const found = await getNote(created.id, testDb);

    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.title).toBe("Findable");
  });

  it("should return null for a UUID that does not exist", async () => {
    const found = await getNote("00000000-0000-0000-0000-000000000000", testDb);
    expect(found).toBeNull();
  });

  it("should return null for an invalid UUID format", async () => {
    const found = await getNote("not-a-uuid", testDb);
    expect(found).toBeNull();
  });
});

describe("updateNote", () => {
  it("should update title only", async () => {
    const note = await createNote({ title: "Original" }, testDb);
    const updated = await updateNote(note.id, { title: "Updated" }, testDb);

    expect(updated).not.toBeNull();
    expect(updated!.title).toBe("Updated");
    expect(updated!.icon).toBe(note.icon);
  });

  it("should update content with JSONB data", async () => {
    const note = await createNote({}, testDb);
    const content = [{ type: "heading", content: [{ type: "text", text: "Title" }] }];
    const updated = await updateNote(note.id, { content }, testDb);

    expect(updated!.content).toEqual(content);
  });

  it("should update icon", async () => {
    const note = await createNote({}, testDb);
    const updated = await updateNote(note.id, { icon: "🏠" }, testDb);

    expect(updated!.icon).toBe("🏠");
  });

  it("should update order", async () => {
    const note = await createNote({}, testDb);
    const updated = await updateNote(note.id, { order: 5 }, testDb);

    expect(updated!.order).toBe(5);
  });

  it("should update multiple fields simultaneously", async () => {
    const note = await createNote({}, testDb);
    const updated = await updateNote(
      note.id,
      { title: "New Title", icon: "📋", order: 3 },
      testDb
    );

    expect(updated!.title).toBe("New Title");
    expect(updated!.icon).toBe("📋");
    expect(updated!.order).toBe(3);
  });

  it("should return null when updating a non-existent note", async () => {
    const updated = await updateNote(
      "00000000-0000-0000-0000-000000000000",
      { title: "Ghost" },
      testDb
    );
    expect(updated).toBeNull();
  });

  it("should update the updatedAt timestamp to a later value than createdAt", async () => {
    const note = await createNote({ title: "Watch the clock" }, testDb);

    // Small delay to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 50));

    const updated = await updateNote(note.id, { title: "Ticked" }, testDb);

    expect(updated!.updatedAt.getTime()).toBeGreaterThanOrEqual(
      note.createdAt.getTime()
    );
  });
});

describe("deleteNote", () => {
  it("should delete a leaf note", async () => {
    const note = await createNote({ title: "Doomed" }, testDb);
    await deleteNote(note.id, testDb);

    const found = await getNote(note.id, testDb);
    expect(found).toBeNull();
  });

  it("should reparent children to the deleted note's parent", async () => {
    const grandparent = await createNote({ title: "Grandparent" }, testDb);
    const parent = await createNote(
      { title: "Parent", parentId: grandparent.id },
      testDb
    );
    const child = await createNote(
      { title: "Child", parentId: parent.id },
      testDb
    );

    await deleteNote(parent.id, testDb);

    const reparentedChild = await getNote(child.id, testDb);
    expect(reparentedChild).not.toBeNull();
    expect(reparentedChild!.parentId).toBe(grandparent.id);
  });

  it("should make children root-level when deleting a root note", async () => {
    const root = await createNote({ title: "Root" }, testDb);
    const child = await createNote(
      { title: "Child", parentId: root.id },
      testDb
    );

    await deleteNote(root.id, testDb);

    const orphan = await getNote(child.id, testDb);
    expect(orphan).not.toBeNull();
    expect(orphan!.parentId).toBeNull();
  });

  it("should handle deleting a note with no children gracefully", async () => {
    const note = await createNote({ title: "Lonely" }, testDb);
    await expect(deleteNote(note.id, testDb)).resolves.not.toThrow();
  });

  it("should be idempotent — no error when deleting a non-existent note", async () => {
    await expect(
      deleteNote("00000000-0000-0000-0000-000000000000", testDb)
    ).resolves.not.toThrow();
  });
});

describe("getNoteTree", () => {
  it("should return empty array when no notes exist", async () => {
    const tree = await getNoteTree(testDb);
    expect(tree).toEqual([]);
  });

  it("should return root notes as flat array when all parentId are null", async () => {
    await createNote({ title: "A" }, testDb);
    await createNote({ title: "B" }, testDb);

    const tree = await getNoteTree(testDb);

    expect(tree).toHaveLength(2);
    expect(tree[0].children).toEqual([]);
    expect(tree[1].children).toEqual([]);
  });

  it("should nest children under their parent correctly", async () => {
    const parent = await createNote({ title: "Parent" }, testDb);
    await createNote({ title: "Child 1", parentId: parent.id }, testDb);
    await createNote({ title: "Child 2", parentId: parent.id }, testDb);

    const tree = await getNoteTree(testDb);

    expect(tree).toHaveLength(1);
    expect(tree[0].title).toBe("Parent");
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].title).toBe("Child 1");
    expect(tree[0].children[1].title).toBe("Child 2");
  });

  it("should handle deeply nested trees (3+ levels)", async () => {
    const level1 = await createNote({ title: "Level 1" }, testDb);
    const level2 = await createNote(
      { title: "Level 2", parentId: level1.id },
      testDb
    );
    const level3 = await createNote(
      { title: "Level 3", parentId: level2.id },
      testDb
    );
    await createNote({ title: "Level 4", parentId: level3.id }, testDb);

    const tree = await getNoteTree(testDb);

    expect(tree).toHaveLength(1);
    expect(tree[0].children[0].children[0].children[0].title).toBe("Level 4");
  });

  it("should order siblings by the order field", async () => {
    const parent = await createNote({ title: "Parent" }, testDb);
    await createNote({ title: "Third", parentId: parent.id, order: 2 }, testDb);
    await createNote({ title: "First", parentId: parent.id, order: 0 }, testDb);
    await createNote({ title: "Second", parentId: parent.id, order: 1 }, testDb);

    const tree = await getNoteTree(testDb);

    expect(tree[0].children[0].title).toBe("First");
    expect(tree[0].children[1].title).toBe("Second");
    expect(tree[0].children[2].title).toBe("Third");
  });
});

describe("moveNote", () => {
  it("should move a note to a different parent", async () => {
    const parentA = await createNote({ title: "Parent A" }, testDb);
    const parentB = await createNote({ title: "Parent B" }, testDb);
    const child = await createNote(
      { title: "Child", parentId: parentA.id },
      testDb
    );

    const moved = await moveNote(child.id, parentB.id, 0, testDb);

    expect(moved).not.toBeNull();
    expect(moved!.parentId).toBe(parentB.id);
    expect(moved!.order).toBe(0);
  });

  it("should reorder siblings at the source parent after removal", async () => {
    const parent = await createNote({ title: "Parent" }, testDb);
    const child1 = await createNote({ title: "Child 1", parentId: parent.id }, testDb);
    const child2 = await createNote({ title: "Child 2", parentId: parent.id }, testDb);
    const child3 = await createNote({ title: "Child 3", parentId: parent.id }, testDb);

    // Move child1 (order 0) to root
    await moveNote(child1.id, null, 0, testDb);

    // Remaining children should have decremented orders
    const remaining2 = await getNote(child2.id, testDb);
    const remaining3 = await getNote(child3.id, testDb);
    expect(remaining2!.order).toBe(0);
    expect(remaining3!.order).toBe(1);
  });

  it("should reorder siblings at the destination parent after insertion", async () => {
    const parent = await createNote({ title: "Parent" }, testDb);
    const child1 = await createNote({ title: "Child 1", parentId: parent.id }, testDb);
    const child2 = await createNote({ title: "Child 2", parentId: parent.id }, testDb);
    const outsider = await createNote({ title: "Outsider" }, testDb);

    // Insert outsider at position 0 under parent
    await moveNote(outsider.id, parent.id, 0, testDb);

    // Existing children should be shifted
    const shifted1 = await getNote(child1.id, testDb);
    const shifted2 = await getNote(child2.id, testDb);
    expect(shifted1!.order).toBe(1);
    expect(shifted2!.order).toBe(2);
  });

  it("should reorder within the same parent — move down", async () => {
    const parent = await createNote({ title: "Parent" }, testDb);
    const child1 = await createNote({ title: "A", parentId: parent.id }, testDb);
    const child2 = await createNote({ title: "B", parentId: parent.id }, testDb);
    const child3 = await createNote({ title: "C", parentId: parent.id }, testDb);

    // Move A (order 0) to order 2
    await moveNote(child1.id, parent.id, 2, testDb);

    const a = await getNote(child1.id, testDb);
    const b = await getNote(child2.id, testDb);
    const c = await getNote(child3.id, testDb);
    expect(b!.order).toBe(0);
    expect(c!.order).toBe(1);
    expect(a!.order).toBe(2);
  });

  it("should reorder within the same parent — move up", async () => {
    const parent = await createNote({ title: "Parent" }, testDb);
    const child1 = await createNote({ title: "A", parentId: parent.id }, testDb);
    const child2 = await createNote({ title: "B", parentId: parent.id }, testDb);
    const child3 = await createNote({ title: "C", parentId: parent.id }, testDb);

    // Move C (order 2) to order 0
    await moveNote(child3.id, parent.id, 0, testDb);

    const a = await getNote(child1.id, testDb);
    const b = await getNote(child2.id, testDb);
    const c = await getNote(child3.id, testDb);
    expect(c!.order).toBe(0);
    expect(a!.order).toBe(1);
    expect(b!.order).toBe(2);
  });

  it("should move a note to root level by setting parentId to null", async () => {
    const parent = await createNote({ title: "Parent" }, testDb);
    const child = await createNote(
      { title: "Child", parentId: parent.id },
      testDb
    );

    const moved = await moveNote(child.id, null, 0, testDb);

    expect(moved).not.toBeNull();
    expect(moved!.parentId).toBeNull();
  });

  it("should throw when attempting a circular reference", async () => {
    const parent = await createNote({ title: "Parent" }, testDb);
    const child = await createNote(
      { title: "Child", parentId: parent.id },
      testDb
    );
    const grandchild = await createNote(
      { title: "Grandchild", parentId: child.id },
      testDb
    );

    // Try to move parent under its own grandchild — should fail
    await expect(
      moveNote(parent.id, grandchild.id, 0, testDb)
    ).rejects.toThrow(/circular/i);
  });
});
