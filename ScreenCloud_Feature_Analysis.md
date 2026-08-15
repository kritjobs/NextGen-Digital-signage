# ScreenCloud Feature Analysis — สำหรับ NextGen Digital Signage Platform
**วันที่วิเคราะห์:** 8 สิงหาคม 2026  
**แหล่งข้อมูล:** [ScreenCloud.com](https://www.screencloud.com/)  
**วัตถุประสงค์:** ศึกษาฟีเจอร์เพิ่มเติมที่ Bizplay และ Appspace ไม่มีหรือทำได้ดีกว่า  
**หมายเหตุ:** ScreenCloud เน้น "Full-Stack Digital Signage" — ทั้ง software + hardware + security เหมาะเป็น reference สำหรับ IT-focused enterprise features, SOC 2 Type 2 certified

---

## 1. Live Broadcast / Screen Takeover

**คำอธิบาย:** ระบบ Live Streaming ที่ broadcast จาก Zoom/OBS/Teams ไปยังจอ signage ทั้งหมดในองค์กรได้ทันที:
- ใช้เทคโนโลยี low-latency เดียวกับ Twitch
- Password protection + authentication
- Takeover จอทั้งหมดโดยไม่กระทบ schedule ปกติ (พอจบ broadcast กลับไปเล่น content เดิม)
- ผู้ชมส่ง emoji reactions ได้ real-time
- ไม่จำกัดจำนวนผู้ชม
- Schedule broadcast ล่วงหน้าได้

**ประโยชน์สำหรับเรา:** ฟีเจอร์ที่ **ไม่มีใน Bizplay หรือ Appspace (ระดับนี้)** — ถ่ายทอดสดการประชุม All Hands, Town Hall, ประกาศ CEO ไปยังจอทุกจุดในองค์กร ลด friction ในการสื่อสารแบบ real-time

**Use cases:**
- CEO Town Hall → ทุกจอแสดง live
- Emergency briefing → takeover ทุกจอ
- Training session → stream ไปจอในโรงงาน
- Event live → lobby screens แสดง live

**ระดับความยาก:** สูง  
**Impact:** สูงมาก (unique differentiator)

---

## 2. Secure Dashboard Display (Login Recording)

**คำอธิบาย:** วิธีแสดง dashboard ที่ต้อง login (Grafana, PowerBI, Tableau, etc.) บนจอ signage อย่างปลอดภัย:
- ใช้ Chrome extension บันทึก "login journey" (ขั้นตอนการ login)
- ScreenCloud replay login steps บน backend
- Credentials ไม่ถูกเก็บ plaintext หรือส่งไปยัง screen
- จอแสดง live snapshot ของ dashboard (refresh ทุก ~5 วินาที)
- รองรับ Grafana, PowerBI, Tableau, Klipfolio, Looker, etc.

**ประโยชน์สำหรับเรา:** ปัญหาใหญ่ของ signage คือการแสดง dashboard ที่ต้อง authentication — ScreenCloud แก้ด้วยวิธี "login recording" ที่ปลอดภัยกว่าการฝัง credentials ไว้ใน URL

**สิ่งที่ควร implement:**
- Secure proxy ที่ replay authentication
- Dashboard snapshot renderer
- Support popular BI tools
- ไม่ expose credentials ที่ screen/player

**ระดับความยาก:** สูง  
**Impact:** สูง (enterprise must-have)

---

## 3. Remote Device Management (RDM) ครบวงจร

**คำอธิบาย:** จัดการ device ระยะไกลแบบครบวงจร จากที่เดียว:

| Feature | รายละเอียด |
|---------|-----------|
| Restart Player | สั่ง restart app ระยะไกล |
| Reboot Device | สั่ง reboot เครื่องทั้งหมด |
| Screenshot | ถ่ายภาพหน้าจอปัจจุบัน (Proof of Play) |
| Clear Cache | ล้าง cache/sensitive files ระยะไกล |
| HDMI CEC | ควบคุม TV (เปิด/ปิด/สลับ input) |
| Network Settings | เปลี่ยน WiFi/network ระยะไกล |
| Update Certificates | อัปเดต security certs |
| Device Info | IP, MAC, storage, memory, temperature |
| Health Monitoring | ตรวจสอบสุขภาพ device ต่อเนื่อง |
| Custom Daily Restart | ตั้งเวลา restart อัตโนมัติทุกวัน |
| Offline Notifications | แจ้งเตือน email เมื่อ device offline |
| Canary Channel | ทดสอบ firmware ใหม่กับ device บางตัวก่อน |

**ประโยชน์สำหรับเรา:** ลดการ "ไปเยี่ยมหน้าจอ" ซึ่งเป็น pain point ใหญ่มากสำหรับ deployment หลายจุด ScreenCloud ทำได้ละเอียดที่สุดจาก 3 platform ที่ศึกษา

**ระดับความยาก:** กลาง-สูง  
**Impact:** สูงมาก (operational efficiency)

---

## 4. Playgrounds (In-Browser Code Editor)

**คำอธิบาย:** Code editor ภายใน platform สำหรับสร้าง custom content ด้วย HTML/CSS/JavaScript โดยไม่ต้องจัดการ hosting:
- Paste HTML/CSS/JS → run บนจอได้เลย
- ดึงข้อมูลจาก APIs/webhooks
- สร้าง automated dashboard ที่ update ผ่าน webhook
- ใช้ AI (ChatGPT) วาด sketch → generate code → paste ลง Playgrounds
- ไม่ต้อง setup server หรือ domain

**ประโยชน์สำหรับเรา:** ต่างจาก Bizplay Custom Apps ที่ต้องเขียน app แยก — Playgrounds ให้เขียน code ตรงใน platform เลย เหมาะสำหรับ:
- Prototype widget ใหม่
- แสดง real-time data จาก internal API
- สร้าง custom visualization
- ทดลอง layout/animation

**ระดับความยาก:** กลาง  
**Impact:** สูง (developer-friendly)

---

## 5. Canvas — Built-in Design Editor + Lockable Templates

**คำอธิบาย:** เครื่องมือ design ภายใน platform (ไม่ต้องใช้ Canva/Figma ภายนอก):
- Drag-and-drop editor สำหรับ signage content
- Template gallery สำเร็จรูป (menu board, poster, notice, etc.)
- **Lockable elements** — ล็อค element บาง element (logo, footer) ไม่ให้แก้ไข
- Save design เป็น reusable template
- Share/duplicate template ข้าม team
- Permission levels ต่อ template

**จุดเด่นที่ต่างจาก Appspace:**
- **Lockable areas** — admin สร้าง template ที่ lock ส่วน brand elements ได้ ผู้ใช้ทั่วไปเปลี่ยนได้เฉพาะ content area
- ป้องกัน off-brand content อย่างมีประสิทธิภาพ

**ประโยชน์สำหรับเรา:** สร้าง template system ที่:
- Admin ล็อค brand elements (logo position, color, footer)
- ผู้ใช้แต่ละแผนกแก้ไขได้เฉพาะ content zone
- แชร์ template ข้าม department
- ลดการสร้าง content off-brand เป็นศูนย์

**ระดับความยาก:** กลาง  
**Impact:** สูง

---

## 6. Quick Post (AI-Enhanced Instant Notices)

**คำอธิบาย:** สร้าง notice/sign แบบด่วนสุด ภายใน 30 วินาที:
- พิมพ์ข้อความ → เลือก Style Pack → ได้ sign พร้อม publish
- AI ช่วยปรับปรุง text (rewrite, improve, translate)
- QR code for file downloads (แนบไฟล์ให้ scan download)
- Text formatting (bold, italic, bullet points)
- ไม่ต้องเข้า design editor เลย

**ประโยชน์สำหรับเรา:** "Zero-effort content creation" สำหรับกรณีเร่งด่วน — ผู้จัดการร้านต้องประกาศ "ปิดซ่อมชั้น 3 วันนี้" ไม่ต้องเข้า editor ใหญ่ แค่พิมพ์ → publish

**ระดับความยาก:** ต่ำ  
**Impact:** กลาง-สูง (user satisfaction)

---

## 7. Spaces (Multi-Tenant with Content Sharing)

**คำอธิบาย:** แบ่ง account เป็น "Spaces" แยกอิสระ + สามารถ share content ข้าม Space ได้:
- แต่ละ Space = mini-account อิสระ (screens, content, users)
- Space-based billing — จ่ายตาม space ที่ใช้
- Admin share content ข้าม space ได้ (เช่น corporate branding ไปทุก branch)
- Permission แยกต่าง space

**ต่างจาก Appspace Multi-Dashboard:**
- Appspace = dashboard แยก แต่ยังอยู่ใน account เดียว
- ScreenCloud Spaces = แยกจริงๆ เหมือน sub-account + share ข้ามได้

**ประโยชน์สำหรับเรา:** สำหรับ franchise/multi-branch — สำนักงานใหญ่ push content ลง branch ได้ แต่ branch ก็จัดการ local content เอง

**ระดับความยาก:** กลาง-สูง  
**Impact:** สูง

---

## 8. Proof of Play (Content Verification)

**คำอธิบาย:** ระบบพิสูจน์ว่า content ถูกแสดงบนจอจริง:
- Log ทุก content ที่แสดง + timestamp + duration
- Screenshot capture เป็นหลักฐาน
- Report สำหรับ advertiser/stakeholder
- ตรวจสอบว่าไม่มี "black screen" หรือ content ไม่แสดง

**ประโยชน์สำหรับเรา:** จำเป็นสำหรับ:
- ขาย ad space บนจอ → ต้องพิสูจน์ว่า ad ถูกแสดงจริง
- Compliance → พิสูจน์ว่า safety message ถูกแสดงตาม schedule
- SLA monitoring → ตรวจจับ downtime

**ระดับความยาก:** กลาง  
**Impact:** สูง (monetization enabler)

---

## 9. Enterprise Security Stack

**คำอธิบาย:** ชุด security features ที่ IT department ต้องการ:
- **SOC 2 Type 2** compliance (audit ปีละครั้ง)
- **SSO** (SAML/OIDC) integration
- **Audit logging** — ทุก action ถูก log (ใครทำอะไร เมื่อไหร่)
- **Granular permissions** — custom roles
- **Data encryption** ทั้ง at-rest และ in-transit
- **Activity tracking** per screen/app/playlist/channel
- **White-label** — rebrand ScreenCloud เป็นชื่อองค์กร

**ประโยชน์สำหรับเรา:** ถ้าจะขาย enterprise ต้องมี:
- Audit log ทุก action
- SSO integration (Azure AD, Okta, Google)
- Role-based access control (RBAC) แบบ granular
- Encryption standards
- Compliance certifications

**ระดับความยาก:** กลาง-สูง  
**Impact:** สูงมาก (enterprise gating requirement)

---

## 10. GraphQL API (Full Platform Control via Code)

**คำอธิบาย:** API ระดับ platform ที่ทำได้ทุกอย่างที่ UI ทำ:
- GraphQL queries & mutations
- Automate content publishing
- Integrate กับ CI/CD pipelines
- Trigger content changes จาก external systems
- Build custom admin panels
- Stream Deck / physical button control

**ต่างจาก Bizplay HTTP trigger:**
- Bizplay = trigger playlist change เท่านั้น
- ScreenCloud GraphQL = full platform control (CRUD screens, content, schedules, users)

**ประโยชน์สำหรับเรา:** เปิด platform เป็น "headless CMS for screens" — ให้ developer integrate อะไรก็ได้:
- Stream Deck button → เปลี่ยน content
- Siri/Google command → switch channel
- CI/CD deploy → update signage content
- IoT sensor → change playlist
- Zapier/Make automation

**ระดับความยาก:** กลาง  
**Impact:** สูงมาก (platform extensibility)

---

## 11. HDMI CEC Control (TV Power Management)

**คำอธิบาย:** ควบคุม TV ผ่าน HDMI CEC protocol:
- เปิด/ปิด TV ตาม schedule (ประหยัดไฟ)
- สลับ HDMI input
- ปิดจอตอนนอกเวลาทำงาน อัตโนมัติ
- Wake-on-LAN

**ประโยชน์สำหรับเรา:** ลดค่าไฟ + ยืดอายุจอ — โดยเฉพาะสำหรับ deployment จำนวนมาก ที่ปิดจอนอกเวลาทำงานช่วยประหยัดค่าใช้จ่ายมาก

**ระดับความยาก:** ต่ำ (ใน Android player)  
**Impact:** กลาง (operational cost saving)

---

## 12. Custom Daily Restart + Health Monitoring

**คำอธิบาย:** ตั้งเวลา restart device อัตโนมัติทุกวัน + ตรวจสอบสุขภาพต่อเนื่อง:
- Auto-restart ตีสอง (ป้องกัน memory leak)
- Monitor temperature, storage, memory
- Alert เมื่อค่าผิดปกติ
- Predict device failure ก่อนเกิด

**ประโยชน์สำหรับเรา:** "Set and forget" reliability — ลด downtime จาก device issues โดยไม่ต้อง manual intervention

**ระดับความยาก:** ต่ำ  
**Impact:** กลาง (reliability)

---

## 13. Offline Notifications + Status Monitoring

**คำอธิบาย:** ระบบแจ้งเตือนเมื่อ device offline:
- Email notification ทันทีที่ device หลุด
- Live status dashboard แสดง online/offline ทั้งหมด
- Historical uptime data
- ตรวจจับจอดำ (black screen detection)

**ประโยชน์สำหรับเรา:** "รู้ก่อนผู้จัดการส่ง email มาบอก" — proactive monitoring แทนที่จะ reactive

**ระดับความยาก:** ต่ำ-กลาง  
**Impact:** กลาง-สูง

---

## 14. Stream Deck / Physical Button Integration

**คำอธิบาย:** ใช้ Stream Deck หรือ physical button สลับ content ด้วยปุ่มเดียว:
- กดปุ่ม → เปลี่ยน playlist/channel ทันที
- ใช้ keyboard shortcut
- Siri/Google Automator integration
- ผ่าน GraphQL API

**ประโยชน์สำหรับเรา:** สำหรับ live events, reception desk, หรือสถานการณ์ที่ต้องเปลี่ยน content ทันทีโดย non-technical staff — กดปุ่มเดียวไม่ต้องเปิด admin panel

**ระดับความยาก:** ต่ำ (ถ้ามี API อยู่แล้ว)  
**Impact:** กลาง

---

## 15. White-Label / Custom Branding of Platform

**คำอธิบาย:** Rebrand ScreenCloud UI ทั้งหมดเป็นชื่อ/สีขององค์กร:
- เปลี่ยน color scheme ของ admin console
- Upload custom logo
- Custom domain
- เหมาะสำหรับ reseller/agency

**ประโยชน์สำหรับเรา:** ถ้าต้องการขายผ่าน partner/reseller — ให้ partner rebrand เป็นชื่อตัวเอง (White-label model)

**ระดับความยาก:** ต่ำ-กลาง  
**Impact:** กลาง (business model enabler)

---

## สรุปจัดลำดับความสำคัญ (เฉพาะที่เพิ่มจาก Bizplay + Appspace)

| ลำดับ | ฟีเจอร์ | ระดับความยาก | Impact | หมวด |
|-------|---------|-------------|--------|------|
| 1 | Live Broadcast / Takeover | สูง | สูงมาก | Content |
| 2 | Remote Device Management (Full) | กลาง-สูง | สูงมาก | Operations |
| 3 | GraphQL API (Full Platform) | กลาง | สูงมาก | Developer |
| 4 | Enterprise Security Stack | กลาง-สูง | สูงมาก | Security |
| 5 | Secure Dashboard Display | สูง | สูง | Content |
| 6 | Proof of Play | กลาง | สูง | Analytics |
| 7 | Canvas + Lockable Templates | กลาง | สูง | Content |
| 8 | Playgrounds (Code Editor) | กลาง | สูง | Developer |
| 9 | Spaces (True Multi-Tenant) | กลาง-สูง | สูง | Architecture |
| 10 | Quick Post (Instant Notices) | ต่ำ | กลาง-สูง | Content |
| 11 | HDMI CEC Control | ต่ำ | กลาง | Operations |
| 12 | Daily Restart + Health Monitor | ต่ำ | กลาง | Operations |
| 13 | Offline Notifications | ต่ำ-กลาง | กลาง-สูง | Operations |
| 14 | Stream Deck Integration | ต่ำ | กลาง | UX |
| 15 | White-Label Platform | ต่ำ-กลาง | กลาง | Business |

---

## เปรียบเทียบจุดเด่นเฉพาะของแต่ละ Platform

| หมวด | Bizplay (ดีที่สุด) | Appspace (ดีที่สุด) | ScreenCloud (ดีที่สุด) |
|------|-------------------|--------------------|-----------------------|
| Ease of Use | ✅ ง่ายที่สุด | - | - |
| AI Content | - | ✅ ครบที่สุด | Quick Post + AI |
| Security | - | - | ✅ SOC2, SSO, Audit |
| Device Control | - | - | ✅ RDM ครบที่สุด |
| Live Streaming | - | - | ✅ Broadcast |
| API/Developer | Custom Apps (JS) | Webhook | ✅ GraphQL full |
| Workplace Mgmt | - | ✅ Room booking, Visitor | - |
| Multi-Tenant | Channels | Dashboards | ✅ Spaces (true) |
| Compliance | - | ✅ Acknowledgement | Proof of Play |
| Design Tool | Canva export | AI Generation | ✅ Canvas + Lock |
| Scheduling | Mixin, Constraints | Content Calendar | Broadcast schedule |
| Trigger System | ✅ HTTP + IFTTT | Webhook | API + Stream Deck |

---

## Roadmap รวม 3 Platforms — สิ่งที่เราควรมี

### Must-Have (ต้องมีก่อน launch)
| # | Feature | แหล่งอ้างอิง | ทำไม |
|---|---------|-------------|------|
| 1 | Enterprise Security (SSO, RBAC, Audit Log) | ScreenCloud | Enterprise จะไม่ซื้อถ้าไม่มี |
| 2 | Remote Device Management | ScreenCloud | ลด operational cost |
| 3 | Multi-Zone Layout | Appspace | Basic expected feature |
| 4 | 3-Tier Alert System | Appspace | Safety requirement |
| 5 | Proof of Play | ScreenCloud | Advertiser/compliance requirement |
| 6 | Full REST/GraphQL API | ScreenCloud | Integration capability |

### Should-Have (Phase 2)
| # | Feature | แหล่งอ้างอิง | ทำไม |
|---|---------|-------------|------|
| 7 | Content Trigger (HTTP/Webhook) | Bizplay | IoT/automation |
| 8 | Mixin/Priority Interrupt | Bizplay | Content flexibility |
| 9 | Lockable Templates | ScreenCloud | Brand governance |
| 10 | Quick Post / Instant Notices | ScreenCloud | User adoption |
| 11 | Live Broadcast / Takeover | ScreenCloud | Unique differentiator |
| 12 | Secure Dashboard Display | ScreenCloud | Enterprise data viz |

### Nice-to-Have (Phase 3+)
| # | Feature | แหล่งอ้างอิง | ทำไม |
|---|---------|-------------|------|
| 13 | AI Content Generation | Appspace | Productivity |
| 14 | AI Auto Translation | Appspace | Multi-language |
| 15 | Space Reservation | Appspace | Expand use case |
| 16 | Content Acknowledgement | Appspace | Compliance |
| 17 | Playgrounds (Code Editor) | ScreenCloud | Developer love |
| 18 | App Plugin System | Bizplay | Extensibility |
| 19 | White-Label | ScreenCloud | Partner channel |
| 20 | Omni-Channel Publishing | Appspace | Platform expansion |

---

*วิเคราะห์จาก: https://www.screencloud.com/ และ help/community documentation*  
*Content was rephrased for compliance with licensing restrictions*
