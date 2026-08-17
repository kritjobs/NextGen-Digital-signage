/**
 * webos.js — webOS platform helpers สำหรับ kiosk shell
 *
 * สิ่งที่ทำ:
 *  - PalmSystem.stageReady() — บอก webOS ว่าแอป render พร้อมแล้ว (กันจอขาวตอนเปิด)
 *  - ป้องกัน screensaver แบบ best-effort (registerScreenSaverRequest — ต้อง root/homebrew)
 *
 * ⚠️ ข้อเท็จจริงสำคัญ (webOS 6.0+ รวมถึง webOS 24):
 *  - ตัวเลือก "Screen Saver on/off" ถูกลบออกจาก Settings แล้ว → ปิดผ่าน setting ไม่ได้
 *  - Screensaver จะไม่ทำงานเฉพาะตอน "เล่นวิดีโอเต็มจอ" เท่านั้น
 *  - navigator.wakeLock ไม่รองรับบน webOS (request จะค้าง ไม่ resolve)
 *  - registerScreenSaverRequest เป็น undocumented API — ใช้งานได้เมื่อแอปมี
 *    permission (ปกติต้อง root ผ่าน webosbrew หรือรุ่น commercial) — ถ้าไม่ได้
 *    ก็ fail เงียบๆ ไม่กระทบแอป
 */

(function (global) {
  'use strict';

  var WebOS = {
    /** มี webOS runtime หรือไม่ (PalmSystem มีเฉพาะใน webOS app จริง) */
    isWebOS: function () {
      return typeof global.PalmSystem !== 'undefined';
    },

    /** เรียกเมื่อ DOM พร้อม render — webOS จะแสดงผลทันที (กันจอขาวค้าง) */
    stageReady: function () {
      if (this.isWebOS()) {
        try { global.PalmSystem.stageReady(); } catch (e) { /* ignore */ }
      }
    },

    /**
     * ป้องกัน screensaver — register + respond ตาม protocol ของ tvpower
     * ใช้ WebOSServiceBridge (มีเฉพาะใน webOS app) — ถ้าไม่มีก็ข้ามไป
     */
    preventScreenSaver: function (clientName) {
      if (typeof global.WebOSServiceBridge !== 'function') {
        console.warn('[webos] WebOSServiceBridge ไม่มี — ข้ามการกัน screensaver');
        return;
      }
      try {
        var bridge = new global.WebOSServiceBridge();
        bridge.onservicecallback = function (msg) {
          try {
            var m = JSON.parse(msg);
            // tvpower จะส่ง state: "Active" ก่อนที่ screensaver จะเริ่ม → ตอบ ack:false เพื่อยกเลิก
            if (m.state === 'Active' && m.timestamp) {
              bridge.call(
                'luna://com.webos.service.tvpower/power/responseScreenSaverRequest',
                JSON.stringify({
                  clientName: clientName,
                  ack: false,
                  timestamp: m.timestamp
                })
              );
            }
          } catch (e) { /* ignore malformed msg */ }
        };
        bridge.call(
          'luna://com.webos.service.tvpower/power/registerScreenSaverRequest',
          JSON.stringify({ subscribe: true, clientName: clientName })
        );
      } catch (e) {
        console.warn('[webos] กัน screensaver ไม่ได้:', e);
      }
    },

    /** ป้องกันจอหลับ/เข้า standby — best-effort เหมือนกัน */
    keepAwake: function () {
      // กัน screensaver เป็นหลัก (จอไม่ดับถ้า app ยัง active อยู่)
      this.preventScreenSaver('nextgen-signage-player');
    }
  };

  // แจ้ง webOS ว่าหน้าพร้อมแล้ว (เรียกเสมอ ไม่ว่าจะเปิดผ่าน webOS หรือ browser ปกติ)
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    WebOS.stageReady();
  } else {
    document.addEventListener('DOMContentLoaded', function () { WebOS.stageReady(); });
  }

  global.WebOS = WebOS;
})(window);
