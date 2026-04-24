# Design: Note Editor + QR Code Generation (Issues #3 & #4)

## Context

LabelHead's database foundation is in place (Issue #2). The next step is the two features that were blocked on it: the BlockNote editor page for creating/editing notes, and QR code generation for printing labels. These are independent features that will be built in parallel.

## Decisions

- **Editor route:** `/n/{uuid}/edit` — sub-route of the permanent `/n/{uuid}` public URL
- **Save behavior:** Auto-save with ~1s debounce, no manual save button
- **Editor layout:** Stacked — full-width editor on top, QR label section below
- **QR generation:** Client-side using HTML Canvas, not server-side
- **Reusable components:** Live in `lib/components/`

## Architecture

Both features produce client components on a server-rendered page.

```
app/n/[id]/edit/page.tsx        (Server Component — fetches note, 404 if missing)
  ├─ NoteEditor                 (Client — BlockNote + title + auto-save)
  └─ QRLabel                    (Client — canvas QR + download/share)
```

The server page fetches the note via the existing `getNote()` from `data/notes.ts` and passes it as props. Client components handle all interactivity.

## Issue #3: Note Editor Page

### Packages

- `@blocknote/react` — React bindings for BlockNote editor
- `@blocknote/mantine` — UI components (toolbar, menus, etc.)

### Files

**`app/n/[id]/edit/page.tsx`** — Server Component
- Reads `id` from route params
- Calls `getNote(id)` from `@/data/notes`
- Returns `notFound()` if note doesn't exist
- Renders `<NoteEditor>` and `<QRLabel>` with note data as props

**`app/n/[id]/edit/note-editor.tsx`** — Client Component (`'use client'`)
- Props: `note: Note` (the full note object)
- Imports `@blocknote/core/style.css` and `@blocknote/mantine/style.css`
- Uses `useCreateBlockNote({ initialContent: note.content })` to initialize
- Renders:
  1. Title bar: emoji icon (display only) + `<input>` for title + save indicator ("Saved" / "Saving...")
  2. `<BlockNoteView editor={editor} onChange={handleChange} />`
- Auto-save: `onChange` callback debounced at ~1s, calls `updateNote(note.id, { content, title })` server action
- Save indicator state: `idle` → `saving` → `saved`, resets to `idle` after 2s

### Markdown shortcuts

BlockNote provides these out of the box — no configuration needed:
- `#` / `##` / `###` for headings
- `-` or `*` for bullet lists
- `1.` for numbered lists
- `**bold**`, `*italic*`, `` `code` ``
- `>` for blockquotes

## Issue #4: QR Code Generation

### Packages

- `qrcode` — QR code generation to canvas
- `@types/qrcode` — TypeScript types

### Files

**`lib/components/qr-label.tsx`** — Client Component (`'use client'`)
- Props: `noteId: string`, `noteTitle: string`
- Generates QR code encoding `{NEXT_PUBLIC_BASE_URL}/n/{noteId}`
- Uses two-canvas approach:
  1. `QRCode.toCanvas(canvas, url, { width: 200 })` — generates QR at 200x200px
  2. Second canvas (200x250px) composites: QR on top, title text in 50px area below
- Renders the composite canvas + two action buttons:
  - **Download PNG** — `canvas.toBlob()` → object URL → `<a download>` click
  - **Share** (mobile only) — `navigator.canShare()` check → `navigator.share({ files: [File] })`
  - Share button hidden on desktop, falls back to download

### Dimensions

Optimized for Nelko P21 (15mm tape width):
- QR code: 200x200px (scannable at 15mm physical size at 300 DPI)
- Total image: 200x250px (50px for title text below)
- Title text: truncated with ellipsis if longer than image width

### Base URL

Uses `NEXT_PUBLIC_BASE_URL` environment variable (e.g., `https://labelhead.vercel.app`). Falls back to `window.location.origin` if not set. Added to `.env.example`.

## Testing

### Editor (smoke test)

**`app/n/[id]/edit/__tests__/editor.test.tsx`**
- Verify NoteEditor component mounts without crashing
- Verify title input renders with note title
- Mock BlockNote internals (requires browser DOM)

### QR Label (comprehensive)

**`lib/components/__tests__/qr-label.test.ts`**
- Generated QR decodes to the correct `/n/{uuid}` URL (using `jsqr` library to decode)
- Title text is present in the rendered output
- Canvas dimensions are 200x250px
- Download triggers blob creation
- Share button only appears when `navigator.share` is available

### Additional dev dependencies

- `@testing-library/react` — render components in tests
- `@testing-library/jest-dom` — DOM matchers
- `jsqr` — QR code decoder for test verification

## Verification

1. `pnpm test:run` — all tests pass (existing 33 + new)
2. `pnpm build` — no type errors
3. `pnpm dev` — navigate to `/n/{uuid}/edit` for an existing note:
   - Editor loads with content
   - Type in editor → "Saving..." appears → "Saved" appears
   - Reload → content persists
   - QR code renders below editor
   - Download button saves PNG
   - On mobile: Share button opens native share sheet
4. Navigate to `/n/nonexistent-uuid/edit` → 404 page
