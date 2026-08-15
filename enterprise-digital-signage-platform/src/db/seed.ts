/**
 * Database Seed Script
 * รัน: bun run db:seed
 * Idempotent — ใช้ ON CONFLICT DO NOTHING ปลอดภัยรันซ้ำได้
 */
import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from './schema.js';

const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.POSTGRES_USER ?? 'postgres'}:${process.env.POSTGRES_PASSWORD ?? 'postgres'}@${process.env.POSTGRES_HOST ?? 'localhost'}:${process.env.POSTGRES_PORT ?? '5432'}/${process.env.POSTGRES_DB ?? 'signage_db'}`;

const pool = new Pool({ connectionString, max: 3 });
const db = drizzle(pool, { schema });

async function seed() {
  console.log('[seed] 🌱 Starting seed...');

  // ─── 1. Playlists (ต้องก่อน layouts/screens) ──────────────
  console.log('[seed] Seeding playlists...');
  await db.insert(schema.playlists).values([
    { id: 'pl-corporate-main',    name: 'Corporate Main Lobby Sequence',      description: 'High-definition video showcase', totalDuration: 90,  tags: ['lobby','corporate','welcome'] },
    { id: 'pl-lunch-menu',        name: 'Cafeteria Lunch Specials',            description: 'Gourmet specials and dining',    totalDuration: 45,  tags: ['cafeteria','menu'] },
    { id: 'pl-widgets-sidebar',   name: 'Live Weather & World Clock',          description: 'Clock and weather widgets',      totalDuration: 120, tags: ['widgets','weather','clock'] },
    { id: 'pl-ticker-only',       name: 'Realtime Stock & Campus News Ticker', description: 'Bottom scrolling ticker',        totalDuration: 60,  tags: ['ticker','news'] },
    { id: 'pl-executive-briefing',name: 'Executive Elevator Reel',             description: 'Portrait keynotes and policies', totalDuration: 85,  tags: ['portrait','executive'] },
    { id: 'pl-campus-events',     name: 'Campus Events & Outdoor Showcase',    description: 'Full quad wall sequence',        totalDuration: 75,  tags: ['campus','outdoor'] },
  ]).onConflictDoNothing();

  // ─── 2. Layouts ────────────────────────────────────────────
  console.log('[seed] Seeding layouts...');
  await db.insert(schema.layouts).values([
    { id: 'lay-split-3zone',    name: 'Enterprise 3-Zone Landscape',  description: '70% main + 30% sidebar + 12% ticker', orientation: 'landscape', aspectRatio: '16:9', widthPx: 1920, heightPx: 1080 },
    { id: 'lay-portrait-kiosk', name: 'Portrait Elevator Kiosk',      description: '20% header + 65% carousel + 15% ticker', orientation: 'portrait',  aspectRatio: '9:16', widthPx: 1080, heightPx: 1920 },
    { id: 'lay-menu-board',     name: 'Full Screen Menu Board',        description: 'Single full-bleed canvas zone',       orientation: 'landscape', aspectRatio: '16:9', widthPx: 1920, heightPx: 1080 },
    { id: 'lay-hero-banner',    name: 'Outdoor LED Hero Wall',         description: 'Ultra HD main zone + ticker overlay', orientation: 'landscape', aspectRatio: '16:9', widthPx: 2560, heightPx: 1440 },
  ]).onConflictDoNothing();

  // ─── 3. Layout Zones ───────────────────────────────────────
  console.log('[seed] Seeding layout zones...');
  await db.insert(schema.layoutZones).values([
    // lay-split-3zone
    { id: 'zone-main',   layoutId: 'lay-split-3zone',    name: 'Main Video Zone',         x: '0',  y: '0',  width: '70',  height: '88', zIndex: 1, playlistId: 'pl-corporate-main',  backgroundColor: '#0f172a' },
    { id: 'zone-side',   layoutId: 'lay-split-3zone',    name: 'Sidebar Zone',            x: '70', y: '0',  width: '30',  height: '88', zIndex: 2, playlistId: 'pl-widgets-sidebar', backgroundColor: '#1e293b' },
    { id: 'zone-bottom', layoutId: 'lay-split-3zone',    name: 'Bottom Ticker Zone',      x: '0',  y: '88', width: '100', height: '12', zIndex: 3, playlistId: 'pl-ticker-only',     backgroundColor: '#0284c7' },
    // lay-portrait-kiosk
    { id: 'pzone-top',    layoutId: 'lay-portrait-kiosk', name: 'Top Header Zone',        x: '0',  y: '0',  width: '100', height: '20', zIndex: 1, playlistId: 'pl-widgets-sidebar',    backgroundColor: '#0f172a' },
    { id: 'pzone-center', layoutId: 'lay-portrait-kiosk', name: 'Main Carousel Zone',     x: '0',  y: '20', width: '100', height: '65', zIndex: 2, playlistId: 'pl-executive-briefing', backgroundColor: '#111827' },
    { id: 'pzone-bottom', layoutId: 'lay-portrait-kiosk', name: 'Bottom Ticker Zone',     x: '0',  y: '85', width: '100', height: '15', zIndex: 3, playlistId: 'pl-ticker-only',        backgroundColor: '#1e1b4b' },
    // lay-menu-board
    { id: 'zone-full',    layoutId: 'lay-menu-board',    name: 'Full Canvas Zone',         x: '0',  y: '0',  width: '100', height: '100', zIndex: 1, playlistId: 'pl-lunch-menu',     backgroundColor: '#000000' },
    // lay-hero-banner
    { id: 'zone-led-hero',    layoutId: 'lay-hero-banner', name: 'LED Video Hero Zone',   x: '0', y: '0', width: '100', height: '100', zIndex: 1, playlistId: 'pl-campus-events', backgroundColor: '#090d16' },
    { id: 'zone-led-overlay', layoutId: 'lay-hero-banner', name: 'Top Ticker Overlay',    x: '5', y: '3', width: '90',  height: '10',  zIndex: 5, playlistId: 'pl-ticker-only',   backgroundColor: '#0f172a' },
  ]).onConflictDoNothing();

  // ─── 4. Media Items ────────────────────────────────────────
  console.log('[seed] Seeding media items...');
  await db.insert(schema.mediaItems).values([
    { id: 'med-001', title: 'Enterprise Welcome Showcase 2026', type: 'video',        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',    duration: 30, sizeMb: '45.2', tags: ['corporate','brand','lobby'],     thumbnailUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80' },
    { id: 'med-002', title: 'Q1 All-Hands Townhall Highlights',  type: 'video',        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', duration: 45, sizeMb: '68.5', tags: ['executive','keynote'],           thumbnailUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80' },
    { id: 'med-003', title: 'Sustainability & Green Campus Poster',type: 'image',       url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1600&q=80', duration: 15, sizeMb: '4.1', tags: ['sustainability','poster'],    thumbnailUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=80' },
    { id: 'med-004', title: 'Daily Gourmet Dining Specials Menu', type: 'image',       url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80', duration: 20, sizeMb: '5.8', tags: ['dining','cafeteria','menu'],  thumbnailUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80' },
    { id: 'med-005', title: 'Live Stock & Campus News Ticker',    type: 'ticker',      url: '', duration: 60, sizeMb: '0.1', tags: ['ticker','news','finance'],    thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80', tickerText: '🚀 Global Tech Index +2.4% | Q1 Revenue exceeds targets | Campus Hackathon open | Welcome International Delegation', tickerSpeed: 35 },
    { id: 'med-006', title: 'Global City Weather & Air Quality',  type: 'weather',     url: '', duration: 60, sizeMb: '0.2', tags: ['widget','weather','realtime'], thumbnailUrl: 'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?auto=format&fit=crop&w=400&q=80', weatherCity: 'San Francisco, CA' },
    { id: 'med-007', title: 'Precision Digital World Clock',      type: 'clock',       url: '', duration: 60, sizeMb: '0.1', tags: ['widget','clock','time'],       thumbnailUrl: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=400&q=80', clockFormat: '24h' },
    { id: 'med-008', title: 'Security & Visitors Policy Notice',  type: 'announcement',url: '', duration: 25, sizeMb: '0.3', tags: ['announcement','security'],    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80', announceHeader: 'VISITOR REGISTRATION NOTICE', announceBody: 'All guests must scan their QR badge at reception desk 1 before entering corporate floors.' },
  ]).onConflictDoNothing();

  // ─── 5. Playlist Items ─────────────────────────────────────
  console.log('[seed] Seeding playlist items...');
  await db.insert(schema.playlistItems).values([
    // pl-corporate-main
    { id: 'pli-1',  playlistId: 'pl-corporate-main',     mediaId: 'med-001', duration: 30, order: 1, transition: 'fade' },
    { id: 'pli-2',  playlistId: 'pl-corporate-main',     mediaId: 'med-003', duration: 15, order: 2, transition: 'slide' },
    { id: 'pli-3',  playlistId: 'pl-corporate-main',     mediaId: 'med-002', duration: 45, order: 3, transition: 'zoom' },
    // pl-lunch-menu
    { id: 'pli-4',  playlistId: 'pl-lunch-menu',         mediaId: 'med-004', duration: 20, order: 1, transition: 'fade' },
    { id: 'pli-5',  playlistId: 'pl-lunch-menu',         mediaId: 'med-008', duration: 25, order: 2, transition: 'fade' },
    // pl-widgets-sidebar
    { id: 'pli-6',  playlistId: 'pl-widgets-sidebar',    mediaId: 'med-006', duration: 60, order: 1, transition: 'none' },
    { id: 'pli-7',  playlistId: 'pl-widgets-sidebar',    mediaId: 'med-007', duration: 60, order: 2, transition: 'none' },
    // pl-ticker-only
    { id: 'pli-8',  playlistId: 'pl-ticker-only',        mediaId: 'med-005', duration: 60, order: 1, transition: 'none' },
    // pl-executive-briefing
    { id: 'pli-9',  playlistId: 'pl-executive-briefing', mediaId: 'med-002', duration: 45, order: 1, transition: 'slide' },
    { id: 'pli-10', playlistId: 'pl-executive-briefing', mediaId: 'med-008', duration: 25, order: 2, transition: 'fade' },
    { id: 'pli-11', playlistId: 'pl-executive-briefing', mediaId: 'med-003', duration: 15, order: 3, transition: 'fade' },
    // pl-campus-events
    { id: 'pli-12', playlistId: 'pl-campus-events',      mediaId: 'med-001', duration: 30, order: 1, transition: 'zoom' },
    { id: 'pli-13', playlistId: 'pl-campus-events',      mediaId: 'med-003', duration: 15, order: 2, transition: 'fade' },
    { id: 'pli-14', playlistId: 'pl-campus-events',      mediaId: 'med-002', duration: 30, order: 3, transition: 'slide' },
  ]).onConflictDoNothing();

  // ─── 6. Screens ────────────────────────────────────────────
  console.log('[seed] Seeding screens...');
  await db.insert(schema.screens).values([
    { id: 'scr-001', pairingCode: 'LOBBY-88', name: 'Main Lobby 4K Display',          group: 'HQ Reception',       location: 'Building A - Ground Floor', orientation: 'landscape', resolution: '3840x2160 (4K)',         status: 'online',   ipAddress: '', macAddress: '', storageUsageMb: 2450, storageTotalMb: 16000, bufferCachedItems: 14, currentLayoutId: 'lay-split-3zone',    currentPlaylistId: 'pl-corporate-main',     volume: 75, isMuted: false, firmwareVersion: 'v4.2.1-prod', uptimeSeconds: 864200, lastScreenshotUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80' },
    { id: 'scr-002', pairingCode: 'CAFE-20',  name: 'Cafeteria Digital Menu Board',   group: 'Dining & Refreshments', location: 'Building B - 2F Dining',   orientation: 'landscape', resolution: '1920x1080 (FHD)',        status: 'online',   ipAddress: '', macAddress: '', storageUsageMb: 1120, storageTotalMb: 8000,  bufferCachedItems: 8,  currentLayoutId: 'lay-menu-board',     currentPlaylistId: 'pl-lunch-menu',         volume: 40, isMuted: false, firmwareVersion: 'v4.2.1-prod', uptimeSeconds: 342100 },
    { id: 'scr-003', pairingCode: 'TOWER-91', name: 'Executive Elevator Portrait',    group: 'Executive Tower',    location: 'Building C - Elevator Bank', orientation: 'portrait',  resolution: '1080x1920 (Portrait)',   status: 'online',   ipAddress: '', macAddress: '', storageUsageMb: 3890, storageTotalMb: 16000, bufferCachedItems: 18, currentLayoutId: 'lay-portrait-kiosk', currentPlaylistId: 'pl-executive-briefing', volume: 0,  isMuted: true,  firmwareVersion: 'v4.2.0-prod', uptimeSeconds: 1205000 },
    { id: 'scr-004', pairingCode: 'QUAD-15',  name: 'Campus Quad Outdoor LED Wall',   group: 'Outdoor Displays',   location: 'Central Courtyard Plaza',   orientation: 'landscape', resolution: '2560x1440 (2K)',         status: 'syncing',  ipAddress: '', macAddress: '', storageUsageMb: 6200, storageTotalMb: 32000, bufferCachedItems: 22, currentLayoutId: 'lay-hero-banner',    currentPlaylistId: 'pl-campus-events',      volume: 90, isMuted: false, firmwareVersion: 'v4.2.1-prod', uptimeSeconds: 432000 },
    { id: 'scr-005', pairingCode: 'CONF-04',  name: 'Innovation Hub Welcome Screen', group: 'R&D Labs',            location: 'Lab 4 - Tech Wing',         orientation: 'landscape', resolution: '1920x1080 (FHD)',        status: 'offline',  ipAddress: '', macAddress: '', storageUsageMb: 850,  storageTotalMb: 8000,  bufferCachedItems: 5,  currentLayoutId: 'lay-split-3zone',    currentPlaylistId: 'pl-corporate-main',     volume: 50, isMuted: false, firmwareVersion: 'v4.1.9-legacy', uptimeSeconds: 0 },
  ]).onConflictDoNothing();

  // ─── 7. Schedules ──────────────────────────────────────────
  console.log('[seed] Seeding schedules...');
  await db.insert(schema.schedules).values([
    { id: 'sch-001', name: 'Lobby Standard Morning & Afternoon', playlistId: 'pl-corporate-main', layoutId: 'lay-split-3zone',    screenGroupIds: ['HQ Reception','R&D Labs'], screenIds: ['scr-001','scr-005'], priority: 50, startDate: '2026-01-01', endDate: '2026-12-31', startTime: '07:00', endTime: '19:00', daysOfWeek: [1,2,3,4,5], isActive: true },
    { id: 'sch-002', name: 'Dining Hall Lunch Hours Menu',       playlistId: 'pl-lunch-menu',     layoutId: 'lay-menu-board',     screenGroupIds: ['Dining & Refreshments'], screenIds: ['scr-002'],            priority: 80, startDate: '2026-01-01', endDate: '2026-12-31', startTime: '11:00', endTime: '15:00', daysOfWeek: [1,2,3,4,5], isActive: true },
    { id: 'sch-003', name: 'Elevator Kiosk All-Day Executive',   playlistId: 'pl-executive-briefing', layoutId: 'lay-portrait-kiosk', screenGroupIds: ['Executive Tower'], screenIds: ['scr-003'],              priority: 50, startDate: '2026-01-01', endDate: '2026-12-31', startTime: '06:00', endTime: '22:00', daysOfWeek: [0,1,2,3,4,5,6], isActive: true },
  ]).onConflictDoNothing();

  // ─── 8. Emergency Alert Templates ─────────────────────────
  console.log('[seed] Seeding emergency alert templates...');
  await db.insert(schema.emergencyAlerts).values([
    { id: 'emg-template-01', title: 'FIRE EVACUATION WARNING',        message: 'PLEASE EVACUATE THE BUILDING IMMEDIATELY. USE STAIRWELLS. DO NOT USE ELEVATORS.', type: 'fire',    severity: 'critical', targetScreenIds: [], isActive: false, triggeredBy: 'Safety Officer Admin' },
    { id: 'emg-template-02', title: 'SEVERE WEATHER SHELTER IN PLACE', message: 'Tornado Warning issued. Move to designated interior storm shelters on lowest floor.', type: 'weather', severity: 'warning',  targetScreenIds: [], isActive: false, triggeredBy: 'Facilities Ops' },
  ]).onConflictDoNothing();

  // ─── 9. Default Users (Admin accounts) ────────────────────
  console.log('[seed] Seeding default users...');
  const bcrypt = await import('bcryptjs');
  const adminPasswordHash = await bcrypt.hash('Admin@2026!', 12);
  const staffPasswordHash = await bcrypt.hash('Staff@2026!', 12);

  await db.insert(schema.users).values([
    {
      id: 'usr-super-admin',
      email: 'admin@signage.local',
      passwordHash: adminPasswordHash,
      displayName: 'Super Administrator',
      role: 'super_admin',
      isActive: true,
    },
    {
      id: 'usr-staff-01',
      email: 'staff@signage.local',
      passwordHash: staffPasswordHash,
      displayName: 'Staff User',
      role: 'staff',
      isActive: true,
    },
    {
      id: 'usr-viewer-01',
      email: 'viewer@signage.local',
      passwordHash: await bcrypt.hash('Viewer@2026!', 12),
      displayName: 'Read-Only Viewer',
      role: 'viewer',
      isActive: true,
    },
  ]).onConflictDoNothing();

  console.log('[seed] ✅ Seed completed successfully!');
  console.log('[seed] Summary:');
  console.log('  • 6 playlists');
  console.log('  • 4 layouts + 9 zones');
  console.log('  • 8 media items');
  console.log('  • 14 playlist items');
  console.log('  • 5 screens');
  console.log('  • 3 schedules');
  console.log('  • 2 emergency templates');
  console.log('  • 3 users (admin/staff/viewer)');
  console.log('');
  console.log('[seed] 🔐 Default Credentials:');
  console.log('  admin@signage.local  / Admin@2026!  (super_admin)');
  console.log('  staff@signage.local  / Staff@2026!  (staff)');
  console.log('  viewer@signage.local / Viewer@2026! (viewer)');
}

seed()
  .catch((err) => {
    console.error('[seed] ❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => pool.end());
