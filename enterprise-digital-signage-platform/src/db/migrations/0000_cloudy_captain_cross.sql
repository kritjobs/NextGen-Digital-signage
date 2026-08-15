CREATE TABLE "emergency_alerts" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(20) DEFAULT 'custom' NOT NULL,
	"severity" varchar(10) DEFAULT 'critical' NOT NULL,
	"target_screen_ids" text[] DEFAULT '{}' NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"triggered_at" timestamp with time zone,
	"triggered_by" varchar(100),
	"cleared_at" timestamp with time zone,
	"cleared_by" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "layout_zones" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"layout_id" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"x" numeric(5, 2) DEFAULT '0' NOT NULL,
	"y" numeric(5, 2) DEFAULT '0' NOT NULL,
	"width" numeric(5, 2) DEFAULT '100' NOT NULL,
	"height" numeric(5, 2) DEFAULT '100' NOT NULL,
	"z_index" integer DEFAULT 1 NOT NULL,
	"playlist_id" varchar(50),
	"background_color" varchar(30) DEFAULT '#000000',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "layouts" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"orientation" varchar(20) DEFAULT 'landscape' NOT NULL,
	"aspect_ratio" varchar(10) DEFAULT '16:9' NOT NULL,
	"width_px" integer DEFAULT 1920 NOT NULL,
	"height_px" integer DEFAULT 1080 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_items" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"title" varchar(300) NOT NULL,
	"type" varchar(20) NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"duration" integer DEFAULT 10 NOT NULL,
	"size_mb" numeric(8, 2) DEFAULT '0' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"thumbnail_url" text DEFAULT '' NOT NULL,
	"ticker_text" text,
	"ticker_speed" integer,
	"weather_city" varchar(100),
	"clock_format" varchar(5),
	"announce_header" varchar(200),
	"announce_body" text,
	"web_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playlist_items" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"playlist_id" varchar(50) NOT NULL,
	"media_id" varchar(50) NOT NULL,
	"duration" integer DEFAULT 10 NOT NULL,
	"order" integer DEFAULT 1 NOT NULL,
	"transition" varchar(10) DEFAULT 'fade' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playlists" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"total_duration" integer DEFAULT 0 NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proof_of_play_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"screen_id" varchar(50) NOT NULL,
	"screen_name" varchar(200) NOT NULL,
	"media_id" varchar(50) NOT NULL,
	"media_title" varchar(300) NOT NULL,
	"played_at" timestamp with time zone DEFAULT now() NOT NULL,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"status" varchar(15) DEFAULT 'completed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"playlist_id" varchar(50),
	"layout_id" varchar(50),
	"screen_group_ids" text[] DEFAULT '{}' NOT NULL,
	"screen_ids" text[] DEFAULT '{}' NOT NULL,
	"priority" integer DEFAULT 50 NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"start_time" time DEFAULT '00:00' NOT NULL,
	"end_time" time DEFAULT '23:59' NOT NULL,
	"days_of_week" integer[] DEFAULT '{1,2,3,4,5}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "screens" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"pairing_code" varchar(20) NOT NULL,
	"name" varchar(200) NOT NULL,
	"group" varchar(100) DEFAULT '' NOT NULL,
	"location" varchar(300) DEFAULT '' NOT NULL,
	"orientation" varchar(20) DEFAULT 'landscape' NOT NULL,
	"resolution" varchar(50) DEFAULT '1920x1080 (FHD)' NOT NULL,
	"status" varchar(20) DEFAULT 'offline' NOT NULL,
	"last_heartbeat" timestamp with time zone,
	"ip_address" varchar(45),
	"mac_address" varchar(17),
	"storage_usage_mb" integer DEFAULT 0 NOT NULL,
	"storage_total_mb" integer DEFAULT 8000 NOT NULL,
	"buffer_cached_items" integer DEFAULT 0 NOT NULL,
	"current_layout_id" varchar(50),
	"current_playlist_id" varchar(50),
	"active_emergency_id" varchar(50),
	"volume" integer DEFAULT 75 NOT NULL,
	"is_muted" boolean DEFAULT false NOT NULL,
	"firmware_version" varchar(30) DEFAULT 'v1.0.0' NOT NULL,
	"uptime_seconds" integer DEFAULT 0 NOT NULL,
	"last_screenshot_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "screens_pairing_code_unique" UNIQUE("pairing_code")
);
--> statement-breakpoint
CREATE TABLE "telemetry_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"screen_id" varchar(50) NOT NULL,
	"screen_name" varchar(200) NOT NULL,
	"event_type" varchar(20) NOT NULL,
	"message" text NOT NULL,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "layout_zones" ADD CONSTRAINT "layout_zones_layout_id_layouts_id_fk" FOREIGN KEY ("layout_id") REFERENCES "public"."layouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "layout_zones" ADD CONSTRAINT "layout_zones_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_media_id_media_items_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_layout_id_layouts_id_fk" FOREIGN KEY ("layout_id") REFERENCES "public"."layouts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screens" ADD CONSTRAINT "screens_current_layout_id_layouts_id_fk" FOREIGN KEY ("current_layout_id") REFERENCES "public"."layouts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screens" ADD CONSTRAINT "screens_current_playlist_id_playlists_id_fk" FOREIGN KEY ("current_playlist_id") REFERENCES "public"."playlists"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_emergency_alerts_is_active" ON "emergency_alerts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_emergency_alerts_triggered_at" ON "emergency_alerts" USING btree ("triggered_at");--> statement-breakpoint
CREATE INDEX "idx_layout_zones_layout_id" ON "layout_zones" USING btree ("layout_id");--> statement-breakpoint
CREATE INDEX "idx_media_items_type" ON "media_items" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_playlist_items_playlist_id" ON "playlist_items" USING btree ("playlist_id");--> statement-breakpoint
CREATE INDEX "idx_playlist_items_order" ON "playlist_items" USING btree ("playlist_id","order");--> statement-breakpoint
CREATE INDEX "idx_pop_screen_id" ON "proof_of_play_logs" USING btree ("screen_id");--> statement-breakpoint
CREATE INDEX "idx_pop_media_id" ON "proof_of_play_logs" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX "idx_pop_played_at" ON "proof_of_play_logs" USING btree ("played_at");--> statement-breakpoint
CREATE INDEX "idx_schedules_is_active" ON "schedules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_schedules_priority" ON "schedules" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_screens_status" ON "screens" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_screens_group" ON "screens" USING btree ("group");--> statement-breakpoint
CREATE INDEX "idx_telemetry_screen_id" ON "telemetry_logs" USING btree ("screen_id");--> statement-breakpoint
CREATE INDEX "idx_telemetry_event_type" ON "telemetry_logs" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_telemetry_created_at" ON "telemetry_logs" USING btree ("created_at");