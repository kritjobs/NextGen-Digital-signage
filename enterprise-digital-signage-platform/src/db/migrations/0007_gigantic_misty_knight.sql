ALTER TABLE "layout_zones" ADD COLUMN "is_locked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "screens" ADD COLUMN "tags" text[] DEFAULT '{}' NOT NULL;