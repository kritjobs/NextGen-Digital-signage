# Broadsign Feature Analysis — สำหรับ NextGen Digital Signage Platform
**วันที่วิเคราะห์:** 8 สิงหาคม 2026  
**แหล่งข้อมูล:** [Broadsign.com](https://broadsign.com/)  
**วัตถุประสงค์:** ศึกษา OOH/DooH advertising platform ระดับ world-class  
**หมายเหตุ:** Broadsign + Place Exchange = largest programmatic OOH supply (~2 million screens), SOC2 certified — เน้น media owner operations + advertising revenue optimization ไม่ใช่ corporate signage

---

## ทำไม Broadsign ต่างจากทุก Platform ที่วิเคราะห์มา

Broadsign ไม่ใช่ "digital signage CMS" แบบ platform อื่น — เป็น **OOH Advertising Operations Platform** ที่ให้ media owners (เจ้าของจอ billboard, transit, ห้าง) จัดการ network, ขาย ad space, และ optimize revenue

ถ้า platform อื่นตอบคำถาม "แสดงอะไรบนจอ?" — Broadsign ตอบคำถาม **"ขาย ad space บนจอยังไงให้ได้เงินมากที่สุด?"**

---

## 1. Rules-Based Content Automation (ไม่ใช่ Playlist)

**คำอธิบาย:** แทนที่จะใช้ playlist loop — Broadsign ใช้ **rules engine** ตัดสินใจ real-time ว่าจะเล่นอะไร:
- ระบบพิจารณา: campaign priority, share of voice, time targeting, location, impressions delivered, pacing goals
- ทุก ad slot ถูก "fill" แบบ dynamic — ไม่ใช่ fixed sequence
- ถ้า campaign A ส่งงานเกิน target → ลดความถี่อัตโนมัติ ให้ campaign B ขึ้นแทน
- "Eliminate time-consuming playlist management"

**ต่างจาก Yodeck 6-Level Priority:**
- Yodeck: priority เป็น layer (Emergency > Schedule > Playlist)
- Broadsign: rules engine ภายใน layer เดียวกัน optimize หลาย campaigns พร้อมกัน

**ประโยชน์สำหรับเรา:** สำหรับ deployment ที่มีหลาย "advertisers" บนจอเดียวกัน — ระบบ auto-optimize ว่าใครได้แสดงตอนไหน ตาม contract ที่ตกลง

**ระดับความยาก:** สูงมาก  
**Impact:** สูงมาก (advertising network management)

---

## 2. Dynamic Pacing (Real-Time Delivery Optimization)

**คำอธิบาย:** ระบบปรับความถี่ ad แบบ real-time เพื่อให้ campaign deliver ตรงเป้า:
- Campaign ซื้อ 10,000 plays ใน 30 วัน
- วันแรกๆ จอ offline → deliver น้อยกว่าเป้า
- System เพิ่มความถี่อัตโนมัติในวันถัดไปเพื่อ "catch up"
- คล้าย "cruise control" สำหรับ ad delivery
- React real-time ต่อ network events

**ต่างจาก static scheduling:**
- Static: เล่น 10 ครั้ง/วัน ตลอด 30 วัน
- Dynamic Pacing: เล่น 8 ครั้งวันนี้ (จอบางจุด offline) → 12 ครั้งพรุ่งนี้ (ชดเชย)

**ประโยชน์สำหรับเรา:** Guarantee delivery — สัญญาว่าจะแสดง X impressions แล้วระบบ deliver ได้จริง ไม่ว่าจะเกิดอะไร

**ระดับความยาก:** สูง  
**Impact:** สูง (contractual obligation fulfillment)

---

## 3. Share of Voice (SoV) Selling Model

**คำอธิบาย:** ขาย ad space ตาม "สัดส่วนเวลาแสดง" ไม่ใช่ fixed time slot:
- Advertiser A ซื้อ 40% SoV → ad ของ A แสดง 40% ของเวลาทั้งหมด
- Advertiser B ซื้อ 20% SoV → ad ของ B แสดง 20%
- เหลือ 40% → ใช้สำหรับ house ads หรือ fill จาก programmatic
- Min/Max boundaries: SoV 40% อาจอยู่ระหว่าง 30-50% ในแต่ละชั่วโมง (ตราบที่ average = 40%)

**ประโยชน์สำหรับเรา:** รูปแบบขาย ad ที่ flexible กว่า "ซื้อเวลา 10:00-10:05" — ขายเป็น % ง่ายกว่า + optimize ได้ดีกว่า

**ระดับความยาก:** สูง  
**Impact:** สูง (revenue model)

---

## 4. Header Bidder (Multi-SSP Programmatic)

**คำอธิบาย:** ระบบ "ประมูล" ad slots จากหลาย SSP (Supply Side Platform) พร้อมกัน:
- ปกติ: จอง 1 slot ต่อ 1 SSP partner (one-to-one) → เสีย inventory
- Header Bidder: เปิดให้ **ทุก SSP** bid พร้อมกัน (one-to-many) → ได้ราคาสูงสุด
- Maximize yield value
- Increase fill rate
- ลดความซับซ้อนของ ad ops

**ต่างจาก Navori DooH:**
- Navori: เชื่อมกับ SSP แบบ one-to-one (Hivestack)
- Broadsign: Header Bidder รวมหลาย SSP → auction → highest bid wins

**ประโยชน์สำหรับเรา:** ถ้า platform ของเราต้องรองรับ advertising — Header Bidder เป็น mechanism ที่ maximize revenue สำหรับ media owners

**ระดับความยาก:** สูงมาก  
**Impact:** สูงมาก (revenue optimization)

---

## 5. Guaranteed Campaign Delivery (99.9% On-Target)

**คำอธิบาย:** ระบบ guarantee ว่า campaign จะ deliver ตามสัญญา:
- ตรวจสอบ availability ก่อนจอง (real-time inventory check)
- Hold inventory ขณะรอ approval
- Rebalancing — ถ้า under-delivery → ปรับ pacing อัตโนมัติ
- Campaign Performance Report — รายงาน repetitions + saturation
- 99.9% on-target delivery (case study: Québecor)

**ประโยชน์สำหรับเรา:** ถ้าขาย advertising space — ต้อง "guarantee" delivery ให้ advertisers มั่นใจ ไม่ใช่แค่ "best effort"

**ระดับความยาก:** สูง  
**Impact:** สูงมาก (advertiser trust)

---

## 6. Inventory Catalog (Publicly Browsable)

**คำอธิบาย:** Media buyers สามารถ browse available inventory ได้เอง:
- Catalog แสดงจอทั้งหมดในเครือข่าย (location, format, audience reach)
- Filter ตาม: Airports, Billboards, Grocery, Malls, Transit, Urban Panels
- ดู availability + pricing
- Book campaign ได้โดยตรง
- ลด friction ในการซื้อ ad space

**ประโยชน์สำหรับเรา:** ถ้าลูกค้าเราต้องการขาย ad space — ต้องมี "storefront" ให้ advertisers เข้ามาเลือกซื้อเอง

**ระดับความยาก:** กลาง-สูง  
**Impact:** สูง (sales enablement)

---

## 7. In-Advance Automated Transactions

**คำอธิบาย:** Advertiser จองซื้อ ad space ล่วงหน้าแบบ automated (ไม่ต้อง email/โทรหา sales):
- เหมือนซื้อ Google Ads แต่สำหรับจอ outdoor
- Set targeting → เลือกวัน/เวลา → เลือก venue type/location → จอง
- ลดเวลาจาก "สัปดาห์" เหลือ "นาที"
- รองรับทั้ง Digital OOH และ Static OOH (อนาคต)

**ต่างจาก programmatic (real-time bidding):**
- Programmatic: ซื้อ real-time (เดี๋ยวนี้เลย)
- In-Advance: จองล่วงหน้า (เหมือนจองห้องโรงแรม)

**ประโยชน์สำหรับเรา:** Self-service buying portal สำหรับ advertisers — ไม่ต้องมี sales team คอย handle ทุก deal

**ระดับความยาก:** สูงมาก  
**Impact:** สูง (scalable sales)

---

## 8. Proof of Performance (Campaign Verification)

**คำอธิบาย:** พิสูจน์ให้ advertiser ว่า campaign ถูก deliver จริง:
- Repetition count (จำนวนครั้งที่เล่น)
- Saturation % (สัดส่วนเวลาที่ได้)
- Screen-level data (เล่นที่จอไหน เมื่อไหร่)
- Interaction count (ถ้าเป็น interactive campaign)
- Campaign Performance Reports auto-generated

**ต่างจาก ScreenCloud Proof of Play:**
- ScreenCloud: log ว่า content แสดงจริง (basic)
- Broadsign: full campaign delivery verification vs. contract (ได้ตาม SoV ที่ซื้อหรือไม่)

**ประโยชน์สำหรับเรา:** สำหรับ advertising use case — advertiser ต้องได้ report ว่าจ่ายเงินแล้วได้อะไรกลับมา

**ระดับความยาก:** กลาง-สูง  
**Impact:** สูง (advertiser accountability)

---

## สรุปจัดลำดับความสำคัญ

| ลำดับ | ฟีเจอร์ | ระดับความยาก | Impact | เมื่อไหร่ |
|-------|---------|-------------|--------|----------|
| 1 | Rules-Based Content Automation | สูงมาก | สูงมาก | เมื่อมี advertising use case |
| 2 | Dynamic Pacing | สูง | สูงมาก | เมื่อมี advertising |
| 3 | Header Bidder (Multi-SSP) | สูงมาก | สูงมาก | Advanced advertising |
| 4 | Share of Voice Model | สูง | สูง | เมื่อมี advertising |
| 5 | Guaranteed Delivery | สูง | สูงมาก | เมื่อมี advertising |
| 6 | Proof of Performance | กลาง-สูง | สูง | เมื่อมี advertising |
| 7 | Inventory Catalog | กลาง-สูง | สูง | เมื่อมี advertising |
| 8 | In-Advance Transactions | สูงมาก | สูง | Advanced advertising |

---

## Key Insight: เมื่อไหร่ที่เราต้องการ features เหล่านี้?

**คำตอบ:** เมื่อลูกค้าของเราเป็น **media owner** (เจ้าของจอ) ที่ต้องการ **monetize** จอด้วย advertising

```
Platform Evolution Path:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 1: Corporate Signage (ปัจจุบัน)
  ├─ Content management
  ├─ Scheduling
  └─ Device management
  → ลูกค้า: องค์กรที่ใช้จอ internal

Phase 2: Advertising-Ready
  ├─ Proof of Play
  ├─ Ad scheduling
  └─ Basic reporting
  → ลูกค้า: ร้านค้า/อาคารที่เริ่มขาย ad space

Phase 3: DooH Platform (Navori-level)
  ├─ Campaign management
  ├─ Impression billing (CPM)
  ├─ Programmatic SSP integration
  └─ Audience measurement
  → ลูกค้า: media companies

Phase 4: Full Ad Exchange (Broadsign-level)
  ├─ Rules-based automation
  ├─ Dynamic pacing
  ├─ Header bidder
  ├─ Share of Voice
  └─ Guaranteed delivery
  → ลูกค้า: large OOH networks
```

**สำหรับเราตอนนี้:** Focus Phase 1-2 ก่อน ออกแบบ architecture ให้ขยายไป Phase 3-4 ได้ในอนาคต

---

## เปรียบเทียบ Advertising Features ข้าม 3 Platforms

| Feature | OptiSigns | Navori | Broadsign |
|---------|-----------|--------|-----------|
| Basic Proof of Play | ✅ | ✅ | ✅ |
| Impression Counting | - | ✅ CPM | ✅ CPM + SoV |
| AI Audience | ✅ Demographics | ✅ Footfall + Vehicle | Via partners |
| Programmatic | - | ✅ 1 SSP (Hivestack) | ✅ Multi-SSP + Header Bidder |
| Campaign Management | - | ✅ Basic | ✅ Full (guarantee) |
| Dynamic Pacing | - | - | ✅ |
| Inventory Catalog | - | - | ✅ Public |
| Self-Service Buying | - | - | ✅ In-Advance |
| Scale | SMB | Enterprise | OOH Networks (2M screens) |

---

*วิเคราะห์จาก: https://broadsign.com/ และ docs.broadsign.com*  
*Content was rephrased for compliance with licensing restrictions*