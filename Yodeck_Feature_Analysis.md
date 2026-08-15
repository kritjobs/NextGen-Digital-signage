# Yodeck Feature Analysis — สำหรับ NextGen Digital Signage Platform
**วันที่วิเคราะห์:** 8 สิงหาคม 2026  
**แหล่งข้อมูล:** [Yodeck.com](https://www.yodeck.com/)  
**วัตถุประสงค์:** ศึกษาฟีเจอร์เพิ่มเติมที่ Bizplay, Appspace, ScreenCloud ไม่มีหรือทำได้ดีกว่า  
**หมายเหตุ:** Yodeck ได้อันดับ 1 จาก G2/Capterra 2025 สำหรับ SMB-Enterprise, 65,000+ accounts, 350,000+ screens, 135+ countries — เน้น value-for-money + feature-rich

---

## 1. Content Priority System (6-Level Hierarchy)

**คำอธิบาย:** Yodeck จัดระบบ playback เป็น 6 ระดับ priority ที่ชัดเจน — เมื่อมีมากกว่า 1 rule ใช้พร้อมกัน ระดับที่สูงกว่า override ระดับที่ต่ำกว่าอัตโนมัติ:

| Priority | Content Type | คำอธิบาย |
|----------|-------------|----------|
| 1 (สูงสุด) | Emergency Alerts | Override ทุกอย่าง |
| 2 | Screen Takeover | Manual override ชั่วคราว |
| 3 | Schedule | ตารางเวลาที่กำหนดไว้ |
| 4 | Playlist | Playlist ที่ assign ให้จอ |
| 5 | Filler/Default | Content เริ่มต้นเมื่อไม่มี schedule |
| 6 (ต่ำสุด) | Fallback | แสดงเมื่อไม่มี content อื่นเลย |

**ต่างจาก platform อื่น:** ไม่มี platform ไหนกำหนด priority hierarchy ชัดขนาดนี้ — ทำให้ predictable ว่าจอจะแสดงอะไรในทุกสถานการณ์

**ประโยชน์สำหรับเรา:** ออกแบบ Playlist Engine ให้มี clear priority hierarchy ตั้งแต่แรก — ป้องกันปัญหา "ทำไมจอแสดง content ผิด" ที่เกิดบ่อยมากกับ signage

**ระดับความยาก:** กลาง  
**Impact:** สูงมาก (system reliability)


---

## 2. Tag-Based Dynamic Playlists

**คำอธิบาย:** สร้าง playlist แบบ dynamic ที่เลือก content ตาม tags อัตโนมัติ:
- ติด tag "promotion-july" ให้ media → playlist ที่กำหนดไว้จะรวม content นั้นเข้ามาเอง
- เอา tag ออก → หายจาก playlist ทันที
- ไม่ต้อง manual add/remove ทีละ item
- ใช้ร่วมกับ Media Tag Filtering per Screen → จอแต่ละจุดแสดง content ต่างกันจาก playlist เดียวกัน

**ตัวอย่าง:** Tag "branch-A" + "food" → จอสาขา A แสดงเฉพาะ content อาหารของสาขา A

**ต่างจาก platform อื่น:** Bizplay/Appspace/ScreenCloud ใช้ manual playlist — ต้อง add content เข้า playlist ทีละตัว

**ประโยชน์สำหรับเรา:** ลดงาน content management สำหรับ deployment หลายจุด — tag เดียวกระจาย content ไปจอที่เกี่ยวข้องทั้งหมด

**ระดับความยาก:** กลาง  
**Impact:** สูง (operational efficiency)

---

## 3. Web Scripting Engine (Webpage Automation)

**คำอธิบาย:** ระบบ automation สำหรับ webpage ที่แสดงบนจอ:
- Auto-login (กรอก username/password อัตโนมัติ)
- Scroll to specific section
- Hide elements (ซ่อน menu bar, ads)
- Click buttons (เช่น dismiss cookie popup)
- Run custom JavaScript ภายในหน้า
- Auto-refresh ตาม timer
- **Webpage Recording Tool** — บันทึก interaction ด้วย browser extension โดยไม่ต้องเขียน code

**ต่างจาก ScreenCloud Secure Dashboards:**
- ScreenCloud = capture screenshot ของ dashboard
- Yodeck = run webpage จริงๆ + automate interaction ได้

**ประโยชน์สำหรับเรา:** แสดง internal web apps, dashboards, หรือ authenticated pages โดย automate ขั้นตอน login/navigation — flexible กว่า screenshot approach

**ระดับความยาก:** กลาง-สูง  
**Impact:** สูง (enterprise data display)


---

## 4. CAP (Common Alerting Protocol) Integration

**คำอธิบาย:** เชื่อมกับระบบ mass notification มาตรฐาน CAP (Alertus, Informacast, Punchalert, etc.):
- รับ alert จากระบบ CAP ภายนอก → แสดงบนจอ signage อัตโนมัติ
- Filter alerts ตาม workspace/location
- สร้าง CAP Handler หลายตัวได้ (แยกประเภท alert)
- เป็นมาตรฐาน OASIS ที่ใช้ในมหาวิทยาลัย, โรงงาน, อาคารขนาดใหญ่

**ต่างจาก platform อื่น:** ไม่มี platform ไหนรองรับ CAP protocol โดยตรง — Appspace มีแค่ manual alerts, ScreenCloud ไม่มี

**ประโยชน์สำหรับเรา:** สำหรับ campus/โรงงานที่มีระบบ mass notification อยู่แล้ว — signage ของเราเป็นส่วนหนึ่งของ emergency ecosystem ที่มีอยู่ ไม่ต้องจัดการแยก

**ระดับความยาก:** กลาง  
**Impact:** สูง (สำหรับ education/industrial segment)

---

## 5. Video Wall Support (Multi-Screen Sync)

**คำอธิบาย:** สร้าง video wall จากหลายจอ (2×2, 3×1, หรือ matrix ใดๆ):
- รองรับทั้ง landscape และ portrait screens รวมกัน
- Asymmetric video walls (จอขนาดต่างกัน)
- Synchronized playback ข้ามหลาย player
- ใช้ 1 player ต่อ 1 จอ + IP video streamer

**Playlist Sync:**
- Sync multiple players ให้เปลี่ยน content พร้อมกัน
- Sync 2 playlists ใน layout เดียวกัน

**ประโยชน์สำหรับเรา:** Video wall เป็น high-impact installation สำหรับ lobby, showroom, command center — ถ้า platform รองรับจะเปิด use case ระดับ premium

**ระดับความยาก:** สูง  
**Impact:** กลาง-สูง (premium use case)

---

## 6. HDMI-In / USB Camera / IPTV Live Feed

**คำอธิบาย:** แสดง live video feed จากแหล่งภายนอกบนจอ signage:
- **USB HDMI Capture** — ต่อ set-top box, กล้อง CCTV, หรือ device อื่นเข้า player
- **USB Camera** — แสดง webcam feed สด
- **IPTV/HLS/RTP/MPEG-TS** — stream จาก network source
- **Live TV** — แสดง TV สด + digital signage content พร้อมกันใน layout เดียวกัน
- **Change TV Source** — schedule สลับ HDMI input อัตโนมัติ

**ต่างจาก platform อื่น:** ScreenCloud มี Broadcast (stream จาก cloud) แต่ Yodeck มี local input (HDMI-in) ซึ่งไม่ต้องพึ่ง internet

**ประโยชน์สำหรับเรา:** ใช้จอ signage แสดง live TV + content ได้พร้อมกัน (เช่น ร้านอาหารแสดงกีฬาสด + เมนู, lobby แสดงข่าว + ข้อมูลองค์กร)

**ระดับความยาก:** กลาง (ต้อง support ที่ Android player)  
**Impact:** กลาง-สูง


---

## 7. Volume Level Scheduling

**คำอธิบาย:** ตั้ง schedule เปลี่ยนระดับเสียงอัตโนมัติตามเวลา/วัน:
- Peak hours (ห้างแน่น) → เพิ่มเสียง
- Off-peak → ลดเสียง
- กลางคืน → mute
- ตั้งได้หลาย schedule ต่อ player

**ต่างจาก platform อื่น:** ไม่มี platform อื่นที่มี volume scheduling แยกจาก content scheduling

**ประโยชน์สำหรับเรา:** สำหรับ deployment ที่ใช้เสียง (ร้านอาหาร, ห้าง, สนามกีฬา) — ปรับเสียงอัตโนมัติตามบริบทเวลา

**ระดับความยาก:** ต่ำ  
**Impact:** ต่ำ-กลาง

---

## 8. Schedule Download Hours (Bandwidth Management)

**คำอธิบาย:** กำหนดเวลาให้ player download content ใหม่เฉพาะช่วง off-peak:
- ป้องกันการ download content ขนาดใหญ่ตอนใช้ internet เยอะ
- เหมาะสำหรับ location ที่ bandwidth จำกัด
- กำหนด time window สำหรับ sync

**ประโยชน์สำหรับเรา:** สำหรับ remote locations หรือ 4G/LTE connections ที่ bandwidth แพงหรือจำกัด

**ระดับความยาก:** ต่ำ  
**Impact:** กลาง (สำหรับ remote deployment)

---

## 9. Media Expiration (Auto-Remove Outdated Content)

**คำอธิบาย:** กำหนดวันหมดอายุให้ media แต่ละชิ้น:
- ถึงวันหมดอายุ → skip อัตโนมัติ ไม่แสดงอีก
- ไม่ต้อง manual ลบ/ซ่อน
- ป้องกันแสดง promotion ที่หมดแล้ว
- รวมกับ schedule ได้ (หมดอายุ + ช่วงเวลา)

**ประโยชน์สำหรับเรา:** ป้องกันปัญหา "โปรโมชั่นเดือนที่แล้วยังแสดงอยู่" — content หมดอายุเองอัตโนมัติ

**ระดับความยาก:** ต่ำ  
**Impact:** กลาง-สูง (content hygiene)

---

## 10. Fallback Image (Graceful Degradation)

**คำอธิบาย:** ถ้า webpage/content โหลดไม่ได้ (internet down, server error):
- แสดง fallback image แทนจอดำ
- Webpage preloading — โหลดหน้าล่วงหน้าก่อนแสดง
- ป้องกัน "white screen" หรือ error page ปรากฏบนจอ

**ประโยชน์สำหรับเรา:** "จอต้องไม่ดำเด็ดขาด" — กฎทองของ digital signage ควรมี fallback ทุกระดับ:
- Content level: fallback image per item
- Playlist level: filler content
- Screen level: default content
- Network level: offline cache

**ระดับความยาก:** ต่ำ  
**Impact:** สูง (professional appearance)


---

## 11. In-Map Screen Visualization

**คำอธิบาย:** แสดงจอทั้งหมดบนแผนที่ (map view):
- เห็น location ของทุกจอบน map
- ดู status (online/offline) จาก map view
- จัดการจอตาม geographic location
- ง่ายสำหรับ deployment หลาย branch/สาขา

**ประโยชน์สำหรับเรา:** สำหรับ admin ที่ดูแลจอหลายร้อยจุด — map view ช่วยให้เห็นภาพรวม deployment ทั้งหมด + identify จอที่ offline ได้ทันที

**ระดับความยาก:** กลาง  
**Impact:** กลาง (UX improvement)

---

## 12. Workspace Hierarchies (5-Level Deep)

**คำอธิบาย:** โครงสร้างองค์กรแบบ hierarchical สูงสุด 5 ระดับ:
- ตัวอย่าง: Company → Region → Country → City → Branch
- แต่ละ workspace มี content/users/screens แยก
- Emergency alerts กระจายตาม workspace tree
- Content sharing ข้าม workspace ได้ (top-down)
- Chart diagram แสดง hierarchy ทั้งหมด

**ต่างจาก platform อื่น:**
- Bizplay: Dashboard เดียว (flat)
- Appspace: Dashboard + location hierarchy
- ScreenCloud: Spaces (2 levels)
- Yodeck: 5-level hierarchy (ลึกที่สุด)

**ประโยชน์สำหรับเรา:** รองรับ enterprise ที่มีโครงสร้างซับซ้อน — franchise, multi-national, multi-campus

**ระดับความยาก:** กลาง-สูง  
**Impact:** สูง (enterprise scalability)

---

## 13. Playlists from Cloud Storage (Auto-Sync)

**คำอธิบาย:** สร้าง playlist ที่เชื่อมกับ folder ใน cloud storage:
- **Google Drive** — เพิ่มไฟล์ใน folder → ปรากฏบนจออัตโนมัติ
- **Dropbox** — เหมือนกัน
- **SharePoint** — สำหรับ enterprise
- **OneDrive** — สำหรับ Microsoft ecosystem
- **CSV import** — สร้าง playlist จาก CSV file

**ประโยชน์สำหรับเรา:** ผู้ใช้ที่ไม่อยากเข้า admin panel — แค่ drop file ลง folder ที่คุ้นเคย → ปรากฏบนจอ ลด friction ในการ update content อย่างมาก

**ระดับความยาก:** กลาง  
**Impact:** กลาง-สูง (user adoption)

---

## 14. 800+ Free Templates (Industry-Specific)

**คำอธิบาย:** Template library ขนาดใหญ่ที่สุดในอุตสาหกรรม:
- แบ่งตามอุตสาหกรรม (restaurant, retail, healthcare, education, etc.)
- รองรับทั้ง landscape และ portrait
- เชื่อมกับ live data (PowerBI, Google Analytics, social feeds, weather)
- ฟรีทุก plan
- Lockable layouts — ล็อค element ไม่ให้แก้

**ประโยชน์สำหรับเรา:** Template library ขนาดใหญ่เป็น key driver ของ user adoption — ผู้ใช้เริ่มต้นได้เร็วโดยไม่ต้อง design จากศูนย์

**ระดับความยาก:** กลาง (ต้องสร้าง templates จำนวนมาก)  
**Impact:** สูง (user onboarding)

---

## 15. Player Security Lockdown + Storage Encryption

**คำอธิบาย:** Security features เฉพาะ player device:
- **Security Lockdown** — ป้องกันคนที่เข้าถึง device กายภาพ tamper ระบบ
- **Storage Encryption** — encrypt ทุก media file + credentials บน player
- **Lock Mode (Android)** — ล็อคจอไว้ที่ app เดียว ไม่ให้ออกไป
- **SSH Access** — สำหรับ IT ที่ต้อง debug
- **IP Whitelist** — จำกัด IP ที่ login เข้า admin ได้
- **Custom Password Policy** — กำหนด password rules, expiry
- **Security Session Policies** — auto-logout, single session

**ประโยชน์สำหรับเรา:** Android player ของเราต้องมี:
- Kiosk mode (ล็อคไม่ให้ออกจาก app)
- Encrypted storage (media + credentials)
- Tamper detection
- Remote wipe capability

**ระดับความยาก:** กลาง  
**Impact:** สูง (enterprise security requirement)


---

## 16. Sub-Playlists (Nested Playlist Management)

**คำอธิบาย:** สร้าง playlist ซ้อน playlist:
- Playlist A มี sub-playlist B, C, D
- แก้ sub-playlist → update ทุกที่ที่ใช้
- แยก permission ต่อ sub-playlist (แผนก A จัดการส่วนของตัวเอง)
- จัดการ content หลายร้อยชิ้นได้ง่าย

**ประโยชน์สำหรับเรา:** สำหรับ deployment ขนาดใหญ่ที่มี content structure ซับซ้อน — เช่น playlist "รวม" ที่ประกอบจาก playlist ย่อยของแต่ละแผนก

**ระดับความยาก:** ต่ำ-กลาง  
**Impact:** กลาง

---

## 17. Timezone-Aware Scheduling

**คำอธิบาย:** แต่ละ player มี timezone setting แยก:
- Schedule "เล่นเวลา 9:00" → ทุก player เริ่มตอน 9:00 ตาม timezone ของตัวเอง
- ไม่ต้องสร้าง schedule แยกสำหรับแต่ละ timezone
- เหมาะสำหรับ multi-country deployment

**ประโยชน์สำหรับเรา:** จำเป็นสำหรับ organization ที่มีจอหลาย timezone — schedule เดียวใช้ได้ทุกที่

**ระดับความยาก:** ต่ำ  
**Impact:** กลาง

---

## สรุปจัดลำดับความสำคัญ (เฉพาะที่เพิ่มจาก 3 platform ก่อนหน้า)

| ลำดับ | ฟีเจอร์ | ระดับความยาก | Impact | หมวด |
|-------|---------|-------------|--------|------|
| 1 | Content Priority System (6-Level) | กลาง | สูงมาก | Architecture |
| 2 | Tag-Based Dynamic Playlists | กลาง | สูง | Content Mgmt |
| 3 | Web Scripting Engine | กลาง-สูง | สูง | Integration |
| 4 | CAP Emergency Protocol | กลาง | สูง | Safety |
| 5 | Fallback Image System | ต่ำ | สูง | Reliability |
| 6 | Media Expiration | ต่ำ | กลาง-สูง | Content Mgmt |
| 7 | Video Wall Sync | สูง | กลาง-สูง | Display |
| 8 | HDMI-In / Live TV | กลาง | กลาง-สูง | Content |
| 9 | Cloud Storage Playlists | กลาง | กลาง-สูง | Integration |
| 10 | Workspace Hierarchy (5-Level) | กลาง-สูง | สูง | Architecture |
| 11 | Player Security (Encrypt+Lock) | กลาง | สูง | Security |
| 12 | In-Map Visualization | กลาง | กลาง | UX |
| 13 | 800+ Templates | กลาง | สูง | Onboarding |
| 14 | Volume Scheduling | ต่ำ | ต่ำ-กลาง | Scheduling |
| 15 | Download Hour Scheduling | ต่ำ | กลาง | Network |
| 16 | Sub-Playlists | ต่ำ-กลาง | กลาง | Content Mgmt |
| 17 | Timezone-Aware Scheduling | ต่ำ | กลาง | Scheduling |

---

## เปรียบเทียบ 4 Platforms — จุดเด่นเฉพาะ

| หมวด | Bizplay | Appspace | ScreenCloud | Yodeck |
|------|---------|----------|-------------|--------|
| Target Market | SMB | Enterprise | Mid-Enterprise | SMB-Enterprise |
| Pricing | €€ | €€€€ | €€€ | € (ถูกสุด) |
| Template Library | น้อย | ปานกลาง | ปานกลาง | ✅ 800+ (เยอะสุด) |
| Priority System | ไม่มี | ไม่ชัด | ไม่ชัด | ✅ 6-level (ดีสุด) |
| Tag-Based Playlist | ไม่มี | ไม่มี | ไม่มี | ✅ มี |
| CAP Protocol | ไม่มี | ไม่มี | ไม่มี | ✅ มี |
| Web Scripting | ไม่มี | ไม่มี | ไม่มี | ✅ มี |
| Video Wall | ไม่มี | ไม่มี | ไม่ชัด | ✅ ครบ |
| HDMI-In/Live TV | ไม่มี | ไม่มี | ไม่มี | ✅ มี |
| Cloud Storage Sync | ไม่มี | ไม่มี | Dropbox/OneDrive | ✅ Drive/Dropbox/SharePoint/OneDrive |
| AI Content | ไม่มี | ✅ ครบสุด | Quick Post AI | ไม่มี |
| Live Broadcast | ไม่มี | ไม่มี | ✅ ครบสุด | ไม่มี |
| Room Booking | ไม่มี | ✅ ครบสุด | ไม่มี | ไม่มี |
| GraphQL API | ไม่มี | Webhook | ✅ ครบสุด | REST API |
| Fallback System | ไม่ชัด | ไม่ชัด | ไม่ชัด | ✅ multi-level |

---

## Updated Master Roadmap — รวมทั้ง 4 Platforms

### Tier 1: Foundation (ต้องมีก่อน launch)
| # | Feature | Source | ทำไม |
|---|---------|--------|------|
| 1 | Content Priority System (6-Level) | Yodeck | Predictable playback logic |
| 2 | Multi-Level Fallback (จอไม่ดำ) | Yodeck | Professional reliability |
| 3 | Enterprise Security (SSO, RBAC, Audit, Encrypt) | ScreenCloud+Yodeck | Enterprise gating |
| 4 | Remote Device Management | ScreenCloud | Reduce ops cost |
| 5 | Multi-Zone Layout | Appspace | Expected feature |
| 6 | Emergency Alerts + CAP Protocol | Yodeck+Appspace | Safety requirement |
| 7 | Media Expiration | Yodeck | Content hygiene |
| 8 | Full REST API | ScreenCloud+Yodeck | Integration |

### Tier 2: Differentiation (Phase 2)
| # | Feature | Source | ทำไม |
|---|---------|--------|------|
| 9 | Tag-Based Dynamic Playlists | Yodeck | Smart content distribution |
| 10 | Content Trigger (HTTP/Webhook) | Bizplay | IoT/automation |
| 11 | Live Broadcast / Takeover | ScreenCloud | Unique value |
| 12 | Lockable Templates | ScreenCloud+Yodeck | Brand governance |
| 13 | Cloud Storage Playlists | Yodeck | User adoption |
| 14 | Web Scripting Engine | Yodeck | Dashboard display |
| 15 | Workspace Hierarchy | Yodeck | Enterprise structure |
| 16 | Proof of Play | ScreenCloud | Monetization |

### Tier 3: Advanced (Phase 3)
| # | Feature | Source | ทำไม |
|---|---------|--------|------|
| 17 | AI Content Generation | Appspace | Productivity |
| 18 | AI Auto Translation | Appspace | Multi-language |
| 19 | Video Wall Sync | Yodeck | Premium use case |
| 20 | HDMI-In / Live TV | Yodeck | Content flexibility |
| 21 | Content Acknowledgement | Appspace | Compliance |
| 22 | Mixin/Priority Interrupt | Bizplay | Scheduling flex |
| 23 | App Plugin System | Bizplay | Extensibility |
| 24 | Volume Scheduling | Yodeck | Audio management |

### Tier 4: Platform Expansion (อนาคต)
| # | Feature | Source | ทำไม |
|---|---------|--------|------|
| 25 | Space Reservation | Appspace | New use case |
| 26 | Omni-Channel Publishing | Appspace | Platform growth |
| 27 | Visitor Management | Appspace | Lobby solution |
| 28 | White-Label Program | ScreenCloud+Yodeck | Partner channel |
| 29 | 800+ Template Library | Yodeck | Onboarding |
| 30 | In-Map Visualization | Yodeck | Admin UX |

---

*วิเคราะห์จาก: https://www.yodeck.com/ และ documentation*  
*Content was rephrased for compliance with licensing restrictions*