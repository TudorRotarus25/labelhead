"use client";

import dynamic from "next/dynamic";
import { type Note } from "@/lib/db/schema";

const NoteEditor = dynamic(() => import("./note-editor"), { ssr: false });

/**
 * Client wrapper that dynamically imports NoteEditor with ssr:false.
 * BlockNote's useCreateBlockNote accesses `window` which is unavailable
 * during SSR, so we must skip server rendering for this component.
 */
export default function NoteEditorLoader({ note }: { note: Note }) {
  return <NoteEditor note={note} />;
}
