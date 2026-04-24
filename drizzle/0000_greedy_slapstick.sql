CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"content" jsonb DEFAULT '[]'::jsonb,
	"parent_id" uuid,
	"icon" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_parent_id_notes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."notes"("id") ON DELETE set null ON UPDATE no action;