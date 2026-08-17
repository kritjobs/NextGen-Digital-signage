/**
 * app.js — NextGen Signage Player (webOS kiosk shell)
 *
 * Flow:  Settings (server URL) → Pairing (code จาก Admin) → Kiosk (iframe /display/:id)
 *
 * สถาปัตยกรรมเหมือน android-player/MainActivity.kt:
 *   - Shell เป็น webOS web app (vanilla JS) ไม่มี build step
 *   - หน้าแสดงผลจริงคือเว็บแอปของ server ที่โหลดใน iframe เต็มจอ
 *     ({server}/display/{screenId}?token=xxx) — สั่งงาน layout/media/widgets ทั้งหมด
 *   - Shell ทำแค่: เก็บ config, pairing, รีโหลดเมื่อเน็ตกลับ, เมนู (กัน user ออกนอก kiosk)
 *
 * หมายเหตุ key รีโมท webOS (WebKit): 'Red', 'Back', 'Exit', 'ArrowUp/Down', 'Enter'
 */
(function () {
  'use strict';

  // ─── Config (localStorage ของ shell — แยกจาก localStorage ของหน้า display) ───
  var KEYS = {
    serverUrl: 'signage_server_url',
    token: 'signage_display_token',
    screenId: 'signage_display_screen_id'
  };
  var Store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
    remove: function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  var $ = function (id) { return document.getElementById(id); };
  var views = { settings: $('view-settings'), pair: $('view-pair'), kiosk: $('view-kiosk') };

  // ─── Helpers ─────────────────────────────────────────────
  function normalizeUrl(url) {
    var result = (url || '').trim();
    if (!result) return '';
    if (!/^https?:\/\//i.test(result)) result = 'http://' + result;
    return result.replace(/\/+$/, '');
  }

  function fetchWithTimeout(url, options, timeoutMs) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, timeoutMs || 5000);
    return fetch(url, Object.assign({}, options, { signal: ctrl.signal }))
      .finally(function () { clearTimeout(timer); });
  }

  function showView(name) {
    Object.keys(views).forEach(function (k) { views[k].classList.toggle('active', k === name); });
  }

  function setStatus(elId, text, kind) {
    var el = $(elId);
    el.textContent = text;
    el.className = 'status' + (kind ? ' ' + kind : '');
  }

  function log(msg) { console.log('[webos-player]', msg); }

  // ─── View: Settings ──────────────────────────────────────
  function showSettings() {
    showView('settings');
    $('server-url').value = Store.get(KEYS.serverUrl) || '';
    setStatus('settings-status', '');
    setTimeout(function () { $('server-url').focus(); }, 50);
  }

  function testConnection() {
    var url = normalizeUrl($('server-url').value);
    if (!url) { setStatus('settings-status', 'กรุณากรอก Server URL', 'err'); return; }
    $('server-url').value = url;
    setStatus('settings-status', 'กำลังทดสอบ...', '');
    $('btn-test').disabled = true;
    fetchWithTimeout(url + '/api/health', {}, 5000)
      .then(function (res) {
        return res.text().then(function (body) {
          if (res.ok && (/ok/i.test(body) || /Digital Signage/i.test(body))) {
            setStatus('settings-status', '✓ เชื่อมต่อสำเร็จ — Server ทำงานปกติ', 'ok');
          } else {
            setStatus('settings-status', 'เชื่อมต่อได้ แต่ตอบกลับแปลกๆ (HTTP ' + res.status + ')', 'err');
          }
        });
      })
      .catch(function (err) {
        setStatus('settings-status', 'เชื่อมต่อไม่ได้: ' + err.message, 'err');
      })
      .finally(function () { $('btn-test').disabled = false; });
  }

  // ─── View: Pairing ───────────────────────────────────────
  function showPair() {
    showView('pair');
    $('pair-server').textContent = Store.get(KEYS.serverUrl) || '';
    setStatus('pair-status', '');
    setTimeout(function () { $('pair-code').focus(); }, 50);
  }

  function pairWithServer(code) {
    var server = Store.get(KEYS.serverUrl);
    if (!server) { showSettings(); return; }
    setStatus('pair-status', 'กำลังจับคู่...', '');
    $('btn-pair').disabled = true;

    var deviceInfo = {
      userAgent: navigator.userAgent,
      resolution: (screen.width || 0) + 'x' + (screen.height || 0)
    };

    fetchWithTimeout(server + '/api/display/pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairingCode: code, deviceInfo: deviceInfo })
    }, 8000)
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (out) {
        if (!out.ok) {
          setStatus('pair-status', (out.data && out.data.error) || 'จับคู่ไม่สำเร็จ', 'err');
          return;
        }
        var d = out.data;
        Store.set(KEYS.token, d.displayToken);
        Store.set(KEYS.screenId, d.screen.id);
        setStatus('pair-status', '✓ จับคู่สำเร็จ: ' + d.screen.name, 'ok');
        setTimeout(startKiosk, 400);
      })
      .catch(function (err) {
        setStatus('pair-status', 'เชื่อมต่อ server ไม่ได้: ' + err.message, 'err');
      })
      .finally(function () { $('btn-pair').disabled = false; });
  }

  // ─── View: Kiosk ─────────────────────────────────────────
  var frame = $('kiosk-frame');
  var catcher = $('key-catcher');
  var badge = $('status-badge');
  var badgeText = $('status-text');
  var menuOverlay = $('menu-overlay');
  var kioskUrl = '';
  var wasOnline = true;
  var pingTimer = null;
  var menuOpen = false;

  function currentKioskUrl() {
    var server = Store.get(KEYS.serverUrl);
    var token = Store.get(KEYS.token);
    var screenId = Store.get(KEYS.screenId);
    // kiosk=1 → DisplayKiosk ข้าม overlay "Click to enter fullscreen"
    // (shell เป็น kiosk เต็มจออยู่แล้ว + key-catcher กัน input ไม่ให้ถึง iframe)
    return server + '/display/' + screenId + '?token=' + encodeURIComponent(token) + '&kiosk=1';
  }

  function startKiosk() {
    if (!Store.get(KEYS.serverUrl) || !Store.get(KEYS.token) || !Store.get(KEYS.screenId)) {
      showPair();
      return;
    }
    kioskUrl = currentKioskUrl();
    frame.src = kioskUrl;
    showView('kiosk');
    badge.hidden = true;   // ซ่อนตอนปกติ — จะโผล่เฉพาะตอน offline/error/กลับมาออนไลน์
    wasOnline = true;
    WebOS.keepAwake();
    startPing();
    setTimeout(function () { catcher.focus(); }, 300);
    log('Kiosk เปิด: ' + kioskUrl);
  }

  function reloadKiosk() {
    if (!kioskUrl) return;
    frame.src = kioskUrl; // reassign src = โหลดใหม่
    badge.hidden = true;
    log('รีโหลด kiosk');
  }

  function stopPing() {
    if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
  }

  function setBadge(text, state) {
    badgeText.textContent = text;
    badge.className = 'badge ' + state;
    badge.hidden = false;
  }

  /** ตรวจเน็ต/Server ทุก 15 วิ — หลุด → badge; กลับมา → รีโหลด (เหมือน delta sync ของ Android) */
  function startPing() {
    stopPing();
    var server = Store.get(KEYS.serverUrl);
    var check = function () {
      if (navigator.onLine === false) {
        if (wasOnline) { wasOnline = false; setBadge('ออฟไลน์ — เล่นจากแคช', 'offline'); }
        return;
      }
      fetchWithTimeout(server + '/api/health', {}, 5000)
        .then(function (res) {
          var online = res.ok;
          if (online && !wasOnline) {
            wasOnline = true;
            setBadge('กลับมาออนไลน์ — รีโหลด', 'online');
            reloadKiosk();
          } else if (!online && wasOnline) {
            wasOnline = false;
            setBadge('Server ไม่ตอบสนอง', 'error');
          } else {
            wasOnline = online;
            if (online) badge.hidden = true; // ปกติแล้วซ่อน badge ไว้
          }
        })
        .catch(function () {
          if (wasOnline) { wasOnline = false; setBadge('Server ไม่ถึง — เช็คเน็ต/สายแลน', 'error'); }
        });
    };
    check();
    pingTimer = setInterval(check, 15000);
  }

  // ─── เมนู kiosk (กด Red / Back) ─────────────────────────
  function openMenu() {
    menuOpen = true;
    menuOverlay.hidden = false;
    var items = menuOverlay.querySelectorAll('.menu-item');
    if (items.length) items[0].focus();
  }

  function closeMenu() {
    menuOpen = false;
    menuOverlay.hidden = true;
    catcher.focus();
  }

  function handleMenuAction(action) {
    closeMenu();
    if (action === 'reload') { reloadKiosk(); }
    else if (action === 'unpair') {
      Store.remove(KEYS.token);
      Store.remove(KEYS.screenId);
      stopPing();
      showPair();
    }
    else if (action === 'server') {
      Store.remove(KEYS.token);
      Store.remove(KEYS.screenId);
      stopPing();
      showSettings();
    }
    else if (action === 'exit') {
      // best-effort — บาง firmware ต้องปิดจาก Dev Manager/รีโมท
      try { window.close(); } catch (e) { /* ignore */ }
      window.location.href = 'about:blank';
    }
  }

  // ─── Remote keys ─────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    var key = e.key || '';
    if (key === 'Red') { e.preventDefault(); menuOpen ? closeMenu() : openMenu(); return; }

    if (menuOpen) {
      if (key === 'Back' || key === 'Escape' || key === 'Exit') { e.preventDefault(); closeMenu(); return; }
      var items = Array.prototype.slice.call(menuOverlay.querySelectorAll('.menu-item'));
      var idx = items.indexOf(document.activeElement);
      if (key === 'ArrowDown') { e.preventDefault(); items[(idx + 1) % items.length].focus(); }
      else if (key === 'ArrowUp') { e.preventDefault(); items[(idx - 1 + items.length) % items.length].focus(); }
      else if (key === 'Enter' || key === 'OK') {
        e.preventDefault();
        if (document.activeElement && document.activeElement.dataset && document.activeElement.dataset.action) {
          handleMenuAction(document.activeElement.dataset.action);
        }
      }
      return;
    }

    // หน้า kiosk: Back/Exit → เปิดเมนูแทนการออกจากแอป (kiosk lock แบบเบา)
    if (key === 'Back' || key === 'Exit' || key === 'Escape') {
      e.preventDefault();
      openMenu();
    }
  }, true);

  // Menu buttons (คลิก/OK)
  menuOverlay.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.menu-item') : null;
    if (btn && btn.dataset.action) handleMenuAction(btn.dataset.action);
  });

  // ─── Events ──────────────────────────────────────────────
  $('btn-test').addEventListener('click', testConnection);
  $('settings-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var url = normalizeUrl($('server-url').value);
    if (!url) { setStatus('settings-status', 'กรุณากรอก Server URL', 'err'); return; }
    Store.set(KEYS.serverUrl, url);
    showPair();
  });
  $('pair-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var code = $('pair-code').value.trim().toUpperCase();
    if (!code) { setStatus('pair-status', 'กรุณากรอก Pairing Code', 'err'); return; }
    pairWithServer(code);
  });
  $('btn-change-server').addEventListener('click', function () {
    Store.remove(KEYS.token);
    Store.remove(KEYS.screenId);
    showSettings();
  });

  // ─── Boot ────────────────────────────────────────────────
  var server = Store.get(KEYS.serverUrl);
  var token = Store.get(KEYS.token);
  var screenId = Store.get(KEYS.screenId);
  if (server && token && screenId) startKiosk();
  else if (server) showPair();
  else showSettings();
})();
