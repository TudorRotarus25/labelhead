"use client";

import dynamic from "next/dynamic";

const ReadOnlyContent = dynamic(() => import("./read-only-content"), {
  ssr: false,
});

/**
 * Client wrapper that dynamically imports ReadOnlyContent with ssr:false.
 * BlockNote's useCreateBlockNote accesses `window` which is unavailable
 * during SSR, so we must skip server rendering for this component.
 */
export default function ReadOnlyContentLoader({
  content,
}: {
  content: Record<string, unknown>[];
}) {
  return <ReadOnlyContent content={content} />;
}
