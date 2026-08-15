/**
 * 中文（简体）(Chinese, Simplified)
 * Typed as `Messages` — 编译器会提示任何缺失或多余的键，与 en.ts 完全对齐。
 */

import type { Messages } from './en';

export const zh: Messages = {
  // ── App shell ──────────────────────────────────────────────
  'app.loading': '正在加载数字标牌平台...',
  'app.welcome': '欢迎, {name}',
  'app.connectionError': '连接错误',
  'app.retry': '重试连接',
  'app.footerWs': 'WebSocket 实时引擎 v4.2',
  'app.footerPort': 'WebSocket 端口: 3000',
  'app.footer4k': '支持 4K 智能电视',
  'app.systemOperational': '● 系统运行正常',

  // ── Login ──────────────────────────────────────────────────
  'login.secure': '安全登录',
  'login.email': '邮箱地址',
  'login.password': '密码',
  'login.authenticating': '正在验证...',
  'login.signIn': '登录',
  'login.guest': '以访客身份进入（演示模式）',
  'login.protected': '由 JWT + RBAC 保护 • 会话将在 15 分钟后过期',
  'login.footer': 'NextGen 数字标牌平台 v0.2.0 • 企业级安全',
  'login.brandFallback': 'SIGNAGE ENTERPRISE',
  'login.subtitleFallback': '智能数字标牌管理平台',

  // ── Navigation ─────────────────────────────────────────────
  'nav.adminConsole': '管理控制台',
  'nav.tvPlayer': '电视播放器',
  'nav.dualSimulator': '双屏模拟器',
  'nav.quickPost': '快速发布 — 即时发送消息到所有屏幕',
  'nav.quickPostPrompt': '快速发布消息（发送到所有屏幕）：',
  'nav.branding': '品牌定制设置',
  'nav.lightMode': '切换到浅色模式',
  'nav.darkMode': '切换到深色模式',
  'nav.wsLive': 'WS 在线',
  'nav.wsOffline': 'WS 离线',
  'nav.onlineCount': '（{online}/{total} 在线）',
  'nav.emergencyActive': '紧急广播中',
  'nav.emergencyAlert': '紧急警报',
  'nav.enterprise': '企业版',
  'nav.screensMatrix': '屏幕矩阵',
  'nav.smartLayout': '智能布局工作室',
  'nav.mediaLibrary': '媒体库',
  'nav.playlists': '播放列表',
  'nav.scheduler': '定时引擎',
  'nav.campaigns': '活动管理',
  'nav.realtimeControl': '实时控制',
  'nav.analytics': '分析与遥测',
  'nav.slideshow': '幻灯片工作室',
  'nav.backup': '数据备份',
  'nav.aiConfig': 'AI 配置',

  // ── Emergency ──────────────────────────────────────────────
  'emergency.bannerCritical': '紧急强制广播',
  'emergency.triggered': '触发于 {time}',
  'emergency.clear': '取消紧急广播',
  'emergency.modalTitle': '触发实时紧急广播',
  'emergency.modalSubtitle': '通过 WebSocket 立即覆盖所有屏幕播放列表',
  'emergency.presetTemplate': '1. 选择预设警报模板',
  'emergency.presetFire': '火灾疏散',
  'emergency.presetWeather': '天气',
  'emergency.presetLockdown': '封锁',
  'emergency.presetCustom': '自定义',
  'emergency.alertTitle': '警报标题',
  'emergency.alertMessage': '广播消息内容',
  'emergency.targetScope': '目标屏幕范围',
  'emergency.allDisplays': '🌐 所有企业屏幕（{count}）',
  'emergency.severity': '严重级别',
  'emergency.severityCritical': '🔴 严重（红色闪烁屏幕 + 声音）',
  'emergency.severityWarning': '🟠 警告（琥珀色警示横幅）',
  'emergency.severityInfo': '🔵 信息（蓝色通知）',
  'emergency.cancel': '取消',
  'emergency.broadcast': '立即强制广播',
  'emergency.fireDefaultTitle': '火灾疏散警告',
  'emergency.fireDefaultMsg': '请立即撤离大楼。请使用楼梯，切勿使用电梯。',
  'emergency.presetFireTitle': '火灾疏散紧急事件',
  'emergency.presetFireMsg': '火灾警报已启动，请立即通过最近的紧急出口撤离。',
  'emergency.presetWeatherTitle': '恶劣天气避难通知',
  'emergency.presetWeatherMsg': '暴风雨及龙卷风警告生效，请移至建筑内底层避难。',
  'emergency.presetLockdownTitle': '安全封锁已生效',
  'emergency.presetLockdownMsg': '安全通知：请留在封闭的教室或办公室内并锁好门窗。',
  'emergency.presetCustomTitle': '系统特别通知',
  'emergency.presetCustomMsg': '请参加主礼堂举行的全体会议。',

  // ── Player overlays ────────────────────────────────────────
  'player.emergencyOverride': '🚨 紧急强制广播',
  'player.triggeredAt': '触发于 {time} • 所有区域已被覆盖',

  // ── Language switcher ──────────────────────────────────────
  'language.label': '语言',
};
