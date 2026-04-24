import "server-only";

import { eq, sql, and, gt, gte, lt, lte, isNull, asc } from "drizzle-orm";
import { type Database, db as defaultDb } from "@/lib/db";
import {
  notes,
  type Note,
  type NewNote,
  type NoteTreeNode,
} from "@/lib/db/schema";

/**
 * Creates a new note. Auto-assigns `order` as the next sibling index
 * if not provided.
 * @param data - Partial note data. All fields are optional due to schema defaults.
 * @param dbInstance - Database instance (defaults to production singleton).
 * @returns The created note.
 */
export async function createNote(
  data: Partial<NewNote>,
  dbInstance: Database = defaultDb
): Promise<Note> {
  if (data.order === undefined) {
    const parentCondition = data.parentId
      ? eq(notes.parentId, data.parentId)
      : isNull(notes.parentId);

    const [result] = await dbInstance
      .select({ maxOrder: sql<number>`COALESCE(MAX(${notes.order}), -1)` })
      .from(notes)
      .where(parentCondition);

    data.order = result.maxOrder + 1;
  }

  const [created] = await dbInstance.insert(notes).values(data).returning();
  return created;
}

/**
 * Fetches a single note by UUID.
 * @param id - The note's UUID.
 * @param dbInstance - Database instance (defaults to production singleton).
 * @returns The note, or null if not found.
 */
export async function getNote(
  id: string,
  dbInstance: Database = defaultDb
): Promise<Note | null> {
  try {
    const [found] = await dbInstance
      .select()
      .from(notes)
      .where(eq(notes.id, id))
      .limit(1);
    return found ?? null;
  } catch {
    // Invalid UUID format throws a Postgres error
    return null;
  }
}

/**
 * Updates a note's title, content, icon, or order.
 * @param id - The note's UUID.
 * @param data - Fields to update.
 * @param dbInstance - Database instance (defaults to production singleton).
 * @returns The updated note, or null if the note doesn't exist.
 */
export async function updateNote(
  id: string,
  data: Partial<Pick<Note, "title" | "content" | "icon" | "order">>,
  dbInstance: Database = defaultDb
): Promise<Note | null> {
  const rows = await dbInstance
    .update(notes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(notes.id, id))
    .returning();

  return rows[0] ?? null;
}

/**
 * Deletes a note. Reparents any children to the deleted note's parent
 * so the tree structure is preserved.
 * @param id - The note's UUID.
 * @param dbInstance - Database instance (defaults to production singleton).
 */
export async function deleteNote(
  id: string,
  dbInstance: Database = defaultDb
): Promise<void> {
  // Fetch the note to get its parentId
  const target = await getNote(id, dbInstance);
  if (!target) return; // Idempotent: no-op if note doesn't exist

  // Reparent children to the deleted note's parent
  await dbInstance
    .update(notes)
    .set({ parentId: target.parentId })
    .where(eq(notes.parentId, id));

  // Delete the note
  await dbInstance.delete(notes).where(eq(notes.id, id));
}

/**
 * Returns all notes structured as a nested tree, ordered by `order`.
 * @param dbInstance - Database instance (defaults to production singleton).
 * @returns Array of root-level NoteTreeNodes with nested children.
 */
export async function getNoteTree(
  dbInstance: Database = defaultDb
): Promise<NoteTreeNode[]> {
  const allNotes = await dbInstance
    .select()
    .from(notes)
    .orderBy(asc(notes.order));

  // Build a map of id → NoteTreeNode
  const nodeMap = new Map<string, NoteTreeNode>();
  for (const note of allNotes) {
    nodeMap.set(note.id, { ...note, children: [] });
  }

  // Assemble the tree
  const roots: NoteTreeNode[] = [];
  for (const node of nodeMap.values()) {
    if (node.parentId === null) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        // Orphaned node (parent was deleted without reparenting) — treat as root
        roots.push(node);
      }
    }
  }

  return roots;
}

/**
 * Checks if `ancestorId` is an ancestor of `noteId` (i.e., noteId is a descendant).
 * Used to prevent circular references when moving notes.
 */
async function isDescendant(
  ancestorId: string,
  noteId: string,
  dbInstance: Database
): Promise<boolean> {
  let currentId: string | null = noteId;
  while (currentId !== null) {
    if (currentId === ancestorId) return true;
    const parent = await getNote(currentId, dbInstance);
    if (!parent) return false;
    currentId = parent.parentId;
  }
  return false;
}

/**
 * Moves a note to a new parent and/or position. Updates sibling
 * ordering at both the source and destination. Prevents circular references.
 * @param id - The note's UUID.
 * @param newParentId - New parent UUID, or null to make root-level.
 * @param newOrder - The target position among new siblings.
 * @param dbInstance - Database instance (defaults to production singleton).
 * @returns The updated note, or null if not found.
 */
export async function moveNote(
  id: string,
  newParentId: string | null,
  newOrder: number,
  dbInstance: Database = defaultDb
): Promise<Note | null> {
  const note = await getNote(id, dbInstance);
  if (!note) return null;

  // Circular reference check: ensure newParentId is not a descendant of this note
  if (newParentId !== null) {
    const wouldBeCircular = await isDescendant(id, newParentId, dbInstance);
    if (wouldBeCircular) {
      throw new Error("Circular reference: cannot move a note into its own subtree");
    }
  }

  const oldParentId = note.parentId;
  const oldOrder = note.order;
  const changingParent =
    oldParentId !== newParentId;

  if (changingParent) {
    // Decrement order of siblings after the removed note at the old parent
    const oldParentCondition = oldParentId
      ? eq(notes.parentId, oldParentId)
      : isNull(notes.parentId);

    await dbInstance
      .update(notes)
      .set({ order: sql`${notes.order} - 1` })
      .where(and(oldParentCondition, gt(notes.order, oldOrder)));

    // Increment order of siblings at or after the insertion point at the new parent
    const newParentCondition = newParentId
      ? eq(notes.parentId, newParentId)
      : isNull(notes.parentId);

    await dbInstance
      .update(notes)
      .set({ order: sql`${notes.order} + 1` })
      .where(and(newParentCondition, gte(notes.order, newOrder)));

    // Update the note itself
    const [updated] = await dbInstance
      .update(notes)
      .set({ parentId: newParentId, order: newOrder, updatedAt: new Date() })
      .where(eq(notes.id, id))
      .returning();

    return updated ?? null;
  } else {
    // Same parent — reorder only
    const parentCondition = oldParentId
      ? eq(notes.parentId, oldParentId)
      : isNull(notes.parentId);

    if (newOrder > oldOrder) {
      // Moving down: decrement orders in (oldOrder, newOrder]
      await dbInstance
        .update(notes)
        .set({ order: sql`${notes.order} - 1` })
        .where(
          and(
            parentCondition,
            gt(notes.order, oldOrder),
            lte(notes.order, newOrder)
          )
        );
    } else if (newOrder < oldOrder) {
      // Moving up: increment orders in [newOrder, oldOrder)
      await dbInstance
        .update(notes)
        .set({ order: sql`${notes.order} + 1` })
        .where(
          and(
            parentCondition,
            gte(notes.order, newOrder),
            lt(notes.order, oldOrder)
          )
        );
    }

    // Update the note itself
    const [updated] = await dbInstance
      .update(notes)
      .set({ order: newOrder, updatedAt: new Date() })
      .where(eq(notes.id, id))
      .returning();

    return updated ?? null;
  }
}

/**
 * Fetches direct children of a note, ordered by the order field.
 * @param parentId - The parent note's UUID.
 * @param dbInstance - Database instance (defaults to production singleton).
 * @returns Array of child notes.
 */
export async function getChildren(
  parentId: string,
  dbInstance: Database = defaultDb
): Promise<Note[]> {
  return dbInstance
    .select()
    .from(notes)
    .where(eq(notes.parentId, parentId))
    .orderBy(asc(notes.order));
}
