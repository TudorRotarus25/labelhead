"use client";

import dynamic from "next/dynamic";

/**
 * Dynamic import wrapper for the scanner view.
 * The camera/canvas logic requires browser APIs (getUserMedia, canvas)
 * so it must be client-only with SSR disabled.
 */
export const ScannerViewLoader = dynamic(
  () => import("./scanner-view").then((mod) => mod.ScannerView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-zinc-400">
        Loading scanner...
      </div>
    ),
  }
);
