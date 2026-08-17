#!/bin/sh
# autostart-root.sh — เปิดแอป NextGen Signage Player อัตโนมัติหลัง boot
#
# เงื่อนไข: ทีวีต้อง root ผ่าน webOS Homebrew (webosbrew) แล้วเท่านั้น
# (จอ consumer webOS ไม่มี auto-launch โดยไม่ root — ดู README.md)
#
# ติดตั้ง:
#   scp scripts/autostart-root.sh root@<TV_IP>:/var/lib/webosbrew/init.d/S90-signage.sh
#   ssh root@<TV_IP> "chmod +x /var/lib/webosbrew/init.d/S90-signage.sh && reboot"

# รอให้ระบบ + network พร้อมก่อน launch (webOS ใช้เวลา boot ประมาณ 15-30 วิ)
sleep 20

# launch แอป (id ต้องตรงกับ appinfo.json)
luna-send -n 1 -f luna://com.webos.applicationManager/launch '{"id":"com.nextgen.webos-player"}'
