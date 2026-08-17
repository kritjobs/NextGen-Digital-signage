# Changelog — NextGen Digital Signage Platform

รูปแบบตาม [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)  
Versioning ตาม [Semantic Versioning](https://semver.org/)

---

## [0.4.30] — 2026-08-16  🤖 โดย Freebuff (Scheduler: ปุ่มขั้นตอนใหญ่แสดงจำนวนรายการ + คลิกขวาเลือกย้อน/ทำซ้ำเฉพาะบางรายการในกลุ่ม ✅)

### Added / Changed
- **ปุ่มขั้นตอนใหญ่แสดงจำนวนการแก้ไขที่จะย้อน/ทำซ้ำ:**
  - tooltip อัปเดตสดเป็น "ย้อนขั้นตอนใหญ่ — ย้อน N รายการพร้อมกัน · คลิกขวาเพื่อเลือก" (และ redo) · **badge ตัวเลขบนปุ่ม** (cyan) แสดงขนาดกลุ่มเมื่อ > 1
  - refactor: `groupOf()` (กลุ่ม = รายการต่อจากบนสุดที่มี `grp` เดียวกัน) + `applyUndoEntries`/`applyRedoEntries` — ใช้ร่วมระหว่างปุ่ม, tooltip และเมนู — ยกเลิกการกลับลำดับภายใน helper (caller ส่งลำดับ apply ชัดเจน)
- **คลิกขวาบนปุ่มขั้นตอนใหญ่ = เมนูเลือกรายการ** — รายการในกลุ่ม (ใหม่สุดบนสุด) พร้อม **checkbox** + label/เวลา/detail · สรุป "ย้อน N จาก M รายการบนสุด" คำนวณสดจากที่ติ๊ก · ปุ่ม **ย้อนที่เลือก (N)** / **ทำซ้ำที่เลือก (N)**
  - **ย้อนเฉพาะบางรายการ**: เลือกต่อเนื่องจากบนสุดเท่านั้น (ก่อน/หลังเป็น snapshot เต็ม — รายการใต้ช่องว่างไม่ถูกย้อน) — เลือก 2 จาก 3 → ย้อน 2 รายการล่าสุด, รายการแรกยังอยู่ใน stack
  - เปิดเมนูอันหนึ่งปิดอีกอัน (ปิด history dropdown ด้วย) · คลิกนอกเมนูปิด
- i18n 3 ภาษา: `sch.undoStepCount` / `sch.redoStepCount` / `sch.stepPickTitle` / `sch.stepPickRedoTitle` / `sch.stepPickHint` / `sch.stepPickRedoHint` / `sch.stepPickApply` / `sch.stepPickRedoApply`

### Verified
- typecheck 0 · build ผ่าน · integration **18/18**
- **Tooltip/badge จริง:** ปิดกฎ 3 ข้อต่อเนื่อง → ปุ่ม SkipBack tooltip "ย้อน 3 รายการพร้อมกัน · คลิกขวาเพื่อเลือก" + badge "3"
- **เลือกเฉพาะบางรายการ จริง:** คลิกขวา → เมนู 3 รายการ (ติ๊กครบ) "ย้อน 3 จาก 3 รายการบนสุด" → ยกติ๊กรายการเก่าสุด → สรุปเปลี่ยน "ย้อน 2 จาก 3" + ปุ่ม "ย้อนที่เลือก (2)" → ยืนยัน → **DB: Elevator+Lobby กลับ active, Dining ยัง off** (รายการที่ยกติ๊กไม่ถูกแตะ) · คลิกขวา SkipForward → เมนู redo "ทำซ้ำ 2 จาก 2" → ทำซ้ำที่เลือก → DB ทั้งคู่กลับ off
- **🐛 ระหว่างเทส:** hint ในเมนู redo โชว์คำว่า "ย้อน" (ใช้ key เดียว) — แยก `sch.stepPickRedoHint` · **คืน dev data เรียบร้อย** (sch-001/002 = จ-ศ 07:00–19:00 / 11:00–20:00, sch-003 = ทุกวัน 06:00–22:00, สีเพลย์ลิสต์ว่าง, ไม่มีกฎเทส, snapshots ว่าง)

---

## [0.4.29] — 2026-08-16  🤖 โดย Freebuff (Scheduler: restore point ลง DB ซิงก์ข้ามเครื่อง · ลาก/วางไฟล์ JSON ทั้งหน้า · ย้อน/ทำซ้ำขั้นตอนใหญ่ (group undo) · sandbox visual diff ✅)

### Added / Changed
- **Restore Points เก็บใน DB — ซิงก์ข้ามแท็บ/เครื่อง** (แทน localStorage เฉพาะ):
  - ตารางใหม่ `scheduler_snapshots` (id/name/data jsonb/createdAt) + migration `0013` · API ใหม่ `/api/scheduler-snapshots` GET/POST/DELETE (auth + permission เดียวกับ schedules + audit log)
  - `schedulerSnapshotApi` ใน client — `loadSnapshots` ดึงจาก API (localStorage เดิมเป็น fallback เมื่อ offline) — บันทึก/ลบ/auto-snapshot ของ sandbox เขียน DB จริง → **เปิดจากแท็บ/เครื่องอื่นเห็นสแนปชอตเดียวกัน** · กู้คืนใช้กลไกเดียวกับ import (`applySchedulerBackup`)
- **ลาก/วางไฟล์ JSON ลงบนหน้าทั้งหมด = เปิด diff preview** — drop zone ทั่วทั้งหน้า (dragenter/dragover/drop บน root — เช็ค `dataTransfer.types` มี Files) → overlay "ปล่อยเพื่อนำเข้า" + ปล่อยไฟล์ = `importSchedulerData` เปิด modal diff ทันที (ไม่ต้องคลิกเลือกไฟล์)
- **ย้อน/ทำซ้ำขั้นตอนใหญ่ (group undo)** — `HistoryEntry.grp`: การแก้ไขต่อเนื่อง (< 60 วิ) อยู่กลุ่มเดียวกัน → ปุ่ม **SkipBack/SkipForward** ใหม่ใน header ย้อน/ทำซ้ำทั้งกลุ่มทีเดียว — serialize ทีละ entry (await PATCH) → **DB เรียงตามลำดับไม่สลับ** · pop stack ก่อน apply กัน double-click
- **โหมดทดลอง: visual diff** — เทียบสถานะปัจจุบันกับสแนปชอตเริ่มต้นแบบสด: แถบแสดงสรุป (เปลี่ยน X · เพิ่ม Y · ลบ Z · สีเพลย์ลิสต์ W) + รายการก่อน→หลัง (ชื่อกฎ + เวลา/วัน/เปิด-ปิด) · **ไฮไลต์กฎที่เปลี่ยน**: การ์ดใน List (ring เขียว + badge "เปลี่ยน") + ชิปใน Month (ring เขียว) — หายเองเมื่อ revert/commit
- i18n 3 ภาษา: `sch.dropFileTitle` / `sch.dropFileHint` / `sch.undoStep` / `sch.redoStep` / `sch.sandboxDiffTitle` / `sch.sandboxDiffChanged` / `sch.sandboxDiffAdded` / `sch.sandboxDiffRemoved` / `sch.sandboxDiffColors` / `sch.sandboxDiffNone` / `sch.sandboxChangedBadge`

### Verified
- typecheck 0 · build ผ่าน · integration **18/18**
- **DB snapshot จริง:** บันทึกสแนปชอต → ตรวจ `scheduler_snapshots` มีแถว (data 3 กฎ) → **reload หน้าใหม่ (จำลองเครื่องอื่น)** → เปิด Restore Points เห็นสแนปชอต (โหลดจาก API) → ปิด Dining → กู้คืน → DB `is_active=true` → ลบ → ตารางว่าง
- **Drop จริง:** จำลอง dragenter/วางไฟล์ JSON ลงหน้า → overlay ขึ้น + diff preview เปิด → ยืนยัน → DB สร้างกฎ (09:00–13:00 [2,4]) → Ctrl+Z ลบออก
- **Group undo จริง:** ล้างประวัติ → ปิดกฎ 3 ข้อต่อเนื่อง (กลุ่มเดียว) → **SkipBack ครั้งเดียว → DB ทั้ง 3 กลับ active** → SkipForward → ทั้ง 3 กลับ off → SkipBack → baseline · **redo กลุ่มคืนลำดับถูกต้อง** (entry สุดท้ายอยู่บนสุด)
- **Sandbox diff จริง:** กด "ทดลอง" → แถบ "ยังไม่มีการเปลี่ยนแปลง" → ปิด Dining → แถบ "เปลี่ยน 1" + รายละเอียด "Dining Hall Lunch Hours Menu: ● เปิด → ○ ปิด" + การ์ด ring เขียว + badge "เปลี่ยน" + ชิป Month 30 จุด ring เขียว → revert → หายหมด
- **🐛 เจอ/แก้:** import/กู้คืนที่**เพิ่มกฎล้วน ๆ** ไม่สร้าง history entry — `sectionChanged` ตรวจเฉพาะ id ใน `before` (id ใหม่ใน `after` ถูกละ) → แก้: เพิ่มเงื่อนไขตรวจจับ id ใหม่ → Ctrl+Z หลัง import เพิ่มล้วน ๆ ลบกฎที่สร้างจริง · **PATCH เรียงสลับ** ตอนย้อน/ทำซ้ำหลายขั้นตอน (store คืน Promise แล้ว serialize ใน `upsertSchedules`/`applyUndo`/`applyRedo` — DB ได้ค่าสุดท้ายถูกต้อง) · **คืน dev data เรียบร้อย** (sch-001/002 = จ-ศ 07:00–19:00 / 11:00–20:00, sch-003 = ทุกวัน 06:00–22:00, สีเพลย์ลิสต์ว่าง, ไม่มีกฎเทส, snapshots ว่าง)

---

## [0.4.28] — 2026-08-16  🤖 โดย Freebuff (Scheduler: undo/redo ระดับระบบสำหรับ import/กู้คืน · โหมดทดลอง (sandbox) auto-snapshot + undo ไม่จำกัด + commit/revert · diff preview ค้นหา + ติ๊กเลือกเฉพาะกฎ · ซิงก์ลากสดรวม resize + วางบน legend ✅)

### Added / Changed
- **Undo/Redo ระดับระบบสำหรับ import / กู้คืนสแนปชอต / revert sandbox** — `applySchedulerBackup` บันทึก **1 history entry ก้อนเดียว** (สถานะก่อน/หลัง ของกฎทั้งหมด + สีเพลย์ลิสต์) ก่อนเขียน → **Ctrl+Z หลัง import = ย้อนกลับทุกอย่าง** (ลบกฎที่สร้าง, คืนเวลากฎที่ถูกเขียนทับ) · redo ทำซ้ำทั้งก้อน · สร้างโดยอัตโนมัติ ไม่ต้องกดบันทึก
- **โหมดทดลอง (sandbox):**
  - ปุ่ม "ทดลอง" ใน header → **บันทึกสแนปชอตอัตโนมัติ** (localStorage, ชื่อ "Auto-snapshot <เวลา>") + แถบโหมดทดลองสีเขียว → แก้ไข/ลากได้ตามปกติ แต่ **undo ไม่จำกัด** (ปิดการตัด history 50 entry ใน `commitHistory` ระหว่าง sandbox)
  - จบด้วย **บันทึกผล** (commit: เก็บผลลัพธ์ + ลบสแนปชอตอัตโนมัติ) หรือ **คืนค่า** (revert: กู้คืนสแนปชอต + ลบ) — ทั้งคู่ปลอดภัยต่อการลองผิดลองถูก
- **Diff preview นำเข้า: ค้นหา + ติ๊กเลือกเฉพาะกฎ** — ช่องค้นหา (ชื่อ/id) + ปุ่ม เลือกทั้งหมด / ไม่เลือก + checkbox ทุกรายการ → ป้ายสรุป (ใหม่/อัปเดต/ไม่เปลี่ยน/**เลือก X/Y**) คำนวณจากที่ติ๊กสดๆ → ยืนยันนำเข้าเฉพาะรายการที่เลือก (ยกเลิกการเลือกบางรายการได้ก่อนเขียน)
- **ซิงก์ลากสดข้ามแท็บครบทุกรูปแบบ** — ขยาย `scheduler-drag-sync` payload ด้วย `mode/edge/plDrop`:
  - **resize**: แท็บอื่นเห็นบล็อกขยาย/ย่อตามขอบที่ลาก (ความสูงเปลี่ยน, top คงเดิม — เหมือนลากในเครื่อง) + ring เฉพาะคอลัมน์เป้า
  - **วางบน legend**: แท็บอื่นเห็นไฮไลต์เพลย์ลิสต์เป้าหมาย (ring ขาว) ระหว่างลากกฎ
  - `end` ล้าง ghost + ไฮไลต์ทั้งหมด
- i18n 3 ภาษา: `sch.histImport` / `sch.histRestore` / `sch.histRevert` / `sch.importSearch` / `sch.importSearchEmpty` / `sch.importSelectAll` / `sch.importSelectNone` / `sch.importSelected` / `sch.sandboxTitle` / `sch.sandboxSnapName` / `sch.sandboxBanner` / `sch.sandboxCommit` / `sch.sandboxRevert` / `sch.sandboxCommitted` / `sch.sandboxReverted`

### Verified
- typecheck 0 · build ผ่าน · integration **18/18**
- **Sandbox จริง:** กด "ทดลอง" → แถบโหมดทดลอง + snapshot อัตโนมัติใน localStorage (1) · ปิด Dining → DB `is_active=false` → **คืนค่า** → DB กลับ `true` + snapshot ถูกลบ (0) + แถบหาย · **Ctrl+Z หลังคืนค่า** → Dining กลับ `false` (undo ระดับระบบ) → redo → `true` (baseline) · **Commit** → เก็บผล (Dining ยัง off) + ลบ snapshot
- **Import ติ๊กเลือก จริง:** import ไฟล์ foreign 4 กฎ (ใหม่ 2 · อัปเดต 2) → ค้นหา "sch-9" → เหลือ 2 แถว · ยกเลิกติ๊ก sch-901 → สรุปเปลี่ยนเป็น **"ใหม่ 1 · เลือก 3/4"** สดๆ → ยืนยัน → DB มี sch-900 แต่ **ไม่มี sch-901** + sch-001 end 20:00 → **Ctrl+Z → sch-900 ถูกลบ + sch-001 กลับ 19:00** (undo ก้อนเดียวคืนทุกอย่าง)
- **Remote resize/legend จริง:** จำลองแท็บอื่นส่ง `{mode:'resize', edge:'bottom', curMin:660}` → บล็อก sch-001 ทั้ง 5 คอลัมน์สูง 160px (4ชม.) top คงเดิม 40px + ring เฉพาะคอลัมน์ จ. · ส่ง `plDrop:'pl-corporate-main'` → legend ไฮไลต์ ring ขาวเฉพาะรายการนั้น · `end` → ล้างหมด (คืน 480px)
- **🐛 เจอ/แก้:** remote resize ghost ใช้ `curMin` เป็น top (บล็อกกระโดดไปที่ตำแหน่ง cursor) — แก้: ใช้ curMin เฉพาะโหมด move, resize ยึด top เดิม · **คืน dev data เรียบร้อย** (sch-001/002 = จ-ศ 07:00–19:00 / 11:00–20:00, sch-003 = ทุกวัน 06:00–22:00, สีเพลย์ลิสต์ว่าง, ไม่มีกฎเทส, ลบ snapshot ทดสอบ)

---

## [0.4.27] — 2026-08-16  🤖 โดย Freebuff (Scheduler: Shift snap ชั่วโมงเต็มใน week strip · ซิงก์ลากสดข้ามแท็บ (ghost) · import ไฟล์ต่างระบบพร้อม schema mapping + diff preview · restore point สแนปชอต ✅)

### Added / Changed
- **Shift snap ชั่วโมงเต็มใน week strip** — กด Shift ค้างตอนลากชิป/บล็อกมาวางบน strip → snap เป๊ะที่ชั่วโมง (00 นาที) แทน 15 นาที (`snapMinRef` ตามคีย์ Shift — ระหว่างลากกด/ปล่อย Shift ได้ทันที) · เพิ่ม hint "Shift = snap ชั่วโมงเต็ม" ใน strip
- **ซิงก์ลากสดข้ามแท็บ (live drag ghost):**
  - ทุกการลาก (grid + month) broadcast `scheduler-drag-sync` (start/move/end, throttle ~10/s) — **แท็บอื่นเห็น ghost อีเวนต์ตามตำแหน่งลากจริง**: บล็อกในกริดเลื่อนตาม curMin/curDay (ring + shadow) · ชิปใน Month dim — ปล่อย/ยกเลิก → ghost ล้างทันที (`remoteDrag` ใน store)
  - เปิด/ปิดกฎ (toggle) ก็ซิงก์อยู่แล้วผ่าน history-sync → refetch อัตโนมัติ
- **Import ไฟล์ต่างระบบ + diff preview (ยังไม่เขียน DB):**
  - รองรับไฟล์ที่**ไม่ใช่** `scheduler-backup`: array ธรรมดา / `{schedules:[]}` / `{rules:[]}` — **schema mapping อัตโนมัติ** (`name|title|label`, `startTime|start_time|start|timeStart`, `daysOfWeek|days_of_week|weekdays|days`, `isActive|is_active|enabled`, snake_case ทุกฟิลด์ ฯลฯ) — id ไม่มี → generate ใหม่
  - **แสดง diff ก่อนเขียน**: modal "ตัวอย่างการนำเข้า" — จำนวน ใหม่/อัปเดต/ไม่เปลี่ยน + รายการ (ชื่อ + id) + ป้าย "รูปแบบไฟล์ภายนอก — แปลงฟิลด์อัตโนมัติ" → **ยืนยันนำเข้า** = เขียนจริง / ยกเลิก = ไม่แตะ DB · ไม่มีการเปลี่ยนแปลง → alert แจ้ง ไม่เปิด modal
- **Restore Points (สแนปชอต — กู้คืน 1 คลิก):**
  - ปุ่ม "จุดคืนค่า" ใน header → modal: **บันทึกสแนปชอต** (สถานะ Scheduler ทั้งหมด: กฎ + สีเพลย์ลิสต์ + undo/redo stacks — เก็บใน **localStorage** อยู่รอด reload) + รายการสแนปชอตพร้อม **กู้คืน** / **ลบ** — ใช้ก่อนการทดลอง แล้วกู้กลับได้ทันที (ใช้กลไกเดียวกับ export/import: `applySchedulerBackup`)
- i18n 3 ภาษา: `sch.shiftSnapHint` / `sch.importPreview` / `sch.importForeign` / `sch.importNew` / `sch.importChanged` / `sch.importSame` / `sch.confirmImport` / `sch.noImportChanges` / `sch.snapshotsTitle` / `sch.saveSnapshot` / `sch.snapshotSaved` / `sch.snapshotRestored` / `sch.restore` / `sch.snapshotsEmpty` / `sch.rules`

### Verified
- typecheck 0 · build ผ่าน · integration **18/18**
- **Shift snap จริง:** ลากบล็อก Dining ไป strip ที่ ~10:22 → กด Shift = marker **"10:00"** · ปล่อย Shift = marker **"10:15"** — drop แบบ Shift → DB `start_time 10:00:00` เป๊ะ + days `[2,3,4,5]` → Ctrl+Z คืน baseline
- **ลากสดข้ามแท็บ จริง:** จำลองแท็บอื่นส่ง `scheduler-drag-sync move {sch-001, curMin:540, curDay:1}` → บล็อก Lobby ในคอลัมน์ จ. เลื่อนมาที่ 09:00 + ring/shadow (คอลัมน์อื่นปกติ) · Month: ชิป Lobby 30 จุด dim → `end` → ล้างหมด (0)
- **Import ต่างระบบ จริง:** ไฟล์ array foreign (`title`/`weekdays`/`start`/`end`) → modal "ใหม่ 2 · อัปเดต 0" + ป้าย foreign → ยืนยัน → DB สร้าง 2 กฎจริง (`sch-import-…-0` weekdays [1,3,5] 08:30–12:00 priority 60, `…-1` [0,6] 11:00–20:00) → ลบออกแล้ว
- **Restore point จริง:** บันทึกสแนปชอต (localStorage=1) → ปิด Dining (○ ปิด) → กู้คืน → **DB ทุกกฎกลับ is_active=true** + alert "สร้าง 0 / อัปเดต 3" — เคลียร์ snapshot ทดสอบแล้ว · **คืน dev data เรียบร้อย** (sch-001/002 = จ-ศ, sch-003 = ทุกวัน 06:00–22:00, สีเพลย์ลิสต์ว่าง, ไม่มีกฎเทส)

---

## [0.4.26] — 2026-08-16  🤖 โดย Freebuff (Scheduler: week strip กรองตามวัน + ย่อ/ขยาย · ลากบล็อก strip ขึ้นกริดเดือน (2 ทิศทาง) · ซิงก์ view/วันที่/การเลือกข้ามแท็บ · Export/Import กฎ JSON รวมประวัติ ✅)

### Added / Changed
- **Week strip ใต้กริดเดือน: กรองตามวันที่ + ย่อ/ขยายความสูง**
  - **คลิกคอลัมน์วันที่ใน strip = แสดงเฉพาะกฎของวันนั้น** (คอลัมน์อื่น dim 30% + header ไฮไลต์ cyan + chip "วัน ✕" ให้เคลียร์) — คลิกอีกครั้ง = เคลียร์
  - **ปุ่มย่อ/ขยาย** (ไอคอน ▾/▴): ความสูง 150px ↔ 420px — แกนเวลา/เส้นชั่วโมง/บล็อกปรับตาม
  - drop calc ใช้ rect ของกริดจริง (`data-strip-grid`) → ความสูงที่เปลี่ยนไม่มีผลต่อการคำนวณเวลา
- **ลากบล็อกใน week strip ขึ้นไปวางบนกริดเดือน = เปลี่ยนวัน (ลากได้ 2 ทิศทาง เหมือน Google Calendar):**
  - `beginChipDrag` ใช้ร่วมระหว่างชิปเดือน + บล็อก strip — ลากจาก strip ขึ้นไปวางบนเซลล์เดือน → `daysOfWeek` เอาวันต้นออก+เพิ่มวันเป้า (dedupe) · วางบนเดือนอื่น → view กระโดดตาม · Alt+ลาก = คัดลอก · คลิกบล็อก = แก้ไข · Ctrl+คลิก = เลือกกลุ่ม
  - ลากจาก strip ใช้โซน auto-scroll แบบ viewport (ไม่ขยายแถวเดือน — strip อยู่ชิดขอบล่างกริดพอดี กัน auto-scroll ผิดทิศ)
- **ซิงก์ view/วันที่/การเลือกข้ามแท็บ (BroadcastChannel):**
  - `viewMode`/`viewDate` ย้ายไปเก็บใน **store** (`schedulerViewMode`/`schedulerViewDate`/`setSchedulerView`) — แท็บหนึ่งสลับ Day/Week/Month/List หรือ ◀▶/วันนี้ → **อีกแท็บตามทันที** (message `scheduler-view-sync`)
  - การเลือกหลายอีเวนต์ก็ซิงก์ด้วย (`selection-sync`) — เลือกในแท็บหนึ่ง อีกแท็บเห็น ring เหมือนกัน
- **Export / Import กฎ Scheduler เป็น JSON (รวมประวัติการแก้ไข):**
  - **ส่งออก** (ปุ่มใหม่ใน header): ดาวน์โหลด `scheduler-backup-<date>.json` — schedules (เต็ม), playlists (id/name/color), **undo/redo stacks** + version/exportedAt
  - **นำเข้า**: เลือกไฟล์ JSON → upsert กฎ (id ซ้ำ = อัปเดต, ใหม่ = สร้าง — normalize เวลา HH:MM) + กู้สีเพลย์ลิสต์ + **คืน undo/redo stacks** → alert สรุป (สร้าง X / อัปเดต Y) — ใช้ย้าย/สำรองระหว่างระบบได้
- i18n 3 ภาษา: `sch.stripFilterHint` / `sch.stripFilterClear` / `sch.stripExpand` / `sch.stripCollapse` / `sch.export` / `sch.import` / `sch.importDone` / `sch.importFail`

### Verified
- typecheck 0 · build ผ่าน · integration **18/18**
- **Strip filter/ย่อ-ขยาย จริง:** คลิก "จ 17" → คอลัมน์อื่น opacity 0.3 + chip "จ ✕" + header cyan · ขยาย 150→420 → ย่อกลับ 150
- **ลาก strip → กริดเดือน จริง:** ลากบล็อก Dining (จ.17) ขึ้นวาง 2026-09-01 (อ.) → highlight เซลล์ตรงเป้า + ปล่อย → DB `[2,3,4,5]` (เวลาเดิม) + view กระโดด "ก.ย. 2026" → **Ctrl+Z คืน `[1,2,3,4,5]`**
- **ซิงก์ข้ามแท็บ จริง:** จำลองแท็บอื่นส่ง `scheduler-view-sync {week, 2026-07-20}` → หน้าเปลี่ยนเป็น Week "19–25 ก.ค. 2026" ทันที · `selection-sync ['sch-001']` → แถบ "เลือก 1 รายการ" ขึ้น
- **Export/Import จริง:** ดัก blob export → `{type:'scheduler-backup', version:1, schedules:3, playlists:11, history}` · import ไฟล์ที่แก้ sch-002 → [0,6] + pl-lunch-menu สี `#f43f5e` → DB เขียนจริง + alert "สร้าง 0 / อัปเดต 3" + history dropdown แสดง entry จากไฟล์
- regression: คลิกชิป (ไม่ลาก) ยังเปิด modal แก้ไข prefilled · **คืน dev data แล้ว** (sch-001/002 = จ-ศ, sch-003 = ทุกวัน 06:00–22:00, สีเพลย์ลิสต์ว่าง)

---

## [0.4.25] — 2026-08-16  🤖 โดย Freebuff (Scheduler: history dropdown แสดงรายละเอียดก่อน→หลัง + คลิก jump ไปกฎ · undo/redo ซิงก์ข้ามแท็บผ่าน BroadcastChannel · multi-select อยู่รอดข้าม view + ลากชิป Month ลง Week strip ตั้งวัน+เวลา · ปุ่มคัดลอก/ลบกฎใน modal พร้อม confirm ✅)

### Added / Changed
- **History dropdown แสดงตัวอย่างการเปลี่ยนแปลง (ไม่ใช่ label เฉยๆ) + คลิก jump ไปกฎ:**
  - ทุก history entry เก็บ `detail` (สร้างตอน push): ชื่อกฎ + ก่อน→หลังของ **เวลา** (`11:00–20:00 → 10:00–19:00`) / **วัน** (`จ,อ,พ → อ,พ,พฤ` — ใช้ชื่อวันตามภาษา) / **เพลย์ลิสต์** / **เปิด→ปิด** / **เปลี่ยนชื่อ** — และ `+ ชื่อ` / `− ชื่อ` สำหรับสร้าง/ลบ · สีเพลย์ลิสต์: `#abc → #def`
  - **คลิกที่รายการ → กระโดดไปกฎนั้น** (เปิด modal แก้ไข prefilled) หรือเปิดตัวเลือกสีของเพลย์ลิสต์ — dropdown กว้างขึ้น (w-80) รองรับ 2 บรรทัดต่อรายการ
- **Undo/Redo ซิงก์ข้ามแท็บ (BroadcastChannel):**
  - `setUndoStack` / `setRedoStack` / `clearHistory` ใน store broadcast `{type:'history-sync', stacks}` ไปช่อง `signage-history-sync` — **แท็บอื่นรับแล้วซิงก์ stacks + ดึง schedules/playlists ล่าสุดจาก server** (`refreshSchedulesAndPlaylists` ใหม่) → กด Ctrl+Z ในแท็บหนึ่ง อีกแท็บอัปเดตทันที (รับเฉพาะ stacks — ไม่ broadcast กลับ → ไม่วนลูป)
  - หน่วง + debounce (~150ms) กัน race กับ PATCH ที่ยังไม่จบ (refetch ไปโดนค่าก่อนแก้)
- **Multi-select อยู่รอดข้าม view (เลือกใน Month → สลับไป Week แล้วลากกลุ่มได้):**
  - `selectedScheduleIds` ย้ายไปเก็บใน **store** (เดิมเป็น state ของ component ที่ถูกล้างตอนสลับ view) — เลือกชิปใน Month → สลับไป Week/Day → บล็อกยังมี ring + ลากตัวใดตัวหนึ่ง = ย้ายทั้งกลุ่ม · กลับ Month ก็ยังเห็น selection · Esc ล้าง
  - **Week strip ใต้กริดเดือน (ลากข้าม view: Month → Week โดยตรง):** แถบเส้นเวลา 7 วัน × 06:00–22:00 แสดงบล็อกกฎปัจจุบัน — **ลากชิปจากกริดเดือนมาวาง** = เปลี่ยน **วัน (คอลัมน์) + เวลา (ตำแหน่ง y)** ของทั้งกลุ่ม (delta เท่ากัน เหมือนลากในกริด) — ไฮไลต์คอลัมน์เป้าหมาย + เส้นเวลาปลายทาง (พร้อม label เวลา) · สนับสนุน Alt+ลาก = คัดลอก · auto-scroll ถูกระงับระหว่าง hover บน strip
- **ปุ่มใน modal แก้ไข: "คัดลอกกฎ" + "ลบกฎ" (กันลบโดยไม่ตั้งใจ):**
  - **คัดลอกกฎ** = สร้างสำเนาจากค่าปัจจุบันในฟอร์มทันที (id ใหม่) — บันทึกเป็น history "Duplicate" (undo = ลบ) · **ลบกฎ** = `window.confirm` ก่อนลบ (มีใน modal + ปุ่มถังขยะใน List ด้วย) — บันทึกเป็น history "Delete" (undo = สร้างกลับ)
- i18n 3 ภาษา: `sch.historyJump` / `sch.duplicateRule` / `sch.duplicateHint` / `sch.deleteRule` / `sch.confirmDelete` / `sch.weekStripTitle` / `sch.monthToWeekHint`

### Fixed
- **undo/redo คืนกฎที่ถูกลบไปแล้วล้มเหลว (400) สำหรับกฎที่โหลดจาก DB**: store แมป `startTime` เป็น `'HH:MM:SS'` (คอลัมน์ time) แต่ `CreateScheduleSchema` ต้องการ `HH:MM` — `upsertSchedules` ส่ง item ดิบไป `addSchedule` → 400 → กฎไม่ถูกสร้างใน DB (บั๊กแฝงที่ซ่อนอยู่ — ตรวจพบตอนเทสลบกฎใน modal แล้ว undo) — แก้: normalize `slice(0,5)` ตอนสร้างใหม่ใน `upsertSchedules` (และ `handleDuplicate`)

### Verified
- typecheck 0 · build ผ่าน · integration **18/18**
- **History dropdown จริง:** toggle Dining (เปิด→ปิด) → entry แสดง "Dining Hall Lunch Hours Menu: ● เปิด → ○ ปิด" · คลิก entry → modal เปิด prefilled Dining
- **Modal จริง:** คัดลอก Dining → สร้าง `sch-…` (11:00–20:00, จ-ศ) → **Ctrl+Z ลบ** · ลบ Dining ผ่าน modal (confirm) → **Ctrl+Z คืนกฎใน DB** (11:00–20:00 ถูกต้อง — หลัง fix)
- **Cross-view selection จริง:** Ctrl+คลิกชิป Dining ใน Month → สลับ Week → บล็อก ring + แถบ "เลือก 1 รายการ" → กลับ Month ring ยังอยู่ → Esc ล้าง
- **Week strip drop จริง:** ลากชิป Dining (จ.17) → วางบน strip (อ.18 ~09:00) → DB กลายเป็น `[2,3,4,5]` + 09:00–18:00 → **Ctrl+Z คืน `[1,2,3,4,5]` 11:00–20:00** · ไฮไลต์ "อ 18" + marker เวลาขึ้นระหว่างลาก
- **Cross-tab sync จริง:** จำลองแท็บอื่นส่ง message ผ่าน `BroadcastChannel('signage-history-sync')` → undo ปุ่มเปิดใช้งาน + dropdown แสดง entry จากแท็บอื่น · BroadcastChannel ส่งถึงแท็บที่โพสต์ด้วย → ทุกการแก้ในเซสชันทดสอบนี้พิสูจน์ send+receive ครบวงจร (เห็น GET schedules/playlists ตามหลังทุก PATCH — refetch อัตโนมัติ)

---

## [0.4.24] — 2026-08-16  🤖 โดย Freebuff (Scheduler: Undo/Redo ครอบคลุมฟอร์ม+สีเพลย์ลิสต์ เก็บใน store + เลือกหลายบล็อกใน Week/Day ลากพร้อมกัน + Alt+ลากคัดลอก + ปุ่มประวัติ ✅)

### Added / Changed
- **Undo/Redo ครอบคลุมการแก้ไขทุกแบบ (เดิมมีแค่การลาก):**
  - **สร้าง/แก้ไข/ลบกฎผ่านฟอร์ม**, สลับ on/off ใน List, และ **เปลี่ยนสีเพลย์ลิสต์** — ทุกอย่างย้อนกลับได้ด้วย Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y (undo/redo เขียนกลับ DB จริง — สร้างกฎที่ถูกลบกลับคืน, ลบกฎที่ถูก undo สร้าง ฯลฯ)
  - **ประวัติเก็บใน store (ไม่ใช่ state ของ component) → อยู่รอดข้ามการสลับแท็บ** — `undoStack`/`redoStack`/`clearHistory` ใน `useSignageStore` · 50 รายการ · entry บันทึก label + timestamp + before/after
  - **ปุ่มประวัติ (ไอคอน History) ถัดจาก undo/redo**: dropdown แสดง **รายการแก้ไขล่าสุด 10 รายการ** (label + เวลา) + ปุ่ม **ล้างประวัติ** — ยัง undo ได้จากปุ่ม/คีย์ลัดตามปกติ
- **เลือกหลายอีเวนต์ใน Week/Day view + ลากพร้อมกัน (เหมือน Month view):**
  - Ctrl/Shift/⌘ + คลิกบล็อก = เลือก/ยกเลิก (ring ขาว 2px + แถบ "เลือก N รายการ" + Esc ล้าง) — คลิกธรรมดายังเปิด modal แก้ไข
  - ลากบล็อกที่ถูกเลือก → **ย้ายทุกกฎพร้อมกัน** (ทุกกฎได้ delta เท่ากัน — ย้ายเวลา/ข้ามวัน) · drop บน legend = เปลี่ยนเพลย์ลิสต์ทั้งกลุ่ม · เลือกจะถูกเคลียร์หลังปล่อย (เหมือน month)
- **Alt+ลาก = คัดลอกกฎใหม่ (แทนการย้าย) — ต้นฉบับคงเดิม:**
  - Week/Day: Alt+ลากบล็อก → สร้างกฎใหม่ (id ใหม่) ที่วัน/เวลาเป้าหมาย — บันทึกเป็น history "Duplicate rule" (undo = ลบกฎที่คัดลอก)
  - Month: Alt+ลากชิปข้ามวัน → สร้างกฎใหม่ที่วันเป้าหมาย (dedupe วัน) — รองรับลากเป็นกลุ่ม (คัดลอกทุกกฎที่เลือก)
- i18n 3 ภาษา: `sch.copyHint` / `sch.historyTitle` / `sch.historyEmpty` / `sch.historyClear` / `sch.histMove` / `sch.histResize` / `sch.histDay` / `sch.histPlaylist` / `sch.histCreate` / `sch.histEdit` / `sch.histDelete` / `sch.histDuplicate` / `sch.histColor`

### Fixed
- **undo เปลี่ยนสีเพลย์ลิสต์ไม่คืนค่า**: `mapPlaylist` แมป `color: p.color || undefined` → ค่าว่างกลายเป็น `undefined` → `JSON.stringify` ทิ้ง key → PUT ของ undo ไม่มี field `color` → DB ไม่ถูกเคลียร์ — แก้โดยส่ง `{ color: item.color ?? '' }` ใน undo/redo (และไม่ส่งทั้งออบเจกต์ → ไม่ลบ/สร้าง `playlistItems` ซ้ำ)
- **Alt+ลากชิปใน Month 400 Validation failed**: store แมป `startTime` เป็น `'HH:MM:SS'` (จากคอลัมน์ time ของ DB) แต่ `CreateScheduleSchema` ต้องการ `HH:MM` (strict) — แก้โดย normalize `startTime/endTime.slice(0,5)` ตอนคัดลอก

### Verified
- typecheck 0 · build ผ่าน · integration **18/18**
- **ฟอร์ม/สี → undo/redo จริง:** สร้างกฎ (POST 201) → **Ctrl+Z ลบออกจาก DB** → redo กลับมา · แก้ไขชื่อ (PATCH) → undo คืนชื่อเดิม · ลบกฎ (DELETE) → undo สร้างกลับ · เปลี่ยนสี Executive → `#10b981` → **Ctrl+Z → DB กลับ `''`** (เทสซ้ำหลัง fix — ก่อน fix DB ค้างค่าเดิม)
- **Week/Day multi-select จริง:** Ctrl+คลิก sch-001 + sch-002 → แถบ "เลือก 2 รายการ" + ring 2 บล็อก → ลากลง 2 ชม. → **ทั้ง 2 กฎเลื่อน +2:15 เท่ากัน (07:00→09:15, 11:00→13:15)** → **Ctrl+Z คืนทั้งคู่**
- **Alt+ลากคัดลอกจริง:** Week — Alt+ลาก Lobby → สร้าง `sch-...-0` (08:30–20:30) ต้นฉบับไม่เปลี่ยน → undo ลบ · Month — Alt+ลาก Dining จ.17→อ.18 → สร้างกฎใหม่ days `[2,3,4,5]` (dedupe) ต้นฉบับ `[1,2,3,4,5]` คงเดิม → undo ลบ
- **Dropdown ประวัติ:** แสดง "แก้ไขกฎ" + เวลา → กด **ล้างประวัติ** → stack ว่าง (undo disabled + "ยังไม่มีการเปลี่ยนแปลง") — **คืน dev data เรียบร้อย** (sch-001/002 = จ-ศ, sch-003 = ทุกวัน 06:00–22:00, สีเพลย์ลิสต์ว่างหมด, ลบกฎเทส) — ยังไม่ commit / sync prod

---

## [0.4.23] — 2026-08-16  🤖 โดย Freebuff (Scheduler: ลากชิปข้ามเดือนไกล (grid ขยายอัตโนมัติ) + เลือกหลายอีเวนต์ลากพร้อมกัน + Undo/Redo ทุกการลาก ✅)

### Added / Changed
- **ลากชิป Month ข้ามเดือนไกลได้จริง (ไม่ต้องกด ◀▶):**
  - ชี้ค้างที่**ขอบบน/ล่างของกริด** → กริดขยายแถวเดือนก่อน/ถัดไป**อัตโนมัติ** (สูงสุด 14 แถว/ทิศ ≈ 3 เดือนครึ่ง) — วางบนวันที่ไกลได้ (เช่น ย้ายจาก ส.ค. ไป ธ.ค.) แล้ว `viewDate` กระโดดไปเดือนนั้นก่อนวาง
  - **2 เฟส:** เฟส 1 — ยังไม่ถึงขอบกริด (ขอบอยู่นอกจอ) → เลื่อนหน้าตามปกติ · เฟส 2 — ชี้ใกล้ขอบกริดที่มองเห็น (clamp กับ viewport) → **ขยาย 1 แถว/300ms + เลื่อนหน้าตาม 1 แถว** (แถวใหม่โผล่ที่ขอบพอดี — flow ควบคุมได้ ไม่ไหลผ่าน) — highlight/วันเป้าหมายอัปเดตตามทุกเฟรม (`elementFromPoint`)
  - `monthCells` คำนวณแบบ dynamic (`6 + top + bottom` สัปดาห์, offset -top×7) — reset เมื่อปล่อย/cancel/สลับ view
- **เลือกหลายอีเวนต์ใน Month view + ลากพร้อมกัน (Ctrl/Shift+คลิก):**
  - Ctrl/Shift/⌘ + คลิกชิป = เลือก/ยกเลิกการเลือก (ring ขาว 2px + แถบสถานะ "เลือก N รายการ" พร้อมปุ่มยกเลิก) · Esc ล้างการเลือก · คลิกธรรมดา = แก้ไขกฎเหมือนเดิม
  - ลากชิปที่ถูกเลือก → **ย้ายทุกกฎพร้อมกัน** (เอาวันต้นทางออก + เพิ่มวันปลายทาง — dedupe ต่อกฎ) — บันทึก `PATCH` ต่อกฎ + undo ได้เป็นกลุ่ม
- **Undo/Redo สำหรับการลากอีเวนต์ทุกแบบ (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y):**
  - บันทึก before/after ของกฎที่ถูกลาก → **ย้าย/ขยาย/เปลี่ยนวัน (ชิปเดือน)/เปลี่ยนเพลย์ลิสต์ (drop บน legend)/ย้ายกลุ่ม** — ย้อนกลับได้ทันที ไม่ต้องกดบันทึก (undo/redo เขียนกลับผ่าน `updateSchedule` → บันทึก DB จริง)
  - ปุ่ม Undo2/Redo2 ใน header (disabled เมื่อ stack ว่าง) + คีย์ลัด — stack สูงสุด 50 รายการ · drop ที่ไม่เปลี่ยนอะไร (no-op) ไม่สร้าง history
- i18n 3 ภาษา: `sch.selectHint` / `sch.monthExpandHint` / `sch.selectedCount` / `sch.undo` / `sch.redo`

### Verified
- typecheck 0 · build ผ่าน · integration **18/18**
- **ขยายเดือนจริง (simulate pointer):** จับชิป → ชี้ขอบล่างค้าง → แถวเพิ่มทีละแถว (highlight ไล่ 11-17→11-24→12-08 จนถึง cap ธ.ค.) → ปล่อย → **header กระโดด "ธ.ค. 2026"** + DB `[1,2,3,4,5,6]` → **Ctrl+Z คืน `[0..6]`** · ทิศขึ้น: ชี้เหนือขอบบนกริด → กริดขยายย้อนไปถึง **เม.ย.** + highlight ไล่ย้อน (05-19→04-21) → ปล่อยบน 04-21 → view ไป "เม.ย. 2026" + DB เปลี่ยนถูกกฎ → Ctrl+Z คืนค่า
- **Multi-select จริง:** Ctrl+คลิก Dining+Lobby (เซลล์ จ.17) → ring 2 ชิป + แถบ "เลือก 2 รายการ" → ลาก Dining ไป อ.18 → **ทั้ง 2 กฎกลายเป็น `[2,3,4,5]` พร้อมกัน** → **Ctrl+Z คืนทั้ง 2 กฎ** — หมายเหตุ: sch-001 = Lobby / sch-002 = Dining (ตาม seed — ยืนยัน id mapping ระหว่างเทส)
- **Undo/Redo ครบทุกแบบ:** ย้ายบล็อกใน week (06:00→08:00 → undo คืน) · resize ขอบล่าง (22:00→21:00 → undo คืน) · drop บน legend (playlist → pl-lunch-menu → undo คืน pl-executive-briefing) · redo (Ctrl+Shift+Z) re-apply · ปุ่ม undo/redo สลับ disabled ถูกต้องตาม stack
- regression: คลิกชิป (ไม่ลาก) ยังเปิด modal prefilled ถูกกฎ · คลิกเซลล์ยังไป Day view — **คืน dev data เรียบร้อย** (sch-001/002 = จ-ศ, sch-003 = ทุกวัน 06:00–22:00 pl-executive-briefing) — ยังไม่ commit / sync prod

---

## [0.4.22] — 2026-08-16  🤖 โดย Freebuff (Scheduler: ซ่อน/แสดงเพลย์ลิสต์ + เลือกสีเองบันทึกลง DB + ลากชิปข้ามวัน/ข้ามเดือน + Auto-scroll ครบทุก view ✅)

### Added / Changed
- **คลิกชื่อเพลย์ลิสต์ใน legend = ซ่อน/แสดงอีเวนต์ของเพลย์ลิสต์นั้นในทุกมุมมอง** (Google Calendar toggle calendar):
  - ชื่อที่ซ่อนจะ **ขีดฆ่า + จาง + ไอคอน EyeOff** — คลิกอีกครั้งเพื่อแสดงกลับ
  - มีผลทุกมุมมอง: **Day / Week / Month / List** — กริด/ชิป/รายการ/จำนวนหัวข้อวัน (badge count) กรองตามเพลย์ลิสต์ที่ซ่อน (`visibleSchedules` = schedules − hiddenPlaylists) — จำนวนกฎใน List ก็ใช้ค่านี้
  - legend ถูกแยกเป็น block ใช้ร่วม (render เดียวกัน) ในทุกมุมมองรวมถึง List view (ซ่อน/แสดงได้จากทุกที่)
- **เลือกสีเพลย์ลิสต์เองได้ + บันทึกลง DB:**
  - คลิกวงกลมสีใน legend → modal **เลือกสีเพลย์ลิสต์**: จาน 12 สีสำเร็จรูป (grid 6×2) + **custom color** (`<input type=color>` + hex text field) + preview swatch → **บันทึกสี**
  - `Playlist.color` (hex) ใหม่ — **DB migration `0012` เพิ่มคอลัมน์ `color` (varchar 20)** + `Create/UpdatePlaylistSchema` + `mapPlaylist` (store) + seed ใส่สีเริ่มต้น — บันทึกผ่าน `updatePlaylist` → `PUT /api/playlists/:id` (เขียนจริงใน Postgres)
  - สี custom render ด้วย **inline style** (`plBarStyle`/`plDotStyle` — hex→rgba 55%) เพราะ Tailwind ไม่มี class ไดนามิก — เพลย์ลิสต์ที่ยังไม่ตั้งสี → fallback จานอัตโนมัติ 12 สีเดิม (sorted-id)
- **ลากชิปอีเวนต์ข้ามวันใน Month view = เปลี่ยนวันของกฎ:**
  - pointerdown/pointermove/pointerup + capture บนชิป — **highlight เซลล์เป้าหมาย** (ring cyan 2px) · ชิปที่ลากจาง + ring ขาว
  - ปล่อยบนวันอื่น → `updateSchedule({ daysOfWeek })` = **เอาวันต้นออก + เพิ่มวันเป้าหมาย (dedupe — วันเป้าหมายอาจอยู่ในกฎอยู่แล้ว)** → `PATCH /api/schedules/:id` (บันทึกจริง) — คลิกชิป (ไม่ลาก) ยังเปิด modal แก้ไขเหมือนเดิม · คลิกเซลล์ (ไม่ใช่ชิป) ยังไป Day view
  - เพิ่ม hint "ลากชิปไปวางบนวันอื่นเพื่อเปลี่ยนวันของกฎ" + `data-month-cell`/`data-month-day` บนเซลล์
  - **Auto-scroll ขณะลาก:** เลื่อนหน้า (แนวตั้ง) + เลื่อนกริด (แนวนอน, `overflow-x-auto`) **ต่อเนื่อง** ผ่าน `requestAnimationFrame` เมื่อชี้ใกล้ขอบ viewport/กริด (โซน 72px, ความเร็ว 6–28px/เฟรม ตามความลึก) — เซลล์ใหม่ที่เลื่อนเข้ามาใต้ cursor อัปเดต highlight/วันเป้าหมายเองทุกเฟรม (แม้ pointer นิ่ง) — หยุดทันทีเมื่อลากออกจากขอบ / ปล่อย / cancel / unmount (`findVerticalScroller` หา scroll container จริง — รองรับ main content แบบมี overflow ของตัวเองด้วย)
- **Auto-scroll แบบเดียวกันกับ week/day view** — ลากอีเวนต์ในกริดเวลาแล้วชี้ใกล้ขอบบน/ล่างของ viewport → เลื่อนหน้าเองต่อเนื่อง (`requestAnimationFrame`, โซน 72px, ความเร็ว 6–28px/เฟรม ตามความลึก) + แนวนอนผ่านการ์ด `overflow-x-auto` (`weekCardRef`) — ตำแหน่งลาก (curMin/curDay) + drop target บน legend คำนวณใหม่ทุกเฟรมผ่าน tick (`scrollTickUpdaterRef` — updater ร่วมกับ month view) — หยุดเมื่อออกจากขอบ / ปล่อย / cancel / unmount
- **ลากชิป Month ข้ามเดือนได้จริง** — ตอนนี้ชิปจำวันที่ต้นทาง/ปลายทาง (`origYmd`/`curYmd` ใน monthDrag):
  - ปล่อยบนวันที่อยู่นอกเดือนปัจจุบัน → **`viewDate` ขยับไปเดือนนั้นก่อนวาง** (เห็นผลทันทีในกริดใหม่ — เดิมวางบนเซลล์เดือนถัดไป/เดือนก่อนที่จางๆ แล้วไม่มีอะไรเกิดขึ้นเพราะ weekday ซ้ำ หรือสลับวันแบบไม่เห็น view)
  - เปลี่ยนวันของกฎตาม **วันที่** ที่วาง (เอาวันต้นทางออก + เพิ่มวันปลายทาง — dedupe) — เหมือนเดิมภายในเดือน + ใหม่ข้ามเดือน
- i18n 3 ภาษา: `sch.togglePlaylist` / `sch.playlistColorTitle` / `sch.presetColors` / `sch.customColor` / `sch.saveColor` / `sch.monthDragHint`

### Verified
- typecheck 0 · build ผ่าน · integration **18/18** · migration 0012 ผ่าน (column `color` มีใน DB จริง)
- **ซ่อน/แสดง:** คลิกชื่อ Executive ใน List → การ์ดหาย (3→2) + ชื่อขีดฆ่า+EyeOff · ใน Week → กริดเหลือ 2 กฎ/วันทำงาน + วันหยุดว่าง · คลิกอีกครั้งคืนสภาพ
- **สีเพลย์ลิสต์:** เลือก preset #8b5cf6 → swatch/บล็อกม่วง · พิมพ์ custom #16a34a → บันทึก → **DB `color='#16a34a'` จริง** (PUT 200) + บล็อก bg `rgba(22,163,74,0.55)` border เต็ม · reload แล้วสียังอยู่ (อ่านจาก DB) — **หมายเหตุ: ต้อง restart dev server** หลัง migration เพราะ tsx จำ schema เก่า (drizzle drop คีย์ไม่รู้จักเงียบๆ) — รีสตาร์ทแล้ว PUT เขียนสีลง DB ได้จริง
- **ลากชิป Month:** ลาก Elevator 26→27 ก.ค. → **วันอาทิตย์ทั้ง 6 เซลล์ไม่มีชิป Elevator** + DB `days_of_week=[1,2,3,4,5,6]` (ไม่มีซ้ำ — เจอบั๊ก duplicate ระหว่างเทสแล้วแก้) · คลิกชิป Dining → modal prefilled ถูกกฎ
- **Auto-scroll จริง:** จับชิป Monday → ชี้ขอบล่าง (y=640) ค้าง → scrollTop **400→444→576→636** (เพิ่มต่อเนื่อง) + highlight ตามเซลล์ที่เลื่อนเข้ามา (**08-31**) · ย้ายกลับกลางจอ → scroll หยุดนิ่ง + highlight ตาม Monday · ชี้ขอบบน (y=60) → scroll ขึ้น **636→0** (ขอบบนมี navbar คงที่บัง — highlight เลยว่างตรงนั้น แต่ scroll ทำงาน) · ปล่อย → loop หยุด + **ข้อมูลไม่เปลี่ยน** (sch-003 = ทุกวันเท่าเดิม)
- **Auto-scroll week grid จริง (simulate pointer events):** จับบล็อก sch-003 → ลากลงขอบล่าง (y=645) → scrollTop **0→808** ต่อเนื่อง + ghost ตาม scroll · ย้ายกลับกลางจอ → **scroll หยุดนิ่ง** · ชี้ขอบบน (y=60) → scroll ขึ้น **808→532→0** · ปล่อยที่ตำแหน่งเดิม → **ข้อมูลไม่เปลี่ยน** (06:00–22:00, ทุกวัน)
- **ลากชิปข้ามเดือนจริง:** ลากชิป Elevator 8 ก.ย. → วาง 6 ต.ค. (นอกเดือน) → **header กระโดดเป็น "ต.ค. 2026"** (กริด 27 ก.ย.–7 พ.ย.) + highlight เซลล์เป้าหมายขึ้นระหว่างลาก (inset cyan ที่ 2026-10-06) + weekday เดิม → `[1,2,3,4,5,6]` · ลาก 16 ส.ค. → วาง 1 ก.ย. (อา→อ) → view ไป "ก.ย. 2026" + DB `[1,2,3,4,5,6]` (เอาอาทิตย์ออก เพิ่มอังคาร) · regression: คลิกชิป (ไม่ลาก) ยังเปิด modal "แก้ไขกฎตารางเวลา" prefilled 06:00–22:00 — **คืน dev data เรียบร้อย** (sch-003 = ทุกวัน `[0..6]` · pl-executive-briefing color='') — ยังไม่ commit / sync prod

---

## [0.4.20] — 2026-08-16  🤖 โดย Freebuff (Scheduler ปฏิทินครบ 3 มุมมอง — Day / Week / Month เหมือน Google Calendar ✅)

### Added / Changed
- **SchedulerEngine เพิ่มมุมมองวันเดียว (Day) + รายเดือน (Month)** — สลับ view ได้ 4 แบบ (วัน/สัปดาห์/เดือน/รายการ) แบบ Google Calendar:
  - **Day View** — กริดแกนเวลา 1 วันเดียว (06:00–24:00) ใช้ drag engine เดียวกับ week view (ลากย้าย/ขยาย/สร้างใหม่ได้ครบ) + header แสดง วัน-เดือน-ปี เต็ม + เส้นเวลาปัจจุบัน
  - **Month View** — กริด 6 สัปดาห์ × 7 วัน: ชิปอีเวนต์สีตาม **6-Level Priority** (แสดงสูงสุด 3 + "+N รายการ") · วันนอกเดือนจาง · วันนี้ไฮไลต์วงกลม · **คลิกวันที่ = ข้ามไปมุมมองวันเดียว** · **คลิกชิป = เปิด modal แก้ไขกฎ**
  - **Navigation** — ปุ่ม **วันนี้** + ◀ ▶ (วันละ 1 วัน / สัปดาห์ละ 7 วัน / เดือนละ 1 เดือน) + ป้ายช่วงวันที่ (เช่น "16 – 22 ส.ค. 2026") + คลิกวันที่ใน header ของ week/day = ข้ามไป Day view — **วันนี้ ใน week view กลับมาที่สัปดาห์ปัจจุบัน** (เทสแล้ว: 30 ส.ค.–5 ก.ย. → วันนี้ → 16–22 ส.ค.)
  - **กรองตามวันที่จริง** (`isActiveOnDate` = dayOfWeek + ช่วง startDate–endDate) ในทุกมุมมอง — เดิม week view กรองแค่วันในสัปดาห์ ละเลยช่วงวันที่ ตอนนี้ตรงกับความเป็นจริง
  - **Month view ไฮไลต์สัปดาห์ปัจจุบัน** — เซลล์วันที่ 7 วันของสัปดาห์ที่มีวันนี้ (อา–ส) ใส่กรอบ ring สีฟ้า + พื้นหลังจาง เพื่อให้เห็นสัปดาห์ปัจจุบันชัดเจน
- i18n 3 ภาษา: `sch.viewDay/viewWeek/viewMonth/today/dayCalendar/monthCalendar/moreEvents/month0-11` — เก็บคีย์ `sch.viewCalendar` ไว้ (ไม่ใช้แล้ว) เหมือน `sch.viewTimeline`

### Verified
- typecheck 0 · build ผ่าน
- **ยืนยันใน preview:** สลับ view ครบ 4 แบบ · week header แสดงวันที่ + ปุ่มนำทาง · day view แสดงเฉพาะกฎที่ทำงานวันนั้นจริง (อา 16 = เฉพาะ Elevator, จ 17 = ครบ 3 กฎ) + next เปลี่ยนวัน · month view 6×7 + ชิปอีเวนต์ + คลิกวันที่ 18 → day view · คลิกชิป → modal prefilled · สลับภาษา EN ครบ (Day/Week/Month/Today/Aug 2026) — คืนภาษาไทยแล้ว

---

## [0.4.21] — 2026-08-16  🤖 โดย Freebuff (แยกสีเพลย์ลิสต์ + ลากวางเปลี่ยนเพลย์ลิสต์ + เส้นเวลาสด ✅)

### Added / Changed
- **สีหลักของบล็อก/ชิปอีเวนต์ = สีประจำเพลย์ลิสต์** (เหมือน Google Calendar แยกสีแต่ละปฏิทิน) — จัดสรร 12 สีตามลำดับ id ที่เรียง (คงที่ ไม่ชนกันเมื่อมีเพลย์ลิสต์ ≤ 12; เปลี่ยน hash → sorted-index เพราะ hash ชนกัน 3/6 ใน demo data):
  - **Day/Week view** — บล็อกสีตามเพลย์ลิสต์ + **แถบซ้ายบาง 4px สีระดับความสำคัญ** (ย้าย cue ของ 6-Level Priority มาเป็นแถบข้าง — ไม่เสียข้อมูล priority)
  - **Month view** — ชิปสีตามเพลย์ลิสต์ + จุดเล็กสี priority หน้าชื่อ
  - **List view** — จุดสีเพลย์ลิสต์ข้างชื่อเพลย์ลิสต์
  - กฎที่ไม่มีเพลย์ลิสต์ (เช่น emergency) → fallback สี priority เดิม
- **Legend ใหม่** ใน week/day/month view: กลุ่ม **"สีเพลย์ลิสต์"** (swatch + ชื่อทุกเพลย์ลิสต์) คั่นด้วยเส้น แล้วตามด้วย 6 ระดับ priority + conflict เดิม
- i18n 3 ภาษา: `sch.playlistLegend` + `sch.dragToPlaylist` (EN: Playlist Colors / Drag a rule here… / ไทย: สีเพลย์ลิสต์ / ลากกฎมาวางเพื่อเปลี่ยนเพลย์ลิสต์ / 中文: 播放列表颜色 / 拖动规则到此以更改播放列表)

### Added (ต่อจากสีเพลย์ลิสต์)
- **ลากอีเวนต์ไปวางบน legend เพลย์ลิสต์ = เปลี่ยนเพลย์ลิสต์ของกฎนั้น** (Google Calendar style):
  - ขณะลาก (move) — กลุ่ม legend ไฮไลต์ cyan + รายการเพลย์ลิสต์ที่ชี้อยู่ ring ขาว (`data-pl-drop` + `elementFromPoint` ตรวจจับ drop target ตอน pointermove/up)
  - ปล่อยบนเพลย์ลิสต์อื่น → `updateSchedule({ playlistId })` — **คงเวลา/วันเดิม** (ลากไป legend ไม่นับเป็นการย้ายเวลา) · ปล่อยบนเพลย์ลิสต์เดิม/นอก legend → พฤติกรรมลากย้ายเดิม
- **เส้นเวลาปัจจุบันใน Day/Week view เคลื่อนแบบเรียลไทม์ทุกนาที** — `nowDate` เปลี่ยนจาก `new Date()` ตอน render → state + `useEffect` setTimeout ตรงขอบนาที (60_000 − Date.now()%60_000) re-schedule วน — ไฮไลต์วันนี้/สัปดาห์ปัจจุบันใน month view ก็อัปเดตตามด้วย (ข้ามเที่ยงคืนเอง)

### Verified
- typecheck 0 · build ผ่าน · integration **18/18**
- **ยืนยันใน preview:** week view — 3 กฎสีต่างกันชัดเจน (sky/rose/cyan) + แถบ priority cyan (scheduled ทั้ง 3) · month view — ชิปสีตรงกับเพลย์ลิสต์ + จุด priority · legend แสดง 11 เพลย์ลิสต์ 11 สีไม่ซ้ำ + 6 ระดับ
- **ลากวางจริง (simulate pointer events):** ลาก Elevator → legend "Cafeteria Lunch Specials" → บล็อกเปลี่ยนเป็น indigo ทันที + list view โชว์เพลย์ลิสต์ใหม่ — **คืนข้อมูล dev แล้ว** (Elevator = Executive Elevator Reel / Portrait Elevator Kiosk / 06:00–22:00)
- **เส้นเวลาสดจริง:** 11:44 → 229.333px → 11:45 → 230px (ขยับเอง +0.667px/นาที ไม่ต้อง reload) — ยังไม่ sync prod

---

## [0.4.18] — 2026-08-16  🤖 โดย Freebuff (Live Screen Preview — เห็นสิ่งที่จอแสดงอยู่แบบเรียลไทม์จาก Admin ✅)

### Added
- **Live Screen Preview (REQ-012)** — Admin ดูได้ว่าจอแต่ละตัวกำลังแสดงอะไรอยู่แบบเรียลไทม์ผ่าน WS โดยไม่ต้องไปหน้างาน:
  - **player (`DisplayKiosk.tsx`)**: ส่ง `SCREEN_STATE` ผ่าน WS เดิม (display token) — โครงสร้าง (layout/effectivePlaylistId/contentSource/priorityLevel) + สื่อที่กำลังเล่นทุกโซน (title/type/url/thumbnail/duration/startedAt) — ส่งตอนเชื่อม WS, สื่อเปลี่ยน, และทุก 30 วิ
  - **server.ts**: รับ `SCREEN_STATE` (**เฉพาะ display token ที่ screenId ตรงกัน** — anonymous/สวมรอยถูกบล็อก) → เก็บ `screenStates` ใน memory + broadcast `SCREEN_STATE_UPDATED` → monitor flip offline/online ซิงก์สถานะ `online`/`offlineSince` + `GET /api/monitoring/live` (catch-up ตอนโหลดหน้า, ต้องมี permission `read:analytics`)
  - **Admin**: ปุ่ม **“ดูภาพสด”** บนการ์ดจอ (Screens Manager) → modal แสดง mini replica ของ layout (โซนตาม % ตำแหน่งจริง) พร้อมสื่อในแต่ละโซน (ภาพ/วิดีโอ thumb/ticker/clock/weather/announcement/promo/... ผ่าน media-proxy) + chips แหล่งเนื้อหา/ระดับความสำคัญ/เพลย์ลิสต์/เลย์เอาต์ + รายการโซน (ชื่อ/สื่อ/ระยะเวลา/เวลาเริ่ม) — อัปเดตเรียลไทม์ผ่าน WS (ไม่ต้อง reload) + badge **LIVE** บนการ์ดเมื่อมี state สด (< 90 วิ)
  - i18n ครบ 3 ภาษา (`sm.live*`)

### Verified
- typecheck 0 · build ผ่าน · integration **18/18** (เทส #16 ใหม่: SCREEN_STATE → broadcast ครบ payload · live endpoint 200/401 · anonymous ส่งถูกบล็อก · สวมรอย screenId อื่นถูกบล็อก)
- **ยืนยันใน preview**: เปิด kiosk จริง (display URL) → การ์ด Main Lobby ขึ้น badge LIVE + heartbeat “เมื่อสักครู่” · modal แสดง mini replica 3 โซนพร้อมเนื้อหาจริง (video/weather/ticker) + chips ไทยครบ — screenshot ยืนยัน
- ✅ **deploy prod แล้ว (2026-08-16)** — sync 15 ไฟล์ hash ตรง → `redeploy.bat` → bundle ใหม่ `index-BE47npt5.js` (marker “ดูภาพสด/实时预览/Live Preview” ใน bundle) — post-deploy: emergency **15/15** + quickpost **10/10** + `GET /api/monitoring/live` **200** (401 ไม่มี token) — ไม่มี migration ใหม่

---

## [0.4.19] — 2026-08-16  🤖 โดย Freebuff (UI ตารางเวลาแบบ Google Calendar — ปฏิทินรายสัปดาห์ลากได้ ✅)

### Added / Changed
- **เปลี่ยน view ไทม์ไลน์ → ปฏิทินรายสัปดาห์ (Week Calendar)** ใน SchedulerEngine — สไตล์ Google Calendar:
  - กริด **7 วัน (อา–ส) × แกนเวลา 06:00–24:00** — คอลัมน์ละ 40px/ชม. + เส้นชั่วโมง/ครึ่งชั่วโมง + เส้นแดงแสดงเวลาปัจจุบันในคอลัมน์วันนี้
  - อีเวนต์ = บล็อกสีตาม **6-Level Priority** + วาง **side-by-side เมื่อชนกัน** (interval graph coloring) + ring สีเหลืองเมื่อขัดแย้ง + inactive ซีด
  - **ลากย้าย** — กัน offset จุดกด (grabOffset): ลากแนวตั้งเปลี่ยนเวลา (snap 15 นาที, คงระยะเวลา) · ลากแนวนอนย้ายวัน (เอาวันต้นออก + เพิ่มวันเป้าหมาย เหมือน Google Calendar ย้าย instance) — คลิกเฉยๆ = เปิดแก้ไข
  - **ลากขอบบน/ล่าง = ขยาย/ย่อเวลา** (snap 15 นาที)
  - **ลากบนช่องว่าง = สร้างใหม่** — ghost สีฟ้า + เปิดฟอร์มแบบ prefilled (วัน/เวลาตามที่ลาก)
  - ตัวนับจำนวนอีเวนต์ต่อวันใน header + legend 6 ระดับ + hint
- i18n 3 ภาษา: `sch.viewCalendar` (ปฏิทิน/日历) · `sch.weekCalendar` · `sch.dragHint` · `sch.noRules` — เก็บคีย์ `sch.viewTimeline` ไว้ (ไม่ใช้แล้ว)
- list view เดิมคงเดิม (มุมมอง รายการ/ปฏิทิน สลับได้)

### Verified
- typecheck 0 · build ผ่าน · integration **18/18**
- **ยืนยันใน preview (ลากจริงผ่าน synthetic pointer events):** ลาก Dining Hall 11:00→15:00 (คงระยะเวลา 9 ชม.) ✓ · ลากขอบล่าง Lobby 19:00→21:00 ✓ · ลาก Elevator ข้ามวัน จ→อ (7 วัน→6, **เวลาไม่เพี้ยน** 06:00–22:00 — แก้บั๊ก grabOffset ที่เจอระหว่างเทส) ✓ · ลากบนช่องว่าง → ฟอร์ม prefilled 21:00–22:00 ✓ — คืนค่าข้อมูลเทสครบ — screenshot ยืนยัน

---

## [0.4.17] — 2026-08-16  🤖 โดย Freebuff (แจก WEBHOOK_TOKEN — ระบบภายนอกเรียก /api/trigger ต้องส่ง X-Webhook-Token ✅)

### Changed / Done
- **WEBHOOK_TOKEN ตั้งแล้วทั้ง prod + dev .env** (ค่าเดียวกัน 64 hex — ตั้งใน prod มาก่อนแล้ว) — `/api/trigger`, `/api/trigger/by-tags`, `/api/integrations/slack` ต้องส่ง header `X-Webhook-Token` (ไม่ส่ง/ผิด → 401 · ถูก → 200 · ไม่ตั้งใน prod → 503 ปิด)
- `tests/helpers.mjs` — `raw()` รองรับ `headers` option เพิ่ม
- **เทสใหม่ #15** — Webhook Trigger: ไม่มี token 401 / token ผิด 401 / token ถูก + refresh 200 (targetScreens) / body ไม่ครบ 400 / by-tags 200 — **17/17 ผ่าน** (เดิม 16 + ใหม่ 1)
- เอกสาร: `docs/deploy-security-guide.md` — เพิ่ม section “Webhook Token (X-Webhook-Token)” — ค่าอยู่ใน `.env` prod (ไม่เก็บใน repo), ตัวอย่าง curl ครบ (refresh/show_message/by-tags/slack), วิธีหมุนเวียน token

### Verified
- dev: no-token 401 · wrong 401 · good 200 (refresh → 12 จอ) · by-tags 200 (2 จอ) · slack 200 — typecheck 0 + integration **17/17**
- **prod (ตรวจจริง):** no-token **401** · token ถูก **200** (`success:true, targetScreens:5`)

---

## [0.4.16] — 2026-08-16  🤖 โดย Freebuff (i18n ฝั่ง server สำหรับ event log — Realtime Control แสดงภาษาตาม UI ✅)

### Added
- **Server-side i18n สำหรับ telemetry/event log** (หน้า Realtime Control เดิมขึ้นอังกฤษ — ตอนนี้ตามภาษา UI):
  - server.ts เขียน **`eventKey` + `params`** ลง `details` (jsonb) ทุกจุด insert telemetry — `evt.cmdExec` (command), `evt.hbOnline/Offline/Syncing/Emergency/Error/Other` (heartbeat status), `evt.pairOk` (pair), `evt.monOffline/monOnline` (monitoring) — **ไม่ต้อง migration** (ใช้คอลัมน์ `details` ที่มีอยู่)
  - `GET /api/analytics/telemetry` รับภาษา client ผ่าน **`?lang=` หรือ `Accept-Language` header** → server แปล `message` ด้วย dictionary เดียวกับ client (`src/i18n/translations/*` — import จาก server.ts ได้โดยตรง) — row เก่าที่ไม่มี eventKey → fallback เป็น message เดิม
  - `src/i18n/telemetry.ts` — helper แชร์ server+client (heartbeat status → key)
  - client: `api.getTelemetry(limit, lang)` ส่งภาษาปัจจุบัน + store แมป `eventKey/messageParams` + optimistic log ใช้ `evt.cmdExec` — RealtimeControlConsole render ผ่าน `t(eventKey, params)` → **สลับภาษาทันทีโดยไม่ต้อง reload** (row เก่า fallback message)
  - แปลปุ่ม "Set" → `rt.set` (ตั้งค่า/应用)

### Verified
- API: `?lang=th` → "สถานะ: ออฟไลน์ / ดำเนินการ: SET_VOLUME…" · `?lang=zh` → "状态: 离线 / 已执行…" · ไม่ส่ง lang → EN · Accept-Language header ใช้ได้ · row เก่า fallback
- Preview: Realtime Control เป็นไทย (สถานะ: ออนไลน์/ออฟไลน์, ดำเนินการ: SET_VOLUME) → สลับ中文 re-render ทันที (状态: 在线/离线, 已执行) — screenshot ยืนยัน
- typecheck 0 + build ผ่าน + integration **16/16 ผ่าน**

### Deployed (prod) — 2026-08-16 ✅
- sync 10 ไฟล์ (server.ts + src/i18n + client) → `redeploy.bat` → bundle ใหม่ `index-BdVozIW3.js` (มีคีย์ evt.*)
- ตรวจ post-deploy: emergency **15/15** (verify-prod-emergency.mjs) + quick post เจาะจงจอ **10/10** (verify-prod-quickpost.mjs) + event log server-side i18n ทำงานบน prod (`?lang=th` → สถานะ: ออฟไลน์/ดำเนินการ: SET_VOLUME… · `?lang=zh` → 状态: 离线/已执行…) — ไม่มี migration ใหม่

---

## [0.4.15] — 2026-08-16  🤖 โดย Freebuff (แปลทุกหน้าของระบบครบ 3 ภาษา — EN/ไทย/中文 ✅)

### Added
- **แปล UI ครบทุกหน้า admin/player เป็นไทย + จีน (English ยังเป็นแกนหลัก):**
  - **ScreensManager (เมทริกซ์จอแสดงผล)** — status badge (ออนไลน์/ออฟไลน์/กำลังซิงก์/กำลังประกาศฉุกเฉิน/ข้อผิดพลาด), heartbeat (❤️ เมื่อสักครู่/ไม่มีสัญญาณ), ปุ่ม/โมดัล/ตัวกรองทั้งหมด
  - **SmartLayoutBuilder (สตูดิโอเลย์เอาต์อัจฉริยะ)** — widget catalog + หมวดหมู่, zone inspector (Position & Size/X/Y/Width/Height/Z-Index/BG Color/Duplicate/Delete), All Zones, โซนว่าง, เลเยอร์, ปุ่มทั้งหมด
  - **MediaLibrary + MediaUploadModal** — ปุ่ม/แท็บ/โมดัล/ตัวเลือก (รวม AI modal + option labels)
  - **PlaylistEditor** — ทุก label/ปุ่ม/สถานะ + แก้ชื่อตัวแปร `t` ที่ชนกับ translation hook ใน `map(t => ...)`
  - **SchedulerEngine (ตารางเวลาออกอากาศ)** — priority cards (ฉุกเฉิน/วิกฤต/กำหนดการ/แคมเปญ/ค่าเริ่มต้น/สแตนด์บาย) + คำอธิบาย + วันย่อ (อา จ อ พ พฤ ศ ส) + ไฮน์ 6 ระดับ + วันที่ในโมดัล
  - **CampaignManager, RealtimeControlConsole, AnalyticsTelemetry** (summary cards, Admin Audit Trail, resource filter, severity/status badges), **BackupManager, AISettings, BrandingSettings, SlideshowStudio** (theme presets ทั้ง 8 ธีม + คำอธิบาย + tab หมวด), **DualSimulator, PlayerApp chrome** (buffer/cloud sync/exit player)
  - แปลคีย์ที่ตกหล่นอีกชุด (lb.zIndex, ai.baseUrl, ml.optQr, ss.fontThai, ss.transitionKenBurns ฯลฯ)

### Notes
- ข้อความ event log (Realtime Control) มาจาก **server (server.ts)** — ยังเป็นภาษาเดิม ต้องทำ server-side i18n แยก
- เนื้อหาจาก DB (ชื่อจอ/เพลย์ลิสต์/ชื่อ media/ธีมที่ผู้ใช้สร้าง) เป็นข้อมูล ไม่ใช่ UI — ไม่แปล

### Verified (dev preview, ภาษาไทย)
- ไล่ทุกหน้า: กระดานจอ (badge ออฟไลน์/ออนไลน์ + เมื่อสักครู่ ไทยครบ), Layout Studio (ตัวตรวจสอบโซน/Z-Index), คลังสื่อ, เพลย์ลิสต์, ตารางเวลา (วัน อา–ส + ฉุกเฉิน/วิกฤต), แคมเปญ, ควบคุมแบบเรียลไทม์, วิเคราะห์ (ตรวจสอบแล้ว 100%), สไลด์โชว์ (ธีมไทย), สำรองข้อมูล, ตั้งค่า AI, จำลองสองจอ + TV Player
- typecheck 0 error + build ผ่าน + integration **16/16 ผ่าน**

### Deployed (prod) — 2026-08-16 ✅
- sync 32 ไฟล์ (0.4.14/0.4.15 ขึ้น `C:\signage` — hash ตรง) → `redeploy.bat` → **bundle ใหม่ขึ้นจริง**: `index-D6m3OtjN.js` (765KB — ใหญ่กว่าตัวเก่า `index-tH9gqdAn.js` 666KB) + มี marker i18n (`signage_language`, `คอนโซลผู้ดูแล`, `ออนไลน์`, `紧急`) → **ต้นตอ build เก่าปิดแล้วสำหรับรอบนี้**
- ตรวจ post-deploy: emergency เจาะจงจอ **15/15** (`verify-prod-emergency.mjs` — trigger/WS broadcast/payload targetScreenIds/display data เฉพาะจอเป้าหมาย/clear/audit) + quick post เจาะจงจอ **10/10** (`verify-prod-quickpost.mjs` ใหม่ — WS ได้รับ QUICK_POST payload ครบ + audit) — ล้างข้อมูลเทสเรียบร้อย

---

## [0.4.14] — 2026-08-16  🤖 โดย Freebuff (i18n หลายภาษา — EN core + ไทย + 中文 + ขยายได้ ✅)

### Added
- **ระบบ i18n แบบ lightweight (zero dependency)** — `src/i18n/` + `useLanguageStore` + `useTranslation` hook:
  - **ภาษาอังกฤษ (en) = แกนหลัก** — แหล่งที่มาของทุก translation key + fallback อัตโนมัติ
  - ไทย (`th`) + จีน (`zh`) ครบทุกคีย์ — typed เป็น `Messages` → **compiler บังคับคีย์ครบ/ตรง** ทุกภาษา
  - **เพิ่มภาษาใหม่แค่ 4 ขั้นตอน** (types.ts → translations/<code>.ts → index.ts) — switcher อ่านจาก `SUPPORTED_LANGUAGES` อัตโนมัติ — คู่มือใน `src/i18n/README.md`
  - `translate(lang, key, {vars})` — interpolation `{var}` + fallback en → key (ไม่เคย crash)
  - `LanguageSwitcher` (dropdown) ใน **Navbar + LoginPage** (เลือกได้ก่อน login) + จำ browser locale (th/zh) + persist `signage_language` + อัปเดต `<html lang>`
- **แปลแล้ว:** Navbar (ทุก label/tooltip), LoginPage (ทั้งหน้า), App shell (loading/error/footer), EmergencyBanner + EmergencyModal (labels/presets/severity + re-sync ข้อความเมื่อเปลี่ยนภาษา), PlayerApp + DisplayKiosk (overlay ฉุกเฉิน)

### Fixed
- **🐛 เทส fail หลังเที่ยงคืน (timezone bug ในเทส)** — `todayDate()` ใช้ `toISOString()` (UTC) แต่ server ใช้ local date → ช่วง 00:00–07:00 ตามเวลาไทย (UTC ยังเป็นวันเก่า) schedule "วันนี้" ถูกมองว่าเกิน endDate → เทส 4/5/6/11/12 fail — แก้เป็น local date (`getFullYear/getMonth/getDate` ตรงกับ `localDateStr` ของ server) — **16/16 ผ่าน** (ตอน 01:xx local)

### Verified (dev preview)
- สลับ EN → ไทย → 中文 เห็นผลจริง: navbar (คอนโซลผู้ดูแล/管理控制台), footer, emergency button, `<html lang>` (th-TH/zh-CN), localStorage persist
- Emergency Modal 中文 (触发实时紧急广播/选择预设警报模板/火灾疏散...), player overlay 中文 (紧急强制广播) ผ่าน WS จริง + เคลียร์ได้
- typecheck 0 error + build ผ่าน + integration 16/16

---

## [0.4.13] — 2026-08-16  🤖 โดย Freebuff (Regression รอบสุดท้าย — 5 เทสทั้งหมดของวันนี้ผ่านครบ ✅)

### Verified (dev preview — เทสซ้ำทุกวงจรที่ทำวันนี้ หลังแก้โค้ดครบ 0.4.11/0.4.12)

| # | เทส | ผล | หลักฐาน |
|---|---|---|---|
| 1 | **Dual Simulator** — Admin Console (ซ้าย) + TV Player (ขวา) คู่กัน | ✅ | Matrix 6 จอ + player LOBBY-88 เล่นวิดีโอ/weather "Buffer Cache: 100% Synced" |
| 2 | **Quick Post realtime** — POST /api/quick-post → WS broadcast | ✅ | admin banner ฟ้า + TV Player overlay ขึ้นทันที (DOM: 2 จุด — sticky top + absolute ใน player) |
| 3 | **Emergency Alert ครบวงจร** — Realtime Control → trigger → clear | ✅ | overlay แดงเต็ม canvas 738x640 (bg-rose-950/95 + pulse) + ทุกจอสถานะ EMERGENCY + navbar "EMERGENCY ACTIVE" → clear แล้วหายหมด (0 overlay, 0 จอ EMERGENCY) |
| 4 | **Emergency เจาะจงจอ** (target scr-002) | ✅ | player scr-001 **ไม่แดง** / สลับ scr-002 **แดงเต็มจอ** / kiosk `/display/scr-002` **แดงเต็มจอ** (catch-up จาก display data) → clear หายทั้ง kiosk ผ่าน WS |
| 5 | **Quick Post เจาะจงจอ** (target scr-002) | ✅ | player scr-001 **ไม่ขึ้น** (มีแค่ admin banner) / สลับ scr-002 **ขึ้น** (banner เหลือง warning 756px) + admin banner ซิงก์ |

- WS จริงเชื่อม (server log `[WS] Connected (super_admin) Total: 7`) — navbar "WS Offline" เป็น indicator ของอีก channel ไม่กระทบการทำงาน
- ไม่มีการแก้โค้ดรอบนี้ — เทสซ้ำเพื่อยืนยันความถูกต้องของงาน 0.4.11/0.4.12 (WS global + filter targetScreenIds) ทั้งหมด

---

## [0.4.12] — 2026-08-15  🤖 แก้ไขโดย Freebuff (Quick Post เจาะจงจอ + WS global ทุกแท็บ ✅)

### Fixed
- **🐛 PlayerApp Quick Post เดิมไม่ filter target** — `QUICK_POST` handler ตั้ง overlay โดยไม่เช็ค `targetScreenIds` (บั๊กเดียวกับ emergency รอบก่อน) → แก้เป็นขึ้นเฉพาะจอเป้าหมาย (DisplayKiosk filter ถูกอยู่แล้ว)

### Added
- **WS handler ระดับแอป (`App.tsx`)** — เชื่อม WS ครั้งเดียวตอน authenticated → รับ `EMERGENCY_TRIGGERED`/`EMERGENCY_CLEARED`/`QUICK_POST` → อัปเดต store → **admin ทุกแท็บ** เห็น banner emergency + banner Quick Post (สีตาม style, ปิดได้ + auto-hide ตาม duration) — ไม่ต้อง mount เฉพาะ Player แล้ว
- **Store:** `quickPost` state + `receiveQuickPost(post)` (auto-hide timer, post ใหม่แทนที่ post เก่า) — PlayerApp อ่านจาก store + filter ตามจอที่แสดง; refactor emergency handler ออกจาก PlayerApp (ใช้ global แทน)
- **Integration test #14** — Quick Post: POST → WS broadcast `QUICK_POST` (payload message/style/targetScreenIds/duration ครบ) + anonymous relay ปลอมถูกบล็อก + audit `quick_post` → **16/16 ผ่าน**

### Verified (dev preview)
- POST /api/quick-post เจาะจง scr-002 → player scr-001 **ไม่ขึ้น** / scr-002 **ขึ้น** (banner เหลือง warning) + admin banner ซิงก์ผ่าน global WS ✅

### Pending — deploy prod (อัปเดต 2026-08-16)
- ✅ **sync สำเร็จ** — SMB ตรงไป 10.70.0.1 ถูก NAT ตัด (error 67) → user map drive `Z:` → `sync-to-prod.ps1` รองรับ `Z:\`/`SYNC_PROD_PATH` แล้ว → hash ตรง **5/5** (`verify-prod-hash.ps1`) — โค้ด 0.4.7–0.4.12 อยู่บน `C:\signage` จริง
- ⚠️ **build ยังไม่ได้โค้ดใหม่** — รอบ build 00:05 ได้ bundle เก่า `index-tH9gqdAn.js` (666KB, ไม่มี marker 0.4.11/0.4.12) ทั้งที่ source บน prod hash ตรง 100% (mtime 23:31 < build 00:05) — สงสัย build context ไม่ใช่ C:\signage หรือมี container ชุดซ้อนแย่ง port 3100 — ต้องรันบน prod: `docker compose build --no-cache --progress plain signage-app` (ดู `dist/assets/*.js` ควรเป็น `index-BM3zy3Kd.js` ~1.35MB) + `docker ps` / `docker compose ls`
- หลัง deploy สำเร็จ ตรวจด้วย: `node .freebuff/verify-prod-emergency.mjs` (emergency เจาะจงจอ ครบวงจร) + `resolve scr-002` คืน `playlistId/layoutId` + Quick Post เจาะจงจอบน prod

---

## [0.4.11] — 2026-08-15  🤖 แก้ไขโดย Freebuff (Emergency เจาะจงจอ — overlay เฉพาะเป้าหมาย ✅)

### Fixed
- **🐛 PlayerApp overlay เดิมขึ้นทุกจอ** — `activeEmergency` หา alert แรกที่ active โดยไม่เช็ค `targetScreenIds` → trigger เฉพาะ scr-002 แต่ player จออื่นก็แดงด้วย — แก้เป็น filter ตามจอที่แสดง (target ว่าง = ทุกจอ)
- **🐛 Web app ไม่รับ emergency ผ่าน WS เลย** — web frontend ไม่มี handler `EMERGENCY_TRIGGERED`/`EMERGENCY_CLEARED` (มีแต่ Android player) → จอ web ไม่เห็น alert จริงเวลา admin คนอื่น trigger — เพิ่ม handler ใน PlayerApp + DisplayKiosk (ผ่าน store action ใหม่ `receiveEmergencyTrigger`/`receiveEmergencyClear` — state-only ไม่ POST ซ้ำ)
- **🐛 DisplayKiosk ไม่มี emergency overlay เลย** — จอจริง (/display/:id) ไม่แสดง alert — เพิ่ม overlay แดงเต็มจอ + catch-up จาก display data (server คืน `emergency` เฉพาะจอเป้าหมาย → จอที่เปิดค้าง/เพิ่ง reconnect ขึ้นทันที)
- **Server:** `GET /api/display/:screenId/data` เพิ่มคอลัมน์ `emergency` (active alert ของจอนั้น หรือ null)

### Verified (dev preview — ผ่าน 4 จุด)
- trigger เฉพาะ scr-002 → player ที่ scr-001 **ไม่ขึ้น** overlay, สลับมา scr-002 **ขึ้นทันที** (ผ่าน WS propagation — trigger จากหน้าเพจ ไม่ใช่ผ่าน modal)
- clear → overlay หายทั้ง 2 จอ + banner admin หาย
- kiosk `/display/scr-002` ขึ้น overlay จาก display data + เคลียร์ได้
- **integration 15/15 ผ่าน** — เทส 13 ขยาย: display data ของจอเป้าหมายมี `emergency`, จออื่นไม่มี + หลัง clear เป็น null

---

## [0.4.10] — 2026-08-15  🤖 แก้ไขโดย Freebuff (integration test วงจร Emergency ✅)

### Added
- **`tests/integration.test.mjs` #13 — Emergency วงจรเต็ม:** REST trigger/clear → WS broadcast → สถานะจอ emergency → กลับ online
  - เปิด WS client จริง 2 ตัว (admin + anonymous/player) → trigger `/api/emergency/trigger` → admin ได้รับ `EMERGENCY_TRIGGERED` พร้อม payload ครบ (title/message/severity/targetScreenIds — สิ่งที่ PlayerApp ใช้ทำ overlay แดง)
  - จอเทสเป็น `emergency` + `activeEmergencyId` ชี้ alert; จออื่นไม่โดน (target เฉพาะ)
  - clear → ได้รับ `EMERGENCY_CLEARED` + จอกลับ `online` + `activeEmergencyId=null` + audit บันทึก `emergency_trigger`/`emergency_clear`
  - **Security guard:** anonymous WS ส่ง `EMERGENCY_TRIGGERED` ปลอม → hub ไม่ relay ต่อ (receive-only)
- **`tests/helpers.mjs`:** `api.emergency` (trigger/clear) + `openWs(token)`/`waitFor()` — เปิด WS client เก็บข้อความที่ได้รับ
- **ผล:** 15/15 ผ่าน (~72 วิ — หลักๆ รอ monitor ticker ในเทส 7)

---

## [0.4.9] — 2026-08-15  🤖 แก้ไขโดย Freebuff (ตรวจ Emergency Alert ผ่าน Realtime Control ✅)

### Verified (dev preview)
- **Trigger:** Realtime Control → EMERGENCY ALERT → BROADCAST INSTANT OVERRIDE (Critical, ทุกจอ) → `POST /api/emergency/trigger 200`
- **Overlay แดงบน TV Player ทันที:** `bg-rose-950/95 + border-rose-500 8px + animate-pulse` เต็ม canvas (738x640) + title/ข้อความ + banner admin "CRITICAL BROADCAST OVERRIDE" + การ์ดจอสถานะ EMERGENCY
- **Clear:** ปุ่มเปลี่ยนเป็น CLEAR EMERGENCY BROADCAST → `POST /api/emergency/clear 200` → overlay หาย + player กลับเล่น content ปกติ (welcome-demo.mp4) — ไม่มีการแก้โค้ด

---

## [0.4.8] — 2026-08-15  🤖 แก้ไขโดย Freebuff (ตรวจ Dual Simulator + Quick Post ผ่าน WS ✅)

### Verified (dev preview)
- **Dual Simulator:** Admin Console + TV Player แสดงคู่กัน (ข้อมูลจริง) — Quick Post ขึ้นจอแบบ realtime ผ่าน WS: `POST /api/quick-post` → server broadcast `QUICK_POST` → overlay แสดงบน TV Player ทันที (info banner 30 วิ) — server log ยืนยัน WS super_admin ×2 + POST 200
- ไม่มีการแก้โค้ด (ตรวจเท่านั้น) — หมายเหตุ: ปุ่ม navbar ใช้ native prompt() ต้องเทสผ่าน endpoint ตรง

---

## [0.4.7] — 2026-08-15  🤖 แก้ไขโดย Freebuff (TV Player ใช้ tag-match playlist — preview ตรงกับจอจริง)

> เดิม TV Player ใช้ `currentPlaylistId` ของจอ → จอที่ได้ content จาก tag-match ต่างกัน preview vs จอจริง — แก้ให้ player ใช้ playlist/layout ที่ server จับคู่จาก tags

### Changed
- **Server (`GET /api/schedules/resolve` + `SCHEDULE_CHANGED` broadcast):** คืน `layoutId` + `playlistId` ครบทุกรูปแบบ resolution (schedule/campaign/**tag_match**/default) — เดิมมีแค่ตอน schedule → TV Player อ่าน tag-match ไม่ได้
- **`PlayerApp.tsx` (TV Player):** เพิ่ม state `tagMatch` (จาก resolve/WS เมื่อ `source=tag_match`) → `screenPlaylistId = scheduleOverride?.playlistId || tagMatch?.playlistId || currentPlaylistId` — ใช้ playlist ของ tag-match ก่อน, ตกเหลือ currentPlaylistId เฉพาะเมื่อไม่มี match; `activeLayout` ลำดับ: schedule → campaign → **tag_match** → baseLayout (tag_match อยู่ระดับ default)

### Tests
- Integration #12 เพิ่ม assert: resolve คืน `source=tag_match` + `playlistId` + `layoutId` หลัง approve — **14/14 ผ่าน**
- เทสจริงใน preview (login admin → real data): scr-002 (currentPlaylistId=pl-lunch-menu) โชว์ content ของ **pl-cafeteria-menu** (เมนู → ticker) เพราะ tag_match ชนะ — ตรงกับจอจริง (display data ใช้ effectivePlaylistId)
- typecheck 0 error + build ผ่าน — dev server restart เพื่อรับ server.ts ใหม่

---

## [0.4.6] — 2026-08-15  🤖 แก้ไขโดย Freebuff (ตรวจ scr-002 offline + คู่มือช่างกลับออนไลน์)

### Ops
- **ตรวจ scr-002 (`Cafeteria Digital Menu Board` — ตึก B ชั้น 2):** offline **3,096 นาที (~2 วัน 4 ชม.)** — heartbeat สุดท้าย 13 ส.ค. 19:04 ไทย — IP สุดท้าย `172.19.0.1` (Docker bridge — มาจากเครื่อง server ไม่ใช่จอ) → ยืนยันจอถูกปิด/ถอดสายจริง ต้องตรวจทางกายภาพ
- **พร้อมกลับ online:** pairing `CAFE-20` ยังใช้ได้ (ไม่หมดอายุ), generate-token ใช้ได้, โหมดระบบ HTTPS → URL `https://10.70.0.1/display/scr-002?token=...` + CA ตัวปัจจุบัน/หรือ native player
- **⚠️ เนื้อหาที่ผูกว่าง:** playlist `อนุบาลวันภาษาไทย` (pl-1786423885792) = **0 items** (ล้างไปรอบ 13 ส.ค.) + จอ tags `[]` → หลังกลับ online โซน content จะว่าง — ต้องกำหนดใหม่ (เร็วสุด: ตั้ง tags จอ cafeteria+menu → tag-match; หรือ playlist ใหม่ + approve; หรือแก้ sch-002 ที่ active แค่ จ-ศ 11:00–18:00)
- **ส่งงานช่าง:** `docs/recover-scr002.md` — checklist หน้างาน (เช็คไฟ/สาย/เน็ต → เปิด URL → ติดตั้ง CA ถ้าจำเป็น) + checklist Admin (สร้าง URL ใหม่ → กำหนดเนื้อหา → ตรวจ monitoring / `watch-screen-online.bat`)
- **✅ กำหนดเนื้อหาใหม่ให้ scr-002 แล้ว (บน prod):** สร้าง `pl-cafeteria-menu` (approved, 3 items: med-004 เมนู + med-005 ticker + med-008 ประกาศ) + ตั้ง tags `cafeteria`+`menu` ให้จอ + ผูก `lay-menu-board` (ตั้ง tags คู่กัน — tag-match คืน layout+playlist พร้อมกัน) + แก้ `sch-002` (เดิมชี้ playlist ว่าง) → ตรวจ display data `tag_match` + `effectivePlaylistId=pl-cafeteria-menu` + layout lay-menu-board ผ่าน 17/17 — จออื่นไม่ถูกแย่ง content — **จอกลับมาเมื่อไหร่แสดงได้ทันที**

---

## [0.4.5] — 2026-08-15  🤖 แก้ไขโดย Freebuff (ตรวจหลัง redeploy — Content Approval + Tag-Match คู่กันบน prod ✅)

> redeploy เสร็จ (container ใหม่) → ตรวจบน prod จริงผ่าน **30/30** — migration 0011 รันแล้ว + pending ถูกกรอง + approve ขึ้นทันที + reject กรองออก + audit ครบ

### Verified (บน prod — 10.70.0.1:3100)
- **Migration 0011 รันแล้ว:** `playlists` (5 รายการ) + `layouts` มีคอลัมน์ `status` + `approval_status` — เพลย์ลิสต์เดิมทั้งหมดถูกตั้งเป็น `approved` (migration UPDATE ทำงาน) — หลักฐาน: `GET /playlists` / `GET /layouts` คืน field ครบ (ถ้า column ไม่มี → API error)
- **Pending ถูกกรอง:** สร้าง playlist+layout ใหม่ (ส่ง `approvalStatus: approved` ใน body) → โดนบังคับเป็น `pending` เสมอ (POST บังคับ, กัน client ส่ง approved เอง) → ไม่ขึ้นจอ: ไม่อยู่ใน `playlists` payload, `effectivePlaylistId=null`, layout ไม่ถูกส่ง
- **Approve แล้วขึ้นทันที:** `PATCH /api/playlists/:id/approve` + `/api/layouts/:id/approve` → `approved` → display data มี playlist ใหม่ + tag_match คืน `effectivePlaylistId` + layout ใหม่ **คู่กัน** (`contentSource: tag_match`)
- **Reject → กรองออกอีกครั้ง** (พิสูจน์ filter ทำงานทั้ง 2 ทาง) — `approval_rejected` ถูกบันทึก audit
- **Audit:** `approval_approved` (playlist+layout) + `approval_rejected` ปรากฏใน `/api/audit-logs`
- **Sanity:** จอจริง scr-001 ยังได้ content ปกติ (default / lay-split-3zone) — ไม่ regression
- ล้างข้อมูลเทสเรียบร้อย (screen/playlist/layout `[VERIFY]` ลบแล้ว ยืนยัน 404)

---

## [0.4.3] — 2026-08-15  🤖 แก้ไขโดย Freebuff (Tag-Based Auto-Match + Ops: ล้าง prod)

> จอ/เพลย์ลิสต์/layout จับคู่ด้วย tags อัตโนมัติ — จอใหม่ตั้ง tag → ได้เนื้อหาทันที (scale 1000+ จอ)

### Added
- **Tag-Based Auto-Match:**
  - `layouts` เพิ่ม column `tags` (migration `0010`) — ตอนนี้ screens/playlists/schedules/slideshows/layouts มี tags ครบทุก entity
  - **Server (`resolveScreenContent`):** จอที่ไม่มี schedule → จับคู่ playlist + layout จาก tags ตรงกัน (case-insensitive) → `contentSource: tag_match` — จอใหม่ตั้ง tag ได้เนื้อหาทันที ไม่ต้องสร้าง schedule
  - **Push updates:** key ของ tag-match ต่างจาก default → broadcast `SCHEDULE_CHANGED` เมื่อ tags เปลี่ยน (จอเปลี่ยนเนื้อหาเรียลไทม์)
  - **UI:** ScreensManager Configure — field 🎯 Tags + แสดง "⚡ Auto-match: จะใช้เพลย์ลิสต์ X" + ลำดับ priority; PlaylistEditor — tags input ใน info bar; SmartLayoutBuilder — tags ต่อ layout
  - Seed: tags ตัวอย่างครบ (screens/layouts) + ตัวอย่างจริงใน dev DB
- **Ops — ล้าง prod:**
  - ตรวจ `scr-002` — offline ตั้งแต่ 13 ส.ค. (หลังส่ง REBOOT), IP เป็น docker bridge → จอถูกปิด/ถอดจริง — รอตรวจทางกายภาพ
  - ตรวจ media บน prod: **66 rows ชี้ไฟล์ที่หายจากดิสก์ (0/14 ตรง)** — ลบ rows + playlist_items (เพลย์ลิสต์ `อนุบาลวันภาษาไทย` ใช้กับ scr-002 ที่ offline — ไม่กระทบจอที่รัน) — backup ไว้ก่อนล้าง

### Tests
- Integration test #11: จอที่มี tags → `tag_match` ได้ playlist ตรง tags; จอไม่มี tags → ไม่ match — **13/13 ผ่าน**

---

## [0.4.4] — 2026-08-15  🤖 แก้ไขโดย Freebuff (Content Approval Workflow + Tag-Match คู่กัน + Watch script)

> เพลย์ลิสต์/layout ต้องผ่าน approval ก่อนขึ้นจอ + tag-match จับคู่ layout+playlist คู่กัน + สคริปต์เฝ้าดูจอ offline

### Added
- **Content Approval Workflow:**
  - `playlists` เพิ่ม `status` + `approval_status` (migration `0011` — เพลย์ลิสต์เดิมถือว่า approved ไปก่อน) — layout มีอยู่แล้ว
  - **Server:** content ขึ้นจอได้ต่อเมื่อ `status=published` + `approvalStatus=approved` — กรองใน `/api/display/:id/data` (playlists/layout), `resolveScreenContent` (schedule ที่อ้าง content ยังไม่ approved → ข้ามไป priority ถัดไป) + `findTagMatchedContent`
  - **สร้างใหม่ = pending เสมอ** — POST `/api/layouts` + `/api/playlists` บังคับ `approvalStatus: 'pending'` (กัน client ส่ง approved เอง)
  - **`PATCH /api/playlists/:id/approve`** (mirror ของ layout — admin only, audit log + broadcast) + `layoutApi.approve`/`playlistApi.approve`
  - **UI:** badge สถานะ (✓ Approved / ⏳ Pending Approval / ✕ Rejected) + ปุ่ม Approve/Reject ใน PlaylistEditor + SmartLayoutBuilder
- **Tag-Match จับคู่คู่กัน:** `findTagMatchedContent` หา best layout + best playlist **แยกกันแล้วคืนคู่** (เดิม layout ชนะแล้วตัด playlist) — จอได้ layout (โซน) + playlist (content) พร้อมกัน + tie-break ด้วย updatedAt
- **`scripts/watch-screen-online.mjs` + `watch-screen-online.bat`:** เฝ้าดูจอ (default scr-002) — poll `/api/monitoring/status` ทุก N วิ → แจ้งเมื่อจอกลับมา online (console + `logs/screen-watch.log` + webhook ตัวเลือก) — `--once` ตรวจครั้งเดียว, token หมดอายุ login ใหม่เอง

### Verified
- typecheck 0 error, build ผ่าน, integration **14/14** (เพิ่ม #12: content pending ต้องไม่ขึ้นจอ → approve แล้วขึ้นทันที) + preview: badge/pending + Approve เปลี่ยนสถานะจริง — ต้อง redeploy ถึงขึ้น prod

---

## [0.4.2] — 2026-08-15  🤖 แก้ไขโดย Freebuff

> 🔐 ยกเลิกรหัส default — admin password ต้องตั้งเอง + มีระบบเปลี่ยนรหัส

### Security
- **ลบ default password** — `Admin@2026!`/`Staff@2026!`/`Viewer@2026!` ถอนออกจาก seed.ts + docs ทั้งหมด — seed ใหม่ใช้ env (`ADMIN_INITIAL_PASSWORD` ฯลฯ) หรือสุ่มอัตโนมัติ
- **`POST /api/auth/change-password`** (ใหม่) — เปลี่ยนรหัสตัวเอง: ต้องรหัสเดิมถูก + กันรหัส default + revoke refresh token ทุกเครื่อง (บังคับล็อกอินใหม่)
- **`change-admin-password.bat` + `scripts/change-password.mjs`** — รีเซ็ตรหัสเมื่อ login ไม่ได้ (ใช้ได้ dev/prod ผ่าน DB ตรง) — กัน default + บังคับความแข็งแรง
- **`docs/change-admin-password.md`** — คู่มือ 3 วิธี (API / สคริปต์ / seed env)
- **Tests:** helpers อ่าน `TEST_ADMIN_PASSWORD` จาก env (ไม่ hardcode) — 12/12 ผ่าน
- ✅ **เปลี่ยนรหัส admin จริงแล้ว** บน prod + dev (รหัสใหม่แจกเจ้าของระบบโดยตรง ไม่เก็บใน repo)

---

## [0.4.1] — 2026-08-15  🤖 แก้ไขโดย Freebuff

> Media Expiration + Embargo + Fallback Image (กฎทอง No Black Screen) — จอไม่โชว์สื่อหมดอายุ/ก่อนวันเปิดตัว และไม่มีจอดำเมื่อสื่อโหลดไม่ได้

### Added
- **Media Expiration + Embargo (Release Date):**
  - `media_items` เพิ่ม `release_date` (embargo — ยังไม่โชว์ก่อนวันเปิดตัว) + `fallback_image_url` (migration `0009`)
  - **Server:** `isMediaPlayable()` — `/api/display/:id/data` กรอง media ที่หมดอายุแล้ว (`expiresAt < now`) หรือยังไม่ถึงวันเปิดตัว (`releaseDate > now`) — จอไม่ได้รับสื่อที่ใช้ไม่ได้ตั้งแต่ต้น
  - **Player/Kiosk:** filter ชั้น client ด้วย (PlayerApp + DisplayKiosk) — กันข้อมูลเก่าจาก cache
  - **MediaLibrary UI:** field Release Date — Embargo + Fallback Image URL + badge สถานะ (🔒 Embargo / ⛔ Expired / ⏰ วันหมดอายุ)
- **Fallback Image (No Black Screen):**
  - **KioskMediaRenderer + MediaRenderer:** media error (โหลดไม่ได้/ไฟล์หาย) → แสดง `fallbackImageUrl` (fallback → thumbnail) แทนจอดำ
  - ตัวอย่าง seed: med-009 (expired), med-010 (embargo), med-011 (fallback image)

### Fixed
- **Bug hooks:** KioskMediaRenderer early return (fallback) อยู่ก่อน `React.useEffect` → "Rendered fewer hooks than expected" crash — ย้าย hooks ขึ้นก่อน early return (กฎ React hooks)
- **POST /api/media:** `expiresAt`/`releaseDate` รับ ISO string → แปลงเป็น Date ก่อน insert (drizzle ต้องการ Date)

### Tests
- Integration test #10: สร้าง media 3 ตัว (ปกติ/หมดอายุ/embargo) → จอเห็นเฉพาะตัวปกติ — **12/12 ผ่าน**

---

## [0.2.0] — 2026-08-12  🤖 แก้ไขโดย Freebuff

> รอบนี้เป็นการเตรียมความพร้อม production: แก้ช่องโหว่ความปลอดภัยวิกฤต + เคลียร์ type errors 49 จุด
> + deploy ขึ้นเครื่องจริง (10.70.0.1) ผ่าน Docker และยืนยันผลด้วย live tests

### Security
- **JWT_SECRET fail-fast** — ในโหมด production ถ้าไม่ตั้งหรือใช้ค่า default `CHANGE_THIS_IN_PRODUCTION_64_CHARS_MIN` server จะไม่ start (บังคับโดยดีไซน์) — `src/middleware/auth.ts`, `server.ts`
- **Webhook endpoints ต้องมี token** — `/api/trigger`, `/api/trigger/by-tags`, `/api/integrations/slack` ต้องส่ง `X-Webhook-Token` หรือ JWT — ถ้าไม่ตั้ง `WEBHOOK_TOKEN` ใน prod จะได้ 503
- **WebSocket relay กันปลอม** — anonymous connections (player/kiosk) รับอย่างเดียว ส่งข้อความปลอม EMERGENCY_TRIGGERED/QUICK_POST/SCREEN_COMMAND ไม่ได้อีก — `server.ts`
- **SSRF guard** — `/api/media-proxy` + `/api/widgets/rss` บล็อก private/internal IP ทั้งหมด (10.x, 172.16-31, 192.168, 169.254/cloud metadata, localhost, CGNAT) — `server.ts`
- **Interact endpoints** — viewer ที่ไม่ login เปลี่ยน layout/playlist ไม่ได้ (เหลือแค่ show_message) + rate limit 10/นาที — `server.ts`, `src/middleware/rateLimiter.ts`
- **docker-compose.yml ส่ง secrets เข้า container** — เพิ่ม `JWT_SECRET` (บังคับผ่าน `${JWT_SECRET:?...}`), `WEBHOOK_TOKEN`, `APP_URL` จาก `.env` (เดิม container ไม่เคยได้รับ secret เพราะ `.env` ถูกตัดออกจาก image → ระบบเคยรันด้วย default secret มาตลอด)
- **Prod .env** — ตั้ง JWT_SECRET ใหม่ 64 hex (backup เก่าที่ `.env.backup-20260812-181817`), เพิ่ม WEBHOOK_TOKEN 64 hex, NODE_ENV=production, ลบ UTF-8 BOM

### Fixed
- **Type errors 49 → 0** (`npx tsc --noEmit` ผ่าน 100%):
  - Zod v4 API — `z.record(z.unknown())` → `z.record(z.string(), z.unknown())` (Zod 3 → 4.4.3) — `src/middleware/validate.ts`
  - ขยาย types ให้ตรงกับ UI จริง: `MediaItem.contentData` (countdown/qrcode/promo/kpi/worldclock), `SlideData` (headlineFontSize/bodyFontSize), `RealtimeCommand` (UNPAIR_DEVICE/FORCE_DISPLAY) — `src/types/signage.ts`
  - ซิงค์ mock data: `initialData.ts` (tags ใน screens, status/approvalStatus ใน layouts), `SmartLayoutBuilder.tsx` (templates 26 ตัว), `ScreensManager.tsx`, `SlideshowStudio.tsx`
  - ลบ dead code `app_inactive` ที่เทียบกับ type แล้วไม่มีวันเป็นจริง
  - **ไม่ใช้ `as any` เพิ่ม** — แก้ที่ต้นเหตุทั้งหมด

### Added
- `docs/deploy-security-guide.md` — คู่มือ deploy ปลอดภัย + rollback workflow + checklist หลัง deploy
- `rollback.bat` — snapshot (tag image เก่า + pg_dump ไป `backups/`) / restore (ย้อนกลับโค้ด ~1 นาที)
- `check-deploy.bat` — วินิจฉัยว่า container รันโค้ดใหม่หรือเก่า
- `redeploy.bat` — deploy รอบเดียวจบ (snapshot → down → build no-cache → up → ตรวจผล) พร้อม log ที่ `build-log.txt`
- `sync-to-prod.ps1` — sync โค้ด dev → prod ผ่าน SMB (เทียบ SHA-256, ข้าม .env/uploads/dist)

### Changed
- Build ผ่านทั้ง server + frontend (`npm run build`)
- Deploy ขึ้น prod (10.70.0.1) ด้วย Docker สำเร็จ — เทส live 7 จุดผ่าน (WS relay block, trigger 401/200, SSRF block ×2, health)

### Known / Pending (หลัง deploy)
- จอต้อง **re-pair** (JWT_SECRET เปลี่ยน → display token เก่าหมดอายุ)
- เปลี่ยนรหัส admin เริ่มต้น (`Admin@2026!` ยังเป็นค่า default)
- ระบบภายนอกที่เรียก webhook ต้องส่ง header `X-Webhook-Token`

---

## [0.4.0] — 2026-08-15  🤖 แก้ไขโดย Freebuff (QR Scan-to-Interact — สแกนแล้วควบคุมจอ)

**ผู้ชมสแกน QR บนจอ → ควบคุมได้จากมือถือ (backend มีอยู่แล้ว เติม UI ครบ):**
- **Kiosk:** QR badge มุมขวาล่าง encode `{origin}/interact/{screenId}` (โหมดถูกต้องอัตโนมัติ) + แตะเพื่อซ่อน
- **`InteractPage` (`/interact/:screenId` — หน้าสาธารณะ):** ส่งข้อความ Quick Post (ไม่ต้อง login — ผ่าน WS ขึ้นจอทันที) + เปลี่ยน playlist/layout (ต้อง admin — ใช้ token ในมือถือนั้น)
- **Security:** anonymous ส่งข้อความได้อย่างเดียว, เปลี่ยนเนื้อหาต้อง login (403) — action ผิด → 400
- ตรวจ: typecheck ✅ build ✅ **integration 11/11** ✅ + เทส end-to-end ใน preview (ข้อความขึ้นจอจริงผ่าน WS + QR badge แสดง) — ต้อง redeploy ถึงขึ้น prod

## [0.3.9] — 2026-08-15  🤖 แก้ไขโดย Freebuff (Android TV — CA อัตโนมัติ ไม่ต้องติดตั้งที่จอ)

**native player (`android-player/`) ฝัง Caddy CA ใน APK** — `res/raw/caddy_root_ca.crt` (ตัวถูกปัจจุบัน) + `res/xml/network_security_config.xml` + manifest `android:networkSecurityConfig` → WebView/OkHttp trust HTTPS ให้เอง **ไม่ต้องเข้า Settings → CA certificates ที่จอเลย** (cleartext ยังเปิด = รองรับโหมด http ด้วย)

**เครื่องมือช่าง:** `caddy/push-ca-adb.bat` — ติดตั้ง CA ผ่าน ADB WiFi (push + เปิด CertInstaller) สำหรับจอที่ใช้ browser ทั่วไป

ตรวจ: gradle assembleDebug ผ่าน + ยืนยัน `res/raw/caddy_root_ca.crt` + `networkSecurityConfig` อยู่ใน APK — ⚠️ CA เปลี่ยนเมื่อไหร่ต้อง rebuild APK (วิธีใน `android-player/README.md`)

## [0.3.8] — 2026-08-15  🤖 แก้ไขโดย Freebuff (QR จับคู่จอ — URL ถูกโหมดอัตโนมัติ)

**ช่างไม่ต้องพิมพ์ URL:**
- `PairingPage` (`/pair`): รองรับ `?code=` (pre-fill — เปิดจาก QR/ลิงก์ได้รหัสมาให้เลย) + **QR code** encode `{origin}/pair?code=...` (ถูกโหมดอัตโนมัติ http/https) + ปุ่ม Copy URL
- `ScreensManager` (Admin): ปุ่ม **Pairing QR** บนทุกการ์ดจอ → modal QR + URL + Copy (mode-aware จาก `window.location.origin`)

ตรวจ: typecheck ✅ + build ✅ + เทส preview (pre-fill LOBBY-88 + modal CAFE-20 URL ถูกต้อง)

## [0.3.7] — 2026-08-15  🤖 แก้ไขโดย Freebuff (โหมด HTTP/HTTPS สลับได้ — config เดียว)

**display URL สร้างจาก request อัตโนมัติ** (`server.ts` generate-token): `req.protocol` + `Host` (trust proxy เปิดอยู่ — ผ่าน Caddy ได้ https:// อัตโนมัติ) — APP_URL เหลือเป็น fallback — **สลับโหมดไม่ต้องแก้ .env ไม่ต้อง redeploy**

**สคริปต์สลับโหมด:** `caddy/mode.conf` (บรรทัดเดียว: `http`/`https`) + `caddy/switch-mode.bat` (เปิด/ปิด Caddy service ตามโหมด) — จอใหม่ที่ generate ได้ URL ถูกโหมด, จอเก่ายังใช้ URL เดิมได้ (รองรับทั้ง 2 พร้อมกัน)

ตรวจ: typecheck ✅ + integration 10/10 ✅ + เทส dev (Host/X-Forwarded-Proto จำลอง Caddy → https://10.70.0.1, ตรง → http://10.70.0.1:3100) ✅

## [0.3.6] — 2026-08-15  🤖 แก้ไขโดย Freebuff (Ops: CA ถูกต้องแล้ว + SW register ผ่าน HTTPS ✅)

**Fix (CA ผิดตัว):** cert บน prod ถูกเซ็นโดย root คนละตัวกับ `caddy-root-ca.crt` (storage ของ validate/start ต่างจาก Windows service → CA แตก) — pin `storage file_system { root C:/signage/caddy/storage }` ใน `caddy/Caddyfile` + `install-caddy.bat` restart service จริง (net stop+start — `net start` ไม่ reload config) + export CA จาก pinned storage เสมอ

**ตรวจผ่าน (headless Edge + CDP ผ่าน `https://10.70.0.1`):** secure context ✅ → SW registered+activated ✅ → cache ครบ 3 กลุ่ม: shell + `/api/display/*/data` + media `/uploads/*` ✅ — chain verify OK (`openssl verify`) — หมายเหตุ: curl (Schannel) ต้อง `--ssl-no-revoke` (CA ภายในไม่มี CRL; browser soft-fail ปกติ)

**เครื่องมือ:** `tests/sw-https-check.mjs` — เทส SW register + cache ผ่าน HTTPS prod

## [0.3.5] — 2026-08-15  🤖 แก้ไขโดย Freebuff (Ops: Caddy HTTPS สำหรับ LAN — REQ-004 เต็มรูปแบบ)

### Added
- **ชุดติดตั้ง HTTPS บน prod (LAN ไม่มี domain):** `caddy/Caddyfile` (`tls internal` — Caddy ออก cert เองด้วย CA ในเครื่อง) + `caddy/install-caddy.bat` (ดาวน์โหลด caddy.exe → เขียน Caddyfile → validate → ติดตั้ง Windows service → export root CA) + `caddy/TRUST-CA.md` (วิธีติดตั้ง CA บน Windows/Android TV + ทางเลือก Let's Encrypt ถ้ามี domain)
- reverse proxy `localhost:3100` + HSTS + log — WebSocket ผ่าน Caddy ได้อัตโนมัติ
- หลัง HTTPS ขึ้น: **Service Worker (REQ-004) ทำงานเต็มรูปแบบบน prod** — จอเล่นต่อได้ offline

### Notes
- ต้องติดตั้ง CA (`caddy-root-ca.crt`) ที่จอ/เบราว์เซอร์ก่อน (หรือใช้ Let's Encrypt ถ้ามี domain)
- หลังติดตั้ง: อัปเดต `.env` → `APP_URL=https://10.70.0.1` (+ `CORS_ORIGIN`) แล้ว redeploy เพื่อให้ pairing/display URL ใช้ https

---

## [0.3.4] — 2026-08-15  🤖 แก้ไขโดย Freebuff (Ops: สคริปต์แก้ media URL บน prod)

### Added
- `fix-prod-media.sql` + `fix-prod-media.bat` — ใช้บนเครื่อง prod (10.70.0.1, หลัง `redeploy.bat`): ตรวจ `/media/sample` ถูกเสิร์ฟแล้ว → รัน SQL ผ่าน `docker compose exec signage-postgres psql` ชี้ `med-001..008` ไป `/media/sample/*` (idempotent — รันซ้ำได้) — วิธีใช้: `cd C:\signage && fix-prod-media.bat`

### Verified
- SQL รันบน dev DB ผ่าน (idempotent, ผลถูกต้อง med-001..004 → /media/sample/*)

---

## [0.3.3] — 2026-08-15  🤖 แก้ไขโดย Freebuff (Fix: สื่อตัวอย่างต้นทางตาย → ไฟล์ในระบบ)

### Fixed
- **Seed media ตาย (403) → ไฟล์ในระบบ:** เดิม `med-001/002` (วิดีโอ) ชี้ Google `gtv-videos-bucket` (BigBuckBunny/ElephantsDream — bucket ปิดไปแล้ว → 403 ทุกครั้ง) และ `med-003/004` + thumbnails ชี้ unsplash (external)
  - เพิ่มไฟล์ตัวอย่างใน repo: `public/media/sample/` (welcome-demo.mp4 6.6MB + campus-1..4.png) — อยู่ใน repo → เข้า dist ตอน build + sync ไป prod ได้ ไม่ต้องพึ่ง external URL
  - `seed.ts` — media ทั้ง 8 ตัวชี้ `/media/sample/*` (ไม่มี external dependency)
  - อัปเดต dev DB (med-001..008) ตรงๆ — จอเล่นวิดีโอจริงได้ทันที

### Verified
- `/media/sample/welcome-demo.mp4` → HTTP 200 video/mp4 (6.6MB), campus png → 200 image/png
- Kiosk (scr-001): `welcome-demo.mp4 → 206 (Media)` + PoP 201 ต่อเนื่อง = **วิดีโอเล่นจริง ไม่มี 403** (screenshot ยืนยันเห็นเฟรมวิดีโอ)

### Known / Pending
- ต้อง redeploy (rebuild) เพื่อให้ `/media/sample/*` เข้า dist ของ prod
- ยังมี media rows ที่ user อัปโหลดแล้วไฟล์หาย (`*_optimized.webp` ไม่อยู่ในดิสก์) — ต่างจาก seed (ข้อมูลผู้ใช้เดิม) ควรอัปโหลดใหม่ผ่าน Media Library

---

## [0.3.2] — 2026-08-15  🤖 แก้ไขโดย Freebuff (REQ-004 Offline-First Web Player)

### Added
- **Offline-first web player (REQ-004)** — จอเล่นเนื้อหาต่อได้เมื่อเน็ตหลุด:
  - `public/sw.js` — Service Worker: navigate network-first + fallback cache, `/api/display/*data` network-first, `/uploads` + `/api/media-proxy` stale-while-revalidate, `/assets` cache-first, อื่นๆ network-only (ไม่แคช auth/CRUD) + versioned cache + `clients.claim()`
  - `DisplayKiosk.tsx` — register SW + offline state (navigator.onLine + fetch ล้มเหลว) + **banner "OFFLINE — เล่นจากแคช"** + fetch ล้มเหลวแต่มีข้อมูลเก่า → เล่นต่อจาก cache + **auto-resume** (event online → fetch ทันที) + dev hook `?simoffline=1` (จำลองเน็ตหลุด อ่านจาก SW cache)
  - `PlayerApp.tsx` — register SW ด้วย (idempotent)

### Verified
- typecheck 0 error, build ผ่าน, integration **10/10** (เพิ่มเทส SW: `/sw.js` เสิร์ฟ + กลยุทธ์ครบ)
- เทส live ใน preview: SW activated + controller ✅, cache 3 กลุ่ม (shell/data/media) มีข้อมูลจริง ✅, `?simoffline=1` → banner + เนื้อหายังแสดงครบ ✅

### Known / Pending
- ⚠️ **SW ต้องการ HTTPS/localhost** — prod ปัจจุบัน `http://10.70.0.1:3100` ไม่ได้ HTTPS → SW ไม่ register (fallback เงียบ) — จอเล่นต่อแบบ in-page ได้บางส่วน แต่ media cache เต็มรูปแบบต้อง HTTPS (แนะนำ reverse proxy) หรือใช้ Android app (OfflineCacheService)
- สื่อ seed ตัวหนึ่ง (BigBuckBunny บน Google bucket) ต้นทางตาย (403) — ไม่เกี่ยวกับ REQ-004

---

## [0.3.1] — 2026-08-15  🤖 แก้ไขโดย Freebuff (REQ-009 Automated Integration Tests)

### Added
- **ชุดเทสอัตโนมัติ (REQ-009)** — `tests/helpers.mjs` + `tests/integration.test.mjs` ใช้ `node:test` ในตัว (0 dependency เพิ่ม):
  - ครอบคลุม security guard (401/403/SSRF), pair/heartbeat, REQ-003 scheduler resolver, REQ-005 PoP (401/403/400/roundtrip), REQ-006 6-Level priority, REQ-011 campaigns (CRUD + ชนะ/แพ้ระดับ), REQ-008 monitoring (offline→online ผ่าน ticker จริง), REQ-010 audit log, REQ-007 backup (run/download/delete + path traversal)
  - สร้างข้อมูล `[TEST]` + ลบให้เรียบร้อย — รันซ้ำได้ไม่สะสมขยะ
  - **safety guard** — ห้ามรันบน prod (`NODE_ENV=production` → reject)
- `package.json` — script `test:integration` (`node --test "tests/*.test.mjs"`)

### Verified
- **9/9 ผ่าน 2 รอบติด** (~71 วิ/รอบ — หลักๆ รอ monitor ticker 35 วิ × 2) — เทสกับ dev server + dev DB

### Known / Pending
- ต้องมี dev server รันอยู่ก่อน (`npm run dev`) — ใช้ dev DB เท่านั้น

---

## [0.3.0] — 2026-08-15  🤖 แก้ไขโดย Freebuff (REQ-007 Backup อัตโนมัติ DB + Uploads)

### Added
- **Backup & Restore (REQ-007)** — สำรองข้อมูล DB + ไฟล์มีเดียเป็นไฟล์ ดาวน์โหลดได้จากหน้า Admin:
  - `src/services/backup.ts` — ใหม่: DB dump แบบ pure-JS (JSON ผ่าน pg — 21 ตารางทั้งหมด, ใช้ได้ทั้ง dev/Windows และ prod/node:20-alpine ที่ไม่มี pg_dump) + Uploads zip (`archiver@7` CJS-compatible) + retention ลบเก่าเกิน `BACKUP_RETENTION_DAYS` (default 7) + scheduler รันอัตโนมัติตอน `BACKUP_HOUR` (default 03:00)
  - `server.ts` — `GET /api/backups` (list + config), `POST /api/backups/run`, `GET /api/backups/:file/download` (attachment), `DELETE /api/backups/:file` — วางก่อน SPA fallback, audit log การสร้าง/ลบ, กัน path traversal
  - `auth.ts` — permission `read:backups` + `write:backups` (admin+)
  - `api.ts` — `backupApi` (list/run/downloadUrl/remove)
  - `BackupManager.tsx` — ใหม่: หน้า **Backup** ใน Navbar — การ์ด config (เวลาอัตโนมัติ/retention/จำนวนไฟล์ DB-Uploads/ขนาดรวม) + ปุ่ม **Run backup now** + ตารางไฟล์ (ชื่อ/ประเภท badge/ขนาด/เวลาแบบไทย/ดาวน์โหลด/ลบ) + empty state
  - `docker-compose.yml` — mount `./backups:/app/backups` ให้ signage-app + env `BACKUP_DIR`/`BACKUP_RETENTION_DAYS`/`BACKUP_HOUR` — backup อยู่บน host `\\10.70.0.1\\c\\signage\\backups` (โฟลเดอร์เดียวกับ postgres)

### Verified
- typecheck 0 error, build ผ่าน, smoke test 14/14 (401, list+config, run → db JSON 21 ตาราง/6 screens + zip PK 5MB, download attachment, delete, path traversal 404) + ยืนยัน UI (Run backup now ผ่าน UI → 2 ไฟล์โผล่ในตารางจริง)

### Known / Pending
- ✅ **deploy แล้ว (2026-08-15 — `redeploy.bat`)** — ยืนยัน live บน prod เรียบร้อย

---

## [0.2.9] — 2026-08-15  🤖 แก้ไขโดย Freebuff (REQ-010 Audit log admin)

### Added
- **Audit log ย้อนหลัง (REQ-010)** — ตาราง `audit_logs` + `logAudit()` มีอยู่แล้ว (login/layout/playlist/schedule/campaign/emergency บันทึกครบ) — เพิ่มช่องทางดู:
  - `server.ts` — `GET /api/audit-logs` (filter `action`/`resource`/`q` (email/resourceId) + `limit`/`page` + total)
  - `auth.ts` — permission `read:audit` (admin+)
  - `api.ts` — `auditApi.getLogs()`
  - `AnalyticsTelemetry.tsx` — ส่วน **Admin Audit Trail**: ตาราง (เวลาแบบไทย, ผู้ใช้, action badge สีตาม severity, หมวด, resourceId, IP) + dropdown หมวด (auth/layout/playlist/schedule/campaign/media/screen/emergency) + ค้นหา

### Verified
- typecheck 0 error, build ผ่าน, smoke test 9/9 (สร้าง/แก้/ลบ layout → ปรากฏใน log ครบ, filter resource/action/q, limit cap, 401 ไม่มี token) + ยืนยัน UI (login + layout + campaign + schedule entries จริง)

### Known / Pending
- ✅ **deploy แล้ว (2026-08-15 — `redeploy.bat`)** — ยืนยัน live บน prod เรียบร้อย

---

## [0.2.8] — 2026-08-15  🤖 แก้ไขโดย Freebuff (REQ-008 Monitoring & Alerting)

### Added
- **Monitoring checker (REQ-008)** — อัปเกรดจาก heartbeat checker เดิม (SQL update เปล่าๆ):
  - `server.ts` — ตรวจทุก 30 วิ: จอที่ heartbeat เก่ากว่า `MONITOR_OFFLINE_MINUTES` (default 5, ตั้งได้ใน .env) → เปลี่ยนเป็น offline + บันทึก telemetry `screen_offline` + broadcast `SCREEN_OFFLINE` + **Slack/Teams webhook** (ถ้าตั้ง `SLACK_ALERT_WEBHOOK_URL`)
  - จอกลับมาออนไลน์ (heartbeat สด) → เคลียร์ alert + telemetry `screen_online` + webhook + broadcast `SCREEN_ONLINE`
  - `GET /api/monitoring/status` — สถานะรายจอ (lastHeartbeat / offlineForMinutes / isStale / alertActive / alertSince) + summary (online/offline/alerting) + รายการ alerts
- **UI monitoring:** `ScreensManager.tsx` — poll `refreshScreens()` ทุก 60 วิ + banner แดงแจ้งจอไม่ตอบสนอง (รายชื่อ + ปุ่มรีเฟรช) + heartbeat indicator บนการ์ดทุกจอ (❤️ Xm — เขียว=สด, แดง=stale)
- `useSignageStore.ts` — `refreshScreens()` action

### Fixed
- **Route หลัง SPA fallback:** `/api/monitoring/status` ถูกวางหลัง `app.get('*')` → ไม่เคย match — ย้ายก่อน catch-all (บันทึกไว้ในคอมเมนต์กันกลับไปทำซ้ำ)

### Verified
- typecheck 0 error, build ผ่าน, smoke test 9/9 (โครงสร้าง endpoint, ตรวจจับ offline → alert+screen_offline, recovery → เคลียร์+screen_online, 401 ไม่มี token) + ยืนยัน UI (banner + indicator)

### Known / Pending
- ✅ **deploy แล้ว (2026-08-15 — `redeploy.bat`)** — ยืนยัน live บน prod เรียบร้อย
- ตั้ง `SLACK_ALERT_WEBHOOK_URL` + `MONITOR_OFFLINE_MINUTES` ใน .env ของ prod (ถ้าต้องการ alert ผ่าน Slack/Teams)

---

## [0.2.7] — 2026-08-15  🤖 แก้ไขโดย Freebuff (REQ-011 Campaigns ฝั่ง server)

### Added
- **Campaigns CRUD ฝั่ง server (REQ-011)** — เดิม `CampaignManager` เก็บ localStorage → ย้ายมาเป็น API จริง:
  - `server.ts` — `GET/POST/PATCH/DELETE /api/campaigns` (admin auth, `write:schedules` permission, audit log)
  - `validate.ts` — `CreateCampaignSchema`/`UpdateCampaignSchema` (layoutSequence: layoutId + durationSec)
  - `api.ts` — `campaignApi` helper
  - `CampaignManager.tsx` — โหลด/สร้าง/แก้/ลบ/สลับ active ผ่าน API + loading/error state (ไม่แตะ localStorage)
- **Campaign แสดงผลจริงบนจอ (ระดับ campaign 21-40)** — resolver ผูกกับ 6-Level Priority:
  - `resolveScreenContent()` — campaign เป็นตัวแข่ง priority 30 (กลาง band campaign): schedule ระดับ/เลขสูงกว่า → ชนะ; ไม่มี schedule → campaign ชนะ; ไม่มีทั้งคู่ → default
  - `campaignCurrentLayoutId()` — server-side rotation ตามเวลา (epoch = createdAt)
  - `/api/display/:id/data`, `/api/schedules/resolve`, `SCHEDULE_CHANGED` broadcast — ส่ง `campaign` payload (layoutSequence/cycleMode/createdAt)
  - `PlayerApp.tsx` — campaign จาก resolve + WS (rotation ฝั่ง client) แทน localStorage
  - `DisplayKiosk.tsx` — refetch ให้ทันที่ขอบเวลา item (คณิตเดียวกับ server)

### Fixed
- **bug rotation stuck:** broadcast key ของ campaign เดิมรวม `layoutId` (server หมุนทุก 30 วิ) → `SCHEDULE_CHANGED` ยิงทุก rotation → player รีเซ็ต `campaignIndex=0` → ติด layout แรก — แก้เป็น key แค่ `cmp:{id}` (broadcast เฉพาะเมื่อ campaign เปลี่ยนจริง)

### Verified
- typecheck 0 error, build ผ่าน, smoke test 12/12 (CRUD, campaign vs schedule 50/25/35, display data มี campaign+layout, validation 400)
- **เทส UI เต็มวงจรใน preview:** สร้าง campaign ผ่าน UI (2 layouts) → TV Player แสดง campaign layout แทน default → **rotation A→B→A ครบ 60 วิ** (ยืนยัน 3 จุดเวลา)

### Known / Pending
- ✅ **deploy แล้ว (2026-08-15 — `redeploy.bat`)** — ยืนยัน live บน prod เรียบร้อย

---

## [0.2.6] — 2026-08-15  🤖 แก้ไขโดย Freebuff (REQ-006 6-Level Priority)

### Added
- **6-Level Priority Model (REQ-006)** — ขยายจาก 3 ระดับเป็น 6 ระดับเต็มรูปแบบ:
  - `src/types/signage.ts` — `PriorityLevel` 6 ค่า + `PRIORITY_LEVELS` (band/สี/ป้าย EN+TH) + `priorityLevelOf()` / `priorityRankOf()` / `priorityDefOf()`
  - ระดับ: `emergency(91-100) > critical(81-90) > scheduled(41-80) > campaign(21-40) > default(11-20) > standby(1-10)`
- **Resolver ใช้ระดับ (REQ-003+006)** — `server.ts`: ชนกันหลาย schedule → เทียบระดับก่อน แล้วค่อยเทียบเลขในระดับเดียวกัน; คืน `priorityLevel` + `source` ใน `/api/schedules/resolve`, `/api/display/:id/data`, `SCHEDULE_CHANGED` broadcast
- **Scheduler Engine UI** — Hierarchy cards 6 ระดับ (พร้อม label ไทย), สี timeline bar / rule badge ตาม band, slider priority 1–90 (ช่วง 91-100 สงวนให้ระบบฉุกเฉิน) + แสดงระดับปัจจุบัน

### Changed
- `PriorityLevel` เดิม 3 ค่า (`emergency|scheduled|default`) → 6 ค่า (เพิ่ม `critical|campaign|standby`)
- Badge rule ใน Scheduler: `Priority: 80` → `Scheduled · 80`

### Verified
- typecheck 0 error, build ผ่าน, smoke test 8/8 (conflict 85>60>30, band campaign/standby/default, ระดับสูงกว่าชนะแม้ตัวเลขน้อยกว่า, display data มี priorityLevel/contentSource) + ยืนยัน UI ใน preview (6 cards + badge + slider)

### Known / Pending
- ✅ **deploy แล้ว (2026-08-15 — `redeploy.bat`)** — ยืนยัน live บน prod เรียบร้อย
- **หมายเหตุ:** rule เดิมที่ priority 95 (REQ003 Preview Test) ถูก cleanup ระหว่างเทส — เป็น rule ทดสอบของเดโม REQ-003

---

## [0.2.5] — 2026-08-15  🤖 แก้ไขโดย Freebuff (REQ-005 Proof of Play เข้าระบบจริง)

### Added
- **Proof of Play เข้าระบบจริง (REQ-005)** — จอส่งหลักฐานการเล่นสื่อเข้า server → Analytics มีข้อมูลจริง:
  - `server.ts` — `POST /api/analytics/proof-of-play` (auth: admin หรือ display token ของจอตัวเอง — ส่งแทนจออื่นโดน 403) + validation ผ่าน `CreateProofOfPlaySchema` (mediaId/screenId/durationMs/playedAt)
  - `PlayerApp.tsx` — หลัง media จบ → `reportProofOfPlay()` POST เข้า server (เก็บ local ต่อเป็น cache/offline)
  - `DisplayKiosk.tsx` — KioskZone (จอจริง) บันทึก PoP เข้า server เช่นกัน
  - `api.ts` — เพิ่ม `reportProofOfPlay()` helper

### Verified
- typecheck 0 error, build ผ่าน, smoke test 8/8 (POST 201, GET roundtrip, ไม่มี token 401, ส่งแทนจออื่น 403, body ผิด 400)
- **เทส live ใน preview:** เปิด TV Player เล่นจริง → PoP ไหลเข้า server ทุก ~15 วิ → หน้า Analytics & Telemetry แสดงรายการ COMPLETED จริง (Main Lobby, ชื่อ media, duration 15s)

### Known / Pending
- ✅ **deploy แล้ว (2026-08-15 — `redeploy.bat`)** — ยืนยัน live บน prod เรียบร้อย

---

## [0.2.4] — 2026-08-15  🤖 แก้ไขโดย Freebuff (REQ-003 Server-side scheduler)

### Added
- **Server-side scheduler (REQ-003)** — เซิร์ฟเวอร์ตัดสินใจว่าจอโชว์อะไรตามเวลา ไม่ต้องพึ่งจอเปิดอยู่ตอนสร้าง schedule:
  - `server.ts` — `getActiveScheduleForScreen()` (filter isActive + วันที่ + วันในสัปดาห์ + เวลา + เป้าหมายทุกจอ/จอ/กลุ่ม, ชนกันเลือก priority สูงสุด), `resolveScreenContent()`, `pushScheduleUpdates()` (ticker 30 วิ + หลัง schedule CRUD → broadcast `SCHEDULE_CHANGED`)
  - `/api/display/:id/data` — ใช้ effective layout/playlist จาก schedule + ส่ง `schedule`/`effectivePlaylistId` ใน payload
  - `GET /api/schedules/resolve?screenId=` — ดู schedule ที่ active ตอนนี้
  - `DisplayKiosk.tsx` — รับ `SCHEDULE_CHANGED` → refetch ทันที + ใช้ `effectivePlaylistId`
  - `PlayerApp.tsx` — ดึง resolve + ฟัง WS → ลำดับความสำคัญ **emergency > schedule > campaign > base**

### Changed
- ลำดับความสำคัญ layout ใน Player: schedule มาก่อน campaign (เดิม campaign > schedule)

### Known / Pending
- ✅ **deploy แล้ว (2026-08-15 — `redeploy.bat`)** — ยืนยัน live บน prod เรียบร้อย
- **REQ-011 (Open):** campaigns ฝั่ง server (ตอนนี้ CampaignManager ยังใช้ localStorage)

---

## [0.2.3] — 2026-08-15  🤖 แก้ไขโดย Freebuff (Deploy REQ-001/002)

### Changed
- **Deploy REQ-001 + REQ-002 ขึ้น prod สำเร็จ** (`redeploy.bat` ที่ 10.70.0.1) — ยืนยัน live tests ผ่าน:
  - Health: container ใหม่ (uptime < 5 นาที), `database: connected`
  - SSRF media-proxy (169.254.169.254) → `URL blocked` [400]
  - SSRF RSS (192.168.x) → `RSS feed blocked` [400]
  - `/api/trigger` ไม่มี token → [401], token ผิด → [401]
  - `/api/trigger` token ถูก + `action: refresh` → [200] success (targetScreens 5)
  - **หมายเหตุ:** `/api/trigger` ตอนนี้บังคับ field `action` + `target` — webhook ภายนอกที่เคยส่งแค่ `{}` ต้องปรับ payload (โค้ดใหม่ตรวจเข้มขึ้น)

### Known / Pending
- จอต้อง **re-pair** (JWT_SECRET เปลี่ยน — display token เก่าหมดอายุ)
- เปลี่ยนรหัส admin เริ่มต้น (`Admin@2026!`)
- แจก `WEBHOOK_TOKEN` ให้ระบบภายนอกที่เรียก webhook

---

## [0.2.1] — 2026-08-12  🤖 แก้ไขโดย Freebuff (REQ-001)

### Added
- **เช็ค IP + MAC จริงของจอ (REQ-001)** — แทน mock data เดิม:
  - `server.ts` — helper `getClientIp()`: ตอน `/api/display/pair` และ `/api/telemetry/heartbeat` เก็บ IP จริงจาก connection (`req.ip`/`x-forwarded-for`) และรับ `macAddress` จาก device (ถ้าส่งมา)
  - `src/middleware/validate.ts` — `HeartbeatSchema` เพิ่ม `ipAddress`/`macAddress` optional
  - `src/components/player/PairingPage.tsx` — merge deviceInfo จาก `SignageNative.getDeviceInfo()` (Android) → ส่ง IP/MAC จริงตอน pair
  - `android-player/.../NativeBridge.kt` — `getDeviceInfo()` เพิ่ม `ipAddress` + `macAddress` (NetworkInterface, best-effort)
  - `ScreensManager.tsx` — Network Info โชว์ "—" ถ้ายังไม่มีข้อมูลจริง + แสดง last heartbeat

### Changed
- `src/data/initialData.ts` + `src/db/seed.ts` — ลบ IP/MAC ปลอมออก (ค่าเริ่มต้นว่าง → device รายงานจริง)

### Known (ข้อจำกัด)
- **Browser (web player):** หา MAC ไม่ได้ (นโยบาย privacy ของ browser) → IP ได้จาก connection, MAC จะ "—"
- **Android 10+:** MAC ที่ได้เป็นค่า randomized ต่อ network (อาจต่างจาก MAC ฮาร์ดแวร์ที่ router เห็น)
- ✅ deploy ขึ้น prod แล้ว (2026-08-15 — `redeploy.bat`)

---

## [0.2.2] — 2026-08-12  🤖 แก้ไขโดย Kiro (REQ-002)

### Security
- **IP priority fix (REQ-002)** — กลับลำดับ IP priority ใน `server.ts`:
  - เดิม: `reportedIp (จาก device)` > `clientIp (จาก connection)` → device สามารถ spoof IP ได้
  - ใหม่: `clientIp (จาก connection)` > `reportedIp (จาก device)` → connection IP เชื่อถือได้ (spoof ไม่ได้ในระดับ TCP)
  - แก้ 2 จุด: `/api/display/pair` + `/api/telemetry/heartbeat`
  - reported IP จาก device ยังใช้เป็น fallback กรณี server อยู่หลัง proxy ที่ไม่ forward IP

---

## [Unreleased]

### Planned
- PostgreSQL integration (Drizzle ORM + migrations)
- Docker + docker-compose.yml production setup
- REST API CRUD endpoints (screens, media, playlists, schedules)
- File upload (multer) สำหรับ media
- Authentication / Authorization (JWT)
- Redis integration สำหรับ WS session tracking
- A/B Video Buffering engine (zero-flicker)
- WakeLock API สำหรับ Android TV

---

## [0.1.0] — 2026-08-04

### Added
- Initial project scaffold (React 19 + Vite + Express + WebSocket)
- TypeScript type system ครบทั้งหมด (`src/types/signage.ts`)
- Zustand global store พร้อม CRUD actions ทั้งหมด
- Seed data: 5 screens, 8 media items, 4 layouts, 6 playlists, 3 schedules
- Admin Panel (7 tabs):
  - ScreensManager — แสดงสถานะจอ + remote commands
  - SmartLayoutBuilder — Zone canvas editor
  - MediaLibrary — จัดการสื่อ
  - PlaylistEditor — Timeline editor พร้อม preview
  - SchedulerEngine — Gantt timeline scheduler
  - RealtimeControlConsole — Emergency + remote commands
  - AnalyticsTelemetry — Proof of Play + Telemetry logs
- Player App:
  - Multi-zone layout renderer
  - Emergency overlay (pulse animation + display-hero font)
  - 7 Media renderers (video, image, ticker, weather, clock, announcement, webpage)
  - OSD bar (auto-hide 8s)
  - Offline simulation toggle
  - Fullscreen API
  - QR Pairing screen
- Simulator mode (Admin + Player คู่กัน)
- Express server + WebSocket hub
- REST API: `/api/health`, `/api/emergency/trigger`, `/api/emergency/clear`,
  `/api/control/command`, `/api/telemetry/heartbeat`
- Design System "Aetheric Command":
  - Admin: Electric Indigo + Cyan palette, Glassmorphism cards
  - Player: Pure Black OLED, display-hero 120px typography
- WebGL shader background (burn-in prevention)
- Project documentation:
  - `README.md`
  - `docs/environment.md`
  - `docs/database.md`
  - `docs/development-guide.md`
  - `docs/docker-guide.md`
  - `docs/api-reference.md`
  - `docs/decisions/`
  - `.kiro/specs/` (requirements, design, architecture, tasks)

### Technical Decisions
- ใช้ port `3100` (ไม่ใช่ 3000) เพราะ `thaihua-auth-service` ครอง 3000 แล้ว
- ใช้ `thaihua-postgres` ที่มีอยู่แล้วแทนการสร้าง container ใหม่
- เชื่อมต่อผ่าน `thaihua-network` bridge network
- เลือก Drizzle ORM (เบา, TypeScript-first) แทน Prisma
- State ยังอยู่ใน Zustand (in-memory) รอ DB layer

---

## Template สำหรับ Version ต่อไป

```markdown
## [X.Y.Z] — YYYY-MM-DD

### Added
- ฟีเจอร์ใหม่

### Changed
- การเปลี่ยนแปลงที่มีอยู่แล้ว

### Deprecated
- ฟีเจอร์ที่จะถูกลบในอนาคต

### Removed
- ฟีเจอร์ที่ถูกลบแล้ว

### Fixed
- Bug ที่แก้แล้ว

### Security
- ช่องโหว่ที่แก้แล้ว
```
