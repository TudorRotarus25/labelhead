"use server";

import { revalidatePath } from "next/cache";
import {
  createNote as dalCreateNote,
  getNote as dalGetNote,
  updateNote as dalUpdateNote,
  deleteNote as dalDeleteNote,
  getNoteTree as dalGetNoteTree,
  moveNote as dalMoveNote,
  getChildren as dalGetChildren,
} from "@/data/notes";
import { type Note, type NewNote, type NoteTreeNode } from "@/lib/db/schema";

// TODO: Add Zod validation when forms are integrated

/**
 * Server action: creates a new note.
 * @param data - Partial note data.
 * @returns The created note.
 */
export async function createNote(data: Partial<NewNote>): Promise<Note> {
  const note = await dalCreateNote(data);
  revalidatePath("/");
  return note;
}

/**
 * Server action: fetches a single note by UUID.
 * @param id - The note's UUID.
 * @returns The note, or null if not found.
 */
export async function getNote(id: string): Promise<Note | null> {
  return dalGetNote(id);
}

/**
 * Server action: updates a note's title, content, icon, or order.
 * @param id - The note's UUID.
 * @param data - Fields to update.
 * @returns The updated note, or null if not found.
 */
export async function updateNote(
  id: string,
  data: Partial<Pick<Note, "title" | "content" | "icon" | "order">>
): Promise<Note | null> {
  const note = await dalUpdateNote(id, data);
  revalidatePath("/");
  return note;
}

/**
 * Server action: deletes a note and reparents its children.
 * @param id - The note's UUID.
 */
export async function deleteNote(id: string): Promise<void> {
  await dalDeleteNote(id);
  revalidatePath("/");
}

/**
 * Server action: returns all notes as a nested tree.
 * @returns Array of root-level NoteTreeNodes.
 */
export async function getNoteTree(): Promise<NoteTreeNode[]> {
  return dalGetNoteTree();
}

/**
 * Server action: fetches direct children of a note.
 * @param parentId - The parent note's UUID.
 * @returns Array of child notes ordered by order field.
 */
export async function getChildren(parentId: string): Promise<Note[]> {
  return dalGetChildren(parentId);
}

/**
 * Server action: moves a note to a new parent and/or position.
 * @param id - The note's UUID.
 * @param newParentId - New parent UUID, or null for root-level.
 * @param newOrder - Target position among new siblings.
 * @returns The updated note, or null if not found.
 */
export async function moveNote(
  id: string,
  newParentId: string | null,
  newOrder: number
): Promise<Note | null> {
  const note = await dalMoveNote(id, newParentId, newOrder);
  revalidatePath("/");
  return note;
}
