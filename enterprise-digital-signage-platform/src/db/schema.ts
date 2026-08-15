import {
  pgTable, varchar, text, integer, boolean, numeric,
  timestamp, time, date, bigserial, jsonb, index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── 1. playlists (no foreign deps) ─────────────────────────
export const playlists = pgTable('playlists', {
  id:            varchar('id', { length: 50 }).primaryKey(),
  name:          varchar('name', { length: 200 }).notNull(),
  description:   text('description').notNull().default(''),
  totalDuration: integer('total_duration').notNull().default(0),
  tags:          text('tags').array().notNull().default([]),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── 2. layouts (no foreign deps) ───────────────────────────
export const layouts = pgTable('layouts', {
  id:          varchar('id', { length: 50 }).primaryKey(),
  tags:        text('tags').array().notNull().default([]),
  name:        varchar('name', { length: 200 }).notNull(),
  description: text('description').notNull().default(''),
  orientation: varchar('orientation', { length: 20 }).notNull().default('landscape'),
  aspectRatio: varchar('aspect_ratio', { length: 10 }).notNull().default('16:9'),
  widthPx:     integer('width_px').notNull().default(1920),
  heightPx:    integer('height_px').notNull().default(1080),
  status:      varchar('status', { length: 20 }).notNull().default('published'), // draft | published | archived
  approvalStatus: varchar('approval_status', { length: 20 }).notNull().default('approved'), // pending | approved | rejected
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── 3. media_items ─────────────────────────────────────────
export const mediaItems = pgTable('media_items', {
  id:             varchar('id', { length: 50 }).primaryKey(),
  title:          varchar('title', { length: 300 }).notNull(),
  type:           varchar('type', { length: 20 }).notNull(),
  url:            text('url').notNull().default(''),
  duration:       integer('duration').notNull().default(10),
  sizeMb:         numeric('size_mb', { precision: 8, scale: 2 }).notNull().default('0'),
  tags:           text('tags').array().notNull().default([]),
  thumbnailUrl:   text('thumbnail_url').notNull().default(''),
  // contentData fields (denormalized)
  tickerText:     text('ticker_text'),
  tickerSpeed:    integer('ticker_speed'),
  weatherCity:    varchar('weather_city', { length: 100 }),
  clockFormat:    varchar('clock_format', { length: 5 }),
  announceHeader: varchar('announce_header', { length: 200 }),
  announceBody:   text('announce_body'),
  webUrl:         text('web_url'),
  expiresAt:      timestamp('expires_at', { withTimezone: true }),
  releaseDate:    timestamp('release_date', { withTimezone: true }),
  fallbackImageUrl: text('fallback_image_url').notNull().default(''),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_media_items_type').on(t.type),
]);

// ─── 4. layout_zones (→ layouts, playlists) ─────────────────
export const layoutZones = pgTable('layout_zones', {
  id:              varchar('id', { length: 50 }).primaryKey(),
  layoutId:        varchar('layout_id', { length: 50 }).notNull().references(() => layouts.id, { onDelete: 'cascade' }),
  name:            varchar('name', { length: 100 }).notNull(),
  x:               numeric('x', { precision: 5, scale: 2 }).notNull().default('0'),
  y:               numeric('y', { precision: 5, scale: 2 }).notNull().default('0'),
  width:           numeric('width', { precision: 5, scale: 2 }).notNull().default('100'),
  height:          numeric('height', { precision: 5, scale: 2 }).notNull().default('100'),
  zIndex:          integer('z_index').notNull().default(1),
  playlistId:      varchar('playlist_id', { length: 50 }).references(() => playlists.id, { onDelete: 'set null' }),
  mediaType:       varchar('media_type', { length: 30 }),
  isLocked:        boolean('is_locked').notNull().default(false),
  backgroundColor: varchar('background_color', { length: 30 }).default('#000000'),
  contentData:     jsonb('content_data'),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_layout_zones_layout_id').on(t.layoutId),
]);

// ─── 5. playlist_items (→ playlists, mediaItems) ────────────
export const playlistItems = pgTable('playlist_items', {
  id:         varchar('id', { length: 50 }).primaryKey(),
  playlistId: varchar('playlist_id', { length: 50 }).notNull().references(() => playlists.id, { onDelete: 'cascade' }),
  mediaId:    varchar('media_id', { length: 50 }).notNull().references(() => mediaItems.id, { onDelete: 'cascade' }),
  subPlaylistId: varchar('sub_playlist_id', { length: 50 }).references(() => playlists.id, { onDelete: 'set null' }),
  duration:   integer('duration').notNull().default(10),
  order:      integer('order').notNull().default(1),
  transition: varchar('transition', { length: 10 }).notNull().default('fade'),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_playlist_items_playlist_id').on(t.playlistId),
  index('idx_playlist_items_order').on(t.playlistId, t.order),
]);

// ─── 6. screens (→ layouts, playlists) ──────────────────────
export const screens = pgTable('screens', {
  id:                   varchar('id', { length: 50 }).primaryKey(),
  pairingCode:          varchar('pairing_code', { length: 20 }).notNull().unique(),
  name:                 varchar('name', { length: 200 }).notNull(),
  group:                varchar('group', { length: 100 }).notNull().default(''),
  tags:                 text('tags').array().notNull().default([]),
  location:             varchar('location', { length: 300 }).notNull().default(''),
  orientation:          varchar('orientation', { length: 20 }).notNull().default('landscape'),
  resolution:           varchar('resolution', { length: 50 }).notNull().default('1920x1080 (FHD)'),
  status:               varchar('status', { length: 20 }).notNull().default('offline'),
  lastHeartbeat:        timestamp('last_heartbeat', { withTimezone: true }),
  ipAddress:            varchar('ip_address', { length: 45 }),
  macAddress:           varchar('mac_address', { length: 17 }),
  storageUsageMb:       integer('storage_usage_mb').notNull().default(0),
  storageTotalMb:       integer('storage_total_mb').notNull().default(8000),
  bufferCachedItems:    integer('buffer_cached_items').notNull().default(0),
  currentLayoutId:      varchar('current_layout_id', { length: 50 }).references(() => layouts.id, { onDelete: 'set null' }),
  currentPlaylistId:    varchar('current_playlist_id', { length: 50 }).references(() => playlists.id, { onDelete: 'set null' }),
  fallbackLayoutId:     varchar('fallback_layout_id', { length: 50 }).references(() => layouts.id, { onDelete: 'set null' }),
  activeEmergencyId:    varchar('active_emergency_id', { length: 50 }),
  volume:               integer('volume').notNull().default(75),
  isMuted:              boolean('is_muted').notNull().default(false),
  firmwareVersion:      varchar('firmware_version', { length: 30 }).notNull().default('v1.0.0'),
  uptimeSeconds:        integer('uptime_seconds').notNull().default(0),
  lastScreenshotUrl:    text('last_screenshot_url'),
  createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_screens_status').on(t.status),
  index('idx_screens_group').on(t.group),
]);

// ─── 7. schedules ───────────────────────────────────────────
export const schedules = pgTable('schedules', {
  id:             varchar('id', { length: 50 }).primaryKey(),
  name:           varchar('name', { length: 200 }).notNull(),
  playlistId:     varchar('playlist_id', { length: 50 }).references(() => playlists.id, { onDelete: 'set null' }),
  layoutId:       varchar('layout_id', { length: 50 }).references(() => layouts.id, { onDelete: 'set null' }),
  screenGroupIds: text('screen_group_ids').array().notNull().default([]),
  screenIds:      text('screen_ids').array().notNull().default([]),
  priority:       integer('priority').notNull().default(50),
  startDate:      date('start_date').notNull(),
  endDate:        date('end_date').notNull(),
  startTime:      time('start_time').notNull().default('00:00'),
  endTime:        time('end_time').notNull().default('23:59'),
  daysOfWeek:     integer('days_of_week').array().notNull().default([1, 2, 3, 4, 5]),
  isActive:       boolean('is_active').notNull().default(true),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_schedules_is_active').on(t.isActive),
  index('idx_schedules_priority').on(t.priority),
]);

// ─── 8. emergency_alerts ────────────────────────────────────
export const emergencyAlerts = pgTable('emergency_alerts', {
  id:              varchar('id', { length: 50 }).primaryKey(),
  title:           varchar('title', { length: 200 }).notNull(),
  message:         text('message').notNull(),
  type:            varchar('type', { length: 20 }).notNull().default('custom'),
  severity:        varchar('severity', { length: 10 }).notNull().default('critical'),
  targetScreenIds: text('target_screen_ids').array().notNull().default([]),
  isActive:        boolean('is_active').notNull().default(false),
  triggeredAt:     timestamp('triggered_at', { withTimezone: true }),
  triggeredBy:     varchar('triggered_by', { length: 100 }),
  clearedAt:       timestamp('cleared_at', { withTimezone: true }),
  clearedBy:       varchar('cleared_by', { length: 100 }),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_emergency_alerts_is_active').on(t.isActive),
  index('idx_emergency_alerts_triggered_at').on(t.triggeredAt),
]);

// ─── 8b. campaigns (multi-layout rotation) ──────────────────
export const campaigns = pgTable('campaigns', {
  id:          varchar('id', { length: 50 }).primaryKey(),
  name:        varchar('name', { length: 200 }).notNull(),
  description: text('description').notNull().default(''),
  isActive:    boolean('is_active').notNull().default(true),
  // JSON array of { layoutId, durationSec }
  layoutSequence: jsonb('layout_sequence').notNull().default('[]'),
  cycleMode:   varchar('cycle_mode', { length: 20 }).notNull().default('sequential'), // sequential | random
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── 8c. quick_posts (instant notices) ──────────────────────
export const quickPosts = pgTable('quick_posts', {
  id:              varchar('id', { length: 50 }).primaryKey(),
  message:         text('message').notNull(),
  style:           varchar('style', { length: 20 }).notNull().default('info'), // info | warning | success | urgent
  targetScreenIds: text('target_screen_ids').array().notNull().default([]), // empty = all
  duration:        integer('duration').notNull().default(30), // seconds to display
  createdBy:       varchar('created_by', { length: 100 }),
  isActive:        boolean('is_active').notNull().default(true),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt:       timestamp('expires_at', { withTimezone: true }),
});

// ─── 8d. layout_versions (version history for rollback) ─────
export const layoutVersions = pgTable('layout_versions', {
  id:         bigserial('id', { mode: 'number' }).primaryKey(),
  layoutId:   varchar('layout_id', { length: 50 }).notNull(),
  version:    integer('version').notNull().default(1),
  snapshot:   jsonb('snapshot').notNull(), // full layout + zones JSON
  changedBy:  varchar('changed_by', { length: 100 }),
  changeNote: varchar('change_note', { length: 300 }),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── 9. telemetry_logs ──────────────────────────────────────
export const telemetryLogs = pgTable('telemetry_logs', {
  id:         bigserial('id', { mode: 'number' }).primaryKey(),
  screenId:   varchar('screen_id', { length: 50 }).notNull(),
  screenName: varchar('screen_name', { length: 200 }).notNull(),
  eventType:  varchar('event_type', { length: 20 }).notNull(),
  message:    text('message').notNull(),
  details:    jsonb('details'),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_telemetry_screen_id').on(t.screenId),
  index('idx_telemetry_event_type').on(t.eventType),
  index('idx_telemetry_created_at').on(t.createdAt),
]);

// ─── 10. proof_of_play_logs ─────────────────────────────────
export const proofOfPlayLogs = pgTable('proof_of_play_logs', {
  id:              bigserial('id', { mode: 'number' }).primaryKey(),
  screenId:        varchar('screen_id', { length: 50 }).notNull(),
  screenName:      varchar('screen_name', { length: 200 }).notNull(),
  mediaId:         varchar('media_id', { length: 50 }).notNull(),
  mediaTitle:      varchar('media_title', { length: 300 }).notNull(),
  playedAt:        timestamp('played_at', { withTimezone: true }).notNull().defaultNow(),
  durationSeconds: integer('duration_seconds').notNull().default(0),
  status:          varchar('status', { length: 15 }).notNull().default('completed'),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_pop_screen_id').on(t.screenId),
  index('idx_pop_media_id').on(t.mediaId),
  index('idx_pop_played_at').on(t.playedAt),
]);

// ─── Relations ───────────────────────────────────────────────
export const layoutsRelations = relations(layouts, ({ many }) => ({
  zones: many(layoutZones),
}));

export const layoutZonesRelations = relations(layoutZones, ({ one }) => ({
  layout:   one(layouts,   { fields: [layoutZones.layoutId],   references: [layouts.id] }),
  playlist: one(playlists, { fields: [layoutZones.playlistId], references: [playlists.id] }),
}));

export const playlistsRelations = relations(playlists, ({ many }) => ({
  items: many(playlistItems),
}));

export const playlistItemsRelations = relations(playlistItems, ({ one }) => ({
  playlist: one(playlists,  { fields: [playlistItems.playlistId], references: [playlists.id] }),
  media:    one(mediaItems, { fields: [playlistItems.mediaId],    references: [mediaItems.id] }),
}));

export const screensRelations = relations(screens, ({ one }) => ({
  currentLayout:   one(layouts,   { fields: [screens.currentLayoutId],   references: [layouts.id] }),
  currentPlaylist: one(playlists, { fields: [screens.currentPlaylistId], references: [playlists.id] }),
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
  playlist: one(playlists, { fields: [schedules.playlistId], references: [playlists.id] }),
  layout:   one(layouts,   { fields: [schedules.layoutId],   references: [layouts.id] }),
}));

// ─── Type exports (Drizzle inferred types) ──────────────────
export type Screen          = typeof screens.$inferSelect;
export type NewScreen       = typeof screens.$inferInsert;
export type MediaItem       = typeof mediaItems.$inferSelect;
export type NewMediaItem    = typeof mediaItems.$inferInsert;
export type Layout          = typeof layouts.$inferSelect;
export type NewLayout       = typeof layouts.$inferInsert;
export type LayoutZone      = typeof layoutZones.$inferSelect;
export type NewLayoutZone   = typeof layoutZones.$inferInsert;
export type Playlist        = typeof playlists.$inferSelect;
export type NewPlaylist      = typeof playlists.$inferInsert;
export type PlaylistItem    = typeof playlistItems.$inferSelect;
export type NewPlaylistItem = typeof playlistItems.$inferInsert;
export type Schedule        = typeof schedules.$inferSelect;
export type NewSchedule     = typeof schedules.$inferInsert;
export type EmergencyAlert  = typeof emergencyAlerts.$inferSelect;
export type NewEmergencyAlert = typeof emergencyAlerts.$inferInsert;
export type TelemetryLog    = typeof telemetryLogs.$inferSelect;
export type ProofOfPlayLog  = typeof proofOfPlayLogs.$inferSelect;


// ═══════════════════════════════════════════════════════════════
// SECURITY TABLES — Authentication, Authorization, Audit
// ═══════════════════════════════════════════════════════════════

// ─── 11. users ──────────────────────────────────────────────
export const users = pgTable('users', {
  id:             varchar('id', { length: 50 }).primaryKey(),
  email:          varchar('email', { length: 255 }).notNull().unique(),
  passwordHash:   text('password_hash').notNull(),
  displayName:    varchar('display_name', { length: 200 }).notNull(),
  role:           varchar('role', { length: 20 }).notNull().default('viewer'),
  // role: 'super_admin' | 'admin' | 'staff' | 'viewer' | 'device'
  isActive:       boolean('is_active').notNull().default(true),
  lastLoginAt:    timestamp('last_login_at', { withTimezone: true }),
  failedAttempts: integer('failed_attempts').notNull().default(0),
  lockedUntil:    timestamp('locked_until', { withTimezone: true }),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_users_email').on(t.email),
  index('idx_users_role').on(t.role),
]);

// ─── 12. refresh_tokens ─────────────────────────────────────
export const refreshTokens = pgTable('refresh_tokens', {
  id:         bigserial('id', { mode: 'number' }).primaryKey(),
  userId:     varchar('user_id', { length: 50 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  token:      text('token').notNull().unique(),
  userAgent:  text('user_agent'),
  ipAddress:  varchar('ip_address', { length: 45 }),
  expiresAt:  timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt:  timestamp('revoked_at', { withTimezone: true }),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_refresh_tokens_user_id').on(t.userId),
  index('idx_refresh_tokens_token').on(t.token),
  index('idx_refresh_tokens_expires_at').on(t.expiresAt),
]);

// ─── 13. api_keys (สำหรับ Player devices) ───────────────────
export const apiKeys = pgTable('api_keys', {
  id:         varchar('id', { length: 50 }).primaryKey(),
  name:       varchar('name', { length: 200 }).notNull(),
  keyHash:    text('key_hash').notNull().unique(),     // bcrypt hash ของ API key
  keyPrefix:  varchar('key_prefix', { length: 10 }).notNull(), // เก็บ 8 ตัวแรกเพื่อ identify
  screenId:   varchar('screen_id', { length: 50 }).references(() => screens.id, { onDelete: 'set null' }),
  permissions: text('permissions').array().notNull().default(['read:screens', 'write:heartbeat']),
  isActive:   boolean('is_active').notNull().default(true),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  expiresAt:  timestamp('expires_at', { withTimezone: true }),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_api_keys_key_prefix').on(t.keyPrefix),
  index('idx_api_keys_screen_id').on(t.screenId),
]);

// ─── 14. audit_logs ─────────────────────────────────────────
export const auditLogs = pgTable('audit_logs', {
  id:          bigserial('id', { mode: 'number' }).primaryKey(),
  userId:      varchar('user_id', { length: 50 }),       // null = system/anonymous
  userEmail:   varchar('user_email', { length: 255 }),
  action:      varchar('action', { length: 50 }).notNull(),
  // actions: 'login', 'logout', 'create', 'update', 'delete',
  //          'emergency_trigger', 'emergency_clear', 'command_sent'
  resource:    varchar('resource', { length: 50 }).notNull(), // 'screen', 'media', 'playlist', 'emergency'
  resourceId:  varchar('resource_id', { length: 50 }),
  details:     jsonb('details'),                            // old/new values, metadata
  ipAddress:   varchar('ip_address', { length: 45 }),
  userAgent:   text('user_agent'),
  severity:    varchar('severity', { length: 10 }).notNull().default('info'),
  // severity: 'info', 'warning', 'critical'
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_audit_logs_user_id').on(t.userId),
  index('idx_audit_logs_action').on(t.action),
  index('idx_audit_logs_resource').on(t.resource),
  index('idx_audit_logs_created_at').on(t.createdAt),
]);

// ─── Relations (Security tables) ────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  apiKeys:       many(apiKeys),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  screen: one(screens, { fields: [apiKeys.screenId], references: [screens.id] }),
}));

// ─── Security Type exports ──────────────────────────────────
export type User            = typeof users.$inferSelect;
export type NewUser         = typeof users.$inferInsert;
export type RefreshToken    = typeof refreshTokens.$inferSelect;
export type ApiKey          = typeof apiKeys.$inferSelect;
export type AuditLog        = typeof auditLogs.$inferSelect;


// ═══════════════════════════════════════════════════════════════
// SLIDESHOW SYSTEM
// ═══════════════════════════════════════════════════════════════

// ─── 15. slideshows ─────────────────────────────────────────
export const slideshows = pgTable('slideshows', {
  id:              varchar('id', { length: 50 }).primaryKey(),
  title:           varchar('title', { length: 300 }).notNull(),
  description:     text('description').notNull().default(''),
  // Theme settings
  themeId:         varchar('theme_id', { length: 50 }),
  themeName:       varchar('theme_name', { length: 100 }),
  accentColor:     varchar('accent_color', { length: 20 }).default('#F2CA50'),
  titleFont:       varchar('title_font', { length: 50 }).default('Inter'),
  transition:      varchar('transition', { length: 20 }).notNull().default('fade'),
  // transition: 'fade' | 'slide' | 'zoom' | 'kenburns' | 'none'
  slideDuration:   integer('slide_duration').notNull().default(8), // seconds per slide
  autoPlay:        boolean('auto_play').notNull().default(true),
  loop:            boolean('loop').notNull().default(true),
  showProgress:    boolean('show_progress').notNull().default(true),
  // Status
  status:          varchar('status', { length: 20 }).notNull().default('draft'),
  // status: 'draft' | 'published' | 'archived'
  publishedMediaId: varchar('published_media_id', { length: 50 }),
  // เมื่อ publish → สร้าง media item → เก็บ id ไว้ที่นี่
  slideCount:      integer('slide_count').notNull().default(0),
  totalDuration:   integer('total_duration').notNull().default(0), // seconds
  // Ownership
  createdBy:       varchar('created_by', { length: 50 }),
  tags:            text('tags').array().notNull().default([]),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_slideshows_status').on(t.status),
  index('idx_slideshows_created_by').on(t.createdBy),
]);

// ─── 16. slideshow_slides ───────────────────────────────────
export const slideshowSlides = pgTable('slideshow_slides', {
  id:              varchar('id', { length: 50 }).primaryKey(),
  slideshowId:     varchar('slideshow_id', { length: 50 }).notNull().references(() => slideshows.id, { onDelete: 'cascade' }),
  order:           integer('order').notNull().default(1),
  // Content
  mediaId:         varchar('media_id', { length: 50 }).references(() => mediaItems.id, { onDelete: 'set null' }),
  // mediaId → ดึงรูป/video จาก Media Library
  backgroundUrl:   text('background_url'),           // fallback ถ้าไม่ใช้ media
  backgroundColor: varchar('background_color', { length: 20 }).default('#000000'),
  // Text overlays
  headlineText:    varchar('headline_text', { length: 200 }),
  subtitleText:    varchar('subtitle_text', { length: 200 }),
  bodyText:        text('body_text'),
  ctaText:         varchar('cta_text', { length: 100 }),
  ctaUrl:          text('cta_url'),
  // Positioning & Style
  textPosition:    varchar('text_position', { length: 20 }).default('bottom-left'),
  // textPosition: 'bottom-left' | 'bottom-center' | 'center' | 'top-left' | 'top-right'
  textColor:       varchar('text_color', { length: 20 }).default('#FFFFFF'),
  overlayOpacity:  integer('overlay_opacity').notNull().default(40), // 0-100
  // Per-slide settings (override slideshow defaults)
  duration:        integer('duration'),               // null = use slideshow default
  transition:      varchar('slide_transition', { length: 20 }), // null = use slideshow default
  // Effects
  kenBurns:        boolean('ken_burns').notNull().default(true),
  parallax:        boolean('parallax').notNull().default(false),
  //
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_slideshow_slides_slideshow_id').on(t.slideshowId),
  index('idx_slideshow_slides_order').on(t.slideshowId, t.order),
]);

// ─── Slideshow Relations ────────────────────────────────────
export const slideshowsRelations = relations(slideshows, ({ many }) => ({
  slides: many(slideshowSlides),
}));

export const slideshowSlidesRelations = relations(slideshowSlides, ({ one }) => ({
  slideshow: one(slideshows, { fields: [slideshowSlides.slideshowId], references: [slideshows.id] }),
  media:     one(mediaItems,  { fields: [slideshowSlides.mediaId],     references: [mediaItems.id] }),
}));

// ─── Slideshow Type exports ─────────────────────────────────
export type Slideshow       = typeof slideshows.$inferSelect;
export type NewSlideshow    = typeof slideshows.$inferInsert;
export type SlideshowSlide  = typeof slideshowSlides.$inferSelect;
export type NewSlideshowSlide = typeof slideshowSlides.$inferInsert;


// ═══════════════════════════════════════════════════════════════
// AI SYSTEM — Multi-Provider Router
// ═══════════════════════════════════════════════════════════════

// ─── 17. ai_providers ───────────────────────────────────────
export const aiProviders = pgTable('ai_providers', {
  id:          varchar('id', { length: 50 }).primaryKey(),
  name:        varchar('name', { length: 100 }).notNull(),
  type:        varchar('type', { length: 30 }).notNull(),
  // type: 'gemini' | 'openrouter' | 'ollama' | 'openai_compatible'
  baseUrl:     text('base_url').notNull(),
  apiKey:      text('api_key'),              // encrypted in production
  isEnabled:   boolean('is_enabled').notNull().default(true),
  models:      text('models').array().notNull().default([]),
  // Available models for this provider
  lastTestedAt: timestamp('last_tested_at', { withTimezone: true }),
  lastTestStatus: varchar('last_test_status', { length: 20 }),
  // 'success' | 'failed' | 'untested'
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_ai_providers_type').on(t.type),
]);

// ─── 18. ai_task_configs ────────────────────────────────────
export const aiTaskConfigs = pgTable('ai_task_configs', {
  id:            varchar('id', { length: 50 }).primaryKey(),
  taskType:      varchar('task_type', { length: 30 }).notNull().unique(),
  // taskType: 'text_generation' | 'image_generation' | 'layout_recommendation' |
  //           'diagnosis' | 'translation' | 'slideshow_content'
  taskLabel:     varchar('task_label', { length: 100 }).notNull(),
  description:   text('description'),
  providerId:    varchar('provider_id', { length: 50 }).notNull().references(() => aiProviders.id),
  modelId:       varchar('model_id', { length: 100 }).notNull(),
  systemPrompt:  text('system_prompt'),
  temperature:   numeric('temperature', { precision: 3, scale: 2 }).default('0.7'),
  maxTokens:     integer('max_tokens').default(1000),
  isEnabled:     boolean('is_enabled').notNull().default(true),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_ai_task_configs_task_type').on(t.taskType),
]);

// ─── AI Relations ───────────────────────────────────────────
export const aiTaskConfigsRelations = relations(aiTaskConfigs, ({ one }) => ({
  provider: one(aiProviders, { fields: [aiTaskConfigs.providerId], references: [aiProviders.id] }),
}));

// ─── AI Type exports ────────────────────────────────────────
export type AIProvider    = typeof aiProviders.$inferSelect;
export type NewAIProvider = typeof aiProviders.$inferInsert;
export type AITaskConfig  = typeof aiTaskConfigs.$inferSelect;
export type NewAITaskConfig = typeof aiTaskConfigs.$inferInsert;
