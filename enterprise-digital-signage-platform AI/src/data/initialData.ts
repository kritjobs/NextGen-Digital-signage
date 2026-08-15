import { DigitalScreen, LayoutTemplate, MediaItem, Playlist, ScheduleItem, EmergencyAlert, TelemetryLog, ProofOfPlayLog } from '../types/signage';

export const INITIAL_SCREENS: DigitalScreen[] = [
  {
    id: 'scr-001',
    pairingCode: 'LOBBY-88',
    name: 'Main Lobby 4K Display',
    group: 'HQ Reception',
    location: 'Building A - Ground Floor Entrance',
    orientation: 'landscape',
    resolution: '3840x2160 (4K)',
    status: 'online',
    lastHeartbeat: new Date().toISOString(),
    ipAddress: '192.168.1.101',
    macAddress: '00:1B:44:11:3A:B7',
    storageUsageMb: 2450,
    storageTotalMb: 16000,
    bufferCachedItemsCount: 14,
    currentLayoutId: 'lay-split-3zone',
    currentPlaylistId: 'pl-corporate-main',
    volume: 75,
    isMuted: false,
    firmwareVersion: 'v4.2.1-prod',
    uptimeSeconds: 864200,
    lastScreenshotUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'scr-002',
    pairingCode: 'CAFE-20',
    name: 'Cafeteria Digital Menu Board',
    group: 'Dining & Refreshments',
    location: 'Building B - 2nd Floor Dining Hall',
    orientation: 'landscape',
    resolution: '1920x1080 (FHD)',
    status: 'online',
    lastHeartbeat: new Date().toISOString(),
    ipAddress: '192.168.1.102',
    macAddress: '00:1B:44:11:3B:C9',
    storageUsageMb: 1120,
    storageTotalMb: 8000,
    bufferCachedItemsCount: 8,
    currentLayoutId: 'lay-menu-board',
    currentPlaylistId: 'pl-lunch-menu',
    volume: 40,
    isMuted: false,
    firmwareVersion: 'v4.2.1-prod',
    uptimeSeconds: 342100,
    lastScreenshotUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'scr-003',
    pairingCode: 'TOWER-91',
    name: 'Executive Elevator Portrait Kiosk',
    group: 'Executive Tower',
    location: 'Building C - Elevator Bank',
    orientation: 'portrait',
    resolution: '1080x1920 (Portrait)',
    status: 'online',
    lastHeartbeat: new Date().toISOString(),
    ipAddress: '192.168.2.45',
    macAddress: '00:1B:44:22:9C:F1',
    storageUsageMb: 3890,
    storageTotalMb: 16000,
    bufferCachedItemsCount: 18,
    currentLayoutId: 'lay-portrait-kiosk',
    currentPlaylistId: 'pl-executive-briefing',
    volume: 0,
    isMuted: true,
    firmwareVersion: 'v4.2.0-prod',
    uptimeSeconds: 1205000,
    lastScreenshotUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'scr-004',
    pairingCode: 'QUAD-15',
    name: 'Campus Quad Outdoor LED Wall',
    group: 'Outdoor Displays',
    location: 'Central Courtyard Plaza',
    orientation: 'landscape',
    resolution: '2560x1440 (2K)',
    status: 'syncing',
    lastHeartbeat: new Date(Date.now() - 15000).toISOString(),
    ipAddress: '192.168.3.12',
    macAddress: '00:1B:44:88:DF:4A',
    storageUsageMb: 6200,
    storageTotalMb: 32000,
    bufferCachedItemsCount: 22,
    currentLayoutId: 'lay-hero-banner',
    currentPlaylistId: 'pl-campus-events',
    volume: 90,
    isMuted: false,
    firmwareVersion: 'v4.2.1-prod',
    uptimeSeconds: 432000,
    lastScreenshotUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'scr-005',
    pairingCode: 'CONF-04',
    name: 'Innovation Hub Welcome Screen',
    group: 'R&D Labs',
    location: 'Lab 4 - Tech Wing',
    orientation: 'landscape',
    resolution: '1920x1080 (FHD)',
    status: 'offline',
    lastHeartbeat: new Date(Date.now() - 3600000).toISOString(),
    ipAddress: '192.168.1.188',
    macAddress: '00:1B:44:55:12:88',
    storageUsageMb: 850,
    storageTotalMb: 8000,
    bufferCachedItemsCount: 5,
    currentLayoutId: 'lay-split-3zone',
    currentPlaylistId: 'pl-corporate-main',
    volume: 50,
    isMuted: false,
    firmwareVersion: 'v4.1.9-legacy',
    uptimeSeconds: 0,
    lastScreenshotUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'
  }
];

export const INITIAL_MEDIA_ITEMS: MediaItem[] = [
  {
    id: 'med-001',
    title: 'Enterprise Welcome Showcase 2026',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: 30,
    sizeMb: 45.2,
    tags: ['corporate', 'brand', 'lobby', 'video'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
    createdAt: '2026-01-10T10:00:00Z'
  },
  {
    id: 'med-002',
    title: 'Q1 All-Hands Townhall Keynote Highlights',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: 45,
    sizeMb: 68.5,
    tags: ['executive', 'keynote', 'townhall'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80',
    createdAt: '2026-01-15T14:30:00Z'
  },
  {
    id: 'med-003',
    title: 'Sustainability & Green Campus Poster',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1600&q=80',
    duration: 15,
    sizeMb: 4.1,
    tags: ['sustainability', 'poster', 'eco'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=80',
    createdAt: '2026-02-01T09:12:00Z'
  },
  {
    id: 'med-004',
    title: 'Daily Gourmet Dining Specials Menu',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80',
    duration: 20,
    sizeMb: 5.8,
    tags: ['dining', 'cafeteria', 'menu'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
    createdAt: '2026-02-02T11:00:00Z'
  },
  {
    id: 'med-005',
    title: 'Live Stock & Global Tech News Ticker',
    type: 'ticker',
    url: '',
    duration: 60,
    sizeMb: 0.1,
    tags: ['ticker', 'rss', 'finance', 'news'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80',
    contentData: {
      tickerText: '🚀 Global Tech Index +2.4% | Q1 Revenue exceeds targets by 18% | Campus Hackathon registration open until Friday | Welcome International Delegation to Building A | Free Health Wellness Screening in Hub B tomorrow',
      speed: 35
    },
    createdAt: '2026-02-03T08:00:00Z'
  },
  {
    id: 'med-006',
    title: 'Global City Live Weather & Air Quality Widget',
    type: 'weather',
    url: '',
    duration: 60,
    sizeMb: 0.2,
    tags: ['widget', 'weather', 'realtime'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?auto=format&fit=crop&w=400&q=80',
    contentData: {
      weatherCity: 'San Francisco, CA'
    },
    createdAt: '2026-02-03T08:00:00Z'
  },
  {
    id: 'med-007',
    title: 'Precision Digital World Clock & Calendar',
    type: 'clock',
    url: '',
    duration: 60,
    sizeMb: 0.1,
    tags: ['widget', 'clock', 'time'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=400&q=80',
    contentData: {
      clockFormat: '24h'
    },
    createdAt: '2026-02-03T08:00:00Z'
  },
  {
    id: 'med-008',
    title: 'Important Security & Visitors Policy Announcement',
    type: 'announcement',
    url: '',
    duration: 25,
    sizeMb: 0.3,
    tags: ['announcement', 'security', 'alert'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80',
    contentData: {
      announcementHeader: 'VISITOR REGISTRATION NOTICE',
      announcementBody: 'All guests and visiting contractors must scan their QR badge at reception desk 1 before entering corporate floors.'
    },
    createdAt: '2026-02-04T12:00:00Z'
  }
];

export const INITIAL_LAYOUTS: LayoutTemplate[] = [
  {
    id: 'lay-split-3zone',
    name: 'Enterprise 3-Zone Landscape (Lobby Standard)',
    description: 'Main video broadcast on left (70%), side information panel on top right (30%), full-width ticker across the bottom.',
    orientation: 'landscape',
    aspectRatio: '16:9',
    widthPx: 1920,
    heightPx: 1080,
    zones: [
      {
        id: 'zone-main',
        name: 'Main Video Broadcast Zone',
        x: 0,
        y: 0,
        width: 70,
        height: 88,
        zIndex: 1,
        playlistId: 'pl-corporate-main',
        backgroundColor: '#0f172a'
      },
      {
        id: 'zone-side',
        name: 'Weather & Clock Sidebar Zone',
        x: 70,
        y: 0,
        width: 30,
        height: 88,
        zIndex: 2,
        playlistId: 'pl-widgets-sidebar',
        backgroundColor: '#1e293b'
      },
      {
        id: 'zone-bottom',
        name: 'Bottom News Ticker Zone',
        x: 0,
        y: 88,
        width: 100,
        height: 12,
        zIndex: 3,
        playlistId: 'pl-ticker-only',
        backgroundColor: '#0284c7'
      }
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z'
  },
  {
    id: 'lay-portrait-kiosk',
    name: 'Portrait Elevator Kiosk (9:16)',
    description: 'Vertical 3-tier layout: Top Clock/Weather header (20%), Center Media Carousel (60%), Bottom News Ticker (20%).',
    orientation: 'portrait',
    aspectRatio: '9:16',
    widthPx: 1080,
    heightPx: 1920,
    zones: [
      {
        id: 'pzone-top',
        name: 'Top Header Zone',
        x: 0,
        y: 0,
        width: 100,
        height: 20,
        zIndex: 1,
        playlistId: 'pl-widgets-sidebar',
        backgroundColor: '#0f172a'
      },
      {
        id: 'pzone-center',
        name: 'Main Carousel Zone',
        x: 0,
        y: 20,
        width: 100,
        height: 65,
        zIndex: 2,
        playlistId: 'pl-executive-briefing',
        backgroundColor: '#111827'
      },
      {
        id: 'pzone-bottom',
        name: 'Bottom Announcement Zone',
        x: 0,
        y: 85,
        width: 100,
        height: 15,
        zIndex: 3,
        playlistId: 'pl-ticker-only',
        backgroundColor: '#1e1b4b'
      }
    ],
    createdAt: '2026-01-05T00:00:00Z',
    updatedAt: '2026-02-02T00:00:00Z'
  },
  {
    id: 'lay-menu-board',
    name: 'Full Screen Menu Board (16:9)',
    description: 'Single full-bleed canvas zone optimized for dining, cafeteria, or high-impact posters.',
    orientation: 'landscape',
    aspectRatio: '16:9',
    widthPx: 1920,
    heightPx: 1080,
    zones: [
      {
        id: 'zone-full',
        name: 'Full Canvas Zone',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        zIndex: 1,
        playlistId: 'pl-lunch-menu',
        backgroundColor: '#000000'
      }
    ],
    createdAt: '2026-01-12T00:00:00Z',
    updatedAt: '2026-01-12T00:00:00Z'
  },
  {
    id: 'lay-hero-banner',
    name: 'Outdoor LED Hero Wall',
    description: 'Ultra high-definition main zone with live announcement banner overlay at top.',
    orientation: 'landscape',
    aspectRatio: '16:9',
    widthPx: 2560,
    heightPx: 1440,
    zones: [
      {
        id: 'zone-led-hero',
        name: 'LED Video Hero Zone',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        zIndex: 1,
        playlistId: 'pl-campus-events',
        backgroundColor: '#090d16'
      },
      {
        id: 'zone-led-overlay',
        name: 'Top Ticker Overlay Zone',
        x: 5,
        y: 3,
        width: 90,
        height: 10,
        zIndex: 5,
        playlistId: 'pl-ticker-only',
        backgroundColor: 'rgba(15, 23, 42, 0.85)'
      }
    ],
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-02-03T00:00:00Z'
  }
];

export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-corporate-main',
    name: 'Corporate Main Lobby Sequence',
    description: 'High-definition video showcase and corporate posters for reception areas.',
    totalDuration: 90,
    tags: ['lobby', 'corporate', 'welcome'],
    updatedAt: '2026-02-01T10:00:00Z',
    items: [
      { id: 'pli-1', mediaId: 'med-001', duration: 30, order: 1, transition: 'fade' },
      { id: 'pli-2', mediaId: 'med-003', duration: 15, order: 2, transition: 'slide' },
      { id: 'pli-3', mediaId: 'med-002', duration: 45, order: 3, transition: 'zoom' }
    ]
  },
  {
    id: 'pl-lunch-menu',
    name: 'Cafeteria Lunch Specials',
    description: 'Gourmet specials and daily dining announcements.',
    totalDuration: 45,
    tags: ['cafeteria', 'menu'],
    updatedAt: '2026-02-02T11:00:00Z',
    items: [
      { id: 'pli-4', mediaId: 'med-004', duration: 20, order: 1, transition: 'fade' },
      { id: 'pli-5', mediaId: 'med-008', duration: 25, order: 2, transition: 'fade' }
    ]
  },
  {
    id: 'pl-widgets-sidebar',
    name: 'Live Weather & World Clock Widget Reel',
    description: 'Continuously updated time, local weather forecast, and air quality.',
    totalDuration: 120,
    tags: ['widgets', 'weather', 'clock'],
    updatedAt: '2026-02-03T08:00:00Z',
    items: [
      { id: 'pli-6', mediaId: 'med-006', duration: 60, order: 1, transition: 'none' },
      { id: 'pli-7', mediaId: 'med-007', duration: 60, order: 2, transition: 'none' }
    ]
  },
  {
    id: 'pl-ticker-only',
    name: 'Realtime Stock & Campus RSS News Ticker',
    description: 'Bottom scrolling live text news ticker.',
    totalDuration: 60,
    tags: ['ticker', 'news'],
    updatedAt: '2026-02-03T08:00:00Z',
    items: [
      { id: 'pli-8', mediaId: 'med-005', duration: 60, order: 1, transition: 'none' }
    ]
  },
  {
    id: 'pl-executive-briefing',
    name: 'Executive Elevator Reel',
    description: 'Portrait format high priority executive keynotes and corporate policies.',
    totalDuration: 85,
    tags: ['portrait', 'executive'],
    updatedAt: '2026-02-04T09:00:00Z',
    items: [
      { id: 'pli-9', mediaId: 'med-002', duration: 45, order: 1, transition: 'slide' },
      { id: 'pli-10', mediaId: 'med-008', duration: 25, order: 2, transition: 'fade' },
      { id: 'pli-11', mediaId: 'med-003', duration: 15, order: 3, transition: 'fade' }
    ]
  },
  {
    id: 'pl-campus-events',
    name: 'Campus Events & Outdoor Showcase',
    description: 'Full high-brightness quad wall sequence.',
    totalDuration: 75,
    tags: ['campus', 'outdoor'],
    updatedAt: '2026-02-03T12:00:00Z',
    items: [
      { id: 'pli-12', mediaId: 'med-001', duration: 30, order: 1, transition: 'zoom' },
      { id: 'pli-13', mediaId: 'med-003', duration: 15, order: 2, transition: 'fade' },
      { id: 'pli-14', mediaId: 'med-002', duration: 30, order: 3, transition: 'slide' }
    ]
  }
];

export const INITIAL_SCHEDULES: ScheduleItem[] = [
  {
    id: 'sch-001',
    name: 'Lobby Standard Morning & Afternoon Broadcast',
    playlistId: 'pl-corporate-main',
    layoutId: 'lay-split-3zone',
    screenGroupIds: ['HQ Reception', 'R&D Labs'],
    screenIds: ['scr-001', 'scr-005'],
    priority: 50,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    startTime: '07:00',
    endTime: '19:00',
    daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    isActive: true
  },
  {
    id: 'sch-002',
    name: 'Dining Hall Lunch Hours Menu Switch',
    playlistId: 'pl-lunch-menu',
    layoutId: 'lay-menu-board',
    screenGroupIds: ['Dining & Refreshments'],
    screenIds: ['scr-002'],
    priority: 80, // Higher priority during lunch time
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    startTime: '11:00',
    endTime: '15:00',
    daysOfWeek: [1, 2, 3, 4, 5],
    isActive: true
  },
  {
    id: 'sch-003',
    name: 'Elevator Kiosk All-Day Executive Info',
    playlistId: 'pl-executive-briefing',
    layoutId: 'lay-portrait-kiosk',
    screenGroupIds: ['Executive Tower'],
    screenIds: ['scr-003'],
    priority: 50,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    startTime: '06:00',
    endTime: '22:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    isActive: true
  }
];

export const INITIAL_EMERGENCY_ALERTS: EmergencyAlert[] = [
  {
    id: 'emg-template-01',
    title: 'FIRE EVACUATION WARNING',
    message: 'PLEASE EVACUATE THE BUILDING IMMEDIATELY. USE STAIRWELLS. DO NOT USE ELEVATORS.',
    type: 'fire',
    severity: 'critical',
    targetScreenIds: [], // All screens
    active: false,
    triggeredAt: '',
    triggeredBy: 'Safety Officer Admin'
  },
  {
    id: 'emg-template-02',
    title: 'SEVERE WEATHER SHELTER IN PLACE',
    message: 'Tornado Warning issued for county. Move to designated interior storm shelters on lowest floor.',
    type: 'weather',
    severity: 'warning',
    targetScreenIds: [],
    active: false,
    triggeredAt: '',
    triggeredBy: 'Facilities Ops'
  }
];

export const INITIAL_TELEMETRY_LOGS: TelemetryLog[] = [
  {
    id: 'log-001',
    screenId: 'scr-001',
    screenName: 'Main Lobby 4K Display',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    eventType: 'heartbeat',
    message: 'Heartbeat OK. Storage: 15.3% used. Temperature: 38°C'
  },
  {
    id: 'log-002',
    screenId: 'scr-001',
    screenName: 'Main Lobby 4K Display',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    eventType: 'buffer_cached',
    message: 'Pre-fetched and buffered 3 media assets for upcoming playlist pl-corporate-main (158 MB)'
  },
  {
    id: 'log-003',
    screenId: 'scr-002',
    screenName: 'Cafeteria Digital Menu Board',
    timestamp: new Date(Date.now() - 450000).toISOString(),
    eventType: 'media_played',
    message: 'Completed playback of "Daily Gourmet Dining Specials Menu" (20s)'
  },
  {
    id: 'log-004',
    screenId: 'scr-004',
    screenName: 'Campus Quad Outdoor LED Wall',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    eventType: 'command_exec',
    message: 'Received real-time WebSocket command: REBOOT_PLAYER. Success.'
  }
];

export const INITIAL_PROOF_OF_PLAY: ProofOfPlayLog[] = [
  {
    id: 'pop-101',
    screenId: 'scr-001',
    screenName: 'Main Lobby 4K Display',
    mediaId: 'med-001',
    mediaTitle: 'Enterprise Welcome Showcase 2026',
    playedAt: new Date(Date.now() - 180000).toISOString(),
    durationSeconds: 30,
    status: 'completed'
  },
  {
    id: 'pop-102',
    screenId: 'scr-001',
    screenName: 'Main Lobby 4K Display',
    mediaId: 'med-003',
    mediaTitle: 'Sustainability & Green Campus Poster',
    playedAt: new Date(Date.now() - 150000).toISOString(),
    durationSeconds: 15,
    status: 'completed'
  },
  {
    id: 'pop-103',
    screenId: 'scr-002',
    screenName: 'Cafeteria Digital Menu Board',
    mediaId: 'med-004',
    mediaTitle: 'Daily Gourmet Dining Specials Menu',
    playedAt: new Date(Date.now() - 90000).toISOString(),
    durationSeconds: 20,
    status: 'completed'
  }
];
