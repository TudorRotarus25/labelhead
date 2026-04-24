"use client";

import { useState } from "react";
import { type NoteTreeNode } from "@/lib/db/schema";
import { Sidebar } from "./sidebar";

/** Props for the SidebarLayout component. */
interface SidebarLayoutProps {
  /** The full note tree passed down to the Sidebar. */
  tree: NoteTreeNode[];
  /** Page content rendered in the main area. */
  children: React.ReactNode;
}

/**
 * Responsive layout with a collapsible sidebar.
 * Desktop (md+): sidebar always visible beside the content.
 * Mobile: sidebar hidden by default with a hamburger toggle and overlay backdrop.
 */
export function SidebarLayout({ tree, children }: SidebarLayoutProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-full min-h-screen">
      {/* Mobile hamburger button */}
      <button
        type="button"
        aria-label="Open sidebar"
        className="fixed left-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-md bg-white text-zinc-700 shadow-md md:hidden dark:bg-zinc-800 dark:text-zinc-200"
        onClick={() => setOpen(true)}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Overlay backdrop (mobile only) */}
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
        <Sidebar tree={tree} />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
