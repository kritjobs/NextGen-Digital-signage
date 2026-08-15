# Master Competitor Analysis Summary
## NextGen Digital Signage Platform — Feature Research
**วันที่:** 8 สิงหาคม 2026  
**จำนวน Platforms ที่วิเคราะห์:** 13  
**วัตถุประสงค์:** รวบรวมฟีเจอร์ทั้งหมดจากทุก platform เพื่อกำหนด roadmap ของ NextGen

---

## 1. Platforms ที่วิเคราะห์

| # | Platform | ประเภท | จุดเด่นหลัก | Target Market |
|---|----------|--------|-------------|---------------|
| 1 | Bizplay | Cloud CMS | ง่ายที่สุด, Mixin, HTTP Trigger | SMB |
| 2 | Appspace | Enterprise CMS | AI Content + Workplace + Room Booking | Enterprise |
| 3 | ScreenCloud | Enterprise CMS | Security + Live Broadcast + GraphQL | Mid-Enterprise |
| 4 | Yodeck | Cloud CMS | 6-Level Priority + Tag Playlists + Value | SMB-Enterprise |
| 5 | OptiSigns | Cloud CMS | AI Audience + QR Interact + POS | Retail/Interactive |
| 6 | Samsung VXT | HW + CMS | ISO27701 + Energy + SyncPlay | Samsung ecosystem |
| 7 | BrightSign | HW Player | State Machine + Purpose-Built OS | Industrial deployment |
| 8 | Navori | Enterprise + DooH | Composable + A/B Test + Monetization | Enterprise/Ad Networks |
| 9 | Broadsign | Ad Operations | Programmatic OOH + Header Bidder | OOH Media Owners |
| 10 | TelemetryTV | Developer CMS | Git + Tag Matching + SDK + IPTV | Developer-focused |
| 11 | HikCentral FocSign | Security Ecosystem | CCTV + Access Control + Auto-Emergency | Building/Campus |
| 12 | ShiMeta | HW ODM | Edge AI + Dual-Screen Translation | OEM/Integrators |
| 13 | Dahua | Security + Signage | P2P Distribution + CCTV Analytics | Building/Security |

---

## 2. Winner ในแต่ละหมวด

| หมวด | Winner | ทำไม |
|------|--------|------|
| Ease of Use | Bizplay | 100% web-based, ง่ายจริงๆ |
| AI Content Creation | Appspace | Generate + Translate + Author ครบ |
| IT Security | ScreenCloud | SOC2 + SSO + Audit + RDM + GraphQL |
| Value for Money | Yodeck | Features เยอะ + ราคาถูกสุด |
| Interactive/Retail | OptiSigns | QR Interact + AI Audience + POS |
| Hardware Integration | Samsung VXT | ISO27701 + Energy Report + SyncPlay |
| Player Reliability | BrightSign | State Machine + Purpose-Built OS |
| Monetization/DooH | Navori | Composable + A/B Test + Programmatic |
| Ad Operations | Broadsign | Header Bidder + 2M screens connected |
| Developer/DevOps | TelemetryTV | Git deploy + Tag matching + SDK |
| Security Integration | HikCentral FocSign | CCTV feed + Auto-Emergency trigger |
| Edge AI Hardware | ShiMeta | NPU-based on-device AI + Translation |
| Content Distribution | Dahua | P2P/Magnet URI (LAN bandwidth saving) |

---

## 3. Unique Features — สิ่งที่มีเพียง 1 platform เท่านั้น

| Feature | Platform | คำอธิบายสั้น |
|---------|----------|-------------|
| P2P Content Distribution | Dahua | Player แชร์ content ให้กันใน LAN (ลด server bandwidth 98%) |
| Content A/B Testing | Navori | ทดสอบ 2 versions วัดผล auto-rollout winner |
| Header Bidder (Multi-SSP) | Broadsign | เปิดหลาย SSP bid พร้อมกัน ได้ราคาสูงสุด |
| Git-Based Web App Deploy | TelemetryTV | Push code จาก GitHub → deploy ไปจอผ่าน CI/CD |
| Live Broadcast (Twitch-level) | ScreenCloud | ถ่ายทอดสดจาก Zoom/OBS ไปทุกจอ |
| QR Scan-to-Interact (bidirectional) | OptiSigns | สแกน QR → เลือก action → จอเปลี่ยนตาม |
| Content Embargo (Release Date) | Samsung VXT | ห้ามแสดงก่อนวันที่กำหนด (campaign launch sync) |
| CAP Emergency Protocol | Yodeck | เชื่อมกับ mass notification systems มาตรฐาน |
| Auto-Emergency from Alarm | HikCentral | Fire alarm → จอเปลี่ยนอัตโนมัติ (ไม่ต้องกดปุ่ม) |
| AI Dual-Screen Translation | ShiMeta | จอพนักงาน (TH) + จอลูกค้า (EN/CN/JP) real-time |
| Dynamic Pacing | Broadsign | Auto-adjust ad frequency เพื่อ deliver ตรง contract |
| Eco-Aware (Presence-Based Power) | Navori | ไม่มีคน → จอหรี่/ปิด, มีคน → เปิด |

---

## 4. Core Architecture Features — ต้องมี (Foundation)

จากการวิเคราะห์ 13 platforms สรุปว่า features เหล่านี้เป็น **"table stakes"** ที่ platform ระดับมืออาชีพต้องมี:

| # | Feature | อ้างอิงหลัก | ทำไมต้องมี |
|---|---------|-------------|-----------|
| 1 | **Content Priority System (6-Level)** | Yodeck | Predictable playback — จอแสดงอะไรเมื่อ rules conflict |
| 2 | **Multi-Level Fallback (No Black Screen)** | Yodeck + BrightSign | จอต้องไม่ดำเด็ดขาด ไม่ว่าจะเกิดอะไร |
| 3 | **Enterprise Security (SSO, RBAC, Audit)** | ScreenCloud + Samsung | Enterprise จะไม่ซื้อถ้าไม่มี |
| 4 | **Remote Device Management** | ScreenCloud + Samsung | ลดการ "ไปเยี่ยมจอ" |
| 5 | **Multi-Zone Layout** | Appspace + Yodeck | พื้นฐานที่ทุก platform มี |
| 6 | **Emergency Alert System** | Yodeck + HikCentral | Safety requirement |
| 7 | **Media Expiration** | Yodeck | ป้องกันแสดง content ที่หมดอายุ |
| 8 | **Full REST/GraphQL API** | ScreenCloud + TelemetryTV | Integration capability |
| 9 | **Offline Playback + Local Cache** | BrightSign + Yodeck | Internet ล่ม ≠ จอดำ |
| 10 | **Content Approval Workflow** | OptiSigns | ป้องกัน content ไม่เหมาะสมขึ้นจอ |

---

## 5. Full Feature Roadmap — 5 Tiers

### Tier 1: Foundation (Must-Have ก่อน Launch)
*เป้าหมาย: ใช้งานได้จริง, ขายได้, ไม่อายเมื่อเทียบกับคู่แข่ง*

| # | Feature | Source | ความยาก | เหตุผล |
|---|---------|--------|---------|--------|
| 1 | Content Priority 6-Level | Yodeck | กลาง | Predictable playback logic |
| 2 | Multi-Level Fallback | Yodeck/BrightSign | กลาง | No black screen policy |
| 3 | SSO + RBAC + Audit Log | ScreenCloud | กลาง-สูง | Enterprise gating |
| 4 | Remote Device Management | ScreenCloud | กลาง-สูง | Operational efficiency |
| 5 | Multi-Zone Layout | Appspace | กลาง | Basic expected feature |
| 6 | Emergency Alert (3-tier) | Appspace/Yodeck | ต่ำ-กลาง | Safety requirement |
| 7 | Media Expiration + Embargo | Yodeck/Samsung | ต่ำ | Content hygiene |
| 8 | Content Approval Workflow | OptiSigns | ต่ำ-กลาง | Governance |
| 9 | REST API | ScreenCloud/TelemetryTV | กลาง | Integration baseline |
| 10 | Offline Playback + Cache | BrightSign | กลาง | Reliability |
| 11 | Player Kiosk Mode + Security | Yodeck/Samsung | กลาง | Public deployment |
| 12 | Proof of Play | ScreenCloud | กลาง | Accountability |

### Tier 2: Differentiation (ทำให้ต่างจากคู่แข่ง)
*เป้าหมาย: features ที่ทำให้เราโดดเด่น — "ทำไมต้องเลือกเรา?"*

| # | Feature | Source | ความยาก | เหตุผล |
|---|---------|--------|---------|--------|
| 13 | Tag-Based Dynamic Playlists | Yodeck/TelemetryTV | กลาง | Smart content distribution |
| 14 | Device Tag + Content Auto-Match | TelemetryTV | กลาง | Scalability killer |
| 15 | Dynamic Data Mapping (Sheet→Display) | OptiSigns | กลาง-สูง | Restaurant/Retail key feature |
| 16 | QR Scan-to-Interact | OptiSigns | กลาง | Interactive without touch HW |
| 17 | Content Trigger (HTTP/Webhook) | Bizplay/TelemetryTV | กลาง | IoT/automation |
| 18 | Live Broadcast / Takeover | ScreenCloud | สูง | Unique value |
| 19 | Lockable Templates | ScreenCloud/Yodeck | กลาง | Brand governance |
| 20 | P2P Content Distribution | Dahua | สูง | Bandwidth saving (unique) |
| 21 | Proactive Alerting (Predictive) | Samsung VXT | กลาง-สูง | Prevention > Reaction |
| 22 | Quick Post / Instant Notices | ScreenCloud | ต่ำ | Zero-friction updates |
| 23 | Mobile Admin App | OptiSigns | กลาง | On-the-go management |
| 24 | Slack/Teams Integration | OptiSigns | ต่ำ-กลาง | User adoption |

### Tier 3: Smart & AI
*เป้าหมาย: intelligence ที่ทำให้ platform "ฉลาด"*

| # | Feature | Source | ความยาก | เหตุผล |
|---|---------|--------|---------|--------|
| 25 | AI Content Generation | Appspace | สูง | Productivity revolution |
| 26 | AI Audience Intelligence (Camera) | OptiSigns/Navori | สูง | Targeted content |
| 27 | Conditional Content Rules (Context) | OptiSigns | สูง | Smart signage |
| 28 | AI Auto Translation (per device) | Appspace | กลาง-สูง | Multi-language auto |
| 29 | Content A/B Testing | Navori | กลาง-สูง | Data-driven optimization |
| 30 | Web Scripting Engine | Yodeck | กลาง-สูง | Dashboard display |
| 31 | Secure Dashboard Display | ScreenCloud | สูง | Enterprise BI on screens |
| 32 | Auto-Emergency from Alarm Systems | HikCentral | กลาง | Safety automation |
| 33 | Eco-Aware (Presence-Based Power) | Navori | กลาง | ESG/Energy saving |
| 34 | AI Vehicle/Footfall Counting | Navori | สูง | Outdoor analytics |

### Tier 4: Advanced Platform
*เป้าหมาย: features ที่เปลี่ยนจาก "signage tool" เป็น "platform"*

| # | Feature | Source | ความยาก | เหตุผล |
|---|---------|--------|---------|--------|
| 35 | Git-Based Web App Deploy | TelemetryTV | กลาง-สูง | Developer love |
| 36 | Video Wall + SyncPlay | Samsung/Yodeck | สูง | Premium installations |
| 37 | IPTV + Signage Blending | TelemetryTV/Yodeck | สูง | Hospitality/Sports |
| 38 | HDMI-In / Live TV | Yodeck | กลาง | Content flexibility |
| 39 | CCTV Integration | HikCentral/Dahua | สูง | Security convergence |
| 40 | State Machine Engine | BrightSign | สูง | Advanced interactivity |
| 41 | On-Premise / Hybrid Deploy | Navori | สูง | Regulated industries |
| 42 | Composable Module Architecture | Navori | สูง | Pricing flexibility |
| 43 | Energy Consumption Reporting | Samsung VXT | กลาง | ESG compliance |
| 44 | Holiday Calendar Management | Samsung VXT | ต่ำ | Convenience |

### Tier 5: Monetization & Ecosystem
*เป้าหมาย: สร้าง revenue streams ใหม่ + partner ecosystem*

| # | Feature | Source | ความยาก | เหตุผล |
|---|---------|--------|---------|--------|
| 45 | DooH Programmatic Advertising | Navori/Broadsign | สูงมาก | Revenue for clients |
| 46 | Share of Voice Selling | Broadsign | สูง | Ad model |
| 47 | Header Bidder (Multi-SSP) | Broadsign | สูงมาก | Max yield |
| 48 | App Marketplace (PIRS-style) | Samsung VXT | สูง | Partner ecosystem |
| 49 | White-Label Program | ScreenCloud/Yodeck | ต่ำ-กลาง | Partner channel |
| 50 | Platform as a Service (PaaS) | OptiSigns | สูง | Business expansion |
| 51 | Space Reservation Integration | Appspace | สูง | Workplace module |
| 52 | Omni-Channel Publishing | Appspace | สูง | Beyond screens |
| 53 | Visitor Management | Appspace | สูง | Lobby solution |

---

## 6. Architecture Decisions (จากบทเรียนทุก Platform)

### 6.1 Player Architecture (จาก BrightSign + Samsung + Dahua)

```
┌──────────────────────────────────────────────────┐
│ NextGen Android Player Architecture               │
├──────────────────────────────────────────────────┤
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ Content Priority Engine (6-Level)           │ │
│  │ Emergency > Takeover > Schedule > Playlist  │ │
│  │ > Filler > Fallback                         │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ Event/State Machine (Optional Advanced)     │ │
│  │ GPIO, Touch, Timer, Network, Sensor events  │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ Content Cache + P2P Distribution            │ │
│  │ Cloud sync + Local cache + LAN P2P sharing  │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ Hardware Control Layer                      │ │
│  │ HDMI CEC, Brightness, Volume, USB lock     │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ Security + Reliability                      │ │
│  │ Kiosk mode, Encryption, Watchdog,           │ │
│  │ Auto-restart, Health monitoring             │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
└──────────────────────────────────────────────────┘
```

### 6.2 CMS Architecture (จาก Navori + TelemetryTV + Appspace)

```
┌──────────────────────────────────────────────────┐
│ NextGen CMS Architecture                          │
├──────────────────────────────────────────────────┤
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ Modular Design (Composable)                 │ │
│  │ Core: CMS + Player + Device Mgmt           │ │
│  │ Modules: AI, Analytics, DooH, Integrations  │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ Tag-Based Content Distribution              │ │
│  │ Tag devices + Tag content → Auto-match      │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ API-First Design                            │ │
│  │ REST/GraphQL + Webhooks + SDK               │ │
│  │ Everything UI does, API can do too          │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ Multi-Deployment Support                    │ │
│  │ Cloud (default) / On-premise / Hybrid       │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ Integration Layer (Open)                    │ │
│  │ CCTV, Access Control, POS, Calendar,        │ │
│  │ IFTTT, Alarm Systems, IoT Sensors           │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
└──────────────────────────────────────────────────┘
```

### 6.3 Security Architecture (จาก ScreenCloud + Samsung + Yodeck)

```
Authentication:  SSO (SAML/OIDC) + SCIM provisioning
Authorization:   RBAC (granular custom roles) + Workspace hierarchy
Data:           Encryption at-rest + in-transit + Player storage
Audit:          Every action logged (who, what, when)
Device:         USB lock, Network lock, Kiosk mode, Secure boot
Compliance:     SOC2 + ISO27001 target + PDPA/GDPR data residency
Player:         Encrypted storage + Tamper detection + Auto-wipe
```

---

## 7. Business Model Options (จากบทเรียนทุก Platform)

| Model | ตัวอย่าง | เหมาะสำหรับ |
|-------|---------|------------|
| Per-Screen/Month SaaS | Yodeck ($8/screen), Bizplay | SMB, scale easy |
| Tiered Plans | OptiSigns, ScreenCloud | Feature-based pricing |
| Enterprise License | Appspace, Navori | Large organizations |
| Modular/Composable | Navori Qompose | Pay-for-what-you-use |
| White-Label/Reseller | Yodeck, ScreenCloud | Partner channel |
| Hardware + Software Bundle | Samsung VXT, ShiMeta | Hardware margin + recurring |
| Ad Revenue Share | Broadsign, Navori | Media owner monetization |
| PaaS (Platform as a Service) | OptiSigns | Developer/Enterprise custom |
| Free Tier + Paid Upgrade | Yodeck (1 screen free) | User acquisition |

---

## 8. Positioning Recommendation สำหรับ NextGen

### Sweet Spot ที่ควรเล็ง:

```
                    ง่าย ←─────────────────────────→ ซับซ้อน
                    ถูก  ←─────────────────────────→ แพง

  Bizplay ─────── Yodeck ─── OptiSigns ─── ScreenCloud ─── Appspace ─── Navori
     │               │            │              │              │           │
     SMB           SMB-Mid      Retail        Mid-Ent      Enterprise    DooH
                                                                          
                         ┌────────────────────┐
                         │   NextGen Target   │
                         │   "Smart Middle"   │
                         │                    │
                         │  ง่ายเหมือน Yodeck  │
                         │  ฉลาดเหมือน OptiSigns │
                         │  ปลอดภัยเหมือน ScreenCloud │
                         │  + AI + IoT integration │
                         └────────────────────┘
```

**Positioning:** "AI-Powered Digital Signage with Security Integration"
- ง่ายพอสำหรับ non-technical users
- ฉลาดพอสำหรับ data-driven content
- ปลอดภัยพอสำหรับ enterprise
- เชื่อมกับ building systems (CCTV, Access Control, Alarm)

---

## 9. Top 10 "Quick Wins" (Impact สูง + ความยากต่ำ)

| # | Feature | ความยาก | Impact | ทำไม Quick Win |
|---|---------|---------|--------|----------------|
| 1 | Content Embargo (Release Date) | ต่ำ | กลาง-สูง | ง่ายมาก แค่ date check |
| 2 | Media Expiration | ต่ำ | กลาง-สูง | ง่ายมาก แค่ date check |
| 3 | Quick Post / Instant Notices | ต่ำ | กลาง-สูง | UX improvement |
| 4 | Slack/Teams @mention to screen | ต่ำ-กลาง | กลาง | User adoption |
| 5 | Playback Frequency Weight | ต่ำ | กลาง | Content control |
| 6 | Holiday Calendar | ต่ำ | ต่ำ-กลาง | Convenience |
| 7 | Timezone-Aware Scheduling | ต่ำ | กลาง | Multi-location |
| 8 | Volume Scheduling | ต่ำ | ต่ำ-กลาง | Audio management |
| 9 | Daily Auto-Restart | ต่ำ | กลาง | Reliability |
| 10 | Fallback Image per Content | ต่ำ | สูง | No black screen |

---

## 10. Top 10 "Game Changers" (Impact สูงมาก แม้ยากกว่า)

| # | Feature | ความยาก | Impact | ทำไม Game Changer |
|---|---------|---------|--------|-------------------|
| 1 | Content Priority 6-Level | กลาง | สูงมาก | Foundation ของทุกอย่าง |
| 2 | Device Tag + Auto-Match | กลาง | สูงมาก | Scale 1000+ จอ effortlessly |
| 3 | P2P Content Distribution | สูง | สูง | ลด bandwidth 98% (unique!) |
| 4 | AI Audience Intelligence | สูง | สูงมาก | Targeted content = higher ROI |
| 5 | Dynamic Data Mapping | กลาง-สูง | สูงมาก | POS/Sheet → Live display |
| 6 | QR Scan-to-Interact | กลาง | สูง | Interactive ไม่ต้อง touch screen |
| 7 | Auto-Emergency from Alarm | กลาง | สูง | Life safety automation |
| 8 | Live Broadcast / Takeover | สูง | สูงมาก | Unique communication tool |
| 9 | DooH Monetization | สูงมาก | สูงมาก | Turn cost-center → revenue |
| 10 | Composable Architecture | สูง | สูงมาก | Future-proof + pricing flex |

---

## 11. เอกสารอ้างอิง (ไฟล์ทั้งหมด)

| # | ไฟล์ | เนื้อหา |
|---|------|---------|
| 1 | `Bizplay_Feature_Analysis.md` | 10 features + roadmap |
| 2 | `Appspace_Feature_Analysis.md` | 15 features + roadmap |
| 3 | `ScreenCloud_Feature_Analysis.md` | 15 features + roadmap |
| 4 | `Yodeck_Feature_Analysis.md` | 17 features + roadmap |
| 5 | `OptiSigns_Feature_Analysis.md` | 14 features + roadmap |
| 6 | `Samsung_VXT_Feature_Analysis.md` | 12 features |
| 7 | `BrightSign_Feature_Analysis.md` | 10 concepts (player architecture) |
| 8 | `Navori_Feature_Analysis.md` | 10 features |
| 9 | `Broadsign_Feature_Analysis.md` | 8 features (ad operations) |
| 10 | `TelemetryTV_Feature_Analysis.md` | 8 features |
| 11 | `HikCentral_FocSign_Feature_Analysis.md` | 7 features |
| 12 | `ShiMeta_FocSign_Feature_Analysis.md` | 3 concepts (hardware) |
| 13 | `Dahua_Digital_Signage_Feature_Analysis.md` | 6 features |
| 14 | `Content_Priority_System_Design.md` | Implementation design (code+diagrams) |
| 15 | `Digital_Signage_Analysis_Summary.md` | Earlier analysis (pre-research) |

---

## 12. สรุปสุดท้าย

### จำนวนฟีเจอร์ที่ค้นพบ: **53 features** (Tier 1-5)
### แบ่งตามความยาก:
- ต่ำ (ทำได้เร็ว): 12 features
- กลาง: 19 features
- กลาง-สูง: 10 features
- สูง: 10 features
- สูงมาก: 2 features

### หลักการสำคัญที่ได้จาก 13 platforms:

1. **"No Black Screen" เป็นกฎทองข้อแรก** — Fallback ทุกระดับ
2. **Tag-Based = Scalability Secret** — ใช้ tags จัดการ 1000+ จอได้
3. **Priority System = Predictability** — ผู้ใช้ต้องรู้แน่ว่าจอจะแสดงอะไร
4. **API-First = Future-Proof** — ทุกอย่างต้อง accessible ผ่าน API
5. **Offline-First = Reliability** — Cloud คือ sync, ไม่ใช่ dependency
6. **Security = Enterprise Gating** — ไม่มี SSO/RBAC = ไม่ได้ขาย enterprise
7. **AI = Next Frontier** — ทั้ง content creation + audience analytics
8. **Integration > Isolation** — เชื่อมกับ building systems = more use cases
9. **P2P = Bandwidth Solution** — สำหรับ multi-screen sites (จาก Dahua)
10. **Composable > Monolithic** — ลูกค้าเลือกจ่ายเฉพาะที่ใช้

---

*Master document สรุปจาก 13 platform analyses — สิงหาคม 2026*
