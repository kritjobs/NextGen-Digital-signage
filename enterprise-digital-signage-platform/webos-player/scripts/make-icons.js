#!/usr/bin/env node
/**
 * make-icons.js — สร้าง icon.png (80x80) + largeIcon.png (130x130) สำหรับ webOS app
 * ใช้ pure Node (zlib) ไม่พึ่งไลบรารี/ImageMagick
 *
 *  รัน:  node scripts/make-icons.js        (จากโฟลเดอร์ webos-player)
 *  ผลลัพธ์: icon.png, largeIcon.png อยู่ข้าง appinfo.json (package root)
 *
 *  ลาย: จอสี่เหลี่ยมมน + ปุ่ม play + เส้นฐาน (ธีม cyan ของแพลตฟอร์ม)
 */
'use strict';

import zlib from 'zlib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── PNG encoder ขั้นต่ำ (RGBA, 8-bit) ────────────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: None
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))]);
}

// ─── เรขาคณิต (พิกัด normalized 0..1) ─────────────────────────────
function inRoundedRect(x, y, cx, cy, hw, hh, r) {
  const dx = Math.max(Math.abs(x - cx) - (hw - r), 0);
  const dy = Math.max(Math.abs(y - cy) - (hh - r), 0);
  return dx * dx + dy * dy <= r * r;
}

function inTriangle(px, py, a, b, c) {
  const sign = (p1, p2, p3) => (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  const d1 = sign({ x: px, y: py }, a, b);
  const d2 = sign({ x: px, y: py }, b, c);
  const d3 = sign({ x: px, y: py }, c, a);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function lerp(a, b, t) { return a + (b - a) * t; }

// ─── ตัวอย่างสีที่ pixel (x, y normalized) ────────────────────────
function sample(x, y) {
  // พื้นหลัง: gradient แนวตั้ง dark → teal
  let r = lerp(11, 22, y);
  let g = lerp(14, 78, y);
  let b = lerp(20, 99, y);

  // จอ (rounded rect) สีอ่อน
  const scx = 0.5, scy = 0.5, shw = 0.34, shh = 0.26, sr = 0.10;
  if (inRoundedRect(x, y, scx, scy, shw, shh, sr)) {
    r = 226; g = 232; b = 240; // #E2E8F0
    // ปุ่ม play สี cyan ข้างในจอ
    const tip = { x: 0.40, y: 0.385 };
    const bl = { x: 0.40, y: 0.615 };
    const br = { x: 0.655, y: 0.5 };
    if (inTriangle(x, y, tip, bl, br)) {
      r = 34; g = 211; b = 238; // #22D3EE
    }
  }

  // เส้นฐาน (bar) สี cyan เข้ม
  if (inRoundedRect(x, y, 0.5, 0.885, 0.28, 0.022, 0.022)) {
    r = 8; g = 145; b = 178; // #0891B2
  }

  return [r, g, b, 255];
}

// ─── Render ด้วย supersampling 2x2 (ขอบเรียบ) ─────────────────────
function makeIcon(S) {
  const px = Buffer.alloc(S * S * 4);
  const sub = 2;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < sub; sy++) {
        for (let sx = 0; sx < sub; sx++) {
          const fx = (x + (sx + 0.5) / sub) / S;
          const fy = (y + (sy + 0.5) / sub) / S;
          const c = sample(fx, fy);
          r += c[0]; g += c[1]; b += c[2]; a += c[3];
        }
      }
      const n = sub * sub;
      const i = (y * S + x) * 4;
      px[i] = Math.round(r / n);
      px[i + 1] = Math.round(g / n);
      px[i + 2] = Math.round(b / n);
      px[i + 3] = Math.round(a / n);
    }
  }
  return encodePng(S, S, px);
}

// ─── main ────────────────────────────────────────────────────────
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = [
  { file: 'icon.png', size: 80 },
  { file: 'largeIcon.png', size: 130 },
];

for (const { file, size } of out) {
  const buf = makeIcon(size);
  const dest = path.join(root, file);
  fs.writeFileSync(dest, buf);
  console.log(`✓ ${file} (${size}x${size}, ${buf.length} bytes) → ${dest}`);
}
