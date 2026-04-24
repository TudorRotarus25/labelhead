"use client";

import "@blocknote/react/style.css";
import "@blocknote/mantine/style.css";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { type Block } from "@blocknote/core";

/**
 * ReadOnlyContent renders note content using BlockNote in read-only mode.
 * Used on the public-facing note view page (QR code destination).
 *
 * @param props.content - JSONB content from the database, cast to Block[].
 */
export default function ReadOnlyContent({
  content,
}: {
  content: Record<string, unknown>[];
}) {
  const editor = useCreateBlockNote({
    initialContent:
      content.length > 0 ? (content as Block[]) : undefined,
  });

  return (
    <BlockNoteView editor={editor} editable={false} theme="light" />
  );
}
