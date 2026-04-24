"use client";

import { useState } from "react";
import Link from "next/link";
import { type NoteTreeNode as NoteTreeNodeType } from "@/lib/db/schema";

/** Props for the SidebarTreeNode component. */
interface SidebarTreeNodeProps {
  /** The note tree node to render. */
  node: NoteTreeNodeType;
  /** Nesting depth for indentation (0 = root level). */
  depth: number;
  /** Callback to create a child note under this node. */
  onNewChild: (parentId: string) => void;
  /** Callback to set the emoji icon for this node. */
  onSetIcon: (noteId: string, icon: string | null) => void;
}

/**
 * Renders a single node in the sidebar note tree with expand/collapse,
 * emoji icon, title link, and add-child button.
 */
export function SidebarTreeNode({
  node,
  depth,
  onNewChild,
  onSetIcon,
}: SidebarTreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const displayIcon = node.icon ?? "📄";

  /** Prompts the user for an emoji and updates the icon. */
  function handleIconClick() {
    const emoji = prompt("Enter an emoji icon (or leave empty to reset):");
    onSetIcon(node.id, emoji || null);
  }

  return (
    <div>
      <div
        className="group flex items-center gap-1 py-0.5 pr-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 rounded-md"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Expand / collapse toggle */}
        {hasChildren ? (
          <button
            type="button"
            aria-label="Toggle children"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="h-5 w-5 shrink-0" />
        )}

        {/* Emoji icon button */}
        <button
          type="button"
          aria-label="Change icon"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700"
          onClick={handleIconClick}
        >
          {displayIcon}
        </button>

        {/* Title as navigation link */}
        <Link
          href={`/n/${node.id}/edit`}
          className="min-w-0 flex-1 truncate hover:underline"
        >
          {node.title || "Untitled"}
        </Link>

        {/* Add child button (visible on hover) */}
        <button
          type="button"
          aria-label="Add child note"
          className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-400 opacity-0 group-hover:opacity-100 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
          onClick={() => onNewChild(node.id)}
        >
          +
        </button>
      </div>

      {/* Recursively render children when expanded */}
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <SidebarTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onNewChild={onNewChild}
              onSetIcon={onSetIcon}
            />
          ))}
        </div>
      )}
    </div>
  );
}
