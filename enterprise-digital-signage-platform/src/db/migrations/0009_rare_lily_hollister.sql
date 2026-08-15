ALTER TABLE "media_items" ADD COLUMN "release_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "media_items" ADD COLUMN "fallback_image_url" text DEFAULT '' NOT NULL;