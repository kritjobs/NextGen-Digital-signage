# Navori Feature Analysis — สำหรับ NextGen Digital Signage Platform
**วันที่วิเคราะห์:** 8 สิงหาคม 2026  
**แหล่งข้อมูล:** [Navori.com](https://navori.com/)  
**วัตถุประสงค์:** ศึกษาฟีเจอร์เพิ่มเติมจาก enterprise-grade + AI-driven signage platform  
**หมายเหตุ:** Navori Labs เปิดตัว 1998 (27+ ปี), deployed at Walmart Mexico, SOC2 certified — เน้น AI analytics + DooH monetization + composable architecture (Qompose platform 2026)

---

## 1. DooH Advertising Monetization (Programmatic Ad Platform)

**คำอธิบาย:** ระบบ monetize จอ signage เป็น advertising platform เต็มรูปแบบ:
- **Media Planning** — วางแผน campaign, จอง ad slots
- **Programmatic DooH** — เชื่อมกับ Supply Side Platforms (Hivestack, etc.) ให้ advertisers bid แบบ real-time
- **Impression-Based Billing** — คิดเงินตาม CPM (cost per thousand impressions)
- **Slot Reservation** — จอง time slots ล่วงหน้า
- **Fill Rate Optimization** — ถ้า ad slot ว่าง → ใช้ house content แทน
- **Campaign Reporting** — รายงาน impressions, reach, frequency
- **Pre-set impression targets** — กำหนดจำนวน impressions ต่อ ad ล่วงหน้า

**ต่างจาก platform อื่น:**
- OptiSigns: มี Proof of Play แต่ไม่มี ad server
- ScreenCloud: มี Proof of Play แต่ไม่มี programmatic buying
- Navori: **full ad-tech stack** (planning → buying → serving → reporting)

**ประโยชน์สำหรับเรา:** ถ้ามีลูกค้าที่ต้องการ monetize จอ (ห้าง, สนามบิน, transit, building) — ระบบ DooH ช่วยสร้าง revenue stream จากจอที่มีอยู่

**ระดับความยาก:** สูงมาก  
**Impact:** สูงมาก (revenue generation for clients)

---

## 2. Qompose — Composable/Modular Architecture (2026)

**คำอธิบาย:** Platform architecture แบบ modular ที่ลูกค้าเลือกใช้เฉพาะ modules ที่ต้องการ:

| Module | หน้าที่ |
|--------|---------|
| **Edge** | Player management + edge computing |
| **Link** | Data integrations + API connections |
| **Measure** | Audience analytics + footfall |
| **Automate** | Content automation rules |
| **Monetize** | DooH advertising + revenue |
| **Build** | Developer tools + custom apps |
| **Studio** | Content creation + design |
| **Orchestrator** | Multi-location management |

**เชื่อมกับ MCP (Model Context Protocol):**
- ให้ AI/enterprise systems สั่งงาน signage ผ่าน natural language
- "แสดงโปรโมชั่นกาแฟบนจอชั้น 1 ตอนเช้า" → AI แปลเป็น commands

**ต่างจาก platform อื่น:** ทุก platform อื่นขายเป็น "all-in-one package" — Navori ให้เลือก modules ตามต้องการ (ไม่ต้องจ่ายสิ่งที่ไม่ใช้)

**ประโยชน์สำหรับเรา:** Architecture concept ที่ดี — ออกแบบ platform เป็น modules ตั้งแต่แรก ให้ลูกค้า subscribe เฉพาะส่วนที่ต้องการ (เช่น "ฉันต้องการแค่ CMS + Player ไม่ต้องการ AI analytics")

**ระดับความยาก:** สูง (architectural decision)  
**Impact:** สูงมาก (pricing flexibility + scalability)

---

## 3. AI Vehicle Counting (Outdoor Analytics)

**คำอธิบาย:** นอกจาก footfall (นับคน) ยังนับ **ยานพาหนะ** ที่ผ่านหน้าจอ outdoor ได้:
- นับจำนวนรถที่ผ่าน
- แยกประเภท (รถยนต์, รถบรรทุก, มอเตอร์ไซค์)
- วัด exposure time
- ใช้เป็น metrics สำหรับ billboard/outdoor advertising

**ต่างจาก OptiSigns AI Audience:**
- OptiSigns: demographics (เพศ, อายุ) ของคนที่มอง
- Navori: footfall + vehicle counting + demographics (ครบกว่า)

**ประโยชน์สำหรับเรา:** สำหรับ outdoor signage (billboard, building facade, roadside) — พิสูจน์ traffic volume ให้ advertisers

**ระดับความยาก:** สูง  
**Impact:** กลาง-สูง (outdoor/DooH use case)

---

## 4. Content A/B Testing (Built-in)

**คำอธิบาย:** ทดสอบ content 2 แบบพร้อมกันเพื่อดูว่าแบบไหนได้ผลดีกว่า:
- แสดง Version A กับจอชุดหนึ่ง, Version B กับอีกชุด
- วัด metrics: dwell time, interaction rate, footfall change
- ระบุ winner อัตโนมัติ
- Switch ทุกจอไปใช้ winner

**ตัวอย่าง:**
```
Test: โปรโมชั่นใหม่ 2 แบบ
  Version A: รูปสินค้า + ราคา (5 สาขา)
  Version B: วิดีโอ lifestyle + QR code (5 สาขา)
  
Result: Version B → dwell time +40%, QR scans +200%
Action: Roll out Version B ทุกสาขา
```

**ต่างจาก platform อื่น:** ไม่มี platform ไหนที่มี built-in A/B testing สำหรับ signage content

**ประโยชน์สำหรับเรา:** Data-driven content optimization — ไม่ต้องเดาว่า content ไหนดี ให้ข้อมูลตัดสินใจ

**ระดับความยาก:** กลาง-สูง  
**Impact:** สูง (ROI optimization)

---

## 5. Multi-Level Scheduling (Hierarchical Rules)

**คำอธิบาย:** ระบบ scheduling แบบหลายระดับซ้อนกัน:
- Level 1: Campaign schedule (วัน-เวลาของ campaign)
- Level 2: Playlist rotation rules (ภายใน campaign)
- Level 3: Content-level rules (ภายใน playlist)
- ผสมกับ conditions: weather, audience demographics, time-of-day, location

**ตัวอย่าง:**
```
Campaign: "Summer Drinks" (1 มิ.ย. - 31 ส.ค.)
  ├─ Playlist A: "Morning Iced Coffee" (06:00-11:00)
  │   ├─ Content 1: ถ้าอุณหภูมิ > 30°C → แสดง
  │   └─ Content 2: ถ้า audience = ผู้หญิง → แสดง
  └─ Playlist B: "Afternoon Smoothie" (14:00-18:00)
      └─ Content 3: ถ้า demographics = Gen Z → แสดง
```

**ต่างจาก Yodeck 6-Level Priority:**
- Yodeck: กำหนด **ใครชนะ** เมื่อ conflict
- Navori: กำหนด **logic ซับซ้อน** ภายใน scheduling layer

**ประโยชน์สำหรับเรา:** สำหรับ retail/advertising ที่มี campaign ซับซ้อน — จัดการ scheduling แบบ hierarchical ไม่ใช่ flat timeline

**ระดับความยาก:** สูง  
**Impact:** สูง (advertising use case)

---

## 6. Touchless/Gesture Control + Presence Detection

**คำอธิบาย:** Interaction แบบไม่ต้องสัมผัส:
- **Presence Detection** — จอ "ตื่น" เมื่อมีคนเข้าใกล้
- **Hand Gesture Control** — โบกมือเปลี่ยน content
- **Touchless Triggers** — sensor ตรวจจับ movement

**Use cases:**
- โรงพยาบาล: ไม่ต้องสัมผัสจอ (hygiene)
- ร้านค้า: เดินเข้าใกล้ → จอแสดง content (attention-catching)
- Lobby: presence → welcome message

**ต่างจาก OptiSigns QR Scan-to-Interact:**
- OptiSigns: ใช้ smartphone เป็น remote
- Navori: ใช้ gesture + presence (ไม่ต้องมือถือเลย)

**ประโยชน์สำหรับเรา:** Post-COVID ผู้คนต้องการ touchless experiences — gesture/presence เป็น premium interaction mode

**ระดับความยาก:** สูง  
**Impact:** กลาง-สูง (niche premium)

---

## 7. On-Premise + Hybrid + Cloud Deployment Options

**คำอธิบาย:** เลือกวิธี deploy ได้ 3 แบบ:
- **Cloud** — ทุกอย่างอยู่บน cloud (เหมาะ SMB)
- **On-Premise** — ทุกอย่างอยู่ใน server ขององค์กร (เหมาะ regulated industries: ธนาคาร, ทหาร, สาธารณสุข)
- **Hybrid** — CMS บน cloud + content cache local / หรือ CMS local + remote access

**ต่างจาก platform อื่น:**
- Bizplay/ScreenCloud/Yodeck/OptiSigns: Cloud-only
- Appspace: Cloud + ส่วน on-premise บาง features
- BrightSign: หลาย publishing modes แต่ CMS เป็น cloud
- Navori: **full on-premise option** รวมถึง CMS server ตั้งใน network ลูกค้าเอง

**ประโยชน์สำหรับเรา:** ลูกค้าบางกลุ่ม (ธนาคาร, โรงพยาบาล, ราชการ, ทหาร) **ไม่สามารถใช้ cloud ได้** ด้วยเหตุผล compliance — ต้องมี on-premise option

**ระดับความยาก:** สูง (ต้อง maintain 2 deployment modes)  
**Impact:** สูง (เปิด market segment ใหม่)

---

## 8. Data Feed Manager (Centralized Live Data)

**คำอธิบาย:** ตัวกลางจัดการ data sources ทั้งหมด:
- เชื่อม CRM, ERP, BI tools (Power BI, Salesforce, SAP)
- Social media feeds (LinkedIn, Facebook, Instagram, X)
- Custom APIs + live data
- **จุดเดียวจัดการ data ทุก source** ไม่ต้อง configure ที่ content แต่ละชิ้น
- Data transformation + formatting ก่อนส่งไปจอ

**ต่างจาก OptiSigns OptiSync:**
- OptiSync: map spreadsheet/API → design elements (1:1)
- Navori Data Feed Manager: centralized hub จัดการ multiple data sources → ส่งไป multiple contents

**ประโยชน์สำหรับเรา:** สำหรับ enterprise ที่มี data sources หลายตัว — จัดการที่เดียวไม่ต้อง configure data connection ทุก content

**ระดับความยาก:** กลาง-สูง  
**Impact:** กลาง-สูง (enterprise data management)

---

## 9. Eco-Aware Viewer Detection (Green Signage)

**คำอธิบาย:** จอ "ฉลาดพอจะรู้ว่าไม่มีคนดู":
- ไม่มีคนอยู่หน้าจอ → ลดความสว่าง หรือ ปิดจอ
- มีคนเข้าใกล้ → เปิดจอ + แสดง content
- ลดการใช้พลังงานเมื่อไม่มีผู้ชม

**ต่างจาก Samsung VXT Energy Management:**
- Samsung: ตั้ง schedule เปิด/ปิดตามเวลา (time-based)
- Navori: เปิด/ปิดตาม **มีคนดูจริงหรือไม่** (presence-based)

**ประโยชน์สำหรับเรา:** ประหยัดไฟ + ยืดอายุจอ + ESG compliance — จอไม่เปิดเปล่าเมื่อไม่มีคน

**ระดับความยาก:** กลาง (ใช้ motion sensor หรือ camera)  
**Impact:** กลาง (energy + sustainability)

---

## 10. StiX 3800 — AI-Integrated Compact Player

**คำอธิบาย:** Navori player ที่รวม AI analytics + content playback ในตัว:
- ขนาดเท่า USB stick
- 4K@60fps native playback
- Power over Ethernet (PoE) — สาย LAN เส้นเดียวทั้งข้อมูลทั้งไฟ
- AI audience analytics built-in (footfall + dwell time)
- Screen status monitoring
- Hands-free setup (zero-touch)
- MTBF 50,000 hours (industrial grade)

**ประโยชน์สำหรับเรา (design inspiration):** 
- Player ของเราควรรองรับ PoE (ลดสายไฟ)
- AI analytics ควร run on-device (edge computing)
- Compact form factor สำคัญสำหรับ deployment

**ระดับความยาก:** Hardware design  
**Impact:** กลาง (hardware reference)

---

## สรุปจัดลำดับความสำคัญ

| ลำดับ | ฟีเจอร์ | ระดับความยาก | Impact | หมวด |
|-------|---------|-------------|--------|------|
| 1 | DooH Programmatic Advertising | สูงมาก | สูงมาก | Monetization |
| 2 | Composable/Modular Architecture | สูง | สูงมาก | Architecture |
| 3 | Content A/B Testing | กลาง-สูง | สูง | Analytics |
| 4 | On-Premise + Hybrid Deployment | สูง | สูง | Deployment |
| 5 | Multi-Level Scheduling | สูง | สูง | Scheduling |
| 6 | AI Vehicle Counting | สูง | กลาง-สูง | Analytics |
| 7 | Touchless/Gesture Control | สูง | กลาง-สูง | Interactive |
| 8 | Data Feed Manager (Hub) | กลาง-สูง | กลาง-สูง | Integration |
| 9 | Eco-Aware (Presence-Based Power) | กลาง | กลาง | Sustainability |
| 10 | PoE + Edge AI Player | Hardware | กลาง | Hardware |

---

## Key Takeaways จาก Navori

### สิ่งที่ Navori สอนเรา:

1. **Monetization is a Feature** — ถ้า platform มี DooH capabilities ลูกค้าสามารถสร้าง revenue จากจอ ไม่ใช่แค่ cost center

2. **Composable > Monolithic** — ให้ลูกค้าเลือก modules ตามความต้องการ ไม่ต้องจ่าย all-in-one ที่ใช้แค่ 30%

3. **On-Premise ยังจำเป็น** — regulated industries ต้องการ ถ้าไม่มีจะเสีย market segment สำคัญ

4. **A/B Testing = Signage Maturity** — เปลี่ยนจาก "guess what works" เป็น "measure what works"

5. **Edge AI > Cloud AI** — analytics ที่ run บน device เร็วกว่า + private กว่า + ไม่ต้องพึ่ง internet

---

## เปรียบเทียบ 8 Platforms ทั้งหมด

| หมวด | Winner | ทำไม |
|------|--------|------|
| Ease of Use | Bizplay | ง่ายที่สุด, no learning curve |
| AI Content Creation | Appspace | ครบที่สุด (generate + translate + author) |
| IT/Security | ScreenCloud | SOC2 + SSO + Audit + RDM |
| Value for Money | Yodeck | Features เยอะ + ราคาถูกสุด |
| Interactive/Retail | OptiSigns | QR interact + AI audience + POS |
| Hardware Integration | Samsung VXT | ISO27701 + Energy + SyncPlay |
| Player Reliability | BrightSign | Purpose-built OS + State Machine |
| Enterprise/Monetization | Navori | DooH + On-premise + Composable |

---

*วิเคราะห์จาก: https://navori.com/ และ documentation/news*  
*Content was rephrased for compliance with licensing restrictions*