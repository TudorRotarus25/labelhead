"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createNote, updateNote, moveNote } from "@/app/actions/notes";
import { type NoteTreeNode } from "@/lib/db/schema";
import { SidebarTreeNode } from "./sidebar-tree-node";
import { SidebarDndContext } from "./sidebar-dnd-context";
import { flattenTree } from "./dnd/flatten-tree";

/**
 * Sidebar with built-in mobile toggle. Renders the note tree,
 * create/icon actions, drag-and-drop reordering, and handles
 * its own open/close state.
 * On desktop (md+) the sidebar is always visible.
 * On mobile it starts collapsed with a floating hamburger button.
 */
export function Sidebar({ tree }: { tree: NoteTreeNode[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const flatNodes = useMemo(() => flattenTree(tree), [tree]);

  async function handleNewNote() {
    const note = await createNote({});
    router.push(`/n/${note.id}/edit`);
    router.refresh();
  }

  async function handleNewChild(parentId: string) {
    const note = await createNote({ parentId });
    router.push(`/n/${note.id}/edit`);
    router.refresh();
  }

  async function handleSetIcon(noteId: string, icon: string | null) {
    await updateNote(noteId, { icon });
    router.refresh();
  }

  /** Moves a note to a new parent and/or sibling position. */
  async function handleMoveNote(
    id: string,
    newParentId: string | null,
    newOrder: number
  ) {
    await moveNote(id, newParentId, newOrder);
    router.refresh();
  }

  return (
    <>
      {/* Mobile hamburger — visible only when sidebar is closed */}
      <button
        type="button"
        aria-label="Open sidebar"
        className="fixed left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-md bg-white text-zinc-700 shadow-md md:hidden dark:bg-zinc-800 dark:text-zinc-200"
        onClick={() => setOpen(true)}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out
          md:static md:translate-x-0 md:transition-none
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <nav className="flex h-full flex-col bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              LabelHead
            </h1>
            <div className="flex items-center gap-1.5">
              <Link
                href="/scan"
                aria-label="Scan QR code"
                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </Link>
              <button
                type="button"
                onClick={handleNewNote}
                className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                New note
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            {tree.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-zinc-400">
                No notes yet
              </p>
            ) : (
              <SidebarDndContext flatNodes={flatNodes} onMoveNote={handleMoveNote}>
                {tree.map((node) => (
                  <SidebarTreeNode
                    key={node.id}
                    node={node}
                    depth={0}
                    onNewChild={handleNewChild}
                    onSetIcon={handleSetIcon}
                  />
                ))}
              </SidebarDndContext>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
}
