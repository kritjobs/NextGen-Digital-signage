ALTER TABLE "playlists" ADD COLUMN "status" varchar(20) DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "playlists" ADD COLUMN "approval_status" varchar(20) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
-- Content Approval Workflow: เพลย์ลิสต์ที่มีอยู่ก่อนหน้า (สร้างก่อนมีระบบ approval) ถือว่า approved ไปก่อน
UPDATE "playlists" SET "approval_status" = 'approved' WHERE "approval_status" = 'pending';