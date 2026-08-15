ALTER TABLE "media_items" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "screens" ADD COLUMN "fallback_layout_id" varchar(50);--> statement-breakpoint
ALTER TABLE "screens" ADD CONSTRAINT "screens_fallback_layout_id_layouts_id_fk" FOREIGN KEY ("fallback_layout_id") REFERENCES "public"."layouts"("id") ON DELETE set null ON UPDATE no action;