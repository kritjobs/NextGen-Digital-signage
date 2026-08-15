CREATE TABLE "layout_versions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"layout_id" varchar(50) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"snapshot" jsonb NOT NULL,
	"changed_by" varchar(100),
	"change_note" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "layouts" ADD COLUMN "approval_status" varchar(20) DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "playlist_items" ADD COLUMN "sub_playlist_id" varchar(50);--> statement-breakpoint
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_sub_playlist_id_playlists_id_fk" FOREIGN KEY ("sub_playlist_id") REFERENCES "public"."playlists"("id") ON DELETE set null ON UPDATE no action;