CREATE TABLE "slideshow_slides" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"slideshow_id" varchar(50) NOT NULL,
	"order" integer DEFAULT 1 NOT NULL,
	"media_id" varchar(50),
	"background_url" text,
	"background_color" varchar(20) DEFAULT '#000000',
	"headline_text" varchar(200),
	"subtitle_text" varchar(200),
	"body_text" text,
	"cta_text" varchar(100),
	"cta_url" text,
	"text_position" varchar(20) DEFAULT 'bottom-left',
	"text_color" varchar(20) DEFAULT '#FFFFFF',
	"overlay_opacity" integer DEFAULT 40 NOT NULL,
	"duration" integer,
	"slide_transition" varchar(20),
	"ken_burns" boolean DEFAULT true NOT NULL,
	"parallax" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slideshows" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"title" varchar(300) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"theme_id" varchar(50),
	"theme_name" varchar(100),
	"accent_color" varchar(20) DEFAULT '#F2CA50',
	"title_font" varchar(50) DEFAULT 'Inter',
	"transition" varchar(20) DEFAULT 'fade' NOT NULL,
	"slide_duration" integer DEFAULT 8 NOT NULL,
	"auto_play" boolean DEFAULT true NOT NULL,
	"loop" boolean DEFAULT true NOT NULL,
	"show_progress" boolean DEFAULT true NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"published_media_id" varchar(50),
	"slide_count" integer DEFAULT 0 NOT NULL,
	"total_duration" integer DEFAULT 0 NOT NULL,
	"created_by" varchar(50),
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "slideshow_slides" ADD CONSTRAINT "slideshow_slides_slideshow_id_slideshows_id_fk" FOREIGN KEY ("slideshow_id") REFERENCES "public"."slideshows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slideshow_slides" ADD CONSTRAINT "slideshow_slides_media_id_media_items_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_slideshow_slides_slideshow_id" ON "slideshow_slides" USING btree ("slideshow_id");--> statement-breakpoint
CREATE INDEX "idx_slideshow_slides_order" ON "slideshow_slides" USING btree ("slideshow_id","order");--> statement-breakpoint
CREATE INDEX "idx_slideshows_status" ON "slideshows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_slideshows_created_by" ON "slideshows" USING btree ("created_by");