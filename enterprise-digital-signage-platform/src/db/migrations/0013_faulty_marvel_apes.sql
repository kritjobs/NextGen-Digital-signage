CREATE TABLE "scheduler_snapshots" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"data" jsonb NOT NULL,
	"created_by" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
