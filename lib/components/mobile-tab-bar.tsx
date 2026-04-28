"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./sidebar-context";

/**
 * Fixed bottom tab bar, mobile-only (md:hidden). Two primary destinations:
 *
 * - **Notes** — toggles the sidebar drawer via SidebarContext.
 * - **Scan** — navigates to /scan, highlighted when already there.
 *
 * The bar sits above safe-area insets on iOS and uses 44px minimum touch
 * targets per Apple HIG.
 */
export function MobileTabBar() {
  const { setOpen } = useSidebar();
  const pathname = usePathname();
  const scanActive = pathname === "/scan";

  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch justify-around border-t border-[var(--border)] bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 text-gray-500 hover:text-gray-900"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
        <span className="uppercase-tracked">Notes</span>
      </button>

      <Link
        href="/scan"
        aria-current={scanActive ? "page" : undefined}
        className={`flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 ${
          scanActive
            ? "text-[var(--accent)]"
            : "text-gray-500 hover:text-gray-900"
        }`}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="4" y="4" width="6" height="6" rx="1" />
          <rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" />
          <line x1="14" y1="14" x2="14" y2="14.01" />
          <line x1="20" y1="14" x2="20" y2="14.01" />
          <line x1="14" y1="20" x2="14" y2="20.01" />
          <line x1="20" y1="20" x2="20" y2="20.01" />
          <line x1="17" y1="17" x2="17" y2="17.01" />
        </svg>
        <span className="uppercase-tracked">Scan</span>
      </Link>
    </nav>
  );
}
