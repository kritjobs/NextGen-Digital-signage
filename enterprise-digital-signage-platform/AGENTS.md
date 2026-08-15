# AGENTS.md

> ⭐ นี่คือโปรเจคหลักของ workspace — **อ่าน `../AGENTS.md` (root) ก่อนเริ่มงานทุกครั้ง**
> ไฟล์นั้นมี: ภาพรวมโปรเจค, สถานะ production, Work Log ล่าสุด, งานที่ค้าง, และกติกาการทำงานร่วมกัน

## คำสั่งที่ใช้บ่อย (รันในโฟลเดอร์นี้)
```bash
npm run typecheck   # npx tsc --noEmit — ต้องผ่าน 0 errors เสมอ
npm run build       # vite build + esbuild server.ts → dist/
```

## กฎสำคัญ
- ห้าม `docker compose down -v` (ลบข้อมูลถาวร)
- หลังแก้โค้ด: typecheck + build ผ่าน → sync ผ่าน `../sync-to-prod.ps1`
- อัปเดต `CHANGELOG.md` + `.kiro/specs/nextgen-digital-signage/tasks.md` + `../AGENTS.md` ทุกครั้งที่ทำงานเสร็จ
- มาร์คผู้ทำ: "แก้ไขโดย Freebuff" / "แก้ไขโดย Kiro"
