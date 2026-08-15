/**
 * ENGLISH — CORE LANGUAGE.
 *
 * This file is the source of truth for every translation key.
 * `th.ts` and `zh.ts` are typed against `Messages` (the type of this object),
 * so the TypeScript compiler enforces that every language defines every key.
 *
 * Keys are namespaced by feature area (`app.*`, `login.*`, `nav.*`, ...).
 * Interpolation: use `{varName}` placeholders and pass values via
 * `t('nav.onlineCount', { online: 2, total: 6 })`.
 */

export const en = {
  // ── App shell ──────────────────────────────────────────────
  'app.loading': 'Loading Digital Signage Platform...',
  'app.welcome': 'Welcome, {name}',
  'app.connectionError': 'Connection Error',
  'app.retry': 'Retry Connection',
  'app.footerWs': 'WebSocket Realtime Engine v4.2',
  'app.footerPort': 'WebSocket Port: 3000',
  'app.footer4k': '4K Smart TV Ready',
  'app.systemOperational': '● System Operational',

  // ── Login ──────────────────────────────────────────────────
  'login.secure': 'Secure Login',
  'login.email': 'Email Address',
  'login.password': 'Password',
  'login.authenticating': 'Authenticating...',
  'login.signIn': 'Sign In',
  'login.guest': 'Enter as Guest (Demo Mode)',
  'login.protected': 'Protected by JWT + RBAC • Session expires in 15 min',
  'login.footer': 'NextGen Digital Signage Platform v0.2.0 • Enterprise Security',
  'login.brandFallback': 'SIGNAGE ENTERPRISE',
  'login.subtitleFallback': 'Smart Digital Signage Management Platform',

  // ── Navigation ─────────────────────────────────────────────
  'nav.adminConsole': 'Admin Console',
  'nav.tvPlayer': 'TV Player App',
  'nav.dualSimulator': 'Dual Simulator',
  'nav.quickPost': 'Quick Post — instant message to all screens',
  'nav.quickPostPrompt': 'Quick Post message (sent to all screens):',
  'nav.branding': 'White-Label Branding Settings',
  'nav.lightMode': 'Switch to Light Mode',
  'nav.darkMode': 'Switch to Dark Mode',
  'nav.wsLive': 'WS Live',
  'nav.wsOffline': 'WS Offline',
  'nav.onlineCount': '({online}/{total} online)',
  'nav.emergencyActive': 'EMERGENCY ACTIVE',
  'nav.emergencyAlert': 'EMERGENCY ALERT',
  'nav.enterprise': 'ENTERPRISE',
  'nav.screensMatrix': 'Screens Matrix',
  'nav.smartLayout': 'Smart Layout Studio',
  'nav.mediaLibrary': 'Media Library',
  'nav.playlists': 'Playlists',
  'nav.scheduler': 'Scheduler Engine',
  'nav.campaigns': 'Campaigns',
  'nav.realtimeControl': 'Realtime Control',
  'nav.analytics': 'Analytics & Telemetry',
  'nav.slideshow': 'Slideshow Studio',
  'nav.backup': 'Backup',
  'nav.aiConfig': 'AI Config',

  // ── Emergency (banner + modal + player overlay) ────────────
  'emergency.bannerCritical': 'CRITICAL BROADCAST OVERRIDE',
  'emergency.triggered': 'Triggered {time}',
  'emergency.clear': 'CLEAR EMERGENCY BROADCAST',
  'emergency.modalTitle': 'Trigger Live Emergency Override',
  'emergency.modalSubtitle': 'Overrides all screen playlists instantaneously via WebSocket',
  'emergency.presetTemplate': '1. Choose Preset Alert Template',
  'emergency.presetFire': 'Fire Evac',
  'emergency.presetWeather': 'Weather',
  'emergency.presetLockdown': 'Lockdown',
  'emergency.presetCustom': 'Custom',
  'emergency.alertTitle': 'Alert Headline Title',
  'emergency.alertMessage': 'Broadcast Message Text',
  'emergency.targetScope': 'Target Screen Scope',
  'emergency.allDisplays': '🌐 ALL Enterprise Displays ({count})',
  'emergency.severity': 'Severity Level',
  'emergency.severityCritical': '🔴 Critical (Flash Red Screen + Sound)',
  'emergency.severityWarning': '🟠 Warning (Amber Caution Banner)',
  'emergency.severityInfo': '🔵 Info (Blue Notification)',
  'emergency.cancel': 'Cancel',
  'emergency.broadcast': 'BROADCAST INSTANT OVERRIDE',
  'emergency.fireDefaultTitle': 'FIRE EVACUATION WARNING',
  'emergency.fireDefaultMsg': 'PLEASE EVACUATE THE BUILDING IMMEDIATELY. USE STAIRWELLS. DO NOT USE ELEVATORS.',
  'emergency.presetFireTitle': 'FIRE EVACUATION EMERGENCY',
  'emergency.presetFireMsg': 'FIRE ALARM ACTIVATED. EVACUATE VIA NEAREST EMERGENCY EXIT IMMEDIATELY.',
  'emergency.presetWeatherTitle': 'SEVERE WEATHER SHELTER NOTICE',
  'emergency.presetWeatherMsg': 'SEVERE STORM & TORNADO WARNING IN EFFECT. MOVE TO INTERIOR GROUND FLOOR SHELTERS.',
  'emergency.presetLockdownTitle': 'SECURITY LOCKDOWN IN EFFECT',
  'emergency.presetLockdownMsg': 'SECURITY ANNOUNCEMENT: STAY IN COVERED CLASSROOMS OR OFFICES. LOCK DOORS.',
  'emergency.presetCustomTitle': 'SPECIAL SYSTEM NOTICE',
  'emergency.presetCustomMsg': 'PLEASE ATTEND ALL-HANDS MEETING IN MAIN AUDITORIUM.',

  // ── Player overlays ────────────────────────────────────────
  'player.emergencyOverride': '🚨 EMERGENCY OVERRIDE BROADCAST',
  'player.triggeredAt': 'Triggered at {time} • All zones overridden',

  // ── Language switcher ──────────────────────────────────────
  'language.label': 'Language',
};

export type Messages = typeof en;
export type TranslationKey = keyof Messages;
