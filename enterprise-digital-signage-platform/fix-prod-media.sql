-- ============================================================
-- Fix Prod Media URLs (med-001..008) -> local /media/sample/*
-- Run AFTER redeploy (so /media/sample/* is inside the container)
-- Idempotent - safe to run multiple times.
-- Executed by fix-prod-media.bat via: docker compose exec signage-postgres psql
-- ============================================================

-- Videos (เดิมชี้ Google gtv-videos-bucket ที่ตายแล้ว -> 403)
UPDATE media_items
   SET url = '/media/sample/welcome-demo.mp4',
       thumbnail_url = '/media/sample/campus-1.png',
       size_mb = '6.3'
 WHERE id = 'med-001';

UPDATE media_items
   SET url = '/media/sample/welcome-demo.mp4',
       thumbnail_url = '/media/sample/campus-2.png',
       size_mb = '6.3'
 WHERE id = 'med-002';

-- Images (เดิมชี้ unsplash - external)
UPDATE media_items
   SET url = '/media/sample/campus-3.png',
       thumbnail_url = '/media/sample/campus-3.png',
       size_mb = '1.2'
 WHERE id = 'med-003';

UPDATE media_items
   SET url = '/media/sample/campus-4.png',
       thumbnail_url = '/media/sample/campus-4.png',
       size_mb = '1.4'
 WHERE id = 'med-004';

-- Widgets (thumbnails เท่านั้น - เดิมชี้ unsplash)
UPDATE media_items SET thumbnail_url = '/media/sample/campus-1.png' WHERE id = 'med-005';
UPDATE media_items SET thumbnail_url = '/media/sample/campus-2.png' WHERE id = 'med-006';
UPDATE media_items SET thumbnail_url = '/media/sample/campus-3.png' WHERE id = 'med-007';
UPDATE media_items SET thumbnail_url = '/media/sample/campus-4.png' WHERE id = 'med-008';

-- Show result
SELECT id, type, url, thumbnail_url
  FROM media_items
 WHERE id IN ('med-001','med-002','med-003','med-004')
 ORDER BY id;
