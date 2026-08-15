/**
 * ภาษาไทย (Thai)
 * Typed as `Messages` — ตัว compiler จะฟ้องถ้าคีย์ขาด/เกิน ครบทุกคีย์ใน en.ts
 */

import type { Messages } from './en';

export const th: Messages = {
  // ── App shell ──────────────────────────────────────────────
  'app.loading': 'กำลังโหลดแพลตฟอร์มป้ายดิจิทัล...',
  'app.welcome': 'ยินดีต้อนรับ, {name}',
  'app.connectionError': 'การเชื่อมต่อผิดพลาด',
  'app.retry': 'ลองเชื่อมต่อใหม่',
  'app.footerWs': 'ระบบ WebSocket Realtime v4.2',
  'app.footerPort': 'พอร์ต WebSocket: 3000',
  'app.footer4k': 'พร้อมใช้งานจอ 4K',
  'app.systemOperational': '● ระบบทำงานปกติ',

  // ── Login ──────────────────────────────────────────────────
  'login.secure': 'เข้าสู่ระบบอย่างปลอดภัย',
  'login.email': 'อีเมล',
  'login.password': 'รหัสผ่าน',
  'login.authenticating': 'กำลังตรวจสอบ...',
  'login.signIn': 'เข้าสู่ระบบ',
  'login.guest': 'เข้าชมแบบแขก (โหมดสาธิต)',
  'login.protected': 'ป้องกันด้วย JWT + RBAC • เซสชันหมดอายุใน 15 นาที',
  'login.footer': 'แพลตฟอร์มป้ายดิจิทัล NextGen v0.2.0 • ความปลอดภัยระดับองค์กร',
  'login.brandFallback': 'SIGNAGE ENTERPRISE',
  'login.subtitleFallback': 'แพลตฟอร์มจัดการป้ายดิจิทัลอัจฉริยะ',

  // ── Navigation ─────────────────────────────────────────────
  'nav.adminConsole': 'คอนโซลผู้ดูแล',
  'nav.tvPlayer': 'แอปจอทีวี',
  'nav.dualSimulator': 'จำลองสองจอ',
  'nav.quickPost': 'โพสต์ด่วน — ส่งข้อความถึงทุกจอทันที',
  'nav.quickPostPrompt': 'ข้อความโพสต์ด่วน (ส่งถึงทุกจอ):',
  'nav.branding': 'ตั้งค่าแบรนด์ (White-Label)',
  'nav.lightMode': 'สลับเป็นโหมดสว่าง',
  'nav.darkMode': 'สลับเป็นโหมดมืด',
  'nav.wsLive': 'WS ออนไลน์',
  'nav.wsOffline': 'WS ออฟไลน์',
  'nav.onlineCount': '({online}/{total} ออนไลน์)',
  'nav.emergencyActive': 'กำลังประกาศฉุกเฉิน',
  'nav.emergencyAlert': 'แจ้งเตือนฉุกเฉิน',
  'nav.enterprise': 'ENTERPRISE',
  'nav.screensMatrix': 'เมทริกซ์จอแสดงผล',
  'nav.smartLayout': 'สตูดิโอเลย์เอาต์อัจฉริยะ',
  'nav.mediaLibrary': 'คลังสื่อ',
  'nav.playlists': 'เพลย์ลิสต์',
  'nav.scheduler': 'ตารางเวลาออกอากาศ',
  'nav.campaigns': 'แคมเปญ',
  'nav.realtimeControl': 'ควบคุมแบบเรียลไทม์',
  'nav.analytics': 'วิเคราะห์และเทเลเมทรี',
  'nav.slideshow': 'สตูดิโอสไลด์โชว์',
  'nav.backup': 'สำรองข้อมูล',
  'nav.aiConfig': 'ตั้งค่า AI',

  // ── Emergency ──────────────────────────────────────────────
  'emergency.bannerCritical': 'ออกอากาศฉุกเฉินแบบบังคับ',
  'emergency.triggered': 'เริ่มเมื่อ {time}',
  'emergency.clear': 'ยกเลิกการออกอากาศฉุกเฉิน',
  'emergency.modalTitle': 'สั่งออกอากาศฉุกเฉินสด',
  'emergency.modalSubtitle': 'บังคับแทนเพลย์ลิสต์ทุกจอทันทีผ่าน WebSocket',
  'emergency.presetTemplate': '1. เลือกเทมเพลตแจ้งเตือน',
  'emergency.presetFire': 'อัคคีภัย',
  'emergency.presetWeather': 'สภาพอากาศ',
  'emergency.presetLockdown': 'ล็อกดาวน์',
  'emergency.presetCustom': 'กำหนดเอง',
  'emergency.alertTitle': 'หัวข้อแจ้งเตือน',
  'emergency.alertMessage': 'ข้อความออกอากาศ',
  'emergency.targetScope': 'กลุ่มจอเป้าหมาย',
  'emergency.allDisplays': '🌐 ทุกจอในองค์กร ({count})',
  'emergency.severity': 'ระดับความรุนแรง',
  'emergency.severityCritical': '🔴 วิกฤต (จอแดงกะพริบ + เสียง)',
  'emergency.severityWarning': '🟠 เตือน (แถบสีเหลือง)',
  'emergency.severityInfo': '🔵 ข้อมูล (แจ้งเตือนสีน้ำเงิน)',
  'emergency.cancel': 'ยกเลิก',
  'emergency.broadcast': 'ออกอากาศทันที',
  'emergency.fireDefaultTitle': 'คำเตือนการอพยพหนีไฟ',
  'emergency.fireDefaultMsg': 'กรุณาอพยพออกจากอาคารทันที ใช้บันไดหนีไฟ ห้ามใช้ลิฟต์',
  'emergency.presetFireTitle': 'เหตุการณ์อัคคีภัยฉุกเฉิน',
  'emergency.presetFireMsg': 'สัญญาณเตือนอัคคีภัยดังแล้ว กรุณาอพยพทางประตูฉุกเฉินที่ใกล้ที่สุดทันที',
  'emergency.presetWeatherTitle': 'ประกาศหลบภัยสภาพอากาศรุนแรง',
  'emergency.presetWeatherMsg': 'มีคำเตือนพายุรุนแรงและทอร์นาโด ให้ย้ายไปที่หลบภัยชั้นล่างภายในอาคาร',
  'emergency.presetLockdownTitle': 'ประกาศล็อกดาวน์ด้านความปลอดภัย',
  'emergency.presetLockdownMsg': 'ประกาศด้านความปลอดภัย: ให้อยู่ในห้องเรียนหรือห้องทำงานที่ปิดมิดชิด ล็อกประตูให้เรียบร้อย',
  'emergency.presetCustomTitle': 'ประกาศพิเศษจากระบบ',
  'emergency.presetCustomMsg': 'กรุณาเข้าร่วมประชุมใหญ่ในห้องประชุมหลัก',

  // ── Player overlays ────────────────────────────────────────
  'player.emergencyOverride': '🚨 ออกอากาศฉุกเฉินแบบบังคับ',
  'player.triggeredAt': 'เริ่มเมื่อ {time} • ทุกโซนถูกบังคับแทน',

  // ── Language switcher ──────────────────────────────────────
  'language.label': 'ภาษา',
};
