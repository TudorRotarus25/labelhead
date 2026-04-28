"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createNote, updateNote, moveNote } from "@/app/actions/notes";
import { type NoteTreeNode } from "@/lib/db/schema";
import { useSidebar } from "@/lib/components/sidebar-context";
import { SidebarTreeNode } from "./sidebar-tree-node";
import { SidebarDndContext } from "./sidebar-dnd-context";
import { flattenTree } from "./dnd/flatten-tree";

/**
 * Renders the note tree sidebar. On desktop (md+) it's always visible.
 * On mobile it slides in as a drawer; its open/close state lives in
 * SidebarContext so the MobileTabBar can toggle it.
 */
export function Sidebar({ tree }: { tree: NoteTreeNode[] }) {
  const router = useRouter();
  const { open, setOpen } = useSidebar();

  const flatNodes = useMemo(() => flattenTree(tree), [tree]);

  async function handleNewNote() {
    const note = await createNote({});
    setOpen(false);
    router.push(`/n/${note.id}/edit`);
    router.refresh();
  }

  async function handleNewChild(parentId: string) {
    const note = await createNote({ parentId });
    setOpen(false);
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
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
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
        aria-label="Sidebar"
      >
        <nav className="flex h-full flex-col border-r border-[var(--border)] bg-white">
          <div className="flex flex-col gap-3 border-b border-[var(--border)] px-4 py-4">
            {/* Row 1: logo + wordmark */}
            <div className="flex min-w-0 items-center gap-3">
              <Image
                src="/logo.png"
                alt=""
                width={44}
                height={44}
                className="shrink-0"
                priority
              />
              <span className="text-lg font-semibold tracking-tight text-black">
                LabelHead
              </span>
            </div>
            {/* Row 2: primary actions (Scan + New note) */}
            <div className="flex items-stretch gap-2">
              <Link
                href="/scan"
                aria-label="Scan QR code"
                onClick={() => setOpen(false)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] px-2.5 py-2 text-xs font-medium text-gray-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <line x1="14" y1="14" x2="14" y2="14.01" />
                  <line x1="20" y1="14" x2="20" y2="14.01" />
                  <line x1="14" y1="20" x2="14" y2="20.01" />
                  <line x1="20" y1="20" x2="20" y2="20.01" />
                  <line x1="17" y1="17" x2="17" y2="17.01" />
                </svg>
                Scan
              </Link>
              <button
                type="button"
                onClick={handleNewNote}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[var(--accent)] px-2.5 py-2 text-xs font-medium text-white transition hover:bg-[var(--accent-hover)]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New note
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            {tree.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-gray-400">
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
                    onNavigate={() => setOpen(false)}
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
