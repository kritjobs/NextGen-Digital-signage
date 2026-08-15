# Architecture Decision Records (ADR)

โฟลเดอร์นี้เก็บบันทึกการตัดสินใจด้านสถาปัตยกรรมและเทคนิคของโปรเจกต์  
ทุกการตัดสินใจสำคัญ ควรมี ADR เป็นหลักฐาน

---

## รูปแบบ ADR

```
docs/decisions/
├── README.md          ← ไฟล์นี้
├── 001-port-selection.md
├── 002-database-strategy.md
├── 003-orm-selection.md
├── 004-state-management.md
└── 005-docker-network.md
```

## Template

```markdown
# ADR-XXX: ชื่อการตัดสินใจ

**วันที่:** YYYY-MM-DD  
**สถานะ:** Proposed | Accepted | Deprecated | Superseded

## บริบท (Context)
อธิบายปัญหาหรือสถานการณ์ที่ต้องตัดสินใจ

## ตัวเลือกที่พิจารณา (Options)
1. ตัวเลือก A
2. ตัวเลือก B

## การตัดสินใจ (Decision)
เลือกตัวเลือก X เพราะ...

## ผลที่ตามมา (Consequences)
### ข้อดี
- ...

### ข้อเสีย / ข้อระวัง
- ...
```
