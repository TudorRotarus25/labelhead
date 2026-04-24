import {
  pgTable,
  uuid,
  text,
  jsonb,
  integer,
  timestamp,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

/** Notes table — stores hierarchical notes with BlockNote content as JSONB. */
export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull().default(""),
  content: jsonb("content").$type<Record<string, unknown>[]>().default([]),
  parentId: uuid("parent_id").references((): AnyPgColumn => notes.id, {
    onDelete: "set null",
  }),
  icon: text("icon"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** A note row as returned by SELECT queries. */
export type Note = InferSelectModel<typeof notes>;

/** Data required to INSERT a note (most fields are optional due to defaults). */
export type NewNote = InferInsertModel<typeof notes>;

/** A note with its nested children, used for tree representations. */
export interface NoteTreeNode extends Note {
  children: NoteTreeNode[];
}
