# TelemetryTV Feature Analysis — สำหรับ NextGen Digital Signage Platform
**วันที่วิเคราะห์:** 8 สิงหาคม 2026  
**แหล่งข้อมูล:** [TelemetryTV.com](https://www.telemetrytv.com/)  
**วัตถุประสงค์:** ศึกษาฟีเจอร์เพิ่มเติม — เน้น developer-friendly + IPTV + programmatic content  
**หมายเหตุ:** ลูกค้า: Starbucks, BCG, Amazon; SOC 2 + PCI-DSS compliant; มี custom OS (TelemetryTV Box OS); เน้น developer workflow + DevOps integration

---

## 1. Git-Based Web Apps (DevOps-Integrated Development)

**คำอธิบาย:** สร้าง custom web apps สำหรับ signage แล้ว deploy ผ่าน Git workflow:
- เขียน code บน local machine → push to GitHub
- ใช้ CI/CD pipelines (GitHub Actions) deploy ไปจอ signage โดยตรง
- Version control ทุก deployment
- Rollback ได้ทันทีถ้ามีปัญหา
- Staging/Testing environments
- Collaborative development (multiple developers)
- **SDK** ที่ให้ access device context (location, tags, metadata)

**ต่างจาก ScreenCloud Playgrounds / Yodeck Custom Apps:**
- ScreenCloud: paste code ใน browser editor (no version control)
- Yodeck: upload HTML file
- TelemetryTV: **full Git workflow** + CI/CD + SDK + enterprise hosting

**ประโยชน์สำหรับเรา:** สำหรับ enterprise ที่มี dev team — ให้พวกเขาใช้ tools ที่คุ้นเคย (Git, GitHub Actions, VS Code) สร้าง signage apps ได้เลย ไม่ต้องเรียนรู้ platform ใหม่

**ระดับความยาก:** กลาง-สูง  
**Impact:** สูง (developer adoption in enterprise)

---

## 2. Device Tagging + Programmatic Content Matching

**คำอธิบาย:** ระบบ tag ที่ match device กับ content อัตโนมัติ:
- ติด tag บน device: `location:bangkok`, `type:menu-board`, `brand:cafe-A`
- ติด tag บน content: `location:bangkok`, `type:menu-board`
- ระบบ **auto-match** — content ไปที่ device ที่มี tag ตรงกัน
- เพิ่ม device ใหม่ + ติด tags → ได้ content ทันทีโดยไม่ต้อง manual assign
- "Network that programs itself"

**ต่างจาก Yodeck Tag-Based Playlists:**
- Yodeck: tag บน media → playlist รวม media ที่มี tag เดียวกัน (content-side)
- TelemetryTV: tag บน **device + content** → auto-match ทั้งสองฝั่ง (bidirectional)

**ตัวอย่าง:**
```
Device Tags:     Content Tags:       Result:
─────────────    ─────────────       ────────
Screen-A:        Video-1:            Screen-A แสดง:
 - region:north   - region:north      - Video-1 ✓ (match north)
 - type:lobby     - type:lobby        - Video-3 ✓ (match lobby)
                 Video-2:
Screen-B:         - region:south     Screen-B แสดง:
 - region:south   - type:menu        - Video-2 ✓ (match south)
 - type:menu     Video-3:
                  - type:lobby
```

**ประโยชน์สำหรับเรา:** สำหรับ chain deployment (100+ สาขา) — ไม่ต้อง assign content ทีละจอ แค่ tag ให้ถูก → ระบบจัดการเอง

**ระดับความยาก:** กลาง  
**Impact:** สูงมาก (scalability killer feature)

---

## 3. IPTV + Digital Signage Blending

**คำอธิบาย:** ผสม IPTV (live TV/sports) กับ digital signage content ในจอเดียวกัน:
- แสดง live sports → overlay ad/branded content ด้านล่าง
- ใช้ infrastructure เดิม (set-top box, distribution system) ไม่ต้อง upgrade
- ทำ picture-in-picture: TV สด + signage content
- Switch ระหว่าง TV mode กับ Signage mode ได้
- Boost revenue ด้วย ad insertion ระหว่าง live content

**ต่างจาก Yodeck HDMI-In:**
- Yodeck: แสดง HDMI input ใน zone (raw passthrough)
- TelemetryTV: **blend** IPTV + signage (overlay, L-bar, picture-in-picture) + ad insertion

**ประโยชน์สำหรับเรา:** สำหรับ bar, restaurant, gym, waiting room ที่ต้องแสดง live TV + branding/ads พร้อมกัน

**ระดับความยาก:** สูง  
**Impact:** กลาง-สูง (hospitality/sports venue use case)

---

## 4. Webhooks for Device Actions + Metrics + Overrides

**คำอธิบาย:** ระบบ webhook ที่สั่งงาน player จากภายนอก:
- **Device Webhooks:** reboot, change playlist, override content
- **Metrics Webhooks:** push data จากระบบภายใน (behind firewall) ออกมาแสดงบนจอ
- **Override Webhooks:** force content change ทันที (emergency, promotion flash)

**Metrics concept (สำคัญ!):**
- Data อยู่หลัง firewall (internal system)
- แทนที่จะเปิด API ให้ cloud เข้ามาดึง (security risk)
- Player **push metrics ออก** ไปแสดง (outbound only — ปลอดภัยกว่า)

**ประโยชน์สำหรับเรา:** สำหรับ enterprise ที่ data sensitive (manufacturing KPI, financial data) — push outbound ปลอดภัยกว่า pull inbound

**ระดับความยาก:** กลาง  
**Impact:** สูง (enterprise security pattern)

---

## 5. SCIM User Provisioning (Enterprise Identity)

**คำอธิบาย:** Integration กับ enterprise identity systems:
- **SCIM** (System for Cross-domain Identity Management) — auto-provision/deprovision users
- **SSO via SAML** — single sign-on
- **Okta / Active Directory** integration
- User ถูก create/disable อัตโนมัติตาม HR system

**ต่างจาก ScreenCloud SSO:**
- ScreenCloud: SSO login เท่านั้น
- TelemetryTV: SSO + **SCIM** (auto-create/remove users ตาม identity provider)

**ตัวอย่าง:**
- พนักงานใหม่เข้า → HR add ใน Active Directory → TelemetryTV account ถูกสร้างอัตโนมัติ
- พนักงานลาออก → HR disable → TelemetryTV access revoke ทันที

**ประโยชน์สำหรับเรา:** สำหรับ enterprise ที่มี 100+ users — ไม่ต้อง manual manage user accounts

**ระดับความยาก:** กลาง  
**Impact:** กลาง-สูง (enterprise IT requirement)

---

## 6. PCI-DSS Compliance

**คำอธิบาย:** Certified สำหรับ payment card industry security:
- ปลอดภัยสำหรับ signage ที่อยู่ใกล้ POS/payment terminals
- ผ่านมาตรฐาน cardholder data protection
- สำคัญสำหรับ retail, restaurant, banking

**ต่างจาก platform อื่น:**
- ScreenCloud: SOC 2
- Samsung VXT: ISO 27001 + 27701
- TelemetryTV: SOC 2 **+ PCI-DSS** (unique)

**ประโยชน์สำหรับเรา:** ถ้าจอ signage อยู่ใน environment ที่มี payment processing — PCI-DSS เป็น requirement

**ระดับความยาก:** Process/Audit  
**Impact:** กลาง (specific industry requirement)

---

## 7. Custom OS (TelemetryTV Box OS)

**คำอธิบาย:** OS เฉพาะทางสำหรับ signage (คล้าย BrightSignOS):
- Purpose-built สำหรับ digital signage
- ไม่มี bloatware
- Multi-display support (1 player → หลายจอ)
- Ample storage สำหรับ local cache
- Optimized สำหรับ 4K video
- Reduced attack surface

**ประโยชน์สำหรับเรา:** ยืนยันว่า custom/locked-down OS เป็น trend ของ serious signage players — Android player ของเราควร strip ลงเหลือแค่ signage functions

**ระดับความยาก:** สูง  
**Impact:** สูง (reliability reference)

---

## 8. HTML SDK + Overlays (Two-Layer Custom Content)

**คำอธิบาย:** 2 วิธีใช้ SDK สร้าง custom content:
- **HTML App:** full-page custom web app (replace content entirely)
- **HTML Overlay:** transparent layer ทับ content ปกติ (add elements on top)

SDK ให้ access:
- Device metadata (name, tags, location)
- Playlist context (current item, duration)
- Player state (online/offline, time)

**ตัวอย่าง Overlay:**
- Content ปกติ: video โฆษณา
- Overlay: QR code มุมขวาล่าง + countdown timer + logo watermark

**ประโยชน์สำหรับเรา:** Overlay system ที่แยกจาก content หลัก — เพิ่ม persistent elements (logo, clock, ticker) โดยไม่ต้องแก้ content ทุกชิ้น

**ระดับความยาก:** กลาง  
**Impact:** กลาง-สูง (content flexibility)

---

## สรุปจัดลำดับความสำคัญ

| ลำดับ | ฟีเจอร์ | ระดับความยาก | Impact | หมวด |
|-------|---------|-------------|--------|------|
| 1 | Device Tagging + Auto-Match | กลาง | สูงมาก | Scalability |
| 2 | Git-Based Web Apps (DevOps) | กลาง-สูง | สูง | Developer |
| 3 | Webhooks (Outbound Metrics Push) | กลาง | สูง | Enterprise Security |
| 4 | IPTV + Signage Blending | สูง | กลาง-สูง | Content |
| 5 | SCIM User Provisioning | กลาง | กลาง-สูง | Enterprise IT |
| 6 | HTML SDK + Overlays | กลาง | กลาง-สูง | Developer |
| 7 | Custom Signage OS | สูง | สูง | Reliability |
| 8 | PCI-DSS Compliance | Process | กลาง | Compliance |

---

## Key Takeaways จาก TelemetryTV

### สิ่งที่ TelemetryTV ทำดีที่สุด:

1. **Developer-First Approach** — Git integration, SDK, CI/CD, webhooks ทำให้ developers รัก platform

2. **Programmatic Content = Tag Matching** — ไม่ต้อง manually assign content → devices จัดการตัวเองตาม tags (scalability secret)

3. **Security Pattern: Push > Pull** — ข้อมูลอยู่หลัง firewall? push metrics ออกมาแทนที่จะให้ cloud เข้าไปดึง

4. **Overlay System** — แยก persistent elements (branding) ออกจาก changing content ทำให้ manage ง่าย

5. **IPTV Blending** — ตลาดที่ platform อื่นไม่ค่อยเล่น แต่ร้านอาหาร/gym/bar ต้องการมาก

---

## สรุปรวม 10 Platforms — Winner ในแต่ละหมวด

| หมวด | Winner | Key Feature |
|------|--------|-------------|
| Ease of Use | Bizplay | 100% web-based, no install |
| AI Content | Appspace | Generate + Translate + Author |
| IT Security | ScreenCloud | SOC2 + SSO + GraphQL + RDM |
| Value/Features | Yodeck | 6-Level Priority + Tag Playlists |
| Interactive/Retail | OptiSigns | QR Interact + AI Audience + POS |
| Hardware | Samsung VXT | ISO27701 + Energy + SyncPlay |
| Player Reliability | BrightSign | State Machine + Purpose-Built OS |
| Monetization | Navori | DooH + Composable + A/B Test |
| Ad Operations | Broadsign | Programmatic + Header Bidder |
| **Developer/DevOps** | **TelemetryTV** | **Git + Tags + SDK + IPTV** |

---

*วิเคราะห์จาก: https://www.telemetrytv.com/ และ docs.telemetrytv.com*  
*Content was rephrased for compliance with licensing restrictions*