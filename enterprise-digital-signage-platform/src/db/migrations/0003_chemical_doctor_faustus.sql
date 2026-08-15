CREATE TABLE "ai_providers" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(30) NOT NULL,
	"base_url" text NOT NULL,
	"api_key" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"models" text[] DEFAULT '{}' NOT NULL,
	"last_tested_at" timestamp with time zone,
	"last_test_status" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_task_configs" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"task_type" varchar(30) NOT NULL,
	"task_label" varchar(100) NOT NULL,
	"description" text,
	"provider_id" varchar(50) NOT NULL,
	"model_id" varchar(100) NOT NULL,
	"system_prompt" text,
	"temperature" numeric(3, 2) DEFAULT '0.7',
	"max_tokens" integer DEFAULT 1000,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_task_configs_task_type_unique" UNIQUE("task_type")
);
--> statement-breakpoint
ALTER TABLE "ai_task_configs" ADD CONSTRAINT "ai_task_configs_provider_id_ai_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."ai_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_providers_type" ON "ai_providers" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_ai_task_configs_task_type" ON "ai_task_configs" USING btree ("task_type");