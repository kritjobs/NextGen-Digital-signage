CREATE TABLE "campaigns" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"layout_sequence" jsonb DEFAULT '[]' NOT NULL,
	"cycle_mode" varchar(20) DEFAULT 'sequential' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quick_posts" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"style" varchar(20) DEFAULT 'info' NOT NULL,
	"target_screen_ids" text[] DEFAULT '{}' NOT NULL,
	"duration" integer DEFAULT 30 NOT NULL,
	"created_by" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "layouts" ADD COLUMN "status" varchar(20) DEFAULT 'published' NOT NULL;