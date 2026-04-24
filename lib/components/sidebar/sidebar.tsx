"use client";

import { useRouter } from "next/navigation";
import { createNote, updateNote } from "@/app/actions/notes";
import { type NoteTreeNode } from "@/lib/db/schema";
import { SidebarTreeNode } from "./sidebar-tree-node";

/** Props for the Sidebar component. */
interface SidebarProps {
  /** The full note tree to display. */
  tree: NoteTreeNode[];
}

/**
 * Main sidebar component showing the note tree with create/icon actions.
 * Renders a header with the app title and a "New note" button,
 * followed by the recursive tree of notes.
 */
export function Sidebar({ tree }: SidebarProps) {
  const router = useRouter();

  /** Creates a new root-level note and navigates to its editor. */
  async function handleNewNote() {
    const note = await createNote({});
    router.push(`/n/${note.id}/edit`);
    router.refresh();
  }

  /** Creates a child note under the given parent. */
  async function handleNewChild(parentId: string) {
    const note = await createNote({ parentId });
    router.push(`/n/${note.id}/edit`);
    router.refresh();
  }

  /** Updates a note's emoji icon. */
  async function handleSetIcon(noteId: string, icon: string | null) {
    await updateNote(noteId, { icon });
    router.refresh();
  }

  return (
    <nav className="flex h-full flex-col bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          LabelHead
        </h1>
        <button
          type="button"
          onClick={handleNewNote}
          className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          New note
        </button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {tree.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-zinc-400">
            No notes yet
          </p>
        ) : (
          tree.map((node) => (
            <SidebarTreeNode
              key={node.id}
              node={node}
              depth={0}
              onNewChild={handleNewChild}
              onSetIcon={handleSetIcon}
            />
          ))
        )}
      </div>
    </nav>
  );
}
